# TTC CAD — Feature Specification: Tranche F0 (AutoCAD Foundation)

Status: DRAFT / READY_FOR_REVIEW
Tranche ID: F0
Module: FOUNDATION
Capability: AutoCAD Foundation
Feature ID: SPEC-FOUNDATION-F0-001
Feature Name: AutoCAD 2023 Managed .NET Plugin Shell & Diagnostic Infrastructure
Command(s): `TTCINFO`, `TTCPALETTE`
Version: 0.1.0

Depends On: Product Baseline
Inherits From: None (Root Technical Tranche)
Entry Stage: DESIGN (`docs/tranches/F0/DESIGN.md`)
Previous Frozen Baseline: None

Product Owner: TTC CAD Project Owner
Reviewer: Independent Technical Reviewer
Date: 2026-09-08

Open Questions: 3 (Non-blocking for specification review)
Build Status: BLOCKED (Requires FROZEN Spec + APPROVED_FOR_EXECUTION Work Order)
Work Order: NONE

> [!CAUTION]
> **BUILD GATE INVARIANT:**
> This specification grants NO implementation authority until Status = `FROZEN` and an approved Work Order exists.
> Zero production C# files may be created or mutated under this document alone.

---

## 1. Authority / Traceability

- Intake: `docs/tranches/F0/INTAKE.md` (`INTAKE-FOUNDATION-F0`)
- Design Evidence: `docs/tranches/F0/DESIGN.md` (`DESIGN-FOUNDATION-F0`)
- Architecture Roadmap: `docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md` (Sections 4, 5, 6, 7, 8, 41)
- Governance Decision Records:
  - `TTC-GOV-001`: Spec-First Per Tranche Production Development
  - `TTC-GOV-002`: Git-Based Agent Continuity & Memory Protocol
- Target Host: Autodesk AutoCAD 2023 (Series R24.2), .NET Framework 4.8

---

## 2. Objective

Provide the precise technical contracts for compiling, packaging, loading, and verifying the minimal production AutoCAD 2023 Managed .NET plugin shell. This establishes the plugin bootstrap entry point, the diagnostic health command `TTCINFO`, the Ribbon UI shell, the modeless `PaletteSet` shell, configuration loading/validation, file logging, and package manifest compliance, while maintaining strict architectural decoupling and zero feature creep into Panel or M&E engineering domains.

---

## 3. Preconditions

