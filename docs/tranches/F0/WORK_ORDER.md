# TTC CAD — Agent Work Order: F0 AutoCAD Foundation

Status: APPROVED_FOR_EXECUTION<br>
Work Order ID: WO-F0-001<br>
Work Order Type: PRODUCTION<br>
Tranche ID: F0<br>
Capability: AutoCAD Foundation<br>
Owner / Dispatcher: TTC CAD Product Owner<br>
Implementer: Antigravity<br>
Reviewer: Independent Technical Reviewer / Product Owner<br>
Date: 2026-09-08<br>
Frozen Spec: docs/tranches/F0/SPEC.md (v1.0.0, FROZEN)<br>
Frozen Spec Commit: a1f9fd2672d6aa94b7bd2dee2b201edcfdce1733<br>
Work Order Preparation Commit: 3ac81521c7ac3298c35e510bc64da25e2a03ef0b<br>
Approved Execution Baseline: b9c6cc937fb7f9a1ea4c0acafa6ca8016bee3515<br>
Approval Authority: TTC CAD Product Owner / Operator Instruction<br>
Approval Review: REV-WO-F0-001-002 (PASS_FOR_EXECUTION_APPROVAL)<br>
Approval Authority Commit: Resolve via Git commit carrying Task: F0-WORK-ORDER-APPROVAL-001, Session: AG-F0-007, Work-Order: WO-F0-001, Stage: APPROVED_FOR_EXECUTION<br>
Execution Authorization: APPROVED<br>
Production Build Authorization: AUTHORIZED_FOR_F0_ONLY

---

## Dispatch Prompt Envelope

Read this Work Order and every artifact in `Required First Reads` before editing production files.

You are authorized to execute **only** this bounded assignment.

> [!IMPORTANT]
> **Single-Tranche Authorization Rule:**
> One Work Order normally authorizes exactly **one bounded tranche**.
> Do not bundle future tranches merely because implementation is convenient.
> A downstream tranche must never begin until its upstream dependencies are `FROZEN`.

Hard prerequisites:
- Target Tranche Feature Spec must be `FROZEN` (`docs/tranches/F0/SPEC.md` v1.0.0 — FROZEN).
- All upstream dependencies must be `FROZEN` (F0 is the root technical tranche — NONE).
- This Work Order must be `APPROVED_FOR_EXECUTION` (Current status: `APPROVED_FOR_EXECUTION` — APPROVED).
- If any prerequisite is false, do not mutate production code. Production Build Authorization remains `NOT AUTHORIZED`.

---

## 1. Mission

Implement the complete bounded F0 AutoCAD Foundation defined by frozen Feature Specification `docs/tranches/F0/SPEC.md` v1.0.0 and produce sufficient build, test, AutoCAD-host, packaging, scope, and continuity evidence for independent REVIEW.

F0 BUILD must establish strictly the foundational infrastructure shell:
- AutoCAD 2023 Managed .NET production solution targeting .NET Framework 4.8;
- Plugin bootstrap lifecycle implementing `IExtensionApplication` (`App.cs`);
- Diagnostic command `TTCINFO` supporting both active document and zero-document application contexts;
- Palette command `TTCPALETTE` hosting a modeless WPF `StatusControl` shell via 3-parameter `AddVisual(name, visual, true)` with automatic content resizing;
- Ribbon shell constructing the `TTC CAD` tab and `General` panel with deferred timing support;
- Configuration management infrastructure (`ISettingsRepository`, schema validation, fallback);
- Structured file logging infrastructure (`ILogger`, `FileLogger`, `%APPDATA%` primary, `%TEMP%` fallback);
- Application bundle layout (`TTC.CadTools.bundle`) with `PackageContents.xml` autoloader manifest;
- Unit and static test suites for Core and Infrastructure;
- Developer build, deployment, and direct `NETLOAD` instructions;
- Real AutoCAD 2023 host runtime verification evidence.

Zero Panel or M&E engineering logic belongs in F0.

---

## 2. Authority Chain

- **Execution Behavioral Authority:**
  - Feature Spec: [./SPEC.md](./SPEC.md) (`SPEC-FOUNDATION-F0-001`, Version: `1.0.0`, Status: `FROZEN`)
  - Spec Freeze Review: [./REVIEW.md](./REVIEW.md) (`REV-F0-001-R3` = `PASS_FOR_FREEZE`)
  - Spec Freeze Baseline Commit: `a1f9fd2672d6aa94b7bd2dee2b201edcfdce1733`
