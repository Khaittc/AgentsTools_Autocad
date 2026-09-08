# Tranche F0: AutoCAD Foundation — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F0.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 8
- **Issues Blocking BUILD Entry:** 0 (All 8 are active implementation/verification tasks during BUILD/REVIEW)
- **Required Closure Gates:**
  - `BUILD_COMPLETION`: 3 (`ISSUE-F0-001`, `ISSUE-F0-006`, `ISSUE-F0-008`)
  - `RUNTIME_ACCEPTANCE`: 5 (`ISSUE-F0-002`, `ISSUE-F0-003`, `ISSUE-F0-004`, `ISSUE-F0-005`, `ISSUE-F0-007`)
- **Resolved Issues:** 0

---

## 2. Historical ID Reconciliation & Cross-Reference Mapping

| Historical ID | Meaning in Source Document | Source File & Section | Canonical Issue ID | Blocks BUILD Entry? | Required Closure Gate | Status |
|---|---|---|---|---|---|---|
| `OQ-F0-01` (Design) | NuGet assembly resolution across workstations | `DESIGN.md` §13 | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | OPEN |
| `OQ-F0-02` (Design) | Ribbon tab refresh when switching workspaces | `DESIGN.md` §13 | **ISSUE-F0-004** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `OQ-F0-03` (Design) | PaletteSet state persistence across sessions | `DESIGN.md` §13 | **ISSUE-F0-005** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `OQ-F0-01` (ExecLog) | AutoCAD reference assembly resolution | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | OPEN |
| `OQ-F0-02` (ExecLog) | Bundle deployment path vs NETLOAD debugging workflow | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-006** | NO | `BUILD_COMPLETION` | OPEN |
| `OQ-F0-03` (ExecLog) | PaletteSet modeless threading & document switching | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-003** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `OQ-F0-04` (ExecLog) | Ribbon creation timing relative to Initialize() | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-007** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `OQ-F0-05` (ExecLog) | Settings file resolution (bundle vs AppData) | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-008** | NO | `BUILD_COMPLETION` | OPEN |
| `OQ-F0-06` (ExecLog) | Fallback log directory when bundle is read-only | `EXECUTION_LOG.md` AG-F0-001 | **ISSUE-F0-002** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `ISSUE-F0-001` (Issues) | AutoCAD 2023 Reference Assembly Resolution Strategy | `ISSUES.md` (initial) | **ISSUE-F0-001** | NO | `BUILD_COMPLETION` | OPEN |
| `ISSUE-F0-002` (Issues) | Plugin Log Directory Permissions in Standard Bundle | `ISSUES.md` (initial) | **ISSUE-F0-002** | NO | `RUNTIME_ACCEPTANCE` | OPEN |
| `ISSUE-F0-003` (Issues) | Modeless PaletteSet Threading & Context Switching | `ISSUES.md` (initial) | **ISSUE-F0-003** | NO | `RUNTIME_ACCEPTANCE` | OPEN |

> **Collision Resolution Note:** Previous drafting used `OQ-F0-01`..`03` in `DESIGN.md` for different topics than in `EXECUTION_LOG.md`. All items have been assigned unique canonical IDs (`ISSUE-F0-001` through `ISSUE-F0-008`) above.

---

## 3. Canonical Issues Register

