# Tranche F0: AutoCAD Foundation — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F0.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 8
- **Issues Blocking BUILD Entry:** 0
- **Required Closure Gates:**
  - `BUILD_COMPLETION`: 3 (`ISSUE-F0-001`, `ISSUE-F0-006`, `ISSUE-F0-008`) — ALL 3 CLOSED
  - `RUNTIME_ACCEPTANCE`: 5:
    - `ISSUE-F0-003`, `ISSUE-F0-004`, `ISSUE-F0-005`, `ISSUE-F0-007` — RESOLVED (`PRODUCT_OWNER_MANUAL_DESKTOP_AUTOCAD_2023`)
    - `ISSUE-F0-002` — `AUTOMATED_FALLBACK_VERIFIED` (`RUNTIME_FALLBACK_NOT_RUN_ON_HOST`)
- **Resolved / Closed Issues:** 8 (100% addressed across build & runtime gates)

---

## 2. Historical ID Reconciliation & Cross-Reference Mapping

| Historical ID | Meaning in Source Document | Source File & Section | Canonical Issue ID | Blocks BUILD Entry? | Required Closure Gate | Status |
|---|---|---|---|---|---|---|
| `OQ-F0-01` (Design) | NuGet assembly resolution across workstations | `DESIGN.md` §13 | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | **CLOSED** |
| `OQ-F0-02` (Design) | Ribbon tab refresh when switching workspaces | `DESIGN.md` §13 | **ISSUE-F0-004** | NO | `RUNTIME_ACCEPTANCE` | **RESOLVED_DESKTOP_VERIFIED** |
| `OQ-F0-03` (Design) | PaletteSet state persistence across sessions | `DESIGN.md` §13 | **ISSUE-F0-005** | NO | `RUNTIME_ACCEPTANCE` | **RESOLVED_DESKTOP_VERIFIED** |
| `OQ-F0-01` (ExecLog) | AutoCAD reference assembly resolution | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | **CLOSED** |
| `OQ-F0-02` (ExecLog) | Bundle deployment path vs NETLOAD debugging workflow | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-006** | NO | `BUILD_COMPLETION` | **CLOSED** |
| `OQ-F0-03` (ExecLog) | PaletteSet modeless threading & document switching | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-003** | NO | `RUNTIME_ACCEPTANCE` | **RESOLVED_DESKTOP_VERIFIED** |
| `OQ-F0-04` (ExecLog) | Ribbon creation timing relative to Initialize() | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-007** | NO | `RUNTIME_ACCEPTANCE` | **RESOLVED_DESKTOP_VERIFIED** |
| `OQ-F0-05` (ExecLog) | Settings file resolution (bundle vs AppData) | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-008** | NO | `BUILD_COMPLETION` | **CLOSED** |
| `OQ-F0-06` (ExecLog) | Fallback log directory when bundle is read-only | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-002** | NO | `RUNTIME_ACCEPTANCE` | **AUTOMATED_FALLBACK_VERIFIED** |
| `ISSUE-F0-001` (Issues) | AutoCAD 2023 Reference Assembly Resolution Strategy | `ISSUES.md` (initial) | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | **CLOSED** |
| `ISSUE-F0-002` (Issues) | Plugin Log Directory Permissions in Standard Bundle | `ISSUES.md` (initial) | **ISSUE-F0-002** | NO | `RUNTIME_ACCEPTANCE` | **AUTOMATED_FALLBACK_VERIFIED** |
| `ISSUE-F0-003` (Issues) | Modeless PaletteSet Threading & Context Switching | `ISSUES.md` (initial) | **ISSUE-F0-003** | NO | `RUNTIME_ACCEPTANCE` | **RESOLVED_DESKTOP_VERIFIED** |

> **Collision Resolution Note:** Previous drafting used `OQ-F0-01`..`03` in `DESIGN.md` for different topics than in `EXECUTION_LOG.md`. All items have been assigned unique canonical IDs (`ISSUE-F0-001` through `ISSUE-F0-008`) above.

---

## 3. Canonical Issues Register