- **Supporting Planning & Architectural Evidence (Non-Authoritative for Execution):**
  - Supporting Intake Evidence: [./INTAKE.md](./INTAKE.md) (`INTAKE-FOUNDATION-F0`, Status: `DRAFT`, Role: upstream planning evidence)
  - Supporting Design Evidence: [./DESIGN.md](./DESIGN.md) (`DESIGN-FOUNDATION-F0`, Version: `0.1.2`, Status: `DRAFT`, Role: architectural design evidence)
- **Architecture Baseline:** [../../TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md](../../TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md) (Status: `APPROVED_BASELINE`)
- **Governance Doctrine:**
  - `TTC-GOV-001`: Spec-First Per Tranche Methodology ([../../../governance/DECISION_LOG.md](../../../governance/DECISION_LOG.md))
  - `TTC-GOV-002`: Git-Based Agent Continuity & Handoff Protocol ([../../../governance/DECISION_LOG.md](../../../governance/DECISION_LOG.md))
- **Canonical Issue Registry:** [./ISSUES.md](./ISSUES.md) (`ISSUE-F0-001` to `ISSUE-F0-008`)
- **API Technical Verification:** [./API_VERIFICATION.md](./API_VERIFICATION.md) (SRC-01 through SRC-06)

> [!IMPORTANT]
> **Authority Separation Rule:**
> Frozen SPEC (`SPEC-FOUNDATION-F0-001` v1.0.0) is the sole authoritative source of execution behavior.
> Intake and Design are supporting traceability evidence and are not independently used as execution authorization.
> This Work Order governs bounded execution scope; it may narrow implementation scope, but may NOT contradict or expand the frozen Spec.

---

## 3. Roles & Responsibilities

- **Dispatcher / Owner:** TTC CAD Product Owner
- **Implementer:** Antigravity
- **Reviewer:** Independent Technical Reviewer / Product Owner
- **Operator Approval Required For:**
  - Spec changes or reinterpretation;
  - Scope expansion beyond Allowed Scope and Allowed Paths;
  - Architecture or public interface mutations;
  - AutoCAD version, runtime framework, or tooling baseline modifications;
  - Destructive or irreversible repository actions.

---

## 4. Allowed Scope

When approved for execution, this Work Order authorizes:
1. Creation of the production Visual Studio solution `production/TTC.CadTools.sln` targeting .NET Framework 4.8;
2. Creation of production project files:
   - `production/TTC.CadTools.Core/TTC.CadTools.Core.csproj`
   - `production/TTC.CadTools.Infrastructure/TTC.CadTools.Infrastructure.csproj`
   - `production/TTC.CadTools.AutoCAD/TTC.CadTools.AutoCAD.csproj`
   - `production/TTC.CadTools.Tests/TTC.CadTools.Tests.csproj`
3. Implementation of `TTC.CadTools.Core` domain abstractions (interfaces, logging contracts, configuration models) with ZERO AutoCAD references;
4. Implementation of `TTC.CadTools.Infrastructure` services (`FileLogger`, `SettingsRepository`, JSON deserialization, fallback handling) with ZERO AutoCAD references;
5. Implementation of `TTC.CadTools.AutoCAD` host adapter (`App.cs`, `InfoCommand.cs`, `PaletteCommand.cs`, `RibbonBuilder.cs`, WPF `StatusControl.xaml`, `StatusControl.xaml.cs`);
6. Implementation of `production/TTC.CadTools.bundle/PackageContents.xml` autoloader manifest and bundle directory structure;
7. Authoring and execution of unit and static tests in `TTC.CadTools.Tests`;
8. Authoring developer instructions in `production/README.md`;
9. Execution of manual and integration tests inside real AutoCAD 2023 host environment;
10. Recording execution evidence and updating continuity artifacts (`EXECUTION_LOG.md`, `ISSUES.md`, `REVIEW.md`, `TRANCHE_STATUS.md`, `PROJECT_PROGRESS.md`, `AGENT_HANDOFF.md`).

---

## 5. Forbidden Scope

The executing agent is strictly forbidden from:
- Writing or modifying any code in `src/` or `public/` (Simulator lane);
- Creating ObjectARX C++ unmanaged code;
- Implementing any EPLAN export or integration functionality;
- Implementing any Panel domain features:
  - DIN rail placement (`TTCRAIL`);
  - Wiring duct placement (`TTCDUCT`);
  - Alignment tools (`TTCALIGN`);
  - Panel clearance QA (`TTCPANELCHECK`);
  - Depth validation;
  - Cabinet sizing (`TTCPANELSIZE`);
  - Component placement (`TTCPANELPLACE`);
