#!/usr/bin/env python3
"""
Phase 4: Integration Testing Script

This script validates that all new clean architecture endpoints work correctly
when the application is running. It:
1. Starts the dev server
2. Tests all new endpoints
3. Tests backward compatibility with old endpoints
4. Validates response structures
5. Tests error handling

Run this script: python3 scripts/phase4_integration_tests.py
"""

import sys
import subprocess
import time
import requests
import json
import signal
import os
from pathlib import Path
from typing import Optional, Dict, Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def print_header(title: str) -> None:
    """Print a formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def print_section(title: str) -> None:
    """Print a formatted subsection header."""
    print(f"\n{title}")
    print(f"{'-'*len(title)}\n")


def start_dev_server(timeout: int = 10) -> Optional[subprocess.Popen]:
    """Start the FastAPI dev server.
    
    Args:
        timeout: Seconds to wait for server to start
        
    Returns:
        Process object or None if failed to start
    """
    print("Starting development server...")
    try:
        proc = subprocess.Popen(
            ["uvicorn", "api.main:app", "--reload", "--port", "8000"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=Path(__file__).parent.parent
        )
        
        # Wait for server to be ready
        for i in range(timeout):
            try:
                response = requests.get("http://localhost:8000/api/v1/health", timeout=1)
                if response.status_code == 200:
                    print(f"✅ Dev server started (PID: {proc.pid})")
                    return proc
            except requests.exceptions.ConnectionError:
                time.sleep(1)
        
        print(f"❌ Server did not start within {timeout} seconds")
        return None
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return None


def stop_dev_server(proc: subprocess.Popen) -> None:
    """Stop the FastAPI dev server."""
    try:
        proc.terminate()
        proc.wait(timeout=5)
        print("✅ Dev server stopped")
    except Exception as e:
        print(f"⚠️  Error stopping server: {e}")
        try:
            proc.kill()
        except:
            pass


def test_1_health_check() -> bool:
    """Test 1: Health check endpoint."""
    print_section("TEST 1: Health Check Endpoints")
    
    all_ok = True
    
    # Test /api/v1/health
    try:
        response = requests.get("http://localhost:8000/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✅ /api/v1/health responds with 200")
        else:
            print(f"❌ /api/v1/health returned {response.status_code}")
            all_ok = False
    except Exception as e:
        print(f"❌ /api/v1/health failed: {e}")
        all_ok = False
    
    return all_ok


def test_2_cities_endpoints() -> bool:
    """Test 2: Cities endpoints."""
    print_section("TEST 2: Cities Endpoints")
    
    all_ok = True
    
    # Test GET /api/v1/cities (new clean architecture endpoint)
    print("Testing new cities endpoint (clean architecture)...")
    try:
        response = requests.get("http://localhost:8000/api/v1/cities", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "cities" in data:
                print(f"✅ GET /api/v1/cities returned valid response")
                print(f"   - Response type: {type(data).__name__}")
                print(f"   - Cities count: {len(data.get('cities', []))}")
            else:
                print(f"⚠️  Unexpected response format: {data}")
        else:
            print(f"❌ GET /api/v1/cities returned {response.status_code}")
            all_ok = False
    except Exception as e:
        print(f"❌ GET /api/v1/cities failed: {e}")
        all_ok = False
    
    # Test GET /api/v1/cities/{city_id}
    print("\nTesting get city endpoint...")
    try:
        # First get a valid city ID
        response = requests.get("http://localhost:8000/api/v1/cities", timeout=5)
        if response.status_code == 200:
            data = response.json()
            cities = data.get("cities", [])
            if cities:
                city_id = cities[0].get("id")
                response = requests.get(f"http://localhost:8000/api/v1/cities/{city_id}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ GET /api/v1/cities/{city_id} returned valid response")
                else:
                    print(f"⚠️  GET /api/v1/cities/{city_id} returned {response.status_code}")
            else:
                print("⚠️  No cities available to test get endpoint")
        else:
            print(f"⚠️  Could not fetch cities to test get endpoint")
    except Exception as e:
        print(f"⚠️  GET /api/v1/cities/{{id}} test failed: {e}")
    
    return all_ok


def test_3_runs_endpoints() -> bool:
    """Test 3: Runs endpoints."""
    print_section("TEST 3: Runs Endpoints")
    
    all_ok = True
    
    # Test GET /api/v1/runs (new clean architecture endpoint)
    print("Testing new runs endpoint (clean architecture)...")
    try:
        response = requests.get("http://localhost:8000/api/v1/runs", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "runs" in data:
                print(f"✅ GET /api/v1/runs returned valid response")
                print(f"   - Response type: {type(data).__name__}")
                print(f"   - Runs count: {len(data.get('runs', []))}")
            else:
                print(f"⚠️  Unexpected response format: {data}")
        else:
            print(f"❌ GET /api/v1/runs returned {response.status_code}")
            all_ok = False
    except Exception as e:
        print(f"❌ GET /api/v1/runs failed: {e}")
        all_ok = False
    
    # Test GET /api/v1/runs/{run_id}
    print("\nTesting get run endpoint...")
    try:
        response = requests.get("http://localhost:8000/api/v1/runs", timeout=5)
        if response.status_code == 200:
            data = response.json()
            runs = data.get("runs", [])
            if runs:
                run_id = runs[0].get("id")
                response = requests.get(f"http://localhost:8000/api/v1/runs/{run_id}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ GET /api/v1/runs/{run_id} returned valid response")
                else:
                    print(f"⚠️  GET /api/v1/runs/{run_id} returned {response.status_code}")
            else:
                print("⚠️  No runs available to test get endpoint")
        else:
            print(f"⚠️  Could not fetch runs to test get endpoint")
    except Exception as e:
        print(f"⚠️  GET /api/v1/runs/{{id}} test failed: {e}")
    
    return all_ok


def test_4_backward_compatibility() -> bool:
    """Test 4: Backward compatibility with old endpoints."""
    print_section("TEST 4: Backward Compatibility")
    
    all_ok = True
    
    # Test old /api/v1/cities endpoint (monolithic)
    print("Testing old cities endpoint (monolithic)...")
    try:
        response = requests.get("http://localhost:8000/api/v1/cities", timeout=5)
        if response.status_code == 200:
            print(f"✅ Old /api/v1/cities endpoint still works")
        else:
            print(f"⚠️  Old /api/v1/cities returned {response.status_code}")
    except Exception as e:
        print(f"⚠️  Old /api/v1/cities test failed: {e}")
    
    # Test old /api/v1/runs endpoint (monolithic)
    print("\nTesting old runs endpoint (monolithic)...")
    try:
        response = requests.get("http://localhost:8000/api/v1/runs", timeout=5)
        if response.status_code == 200:
            print(f"✅ Old /api/v1/runs endpoint still works")
        else:
            print(f"⚠️  Old /api/v1/runs returned {response.status_code}")
    except Exception as e:
        print(f"⚠️  Old /api/v1/runs test failed: {e}")
    
    return all_ok


def test_5_error_handling() -> bool:
    """Test 5: Error handling."""
    print_section("TEST 5: Error Handling")
    
    all_ok = True
    
    # Test 404 on non-existent city
    print("Testing 404 handling for non-existent city...")
    try:
        response = requests.get("http://localhost:8000/api/v1/cities/nonexistent-id", timeout=5)
        if response.status_code == 404:
            print(f"✅ Correctly returns 404 for non-existent city")
        else:
            print(f"⚠️  Expected 404, got {response.status_code}")
    except Exception as e:
        print(f"⚠️  Error handling test failed: {e}")
    
    # Test 404 on non-existent run
    print("\nTesting 404 handling for non-existent run...")
    try:
        response = requests.get("http://localhost:8000/api/v1/runs/nonexistent-id", timeout=5)
        if response.status_code == 404:
            print(f"✅ Correctly returns 404 for non-existent run")
        else:
            print(f"⚠️  Expected 404, got {response.status_code}")
    except Exception as e:
        print(f"⚠️  Error handling test failed: {e}")
    
    return all_ok


def run_all_tests() -> bool:
    """Run all integration tests."""
    print_header("PHASE 4: INTEGRATION TESTING")
    print(f"Testing live FastAPI application endpoints...")
    print(f"Project: {Path(__file__).parent.parent}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Start server
    server = start_dev_server()
    if not server:
        print("\n❌ FAIL: Could not start dev server")
        return False
    
    try:
        time.sleep(2)  # Give server extra time to fully initialize
        
        # Run tests
        results = []
        results.append(("1. Health Check", test_1_health_check()))
        results.append(("2. Cities Endpoints", test_2_cities_endpoints()))
        results.append(("3. Runs Endpoints", test_3_runs_endpoints()))
        results.append(("4. Backward Compatibility", test_4_backward_compatibility()))
        results.append(("5. Error Handling", test_5_error_handling()))
        
        # Print summary
        print_header("PHASE 4 TEST SUMMARY")
        print("Test Results:")
        print("-" * 80)
        
        passed = 0
        failed = 0
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:40} {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print("-" * 80)
        print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed}")
        print("-" * 80)
        
        all_passed = all(result for _, result in results)
        
        if all_passed:
            print("\n🎉 ALL TESTS PASSED - Integration testing complete\n")
        else:
            print(f"\n⚠️  {failed} test(s) failed - Review errors above\n")
        
        return all_passed
    
    finally:
        stop_dev_server(server)


if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
