# Tranche F1: Common CAD Contracts — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F1.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

### 1. Registry Summary

- **Total Registered Issues:** 10
- **Status:** ALL OPEN (`SPEC_CORRECTED`)
- **Current Lifecycle Gate:** `SPEC_RE_REVIEW` (External Independent Review `REV-F1-SPEC-001-R4` Pending)
- **Issues Blocking BUILD Entry:** 10 (Must be formalized in SPEC and approved before Work Order / BUILD)
- **Disposition Breakdown:**
  - `SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`: 10 (`ISSUE-F1-001` through `ISSUE-F1-010`)
- **Target Resolution Gates:**
  - `SPEC_FREEZE`: 10 (Formalized and corrected in `SPEC-FOUNDATION-F1-001` v0.4.0; awaiting independent Spec re-review `REV-F1-SPEC-001-R4` & Product Owner freeze)
- **Verification Evidence Gate:**
  - `BUILD_VALIDATION`: 10 (Empirical runtime host evidence to be collected during BUILD stage via `TEST-F1-01`..`TEST-F1-28`)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status | Verification Evidence Gate |
|---|---|---|---|:---:|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-02` | Handling non-millimeter, unitless, and conflicted DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-010` | Corrupt, orphan, or missing metadata recovery strategy | `INTAKE.md` §12 | **ISSUE-F1-010** | YES | `SPEC_FREEZE` | **SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW** | `BUILD_VALIDATION` |

---

## 3. Canonical Issues Register

### ISSUE-F1-001: Drawing-Unit Enforcement vs Validation/Warning Policy
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Product Owner / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Candidate standard proposes `INSUNITS = 4` (Millimeters). However, AutoCAD drawings may have `INSUNITS = 0` (Unitless), `1` (Inches), or other values. Does TTC CAD strictly block commands if `INSUNITS != 4`, prompt the user to configure units, or perform runtime scaling?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A):**
  - Implement a 2-tier unit adapter: pure Core `EngineeringUnit` and host `IDrawingUnitService` (`TTC.CadTools.AutoCAD.Units`).
  - Unit resolution states: `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`.
  - For Panel Designer: `INSUNITS = 4` trusted at 1:1; `INSUNITS = 0` requires project configuration or explicit user confirmation; non-metric (`INSUNITS = 1`) emits validation block dialog.
  - For M&E: drawing units remain configurable per project settings.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §3.2, §3.3, §3.5, `AC-F1-02`, `AC-F1-03`, `AC-F1-04`, `TEST-F1-16`, `TEST-F1-17`, `TEST-F1-28`):**
  - Formalized 3 deterministic states: `RESOLVED`, `UNRESOLVED`, `UNIT_CONFIGURATION_CONFLICT`.
  - Core canonical engineering linear unit is `MILLIMETER`.
  - Host adapter performs conversion at boundary using explicit conversion constants (`MillimetersPerDrawingUnit`); unit conversion executes in IEEE 754 double precision with deterministic reference value matching and round-trip identity fidelity (`AC-F1-04`, `TEST-F1-28`, addressing R2-F01, R2-F04, R3-F02).
  - `UNRESOLVED` and `UNIT_CONFIGURATION_CONFLICT` deterministically block physical-unit commands; zero silent conversion or silent `INSUNITS` mutation.
  - Downstream modules (e.g. P2) may constrain allowed `RESOLVED` units to millimeters without hard-coding into F1 common engine.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-002: Unit Authority, Unitless DWGs, and Configuration Conflicts
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Legacy or enterprise drawings may use `INSUNITS = 0` (Unspecified/Unitless). `MEASUREMENT` controls hatch/linetype libraries, not model geometry units, and `LUNITS` is coordinate display format only. `INSUNITSDEFSOURCE`/`TARGET` provide insertion scaling defaults but do not define physical scale of model geometry. Additionally, project configuration may conflict with drawing `INSUNITS`.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A.3):**
  - Strict resolution precedence: (1) Explicit project/workspace configuration; (2) Explicit non-zero `INSUNITS`; (3) Unitless drawings requiring approved configuration or user confirmation.
  - No silent millimeter assumption. Status remains `PhysicalUnitResolution = UNRESOLVED` until resolved.
  - Contradictions between project configuration and non-zero `INSUNITS` trigger `UNIT_CONFIGURATION_CONFLICT`. Neither source is silently chosen; automated scaling/placement is held until resolved.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §3.2, §3.4, §15, `AC-F1-02`, `AC-F1-03`, `TEST-F1-16`, `TEST-F1-17`):**
  - Explicit rule: `MEASUREMENT` MUST NOT determine physical units; `LUNITS` MUST NOT determine physical units; `INSUNITSDEFSOURCE` / `TARGET` are insertion scaling defaults only and MUST NOT prove model units.
  - Drawing with `INSUNITS = 0` without project config evaluates to `UNRESOLVED` and never silently defaults to millimeters (`AC-F1-03`).
  - Contradiction between non-zero `INSUNITS` and project config triggers `UNIT_CONFIGURATION_CONFLICT` and blocks physical operations without silent rescaling.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / CORE_MATH
