# TTC CAD — Feature Specification: Tranche F0 (AutoCAD Foundation)

Status: DRAFT / READY_FOR_REVIEW
Tranche ID: F0
Module: FOUNDATION
Capability: AutoCAD Foundation
Feature ID: SPEC-FOUNDATION-F0-001
Feature Name: AutoCAD 2023 Managed .NET Plugin Shell & Diagnostic Infrastructure
Command(s): `TTCINFO`, `TTCPALETTE`
Version: 0.1.1

Depends On: Product Baseline
Inherits From: None (Root Technical Tranche)
Entry Stage: DESIGN (`docs/tranches/F0/DESIGN.md`)
Previous Frozen Baseline: None

Product Owner: TTC CAD Project Owner
Reviewer: Independent Technical Reviewer
Date: 2026-09-08

Open Issues & Questions: 8 canonical issues registered in [`docs/tranches/F0/ISSUES.md`](./ISSUES.md) (0 blocking SPEC_FREEZE)
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
- Review Result & Addendum: `docs/tranches/F0/REVIEW.md` (`REV-F0-001`)
- API Verification Evidence: `docs/tranches/F0/API_VERIFICATION.md` (SRC-01 to SRC-06)
- Canonical Issue Registry: `docs/tranches/F0/ISSUES.md` (`ISSUE-F0-001` to `ISSUE-F0-008`)
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
- Foundation repository interface: `ISettingsRepository` (`IComponentRepository` and `ICabinetRepository` are deferred to P1).
- Autoloader bundle: `TTC.CadTools.bundle` with valid `PackageContents.xml`.
- Structured negative-case error handling preventing AutoCAD host crashes.

---

## 5. Out of Scope / Non-Goals