### ISSUE-F0-001: AutoCAD 2023 Reference Assembly Resolution Strategy
- **Status:** OPEN
- **Severity:** MEDIUM
- **Category:** BUILD
- **Owner:** Implementer / Build Engineer
- **Blocks Entry To BUILD:** NO (Task to be executed during BUILD)
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** Target machines may not have AutoCAD 2023 installed in standard path (`C:\Program Files\Autodesk\AutoCAD 2023\`). Relying on local absolute hints breaks portable developer and CI builds.
- **Proposed Contract / Resolution:** Reference official NuGet package `AutoCAD.NET` (version `24.2.0`) targeting `.NETFramework,Version=v4.8` with `Private=False` (`CopyLocal=False`) and `ExcludeAssets="runtime"`.
- **Evidence Required to Close:** Solution compiles cleanly on clean machine without local AutoCAD installation.

---

### ISSUE-F0-002: Plugin Log Directory Permissions in Standard Bundle Locations
- **Status:** OPEN
- **Severity:** LOW
- **Category:** HOST
- **Owner:** Implementer / Infrastructure Engineer
- **Blocks Entry To BUILD:** NO (Contract defined in Spec; verified during host execution)
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** If `.bundle` is installed in `C:\ProgramData\Autodesk\ApplicationPlugins\` or `C:\Program Files\...`, standard user accounts lack write permissions to `./Contents/Logs/`.
- **Contract Defined:** Primary log directory is `%APPDATA%\TTC_CadTools\Logs\`; fallback is `%TEMP%\TTC_CadTools\Logs\`.
- **Evidence Required to Close:** Runtime test verifying log creation under non-admin user account in AutoCAD 2023.

---

### ISSUE-F0-003: Modeless PaletteSet Threading, Document Context Switching & Zero-Document State Safety
- **Status:** OPEN
- **Severity:** MEDIUM
- **Category:** CAD_API
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO (Design pattern specified; verified during host execution)
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** Modeless WPF views execute on the UI thread. Accessing `MdiActiveDocument` when zero drawings are open or during document switching may cause null references.
- **Contract Defined:** Zero-document state safety. Palette view is strictly diagnostic/read-only in F0 with zero DWG database transactions. It subscribes to `DocumentActivated` and checks `MdiActiveDocument != null` before reading document info. When all drawings are closed (`MdiActiveDocument == null`), it displays "No Active Document" and remains stable without dereferencing `Editor` or creating dummy drawings. Opening a new drawing restores document status without plugin reload. F0 does not claim interactive command-line invocation is available in zero-doc state.
- **Still Runtime-Unverified:**
  - document close/switch events,
  - palette stability in real AutoCAD 2023 host,
  - restoring state when a document opens.
- **Evidence Required to Close:** Interactive host test opening, closing, and switching drawings while Palette is visible (AC-F0-11).

---

### ISSUE-F0-004: Ribbon Tab Refresh Behavior Across AutoCAD Workspaces
- **Status:** OPEN
- **Severity:** LOW
- **Category:** UI
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** When an AutoCAD user switches workspaces (e.g. from *Drafting & Annotation* to *3D Modeling* or *AutoCAD Classic*), the ribbon visual tree can be rebuilt by AutoCAD, potentially discarding dynamically added tabs.
- **Contract Defined:** Listen to AutoCAD workspace change events if needed; in F0 DRAFT, ribbon is constructed on startup or `ItemInitialized`.
- **Evidence Required to Close:** Verify in AutoCAD 2023 whether `TTC CAD` tab remains visible when toggling workspaces.

---

### ISSUE-F0-005: PaletteSet Position and State Persistence Across AutoCAD Sessions
- **Status:** OPEN
- **Severity:** LOW
- **Category:** UI
- **Owner:** Implementer / UI Engineer
- **Blocks Entry To BUILD:** NO
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** Determining whether `PaletteSet` size and dock state persist automatically via AutoCAD's native workspace XML/registry or require explicit plugin settings persistence.
- **Contract Defined:** Rely on AutoCAD's native `PaletteSet` registry persistence via its unique GUID (`4A7A779F-9C3D-4A42-A862-2D5392D6D3A0`).
- **Evidence Required to Close:** Verify dock position is remembered after restarting AutoCAD 2023.

---

### ISSUE-F0-006: Bundle Deployment Path vs Developer Symlink / NETLOAD Workflow
- **Status:** OPEN
- **Severity:** LOW
- **Category:** BUILD
- **Owner:** Build Engineer
- **Blocks Entry To BUILD:** NO (Documentation task during BUILD)
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** During active development, copying assemblies to `%APPDATA%\Autodesk\ApplicationPlugins\` can lock DLLs inside running AutoCAD.
- **Contract Defined:** Support dual workflow: (1) Standard `.bundle` deployment for end-user installation, and (2) Direct `NETLOAD` of debug build output (`bin\Debug\TTC.CadTools.AutoCAD.dll`) for iterative development.
- **Evidence Required to Close:** Documented in developer load instructions in F0 Spec.

---

### ISSUE-F0-007: Ribbon Initialization Timing Relative to IExtensionApplication.Initialize()
- **Status:** OPEN
- **Severity:** MEDIUM
- **Category:** CAD_API
- **Owner:** Implementer
- **Blocks Entry To BUILD:** NO (Contract specified in Spec; verified during host execution)
- **Required Closure Gate:** `RUNTIME_ACCEPTANCE`
- **Problem:** `Autodesk.Windows.ComponentManager.Ribbon` is often null at the exact moment `IExtensionApplication.Initialize()` runs during AutoCAD cold start.
- **Contract Defined:** Check `ComponentManager.Ribbon`. If null, attach to `ComponentManager.ItemInitialized` event and build the tab once the ribbon control initializes; unsubscribe immediately.
- **Evidence Required to Close:** Real AutoCAD 2023 cold-start test showing ribbon tab appears reliably.

---

### ISSUE-F0-008: Settings File Resolution Precedence & Schema Fallback
- **Status:** OPEN
- **Severity:** LOW
- **Category:** CONFIGURATION
- **Owner:** Implementer
- **Blocks Entry To BUILD:** NO (Test task during BUILD)
- **Required Closure Gate:** `BUILD_COMPLETION`
- **Problem:** Resolving configuration when user configuration in `%APPDATA%` does not exist yet.
- **Contract Defined:** Resolution precedence: (1) `%APPDATA%\TTC_CadTools\settings.json`, (2) `<BundleRoot>\Contents\Resources\settings.json`, (3) Hardcoded in-memory fallback.
- **Evidence Required to Close:** Unit tests covering missing and malformed JSON scenarios (`SettingsFallbackTests.cs`).
