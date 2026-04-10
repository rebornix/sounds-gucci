# Issue #249442: Sorting is not persisted in Test Coverage

**Repository:** microsoft/vscode
**Author:** @DiStOn-btc-es
**Created:** 2025-05-21T11:35:25Z
**Labels:** bug, verified, insiders-released, testing

## Description

- VS Code Version: 1.100.2 (user setup)
- OS Version: 10.0.19045

Steps to Reproduce:

1. Open Testing perspective
2. Run Tests with coverage for a function (to get Test Coverage View visible) 
3. Change the sorting in Test Coverage View
4. Run the tests without coverage for the same function
5. Run the test with coverage (to get Test Coverage View visible) => the sorting has been changed as it was in the beginning.

## Comments

