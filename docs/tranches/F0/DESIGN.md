# TTC CAD — Architectural Design: Tranche F0 (AutoCAD Foundation)

Status: DRAFT
Design ID: DESIGN-FOUNDATION-F0
Version: 0.1
Owner: TTC CAD Project Owner
Reviewer: Independent Technical Reviewer
Date: 2026-09-08

---

## 1. Authority / Inputs

- Intake: `docs/tranches/F0/INTAKE.md` (`INTAKE-FOUNDATION-F0`)
- Architecture Roadmap: `docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md` (Sections 4, 5, 6, 7, 8, 41)
- Governance Doctrine: `governance/ANTIGRAVITY_INSTRUCTIONS.md` (Sections 2.1, 3, 14–16)
- Decisions Inherited:
  - `TTC-GOV-001`: Spec-First Per Tranche Production Development (`governance/DECISION_LOG.md`)
  - `TTC-GOV-002`: Git-Based Agent Continuity and Handoff Protocol (`governance/DECISION_LOG.md`)
- Target Runtime Baseline: Autodesk AutoCAD 2023, .NET Framework 4.8, C# 10.0

---

## 2. Design Objective

Define the minimal, robust, decoupled production architecture for the AutoCAD 2023 Managed .NET plugin foundation (Tranche F0). This design establishes assembly structure, host lifecycle management, Ribbon and PaletteSet UI shells, configuration loading and validation, structured file logging, and application boundaries without implementing any domain engineering features.

---

## 3. Design Principles

1. **Host Stability & Boundary Isolation:** The plugin must never crash the AutoCAD host process. All entry points (`IExtensionApplication.Initialize`, `[CommandMethod]`, WPF event handlers) must be wrapped in structured exception boundaries.
2. **Strict Decoupling (Clean Architecture):** `TTC.CadTools.Core` must remain pure C# (.NET Framework 4.8 / .NET Standard 2.0 compatible) with **zero** references to AutoCAD assemblies (`AcCoreMgd`, `AcDbMgd`, `AcMgd`).
3. **CopyLocal Discipline:** AutoCAD runtime assemblies must have `Private=False` (`CopyLocal=False`) to prevent DLL version conflicts inside the AutoCAD process memory space.
4. **Standard Package Compliance:** Deployment uses the native Autodesk Application Package format (`.bundle`) with `PackageContents.xml` for clean, multi-user discovery and loading without manual registry hacks.
5. **Deterministic Diagnostics:** Every startup step, configuration read, and command dispatch must be auditable via the diagnostic command `TTCINFO` and structured file logging.

---

## 4. Primary User & Host Workflows

### 4.1 Host Loading & Bootstrap Workflow

```text
AutoCAD 2023 Startup
    ↓
Autodesk Autoloader detects TTC.bundle (PackageContents.xml)
    ↓
AutoCAD loads TTC.CadTools.AutoCAD.dll into AppDomain
    ↓
IExtensionApplication.Initialize() invoked
    ├─> Initialize Logging Infrastructure (File logger in %APPDATA%)
    ├─> Load & Validate Settings (settings.json)
    ├─> Register Commands (TTCINFO, TTCPALETTE)
    ├─> Schedule / Initialize Ribbon Tab Shell (Autodesk.Windows.ComponentManager)
    └─> Log "TTC CAD Plugin Initialized Successfully"
```

### 4.2 Diagnostic Inspection Workflow (`TTCINFO`)

```text
User enters TTCINFO at command line
    ↓
CommandMethod adapter handles execution
    ↓
Query Host Version (Application.Version), Assembly Version, Config Status, Log Path
    ↓
Format diagnostic report string
    ↓
Print to Editor (ed.WriteMessage) and write to Log
```

### 4.3 PaletteSet Shell Interaction Workflow

```text
User executes TTCPALETTE (or clicks Ribbon button)
    ↓
Check if PaletteSet instance exists
    ├─ If null: Instantiate PaletteSet, set style/dock flags, add WPF Status Control Visual
    └─ If exists: Toggle Visible property (Show / Hide)
    ↓
PaletteSet renders modeless WPF view displaying plugin readiness
```

---

## 5. Architecture & Project Boundaries

