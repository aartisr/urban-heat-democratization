from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Callable
from uuid import uuid4


class DurableRunQueue:
    def __init__(self, db_path: Path, processor: Callable[[dict[str, object]], None], *, poll_interval_sec: float = 1.0) -> None:
        self._db_path = db_path
        self._processor = processor
        self._poll_interval_sec = max(0.2, poll_interval_sec)
        self._stop_event = threading.Event()
        self._worker: threading.Thread | None = None
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS runtime_run_jobs (
                    id TEXT PRIMARY KEY,
                    job_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    last_error TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

    def enqueue(self, *, job_type: str, payload: dict[str, object], created_at: str) -> str:
        job_id = f"job-{uuid4().hex[:16]}"
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO runtime_run_jobs (id, job_type, payload, status, attempts, last_error, created_at, updated_at)
                VALUES (?, ?, ?, 'queued', 0, NULL, ?, ?)
                """,
                (job_id, job_type, json.dumps(payload), created_at, created_at),
            )
        return job_id

    def start(self) -> None:
        if self._worker and self._worker.is_alive():
            return
        self._stop_event.clear()
        self._worker = threading.Thread(target=self._run_loop, name="uhd-run-queue-worker", daemon=True)
        self._worker.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._worker and self._worker.is_alive():
            self._worker.join(timeout=2.0)

    def _claim_next_job(self) -> dict[str, object] | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, job_type, payload, attempts
                FROM runtime_run_jobs
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 1
                """
            ).fetchone()
            if row is None:
                return None

            connection.execute(
                """
                UPDATE runtime_run_jobs
                SET status = 'processing', attempts = attempts + 1, updated_at = ?
                WHERE id = ?
                """,
                (time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()), str(row["id"])),
            )
            payload = json.loads(str(row["payload"]))
            return {
                "id": str(row["id"]),
                "jobType": str(row["job_type"]),
                "payload": payload if isinstance(payload, dict) else {},
            }

    def _mark_success(self, job_id: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE runtime_run_jobs
                SET status = 'succeeded', updated_at = ?
                WHERE id = ?
                """,
                (time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()), job_id),
            )

    def _mark_failed(self, job_id: str, error: str) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE runtime_run_jobs
                SET status = 'failed', last_error = ?, updated_at = ?
                WHERE id = ?
                """,
                (error[:800], time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()), job_id),
            )

    def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            job = self._claim_next_job()
            if job is None:
                self._stop_event.wait(self._poll_interval_sec)
                continue

            job_id = str(job["id"])
            payload = job.get("payload")
            try:
                if not isinstance(payload, dict):
                    raise ValueError("Queue payload must be an object")
                self._processor(payload)
            except Exception as exc:  # noqa: BLE001
                self._mark_failed(job_id, str(exc))
            else:
                self._mark_success(job_id)
