import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clearApiAccess, configureApiAccess, getApiAccessSnapshot, getAuthSession, listWorkspaces } from "../lib/api";

export function AccessWorkspaceSwitcher() {
  const queryClient = useQueryClient();
  const snapshot = getApiAccessSnapshot();
  const [apiKey, setApiKey] = useState(snapshot.apiKey);
  const [workspaceId, setWorkspaceId] = useState(snapshot.workspaceId || "default");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const authSessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: getAuthSession,
    retry: false,
  });
  const workspacesQuery = useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      configureApiAccess({
        apiKey: apiKey.trim() || null,
        workspaceId: workspaceId.trim() || "default",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-session"] }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["cities"] }),
        queryClient.invalidateQueries({ queryKey: ["runs"] }),
      ]);
    },
    onSuccess: () => {
      setStatusMessage("Access context updated.");
    },
    onError: () => {
      setStatusMessage("Access update failed. Check key/workspace values.");
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      clearApiAccess();
      setApiKey("");
      setWorkspaceId("default");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-session"] }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      ]);
    },
    onSuccess: () => {
      setStatusMessage("Access context cleared.");
    },
  });

  return (
    <details className="access-switcher">
      <div className="access-switcher-head">
        <summary>Workspace access</summary>
        <span>{authSessionQuery.data?.displayName ?? "Guest"}</span>
      </div>
      <div className="access-switcher-content">
        <label>
          API key
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="demo-admin" spellCheck={false} />
        </label>
        <label>
          Workspace
          <input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} placeholder="default" spellCheck={false} />
        </label>
        <div className="access-switcher-actions">
          <button type="button" className="button-link secondary" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>{applyMutation.isPending ? "Applying..." : "Apply"}</button>
          <button type="button" className="button-link secondary" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>{clearMutation.isPending ? "Clearing..." : "Clear"}</button>
        </div>
        <div className="access-switcher-meta">
          <span>Auth {authSessionQuery.data?.authEnforced ? "enforced" : "optional"}</span>
          <span>Role {authSessionQuery.data?.memberships.find((entry) => entry.id === (workspaceId || "default"))?.role ?? "n/a"}</span>
        </div>
        {workspacesQuery.data?.length ? (
          <div className="access-switcher-workspaces">
            {workspacesQuery.data.map((workspace) => <span key={workspace.id} className="premium-badge">{workspace.id}: {workspace.role}</span>)}
          </div>
        ) : null}
        {statusMessage ? <p className="muted access-switcher-status">{statusMessage}</p> : null}
      </div>
    </details>
  );
}