1. Build system has Visual Studio 2022 / MSBuild targeting `.NETFramework,Version=v4.8`.
2. Target AutoCAD host environment is Autodesk AutoCAD 2023 (or compatible R24.2 host).
3. AutoCAD Managed .NET assemblies (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`) resolved via NuGet package `AutoCAD.NET 24.2.0` with `Private=False`.
4. Spec status = `FROZEN` and active Work Order = `APPROVED_FOR_EXECUTION` (Prerequisite for Build).

---

## 4. In Scope

- C# Solution structure: `TTC.CadTools.Core`, `TTC.CadTools.Infrastructure`, `TTC.CadTools.AutoCAD`, and `TTC.CadTools.Tests`.
- Plugin entry point: `TTC.CadTools.AutoCAD.Entry.PluginApplication` implementing `IExtensionApplication`.
- Diagnostic command: `TTCINFO` reporting runtime, host, configuration, and logging health.
- Palette command: `TTCPALETTE` toggling modeless `PaletteSet` visibility.
- Ribbon tab: `TTC CAD` with panel `General` containing push buttons for `TTCINFO` and `TTCPALETTE`.
- Configuration subsystem: `settings.json` schema, loader, validator, and in-memory defaults fallback.
- Logging subsystem: `ILogger` interface, thread-safe daily rolling file logger in `%APPDATA%\TTC_CadTools\Logs\`.
- Core repository interfaces: `ISettingsRepository`, placeholder declarations for `IComponentRepository` and `ICabinetRepository`.
- Autoloader bundle: `TTC.bundle` with valid `PackageContents.xml`.
- Structured negative-case error handling preventing AutoCAD host crashes.

---

## 5. Out of Scope / Non-Goals

- **NO Panel Engineering Features:** Device placement (`TTCPANELPLACE`), DIN rails (`TTCRAIL`), ducts (`TTCDUCT`), alignment (`TTCALIGN`), clearance checks (`TTCPANELCHECK`), depth verification, cabinet sizing (`TTCPANELSIZE`).
- **NO M&E Engineering Features:** Cable tray routing, fittings, elevation, supports, tray-to-panel connections.
- **NO Common CAD Contracts (Deferred to F1):** Drawing units enforcement (`INSUNITS`), geometric tolerance ($\varepsilon$), CAD object identity (`TTC_OBJECT_ID`), native AutoCAD command overrides (`MOVE`/`COPY`/`UNDO`), `XRecord` metadata persistence schemas.
- **NO Third-Party Native Dependencies:** Zero ObjectARX C++ binaries, zero external unmanaged DLLs.

---

## 6. Technical Contracts

### 6.1 Assembly & Project Structure Contract

```text
TTC.CadTools.Core.dll             -> Targets .NET 4.8. References ONLY System assemblies. ZERO AutoCAD references.
TTC.CadTools.Infrastructure.dll   -> Targets .NET 4.8. References TTC.CadTools.Core. ZERO AutoCAD references.
TTC.CadTools.AutoCAD.dll          -> Targets .NET 4.8. References Core, Infrastructure, AcCoreMgd, AcDbMgd, AcMgd.
TTC.CadTools.Tests.dll            -> Targets .NET 4.8. xUnit unit tests for Core and Infrastructure.
```

### 6.2 Plugin Entry Point Contract (`IExtensionApplication`)

- **Class:** `TTC.CadTools.AutoCAD.Entry.PluginApplication`
- **Assembly Attribute:** `[assembly: ExtensionApplication(typeof(TTC.CadTools.AutoCAD.Entry.PluginApplication))]`
- **Method `Initialize()`:**
  1. Wrap all logic in top-level `try ... catch (Exception ex)`.
  2. Initialize `FileLogger`. If fails, fall back to `%TEMP%\TTC_CadTools\Logs\`.
  3. Load `settings.json`. If missing or invalid, load default in-memory settings and log warning.
  4. Inspect `Autodesk.Windows.ComponentManager.Ribbon`. If available, call `RibbonBuilder.Build()`. If null, subscribe to `ComponentManager.ItemInitialized`.
  5. Log `INFO: TTC CAD Plugin Initialized Successfully`.
  6. Return cleanly; **never** re-throw unhandled exceptions into AutoCAD startup pipeline.
- **Method `Terminate()`:**
  1. Wrap in `try ... catch`.
  2. Dispose `PaletteSet` instance if instantiated.
  3. Flush and dispose file logger.

### 6.3 Command Contract: `TTCINFO`

- **Method:** `[CommandMethod("TTCINFO", CommandFlags.Session | CommandFlags.Modal)]`
- **Class:** `TTC.CadTools.AutoCAD.Commands.InfoCommand`
- **Requires Active Document:** NO (`CommandFlags.Session`).
- **Prompt Sequence:** None (parameterless execution).
- **Behavior:**
  1. Queries host AutoCAD product version via `Autodesk.AutoCAD.ApplicationServices.Application.Version`.
  2. Queries executing assembly file version via `Assembly.GetExecutingAssembly().GetName().Version`.
  3. Queries current CLR runtime version via `Environment.Version`.
  4. Queries configuration repository status (`VALID`, `FALLBACK_DEFAULT`, or `MISSING`).
  5. Queries active log file full path.
  6. Prints formatted diagnostic text block to the AutoCAD command window via `Editor.WriteMessage()` or `Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage()` if active doc exists.
  7. Writes `INFO` entry to the active log file: `Command TTCINFO executed successfully`.

### 6.4 Command Contract: `TTCPALETTE`

- **Method:** `[CommandMethod("TTCPALETTE", CommandFlags.Modal)]`
- **Class:** `TTC.CadTools.AutoCAD.Commands.PaletteCommand`
- **Requires Active Document:** NO.
- **Behavior:**
  1. If `PaletteHost.Instance` is null, instantiate `PaletteSet` with deterministic GUID `{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}` and Title `"TTC CAD Tools"`.
  2. Set styles: `ShowAutoHideButton | ShowCloseButton | Snappable`.
  3. Add WPF element `StatusControl` (UserControl) via `paletteSet.AddVisual("Status", new StatusControl())`.
  4. Toggle visibility: `paletteSet.Visible = !paletteSet.Visible`.
  5. If setting to visible, call `paletteSet.KeepFocus = true`.

### 6.5 Configuration Contract (`settings.json`)

- **Resolution Order:**
  1. User Path: `%APPDATA%\TTC_CadTools\settings.json`
  2. Bundle Path: `<BundleContentsDir>\Resources\settings.json`
  3. Fallback: Internal in-memory defaults.
- **Schema Contract:**
  ```json
  {
    "schemaVersion": "1.0",
    "environment": "Production",
    "logging": {
      "logLevel": "Information",
      "retentionDays": 7,
      "logDirectory": ""
    },
    "ui": {
      "ribbonAutoLoad": true,
      "paletteAutoOpen": false
    }
  }
  ```
- **Validation Rules:**
  - `schemaVersion` must be non-empty string.
  - `logging.logLevel` must parse to valid `LogLevel` enum (`Debug`, `Information`, `Warning`, `Error`).
  - `logging.retentionDays` must be integer $\ge 1$.
  - If invalid, mark validation status as `INVALID` with diagnostic error message and populate object with safe fallback defaults.

### 6.6 Structured Logging Contract

- **Interface:** `TTC.CadTools.Core.Logging.ILogger`
  ```csharp
  public interface ILogger
  {
      void Debug(string message);
      void Info(string message);
      void Warn(string message);
      void Error(string message, Exception ex = null);
  }
  ```
- **File Output:** Daily rolling file `ttc_cad_{yyyyMMdd}.log`.
- **Log Line Format:** `[{Timestamp:yyyy-MM-dd HH:mm:ss.fff}] [{Level,-5}] [{ThreadId:D2}] {Message} {ExceptionDetails}`
- **Thread Safety:** File write calls synchronized via thread-safe lock object.

### 6.7 Package Manifest Contract (`PackageContents.xml`)

- Root tag: `<ApplicationPackage SchemaVersion="1.0" ...>`
- Series requirement: `SeriesMin="R24.2" SeriesMax="R24.2"` (strictly targeting AutoCAD 2023).
- Component entry pointing to `./Contents/TTC.CadTools.AutoCAD.dll`.
- Registered commands: `TTCINFO` and `TTCPALETTE`.

---

## 7. Negative Cases & Error Handling Matrix

| Case ID | Scenario / Condition | Mutation Allowed? | User Feedback | Log Requirement | Recovery / Stop Behavior |
|---|---|---|---|---|---|
| NEG-F0-01 | `settings.json` file missing on disk | NO | "TTC CAD: Configuration not found; running with standard defaults." | `WARN: settings.json not found. Applied in-memory defaults.` | Load default settings; continue plugin execution |
| NEG-F0-02 | `settings.json` contains malformed JSON syntax | NO | "TTC CAD: Configuration corrupted; standard defaults applied." | `ERROR: JSON parse failed: {details}. Applied defaults.` | Load default settings; continue plugin execution |
| NEG-F0-03 | `settings.json` has missing/invalid required fields | NO | "TTC CAD: Invalid configuration values; standard defaults applied." | `WARN: Validation failed: {field}. Applied defaults.` | Load default settings; continue plugin execution |
| NEG-F0-04 | `%APPDATA%\TTC_CadTools\Logs\` is read-only / unauthorized | NO | None (silent fallback) | None in primary log; record in fallback log | Fallback to `%TEMP%\TTC_CadTools\Logs\` |
| NEG-F0-05 | AutoCAD Ribbon not yet loaded when plugin initializes | NO | None (deferred creation) | `INFO: Ribbon not ready; deferred to ComponentManager.ItemInitialized.` | Subscribes to event; builds ribbon when ready |
| NEG-F0-06 | `TTCINFO` executed with zero drawings open | NO | Full health report displayed on text screen | `INFO: Command TTCINFO executed in zero-document state.` | Executes cleanly via `CommandFlags.Session` |
| NEG-F0-07 | Duplicate `Initialize()` call triggered | NO | None | `WARN: Initialize() called on already initialized plugin instance.` | Ignore second call; idempotent return |
| NEG-F0-08 | Unhandled exception inside `Initialize()` | NO | "TTC CAD failed to start cleanly. Diagnostic log written." | `FATAL: Unhandled exception during plugin startup: {ex}` | Traps exception; prevents AutoCAD host crash |
| NEG-F0-09 | Plugin loaded into unsupported AutoCAD version (< R24.2) | NO | "TTC CAD is certified for AutoCAD 2023 only." | `ERROR: Unsupported host version detected: {version}.` | Package autoloader rejects; manual load logs error |

---

## 8. Technical Constant Discipline

> [!IMPORTANT]
> The following constants are **F0-LOCAL ONLY** and have zero authority over Tranche F1 (Common CAD Contracts):
> - `DefaultLogRetentionDays = 7` (`F0-LOCAL / NON-AUTHORITATIVE_FOR_F1`)
> - `DefaultLogLevel = LogLevel.Information` (`F0-LOCAL / NON-AUTHORITATIVE_FOR_F1`)
> - `PaletteSetGuid = "4A7A779F-9C3D-4A42-A862-2D5392D6D3A0"` (`F0-LOCAL`)
>
> All geometric tolerances ($\varepsilon$), CAD object identities, layer standards, and drawing unit scales belong strictly to Tranche F1 and subsequent tranches.

---

## 9. Acceptance Criteria

| AC ID | Acceptance Criterion | Verification Method | Status |
|---|---|---|---|
| **AC-F0-01** | **Plugin Bootstrap:** Plugin assembly loads into AutoCAD 2023 without unhandled exceptions via `.bundle` autoloader or manual `NETLOAD`. | AutoCAD Manual Test / Host Inspection | `NOT_RUN` |
| **AC-F0-02** | **Diagnostic Command (`TTCINFO`):** Executing `TTCINFO` outputs AutoCAD host version, assembly version, CLR runtime, configuration status, and log file path. | AutoCAD Integration Test / Output Inspection | `NOT_RUN` |
| **AC-F0-03** | **Ribbon Shell:** `TTC CAD` tab and `General` panel appear in the AutoCAD ribbon with clickable `TTCINFO` and `TTCPALETTE` buttons. | AutoCAD Manual UI Inspection | `NOT_RUN` |
| **AC-F0-04** | **PaletteSet Shell:** Executing `TTCPALETTE` opens a modeless, dockable `PaletteSet` hosting the WPF `StatusControl` view without flickering. | AutoCAD Manual UI Inspection | `NOT_RUN` |
| **AC-F0-05** | **Valid Configuration:** A well-formed `settings.json` deserializes cleanly and reflects `VALID` in `TTCINFO`. | Unit Test / Integration Test | `NOT_RUN` |
| **AC-F0-06** | **Invalid Configuration:** Malformed or missing `settings.json` logs structured warning and safely falls back to defaults without crashing. | Unit Test / Host Negative Test | `NOT_RUN` |
| **AC-F0-07** | **Structured File Logging:** `FileLogger` generates daily rolling log file in `%APPDATA%\TTC_CadTools\Logs\` recording startup and command events. | Unit Test / File Inspection | `NOT_RUN` |
| **AC-F0-08** | **Package Manifest Validation:** `TTC.bundle/PackageContents.xml` conforms to Autodesk Application Package schema with SeriesMin/SeriesMax `R24.2`. | Static Manifest Inspection | `NOT_RUN` |
| **AC-F0-09** | **Decoupling Integrity:** `TTC.CadTools.Core.dll` contains ZERO references to Autodesk assemblies (`AcCoreMgd`, `AcDbMgd`, `AcMgd`). | Static Assembly Reference Inspection | `NOT_RUN` |
| **AC-F0-10** | **Strict Scope Containment:** Zero Panel or M&E production features exist in the F0 codebase. | Static Codebase Audit | `NOT_RUN` |

---

## 10. Verification Matrix

| AC ID | Verification Method | Test Environment | Expected Artifact / Evidence |
|---|---|---|---|
| AC-F0-01 | Host Startup / `NETLOAD` | AutoCAD 2023 | Command line output, loaded assembly list |
| AC-F0-02 | Command Line Execution | AutoCAD 2023 | Editor text screen capture, log file entry |
| AC-F0-03 | Visual Inspection | AutoCAD 2023 | Screenshot of AutoCAD Ribbon tab |
| AC-F0-04 | Interactive Docking / Toggle | AutoCAD 2023 | Screenshot of floating and docked PaletteSet |
| AC-F0-05 | xUnit Test Suite | .NET 4.8 / CI | Test Runner output: `SettingsRepositoryTests.cs` PASS |
| AC-F0-06 | xUnit Test Suite | .NET 4.8 / CI | Test Runner output: `SettingsFallbackTests.cs` PASS |
| AC-F0-07 | File Inspection | Local Machine | Log file text content containing formatted entries |
| AC-F0-08 | XML Schema Check | Static / CI | `PackageContents.xml` validation against Autodesk XSD |
| AC-F0-09 | Assembly Reflection / ILSpy | Static / CI | Assembly reference list showing zero Autodesk DLLs |
| AC-F0-10 | Directory Scan | Static / CI | 0 classes matching Component, Rail, Duct, or Tray |

---

## 11. AutoCAD Reality Boundary

> [!NOTE]
> All AutoCAD host interactions defined herein (`IExtensionApplication` lifecycle, `PaletteSet` dock styling, and `ComponentManager.Ribbon` timing) are:
> - **Status:** `DESIGNED / SPECIFIED / NOT_RUNTIME_VERIFIED`
> - Real host verification will occur strictly during WORK ORDER-authorized BUILD and REVIEW stages inside a physical AutoCAD 2023 instance.

---

## 12. Feature Specification Gate

- [x] Authority and traceability explicitly documented.
- [x] Objective and preconditions defined.
- [x] In Scope and Out of Scope boundaries strictly enforced.
- [x] Assembly and decoupling contracts specified (`TTC.Core` clean).
- [x] Commands `TTCINFO` and `TTCPALETTE` fully specified.
- [x] Configuration schema, resolution order, and fallback defined.
- [x] Structured file logging and directory failover specified.
- [x] Complete negative-case error handling matrix defined.
- [x] Acceptance criteria and verification matrix established (all `NOT_RUN`).
- [x] AutoCAD reality boundary explicitly acknowledged.
- [x] No engineering domain feature creep.

Gate Result: `PASS`