To avoid over-fragmentation during initial foundation development while strictly honoring the Roadmap's clean dependency direction, F0 establishes three production projects and one unit test project:

```text
production/
├── TTC.CadTools.sln
│
├── TTC.CadTools.Core/               [Class Library — Zero AutoCAD References]
│   ├── Configuration/              (Settings models, validation rules)
│   ├── Logging/                    (ILogger interface, LogLevel enum)
│   ├── Repositories/               (ISettingsRepository, IComponentRepository, ICabinetRepository)
│   └── Common/                     (Result<T>, Error types)
│
├── TTC.CadTools.Infrastructure/     [Class Library — Pure C# / .NET 4.8]
│   ├── Configuration/              (JsonSettingsRepository, FileSystem helpers)
│   └── Logging/                    (FileLogger, StructuredFormatter)
│
├── TTC.CadTools.AutoCAD/            [Class Library — AutoCAD Managed .NET Adapter]
│   ├── Entry/                      (PluginApplication : IExtensionApplication)
│   ├── Commands/                   (InfoCommand, PaletteCommand)
│   ├── UI/                         (RibbonBuilder, PaletteHost, Views/StatusControl.xaml)
│   └── Adapters/                   (AutoCadEditorLogger, HostInfoService)
│
├── TTC.CadTools.Tests/              [xUnit Test Project — .NET Framework 4.8]
│   ├── ConfigurationTests.cs
│   ├── ValidationTests.cs
│   └── LoggingTests.cs
│
└── TTC.CadTools.bundle/             [Autodesk Application Package]
    ├── PackageContents.xml
    └── Contents/
        ├── TTC.CadTools.AutoCAD.dll
        ├── TTC.CadTools.Infrastructure.dll
        ├── TTC.CadTools.Core.dll
        └── Resources/
            ├── settings.json
            └── Icons/
```

### Project Dependency Matrix

| Project | Target Framework | Dependencies | Permitted AutoCAD References |
|---|---|---|---|
| `TTC.CadTools.Core` | .NET Framework 4.8 | None (System only) | **STRICTLY FORBIDDEN** |
| `TTC.CadTools.Infrastructure` | .NET Framework 4.8 | `TTC.CadTools.Core` | **STRICTLY FORBIDDEN** |
| `TTC.CadTools.AutoCAD` | .NET Framework 4.8 | `TTC.CadTools.Core`, `TTC.CadTools.Infrastructure`, PresentationFramework (WPF) | `AcCoreMgd`, `AcDbMgd`, `AcMgd` (Private=False) |
| `TTC.CadTools.Tests` | .NET Framework 4.8 | `TTC.CadTools.Core`, `TTC.CadTools.Infrastructure`, xUnit | None |

---

## 6. AutoCAD Host Integration Design

### 6.1 Plugin Lifecycle (`IExtensionApplication`)

The entry point class `TTC.CadTools.AutoCAD.Entry.PluginApplication` implements `Autodesk.AutoCAD.Runtime.IExtensionApplication`:

```csharp
namespace TTC.CadTools.AutoCAD.Entry
{
    public class PluginApplication : IExtensionApplication
    {
        public static PluginApplication Instance { get; private set; }
        public ILogger Logger { get; private set; }
        public AppSettings Settings { get; private set; }
        public PaletteHost Palette { get; private set; }

        public void Initialize()
        {
            // 1. Safe bootstrap logging
            // 2. Load configuration
            // 3. Setup Ribbon (with deferral if ribbon manager is uninitialized)
            // 4. Initialize PaletteSet shell
        }

        public void Terminate()
        {
            // 1. Dispose PaletteSet
            // 2. Unhook ribbon events
            // 3. Flush and close logger
        }
    }
}
```

### 6.2 Ribbon Initialization Strategy (`Autodesk.Windows`)

- **Timing Challenge:** In AutoCAD, the Ribbon (`Autodesk.Windows.ComponentManager.Ribbon`) may not be constructed at the exact millisecond `Initialize()` is called.
- **Resolution Strategy:**
  1. Inspect `ComponentManager.Ribbon`. If non-null, build ribbon immediately.
  2. If null, subscribe to `ComponentManager.ItemInitialized`. When `ComponentManager.Ribbon` becomes available, build the ribbon and unsubscribe from the event.
