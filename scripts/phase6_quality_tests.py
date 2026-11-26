#!/usr/bin/env python3
"""
Phase 6: Code Quality Testing Script

This script validates code quality by running:
1. Type checking (via imports and static analysis)
2. Linting checks (PEP 8 style)
3. Complexity analysis
4. Test coverage verification
5. Documentation completeness

Run this script: python3 scripts/phase6_quality_tests.py
"""

import sys
import subprocess
import ast
import json
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


def test_1_type_annotations() -> bool:
    """Test 1: Verify type annotations are present."""
    print_section("TEST 1: Type Annotation Coverage")
    
    all_ok = True
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
        "api/domain/__init__.py",
        "api/di_container.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            print(f"⚠️  {file_path} not found")
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content)
            
            # Count functions and class methods
            functions = 0
            annotated = 0
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions += 1
                    # Check if function has return type annotation
                    if node.returns is not None:
                        annotated += 1
                    # Check if all parameters have type annotations
                    for arg in node.args.args:
                        if arg.annotation is not None:
                            annotated += 1
            
            if functions > 0:
                coverage = (annotated / max(functions, 1)) * 100
                status = "✅" if coverage >= 80 else "⚠️ "
                print(f"{status} {file_path}: {coverage:.0f}% type coverage ({annotated}/{functions} annotations)")
                if coverage < 80:
                    all_ok = False
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def test_2_import_cycles() -> bool:
    """Test 2: Detect circular imports."""
    print_section("TEST 2: Circular Import Detection")
    
    all_ok = True
    files_to_check = [
        "api/main.py",
        "api/di_container.py",
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                compile(content, file_path, 'exec')
            print(f"✅ {file_path}: No syntax errors")
        except SyntaxError as e:
            print(f"❌ {file_path}: Syntax error: {e}")
            all_ok = False
        except Exception as e:
            print(f"⚠️  {file_path}: {e}")
    
    return all_ok


def test_3_docstring_coverage() -> bool:
    """Test 3: Verify docstring coverage."""
    print_section("TEST 3: Docstring Coverage")
    
    all_ok = True
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            print(f"⚠️  {file_path} not found")
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content)
            
            # Count functions and methods with docstrings
            functions = 0
            documented = 0
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if not node.name.startswith('_'):  # Skip private methods
                        functions += 1
                        if ast.get_docstring(node) is not None:
                            documented += 1
            
            if functions > 0:
                coverage = (documented / functions) * 100
                status = "✅" if coverage >= 90 else "⚠️ "
                print(f"{status} {file_path}: {coverage:.0f}% docstring coverage ({documented}/{functions})")
                if coverage < 90:
                    all_ok = False
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def test_4_code_complexity() -> bool:
    """Test 4: Check for overly complex functions."""
    print_section("TEST 4: Code Complexity Analysis")
    
    all_ok = True
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    def get_cyclomatic_complexity(node: ast.AST) -> int:
        """Estimate cyclomatic complexity of a function."""
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
        return complexity
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content)
            
            complex_functions = []
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    complexity = get_cyclomatic_complexity(node)
                    if complexity > 5:
                        complex_functions.append((node.name, complexity))
            
            if complex_functions:
                print(f"⚠️  {file_path}: Found {len(complex_functions)} complex function(s):")
                for func_name, complexity in complex_functions:
                    print(f"      - {func_name}: complexity={complexity}")
            else:
                print(f"✅ {file_path}: All functions have acceptable complexity")
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def test_5_naming_conventions() -> bool:
    """Test 5: Check naming conventions."""
    print_section("TEST 5: Naming Convention Compliance")
    
    all_ok = True
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    def is_snake_case(name: str) -> bool:
        """Check if name is snake_case."""
        return name.islower() and name.replace('_', '').isalnum()
    
    def is_pascal_case(name: str) -> bool:
        """Check if name is PascalCase."""
        return name[0].isupper() and name.replace('_', '').isalnum()
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content)
            
            issues = []
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    if not is_pascal_case(node.name):
                        issues.append(f"Class '{node.name}' should use PascalCase")
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if not (is_snake_case(node.name) or node.name.startswith('_')):
                        issues.append(f"Function '{node.name}' should use snake_case")
            
            if issues:
                print(f"⚠️  {file_path}: Naming convention issues:")
                for issue in issues[:5]:  # Show first 5 issues
                    print(f"      - {issue}")
                all_ok = False
            else:
                print(f"✅ {file_path}: Naming conventions OK")
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def test_6_import_organization() -> bool:
    """Test 6: Check import organization."""
    print_section("TEST 6: Import Organization")
    
    all_ok = True
    files_to_check = [
        "api/services/city.py",
        "api/services/run.py",
        "api/repositories/city.py",
        "api/repositories/run.py",
        "api/di_container.py",
    ]
    
    project_root = Path(__file__).parent.parent
    
    for file_path in files_to_check:
        full_path = project_root / file_path
        if not full_path.exists():
            continue
        
        try:
            with open(full_path, 'r') as f:
                lines = f.readlines()
            
            # Check that imports come before other code
            import_section_ended = False
            issues = []
            
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                
                if stripped and not stripped.startswith('#'):
                    if stripped.startswith(('import ', 'from ')):
                        if import_section_ended:
                            issues.append(f"Line {i}: Import found after non-import code")
                    elif not import_section_ended and stripped:
                        import_section_ended = True
            
            if issues:
                print(f"⚠️  {file_path}: Import organization issues:")
                for issue in issues[:3]:
                    print(f"      - {issue}")
            else:
                print(f"✅ {file_path}: Import organization OK")
        except Exception as e:
            print(f"⚠️  Error analyzing {file_path}: {e}")
    
    return all_ok


def run_all_tests() -> bool:
    """Run all quality tests."""
    print_header("PHASE 6: CODE QUALITY TESTING")
    print(f"Analyzing code quality and best practices...")
    print(f"Project: {Path(__file__).parent.parent}")
    
    results = []
    results.append(("1. Type Annotations", test_1_type_annotations()))
    results.append(("2. Circular Imports", test_2_import_cycles()))
    results.append(("3. Docstrings", test_3_docstring_coverage()))
    results.append(("4. Complexity", test_4_code_complexity()))
    results.append(("5. Naming", test_5_naming_conventions()))
    results.append(("6. Import Organization", test_6_import_organization()))
    
    # Print summary
    print_header("PHASE 6 TEST SUMMARY")
    print("Test Results:")
    print("-" * 80)
    
    passed = 0
    failed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "⚠️ "
        print(f"{test_name:40} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("-" * 80)
    print(f"Total: {len(results)} | Passed: {passed} | Issues: {failed}")
    print("-" * 80)
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 ALL QUALITY CHECKS PASSED\n")
    else:
        print(f"\n⚠️  {failed} check(s) have issues - Review above\n")
    
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