- Implementing any M&E cable tray routing or sizing features;
- Implementing common metadata contracts, layer management, geometric tolerance rules, or XRecord schemas belonging to Tranche F1;
- Implementing geometric algorithms, spatial collision checking, or bounding-box calculations;
- Creating domain entity repositories (`IComponentRepository`, `ICabinetRepository`, `ITrayRepository`);
- Modifying `docs/tranches/F0/SPEC.md` without explicit operator reopen authority;
- Bundling downstream tranches (F1, P1, P2, etc.) into this Work Order.

---

## 6. Allowed / Owned Paths

The future approved BUILD task may create or modify files **only** within the following explicit paths:

| Path Pattern | Write Mode | Purpose |
|---|---|---|
| `production/TTC.CadTools.sln` | CREATE / MODIFY | Root Visual Studio solution file |
| `production/TTC.CadTools.Core/**` | CREATE / MODIFY | Core interfaces, models, logging abstractions, settings contracts (zero CAD refs) |
| `production/TTC.CadTools.Infrastructure/**` | CREATE / MODIFY | Logging and JSON settings repository implementation (zero CAD refs) |
| `production/TTC.CadTools.AutoCAD/**` | CREATE / MODIFY | AutoCAD plugin entry point, commands, Ribbon/PaletteSet shells, WPF views |
| `production/TTC.CadTools.Tests/**` | CREATE / MODIFY | Unit and static tests for Core and Infrastructure |
| `production/TTC.CadTools.bundle/**` | CREATE / MODIFY | Bundle package directory and `PackageContents.xml` manifest |
| `production/README.md` | MODIFY / CREATE | Developer build, deployment, and NETLOAD documentation |
| `docs/tranches/F0/WORK_ORDER.md` | MODIFY | Work Order status updates |
| `docs/tranches/F0/EXECUTION_LOG.md` | MODIFY | Append execution log sessions and build/test evidence |
| `docs/tranches/F0/ISSUES.md` | MODIFY | Update issue statuses and recorded evidence |
| `docs/tranches/TRANCHE_STATUS.md` | MODIFY | Synchronize master tranche status register |
| `governance/PROJECT_PROGRESS.md` | MODIFY | Synchronize project progress tracking |
| `governance/AGENT_HANDOFF.md` | MODIFY | Synchronize agent continuity handoff |
| `docs/tranches/F0/REVIEW.md` | READ ONLY DURING BUILD | Reviewer-owned; implementer records evidence in execution log and handoff |

Any file creation or edit outside these paths will trigger `BLOCKED_SCOPE_EXPANSION`.

### 6.1 Review Stage Ownership & Separation of Duties

- **BUILD Agent:** Implements production code and records build, test, and host verification evidence in `EXECUTION_LOG.md`, `ISSUES.md`, and project status artifacts. The BUILD agent MUST NOT modify `docs/tranches/F0/REVIEW.md`, set review results or dispositions, mark review criteria PASS or NEEDS_FIX, mark tranches FROZEN, or self-authorize lifecycle transitions.
- **Independent Technical Reviewer:** Inspects implementation, tests, and runtime evidence; authors review reports; and writes formal dispositions in `docs/tranches/F0/REVIEW.md`.
- **Product Owner:** Approves lifecycle transitions and tranche freezes where governance requires operator authority.

Expected post-BUILD lifecycle flow:
```text
BUILD COMPLETE
  → IMPLEMENTATION EVIDENCE READY
  → REVIEW (Independent Technical Reviewer authors REV-F0-002 in REVIEW.md)
  → Reviewer Disposition: PASS / NEEDS_FIX / BLOCKED
  → F0 Tranche FREEZE (Only if review is PASS and Product Owner explicitly authorizes)
```

---

## 7. Forbidden Paths

- `src/**` (Simulator lane — strictly forbidden for production work orders)
- `public/**` (Simulator lane — strictly forbidden for production work orders)
- `docs/tranches/F0/SPEC.md` (Frozen Feature Specification — requires explicit operator reopen authority)
- `docs/tranches/F0/DESIGN.md` (Supporting Design Evidence — DRAFT)
- `docs/tranches/F0/INTAKE.md` (Supporting Intake Evidence — DRAFT)
- `docs/tranches/F1/**` (Tranche F1 — Common CAD Contracts)
- `docs/tranches/P1/**` (Tranche P1 — Component Library)
- `docs/tranches/P2/**` (Tranche P2 — Component Placement)
- All other future tranche directories (`P3..P9`, `M1..M8`, `C1..C2`)

