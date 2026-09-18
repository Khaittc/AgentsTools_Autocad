# TTC CAD — Agent Work Order: F1 Common CAD Contracts

Status: DRAFT / PENDING_INDEPENDENT_REVIEW<br>
Execution Status: NOT_STARTED<br>
Work Order ID: WO-F1-001<br>
Work Order Type: PRODUCTION<br>
Tranche ID: F1<br>
Capability: Common CAD Contracts<br>
Owner / Dispatcher: TTC CAD Product Owner<br>
Implementer: Antigravity<br>
Reviewer: Independent Technical Reviewer / Product Owner<br>
Date: 2026-09-18<br>
Frozen Spec: docs/tranches/F1/SPEC.md (v1.0.0, FROZEN)<br>
Frozen Spec Commit: 7941d89abbb0c809f571b19689442a21189a5103<br>
Work Order Preparation Commit: Resolve via Git commit carrying Task: F1-WORK-ORDER-AUTHORING-001, Session: AG-F1-014, Work-Order: WO-F1-001, Stage: WORK_ORDER_REVIEW_PENDING<br>
Approved Execution Baseline: NONE<br>
Approval Authority: TTC CAD Product Owner / Operator Instruction<br>
Approval Review: PENDING — REV-WO-F1-001-001<br>
Approval Authority Commit: NONE<br>
Execution Authorization: NOT AUTHORIZED<br>
Production Build Authorization: NONE<br>
Tranche Result: IN_PROGRESS (SPEC_FROZEN / WORK_ORDER_DRAFT)

---

## Dispatch Prompt Envelope

Read this Work Order and every artifact in `Required First Reads` before editing production files.

You are authorized to execute **only** this bounded assignment when approved by the Product Owner.

> [!IMPORTANT]
> **Single-Tranche Authorization Rule:**
> One Work Order normally authorizes exactly **one bounded tranche**.
> Do not bundle future tranches (P1..P9, M1..M8, C1, C2) merely because implementation is convenient.
> A downstream tranche must never begin until its upstream dependencies are `FROZEN`.

