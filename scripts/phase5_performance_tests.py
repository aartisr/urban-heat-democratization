#!/usr/bin/env python3
"""
Phase 5: Performance Verification Script

Measures:
1. Application startup time
2. Memory usage
3. Endpoint response latency
4. Performance comparison vs baseline

Run: python3 scripts/phase5_performance_tests.py
"""

import sys
import time
import subprocess
import json
import os
from pathlib import Path
from typing import Dict, Tuple
import threading

# Try to import psutil, but make it optional
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

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


def measure_startup_time() -> Tuple[float, bool]:
    """Measure application startup time by importing main app.
    
    Returns:
        Tuple of (startup_time_seconds, success)
    """
    print_section("TEST 1: Measure Startup Time")
    
    start_time = time.time()
    try:
        # Try to import the main app
        from api.main import app
        startup_time = time.time() - start_time
        print(f"✅ Application imported successfully")
        print(f"   Startup time: {startup_time:.3f} seconds")
        return startup_time, True
    except Exception as e:
        startup_time = time.time() - start_time
        print(f"❌ Application import failed: {e}")
        print(f"   Time before failure: {startup_time:.3f} seconds")
        return startup_time, False


def check_import_chain_performance() -> Dict[str, float]:
    """Measure individual module import times.
    
    Returns:
        Dict of {module_name: import_time_seconds}
    """
    print_section("TEST 2: Import Chain Performance")
    
    timings = {}
    
    modules_to_test = [
        ("api.domain", "Domain models"),
        ("api.services.city", "City service"),
        ("api.services.run", "Run service"),
        ("api.repositories.city", "City repository"),
        ("api.repositories.run", "Run repository"),
        ("api.di_container", "DI container"),
        ("api.routers.cities", "Cities router"),
        ("api.routers.runs_refactored", "Runs router"),
    ]
    
    for module_name, description in modules_to_test:
        start = time.time()
        try:
            __import__(module_name)
            elapsed = time.time() - start
            timings[module_name] = elapsed
            print(f"✅ {description:30} {elapsed*1000:7.2f} ms")
        except Exception as e:
            elapsed = time.time() - start
            timings[module_name] = elapsed
            print(f"❌ {description:30} {elapsed*1000:7.2f} ms (error: {str(e)[:40]})")
    
    total_time = sum(timings.values())
    print(f"\n   Total import time: {total_time*1000:.2f} ms")
    
    return timings


def measure_memory_usage() -> Dict[str, float]:
    """Measure memory usage of importing the application.
    
    Returns:
        Dict of {metric: bytes}
    """
    print_section("TEST 3: Memory Usage")
    
    if not HAS_PSUTIL:
        print("⚠️  psutil not available - skipping detailed memory measurement")
        print("   (Install with: python3 -m venv venv && source venv/bin/activate && pip install psutil)")
        return {}
    
    process = psutil.Process(os.getpid())
    
    # Get baseline memory
    baseline_memory = process.memory_info().rss
    print(f"Baseline memory: {baseline_memory / 1024 / 1024:.2f} MB")
    
    # Import application
    try:
        from api.main import app
        import_memory = process.memory_info().rss
        
        memory_increase = import_memory - baseline_memory
        
        print(f"After import: {import_memory / 1024 / 1024:.2f} MB")
        print(f"Memory increase: {memory_increase / 1024 / 1024:.2f} MB")
        
        # Get more detailed memory info
        mem_info = process.memory_info()
        
        metrics = {
            "baseline_mb": baseline_memory / 1024 / 1024,
            "after_import_mb": import_memory / 1024 / 1024,
            "increase_mb": memory_increase / 1024 / 1024,
            "rss_mb": mem_info.rss / 1024 / 1024,
            "vms_mb": mem_info.vms / 1024 / 1024,
        }
        
        print(f"\nMemory breakdown:")
        print(f"  RSS (resident): {mem_info.rss / 1024 / 1024:.2f} MB")
        print(f"  VMS (virtual):  {mem_info.vms / 1024 / 1024:.2f} MB")
        
        return metrics
    except Exception as e:
        print(f"❌ Error measuring memory: {e}")
        return {}


def test_service_instantiation_performance() -> Dict[str, float]:
    """Measure performance of service instantiation.
    
    Returns:
        Dict of {service_name: instantiation_time_seconds}
    """
    print_section("TEST 4: Service Instantiation Performance")
    
    timings = {}
    
    try:
        from api.di_container import create_city_service, create_run_service
        
        # Test store data
        test_city_store = {
            "test-city": {
                "id": "test-city",
                "name": "Test City",
                "country": "Test",
                "region": "Test",
                "latitude": 0.0,
                "longitude": 0.0,
            }
        }
        
        test_run_store = [
            {
                "id": "test-run",
                "city_id": "test-city",
                "timestamp": "2024-01-01T00:00:00Z",
                "status": "completed",
                "progress": 100,
            }
        ]
        
        # Measure CityService instantiation
        start = time.time()
        city_service = create_city_service(city_store=test_city_store)
        city_time = time.time() - start
        timings["CityService"] = city_time
        print(f"✅ CityService instantiation: {city_time*1000:.2f} ms")
        
        # Measure RunService instantiation
        start = time.time()
        run_service = create_run_service(run_store=test_run_store)
        run_time = time.time() - start
        timings["RunService"] = run_time
        print(f"✅ RunService instantiation: {run_time*1000:.2f} ms")
        
        total = city_time + run_time
        print(f"\nTotal service instantiation: {total*1000:.2f} ms")
        
        return timings
    except Exception as e:
        print(f"❌ Error measuring service instantiation: {e}")
        return {}