---

## 8. Continuity Requirements

Every executing Agent must strictly observe the lifecycle and continuity rules in `governance/ANTIGRAVITY_INSTRUCTIONS.md`.

- **Required First Reads (in exact order):**
  1. `governance/ANTIGRAVITY_INSTRUCTIONS.md`
  2. `governance/PROJECT_PROGRESS.md`
  3. `governance/AGENT_HANDOFF.md`
  4. `governance/DECISION_LOG.md`
  5. `docs/tranches/TRANCHE_STATUS.md`
  6. `docs/tranches/TRANCHE_ROADMAP.md`
  7. `docs/tranches/F0/README.md`
  8. `docs/tranches/F0/REVIEW.md`
  9. `docs/tranches/F0/API_VERIFICATION.md`
  10. `docs/tranches/F0/ISSUES.md`
  11. `docs/tranches/F0/EXECUTION_LOG.md`
  12. `docs/tranches/F0/INTAKE.md`
  13. `docs/tranches/F0/DESIGN.md`
  14. `docs/tranches/F0/SPEC.md`
  15. `docs/tranches/F0/WORK_ORDER.md`
- **Execution Log Path:** `docs/tranches/F0/EXECUTION_LOG.md`
- **Issue Registry Path:** `docs/tranches/F0/ISSUES.md`
- **Review Result Path:** `docs/tranches/F0/REVIEW.md`
- **Global Handoff Path:** `governance/AGENT_HANDOFF.md`
- **Project Progress Path:** `governance/PROJECT_PROGRESS.md`
- **Tranche Status Path:** `docs/tranches/TRANCHE_STATUS.md`

> [!IMPORTANT]
> **Continuity Completion Condition:**
> This Work Order CANNOT be reported complete until all required continuity artifacts have been updated and committed together with code changes. Omitting continuity updates results in `INCOMPLETE_CONTINUITY`.

---

## 9. Source Verification / Pre-Flight

Before BUILD execution verify:
1. Frozen Spec remains:
   - File: `docs/tranches/F0/SPEC.md`
   - Version: `1.0.0`
   - Status: `FROZEN`
2. Work Order status is:
   - File: `docs/tranches/F0/WORK_ORDER.md`
   - Status: `APPROVED_FOR_EXECUTION` (signed by Product Owner)
3. Current repository HEAD contains or descends from the Approved Execution Baseline (`b9c6cc937fb7f9a1ea4c0acafa6ca8016bee3515`) and includes a valid Product Owner approval commit for WO-F0-001 (commit equality is not required);
4. Target framework is `.NETFramework,Version=v4.8`;
5. AutoCAD Managed reference baseline targets AutoCAD 2023 (Series `R24.2`);
6. Frozen Spec has not been modified or reopened;
7. Continuity artifacts do not contradict the approved Work Order state;
8. No production C# files exist prior to build initiation.

Pre-flight diagnostic commands:
```bash
git status --short
git rev-parse HEAD
git branch --show-current
git log -1 --oneline
```

> [!NOTE]
> **Intervening Commits Policy:**
> If current repository HEAD is newer than Approved Execution Baseline, do NOT automatically block. Inspect intervening commits. Block only when intervening changes materially conflict with execution authority. Current HEAD must contain or descend from Approved Execution Baseline (`b9c6cc937fb7f9a1ea4c0acafa6ca8016bee3515`) and include a valid Product Owner approval commit. Use `BLOCKED_STALE_SOURCE_FACT` only for a real material mismatch.

---

## 10. Spec-to-Work-Order Trace Matrix