Hard prerequisites:
- Target Tranche Feature Spec must be `FROZEN` (`docs/tranches/F1/SPEC.md` v1.0.0 — FROZEN, baseline `7941d89abbb0c809f571b19689442a21189a5103`).
- All upstream dependencies must be `FROZEN` (Tranche F0 — `docs/tranches/F0/SPEC.md` v1.0.0 FROZEN, baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- This Work Order must be `APPROVED_FOR_EXECUTION` (Current status: `DRAFT / PENDING_INDEPENDENT_REVIEW` — NOT AUTHORIZED).
- If any prerequisite is false, do not mutate production code. Production Build Authorization remains `NONE` / `NOT AUTHORIZED`.

---

## 1. Mission

Implement the complete bounded F1 Common CAD Contracts defined by frozen Feature Specification `docs/tranches/F1/SPEC.md` v1.0.0 and produce sufficient build, test, AutoCAD-host, decoupling, scope, and continuity evidence for independent REVIEW.

When approved for execution, F1 BUILD must establish strictly the common CAD contracts, host abstractions, and runtime safety boundaries:
- **Pure Core Engineering Contracts (`TTC.CadTools.Core`):**
  - Canonical engineering unit standard (`MILLIMETER`) in pure Core mathematical computations, isolated from AutoCAD assemblies;
  - Authoritative physical unit conversion constants (`MillimetersPerDrawingUnit`) evaluated in IEEE 754 double precision;
  - Strongly typed immutable `GeometricTolerance` record with linear coincidence $\varepsilon = 10^{-4}\text{ mm}$ ($0.1\,\mu\text{m}$); zero raw floating-point equality;
  - RFC 4122 Version 4 UUID lowercase instance identity (`TTC_OBJECT_ID`) with zero role prefixes;
  - Standardized machine-readable entity metadata failure classifications (§15.1) and transient operation execution results (§15.2, including `OPERATION_ABORTED_PRESERVATION_RISK`);
  - Core service interfaces and models with ZERO references to Autodesk assemblies (`AcCoreMgd`, `AcDbMgd`, `AcMgd`).
- **Drawing Unit Host Adapter (`TTC.CadTools.AutoCAD`):**
  - Host drawing unit evaluation engine (`IDrawingUnitService`) deterministically resolving `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`;
  - Invariant: `INSUNITS = 0` (unitless) MUST NEVER silently default to millimeters; operations requiring physical units fail with `UNIT_UNRESOLVED`.
- **Authoritative Metadata Persistence & Fast-Query Index:**
  - Authoritative primary store in `DBObject.ExtensionDictionary` $\to$ `XRecord` (`TTC_METADATA_HEADER`) encoded with standard DXF group code 1;
  - Secondary derivative fast-query index in Registered `XData` (RegApp: `"TTC_CAD"` < 100 bytes);
  - Synchronization rules: `XRecord` wins all conflicts; missing/out-of-sync XData marked `XDATA_INDEX_OUT_OF_SYNC`; orphan XData marked `METADATA_INCOMPLETE` without destructive repair.
- **Schema Forward Compatibility (`1.0.x` Runtime):**
  - Lossless read-modify-write safety for future minor schemas (`1.N.x`): unrecognized key/value pairs preserved verbatim; schema version string NOT downgraded;
  - Non-destructive abort: if lossless preservation cannot be guaranteed, transaction aborts returning `OPERATION_ABORTED_PRESERVATION_RISK` without changing entity failure classification;
  - Read-only protection for future major schemas (`2.x.x`) with `UNSUPPORTED_SCHEMA`;
  - Syntax corruption safety with `INVALID_METADATA`; zero AutoCAD crashes.
- **Native AutoCAD Clone Lifecycle & Identity Reconciliation:**
  - Complete 18-operation lifecycle contract;
  - Category A commands (`COPY`, `ARRAY`, `MIRROR` preserve-source, `PASTECLIP`, `INSERT`, `ERASE`, `OOPS`): clone assigned distinct new UUIDv4, source retains ID;
  - Category A UNDO / REDO identity invariant: after any sequence of native undo/redo operations, active database never contains duplicate `TTC_OBJECT_ID` instances; undone clones lose identity; redo restores independent identities;
  - Category B cross-DWG export (`WBLOCK`): target DWG promoted as a valid TTC artifact must persist distinct `TTC_OBJECT_ID` values; source document retains original IDs;
  - Lineage resolution: `PROVENANCE_KNOWN` vs `PROVENANCE_UNKNOWN` (`COLLISION_UNRESOLVED`, zero silent overwrites, zero arbitrary survivor selection, geometry preserved).
- **Metadata & Identity Audit Services:**
  - `ITtcMetadataAuditService`: authoritative XRecord-based enumeration, missing-XData discovery, and safe index rebuild at authorized write boundaries;
  - `IEntityIdentityAuditService`: collision detection, collision flagging, and controlled reconciliation.
- **Document Lifecycle & Reactor Safety Handlers:**
  - Observation-only database reactors: ZERO database writes, ZERO property mutations, ZERO user prompts, ZERO command injections;
  - Managed document lifecycle events (`Document.CommandEnded`, `CommandCancelled`, `CommandFailed`);
  - Startup enumeration of all open documents in `Application.DocumentManager` + idempotent subscription to `DocumentCollection.DocumentCreated`;
  - Per-document state isolation: zero application-global static caches across documents.
- **Host Validation of Candidate Reconciliation Mechanisms:**
  - Empirical evaluation of Candidate Mechanism A (direct `DocumentLock` + `Transaction` in command boundary handler) vs Candidate Mechanism B (deferred/idle callback);
  - Investigation of `Database.BeginSave` write safety under `BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED`.
- **Common CAD Block Contract (12 Domains):**
  - Universal block conventions: mounting reference base point $(0,0,0)$, uniform insertion scale derivation, declared asset units (no silent mm assumption), rotation policy interfaces, clearance layer separation, block redefinition instance preservation.
- **F0 Regression Invariant:**
  - F0 baseline (`9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`) must remain 100% satisfied: all 45 automated tests pass, 13/13 F0 ACs pass, zero regression.
- **Strict Scope Boundaries:**
  - Zero UI: no component placement palettes, no engineering Ribbon buttons;
  - Zero ECAD / EPLAN logic: no device tags, wire numbering, or electrical BOMs;
  - Zero downstream panel or cable tray domain logic.

---

## 2. Authority Chain

- **Execution Behavioral Authority:**
  - Feature Spec: [./SPEC.md](./SPEC.md) (`SPEC-FOUNDATION-F1-001`, Version: `1.0.0`, Status: `FROZEN`)
  - Spec Freeze Review: [./REVIEW.md](./REVIEW.md) (`REV-F1-SPEC-001-R5` = `PASS_FOR_FREEZE`)
  - Spec Freeze Baseline Commit: `7941d89abbb0c809f571b19689442a21189a5103`
  - Spec Freeze Authority: TTC CAD Product Owner (`I APPROVE FREEZE F1`, recorded in `REVIEW.md` Section 13)
- **Upstream Dependency:**
  - Tranche F0 Feature Spec: [../F0/SPEC.md](../F0/SPEC.md) (`SPEC-FOUNDATION-F0-001`, Version: `1.0.0`, Status: `FROZEN`)
  - Tranche F0 Implementation Baseline: `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf` (F0 mutation CLOSED)
- **Supporting Planning & Architectural Evidence (Non-Authoritative for Execution):**
  - Supporting Intake Evidence: [./INTAKE.md](./INTAKE.md) (`INTAKE-FOUNDATION-F1-001`, Version: `0.3.0`, Status: `COMPLETE / PASS_TO_DESIGN`)
  - Supporting Design Evidence: [./DESIGN.md](./DESIGN.md) (`DESIGN-FOUNDATION-F1-001`, Version: `0.3.0`, Status: `COMPLETE / PASS_TO_SPEC`)
  - API Technical Verification: [./API_VERIFICATION.md](./API_VERIFICATION.md) (SRC-01 through SRC-08 host evidence)
- **Architecture Baseline:** [../../TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md](../../TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md) (Status: `APPROVED_BASELINE`)
- **Governance Doctrine:**
  - `TTC-GOV-001`: Spec-First Per Tranche Methodology ([../../../governance/DECISION_LOG.md](../../../governance/DECISION_LOG.md))
  - `TTC-GOV-002`: Git-Based Agent Continuity & Handoff Protocol ([../../../governance/DECISION_LOG.md](../../../governance/DECISION_LOG.md))
- **Canonical Issue Registry:** [./ISSUES.md](./ISSUES.md) (`ISSUE-F1-001` through `ISSUE-F1-010`, all `RESOLVED_AT_SPEC_FREEZE`)

> [!IMPORTANT]
> **Authority Separation Rule:**
> Frozen SPEC (`SPEC-FOUNDATION-F1-001` v1.0.0) is the sole authoritative source of execution behavior.
> Intake, Design, and API Verification are supporting traceability evidence and are not independently used as execution authorization.
> This Work Order governs bounded execution scope; it may narrow implementation scope or sequence work, but may NOT contradict, weaken, or expand the frozen Spec.

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

When approved for execution by the Product Owner, this Work Order authorizes:
1. Implementation of pure Core contracts in `production/TTC.CadTools.Core/**`:
   - Units and conversions (`EngineeringUnit`, `DrawingUnitResolution`, `MillimetersPerDrawingUnit`, authoritative physical constants);
   - Geometric tolerance record (`GeometricTolerance`, linear coincidence $\varepsilon = 10^{-4}\text{ mm}$, zero raw float equality);
   - TTC instance identity (`TtcObjectId`, RFC 4122 UUIDv4 lowercase string representation, validation);
   - TTC object metadata model and schema constants (`TtcMetadataHeader`, `TTC_METADATA_HEADER`, required keys, unknown field preservation dictionary);
   - Standardized entity metadata failure classifications (`EntityFailureClassification`, 10 codes per §15.1);
   - Standardized operation execution results (`OperationExecutionResult`, `OPERATION_ABORTED_PRESERVATION_RISK` per §15.2);
   - Core domain service abstractions (`IDrawingUnitService`, `ITtcMetadataAuditService`, `IEntityIdentityAuditService`, `ICloneReconciliationService`);
   - Enforcement of ZERO references to Autodesk assemblies (`AcCoreMgd`, `AcDbMgd`, `AcMgd`).
2. Implementation of host adapter services in `production/TTC.CadTools.AutoCAD/**`:
   - Host drawing unit resolver (`DrawingUnitService`, `INSUNITS` evaluation, conflict detection, project configuration wiring);
   - Canonical metadata persistence engine (`TtcMetadataSerializer`, `XRecord` reading/writing with DXF group code 1, `ResultBuffer` formatting);
   - Fast-query `XData` index writer and synchronization handler (RegApp `"TTC_CAD"`, payload formatting, automatic registration);
   - Schema forward compatibility handler (lossless unknown field preservation for `1.N.x`, non-destructive abort `OPERATION_ABORTED_PRESERVATION_RISK`, read-only guard for `2.x.x`, malformed metadata guard);
   - Document lifecycle and command boundary event manager (`DocumentLifecycleManager`, subscription to open documents at startup, `DocumentCreated` handling, clean unsubscription on close);
   - Observation-only database reactor handlers (`TtcDatabaseReactor`, zero DB writes, dirty flag tracking, per-document cache invalidation);
   - Native command clone reconciliation services (`CloneReconciliationService`, handling Category A commands, assigning distinct UUIDv4 to clones, handling Mechanism A vs Mechanism B host reconciliation);
   - Cross-database export postcondition handler (`WblockExportHandler`, ensuring target DWG instances persist distinct IDs);
   - Authoritative fallback audit and index rebuild service (`TtcMetadataAuditService`, missing-XData rebuild at safe write boundaries);
   - Entity identity collision audit service (`EntityIdentityAuditService`, lineage tracking, collision flagging, manual reconciliation support);
   - Common CAD block validation service (`BlockContractValidator`, uniform scale check, declared unit check, clearance layer separation).
3. Authoring and execution of unit, static, reflection, and contract tests in `production/TTC.CadTools.Tests/**`:
   - Tests for Core units, conversion reference coordinates, tolerances, UUID format, and models;
   - Tests verifying zero Autodesk assembly references in `TTC.CadTools.Core.dll`;
   - Tests for metadata serialization, round-trip fidelity, DXF group code 1 compliance, and unknown field preservation;
   - Tests for schema compatibility matrix (`1.0.x`, `1.N.x`, `2.x.x`, malformed);
   - Tests for operation result `OPERATION_ABORTED_PRESERVATION_RISK`;
   - Host integration tests inside AutoCAD 2023 executing `TEST-F1-01` through `TEST-F1-29`.
4. Updating developer build, deployment, and test instructions in `production/README.md`.
5. Recording execution evidence and updating continuity artifacts (`EXECUTION_LOG.md`, `ISSUES.md`, `TRANCHE_STATUS.md`, `PROJECT_PROGRESS.md`, `AGENT_HANDOFF.md`).

---

## 5. Forbidden Scope

The executing agent is strictly forbidden from:
- Writing or modifying any code in `src/` or `public/` (Simulator lane);
- Creating ObjectARX C++ unmanaged code;
- Creating custom database entity or object classes (`AcDbEntity` or `AcDbObject` derivatives) that produce proxy entity warnings;
- Implementing any EPLAN export or integration functionality (device tagging, wire numbering, terminal strips, electrical BOMs);
- Implementing any Panel domain features:
  - DIN rail placement (`TTCRAIL`);
  - Wiring duct placement (`TTCDUCT`);
  - Alignment tools (`TTCALIGN`);
  - Component placement (`TTCPANELPLACE`);
  - Clearance QA (`TTCPANELCHECK`);
  - Depth validation;
  - Cabinet sizing (`TTCPANELSIZE`);
  - Reserved zones;
- Implementing any M&E cable tray routing or sizing features;
- Implementing Layer standards enforcement (Tranche C1) or clean DWG/DXF export engine (Tranche C2);
- Introducing any end-user feature UI (Ribbon buttons, placement palettes, catalog browsers);
- Modifying `docs/tranches/F1/SPEC.md` without explicit operator reopen authority;
- Modifying frozen F0 artifacts (`docs/tranches/F0/**`);
- Modifying or breaking the frozen F0 implementation baseline (`9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`);
- Modifying `production/TTC.CadTools.Infrastructure/**` unless strictly required for F1-specific logging/config interfaces (Infrastructure remains read-only by default);
- Bundling downstream tranches (P1..P9, M1..M8, C1..C2) into this Work Order.

---

## 6. Allowed / Owned Paths

The future approved BUILD task may create or modify files **only** within the following explicit paths:

| Path Pattern | Write Mode | Purpose |
|---|---|---|
| `production/TTC.CadTools.Core/**` | CREATE / MODIFY | Core units, tolerances, identity models, failure codes, service interfaces (zero CAD refs) |
| `production/TTC.CadTools.AutoCAD/**` | CREATE / MODIFY | Host unit service, metadata persistence, clone reconciliation, reactor handlers, audit services |
| `production/TTC.CadTools.Tests/**` | CREATE / MODIFY | Unit, integration, reflection, and contract tests for F1 |
| `production/README.md` | MODIFY | Developer documentation for F1 tests, build, and verification |
| `docs/tranches/F1/WORK_ORDER.md` | CREATE / MODIFY | Work Order status and execution tracking |
| `docs/tranches/F1/EXECUTION_LOG.md` | MODIFY | Append execution log sessions and build/test evidence |
| `docs/tranches/F1/ISSUES.md` | MODIFY | Update runtime issue evidence and validation notes |
| `docs/tranches/TRANCHE_STATUS.md` | MODIFY | Synchronize master tranche status register |
| `governance/PROJECT_PROGRESS.md` | MODIFY | Synchronize project progress tracking |
| `governance/AGENT_HANDOFF.md` | MODIFY | Synchronize agent continuity handoff |
| `docs/tranches/F1/REVIEW.md` | READ ONLY DURING BUILD | Reviewer-owned; implementer records evidence in execution log and handoff |

Any file creation or edit outside these paths will trigger `BLOCKED_SCOPE_EXPANSION`.

### 6.1 Review Stage Ownership & Separation of Duties

- **BUILD Agent:** Implements production code and records build, test, and host verification evidence in `EXECUTION_LOG.md`, `ISSUES.md`, and project status artifacts. The BUILD agent MUST NOT modify `docs/tranches/F1/REVIEW.md`, set review results or dispositions, mark review criteria PASS or NEEDS_FIX, mark tranches FROZEN, or self-authorize lifecycle transitions.
- **Independent Technical Reviewer:** Inspects implementation, tests, and runtime evidence; authors review reports; and writes formal dispositions in `docs/tranches/F1/REVIEW.md`.
- **Product Owner:** Approves lifecycle transitions and tranche freezes where governance requires operator authority.

Expected post-BUILD lifecycle flow:
```text
BUILD COMPLETE
  → IMPLEMENTATION EVIDENCE READY
  → REVIEW (Independent Technical Reviewer authors REV-F1-BUILD-001 in REVIEW.md)
  → Reviewer Disposition: PASS / NEEDS_FIX / BLOCKED
  → F1 Tranche FREEZE (Only if review is PASS and Product Owner explicitly authorizes)
```

---

## 7. Forbidden Paths

- `src/**` (Simulator lane — strictly forbidden for production work orders)
- `public/**` (Simulator lane — strictly forbidden for production work orders)
- `docs/tranches/F0/**` (Frozen Tranche F0 artifacts and baseline)
- `docs/tranches/F1/SPEC.md` (Frozen Feature Specification — requires explicit operator reopen authority)
- `docs/tranches/F1/DESIGN.md` (Supporting Design Evidence — COMPLETE)
- `docs/tranches/F1/INTAKE.md` (Supporting Intake Evidence — COMPLETE)
- `docs/tranches/F1/API_VERIFICATION.md` (Supporting API Verification Evidence)
- `docs/tranches/P1/**` (Tranche P1 — Component Library)
- `docs/tranches/P2/**` (Tranche P2 — Component Placement)
- All other future tranche directories (`P3..P9`, `M1..M8`, `C1..C2`)
- `production/TTC.CadTools.Infrastructure/**` (Read-only by default; only F0 logging/settings consumed)

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
  7. `docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md`
  8. `docs/tranches/F0/README.md`
  9. `docs/tranches/F0/SPEC.md`
  10. `docs/tranches/F0/REVIEW.md`
  11. `docs/tranches/F1/README.md`
  12. `docs/tranches/F1/REVIEW.md`
  13. `docs/tranches/F1/API_VERIFICATION.md`
  14. `docs/tranches/F1/ISSUES.md`
  15. `docs/tranches/F1/EXECUTION_LOG.md`
  16. `docs/tranches/F1/INTAKE.md`
  17. `docs/tranches/F1/DESIGN.md`
  18. `docs/tranches/F1/SPEC.md`
  19. `docs/tranches/F1/WORK_ORDER.md`
- **Execution Log Path:** `docs/tranches/F1/EXECUTION_LOG.md`
- **Issue Registry Path:** `docs/tranches/F1/ISSUES.md`
- **Review Result Path:** `docs/tranches/F1/REVIEW.md`
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
   - File: `docs/tranches/F1/SPEC.md`
   - Version: `1.0.0`
   - Status: `FROZEN`
   - Baseline Commit: `7941d89abbb0c809f571b19689442a21189a5103` (zero diff)
2. Work Order status is:
   - File: `docs/tranches/F1/WORK_ORDER.md`
   - Status: `APPROVED_FOR_EXECUTION` (signed by Product Owner)
3. Current repository HEAD contains or descends from the Approved Execution Baseline and includes a valid Product Owner approval commit for WO-F1-001;
4. Upstream F0 baseline is intact:
   - `production/TTC.CadTools.Tests` passes all 45 existing unit/integration tests (`dotnet test`);
   - Assembly references for `TTC.CadTools.Core` contain zero Autodesk dependencies;
5. Target framework is `.NETFramework,Version=v4.8`;
6. AutoCAD Managed reference baseline targets AutoCAD 2023 (Series `R24.2`);
7. Frozen Spec has not been modified or reopened;
8. Continuity artifacts do not contradict the approved Work Order state;
9. Working tree is clean before initiating build steps.

Pre-flight diagnostic commands:
```bash
git status --short
git rev-parse HEAD
git branch --show-current
git log -1 --oneline
dotnet test production/TTC.CadTools.Tests/TTC.CadTools.Tests.csproj
```

> [!NOTE]
> **Intervening Commits Policy:**
> If current repository HEAD is newer than Approved Execution Baseline, do NOT automatically block. Inspect intervening commits. Block only when intervening changes materially conflict with execution authority. Current HEAD must contain or descend from Approved Execution Baseline and include a valid Product Owner approval commit. Use `BLOCKED_STALE_SOURCE_FACT` only for a real material mismatch.

---

## 10. Spec-to-Work-Order Trace Matrix

The following 25 numbered acceptance criteria map directly from frozen `SPEC-FOUNDATION-F1-001` v1.0.0 Section 16 to concrete implementation tasks and verification evidence:

| AC ID | Frozen Acceptance Criterion | Implementation Workstream | Verification Method | Evidence Artifact | Status |
|---|---|---|---|---|:---:|
| **AC-F1-01** | **Core Decoupling Integrity:** `TTC.CadTools.Core.dll` contains ZERO references to Autodesk assemblies (`accoremgd`, `acdbmgd`, `acmgd`). | Workstream A | `STATIC_ANALYSIS` / `UNIT_TEST` | Reflection test `TEST-F1-08` verifying assembly references | `PENDING` |
| **AC-F1-02** | **Unit Resolution States:** Host unit resolver deterministically evaluates `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`. | Workstream B | `UNIT_TEST` / `AUTOCAD_HOST_TEST` | Test runner report `TEST-F1-16` covering all three resolution paths | `PENDING` |
| **AC-F1-03** | **No Silent Unit Assumption:** Drawing with `INSUNITS = 0` and no project config is evaluated as `UNRESOLVED` and never silently assumes millimeters. | Workstream B | `UNIT_TEST` / `AUTOCAD_HOST_TEST` | Test runner report `TEST-F1-17` asserting `UNIT_UNRESOLVED` | `PENDING` |
| **AC-F1-04** | **Unit Conversion Precision:** Drawing units convert mathematically to Core canonical millimeters using authoritative physical conversion constants (`MillimetersPerDrawingUnit`) in IEEE 754 double precision with deterministic reference value matching across declared test domain (0, 1, -1, small, typical, large coordinates) and round-trip identity fidelity; numerical comparison is governed by double-precision test utility policy (`TEST_IMPLEMENTATION_DETAIL`); no unauthorized tolerance thresholds. | Workstream A | `UNIT_TEST` | Test runner report `TEST-F1-28` asserting coordinate suite accuracy | `PENDING` |
| **AC-F1-05** | **Geometric Tolerance Discipline:** Linear coincidence comparison uses typed `GeometricTolerance` with $\varepsilon = 10^{-4}\text{ mm}$; zero raw float equality. | Workstream A | `UNIT_TEST` | Unit tests asserting point/vector coincidence with $\varepsilon = 1e-4\text{ mm}$ | `PENDING` |
| **AC-F1-06** | **Identity Format Standard:** New TTC objects are assigned lower-case canonical RFC 4122 UUIDv4 strings without role prefixes. | Workstream A | `UNIT_TEST` | Regex test validating 36-char lowercase UUIDv4 format | `PENDING` |
| **AC-F1-07** | **Identity Persistence:** Closing, saving, and reopening a DWG preserves entity `TTC_OBJECT_ID` and `XRecord` metadata verbatim. | Workstream C | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-01` verifying Handle and UUID invariance | `PENDING` |
| **AC-F1-08** | **MOVE / ROTATE Invariance:** Executing native `MOVE` or `ROTATE` preserves existing `TTC_OBJECT_ID` and `ExtensionDictionary`. | Workstream E | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-18` verifying identity invariance across transforms | `PENDING` |
| **AC-F1-09** | **Native COPY Independence:** Executing native `COPY` results in source preserving ID and clone receiving distinct new UUIDv4. | Workstream E, H | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-02`, `TEST-F1-03` verifying clone ID mutation | `PENDING` |
| **AC-F1-10** | **Native ARRAY Independence:** Executing native `ARRAY` assigns distinct UUIDv4s to every independently generated resulting instance. | Workstream E, H | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-11` inspecting N array element IDs | `PENDING` |
| **AC-F1-11** | **Native MIRROR Semantics:** Source-preserved MIRROR assigns new UUIDv4 to clone; source-deleted MIRROR preserves ID on original. | Workstream E, H | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-10` verifying selective deep-clone semantics | `PENDING` |
| **AC-F1-12** | **Cross-Drawing Clone Safety:** Importing entities via `INSERT`, `WBLOCK`, or clipboard paste prevents duplicate IDs entering target database and ensures cross-drawing independent instances receive distinct fresh UUIDv4s. | Workstream I | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-12` verifying cross-DWG export postcondition | `PENDING` |
| **AC-F1-13** | **Metadata Header Round-Trip:** `TTC_METADATA_HEADER` writes, serializes, and deserializes all required and optional fields losslessly using standard DXF group code 1. | Workstream C | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-13` verifying round-trip serialization | `PENDING` |
| **AC-F1-14** | **XData Index Discovery:** Fast `Editor.SelectAll()` with `SelectionFilter` locates entities via `"TTC_CAD"` XData without treating XData as truth. | Workstream C | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-04` verifying fast selection filter execution | `PENDING` |
| **AC-F1-15** | **XData Mismatch & Fallback Recovery:** When XData is missing, corrupt, or mismatched with XRecord, the authoritative `ITtcMetadataAuditService` discovers the entity via XRecord scan, classifies status as `XDATA_INDEX_OUT_OF_SYNC`, and resynchronizes derivative `"TTC_CAD"` XData at an authorized write boundary. | Workstream F | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-14`, `TEST-F1-27` verifying audit & rebuild | `PENDING` |
| **AC-F1-16** | **Missing XRecord Protection:** Entity with orphan `XData` is classified as `METADATA_INCOMPLETE`; geometry is 100% preserved. | Workstream C, F | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-19` asserting classification and zero repair | `PENDING` |
| **AC-F1-17** | **Schema Forward Compatibility:** System safely reads known fields, preserves unknown fields verbatim on future minor schemas (`1.N.x`) without downward version rewrite; if lossless preservation cannot be guaranteed, mutation is aborted non-destructively returning operation result `OPERATION_ABORTED_PRESERVATION_RISK` without mutating entity classification; blocks future major schemas (`2.x.x`) with `UNSUPPORTED_SCHEMA`; and safely handles malformed syntax as `INVALID_METADATA`. | Workstream D | `UNIT_TEST` / `AUTOCAD_HOST_TEST` | Test runner reports `TEST-F1-13`, `TEST-F1-20`, `TEST-F1-29` | `PENDING` |
| **AC-F1-18** | **Undo / Redo Identity Invariance:** After any native Category A command (`COPY`, `ARRAY`, `MIRROR` preserve-source, `PASTECLIP`, `INSERT`, `ERASE`, `OOPS`) followed by UNDO/REDO sequences, the active database never contains duplicate `TTC_OBJECT_ID` instances; undone clones lose active identity and redo restores mutually independent identities. | Workstream E, H | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-21` across all Category A commands | `PENDING` |
| **AC-F1-19** | **Transaction Atomicity:** Aborting a multi-entity database transaction rolls back all created entities and dictionary records cleanly. | Workstream C | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-06` verifying complete rollback | `PENDING` |
| **AC-F1-20** | **DocumentLock Compliance:** Modeless palette and session operations acquire `DocumentLock` before database write transactions. | Workstream G | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-05`, `TEST-F1-22` asserting `eLockViolation` guard | `PENDING` |
| **AC-F1-21** | **Document Lifecycle & Reactor Safety:** Document event handlers subscribe to existing open documents at startup and newly created documents idempotently; database reactor callbacks perform zero writes, zero prompts, zero commands; reconciliation writes require explicit `DocumentLock`. | Workstream G, H | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-09`, `TEST-F1-15`, `TEST-F1-23`, `TEST-F1-26` | `PENDING` |
| **AC-F1-22** | **Common Block Validation:** Block references are validated for uniform scale, declared units, and clearance layer separation. | Workstream J | `AUTOCAD_HOST_TEST` | Host test log `TEST-F1-24` verifying block contract checks | `PENDING` |
| **AC-F1-23** | **Vanilla DWG Compatibility:** Drawings containing TTC metadata open and edit cleanly in standard AutoCAD with default warning settings (`PROXYNOTICE = 1`) with zero proxy warnings and zero proxy entity/object classes. | Workstream C | `AUTOCAD_HOST_TEST` / `MANUAL_AUTOCAD_2023` | Host test log `TEST-F1-07` asserting zero `ProxyEntity`/`ProxyObject` | `PENDING` |
| **AC-F1-24** | **ECAD Separation:** F1 code contains zero logic for EPLAN device tags, wire numbering, terminal strips, or electrical BOMs. | Workstream A | `STATIC_ANALYSIS` / `UNIT_TEST` | Codebase audit confirming zero ECAD/EPLAN references | `PENDING` |
| **AC-F1-25** | **Explicit F1 UI Scope:** Tranche F1 introduces zero visible engineering Ribbon buttons or component placement palettes. | Workstream G | `STATIC_ANALYSIS` / `MANUAL_AUTOCAD_2023` | UI inspection `TEST-F1-25` confirming zero feature UI additions | `PENDING` |

---

## 11. Open Issue Trace & Handling

All 10 canonical F1 issues were resolved at the specification gate (`RESOLVED_AT_SPEC_FREEZE`). Their empirical runtime evidence must be gathered and closed during future BUILD execution:

| Issue ID | Problem Summary | Blocks BUILD Entry? | Must Close By | Work Order Action | Required Evidence | Blocks AC |
|---|---|:---:|---|---|---|---|
| **ISSUE-F1-001** | Drawing-Unit Enforcement vs Validation Policy | NO | `BUILD_COMPLETION` | Implement `IDrawingUnitService` supporting `RESOLVED`, `UNRESOLVED`, `UNIT_CONFIGURATION_CONFLICT`. Verify `INSUNITS = 0` blocks physical placement. | Unit & host test logs for `TEST-F1-16`, `TEST-F1-17` | AC-F1-02, AC-F1-03 |
| **ISSUE-F1-002** | Unit Authority, Unitless DWGs, & Conflict States | NO | `BUILD_COMPLETION` | Enforce no silent mm assumption; implement project config precedence over `INSUNITS = 0`; block conflicting configs. | Unit test logs asserting deterministic resolution states | AC-F1-02, AC-F1-03 |
| **ISSUE-F1-003** | Geometric Tolerance Architecture | NO | `BUILD_COMPLETION` | Implement typed `GeometricTolerance` record in Core with linear coincidence $\varepsilon = 1e-4\text{ mm}$; verify double-precision conversions. | Unit test logs for `TEST-F1-28` across coordinate suite | AC-F1-04, AC-F1-05 |
| **ISSUE-F1-004** | `TTC_OBJECT_ID` Format & Global Uniqueness Scope | NO | `BUILD_COMPLETION` | Implement RFC 4122 UUIDv4 lowercase string representation; enforce cross-DWG uniqueness. | Unit & reflection tests validating UUIDv4 format | AC-F1-06, AC-F1-12 |
| **ISSUE-F1-005** | Identity Lifecycle Under Native Clone Operations | NO | `RUNTIME_ACCEPTANCE` | Implement Category A clone reconciliation; empirically test Mechanism A vs Mechanism B; verify UNDO/REDO identity invariance. | AutoCAD 2023 host test logs for `TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`, `TEST-F1-11`, `TEST-F1-12`, `TEST-F1-15`, `TEST-F1-21` | AC-F1-07, AC-F1-09, AC-F1-10, AC-F1-11, AC-F1-12, AC-F1-18 |
| **ISSUE-F1-006** | Metadata Storage Split: XRecord vs XData | NO | `BUILD_COMPLETION` | Implement authoritative `TTC_METADATA_HEADER` XRecord using DXF group code 1 and secondary `"TTC_CAD"` XData index; enforce XRecord wins. | Host test logs for `TEST-F1-04`, `TEST-F1-13`, `TEST-F1-14`, `TEST-F1-27` | AC-F1-13, AC-F1-14, AC-F1-15 |
| **ISSUE-F1-007** | Schema Versioning & Backward Compatibility | NO | `BUILD_COMPLETION` | Implement read-modify-write unknown field preservation for `1.N.x`; implement `OPERATION_ABORTED_PRESERVATION_RISK`; block `2.x.x`. | Unit & host test logs for `TEST-F1-13`, `TEST-F1-20`, `TEST-F1-29` | AC-F1-17 |
| **ISSUE-F1-008** | Reactor Safety & Cache Invalidation Strategy | NO | `RUNTIME_ACCEPTANCE` | Enforce observation-only DB reactors; wire `Document.CommandEnded/Cancelled/Failed`; enumerate open docs at startup; test `BeginSave` write safety. | AutoCAD 2023 host test logs for `TEST-F1-09`, `TEST-F1-15`, `TEST-F1-23`, `TEST-F1-26` | AC-F1-21 |
| **ISSUE-F1-009** | Common Mechanical Block Asset Contract | NO | `BUILD_COMPLETION` | Implement validation for 12 block domains (mounting base $(0,0,0)$, uniform scale derivation, declared units, clearance layer separation). | Host test logs for `TEST-F1-24` | AC-F1-22 |
| **ISSUE-F1-010** | Metadata Recovery & Conflict Resolution | NO | `BUILD_COMPLETION` | Implement `ITtcMetadataAuditService` and `IEntityIdentityAuditService`; test rebuild of missing XData and handling of unresolved collisions. | Host test logs for `TEST-F1-14`, `TEST-F1-19`, `TEST-F1-27` | AC-F1-15, AC-F1-16 |

> [!IMPORTANT]
> **Issue Gate Invariant:**
> All 10 canonical issues are closed at the Spec gate (`RESOLVED_AT_SPEC_FREEZE`). Their registered runtime evidence requirements represent active implementation and host validation work to be gathered during authorized BUILD/REVIEW execution. None of these issues block entry to BUILD.

---

## 12. Implementation Constraints & Architecture Boundaries

### 12.1 Project Dependency Boundary
```text
TTC.CadTools.Core
  ├── Zero AutoCAD references (AcCoreMgd, AcDbMgd, AcMgd strictly forbidden)
  ├── Pure domain contracts, interfaces, models, tolerances, units
  └── Standard .NET Framework 4.8 runtime only

TTC.CadTools.Infrastructure
  ├── Depends on: TTC.CadTools.Core
  ├── Zero AutoCAD references
  ├── Frozen F0 services (FileLogger, SettingsRepository)
  └── Standard .NET Framework 4.8 runtime only (READ-ONLY BY DEFAULT)

TTC.CadTools.AutoCAD
  ├── Depends on: TTC.CadTools.Core, TTC.CadTools.Infrastructure
  ├── References: AcCoreMgd.dll, AcDbMgd.dll, AcMgd.dll, AdWindows.dll (Private=False)
  └── Implements F1 host adapters, metadata persistence, clone reconciliation, audit services

TTC.CadTools.Tests
  ├── Depends on: TTC.CadTools.Core, TTC.CadTools.Infrastructure, TTC.CadTools.AutoCAD
  ├── References xUnit, Moq/test utilities
  └── Executes unit, reflection, and host integration test suites
```

### 12.2 AutoCAD Host References
AutoCAD Managed API references in `TTC.CadTools.AutoCAD.csproj` must be configured with:
```xml
<Private>False</Private>
```
and must never be packaged into the runtime distribution bundle or test binaries.

### 12.3 Pure Core Isolation & Reflection Guard
`TTC.CadTools.Core.dll` must have ZERO references to any assembly starting with `Ac` or `Autodesk`. This invariant is verified by static reflection test `TEST-F1-08`.

### 12.4 Frozen Claim Boundary
Per Section 1.2 and Section 16 of frozen `SPEC.md`:
- Frozen specification defines authoritative required contracts;
- Build implementation must produce verifiable proof of satisfaction;
- No acceptance criterion may be claimed as `PASS` without actual build and host execution evidence.

### 12.5 Core Workstreams Breakdown

- **Workstream A: Pure Core Engineering Contracts (`TTC.CadTools.Core`)**
  - Canonical engineering unit standard (`MILLIMETER`);
  - Authoritative physical conversion constants (`MillimetersPerDrawingUnit`);
  - Typed `GeometricTolerance` record with linear coincidence $\varepsilon = 10^{-4}\text{ mm}$;
  - Lowercase RFC 4122 UUIDv4 `TtcObjectId`;
  - Standardized failure classification taxonomy (`EntityFailureClassification`, 10 codes);
  - Standardized operation execution results (`OperationExecutionResult`, including `OPERATION_ABORTED_PRESERVATION_RISK`);
  - Domain service interfaces (`IDrawingUnitService`, `ITtcMetadataAuditService`, `IEntityIdentityAuditService`, `ICloneReconciliationService`).
- **Workstream B: Drawing Unit Host Adapter (`TTC.CadTools.AutoCAD.Units`)**
  - Implement `DrawingUnitService` reading drawing `INSUNITS` and project settings;
  - Return `PhysicalUnitResolution.Resolved`, `Unresolved`, or `ConfigurationConflict`;
  - Enforce zero silent mm assumption (`INSUNITS = 0` $\to$ `UNIT_UNRESOLVED`).
- **Workstream C: Authoritative Metadata Persistence (`TTC.CadTools.AutoCAD.Metadata`)**
  - Implement `TtcMetadataSerializer` writing `TTC_METADATA_HEADER` to `ExtensionDictionary` $\to$ `XRecord` using standard DXF group code 1 (`DxfCode.Text`);
  - Implement `TtcXDataService` registering RegApp `"TTC_CAD"` and writing secondary query index (< 100 bytes);
  - Implement fast selection query helper with `SelectionFilter` targeting `"TTC_CAD"`;
  - Ensure vanilla DWG compatibility (zero proxy entities/objects, `TEST-F1-07`).
- **Workstream D: Schema Forward Compatibility (`TTC.CadTools.AutoCAD.Metadata`)**
  - Read-modify-write unknown field preservation for future minor schemas (`1.N.x`);
  - Non-destructive write abort returning `OPERATION_ABORTED_PRESERVATION_RISK` when lossless preservation cannot be guaranteed;
  - Version preservation (never downgrade version string downward to `"1.0.0"`);
  - Read-only protection for future major schemas (`2.x.x`) with `UNSUPPORTED_SCHEMA`;
  - Corrupted syntax protection with `INVALID_METADATA`.
- **Workstream E: TTC Object Identity & Native Clone Lifecycle (`TTC.CadTools.AutoCAD.Lifecycle`)**
  - Full 18-operation lifecycle matrix support;
  - Category A active DB clone commands (`COPY`, `ARRAY`, `MIRROR` preserve-source, `PASTECLIP`, `INSERT`, `ERASE`, `OOPS`);
  - Assign distinct new UUIDv4 to clones; preserve ID on source;
  - Lineage tracking: `PROVENANCE_KNOWN` vs `PROVENANCE_UNKNOWN` (`COLLISION_UNRESOLVED`, zero silent overwrites, geometry preserved).
- **Workstream F: Metadata & Identity Audit Services (`TTC.CadTools.AutoCAD.Audit`)**
  - `ITtcMetadataAuditService`: Authoritative XRecord-based database enumeration; discover entities lacking XData (`XDATA_INDEX_OUT_OF_SYNC`); rebuild XData at safe write boundary; classify orphan XData as `METADATA_INCOMPLETE` without destructive repair;
  - `IEntityIdentityAuditService`: Discover duplicate UUIDv4 instances; flag collisions; provide audit reporting.
- **Workstream G: Document Lifecycle & Reactor Safety Handlers (`TTC.CadTools.AutoCAD.Lifecycle`)**
  - Observation-only database reactor (`TtcDatabaseReactor`): zero DB writes, zero prompts, zero commands; set `IsDirty` flag safely;
  - Managed document lifecycle manager (`DocumentLifecycleManager`): wire `Document.CommandEnded`, `CommandCancelled`, `CommandFailed`;
  - Startup open document enumeration in `Application.DocumentManager`;
  - Idempotent subscription to `DocumentCollection.DocumentCreated`;
  - Clean unsubscription and cache purge on document close (`Document.BeginDocumentClose`);
  - Per-document cache and state isolation (zero application-global static caches across DWGs).
- **Workstream H: Command-Boundary Reconciliation Host Validation (`TTC.CadTools.AutoCAD.Lifecycle`)**
  - Empirical evaluation of Candidate Mechanism A (direct `DocumentLock` + `Transaction` in `CommandEnded`) vs Candidate Mechanism B (deferred/idle callback);
  - Host validation of Category A UNDO / REDO identity invariant across all Category A commands (`TEST-F1-21`);
  - Investigation of `Database.BeginSave` write safety (`TEST-F1-09`).
- **Workstream I: Cross-DWG Safety & WBLOCK Postcondition (`TTC.CadTools.AutoCAD.Lifecycle`)**
  - Supported `WBLOCK` export postcondition handler: ensure target DWG valid TTC instances persist distinct `TTC_OBJECT_ID` values;
  - Cross-drawing clipboard paste (`COPYCLIP`/`PASTECLIP`) and block `INSERT` safety.
- **Workstream J: Common Block Contract Validation (`TTC.CadTools.AutoCAD.Blocks`)**
  - Implement `BlockContractValidator`: mounting base point $(0,0,0)$, uniform scale calculation, declared asset unit validation, clearance layer separation.

---

## 13. Required Tests & Test Execution Matrix (29 Tests)

The following 29 empirical and automated tests map directly from frozen `SPEC.md` Section 17. Every test must execute and pass during the future BUILD stage:

| Test ID | Test Name | Category | Mapped ACs | Required Result | Status |
|---|---|---|---|:---:|:---:|
| **TEST-F1-01** | Handle and Identity Invariance Across Save/Reopen | Host Integration Test | `AC-F1-07` | PASS | `PENDING` |
| **TEST-F1-02** | Native COPY Handle Uniqueness | Host Integration Test | `AC-F1-09` | PASS | `PENDING` |
| **TEST-F1-03** | XRecord Clone Host Behavior | Host Integration Test | `AC-F1-09` | PASS | `PENDING` |
| **TEST-F1-04** | Hybrid Storage Selection Filter | Host Integration Test | `AC-F1-14` | PASS | `PENDING` |
| **TEST-F1-05** | Modeless DocumentLock Enforcement | Host Negative Test | `AC-F1-20` | PASS | `PENDING` |
| **TEST-F1-06** | Transaction Abort Atomicity & Rollback | Host Integration Test | `AC-F1-19` | PASS | `PENDING` |
| **TEST-F1-07** | Vanilla DWG Proxy-Free Compatibility & Class Audit | Host Integration Test / Audit | `AC-F1-23` | PASS | `PENDING` |
| **TEST-F1-08** | Core Assembly Decoupling Integrity | Reflection Test / Static | `AC-F1-01` | PASS | `PENDING` |
| **TEST-F1-09** | BeginSave Write Safety Investigation | Host Empirical Investigation | `AC-F1-21` | PASS | `PENDING` |
| **TEST-F1-10** | MIRROR Selective Deep-Clone & Identity Preservation | Host Integration Test | `AC-F1-11` | PASS | `PENDING` |
| **TEST-F1-11** | ARRAY Instance Identity Duplication and Fresh UUID Assignment | Host Integration Test | `AC-F1-10` | PASS | `PENDING` |
| **TEST-F1-12** | WBLOCK Export, INSERT, and Clipboard Cross-Database Independence | Host Integration Test | `AC-F1-12` | PASS | `PENDING` |
| **TEST-F1-13** | Keyed Schema Lossless Round-Trip & Unknown Field Preservation | Host Integration Test | `AC-F1-13`, `AC-F1-17` | PASS | `PENDING` |
| **TEST-F1-14** | XData/XRecord Mismatch Safe Resynchronization | Host Integration Test | `AC-F1-15` | PASS | `PENDING` |
| **TEST-F1-15** | Command-Boundary Reconciliation Safety & Mechanism Verification | Host Integration Test | `AC-F1-21` | PASS | `PENDING` |
| **TEST-F1-16** | Host Unit Resolution States | Host Integration Test | `AC-F1-02` | PASS | `PENDING` |
| **TEST-F1-17** | Unitless INSUNITS=0 Host Enforcement | Host Integration Test | `AC-F1-03` | PASS | `PENDING` |
| **TEST-F1-18** | MOVE / ROTATE Identity Preservation | Host Integration Test | `AC-F1-08` | PASS | `PENDING` |
| **TEST-F1-19** | Orphan XData / Missing XRecord Non-Destructive Protection | Host Negative Test | `AC-F1-16` | PASS | `PENDING` |
| **TEST-F1-20** | Unsupported Schema Protection & Malformed Metadata Safety | Host Negative Test | `AC-F1-17` | PASS | `PENDING` |
| **TEST-F1-21** | Native Clone & Mutation Undo/Redo Behavioral Invariant Verification | Host Integration Test | `AC-F1-18` | PASS | `PENDING` |
| **TEST-F1-22** | Session and Zero-Document Safety | Host Integration Test | `AC-F1-20` | PASS | `PENDING` |
| **TEST-F1-23** | Database Reactor Observation-Only Safety | Host Integration Test | `AC-F1-21` | PASS | `PENDING` |
| **TEST-F1-24** | Common Block Scale, Rotation, and Redefinition Verification | Host Integration Test | `AC-F1-22` | PASS | `PENDING` |
| **TEST-F1-25** | F1 Headless UI Scope Audit | Host Inspection / Audit | `AC-F1-25` | PASS | `PENDING` |
| **TEST-F1-26** | Existing Document Event Subscription at Plugin Load | Host Integration Test | `AC-F1-21` | PASS | `PENDING` |
| **TEST-F1-27** | Missing-XData Authoritative Fallback Discovery & Index Rebuild | Host Integration Test | `AC-F1-14`, `AC-F1-15` | PASS | `PENDING` |
| **TEST-F1-28** | Pure Core Unit Conversion Reference Value & Round-Trip Tests | Unit Test | `AC-F1-04` | PASS | `PENDING` |
| **TEST-F1-29** | Future-Minor Lossless Write Guard & Preservation Risk Abort Verification | Unit / Integration Test | `AC-F1-17` | PASS | `PENDING` |

### 13.1 High-Risk Tests & Dedicated Verification Protocols

The following 7 tests address complex host behaviors and require explicit verification protocols:

1. **`TEST-F1-09` (BeginSave Write Safety Investigation):**
   - *Risk:* AutoCAD `Database.BeginSave` event operates during database serialization; attempting to open entities for write or commit transactions inside `BeginSave` can cause AutoCAD crash or drawing corruption.
   - *Protocol:* Investigate empirically whether transactions in `BeginSave` succeed safely. If hazardous, enforce the Spec invariant: F1 identity consistency does NOT depend on `BeginSave` writes; mutations occur at command boundary.
2. **`TEST-F1-12` (WBLOCK Cross-Database Independence & Export Postcondition):**
   - *Risk:* Native `wblockClone` copies extension dictionaries into target database verbatim, creating duplicate `TTC_OBJECT_ID` instances across DWG files.
   - *Protocol:* Execute supported `WBLOCK` workflow; inspect target database (e.g. reopen target DWG); assert target `TTC_OBJECT_ID` values are distinct fresh UUIDv4s and source IDs are preserved; verify cross-DWG `INSERT`, `COPYCLIP`, and `PASTECLIP`.
3. **`TEST-F1-15` (Command-Boundary Reconciliation Mechanism Verification):**
   - *Risk:* Mutating the database inside or immediately following `Document.CommandEnded` may interfere with AutoCAD command finalization or document locking.
   - *Protocol:* Compare Candidate Mechanism A (direct `DocumentLock` + `Transaction` in handler) vs Candidate Mechanism B (deferred/idle execution context). Verify zero host exceptions, zero deadlocks, and clean transaction completion.
4. **`TEST-F1-21` (Category A UNDO / REDO Invariant Verification):**
   - *Risk:* Post-command clone reconciliation adds a transaction to the Undo stack; user executing `UNDO` might revert reconciliation without reverting the clone, leading to identity collisions.
   - *Protocol:* Execute full sequence: Category A command $\to$ reconcile $\to$ verify distinct UUIDs $\to$ `UNDO` $\to$ verify clone entity is removed without leaving duplicate UUID $\to$ `REDO` $\to$ verify independent UUIDs restored. Repeat across ALL Category A commands: `COPY`, `ARRAY`, `MIRROR` (preserve source), `PASTECLIP`, `INSERT`, `ERASE`/`OOPS`.
5. **`TEST-F1-26` (Existing Document Subscription at Plugin Load):**
   - *Risk:* If user loads plugin via `NETLOAD` or on-demand after opening drawings, documents opened before initialization might miss document event subscriptions.
   - *Protocol:* Open drawing $\to$ initialize plugin $\to$ execute native `COPY` $\to$ verify command boundary event fires and clone reconciliation succeeds without needing document reopen.
6. **`TEST-F1-27` (Missing-XData Fallback Discovery & Rebuild):**
   - *Risk:* Corrupted or stripped XData renders entities invisible to fast selection queries.
   - *Protocol:* Create entity with valid XRecord $\to$ strip `"TTC_CAD"` XData $\to$ assert fast `SelectAll` fails $\to$ execute `ITtcMetadataAuditService` $\to$ assert entity discovered via XRecord scan $\to$ assert status `XDATA_INDEX_OUT_OF_SYNC` $\to$ rebuild XData under lock/transaction $\to$ assert fast `SelectAll` now succeeds.
7. **`TEST-F1-29` (Future-Minor Lossless Write Guard & Preservation Risk Abort):**
   - *Risk:* Plugin operating on future minor schema (`1.N.x`) might strip unrecognized fields upon saving entity changes.
   - *Protocol:* Attach metadata with future minor schema version and unknown keys $\to$ simulate mutation context where unknown fields cannot be preserved $\to$ assert transaction aborts non-destructively, entity failure classification is NOT altered, `TTC_SCHEMA_VERSION` is NOT downgraded, unknown fields are NOT stripped, geometry is 100% preserved, and operation returns `OPERATION_ABORTED_PRESERVATION_RISK`.

---

## 14. Execution Phasing Plan

When approved by the Product Owner, BUILD execution must proceed in 11 strictly sequenced phases:

```
+-----------------------------------------------------------------------------------+
| Phase 0: Pre-Flight & F0 Regression Verification (45 tests pass)                  |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 1: Pure Core Domain Contracts (Units, Tolerances, UUID, Failure Taxonomy)   |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 2: Drawing Unit Host Adapter (IDrawingUnitService, INSUNITS Evaluation)     |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 3: Authoritative Metadata Persistence (XRecord + XData Serializer)         |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 4: Schema Forward Compatibility (Unknown Keys, OPERATION_ABORTED Risk Guard)|
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 5: Document Lifecycle & Reactor Safety (Observation-Only, Event Subscriptions|
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 6: Native Command Clone Reconciliation (Category A Commands, UNDO/REDO Invar)|
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 7: Metadata & Identity Audit Services (Missing XData Rebuild, Collision Flag|
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 8: Common CAD Block Contract Validation (12 Domains, Uniform Scale Check)   |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 9: Cross-DWG Safety & WBLOCK Postcondition (TEST-F1-12, Clipboard Safety)   |
+-----------------------------------------------------------------------------------+
                                         |
+-----------------------------------------------------------------------------------+
| Phase 10: Host Evidence Consolidation, F0 Regression Audit, & Completion Packet   |
+-----------------------------------------------------------------------------------+
```

- **Phase 0: Pre-Flight & Baseline Verification**
  - Verify clean working tree, HEAD, and frozen Spec commit `7941d89abbb0c809f571b19689442a21189a5103`.
  - Execute `dotnet test production/TTC.CadTools.Tests/TTC.CadTools.Tests.csproj` asserting 45/45 F0 tests pass.
- **Phase 1: Pure Core Domain Contracts (`TTC.CadTools.Core`)**
  - Implement units, authoritative conversion constants, `GeometricTolerance` ($\varepsilon = 10^{-4}\text{ mm}$), `TtcObjectId` (RFC 4122 UUIDv4 lowercase), metadata models, failure classifications, and operation execution results (`OPERATION_ABORTED_PRESERVATION_RISK`).
  - Add unit tests for conversions (`TEST-F1-28`), tolerances, UUID format, and reflection test `TEST-F1-08` verifying zero Autodesk dependencies in Core.
- **Phase 2: Drawing Unit Host Adapter (`TTC.CadTools.AutoCAD.Units`)**
  - Implement `DrawingUnitService` evaluating `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`.
  - Add unit/host tests `TEST-F1-16`, `TEST-F1-17`.
- **Phase 3: Authoritative Metadata Persistence (`TTC.CadTools.AutoCAD.Metadata`)**
  - Implement `TtcMetadataSerializer` (`TTC_METADATA_HEADER` XRecord, DXF group code 1, `ResultBuffer`) and `TtcXDataService` (`"TTC_CAD"` RegApp, fast query index).
  - Add host tests `TEST-F1-01`, `TEST-F1-04`, `TEST-F1-06`, `TEST-F1-07` (zero proxy entities).
- **Phase 4: Schema Forward Compatibility & Read-Modify-Write Safety**
  - Implement unknown field preservation for `1.N.x`, read-only protection for `2.x.x`, malformed syntax protection, and `OPERATION_ABORTED_PRESERVATION_RISK` guard.
  - Add tests `TEST-F1-13`, `TEST-F1-20`, `TEST-F1-29`.
- **Phase 5: Document Lifecycle & Reactor Safety Handlers**
  - Implement observation-only `TtcDatabaseReactor` and `DocumentLifecycleManager` (`CommandEnded`, `CommandCancelled`, `CommandFailed`, startup enumeration, `DocumentCreated` subscription, per-document isolation).
  - Add tests `TEST-F1-05`, `TEST-F1-22`, `TEST-F1-23`, `TEST-F1-26`.
- **Phase 6: Native Command Clone Lifecycle & Identity Reconciliation**
  - Implement Category A command clone reconciliation; empirically investigate Mechanism A vs Mechanism B; enforce Category A UNDO / REDO identity invariance.
  - Add host tests `TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`, `TEST-F1-11`, `TEST-F1-15`, `TEST-F1-18`, `TEST-F1-21`.
- **Phase 7: Metadata & Identity Audit Services**
  - Implement `ITtcMetadataAuditService` (missing-XData rebuild at safe write boundary) and `IEntityIdentityAuditService` (collision detection, collision flagging).
  - Add host tests `TEST-F1-14`, `TEST-F1-19`, `TEST-F1-27`.
- **Phase 8: Common CAD Block Contract Validation**
  - Implement `BlockContractValidator` (mounting base $(0,0,0)$, uniform scale calculation, declared units, clearance layer separation).
  - Add host test `TEST-F1-24`.
- **Phase 9: Cross-DWG Safety & WBLOCK Postcondition**
  - Implement `WblockExportHandler` postcondition and cross-drawing clipboard paste safety.
  - Add host test `TEST-F1-12`.
- **Phase 10: Host Evidence Consolidation, F0 Regression Audit, & Completion Packet**
  - Execute full test suite (F0 + F1 tests); verify 0 regressions against F0 baseline.
  - Execute F1 Headless UI Scope Audit (`TEST-F1-25`).
  - Compile completion packet conforming to Section 17; update continuity artifacts; stop for independent review.

---

## 15. Stop Conditions

The executing agent must immediately STOP and report a blocking condition if any of the following occur:

- `BLOCKED_SPEC_AMBIGUITY`: If required technical behavior is missing, ambiguous, or contradictory in frozen `SPEC.md` v1.0.0. Identify the exact section and earliest stage requiring reopen.
- `BLOCKED_SCOPE_EXPANSION`: If resolving an issue requires modifying files outside Allowed Paths (e.g. `src/`, `docs/tranches/F0/`, future tranches) or widening tranche scope.
- `BLOCKED_FROZEN_SPEC_CONFLICT`: If implementation requirements or host behaviors directly conflict with the frozen F1 specification.
- `BLOCKED_STALE_SOURCE_FACT`: If actual source code, project dependencies, or repository baseline contradict material assumptions in this Work Order.
- `BLOCKED_HOST_BEHAVIOR`: If physical AutoCAD 2023 runtime environment cannot support a frozen specification requirement or demonstrates unresolvable host instability.
- `BLOCKED_DEPENDENCY_REGRESSION`: If F0 functionality or any of the 45 F0 automated tests regress during F1 implementation.
- `BLOCKED_UNAUTHORIZED_PATH`: If any tool attempts to create or mutate files outside the explicit Allowed Paths.
- `BLOCKED_CONTINUITY_CONFLICT`: If repository continuity artifacts contain unreconciled contradictions.

> [!NOTE]
> **Open Issues Stop Condition Rule:**
> Open runtime/build verification items registered in `ISSUE-F1-001` through `ISSUE-F1-010` do NOT themselves trigger a stop condition upon BUILD entry. A stop condition is triggered during BUILD only if new evidence demonstrates that an issue cannot be resolved within the frozen Spec contracts and approved Work Order scope.

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
- Add end-user feature UI;
- Implement features belonging to downstream tranches.

---

## 17. Required Completion Packet

When BUILD execution is completed under an approved Work Order, the agent must return a Completion Packet conforming to this structure:

```text
==================================================
TTC CAD — BUILD COMPLETION PACKET: WO-F1-001
==================================================

1. EXECUTION IDENTITY
   - Work Order ID: WO-F1-001
   - Tranche: F1 — Common CAD Contracts
   - Implementer: Antigravity
   - Execution Status: PASS / PARTIAL / BLOCKED
   - Base Commit: <start-commit-sha>
   - Result Commit: <result-commit-sha>

2. SPECIFICATION & SCOPE COMPLIANCE
   - Frozen Spec: docs/tranches/F1/SPEC.md v1.0.0 (Commit: 7941d89abbb0c809f571b19689442a21189a5103)
   - Spec Compliance: PASS / FAIL
   - Scope Compliance: PASS / FAIL (All changes inside Allowed Paths)
   - Decoupling Compliance: PASS / FAIL (TTC.CadTools.Core has 0 Autodesk refs)
   - Headless Scope Compliance: PASS / FAIL (0 feature UI additions)

3. BUILD & COMPILATION EVIDENCE
   - Build Toolchain: <msbuild / dotnet version>
   - Target Framework: .NET Framework 4.8
   - Build Outcome: PASS (0 errors, N warnings documented)

4. UNIT & STATIC TEST EVIDENCE
   - Test Runner: dotnet test / vstest
   - Total Tests Executed: N (45 F0 inherited + M F1 new)
   - Tests Passed: N / Failed: 0
   - F0 Regression Audit: PASS (45/45 F0 tests pass)
   - Assembly Isolation: PASS (TEST-F1-08)

5. AUTOCAD 2023 HOST RUNTIME EVIDENCE
   - Host Version: AutoCAD 2023 (Series R24.2)
   - Runtime Acceptance Tests: TEST-F1-01 through TEST-F1-29 status & evidence paths
   - High-Risk Test Closures:
     * TEST-F1-09 (BeginSave write safety outcome)
     * TEST-F1-12 (WBLOCK target DWG identity independence)
     * TEST-F1-15 (Mechanism A vs Mechanism B verification)
     * TEST-F1-21 (Category A UNDO / REDO invariant verification)
     * TEST-F1-26 (Startup open document subscription)
     * TEST-F1-27 (Missing-XData authoritative fallback discovery & rebuild)
     * TEST-F1-29 (OPERATION_ABORTED_PRESERVATION_RISK verification)

6. ACCEPTANCE CRITERIA TRACE MATRIX
   - AC-F1-01 to AC-F1-25 status (PASS / FAIL / NOT_RUN)

7. ISSUE REGISTRY UPDATE
   - Status of ISSUE-F1-001 through ISSUE-F1-010 runtime evidence

8. CHANGED FILES AUDIT
   - Complete list of created/modified production files

9. CONTINUITY SYNCHRONIZATION
   - Execution Log, Tranche Status, Project Progress, Agent Handoff

10. NEXT REQUIRED STAGE
    - REVIEW (REV-F1-BUILD-001)
==================================================
```

---

## 18. Approval For Execution

```text
Work Order Status:
DRAFT / PENDING_INDEPENDENT_REVIEW

Execution Authorization:
NOT AUTHORIZED

Production Build Authorization:
NONE

Reviewer Disposition:
PENDING (REV-WO-F1-001-001)

Product Owner Disposition:
PENDING_REVIEW

Approved Execution Baseline:
NONE

Runtime Acceptance:
PENDING_BUILD_VALIDATION

Implementation:
NOT_STARTED
```

> *Note: Production BUILD remains strictly NOT AUTHORIZED until this Work Order has passed independent technical review (`REV-WO-F1-001-001`) and received explicit Product Owner approval.*

---

## 19. Work Order Closeout & Execution Outcome

```text
Work Order:
WO-F1-001

Historical Authority:
PENDING_APPROVAL

Execution:
NOT_STARTED

Reviewed Implementation Baseline:
NONE

Independent Implementation Review:
PENDING

Product Owner Decision:
PENDING

Acceptance:
0/25 PASS (PENDING_BUILD)

Issues:
10/10 RESOLVED_AT_SPEC_FREEZE (Runtime Evidence: PENDING_BUILD)

Tranche Result:
IN_PROGRESS (SPEC_FROZEN / WORK_ORDER_DRAFT)

F1 Production Mutation:
NOT AUTHORIZED
```
