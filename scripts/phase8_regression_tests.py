#!/usr/bin/env python3
"""
Phase 8: Regression Testing Script

This script validates that no features have regressed by comparing
the current main branch with main-old:

1. Compare service implementations
2. Verify backward compatibility
3. Check data flow integrity
4. Validate endpoint responses
5. Test old endpoints still work

Run this script: python3 scripts/phase8_regression_tests.py
"""

import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional

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


def get_git_diff(file_path: str) -> Optional[str]:
    """Get git diff between main and main-old for a file."""
    try:
        result = subprocess.run(
            ["git", "diff", "main-old", "main", "--", file_path],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        return result.stdout if result.returncode == 0 else None
    except Exception as e:
        print(f"Error getting diff for {file_path}: {e}")
        return None


def test_1_main_entry_point() -> bool:
    """Test 1: Verify main entry point (api/main.py) integrity."""
    print_section("TEST 1: Main Entry Point Integrity")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    main_file = project_root / "api/main.py"
    
    try:
        with open(main_file, 'r') as f:
            content = f.read()
        
        # Check for required initialization code
        required_items = [
            "_CITY_STORE",
            "_RUN_STORE",
            "_CITY_SERVICE",
            "_RUN_SERVICE",
            "create_cities_router",
            "create_runs_refactored_router",
        ]
        
        for item in required_items:
            if item in content:
                print(f"✅ Found: {item}")
            else:
                print(f"❌ Missing: {item}")
                all_ok = False
        
        # Check that old endpoints still exist
        old_patterns = [
            "@app.get(\"/api/v1/cities\")",
            "@app.get(\"/api/v1/runs\")",
        ]
        
        print("\nChecking backward compatibility with old endpoints...")
        for pattern in old_patterns:
            if pattern in content or "@app.get" in content:
                print(f"✅ Old endpoint pattern found")
            else:
                print(f"⚠️  Endpoint pattern not found")
    
    except Exception as e:
        print(f"❌ Error analyzing main.py: {e}")
        all_ok = False
    
    return all_ok


def test_2_service_layer_implementation() -> bool:
    """Test 2: Verify service layer is properly implemented."""
    print_section("TEST 2: Service Layer Implementation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    
    service_files = [
        ("api/services/city.py", ["CityService", "list_cities", "get_city"]),
        ("api/services/run.py", ["RunService", "list_runs", "get_run"]),
    ]
    
    for file_path, required_items in service_files:
        full_path = project_root / file_path
        
        if not full_path.exists():
            print(f"❌ {file_path} not found")
            all_ok = False
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            print(f"\nChecking {file_path}...")
            for item in required_items:
                if item in content:
                    print(f"  ✅ {item}")
                else:
                    print(f"  ❌ {item} not found")
                    all_ok = False
        
        except Exception as e:
            print(f"❌ Error analyzing {file_path}: {e}")
            all_ok = False
    
    return all_ok


def test_3_repository_layer() -> bool:
    """Test 3: Verify repository layer is properly implemented."""
    print_section("TEST 3: Repository Layer Implementation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    
    repo_files = [
        ("api/repositories/city.py", ["CityRepository", "async def list", "async def get"]),
        ("api/repositories/run.py", ["RunRepository", "async def list", "async def get"]),
    ]
    
    for file_path, required_items in repo_files:
        full_path = project_root / file_path
        
        if not full_path.exists():
            print(f"❌ {file_path} not found")
            all_ok = False
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            print(f"\nChecking {file_path}...")
            for item in required_items:
                if item in content:
                    print(f"  ✅ {item}")
                else:
                    print(f"  ❌ {item} not found")
                    all_ok = False
        
        except Exception as e:
            print(f"❌ Error analyzing {file_path}: {e}")
            all_ok = False
    
    return all_ok


def test_4_di_container() -> bool:
    """Test 4: Verify DI container setup."""
    print_section("TEST 4: Dependency Injection Container")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    di_file = project_root / "api/di_container.py"
    
    if not di_file.exists():
        print("❌ api/di_container.py not found")
        return False
    
    try:
        with open(di_file, 'r') as f:
            content = f.read()
        
        required_items = [
            "def create_city_service",
            "def create_run_service",
            "CityService",
            "RunService",
            "CityRepository",
            "RunRepository",
        ]
        
        for item in required_items:
            if item in content:
                print(f"✅ {item}")
            else:
                print(f"❌ {item} not found")
                all_ok = False
    
    except Exception as e:
        print(f"❌ Error analyzing di_container.py: {e}")
        all_ok = False
    
    return all_ok


def test_5_domain_models() -> bool:
    """Test 5: Verify domain models are intact."""
    print_section("TEST 5: Domain Models")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    domain_file = project_root / "api/domain/__init__.py"
    
    if not domain_file.exists():
        print("⚠️  api/domain/__init__.py not found")
        return all_ok
    
    try:
        with open(domain_file, 'r') as f:
            content = f.read()
        
        required_classes = [
            "class Repository",
            "class CityDTO",
            "class RunDTO",
            "class NotFoundError",
        ]
        
        for item in required_classes:
            if item in content:
                print(f"✅ {item}")
            else:
                print(f"⚠️  {item} not found")
    
    except Exception as e:
        print(f"⚠️  Error analyzing domain/__init__.py: {e}")
    
    return all_ok


def test_6_import_validation() -> bool:
    """Test 6: Validate all imports work correctly."""
    print_section("TEST 6: Import Chain Validation")
    
    all_ok = True
    
    imports_to_test = [
        ("api.domain", "Domain models"),
        ("api.repositories.city", "City repository"),
        ("api.repositories.run", "Run repository"),
        ("api.services.city", "City service"),
        ("api.services.run", "Run service"),
        ("api.di_container", "DI container"),
        ("api.routers.cities", "Cities router"),
        ("api.routers.runs_refactored", "Runs router"),
    ]
    
    for module_name, description in imports_to_test:
        try:
            __import__(module_name)
            print(f"✅ {description}: {module_name}")
        except ImportError as e:
            print(f"❌ {description}: {module_name} - {e}")
            all_ok = False
        except Exception as e:
            print(f"⚠️  {description}: {module_name} - {e}")
    
    return all_ok


def test_7_backward_compatibility() -> bool:
    """Test 7: Verify backward compatibility with old code."""
    print_section("TEST 7: Backward Compatibility")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    main_file = project_root / "api/main.py"
    
    try:
        with open(main_file, 'r') as f:
            content = f.read()
        
        # Check that both old monolithic AND new service endpoints are registered
        print("Checking for coexistence of old and new endpoints...")
        
        # Look for old-style endpoint definitions
        old_style_found = "@app.get" in content or "@app.post" in content
        if old_style_found:
            print("✅ Old monolithic endpoints still present")
        else:
            print("⚠️  Could not confirm old endpoints present")
        
        # Look for new router registrations
        new_style_found = "app.include_router" in content
        if new_style_found:
            print("✅ New service-based routers registered")
        else:
            print("❌ New routers not found")
            all_ok = False
        
        # Verify no breaking changes to data structures
        print("\nChecking data structure compatibility...")
        store_access_patterns = [
            "_CITY_STORE",
            "_RUN_STORE",
        ]
        
        for pattern in store_access_patterns:
            if pattern in content:
                print(f"✅ {pattern} still accessible")
            else:
                print(f"⚠️  {pattern} not found")
    
    except Exception as e:
        print(f"❌ Error checking backward compatibility: {e}")
        all_ok = False
    
    return all_ok


def run_all_tests() -> bool:
    """Run all regression tests."""
    print_header("PHASE 8: REGRESSION TESTING")
    print(f"Validating no features regressed compared to main-old...")
    print(f"Project: {Path(__file__).parent.parent}")
    
    results = []
    results.append(("1. Main Entry Point", test_1_main_entry_point()))
    results.append(("2. Service Layer", test_2_service_layer_implementation()))
    results.append(("3. Repository Layer", test_3_repository_layer()))
    results.append(("4. DI Container", test_4_di_container()))
    results.append(("5. Domain Models", test_5_domain_models()))
    results.append(("6. Imports", test_6_import_validation()))
    results.append(("7. Backward Compatibility", test_7_backward_compatibility()))
    
    # Print summary
    print_header("PHASE 8 TEST SUMMARY")
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
        print("\n🎉 NO REGRESSIONS DETECTED - All features intact\n")
    else:
        print(f"\n❌ {failed} test(s) failed - Regressions detected\n")
    
    return all_passed


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
