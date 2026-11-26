#!/usr/bin/env python3
"""
Phase 7: Documentation Validation Script

This script validates that documentation is complete and accurate:
1. Check documentation files exist
2. Verify documentation references correct files
3. Validate README completeness
4. Check for broken documentation links
5. Verify architecture documentation accuracy

Run this script: python3 scripts/phase7_documentation_tests.py
"""

import sys
import os
from pathlib import Path
from typing import Dict, List, Tuple

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


def test_1_documentation_files() -> bool:
    """Test 1: Check required documentation files exist."""
    print_section("TEST 1: Documentation Files")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    
    # Required documentation files
    required_docs = [
        "docs/README.md",
        "docs/ARCHITECTURE.md",
        "docs/API.md",
        "docs/DESIGN_PATTERNS.md",
    ]
    
    for doc_file in required_docs:
        full_path = project_root / doc_file
        if full_path.exists():
            size = full_path.stat().st_size
            print(f"✅ {doc_file} ({size} bytes)")
        else:
            print(f"⚠️  {doc_file} not found")
            all_ok = False
    
    return all_ok


def test_2_architecture_documentation() -> bool:
    """Test 2: Validate architecture documentation."""
    print_section("TEST 2: Architecture Documentation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    arch_file = project_root / "docs/ARCHITECTURE.md"
    
    if not arch_file.exists():
        print("⚠️  docs/ARCHITECTURE.md not found")
        return False
    
    try:
        with open(arch_file, 'r') as f:
            content = f.read()
        
        # Check for required sections
        required_sections = [
            "## Layered Architecture",
            "## Domain Layer",
            "## Service Layer",
            "## Repository Layer",
        ]
        
        for section in required_sections:
            if section in content:
                print(f"✅ Found: {section}")
            else:
                print(f"⚠️  Missing: {section}")
                all_ok = False
        
        # Check for file references
        required_files = [
            "api/domain/__init__.py",
            "api/services/city.py",
            "api/repositories/city.py",
        ]
        
        print("\nChecking file references in documentation...")
        for file_name in required_files:
            if file_name in content:
                print(f"✅ Referenced: {file_name}")
            else:
                print(f"⚠️  Not referenced: {file_name}")
                all_ok = False
    
    except Exception as e:
        print(f"⚠️  Error reading architecture doc: {e}")
        all_ok = False
    
    return all_ok


def test_3_api_documentation() -> bool:
    """Test 3: Validate API documentation."""
    print_section("TEST 3: API Documentation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    api_file = project_root / "docs/API.md"
    
    if not api_file.exists():
        print("⚠️  docs/API.md not found")
        return False
    
    try:
        with open(api_file, 'r') as f:
            content = f.read()
        
        # Check for endpoint documentation
        required_endpoints = [
            "/api/v1/cities",
            "/api/v1/runs",
            "GET",
            "POST",
        ]
        
        for endpoint in required_endpoints:
            if endpoint in content:
                print(f"✅ Found: {endpoint}")
            else:
                print(f"⚠️  Missing: {endpoint}")
                all_ok = False
    
    except Exception as e:
        print(f"⚠️  Error reading API doc: {e}")
        all_ok = False
    
    return all_ok


def test_4_design_patterns_documentation() -> bool:
    """Test 4: Validate design patterns documentation."""
    print_section("TEST 4: Design Patterns Documentation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    patterns_file = project_root / "docs/DESIGN_PATTERNS.md"
    
    if not patterns_file.exists():
        print("⚠️  docs/DESIGN_PATTERNS.md not found")
        return False
    
    try:
        with open(patterns_file, 'r') as f:
            content = f.read()
        
        # Check for design pattern documentation
        required_patterns = [
            "Dependency Injection",
            "Repository Pattern",
            "Service Layer",
            "Factory Pattern",
        ]
        
        for pattern in required_patterns:
            if pattern in content:
                print(f"✅ Documented: {pattern}")
            else:
                print(f"⚠️  Not documented: {pattern}")
                all_ok = False
    
    except Exception as e:
        print(f"⚠️  Error reading patterns doc: {e}")
        all_ok = False
    
    return all_ok


def test_5_readme_completeness() -> bool:
    """Test 5: Validate main README."""
    print_section("TEST 5: README Completeness")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    readme_file = project_root / "README.md"
    
    if not readme_file.exists():
        print("⚠️  README.md not found")
        return False
    
    try:
        with open(readme_file, 'r') as f:
            content = f.read()
        
        # Check for important sections
        required_sections = [
            "Installation",
            "Usage",
            "Development",
        ]
        
        found_sections = 0
        for section in required_sections:
            if section.lower() in content.lower():
                print(f"✅ Section: {section}")
                found_sections += 1
            else:
                print(f"⚠️  Missing section: {section}")
        
        # Check for project description
        if len(content) > 500:
            print(f"✅ README has substantive content ({len(content)} chars)")
        else:
            print(f"⚠️  README is too short ({len(content)} chars)")
            all_ok = False
    
    except Exception as e:
        print(f"⚠️  Error reading README: {e}")
        all_ok = False
    
    return all_ok


def test_6_code_documentation() -> bool:
    """Test 6: Check inline code documentation."""
    print_section("TEST 6: Inline Code Documentation")
    
    all_ok = True
    project_root = Path(__file__).parent.parent
    
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
    ]
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
            
            # Count docstrings and comments
            docstrings = content.count('"""') // 2
            comments = content.count('#')
            
            if docstrings > 0:
                print(f"✅ {file_path}: {docstrings} docstrings, {comments} comments")
            else:
                print(f"⚠️  {file_path}: No docstrings found")
                all_ok = False
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def run_all_tests() -> bool:
    """Run all documentation tests."""
    print_header("PHASE 7: DOCUMENTATION VALIDATION")
    print(f"Validating documentation completeness and accuracy...")
    print(f"Project: {Path(__file__).parent.parent}")
    
    results = []
    results.append(("1. Documentation Files", test_1_documentation_files()))
    results.append(("2. Architecture Docs", test_2_architecture_documentation()))
    results.append(("3. API Docs", test_3_api_documentation()))
    results.append(("4. Design Patterns Docs", test_4_design_patterns_documentation()))
    results.append(("5. README", test_5_readme_completeness()))
    results.append(("6. Inline Code Docs", test_6_code_documentation()))
    
    # Print summary
    print_header("PHASE 7 TEST SUMMARY")
    print("Test Results:")
    print("-" * 80)
    
    passed = 0
    issues = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "⚠️ "
        print(f"{test_name:40} {status}")
        if result:
            passed += 1
        else:
            issues += 1
    
    print("-" * 80)
    print(f"Total: {len(results)} | Complete: {passed} | Issues: {issues}")
    print("-" * 80)
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 ALL DOCUMENTATION CHECKS PASSED\n")
    else:
        print(f"\n⚠️  {issues} check(s) need attention - Review above\n")
    
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