| AC ID | Frozen Acceptance Criterion | Implementation Work | Verification Method | Evidence Artifact | Status |
|---|---|---|---|---|---|
| **AC-F0-01** | **Plugin Bootstrap:** Assembly loads cleanly via bundle autoloader or manual `NETLOAD`. | Implement `IExtensionApplication` in `App.cs`; configure assembly attributes. | Host Startup / `NETLOAD` in AutoCAD 2023 | Command line output, loaded assembly inspection | `PENDING` |
| **AC-F0-02** | **Diagnostic Command (`TTCINFO`):** Outputs host version, assembly version, CLR runtime, config status, log file path. | Implement `InfoCommand.cs`; support active doc `Editor.WriteMessage` and zero-doc file log / alert dialog. | Command line execution & log inspection | Screen capture, log file entry | `PENDING` |
| **AC-F0-03** | **Ribbon Shell:** `TTC CAD` tab and `General` panel with clickable buttons. | Implement `RibbonBuilder.cs`; handle deferred creation via `ItemInitialized`. | Visual Inspection in AutoCAD 2023 | Screenshot of AutoCAD Ribbon tab | `PENDING` |
| **AC-F0-04** | **PaletteSet Shell:** `TTCPALETTE` opens modeless dockable palette hosting WPF `StatusControl`. | Implement `PaletteCommand.cs` with 3-parameter `AddVisual(name, visual, true)`. | Interactive Docking / Toggle / Resize | Screenshot of floating, docked, and resized PaletteSet | `PENDING` |
| **AC-F0-05** | **Valid Configuration:** Deserializes valid `settings.json` and reflects `VALID` in `TTCINFO`. | Implement `SettingsRepository.cs` and `PluginSettings.cs` model. | xUnit Test Suite | Test runner report (`SettingsRepositoryTests.cs`) | `PENDING` |
| **AC-F0-06** | **Invalid Configuration:** Malformed or missing JSON safely falls back to defaults without crash. | Implement schema validation and fallback defaults in `SettingsRepository.cs`. | xUnit Test Suite / Host Negative Test | Test runner report (`SettingsFallbackTests.cs`) | `PENDING` |
| **AC-F0-07** | **Structured File Logging:** Rolling daily log in `%APPDATA%\TTC_CadTools\Logs\` with fallback to `%TEMP%`. | Implement `FileLogger.cs` with write permission check and directory failover. | Unit Test & File Inspection | Log file text content containing formatted entries | `PENDING` |
| **AC-F0-08** | **Package Manifest Validation:** `PackageContents.xml` conforms to Autodesk schema (`R24.2`, startup load). | Author `PackageContents.xml` with `LoadOnAutoCADStartup="True"` and `SeriesMin="R24.2"`. | XML Schema Validation against Autodesk XSD | Static schema validation check | `PENDING` |
| **AC-F0-09** | **Decoupling Integrity:** `TTC.CadTools.Core.dll` contains ZERO Autodesk assembly references. | Configure project dependencies; enforce Core isolation from `Ac*Mgd.dll`. | Assembly Reflection / ILSpy audit | Assembly reference list showing zero Autodesk DLLs | `PENDING` |
| **AC-F0-10** | **Strict Scope Containment:** Zero Panel or M&E production features in F0 codebase. | Implement strictly F0 infrastructure shell; defer domain repositories to P1/M1. | Directory Scan / Codebase Audit | Audit confirming 0 Panel/M&E classes | `PENDING` |
| **AC-F0-11** | **Zero-Document State Safety:** PaletteSet remains stable when last drawing is closed; updates to "No Active Document"; restores on document open; 0 null Editor dereferences; 0 DWG transactions. | Implement document event guards (`DocumentActivated`, `MdiActiveDocument != null`) in WPF status view. | AutoCAD 2023 Host Test (close drawing, open drawing) | Step-by-step test log, screenshots, log entries | `PENDING` |
| **AC-F0-12** | **Palette Idempotency & Singleton:** Repeated `TTCPALETTE` toggles visibility of single instance. | Implement singleton check and visibility toggle logic in `PaletteCommand.cs`. | AutoCAD 2023 UI Test | Single palette instance verified in AutoCAD UI | `PENDING` |
| **AC-F0-13** | **Application-Context Command Safety:** Application-context command execution with 0 drawings open executes safely without null Editor dereferences. | Add zero-document execution branch in `InfoCommand.cs` writing to log/dialog. | AutoCAD 2023 Host Test in zero-doc state | Structured log entry and modal dialog capture | `PENDING` |

---

## 11. Open Issue Trace & Handling

| Issue ID | Problem Summary | Blocks BUILD Entry? | Must Close By | Work Order Action | Required Evidence | Blocks AC |
|---|---|:---:|---|---|---|---|
| **ISSUE-F0-001** | AutoCAD reference assembly resolution across developer workstations | NO | `BUILD_COMPLETION` | Use NuGet `AutoCAD.NET` (version `24.2.0`) targeting .NET 4.8 with `Private=False`, `ExcludeAssets="runtime"`. | Clean compilation on developer workstation without local AutoCAD DLL copy | AC-F0-01, AC-F0-09 |
| **ISSUE-F0-002** | Plugin log directory permissions in standard bundle installation | NO | `RUNTIME_ACCEPTANCE` | Implement primary path `%APPDATA%\TTC_CadTools\Logs\` with fallback to `%TEMP%\TTC_CadTools\Logs\`. | Runtime test verifying log creation under standard user account | AC-F0-07 |
| **ISSUE-F0-003** | Modeless PaletteSet threading, context switching & zero-document safety | NO | `RUNTIME_ACCEPTANCE` | Implement document event guards; modeless WPF UI checks `MdiActiveDocument != null`; display neutral state when zero drawings open. | Interactive AutoCAD 2023 test opening, closing, and switching drawings while Palette is open | AC-F0-11 |
| **ISSUE-F0-004** | Ribbon tab refresh behavior across AutoCAD workspaces | NO | `RUNTIME_ACCEPTANCE` | Handle workspace switching; verify ribbon tab persists or is restored on workspace change. | AutoCAD 2023 workspace toggle test | AC-F0-03 |
| **ISSUE-F0-005** | PaletteSet position and state persistence across AutoCAD sessions | NO | `RUNTIME_ACCEPTANCE` | Use unique GUID `4A7A779F-9C3D-4A42-A862-2D5392D6D3A0` and AutoCAD native registry persistence. | Verify dock position persists across AutoCAD restart | AC-F0-04 |
| **ISSUE-F0-006** | Bundle deployment path vs NETLOAD developer workflow | NO | `BUILD_COMPLETION` | Support both `.bundle` packaging and direct `NETLOAD` of `bin\Debug\TTC.CadTools.AutoCAD.dll`. | Documented developer instructions in `production/README.md` | AC-F0-01 |
| **ISSUE-F0-007** | Ribbon initialization timing relative to `Initialize()` | NO | `RUNTIME_ACCEPTANCE` | If `ComponentManager.Ribbon` is null during `Initialize()`, subscribe to `ItemInitialized` and unsubscribe after creation. | AutoCAD 2023 cold-start test showing ribbon appears reliably | AC-F0-03 |
| **ISSUE-F0-008** | Settings file resolution precedence & schema fallback | NO | `BUILD_COMPLETION` | Implement 3-tier resolution: (1) `%APPDATA%`, (2) Bundle resources, (3) Hardcoded in-memory defaults. | Unit tests covering missing and corrupted JSON files | AC-F0-05, AC-F0-06 |

> [!IMPORTANT]
> **Issue Gate Invariant:**
> The registered open issues represent active engineering and validation work to be resolved or verified DURING authorized BUILD/REVIEW execution. None of these issues block entry to BUILD. They must be resolved or validated before their respective closure gates (`BUILD_COMPLETION` or `RUNTIME_ACCEPTANCE`).

---

## 12. Implementation Constraints & Architecture Boundaries

### 12.1 Project Dependency Boundary
```text
TTC.CadTools.Core
  ├── Zero AutoCAD references (AcCoreMgd, AcDbMgd, AcMgd strictly forbidden)
  └── Standard .NET Framework 4.8 runtime only

