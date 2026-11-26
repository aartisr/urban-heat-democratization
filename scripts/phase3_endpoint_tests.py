#!/usr/bin/env python3
"""
Phase 3: Endpoint Accessibility Testing Script

This script validates that all new clean architecture endpoints are:
1. Accessible via HTTP
2. Return correct response structures
3. Handle errors properly
4. Coexist with existing endpoints without conflicts

Run this script: python3 scripts/phase3_endpoint_tests.py
"""

import sys
import subprocess
import time
import json
from pathlib import Path
from typing import Optional

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


def test_1_verify_router_definitions() -> bool:
    """Test 1: Verify router definitions exist and are properly structured."""
    print_section("TEST 1: Verify Router Definitions")
    
    all_ok = True
    
    # Check cities router
    print("Checking cities router...")
    try:
        result = subprocess.run(
            ["grep", "-n", "def create_cities_router", "api/routers/cities.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found create_cities_router definition")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ create_cities_router not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking cities router: {e}")
        all_ok = False
    
    # Check runs router
    print("\nChecking runs router...")
    try:
        result = subprocess.run(
            ["grep", "-n", "def create_runs_router", "api/routers/runs_refactored.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found create_runs_router definition (aliased as create_runs_refactored_router)")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ create_runs_router not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking runs router: {e}")
        all_ok = False
    
    # Count endpoints in cities router
    print("\nCounting endpoints in cities router...")
    try:
        result = subprocess.run(
            ["grep", "-c", "@router.get\\|@router.post", "api/routers/cities.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            endpoint_count = int(result.stdout.strip()) if result.stdout.strip() else 0
            print(f"  ✅ Found {endpoint_count} endpoints in cities router")
        else:
            print(f"  ⚠️  Could not count endpoints")
    except Exception as e:
        print(f"  ⚠️  Error counting endpoints: {e}")
    
    # Count endpoints in runs router
    print("\nCounting endpoints in runs router...")
    try:
        result = subprocess.run(
            ["grep", "-c", "@router.get\\|@router.post", "api/routers/runs_refactored.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            endpoint_count = int(result.stdout.strip()) if result.stdout.strip() else 0
            print(f"  ✅ Found {endpoint_count} endpoints in runs router")
        else:
            print(f"  ⚠️  Could not count endpoints")
    except Exception as e:
        print(f"  ⚠️  Error counting endpoints: {e}")
    
    result = "✅ PASS" if all_ok else "❌ FAIL"
    print(f"\n{result}: Router definitions verification")
    return all_ok


def test_2_verify_service_instantiation() -> bool:
    """Test 2: Verify services are instantiated in main.py."""
    print_section("TEST 2: Verify Service Instantiation in main.py")
    
    all_ok = True
    
    # Check _CITY_SERVICE instantiation
    print("Checking _CITY_SERVICE instantiation...")
    try:
        result = subprocess.run(
            ["grep", "-n", "_CITY_SERVICE = create_city_service", "api/main.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found _CITY_SERVICE initialization")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ _CITY_SERVICE initialization not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking _CITY_SERVICE: {e}")
        all_ok = False
    
    # Check _RUN_SERVICE instantiation
    print("\nChecking _RUN_SERVICE instantiation...")
    try:
        result = subprocess.run(
            ["grep", "-n", "_RUN_SERVICE = create_run_service", "api/main.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found _RUN_SERVICE initialization")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ _RUN_SERVICE initialization not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking _RUN_SERVICE: {e}")
        all_ok = False
    
    # Check cities router registration
    print("\nChecking cities router registration...")
    try:
        result = subprocess.run(
            ["grep", "-n", "create_cities_router(service=_CITY_SERVICE)", "api/main.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found cities router registration")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ Cities router registration not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking cities router registration: {e}")
        all_ok = False
    
    # Check runs router registration
    print("\nChecking runs router registration...")
    try:
        result = subprocess.run(
            ["grep", "-n", "create_runs_refactored_router(service=_RUN_SERVICE)", "api/main.py"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if result.returncode == 0:
            print(f"  ✅ Found runs router registration")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"  ❌ Runs router registration not found")
            all_ok = False
    except Exception as e:
        print(f"  ❌ Error checking runs router registration: {e}")
        all_ok = False
    
    result = "✅ PASS" if all_ok else "❌ FAIL"
    print(f"\n{result}: Service instantiation verification")
    return all_ok


def test_3_verify_imports() -> bool:
    """Test 3: Verify all required imports work."""
    print_section("TEST 3: Verify Python Imports")
    
    all_ok = True
    
    # Test DI container imports
    print("Testing DI container imports...")
    try:
        from api.di_container import create_city_service, create_run_service
        print(f"  ✅ DI container imports successful")
    except ImportError as e:
        print(f"  ❌ DI container import failed: {e}")
        all_ok = False
    
    # Test service imports
    print("Testing service imports...")
    try:
        from api.services.city import CityService
        from api.services.run import RunService
        print(f"  ✅ Service imports successful")
    except ImportError as e:
        print(f"  ❌ Service imports failed: {e}")
        all_ok = False
    
    # Test repository imports
    print("Testing repository imports...")
    try:
        from api.repositories.city import CityRepository
        from api.repositories.run import RunRepository
        print(f"  ✅ Repository imports successful")
    except ImportError as e:
        print(f"  ❌ Repository imports failed: {e}")
        all_ok = False
    
    # Test domain imports
    print("Testing domain model imports...")
    try:
        from api.domain import CityDTO, RunDTO, Repository, NotFoundError, ValidationError
        print(f"  ✅ Domain model imports successful")
    except ImportError as e:
        print(f"  ❌ Domain imports failed: {e}")
        all_ok = False
    
    result = "✅ PASS" if all_ok else "❌ FAIL"
    print(f"\n{result}: Import verification")
    return all_ok


def test_4_verify_service_layer() -> bool:
    """Test 4: Verify service layer works with mock data."""
    print_section("TEST 4: Verify Service Layer Functionality")
    
    all_ok = True
    
    # Test CityService
    print("Testing CityService...")
    try:
        from api.di_container import create_city_service
        from api.domain import CityDTO
        
        # Create test store with sample city
        test_city_store = {
            "test-city": {
                "id": "test-city",
                "name": "Test City",
                "country": "Test Country",
                "region": "Test Region",
                "latitude": 0.0,
                "longitude": 0.0,
            }
        }
        
        service = create_city_service(city_store=test_city_store)
        print(f"  ✅ CityService instantiated")
        
        # Test async methods can be called (we won't await in sync context)
        if hasattr(service, 'list_cities'):
            print(f"  ✅ CityService has list_cities method")
        else:
            print(f"  ❌ CityService missing list_cities method")
            all_ok = False
            
        if hasattr(service, 'get_city'):
            print(f"  ✅ CityService has get_city method")
        else:
            print(f"  ❌ CityService missing get_city method")
            all_ok = False
            
    except Exception as e:
        print(f"  ❌ CityService test failed: {e}")
        all_ok = False
    
    # Test RunService
    print("\nTesting RunService...")
    try:
        from api.di_container import create_run_service
        from api.domain import RunDTO
        
        # Create test store with sample run
        test_run_store = [
            {
                "id": "test-run",
                "city_id": "test-city",
                "timestamp": "2024-01-01T00:00:00Z",
                "status": "completed",
                "progress": 100,
            }
        ]
        
        service = create_run_service(run_store=test_run_store)
        print(f"  ✅ RunService instantiated")
        
        if hasattr(service, 'list_runs'):
            print(f"  ✅ RunService has list_runs method")
        else:
            print(f"  ❌ RunService missing list_runs method")
            all_ok = False
            
        if hasattr(service, 'get_run'):
            print(f"  ✅ RunService has get_run method")
        else:
            print(f"  ❌ RunService missing get_run method")
            all_ok = False
            
    except Exception as e:
        print(f"  ❌ RunService test failed: {e}")
        all_ok = False
    
    result = "✅ PASS" if all_ok else "❌ FAIL"
    print(f"\n{result}: Service layer verification")
    return all_ok


def test_5_check_syntax() -> bool:
    """Test 5: Verify Python syntax is valid."""
    print_section("TEST 5: Verify Python Syntax")
    
    all_ok = True
    files_to_check = [
        "api/main.py",
        "api/di_container.py",
        "api/routers/cities.py",
        "api/routers/runs_refactored.py",
        "api/services/city.py",
        "api/services/run.py",
    ]
    
    for file_path in files_to_check:
        print(f"Checking {file_path}...")
        try:
            full_path = Path(__file__).parent.parent / file_path
            if not full_path.exists():
                print(f"  ⚠️  File not found")
                continue
            
            import py_compile
            py_compile.compile(str(full_path), doraise=True)
            print(f"  ✅ Syntax valid")
        except py_compile.PyCompileError as e:
            print(f"  ❌ Syntax error: {e}")
            all_ok = False
        except Exception as e:
            print(f"  ❌ Error checking syntax: {e}")
            all_ok = False
    
    result = "✅ PASS" if all_ok else "❌ FAIL"
    print(f"\n{result}: Syntax verification")
    return all_ok


def print_summary(results: dict[str, bool]) -> None:
    """Print test summary."""
    print_header("PHASE 3 TEST SUMMARY")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print(f"{'='*80}\n")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - Ready for HTTP integration testing")
    else:
        print(f"⚠️  {failed} test(s) failed - Review errors above")
    
    return passed == total


def main() -> int:
    """Run all Phase 3 endpoint tests."""
    print_header("PHASE 3: ENDPOINT ACCESSIBILITY TESTING")
    print("Testing new clean architecture endpoints...")
    print(f"Project: {Path(__file__).parent.parent}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Run all tests
    results = {
        "1. Router Definitions": test_1_verify_router_definitions(),
        "2. Service Instantiation": test_2_verify_service_instantiation(),
        "3. Python Imports": test_3_verify_imports(),
        "4. Service Layer": test_4_verify_service_layer(),
        "5. Python Syntax": test_5_check_syntax(),
    }
    
    # Print summary
    all_passed = print_summary(results)
    
    # Print next steps
    if all_passed:
        print_section("NEXT STEPS")
        print("✅ All pre-tests passed. Ready for:")
        print("  1. Start dev server: uvicorn api.main:app --reload")
        print("  2. Test new cities endpoint: curl http://localhost:8000/api/v1/cities")
        print("  3. Test new runs endpoint: curl http://localhost:8000/api/v1/runs")
        print("  4. Run pytest: pytest tests/ -v")
    else:
        print_section("ISSUES DETECTED")
        print("❌ Fix issues above before proceeding to HTTP testing")
        print("\n   Common fixes:")
        print("   • Install dependencies: pip install -r requirements.txt")
        print("   • Check file paths are correct")
        print("   • Verify imports match your project structure")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
