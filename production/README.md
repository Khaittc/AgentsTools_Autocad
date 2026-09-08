# TTC CAD — Production AutoCAD Implementation Lane

This directory is designated for the future official AutoCAD 2023 Managed .NET plugin implementation.

> [!CAUTION]
> **BUILD GATE STATUS: NOT AUTHORIZED**
> No production code is authorized yet.
> Do NOT create `.cs`, `.csproj`, `.sln`, `.bundle`, NuGet packages, or AutoCAD assembly references in this directory until authorized.

## Lane Status

- **Current Status:** `LOCKED / AWAITING_TRANCHE_AUTHORIZATION`
- **First Authorized Production Tranche:** `F0 — AutoCAD Foundation`
- **Authorization Prerequisite:**
  1. Tranche Spec `SPEC-FOUNDATION-F0` status = `FROZEN`
  2. Work Order `WO-FOUNDATION-F0-001` status = `APPROVED_FOR_EXECUTION`

## Target Technical Baseline

When authorized under a valid Work Order:
- **AutoCAD Version:** AutoCAD 2023 (Release 24.2)
- **Language:** C#
- **Target Framework:** .NET Framework 4.8
- **API:** Autodesk AutoCAD Managed .NET API (`AcCoreMgd`, `AcDbMgd`, `AcMgd`)
- **Packaging:** AutoCAD Application Package (`.bundle`)