TTC.CadTools.Infrastructure
  ├── Depends on: TTC.CadTools.Core
  ├── Zero AutoCAD references
  └── Standard .NET Framework 4.8 runtime only

TTC.CadTools.AutoCAD
  ├── Depends on: TTC.CadTools.Core, TTC.CadTools.Infrastructure
  └── References: AcCoreMgd.dll, AcDbMgd.dll, AcMgd.dll, AdWindows.dll (Private=False)

TTC.CadTools.Tests
  ├── Depends on: TTC.CadTools.Core, TTC.CadTools.Infrastructure
  └── No unnecessary AutoCAD host dependencies for unit tests
```

### 12.2 AutoCAD Host References
AutoCAD Managed API references in `TTC.CadTools.AutoCAD.csproj` must be configured with:
```xml
<Private>False</Private>
```
and must never be packaged into the runtime distribution bundle or test binaries.

### 12.3 Frozen Claim Boundary
Per Section 11.1 of frozen `SPEC.md`:
- Frozen specification defines authoritative required contracts;
- Build implementation must produce verifiable proof of satisfaction;
- No acceptance criterion may be claimed as `PASS` without actual build and host execution evidence.

---

## 13. Required Tests

| Test ID | Test Description | Category | Required Result |
|---|---|---|---|
| **TEST-F0-01** | `SettingsRepositoryTests.Load_ValidJson_ReturnsPopulatedSettings` | Unit Test | PASS |
| **TEST-F0-02** | `SettingsFallbackTests.Load_MissingFile_ReturnsDefaultSettings` | Unit Test | PASS |
| **TEST-F0-03** | `SettingsFallbackTests.Load_MalformedJson_ReturnsDefaultSettings` | Unit Test | PASS |
| **TEST-F0-04** | `SettingsFallbackTests.Load_MissingFields_AppliesDefaultsToMissing` | Unit Test | PASS |
| **TEST-F0-05** | `FileLoggerTests.Log_WritesFormattedEntryToDisk` | Unit Test | PASS |
| **TEST-F0-06** | `FileLoggerTests.Log_DirectoryReadOnly_FallsBackToTempPath` | Unit Test | PASS |
| **TEST-F0-07** | `ArchitectureTests.Core_HasZeroAutodeskReferences` | Static Analysis | PASS |
| **TEST-F0-08** | `ArchitectureTests.Infrastructure_HasZeroAutodeskReferences` | Static Analysis | PASS |
| **TEST-F0-09** | `ScopeTests.Production_ContainsZeroPanelOrMeClasses` | Static Analysis | PASS |
| **TEST-F0-10** | `ManifestTests.PackageContents_ValidatesAgainstAutodeskSchema` | Static Analysis | PASS |
| **TEST-F0-11** | Host startup and plugin bootstrap via bundle / `NETLOAD` | AutoCAD 2023 Manual | PASS |
| **TEST-F0-12** | Command `TTCINFO` execution in active document and zero-doc state | AutoCAD 2023 Integration | PASS |
| **TEST-F0-13** | Ribbon tab and panel creation with cold-start timing fallback | AutoCAD 2023 UI | PASS |
| **TEST-F0-14** | Command `TTCPALETTE` modeless display, docking, and content resizing | AutoCAD 2023 UI | PASS |
| **TEST-F0-15** | Palette stability across document closing, zero-doc state, and reopening | AutoCAD 2023 Integration | PASS |
| **TEST-F0-16** | Palette singleton toggle behavior on repeated command execution | AutoCAD 2023 UI | PASS |

---

## 14. Required Build & Runtime Evidence

The future BUILD completion packet must include evidence in all of the following categories:

### 14.1 Build Evidence
- Exact compiler/build toolchain invocation (e.g. `dotnet build` or `msbuild TTC.CadTools.sln /p:Configuration=Release`);
- Target framework verification (.NET Framework 4.8);
- Full build output showing 0 compilation errors;
- Record of any compilation warnings with rationale.

### 14.2 Unit / Static Test Evidence
- Test runner command line and execution output;
- List of all executed test cases mapped to corresponding ACs;
- Confirmation that all unit and static tests PASS with 0 failures.

### 14.3 AutoCAD 2023 Host Runtime Evidence
Real host verification inside AutoCAD 2023 must record:
- Exact AutoCAD version and build number;
- Test drawing details and zero-document condition steps;
- Step-by-step execution protocol for:
  1. Plugin load via `NETLOAD` / bundle autoloader (AC-F0-01);
  2. `TTCINFO` command execution and command-line output (AC-F0-02);
  3. Ribbon tab rendering and button interactivity (AC-F0-03);
  4. `TTCPALETTE` display, dock/float transitions, and automatic resizing (AC-F0-04);
  5. Closing last document to reach zero-document state (AC-F0-11);
  6. Verification that PaletteSet displays "No Active Document" with 0 crashes or errors (AC-F0-11);
  7. Opening a new drawing and verifying automatic state restoration (AC-F0-11);
  8. Repeated `TTCPALETTE` command execution verifying singleton toggle (AC-F0-12);
  9. Application-context execution of `TTCINFO` in zero-doc state (AC-F0-13);
- Text logs, command line transcripts, and screenshots for each test.

### 14.4 Scope Containment Evidence
- Full list of created and modified files (`git status --short`, `git diff --stat`);
- Verification that all production code files reside strictly inside Allowed Paths;
- Confirmation of 0 `.cs` files in `src/`, `public/`, or outside `production/`.

---

## 15. Stop Conditions

The executing agent must immediately STOP and report a blocking condition if any of the following occur:

- `BLOCKED_SPEC_AMBIGUITY`: If required technical behavior is missing, ambiguous, or contradictory in frozen `SPEC.md` v1.0.0. Identify the exact section and earliest stage requiring reopen.
- `BLOCKED_SCOPE_EXPANSION`: If resolving an issue requires modifying files outside Allowed Paths (e.g. `src/`, future tranches) or widening tranche scope.
- `BLOCKED_STALE_SOURCE_FACT`: If actual source code, project dependencies, or repository baseline contradict material assumptions in this Work Order.
- `BLOCKED_HOST_CAPABILITY`: If physical AutoCAD 2023 runtime environment cannot support a frozen specification requirement.
- `BLOCKED_DEPENDENCY`: If required build tools, SDKs, or NuGet packages are inaccessible and no approved fallback exists.
- `BLOCKED_CONTINUITY_CONFLICT`: If repository continuity artifacts contain unreconciled contradictions.

> [!NOTE]
> **Open Issues Stop Condition Rule:**
> Open runtime/build issues already registered in `ISSUE-F0-001` through `ISSUE-F0-008` do NOT themselves trigger a stop condition upon BUILD entry. A stop condition is triggered during BUILD only if new evidence demonstrates that an issue cannot be resolved within the frozen Spec contracts and approved Work Order scope.

---

## 16. Worker Autonomy & Remediation Rules

Within Allowed Scope and Allowed Paths, the implementing agent is authorized and expected to independently resolve:
- C# compilation errors;
- Project file reference and NuGet package wiring;
- Unit test assertion and test harness adjustments;
- Code formatting and linting issues;
- Minor mechanical implementation defects.

The agent must NOT:
- Escalate routine compiler or build errors as preference questions to the Product Owner;
- Use worker autonomy to change frozen specification contracts;
- Broaden the architecture or add unauthorized public APIs;
- Implement features belonging to downstream tranches.

---

## 17. Required Completion Packet

When BUILD execution is completed under an approved Work Order, the agent must return a Completion Packet conforming to this structure:

```text
==================================================
TTC CAD — BUILD COMPLETION PACKET: WO-F0-001
==================================================

