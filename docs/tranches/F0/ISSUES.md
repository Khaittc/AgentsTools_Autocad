# Tranche F0: AutoCAD Foundation — Issue Registry

## Summary

- Open Blocking Issues: NONE
- Open Non-Blocking Issues: 3
- Resolved Issues: 0

---

## ISSUE-F0-001: AutoCAD 2023 Reference Assembly Resolution Strategy

Status: OPEN  
Severity: MEDIUM  
Category: BUILD  
Owner: Developer / Implementer  
Found In: Tranche F0 (Planning/Spec)  
Found By: Antigravity / AG-F0-001  
Found Date: 2026-09-08  

### Problem
AutoCAD 2023 Managed .NET assemblies (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`) are required to compile `TTC.CadTools.AutoCAD`.
If developer machines lack AutoCAD 2023 installed in the standard path (`C:\Program Files\Autodesk\AutoCAD 2023\`), compilation will fail unless an official NuGet package (e.g. `AutoCAD.NET 24.2.0`) or environment variable reference path (`$(AutoCADPath)`) is used with `Private=False` (`CopyLocal=False`).

### Expected
A deterministic reference strategy that builds seamlessly on developer machines without polluting the build output with duplicate Autodesk host DLLs.

### Actual
Currently in planning stage; exact workstation environments need confirmation before Work Order.

### Proposed Resolution
Use the official `AutoCAD.NET` NuGet package (v24.2.0 for AutoCAD 2023) targeting `.NETFramework,Version=v4.8` with `ExcludeAssets="runtime"` / `Private=False`.

---

## ISSUE-F0-002: Plugin Log Directory Permissions in Standard Bundle Locations

Status: OPEN  
Severity: LOW  
Category: HOST  
Owner: Developer / Implementer  
Found In: Tranche F0 (Planning/Spec)  
Found By: Antigravity / AG-F0-001  
Found Date: 2026-09-08  

### Problem
If the AutoCAD `.bundle` package is deployed in `C:\Program Files\Autodesk\ApplicationPlugins\` or `C:\ProgramData\Autodesk\ApplicationPlugins\`, regular standard user accounts do not have write permissions to write log files into the bundle root directory (`Contents/Logs/`).

### Expected
The logging infrastructure must either write to a per-user application directory (`%APPDATA%\TTC_CadTools\Logs`) or gracefully fall back if the local bundle directory is read-only.

### Actual
Planning/spec stage; need explicit path precedence in Spec.

### Proposed Resolution
Specify primary log path as `%APPDATA%\TTC_CadTools\Logs\` with fallback to `%TEMP%\TTC_CadTools\Logs\`.

---

## ISSUE-F0-003: Modeless PaletteSet Threading and Document Context Switching

Status: OPEN  
Severity: LOW  
Category: CAD_API  
Owner: Developer / Implementer  
Found In: Tranche F0 (Planning/Spec)  
Found By: Antigravity / AG-F0-001  
Found Date: 2026-09-08  

### Problem
A modeless `PaletteSet` hosting WPF controls executes on the UI thread and may trigger actions when the active document changes or when no drawing is open (`ActiveDocument == null`). Calling document-mutating methods without proper document locking or when in a quiescent state causes host crashes.

### Expected
In Tranche F0, the `PaletteSet` is a shell only. It must observe `DocumentCollection.DocumentActivated` and gracefully handle null active document states without attempting any drawing transaction.

### Actual
Documented as a design constraint in `docs/tranches/F0/DESIGN.md` and `SPEC.md`.

### Proposed Resolution
Define explicit guard in F0 Spec: Palette shell controls are read-only / diagnostic in F0; all command dispatches must verify `Application.DocumentManager.MdiActiveDocument != null` and use `DocumentLock` if mutating.