- **Owner:** Core Developer
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** A single scalar tolerance $\varepsilon = 10^{-4}\text{ mm}$ cannot be meaningfully applied across all geometric calculations (linear distance vs angular alignment vs collinearity vs zero-length segment rejection).
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §B):**
  - Architecture resolved: Typed Tolerance Record (`GeometricTolerance` struct) in pure Core (`TTC.CadTools.Core.Geometry`).
  - Candidate linear tolerance $\varepsilon = 10^{-4}\text{ mm}$ retained as the sole authorized candidate.
  - All other numerical tolerance thresholds are marked `TO_BE_DETERMINED_IN_SPEC`.
  - Zero AutoCAD assembly references in Core math contracts.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §3.3, §4, `AC-F1-04`, `AC-F1-05`, `TEST-F1-28`):**
  - Typed `GeometricTolerance` immutable record specified in pure Core (`TTC.CadTools.Core.Geometry`).
  - Zero Autodesk references in Core assemblies (`AC-F1-01`).
  - Linear coincidence tolerance $\varepsilon = 10^{-4}\text{ mm}$ formalized and proposed for freeze.
  - Prohibited reusing candidate linear tolerance $\varepsilon = 10^{-4}\text{ mm}$ as a general floating-point conversion accuracy threshold (addressing R2-F01).
  - Unit conversion evaluation: §3.3 explicitly specifies a deterministic test suite of coordinate values (`0.0`, `1.0`, `-1.0`, `0.001`, `1250.75`, `500000.0`) and classifies the comparison policy as a `TEST_IMPLEMENTATION_DETAIL` (e.g. bounded relative/ULP comparison in the test harness) to avoid inventing a domain engineering tolerance for machine rounding errors (`AC-F1-04`, `TEST-F1-28`, addressing R3-F02).
  - Removed unauthorized precision threshold `< 1e-9 mm>` from `AC-F1-04`; unit conversions use authoritative physical conversion constants (`MillimetersPerDrawingUnit`) evaluated in IEEE 754 double precision (`TEST-F1-28`).
  - All other tolerance categories (`AngularAlignment`, `ZeroLength`, `ScaleComparison`) explicitly marked `NO GLOBAL VALUE IN F1 v1`; must be supplied by caller or downstream spec.
  - Raw floating-point equality comparison prohibited across all geometry routines.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-004: TTC_OBJECT_ID Generation Format and Uniqueness Scope
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / IDENTITY
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Architecture requires stable internal drawing instance identity (`TTC_OBJECT_ID`). Scope must strictly identify one TTC-managed AutoCAD drawing entity instance, without conflating catalog (`TTC_LIBRARY_ID`), BOM, or EPLAN identity. Format must be evaluated for classification divergence if entity role/type changes.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §C):**
  - Scope clarified: Identifies one TTC-managed AutoCAD drawing object instance. Catalog reference uses `TTC_LIBRARY_ID`. EPLAN Device Tag management belongs exclusively to the separate EPLAN 2022 toolchain (C2 owns clean DWG/DXF export only).
  - Format evaluation: Pure UUIDv4 (practical global uniqueness with negligibly small collision probability; decoupled from role) vs Prefixed Slug + UUID (human-readable, but carries risk of semantic divergence if entity role changes).
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §5, §11, `AC-F1-06`, `AC-F1-12`, `TEST-F1-12`):**
  - Scope locked: Uniquely identifies exactly one TTC-managed AutoCAD drawing object instance. Decoupled from `TTC_LIBRARY_ID`, EPLAN Device Tags, BOMs, Handles, and ObjectIds.
  - Format formalized: RFC 4122 Version 4 UUID canonical lower-case string (`Guid.ToString("D")`, 36 characters).
  - Role prefix rejected: Pure UUID without object-type slug; semantic classification resides independently in `TTC_OBJECT_TYPE` to prevent identity mutation on reclassification.
  - Uniqueness invariant (Addressing F01): No two independent TTC objects in a database—or across separate drawings within a project—may share the same valid `TTC_OBJECT_ID`. Distinct physical/semantic instances across drawings MUST possess distinct UUIDs (`AC-F1-12`, `TEST-F1-12`).
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** CRITICAL
- **Category:** CAD_API / LIFECYCLE
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Native commands clone extension dictionaries and XRecords without semantic inspection. As cataloged in Autodesk DevGuide (*AutoCAD Commands That Use Deep Clone and Wblock Clone*), `COPY`, `ARRAY`, and selective `MIRROR` (when source is preserved) use `deepClone`, duplicating `TTC_OBJECT_ID`. `COPYCLIP`, `PASTECLIP`, and `WBLOCK` use `wblockClone`. When `MIRROR` erases source, `deepClone` is not used. How does TTC CAD resolve identity duplication without circular lifecycle dependencies or unverified runtime assumptions?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §G):**
  - **Spec Authority & Invariants:** Every independently cloned TTC drawing object must eventually possess a unique `TTC_OBJECT_ID`.
  - **Two-State Lineage Model:**
    - **State A (Provenance Known):** Source retains ID; clone receives new ID; operation logged.
    - **State B (Provenance Unknown):** Classified as `COLLISION_UNRESOLVED`. No silent guessing or arbitrary rewriting of entities. Controlled reconciliation workflow defined in SPEC.
  - **Pre-Save Safety:** SPEC behavior does NOT depend on unverified `Database.BeginSave` mutation.
  - **Generic Service:** `IEntityIdentityAuditService` defined in F1 for cross-tranche reuse.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §10, §10.1, §11, §12.2, `AC-F1-09`, `AC-F1-10`, `AC-F1-11`, `AC-F1-12`, `AC-F1-18`, `TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`, `TEST-F1-15`, `TEST-F1-21`):**
  - Comprehensive native edit lifecycle matrix formalized (§10, §10.1), categorizing commands into:
    - **Category A (Active Database Direct Clone/Mutation):** `COPY`, `ARRAY`, `MIRROR` (preserve-source), `PASTECLIP`, `INSERT` (drawing/block reference insertion), `ERASE`, `OOPS`. All Category A commands are subject to the strict Undo/Redo invariant: duplicate active UUIDs are strictly forbidden; clones undone lose active identity; clones redone restore distinct identities (`AC-F1-18`, `TEST-F1-21`, addressing R3-F04).
    - **Category B (Cross-Database Export / Out-of-Scope Commands):** `WBLOCK` (exports objects to a secondary database on disk; exported entities receive fresh identities upon insertion into an active database and do not participate in the source drawing's Undo stack).
  - Formalized two candidate implementation mechanisms for command-boundary reconciliation (§10.1, §12.2, addressing R3-F01):
    - **Mechanism A:** Direct write under active `DocumentLock` and database `Transaction` initiated from `CommandEnded`.
    - **Mechanism B:** Deferred/scheduled write via application message pump / idle callback (`Application.Idle`).
    - Exact host stability and undo grouping of both mechanisms are classified as `BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED` in `TEST-F1-15` and `TEST-F1-21` without presuming unverified host stability.
  - Native command boundary handlers attach to `Autodesk.AutoCAD.ApplicationServices.Document` (`CommandEnded`, `CommandCancelled`, `CommandFailed`), NOT `Editor`.
  - Database reactors remain strictly observation and invalidation only; reconciliation writes require explicit `DocumentLock` and database `Transaction` at command boundaries.
  - Two-state lineage model formalized (§11): State A (`PROVENANCE_KNOWN`) updates clone UUID atomically; State B (`PROVENANCE_UNKNOWN`) classifies `COLLISION_UNRESOLVED` without silent survivor guessing or Handle-age heuristics.
  - Generic `IEntityIdentityAuditService` specified for collision reporting.
  - Empirical host tests (`TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`, `TEST-F1-15`, `TEST-F1-21`) established as BUILD acceptance evidence.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Clear demarcation required between XData (~16 KB total limit per entity across all applications) and ExtensionDictionary (up to 2 GB per XRecord).
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §D):**
  - Architecture resolved: **Canonical Storage Matrix**.
  - `ExtensionDictionary / XRecord` is the primary authoritative source of truth for all structured metadata (`TTC_OBJECT_ID`, `TTC_OBJECT_TYPE`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, `TTC_LIBRARY_VERSION`).
  - Registered `XData` (`TTC_CAD`) contains secondary / cached copy of `TTC_OBJECT_TYPE` and `TTC_OBJECT_ID` for fast selection filtering.
  - Mismatch rule: `XRecord` wins; `XData` is resynchronized.
  - 100% vanilla DWG compatible; zero custom ObjectARX classes.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §7, §8, §8.4, `AC-F1-13`, `AC-F1-14`, `AC-F1-15`, `AC-F1-16`, `TEST-F1-04`, `TEST-F1-27`):**
  - Canonical storage matrix formalized: `XRecord` (`TTC_METADATA_HEADER`) is primary authoritative source of truth; registered `XData` (`TTC_CAD`) is secondary fast-query index (< 100 bytes).
  - DXF encoding formalized (Addressing F02): `XRecord` ResultBuffers encode properties using standard DXF group codes < 1000 (specifically Group Code 1 / `DxfCode.Text` for string keys and values); group codes 1000–1071 are reserved strictly for `XData`.
  - Invariant: `XRecord` wins all conflicts; out-of-sync XData resynchronized at safe write boundaries (`AC-F1-15`).
  - Added Authoritative Fallback Discovery & Index Rebuild Service (§8.4, addressing R2-F06): when entities lack fast-query XData (external clean, script strip), authoritative extension dictionary scan discovers entities and rebuilds index without loss; full scan strictly prohibited during cursor/point monitoring (`TEST-F1-27`).
  - Missing/incomplete metadata fails with single canonical status `METADATA_INCOMPLETE` (`AC-F1-16`, addressing F09); geometry 100% preserved; zero silent reconstruction.
  - Fast selection filtering via `Editor.SelectAll()` verified with `TEST-F1-04`.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-007: Metadata Schema Versioning, Migration, and Backward Compatibility
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Metadata structures will evolve across plugin releases. Future-compatible fields cannot be assumed to always be trailing entries in a sequential list.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §E):**
  - Keyed/tagged record schema contract where unrecognized fields anywhere in the record are preserved during read/write cycles.
  - Semantic versioning stored in header (`TTC_SCHEMA_VERSION = "1.0.0"`).
  - Minor versions read seamlessly with defaults.
  - Unsupported future major versions trigger read-only protection with structured warning.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §7.3, §7.4, §9, §9.2, §9.3, `AC-F1-17`, `TEST-F1-13`):**
  - Keyed/tagged `ResultBuffer` encoding formalized with key/value pairs using standard DXF text codes (Group Code 1 / `DxfCode.Text`, addressing F02).
  - Order independence and duplicate key rejection enforced.
  - Unknown fields preserved verbatim during read-modify-write cycles (`AC-F1-17`).
  - Normative Schema Compatibility Matrix formalized (§9.2, addressing R3-F03) for runtime 1.0.x: exact match (1.0.x) read/write normal; future patch (1.0.y) read/write normal; future minor (1.N.x, N > 0) read/write with unrecognized fields preserved verbatim and version string preserved verbatim without downward downgrade; future major (2.x.x) triggers read-only protection with structured status `UNSUPPORTED_SCHEMA` (mutation blocked, geometry preserved).
  - Replaced unsupported "defaults older minor versions" wording with explicit forward compatibility rules; malformed schema classified `INVALID_METADATA` without host crash.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-008: Native AutoCAD Event/Reactor Strategy vs Command-Boundary Audit
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** HIGH
- **Category:** CAD_API / HOST_STABILITY
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Native database reactors (`ObjectModified`, `ObjectErased`) can trigger recursive transaction exceptions (`eTransactionInProgress`), UI lockups, and crashes if write transactions are initiated inside callbacks. Native AutoCAD provides no transaction sequence counter or entity timestamp API.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §K):**
  - Architecture resolved: **Passive Command-Boundary Audits + Ephemeral In-Memory Spatial Caches**.
  - Host notification guidelines classified as `HOST_FACT_SOURCE_VERIFIED`.
  - TTC stability rule prohibiting write transactions inside reactors classified as `PROJECT_POLICY`.
  - Reactors mark in-memory state as `DIRTY`. Derived layout models and spatial indexes are reconstructed on demand at command boundaries or explicit QA audit.
  - Active document switch invalidates ephemeral caches.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §12, §12.2, §12.4, §13, `AC-F1-21`, `TEST-F1-09`, `TEST-F1-15`, `TEST-F1-26`):**
  - Project policy formalized: reactor callbacks are strictly observation and invalidation only (zero database write operations, zero transaction creation, zero mutation of notifying objects).
  - Clarified distinction between reactors and command-boundary reconciliation (addressing R3-F01): While database reactors remain strictly observation-only, persistent identity reconciliation after native commands is permitted at command boundaries (`CommandEnded`) using candidate Mechanism A (active `DocumentLock` + `Transaction`) or Mechanism B (deferred/scheduled execution). Both mechanisms are classified as `BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED` in `TEST-F1-15` and `TEST-F1-21`.
  - Startup document enumeration formalized (§12.2, addressing R2-F03, R3-F05): `IExtensionApplication.Initialize()` explicitly iterates `Application.DocumentManager`, attaches handlers to already-open documents, and hooks `DocumentCreated` (backed by verified Autodesk documentation `SRC-F1-10` in `API_VERIFICATION.md`, verified with `TEST-F1-26`). Non-retroactivity of .NET event subscription framed as `PROJECT_POLICY / ARCHITECTURAL_CONSEQUENCE`.
  - Multi-document cache isolation (§12.4): dirty flags, change sets, spatial indexes, and subscriptions are strictly scoped per `Document` / `Database` instance; application-global shared static mutation caches are prohibited.
  - Command boundary events reside on `Autodesk.AutoCAD.ApplicationServices.Document` (`CommandEnded`, `CommandCancelled`, `CommandFailed`), NOT `Editor` (addressing F04).
  - Absolute prohibitions: zero database write transactions inside reactors, zero mutation of notifying objects, zero interactive dialogs, zero `SendStringToExecute` (`AC-F1-21`).
  - Cache invalidation contract specified (§12.2): ephemeral caches marked dirty on modification, invalidated on document switch, reconstructed at command boundaries.
  - Safe reconciliation writes require an explicit `DocumentLock` and database `Transaction`.
  - `Database.BeginSave` mutation classified as non-dependency (`BUILD_VALIDATION_REQUIRED` / optional investigation).
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ASSET_MANAGEMENT
- **Owner:** Lead Draftsperson / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Comprehensive common CAD contract rules for AutoCAD blocks must be defined covering 12 concerns (mounting reference, drawing units, uniform scale, rotation, mirroring, static vs dynamic, nesting, attributes, clearance geometry, definition versioning, redefinition, missing assets) before P1/P2.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §J):**
  - Comprehensive 12-domain Common CAD Block Contract defined in §J.
  - Common F1: Uniform scale $ScaleX=ScaleY=ScaleZ=1.0$, static blocks for fixed catalog items, Layer 0 conventions, attributes decoupled from metadata, clearance maintained on dedicated layers.
  - Nested block nesting limit of 1 level classified as candidate recommendation (`PANEL_P1_P2_RECOMMENDATION`), not a frozen invariant.
  - Catalog schema definition deferred to P1.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §14, §15, `AC-F1-04`, `AC-F1-22`, `TEST-F1-28`):**
  - Formalized all 12 block domains in §14: mounting base point at $(0,0,0)$, declared asset units, unit-safe uniform scale derived from unit conversion ratio ($ExpectedInsertionScale = MillimetersPerAssetUnit / MillimetersPerDrawingUnit$, addressing R2-F04).
  - Clarified `MISSING_BLOCK_ASSET` (§14 domain 12, §15, addressing R2-F05): represents external library/catalog asset resolution failure, not an impossible BlockTable corruption state where a BlockReference exists without a BlockTableRecord.
  - Undeclared block units evaluate strictly to `UNRESOLVED` (never assumed millimeter).
  - Downstream scope de-normativized in F1 (addressing F08): generic clearance layers without freezing `TTC_CLEARANCE_*`; static vs dynamic block capability without freezing P1 catalog rules; `AllowMirroring` flag without freezing P6 polarity rules; 1-level nesting recommendation preserved as advisory guideline.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (`SPEC_CORRECTED_PENDING_INDEPENDENT_RE_REVIEW`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ROBUSTNESS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Handling user deletions, external cleaning scripts, duplicate IDs, or missing block definitions must be architected without arbitrary silent mutation or coupling F1 to future P6 panel commands.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §N):**
  - Generic `IEntityIdentityAuditService` defined in F1.
  - Two-state collision resolution (no silent arbitrary choice of original on unknown lineage).
  - Missing metadata marked `UNREGISTERED_TTC_ASSET` (geometry preserved; flagged for re-registration).
  - Missing block definitions classified as `MISSING_BLOCK_ASSET`.
  - Orphan clearance envelopes detected and offered for safe removal.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` v0.4.0 §8.4, §11.2, §15, `AC-F1-16`, `TEST-F1-27`):**
  - Standardized deterministic failure statuses (§15).
  - Authoritative fallback recovery (§8.4, addressing R2-F06): when external cleaning or scripts strip XData, bounded audit via `ITtcMetadataAuditService` recovers entity identity and resynchronizes secondary XData without data loss (`TEST-F1-27`).
  - Single canonical failure status `METADATA_INCOMPLETE` for missing or malformed metadata (`AC-F1-16`, addressing F09); non-normative `UNREGISTERED_TTC_ASSET` removed.
  - Two-state collision resolution formalized: `COLLISION_UNRESOLVED` requires explicit administrative action without silent survivor guessing (§11.2).
  - Orphan clearance envelopes detected and offered for safe removal.
  - Missing block library definitions classified as `MISSING_BLOCK_ASSET` (addressing R2-F05).
  - Missing XRecord with XData classified as `METADATA_INCOMPLETE` (`AC-F1-16`); geometry preserved; zero silent reconstruction.
- **Pending Authority:** Independent Technical Re-Review (`REV-F1-SPEC-001-R4`) and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.
