# TTC AutoCAD Production Governance Rules

This rule applies to the **PRODUCTION AUTOCAD LANE** (`production/`, managed C# assemblies, and official AutoCAD plugin packages).

## Scope Boundary & Lane Applicability

> [!IMPORTANT]
> **Lane Applicability Rule:**
> These governance rules govern all production implementation activities for the real AutoCAD 2023 Managed .NET plugin.
> All production work must strictly adhere to `governance/ANTIGRAVITY_INSTRUCTIONS.md`.

## Mandatory Constraints & Hard Build Gate

1. **Governing Authority:** Production development is governed strictly by `governance/ANTIGRAVITY_INSTRUCTIONS.md` under the canonical lifecycle:
   ```text
   INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
   ```
2. **Hard Build Gate:** You MUST NOT create or modify production implementation code unless BOTH are true:
   - relevant Feature / Tranche Spec status = `FROZEN`;
   - active Work Order status = `APPROVED_FOR_EXECUTION`.
   If either is missing, production code mutation is **STRICTLY BLOCKED**.
3. **Physical Isolation:** Production code, projects, solutions, and build outputs must reside exclusively in the designated `production/` directory tree and must remain completely separate from the browser simulator (`src/`).
4. **Simulator Boundary:** Simulator behavior and mockups are **design and UX evidence only**, not production implementation authority. Never treat simulator code as build authority.
5. **Technical Baseline:**
   - Host: AutoCAD 2023 (Release 24.2)
   - Runtime: .NET Framework 4.8
   - Language: C# (targeting .NET Framework 4.8)
   - API: Autodesk AutoCAD Managed .NET API (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`)
   - UI: WPF / PaletteSet
   - Drawing-First: 2D drawing-first representation; standard DWG compatibility (no custom ObjectARX proxy entities).
   - Packaging: AutoCAD `.bundle` format.
6. **No Speculative Implementation:** Do not create unmanaged, unreviewed, or out-of-scope production files. Each production tranche must be authorized by an explicit, approved Work Order.