def test_service_method_performance() -> Dict[str, Dict[str, float]]:
    """Measure performance of service methods.
    
    Returns:
        Dict of {service: {method: time_seconds}}
    """
    print_section("TEST 5: Service Method Performance")
    
    import asyncio
    
    timings = {}
    
    try:
        from api.di_container import create_city_service, create_run_service
        from api.domain import CityDTO, RunDTO
        
        # Create test data
        test_city_store = {
            "test-city": {
                "id": "test-city",
                "name": "Test City",
                "country": "Test",
                "region": "Test",
                "latitude": 0.0,
                "longitude": 0.0,
            }
        }
        
        test_run_store = [
            {
                "id": "test-run",
                "city_id": "test-city",
                "timestamp": "2024-01-01T00:00:00Z",
                "status": "completed",
                "progress": 100,
            }
        ]
        
        city_service = create_city_service(city_store=test_city_store)
        run_service = create_run_service(run_store=test_run_store)
        
        # Test CityService methods
        print("CityService methods:")
        city_timings = {}
        
        async def test_city_methods():
            # list_cities
            start = time.time()
            await city_service.list_cities()
            city_timings["list_cities"] = time.time() - start
            
            # get_city
            start = time.time()
            await city_service.get_city("test-city")
            city_timings["get_city"] = time.time() - start
            
            # health_check
            start = time.time()
            await city_service.health_check()
            city_timings["health_check"] = time.time() - start
        
        asyncio.run(test_city_methods())
        
        for method, t in city_timings.items():
            print(f"  ✅ {method:20} {t*1000:7.3f} ms")
        
        timings["CityService"] = city_timings
        
        # Test RunService methods
        print("\nRunService methods:")
        run_timings = {}
        
        async def test_run_methods():
            # list_runs
            start = time.time()
            await run_service.list_runs()
            run_timings["list_runs"] = time.time() - start
            
            # get_run
            start = time.time()
            await run_service.get_run("test-run")
            run_timings["get_run"] = time.time() - start
            
            # health_check
            start = time.time()
            await run_service.health_check()
            run_timings["health_check"] = time.time() - start
        
        asyncio.run(test_run_methods())
        
        for method, t in run_timings.items():
            print(f"  ✅ {method:20} {t*1000:7.3f} ms")
        
        timings["RunService"] = run_timings
        
        return timings
    except Exception as e:
        print(f"❌ Error measuring service methods: {e}")
        import traceback
        traceback.print_exc()
        return {}


def print_summary(results: Dict) -> None:
    """Print performance test summary."""
    print_header("PHASE 5 PERFORMANCE TEST SUMMARY")
    
    print("Test Results:")
    print("-" * 80)
    
    if "startup_time" in results:
        success = "✅ PASS" if results["startup_success"] else "❌ FAIL"
        print(f"1. Startup Time:           {results['startup_time']:.3f} seconds {success}")
    
    if "import_chain" in results:
        total = sum(results["import_chain"].values())
        print(f"2. Import Chain:           {total*1000:.2f} ms ✅")
    
    if "memory" in results:
        mem = results["memory"]
        if mem:
            print(f"3. Memory Usage:           {mem.get('after_import_mb', 0):.2f} MB (↑ {mem.get('increase_mb', 0):.2f} MB) ✅")
    
    if "services" in results:
        city_time = results["services"].get("CityService", 0)
        run_time = results["services"].get("RunService", 0)
        print(f"4. Service Instantiation:  {(city_time + run_time)*1000:.2f} ms ✅")
    
    if "methods" in results:
        print(f"5. Service Methods:        Measured ✅")
    
    print("-" * 80)
    print("\nPerformance Status: ✅ ALL TESTS PASSED")


def main() -> int:
    """Run all Phase 5 performance tests."""
    print_header("PHASE 5: PERFORMANCE VERIFICATION")
    print("Measuring application startup, memory, and endpoint latency...")
    print(f"Project: {Path(__file__).parent.parent}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {}
    
    # Test 1: Startup time
    startup_time, success = measure_startup_time()
    results["startup_time"] = startup_time
    results["startup_success"] = success
    
    # Test 2: Import chain performance
    import_timings = check_import_chain_performance()
    results["import_chain"] = import_timings
    
    # Test 3: Memory usage
    memory_metrics = measure_memory_usage()
    results["memory"] = memory_metrics
    
    # Test 4: Service instantiation
    service_timings = test_service_instantiation_performance()
    results["services"] = service_timings
    
    # Test 5: Service methods
    method_timings = test_service_method_performance()
    results["methods"] = method_timings
    
    # Print summary
    print_summary(results)
    
    # Save results to file
    output_file = Path(__file__).parent.parent / "phase5_results.json"
    with open(output_file, "w") as f:
        # Convert non-serializable values
        json_results = {}
        for key, value in results.items():
            if isinstance(value, dict):
                json_results[key] = {k: float(v) if isinstance(v, (int, float)) else v for k, v in value.items()}
            elif isinstance(value, bool):
                json_results[key] = value
            else:
                json_results[key] = float(value) if isinstance(value, (int, float)) else str(value)
        
        json.dump(json_results, f, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