- **NO Domain Repositories in F0:** Component Library repository (`IComponentRepository`), Cabinet Library repository (`ICabinetRepository`), and Cable Tray repository (`ITrayLibraryRepository`) are strictly deferred to owning tranches (P1, M1).
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
- **Command Discovery:** AutoCAD Managed runtime automatically discovers `[CommandMethod]` attributes across the loaded assembly. Manual command registration inside `Initialize()` is unnecessary and not performed.
- **Method `Initialize()`:**
  1. Wrap all logic in top-level `try ... catch (Exception ex)`.
  2. Enforce idempotency: if already initialized, return immediately.
  3. Initialize `FileLogger`. If fails, fall back to `%TEMP%\TTC_CadTools\Logs\`.
  4. Load `settings.json`. If missing or invalid, load default in-memory settings and log warning.
  5. Inspect `Autodesk.Windows.ComponentManager.Ribbon`. If available, call `RibbonBuilder.Build()`. If null, subscribe to `ComponentManager.ItemInitialized`.
  6. Log `INFO: TTC CAD Plugin Initialized Successfully`.
  7. Return cleanly; **never** re-throw unhandled exceptions into AutoCAD startup pipeline.
- **Method `Terminate()`:**
  1. Wrap in `try ... catch`.
  2. Dispose `PaletteSet` instance if instantiated.
  3. Flush and dispose file logger.

### 6.3 Command Contract: `TTCINFO`

| Command | Context / Flags | Active Document? | Output Channel | Drawing Mutation | Failure Behavior | Verification |
|---|---|---|---|---|---|---|
| `TTCINFO` | `CommandFlags.Session \| CommandFlags.Modal` | Optional (YES / NO) | Active Doc: `Editor.WriteMessage`<br>Zero-Doc: File Log + `Application.ShowAlertDialog` | None (0) | Trapped, fallback dialog, log error | AC-F0-02, AC-F0-11 |

- **Method:** `[CommandMethod("TTCINFO", CommandFlags.Session | CommandFlags.Modal)]`
- **Class:** `TTC.CadTools.AutoCAD.Commands.InfoCommand`
- **Requires Active Document:** NO (`CommandFlags.Session` allows execution in zero-document state).
- **Prompt Sequence:** None (parameterless execution).
- **Output Channel Strategy (FINDING-03):**
  - **Case A: Active Document Present (`MdiActiveDocument != null`):** Output formatted report text directly to AutoCAD command window via `Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage()`.
  - **Case B: Zero-Document State (`MdiActiveDocument == null`):** `Editor` does not exist. The command writes the full diagnostic report to the active log file, and displays a summary dialog to the user via `Autodesk.AutoCAD.ApplicationServices.Application.ShowAlertDialog()`. The command **never** creates a dummy drawing just to output text, and **never** dereferences `Editor` when null.
  - **Integrity Rule:** The report must only state the log file was written if the file write actually succeeded.
- **Report Template:**
  ```text
  ======================================================
  TTC CAD Engineering Tools — System Health Report
  ======================================================
  AutoCAD Host Version:  24.2 (AutoCAD 2023)
  Plugin Assembly:       1.0.0.0 (F0 Foundation)
  CLR Runtime:           4.0.30319.42000 (.NET 4.8)
  Configuration Status:  VALID (Source: AppData)
  Active Log File:       C:\Users\...\AppData\Roaming\TTC_CadTools\Logs\ttc_cad_20260908.log
  PaletteSet Shell:      Initialized (Hidden)
  Ribbon Shell:          Active (Tab: TTC CAD)
  Repository Status:     ISettingsRepository [READY]
                         IComponentRepository [DEFERRED TO P1]
                         ICabinetRepository [DEFERRED TO P1]
  ======================================================
  ```

### 6.4 Command Contract: `TTCPALETTE`

| Command | Context / Flags | Active Document? | Output Channel | Drawing Mutation | Failure Behavior | Verification |
|---|---|---|---|---|---|---|
| `TTCPALETTE` | `CommandFlags.Session \| CommandFlags.Modal` | Optional (YES / NO) | `PaletteSet` dockable window (WPF) | None (0) | Trapped, log error | AC-F0-04, AC-F0-11, AC-F0-12 |

- **Method:** `[CommandMethod("TTCPALETTE", CommandFlags.Session | CommandFlags.Modal)]`
- **Class:** `TTC.CadTools.AutoCAD.Commands.PaletteCommand`
- **Requires Active Document:** NO (enabled in zero-document state).
- **Singleton Lifecycle:**
  1. If `PaletteHost.Instance` is null, instantiate `PaletteSet` with deterministic GUID `{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}` and Title `"TTC CAD Tools"`.
  2. Set styles: `ShowAutoHideButton | ShowCloseButton | Snappable`.
  3. Add WPF element `StatusControl` via 3-parameter overload:
     `paletteSet.AddVisual("Status", new StatusControl(), true);`
  4. If `PaletteHost.Instance` already exists, toggle visibility: `paletteSet.Visible = !paletteSet.Visible`. Repeated invocations never instantiate multiple palette sets.
- **AddVisual Overload & Resize Contract (FINDING-01 Addendum):**
  - Autodesk Managed Reference Guide confirms `PaletteSet` exposes both 2-parameter and 3-parameter overloads.
  - Contract: `paletteSet.AddVisual(string name, Visual visual, bool bResizeContentToPaletteSize)`
  - Parameter values: `name = "Status"`, `visual = new StatusControl()`, `bResizeContentToPaletteSize = true`.
  - **Resize Behavior:** When `bResizeContentToPaletteSize` is `true`, the child WPF element automatically scales with palette container resizing and docking, preventing clipped controls without custom Win32 resize messages.
- **Document Switching & Zero-Document Behavior:**
  - Subscribes to `DocumentManager.DocumentActivated`.
  - If a drawing is active, the status view displays the active drawing title.
  - If all drawings are closed (`MdiActiveDocument == null`), the status view displays "No Active Document" without throwing null reference exceptions.
  - Zero drawing database transactions are executed.

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

- **Root Bundle Directory:** `TTC.CadTools.bundle`
- **Root tag:** `<ApplicationPackage SchemaVersion="1.0" ...>`
- **Series requirement:** `SeriesMin="R24.2" SeriesMax="R24.2"` (strictly targeting AutoCAD 2023).
- **Component entry:**
  ```xml
  <ComponentEntry
      AppName="TTC.CadTools"
      ModuleName="./Contents/TTC.CadTools.AutoCAD.dll"
      AppDescription="TTC CAD Foundation Plugin"
      LoadOnAutoCADStartup="True">
      <Commands GroupName="TTC_COMMANDS">
          <Command Global="TTCINFO" Local="TTCINFO" />
          <Command Global="TTCPALETTE" Local="TTCPALETTE" />
      </Commands>
  </ComponentEntry>
  ```
- **Load Policy Rationale (FINDING-02 Addendum):**
  - `LoadOnAutoCADStartup="True"` is an officially supported attribute in AutoCAD 2023 (SRC-03).
  - Selected for F0 to ensure the `TTC CAD` Ribbon tab shell is constructed on host boot without requiring prior command invocation.
  - `<Commands>` block registers global command names in AutoCAD's command dictionary for auto-completion.

---

## 7. Negative Cases & Error Handling Matrix

| Case ID | Scenario / Condition | Mutation Allowed? | User Feedback | Log Requirement | Recovery / Stop Behavior |
|---|---|---|---|---|---|
| NEG-F0-01 | `settings.json` file missing on disk | NO | "TTC CAD: Configuration not found; running with standard defaults." | `WARN: settings.json not found. Applied in-memory defaults.` | Load default settings; continue plugin execution |
| NEG-F0-02 | `settings.json` contains malformed JSON syntax | NO | "TTC CAD: Configuration corrupted; standard defaults applied." | `ERROR: JSON parse failed: {details}. Applied defaults.` | Load default settings; continue plugin execution |
| NEG-F0-03 | `settings.json` has missing/invalid required fields | NO | "TTC CAD: Invalid configuration values; standard defaults applied." | `WARN: Validation failed: {field}. Applied defaults.` | Load default settings; continue plugin execution |
| NEG-F0-04 | `%APPDATA%\TTC_CadTools\Logs\` is read-only / unauthorized | NO | None (silent fallback) | None in primary log; record in fallback log | Fallback to `%TEMP%\TTC_CadTools\Logs\` |
| NEG-F0-05 | AutoCAD Ribbon not yet loaded when plugin initializes | NO | None (deferred creation) | `INFO: Ribbon not ready; deferred to ComponentManager.ItemInitialized.` | Subscribes to event; builds ribbon when ready |
| NEG-F0-06 | `TTCINFO` executed with zero drawings open | NO | Modal alert dialog (`Application.ShowAlertDialog`) | `INFO: TTCINFO executed in zero-document state; dialog displayed` | Executes cleanly via `CommandFlags.Session`; no Editor access |
| NEG-F0-07 | Duplicate `Initialize()` call triggered | NO | None | `WARN: Initialize() called on already initialized plugin instance.` | Ignore second call; idempotent return |
| NEG-F0-08 | Unhandled exception inside `Initialize()` | NO | "TTC CAD failed to start cleanly. Diagnostic log written." | `FATAL: Unhandled exception during plugin startup: {ex}` | Traps exception; prevents AutoCAD host crash |
| NEG-F0-09 | Plugin loaded into unsupported AutoCAD version (< R24.2) | NO | "TTC CAD is certified for AutoCAD 2023 only." | `ERROR: Unsupported host version detected: {version}.` | Package autoloader rejects; manual load logs error |
| NEG-F0-10 | `TTCPALETTE` executed with zero drawings open | NO | Palette window opens displaying "No Active Document" | `INFO: TTCPALETTE toggled in zero-document state` | Executes cleanly; zero DWG transactions |
| NEG-F0-11 | Active drawing closed while PaletteSet is visible | NO | Palette view updates to "No Active Document" | `INFO: Active document closed; palette updated` | Handled via DocumentDestroyed event; 0 crash |
| NEG-F0-12 | Repeated execution of `TTCPALETTE` command | NO | Toggles visibility of existing palette window | `INFO: TTCPALETTE toggled existing instance visibility` | Singleton instance preserved; no duplicate windows |

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
| **AC-F0-02** | **Diagnostic Command (`TTCINFO`):** Executing `TTCINFO` outputs host version, assembly version, CLR runtime, configuration status, log file path (to Command Line when active doc present, or via Alert Dialog and file log when zero-doc). | AutoCAD Integration Test / Output Inspection | `NOT_RUN` |
| **AC-F0-03** | **Ribbon Shell:** `TTC CAD` tab and `General` panel appear in the AutoCAD ribbon with clickable `TTCINFO` and `TTCPALETTE` buttons. | AutoCAD Manual UI Inspection | `NOT_RUN` |
| **AC-F0-04** | **PaletteSet Shell:** Executing `TTCPALETTE` opens a modeless, dockable `PaletteSet` hosting the WPF `StatusControl` view using 3-parameter `AddVisual(name, visual, true)` with automatic content resizing. | AutoCAD Manual UI Inspection | `NOT_RUN` |
| **AC-F0-05** | **Valid Configuration:** A well-formed `settings.json` deserializes cleanly and reflects `VALID` in `TTCINFO`. | Unit Test / Integration Test | `NOT_RUN` |
| **AC-F0-06** | **Invalid Configuration:** Malformed or missing `settings.json` logs structured warning and safely falls back to defaults without crashing. | Unit Test / Host Negative Test | `NOT_RUN` |
| **AC-F0-07** | **Structured File Logging:** `FileLogger` generates daily rolling log file in `%APPDATA%\TTC_CadTools\Logs\` recording startup and command events. | Unit Test / File Inspection | `NOT_RUN` |
| **AC-F0-08** | **Package Manifest Validation:** `TTC.CadTools.bundle/PackageContents.xml` conforms to Autodesk Application Package schema with SeriesMin/SeriesMax `R24.2` and startup load policy. | Static Manifest Inspection | `NOT_RUN` |
| **AC-F0-09** | **Decoupling Integrity:** `TTC.CadTools.Core.dll` contains ZERO references to Autodesk assemblies (`AcCoreMgd`, `AcDbMgd`, `AcMgd`). | Static Assembly Reference Inspection | `NOT_RUN` |
| **AC-F0-10** | **Strict Scope Containment:** Zero Panel or M&E production features exist in the F0 codebase; domain repositories deferred to P1/M1. | Static Codebase Audit | `NOT_RUN` |
| **AC-F0-11** | **Zero-Document & Context Switching Safety:** `TTCINFO` and `TTCPALETTE` execute cleanly without exceptions when zero drawings are open and during document switching. | AutoCAD Manual Test / Zero-Doc Host Test | `NOT_RUN` |
| **AC-F0-12** | **Palette Idempotency & Singleton Lifecycle:** Repeated execution of `TTCPALETTE` toggles visibility of the single palette instance without creating duplicate windows. | AutoCAD Manual UI Test | `NOT_RUN` |

---

## 10. Verification Matrix

| AC ID | Verification Method | Test Environment | Expected Artifact / Evidence |
|---|---|---|---|
| AC-F0-01 | Host Startup / `NETLOAD` | AutoCAD 2023 | Command line output, loaded assembly list |
| AC-F0-02 | Command Line Execution (Active Doc & Zero-Doc) | AutoCAD 2023 | Editor text screen capture, dialog capture, log entry |
| AC-F0-03 | Visual Inspection | AutoCAD 2023 | Screenshot of AutoCAD Ribbon tab |
| AC-F0-04 | Interactive Docking / Toggle / Resize | AutoCAD 2023 | Screenshot of floating, docked, and resized PaletteSet |
| AC-F0-05 | xUnit Test Suite | .NET 4.8 / CI | Test Runner output: `SettingsRepositoryTests.cs` PASS |
| AC-F0-06 | xUnit Test Suite | .NET 4.8 / CI | Test Runner output: `SettingsFallbackTests.cs` PASS |
| AC-F0-07 | File Inspection | Local Machine | Log file text content containing formatted entries |
| AC-F0-08 | XML Schema Check | Static / CI | `PackageContents.xml` validation against Autodesk XSD |
| AC-F0-09 | Assembly Reflection / ILSpy | Static / CI | Assembly reference list showing zero Autodesk DLLs |
| AC-F0-10 | Directory Scan | Static / CI | 0 classes matching Component, Rail, Duct, or Tray |
| AC-F0-11 | Zero-Doc & Multi-Doc Execution | AutoCAD 2023 | Host behavior when closing last drawing and switching drawings |
| AC-F0-12 | Repeated Invocation Test | AutoCAD 2023 | Single palette instance verified in AutoCAD UI inspector |

---

## 11. AutoCAD Reality Boundary

> [!NOTE]
> All AutoCAD host interactions defined herein (`IExtensionApplication` lifecycle, `PaletteSet` dock styling, `AddVisual` resize behavior, and `ComponentManager.Ribbon` timing) are:
> - **Status:** `DESIGNED / SPECIFIED / NOT_RUNTIME_VERIFIED`
> - Real host verification will occur strictly during WORK ORDER-authorized BUILD and REVIEW stages inside a physical AutoCAD 2023 instance.

---

## 12. Feature Specification Gate

- [x] Authority and traceability explicitly documented.
- [x] Objective and preconditions defined.
- [x] In Scope and Out of Scope boundaries strictly enforced.
- [x] Assembly and decoupling contracts specified (`TTC.Core` clean).
- [x] Commands `TTCINFO` and `TTCPALETTE` fully specified with zero-doc output channels.
- [x] 3-parameter `AddVisual` resize contract specified (FINDING-01).
- [x] Autoloader manifest and startup load policy documented (FINDING-02).
- [x] Configuration schema, resolution order, and fallback defined.
- [x] Structured file logging and directory failover specified.
- [x] Complete negative-case error handling matrix defined (NEG-F0-01 to NEG-F0-12).
- [x] Acceptance criteria and verification matrix established (AC-F0-01 to AC-F0-12, all `NOT_RUN`).
- [x] AutoCAD reality boundary explicitly acknowledged.
- [x] No engineering domain feature creep; domain repositories deferred to P1/M1.

Gate Result: `PASS`