### ISSUE-F0-001: AutoCAD 2023 Reference Assembly Resolution Strategy
- **Status:** CLOSED (BUILD_COMPLETION)
- **Severity:** MEDIUM
- **Category:** BUILD
- **Owner:** Implementer / Build Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** Target machines may not have AutoCAD 2023 installed in standard path (`C:\Program Files\Autodesk\AutoCAD 2023\`). Relying on local absolute hints breaks portable developer and CI builds.
- **Resolution:** Referenced official NuGet package `AutoCAD.NET` (version `24.2.0`) targeting `.NETFramework,Version=v4.8` with `PrivateAssets="All"` and `ExcludeAssets="runtime"`. Zero host DLLs are copied to output directories or committed to repository.
- **Closure Evidence:** Solution compiles cleanly with MSBuild/dotnet CLI without local reference paths; 20/20 tests pass in `TTC.CadTools.sln`.

---

### ISSUE-F0-002: Plugin Log Directory Permissions in Standard Bundle Locations
- **Status:** AUTOMATED_FALLBACK_VERIFIED (RUNTIME_FALLBACK_NOT_RUN_ON_HOST)
- **Severity:** LOW
- **Category:** HOST
- **Owner:** Implementer / Infrastructure Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** If `.bundle` is installed in `C:\ProgramData\Autodesk\ApplicationPlugins\` or `C:\Program Files\...`, standard user accounts lack write permissions to `./Contents/Logs/`.
- **Resolution:** `FileLogger` defaults to user-writable `%APPDATA%\TTC_CadTools\Logs\ttc_cad_yyyyMMdd.log` and automatically falls back to `%TEMP%\TTC_CadTools\Logs\` if `%APPDATA%` is inaccessible.
- **Closure Evidence:** Automated unit test `FileLoggerTests.PrimaryInaccessible_FallsBackToTempDirectory` verified directory fallback to `%TEMP%`. Primary user-path logging verified on AutoCAD 2023 host writing to `%APPDATA%\TTC_CadTools\Logs\ttc_cad_yyyyMMdd.log`. Real host runtime permission-block fallback not exercised on host environment; marked `AUTOMATED_FALLBACK_VERIFIED (RUNTIME_FALLBACK_NOT_RUN_ON_HOST)`.

---

### ISSUE-F0-003: Modeless PaletteSet Threading, Document Context Switching & Zero-Document State Safety
- **Status:** RESOLVED_DESKTOP_VERIFIED (RUNTIME_ACCEPTANCE)
- **Severity:** MEDIUM
- **Category:** CAD_API
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** Modeless WPF views execute on the UI thread. Accessing `MdiActiveDocument` when zero drawings are open or during document switching may cause null references.
- **Resolution:** Implemented `PaletteHost` singleton subscribing to `DocumentActivated`, `DocumentDestroyed`, `DocumentCreated`, and `DocumentToBeDeactivated`. Implemented headless console guard (`PluginApplication.IsCoreConsole`) preventing unhandled WPF/HWND exceptions in console mode. Zero-document state transitions verified with zero null dereferences and zero dummy drawings created.
- **Closure Evidence:** `PRODUCT_OWNER_MANUAL_DESKTOP_AUTOCAD_2023` confirmed palette active-document state display, close-last-drawing zero-document state ("No Active Document"), and document reopening restoration without plugin reload. Headless core console execution (`accoreconsole.exe`) verified zero-document transition log entry `[INFO] Last document closed; PaletteSet transitioned to zero-document state.` during host shutdown.

---

### ISSUE-F0-004: Ribbon Tab Refresh Behavior Across AutoCAD Workspaces
- **Status:** RESOLVED_DESKTOP_VERIFIED (RUNTIME_ACCEPTANCE)
- **Severity:** LOW
- **Category:** UI
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** When an AutoCAD user switches workspaces (e.g. from *Drafting & Annotation* to *3D Modeling* or *AutoCAD Classic*), the ribbon visual tree can be rebuilt by AutoCAD, potentially discarding dynamically added tabs.
- **Resolution:** Subscribed to `Application.SystemVariableChanged` for the `WSCURRENT` variable. When workspace change occurs, `RibbonHost.CreateRibbonShell()` verifies tab existence and reinstates the `TTC CAD` tab and `General` panel idempotently.
- **Closure Evidence:** `PRODUCT_OWNER_MANUAL_DESKTOP_AUTOCAD_2023` confirmed workspace switching retains and restores the `TTC CAD` tab in desktop AutoCAD 2023 UI.

---

### ISSUE-F0-005: PaletteSet Position and State Persistence Across AutoCAD Sessions
- **Status:** RESOLVED_DESKTOP_VERIFIED (RUNTIME_ACCEPTANCE)
- **Severity:** LOW
- **Category:** UI
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** Determining whether `PaletteSet` size and dock state persist automatically via AutoCAD's native workspace XML/registry or require explicit plugin settings persistence.
- **Resolution:** Configured unique GUID `{4A7A779F-9C3D-4A42-A862-2D5392D6D3A0}` on `PaletteSet` singleton with styles `ShowAutoHideButton | ShowCloseButton | Snappable`. AutoCAD automatically persists dock state, position, and sizing under this GUID in the user's profile registry.
- **Closure Evidence:** `PRODUCT_OWNER_MANUAL_DESKTOP_AUTOCAD_2023` confirmed Palette docking, floating, resizing, and position persistence across AutoCAD 2023 restarts.

---

### ISSUE-F0-006: Bundle Deployment Path vs Developer Symlink / NETLOAD Workflow
- **Status:** CLOSED (BUILD_COMPLETION)
- **Severity:** LOW
- **Category:** BUILD
- **Owner:** Build Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** During active development, copying assemblies to `%APPDATA%\Autodesk\ApplicationPlugins\` can lock DLLs inside running AutoCAD.
- **Resolution:** Fully documented dual developer workflow in `production/README.md`: (1) Direct `NETLOAD` of build output (`bin\Release\TTC.CadTools.AutoCAD.dll`) for iterative dev/test, and (2) Standard `.bundle` directory staging for end-user deployment and autoloading.
- **Closure Evidence:** Both workflows verified and documented in `production/README.md`.

---

### ISSUE-F0-007: Ribbon Initialization Timing Relative to IExtensionApplication.Initialize()
- **Status:** RESOLVED_DESKTOP_VERIFIED (RUNTIME_ACCEPTANCE)
- **Severity:** MEDIUM
- **Category:** CAD_API
- **Owner:** Implementer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** `Autodesk.Windows.ComponentManager.Ribbon` is often null at the exact moment `IExtensionApplication.Initialize()` runs during AutoCAD cold start.
- **Resolution:** `RibbonHost.Initialize` checks `ComponentManager.Ribbon`. If null, defers ribbon construction by attaching to `ComponentManager.ItemInitialized`. Once the ribbon control is initialized by AutoCAD, builds the tab and immediately unsubscribes.
- **Closure Evidence:** `PRODUCT_OWNER_MANUAL_DESKTOP_AUTOCAD_2023` confirmed `TTC CAD` ribbon tab visible across 5 consecutive full AutoCAD 2023 cold restarts without manual NETLOAD (5/5 PASS, stability verified). Headless console execution verified clean deferral without unhandled timing exceptions.

---

### ISSUE-F0-008: Settings File Resolution Precedence & Schema Fallback
- **Status:** CLOSED (BUILD_COMPLETION)
- **Severity:** LOW
- **Category:** CONFIGURATION
- **Owner:** Implementer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** Resolving configuration when user configuration in `%APPDATA%` does not exist yet.
- **Resolution:** `JsonSettingsRepository` implements 3-tier precedence: (1) `%APPDATA%\TTC_CadTools\settings.json`, (2) `<BundleRoot>\Contents\Resources\settings.json`, (3) In-memory hardcoded defaults.
- **Closure Evidence:** Verified by 7 passing unit tests in `SettingsRepositoryTests.cs`, 4 tests in `ConfigurationWarningTests.cs`, and real AutoCAD 2023 host execution log confirming `Configuration Status: VALID (Source: Bundle)`.