- **Ribbon Layout:**
  - Tab ID: `ID_TAB_TTC_CAD`, Text: `TTC CAD`
  - Panel ID: `ID_PANEL_TTC_GENERAL`, Text: `General`
  - PushButton 1: `TTCINFO` (Tooltip: "Display plugin diagnostic health", Command: `_TTCINFO `)
  - PushButton 2: `TTCPALETTE` (Tooltip: "Toggle TTC CAD tool palette", Command: `_TTCPALETTE `)

### 6.3 PaletteSet Lifecycle & UI Safety

- **Class:** `PaletteHost` encapsulates `Autodesk.AutoCAD.Windows.PaletteSet`.
- **Configuration:**
  - Guid: `{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}` (static deterministic GUID).
  - Style: `PaletteSetStyles.ShowAutoHideButton | PaletteSetStyles.ShowCloseButton | PaletteSetStyles.Snappable`.
  - Hosted View: `TTC.CadTools.AutoCAD.UI.Views.StatusControl` (WPF UserControl) added via `paletteSet.AddVisual("Status", wpfControl)`.
- **Modeless Safety Rule:** In Tranche F0, the Palette view is strictly diagnostic / read-only. It queries in-memory status and displays loaded configuration. It executes **zero** AutoCAD database transactions.

---

## 7. Configuration Design

### 7.1 Settings Source & Resolution Hierarchy

1. **User Overrides:** `%APPDATA%\TTC_CadTools\settings.json` (if present).
2. **Bundle Defaults:** `<BundleRoot>\Contents\Resources\settings.json` (fallback).
3. **Built-in In-Memory Defaults:** Embedded hardcoded fallback object in `TTC.CadTools.Core` if all files are missing or unreadable.

### 7.2 Settings Schema (Tranche F0)

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
  },
  "panelDefaults": {
    "note": "Placeholder for future Tranche P1/P2 settings"
  }
}
```

### 7.3 Validation Strategy

- Validate required properties (`schemaVersion`, `logging.logLevel`).
- If validation fails: Log structured warning, retain in-memory default configuration, flag `ConfigurationStatus = "WARNING: Malformed settings, using defaults"` for `TTCINFO` display.

---

## 8. Structured Logging Design

### 8.1 Architecture

- Interface: `TTC.CadTools.Core.Logging.ILogger`
  - Methods: `Debug(string message)`, `Info(string message)`, `Warn(string message)`, `Error(string message, Exception ex = null)`
- Implementation: `TTC.CadTools.Infrastructure.Logging.FileLogger`
- Format: `[YYYY-MM-DD HH:mm:ss.fff] [LEVEL] [THREAD_ID] Message | ExceptionDetails`
- File Rollover: Daily log file named `ttc_cad_{yyyyMMdd}.log`.
- Default Directory: `%APPDATA%\TTC_CadTools\Logs\`. If directory creation fails (e.g. permission error), fallback to `%TEMP%\TTC_CadTools\Logs\`.

### 8.2 AutoCAD Host Output Adapter

- An adapter `AutoCadEditorLogger` decorates or listens to `ILogger` and writes critical errors (`Warn`, `Error`) directly to the AutoCAD Command Line via `Application.DocumentManager.MdiActiveDocument.Editor.WriteMessage` when an active document is present.

---

## 9. Diagnostic Health Command (`TTCINFO`)

### 9.1 Specification

- **Command:** `TTCINFO`
- **Flags:** `CommandFlags.Modal | CommandFlags.Session`
- **Requires Active Document:** NO (can run even when no DWG is open, querying `Application.DocumentManager`).
- **Output Format:**
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

---

## 10. Packaging & Deployment Design (`.bundle`)

### 10.1 Package Layout

```text
TTC.bundle/
├── PackageContents.xml
└── Contents/
    ├── TTC.CadTools.AutoCAD.dll
    ├── TTC.CadTools.Infrastructure.dll
    ├── TTC.CadTools.Core.dll
    └── Resources/
        ├── settings.json
        └── Icons/
            ├── TTCInfo_16.png
            ├── TTCInfo_32.png
            ├── TTCPalette_16.png
            └── TTCPalette_32.png
