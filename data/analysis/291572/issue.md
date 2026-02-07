# Issue #290790: Archiving a session results in 2 sessions being archiving

**Repository:** microsoft/vscode
**Author:** @ulugbekna
**Created:** 2026-01-27T11:47:26Z
**Labels:** insiders-released

## Description

Testing #290656

repro:

1. Have the setup from the TPI 
2. See a grid with 4 sessions 
3. Archive one 
4. :bug: See the whole row (2 sessions) disappear 
extra :bug: the focus border seems to extend beyond visible surface (also observable in the demo below)

Demo: 

https://github.com/user-attachments/assets/f5189083-e404-4a5f-8ca9-4f8876890fb7

Version: 1.109.0-insider (Universal)
Commit: e7a06c8eabf2915e2c383b1ce6d2b993d90e2e92
Date: 2026-01-27T07:16:53.085Z
Electron: 39.3.0
ElectronBuildId: 13168319
Chromium: 142.0.7444.265
Node.js: 22.21.1
V8: 14.2.231.22-electron.0
OS: Darwin arm64 25.2.0

## Comments