1. EXECUTION IDENTITY
   - Work Order ID: WO-F0-001
   - Tranche: F0 — AutoCAD Foundation
   - Implementer: Antigravity
   - Execution Status: PASS / PARTIAL / BLOCKED
   - Base Commit: <start-commit-sha>
   - Result Commit: <result-commit-sha>

2. SPECIFICATION & SCOPE COMPLIANCE
   - Frozen Spec: docs/tranches/F0/SPEC.md v1.0.0
   - Spec Compliance: PASS / FAIL
   - Scope Compliance: PASS / FAIL (All changes inside Allowed Paths)

3. BUILD & COMPILATION EVIDENCE
   - Build Toolchain: <msbuild / dotnet version>
   - Target Framework: .NET Framework 4.8
   - Build Outcome: PASS (0 errors, N warnings documented)

4. UNIT & STATIC TEST EVIDENCE
   - Test Runner: <xunit / vstest>
   - Total Tests Executed: N
   - Tests Passed: N / Failed: 0
   - Assembly Isolation: PASS (0 AutoCAD refs in Core/Infrastructure)

5. AUTOCAD 2023 HOST RUNTIME EVIDENCE
   - Host Version: AutoCAD 2023 (Build details)
   - Runtime Acceptance Tests: AC-F0-01 through AC-F0-13 status & evidence paths