```

### 10.2 PackageContents.xml Manifest Contract

```xml
<?xml version="1.0" encoding="utf-8"?>
<ApplicationPackage 
    SchemaVersion="1.0" 
    AppVersion="1.0.0" 
    Author="TTC" 
    ProductCode="{9B890F57-96A1-4775-9D22-4D3C5C60C03A}" 
    Name="TTC CAD Engineering Tools" 
    Description="TTC AutoCAD Engineering Automation Plugin"
    Icon="./Contents/Resources/Icons/TTC_32.png">
    
    <CompanyDetails Name="TTC" />
    
    <Components Description="AutoCAD 2023 Managed Plugin Components">
        <RuntimeRequirements OS="Win64" Platform="AutoCAD*" SeriesMin="R24.2" SeriesMax="R24.2" />
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
    </Components>
</ApplicationPackage>
```

---

## 11. Failure Modes & Graceful Degradation

| Failure ID | Condition | Host Impact | User Feedback | Log Entry | Recovery Action |
|---|---|---|---|---|---|
| F-F0-01 | `settings.json` missing | None | "Warning: Configuration not found; defaults applied." | `WARN: settings.json missing, using fallback defaults` | Fallback to in-memory configuration |
| F-F0-02 | `settings.json` corrupt JSON | None | "Warning: Configuration corrupt; defaults applied." | `ERROR: JSON deserialization error: {details}` | Fallback to in-memory configuration |
| F-F0-03 | Log directory write-protected | None | None | Attempt stderr / Temp log | Fallback to `%TEMP%\TTC_CadTools\Logs\` |
| F-F0-04 | Ribbon Manager uninitialized | None | Ribbon button delayed | `INFO: Ribbon uninitialized; subscribed to ItemInitialized` | Deferred ribbon construction on event |
| F-F0-05 | No active document on `TTCINFO` | None | Prints to command line via session context | `INFO: TTCINFO executed in zero-doc state` | Executes cleanly via `CommandFlags.Session` |
| F-F0-06 | `IExtensionApplication.Initialize()` unhandled exception | Trapped | "TTC CAD failed to initialize. See log for details." | `FATAL: Unhandled startup exception: {stackTrace}` | Aborts plugin init without crashing AutoCAD |

---

## 12. Design Decisions

| Decision ID | Topic | Selected Option | Rationale | Status |
|---|---|---|---|---|
| D-F0-01 | Assembly References | NuGet `AutoCAD.NET 24.2.0` with `Private=False` | Portable build on all workstations without local AutoCAD directory path dependencies. | **PROPOSED** |
| D-F0-02 | Logging Implementation | Custom lightweight file logger in `TTC.Infrastructure` | Zero external third-party dependencies (eliminates assembly binding redirect headaches inside AutoCAD). | **PROPOSED** |
| D-F0-03 | Palette UI Stack | Modeless WPF hosted in `PaletteSet` | Matches Roadmap tech stack; clean MVVM separation for future tranches. | **PROPOSED** |
| D-F0-04 | Command Flags | `CommandFlags.Session` for `TTCINFO` | Allows execution even when no drawing document is open (zero-doc state). | **PROPOSED** |

---

## 13. Open Questions (Must Validate During F0 Build)

- `OQ-F0-01`: AutoCAD 2023 NuGet assembly package compatibility across all developer machine MSBuild setups.
- `OQ-F0-02`: Exact Ribbon tab refresh behavior when switching AutoCAD workspaces (Drafting & Annotation vs Classic).
- `OQ-F0-03`: PaletteSet position and state persistence across AutoCAD sessions (AutoCAD native registry persistence vs plugin settings).

---

## 14. Design Acceptance Gate

- [x] Intake is approved (`INTAKE-FOUNDATION-F0`).
- [x] Clean architecture boundaries strictly isolate AutoCAD references from `TTC.CadTools.Core`.
- [x] Host lifecycle (`IExtensionApplication`, Ribbon, PaletteSet) defined with graceful degradation.
- [x] Configuration resolution hierarchy and fallback mechanisms specified.
- [x] File logging infrastructure and failure paths designed.
- [x] Diagnostic command (`TTCINFO`) contract specified.
- [x] Autodesk `.bundle` packaging manifest specified.
- [x] Zero engineering domain logic included.

Gate Result: `PASS`
