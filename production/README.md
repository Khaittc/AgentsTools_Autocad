# TTC CAD — Production AutoCAD Implementation Lane

This directory contains the official AutoCAD 2023 Managed .NET plugin implementation for the TTC CAD Tools suite.

> [!NOTE]
> **BUILD STATUS: BUILD_CORRECTION_COMPLETE / RE_REVIEW_PENDING**
> Tranche `F0 — AutoCAD Foundation` has completed implementation and build correction under `WO-F0-001` against frozen Feature Spec `SPEC-FOUNDATION-F0-001` v1.0.0.
> Downstream tranches (F1, P1, P2, M&E) remain **NOT AUTHORIZED**.

## Solution Architecture

The solution `production/TTC.CadTools.sln` is organized into four strictly decoupled projects targeting .NET Framework 4.8 via modern SDK-style project files:

1. **`TTC.CadTools.Core`** (`production/TTC.CadTools.Core/`)
   - Pure domain models, configuration interfaces, and logging abstractions.
   - Zero AutoCAD references (`AcCoreMgd`, `AcDbMgd`, `AcMgd`, `AdWindows` completely decoupled).
   - Zero external third-party dependencies.

2. **`TTC.CadTools.Infrastructure`** (`production/TTC.CadTools.Infrastructure/`)
   - Resilient file logger (`FileLogger`) writing to `%APPDATA%\TTC_CadTools\Logs\ttc_cad_yyyyMMdd.log` with fallback to `%TEMP%\TTC_CadTools\Logs\`.
   - Thread-safe, fail-safe, non-blocking I/O.
   - Precedence-based JSON configuration loader (`JsonSettingsRepository` via `Newtonsoft.Json 13.0.3`): User AppData -> Bundle Resources -> In-Memory Defaults.
   - Zero AutoCAD references.

3. **`TTC.CadTools.AutoCAD`** (`production/TTC.CadTools.AutoCAD/`)
   - Host integration layer referencing Autodesk AutoCAD 2023 Managed .NET API (`AutoCAD.NET 24.2.0`).
   - Plugin entry point (`PluginApplication`: `IExtensionApplication`) with idempotent startup/shutdown and headless console detection.
   - Diagnostic command: `TTCINFO` (`[CommandMethod("TTCINFO", CommandFlags.Session | CommandFlags.Modal)]`).
   - Modeless palette shell: `TTCPALETTE` and `PaletteHost` hosting WPF `StatusControl` (`{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}`).
   - Ribbon UI shell: `RibbonHost` creating tab `TTC CAD` and panel `General`.

4. **`TTC.CadTools.Tests`** (`production/TTC.CadTools.Tests/`)
   - Automated unit and architecture test suite (xUnit 2.8.0).
   - Decoupling tests verifying 0 AutoCAD references in Core and Infrastructure.
   - Scope containment tests verifying zero downstream domain entities (Panels, M&E).
   - Manifest validation tests verifying Autodesk `.bundle` schema compliance.
   - File logger thread safety and fallback tests.
   - JSON configuration hierarchy and fallback precedence tests.

## Build Instructions

Build all projects in Release configuration:
```bash
dotnet build production/TTC.CadTools.sln -c Release
```

## Running Automated Tests

Run the full xUnit test suite (20/20 automated tests):
```bash
dotnet test production/TTC.CadTools.sln -c Release
```

## Bundle Packaging & Deployment

Standard Autodesk Application Package (`.bundle`) is located at:
```text
production/TTC.CadTools.bundle/
├── PackageContents.xml
└── Contents/
    ├── TTC.CadTools.AutoCAD.dll
    ├── TTC.CadTools.Core.dll
    ├── TTC.CadTools.Infrastructure.dll
    ├── Newtonsoft.Json.dll
    └── Resources/
        └── settings.json
```

To install for standard autoloading in AutoCAD 2023, copy `TTC.CadTools.bundle` to:
- Per-user: `%APPDATA%\Autodesk\ApplicationPlugins\`
- Machine-wide: `%ProgramData%\Autodesk\ApplicationPlugins\`

## Host Verification

### Core Console (Non-interactive / Headless Verification)
```bash
& "C:\Program Files\Autodesk\AutoCAD 2023\accoreconsole.exe" /i "sample.dwg" /s "production\TTC.CadTools.Tests\run_host_verify.scr"
```

### Full Desktop AutoCAD 2023
1. Launch Autodesk AutoCAD 2023.
2. The bundle will autoload automatically if placed in the ApplicationPlugins folder.
3. Alternatively, load directly via command line:
   ```text
   COMMAND: NETLOAD
   Select: production/TTC.CadTools.AutoCAD/bin/Release/TTC.CadTools.AutoCAD.dll
   ```
4. Verify diagnostic health:
   ```text
   COMMAND: TTCINFO
   ```
5. Toggle diagnostic palette:
   ```text
   COMMAND: TTCPALETTE
   ```
6. Inspect active log at `%APPDATA%\TTC_CadTools\Logs\ttc_cad_yyyyMMdd.log`.