6. ACCEPTANCE CRITERIA TRACE MATRIX
   - AC-F0-01 to AC-F0-13 status (PASS / FAIL / NOT_RUN)

7. ISSUE REGISTRY UPDATE
   - Status of ISSUE-F0-001 through ISSUE-F0-008

8. CHANGED FILES AUDIT
   - Complete list of created/modified production files

9. CONTINUITY SYNCHRONIZATION
   - Execution Log, Review, Tranche Status, Project Progress, Agent Handoff

10. NEXT REQUIRED STAGE
    - REVIEW (REV-F0-002)
==================================================
```

---

## 18. Approval For Execution

```text
Work Order Status:
APPROVED_FOR_EXECUTION

Execution Authorization:
APPROVED

Production Build Authorization:
AUTHORIZED_FOR_F0_ONLY

Reviewer Disposition:
PASS_FOR_EXECUTION_APPROVAL (REV-WO-F0-001-002)

Product Owner Disposition:
APPROVED_FOR_EXECUTION

Approved Execution Baseline:
b9c6cc937fb7f9a1ea4c0acafa6ca8016bee3515

Runtime Acceptance:
NOT_RUN

Implementation:
NOT_STARTED
```

> *Note: Production BUILD is authorized strictly for the bounded F0 scope and paths defined by this approved Work Order. Downstream tranches remain NOT AUTHORIZED.*
