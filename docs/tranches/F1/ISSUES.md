# Tranche F1: Common CAD Contracts — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F1.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 10
- **Status:** ALL OPEN (`SPEC_STAGE`)
- **Current Lifecycle Gate:** `SPEC_REVIEW`
- **Issues Blocking BUILD Entry:** 10 (Must be formalized in SPEC and approved before Work Order / BUILD)
- **Disposition Breakdown:**
  - `SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`: 10 (`ISSUE-F1-001` through `ISSUE-F1-010`)
- **Target Resolution Gates:**
  - `SPEC_FREEZE`: 10 (Formalized in `SPEC-FOUNDATION-F1-001`; awaiting independent Spec review & Product Owner freeze)
- **Verification Evidence Gate:**
  - `BUILD_VALIDATION`: 10 (Empirical runtime host evidence to be collected during BUILD stage)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status | Verification Evidence Gate |
|---|---|---|---|:---:|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-02` | Handling non-millimeter, unitless, and conflicted DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |
| `OQ-F1-10` | Corrupt, orphan, or missing metadata recovery strategy | `INTAKE.md` §12 | **ISSUE-F1-010** | YES | `SPEC_FREEZE` | **SPEC_PROPOSED_RESOLVED_PENDING_REVIEW** | `BUILD_VALIDATION` |

---

## 3. Canonical Issues Register

### ISSUE-F1-001: Drawing-Unit Enforcement vs Validation/Warning Policy
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §3.2, §3.4, `AC-F1-02`, `AC-F1-03`):**
  - Formalized 3 deterministic states: `RESOLVED`, `UNRESOLVED`, `UNIT_CONFIGURATION_CONFLICT`.
  - Core canonical engineering linear unit is `MILLIMETER`.
  - Host adapter performs conversion at boundary ($Factor = DrawingUnit / Millimeter$).
  - `UNRESOLVED` and `UNIT_CONFIGURATION_CONFLICT` deterministically block physical-unit commands; zero silent conversion or silent `INSUNITS` mutation.
  - Downstream modules (e.g. P2) may constrain allowed `RESOLVED` units to millimeters without hard-coding into F1 common engine.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-002: Unit Authority, Unitless DWGs, and Configuration Conflicts
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §3.2, §3.3, §15, `AC-F1-02`, `AC-F1-03`):**
  - Explicit rule: `MEASUREMENT` MUST NOT determine physical units; `LUNITS` MUST NOT determine physical units; `INSUNITSDEFSOURCE` / `TARGET` are insertion scaling defaults only and MUST NOT prove model units.
  - Drawing with `INSUNITS = 0` without project config evaluates to `UNRESOLVED` and never silently defaults to millimeters (`AC-F1-03`).
  - Contradiction between non-zero `INSUNITS` and project config triggers `UNIT_CONFIGURATION_CONFLICT` and blocks physical operations without silent rescaling.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §4, `AC-F1-05`):**
  - Typed `GeometricTolerance` immutable record specified in pure Core (`TTC.CadTools.Core.Geometry`).
  - Zero Autodesk references in Core assemblies (`AC-F1-01`).
  - Linear coincidence tolerance $\varepsilon = 10^{-4}\text{ mm}$ formalized and proposed for freeze.
  - All other tolerance categories (`AngularAlignment`, `ZeroLength`, `ScaleComparison`) explicitly marked `NO GLOBAL VALUE IN F1 v1`; must be supplied by caller or downstream spec.
  - Raw floating-point equality comparison prohibited across all geometry routines.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-004: TTC_OBJECT_ID Generation Format and Uniqueness Scope
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §5, `AC-F1-06`):**
  - Scope locked: Uniquely identifies exactly one TTC-managed AutoCAD drawing object instance. Decoupled from `TTC_LIBRARY_ID`, EPLAN Device Tags, BOMs, Handles, and ObjectIds.
  - Format formalized: RFC 4122 Version 4 UUID canonical lower-case string (`Guid.ToString("D")`, 36 characters).
  - Role prefix rejected: Pure UUID without object-type slug; semantic classification resides independently in `TTC_OBJECT_TYPE` to prevent identity mutation on reclassification.
  - Uniqueness invariant: No two independent TTC objects in a database may share the same valid `TTC_OBJECT_ID`.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
- **Severity:** CRITICAL
- **Category:** CAD_API / LIFECYCLE
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Native commands clone extension dictionaries and XRecords without semantic inspection. As cataloged in Autodesk DevGuide (*AutoCAD Commands That Use Deep Clone*), `COPY`, `ARRAY`, and selective `MIRROR` (when source is preserved) use `deepClone`, duplicating `TTC_OBJECT_ID`. When `MIRROR` erases source, `deepClone` is not used. How does TTC CAD resolve identity duplication without circular lifecycle dependencies or unverified runtime assumptions?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §G):**
  - **Spec Authority & Invariants:** Every independently cloned TTC drawing object must eventually possess a unique `TTC_OBJECT_ID`.
  - **Two-State Lineage Model:**
    - **State A (Provenance Known):** Source retains ID; clone receives new ID; operation logged.
    - **State B (Provenance Unknown):** Classified as `COLLISION_UNRESOLVED`. No silent guessing or arbitrary rewriting of entities. Controlled reconciliation workflow defined in SPEC.
  - **Pre-Save Safety:** SPEC behavior does NOT depend on unverified `Database.BeginSave` mutation.
  - **Generic Service:** `IEntityIdentityAuditService` defined in F1 for cross-tranche reuse.
  - **Lifecycle Gate Decoupling:** Exact host clone behavior is verified via automated host test suite during BUILD (`TEST-F1-02`, `TEST-F1-03`, `TEST-F1-09`, `TEST-F1-10`) as `BUILD_VALIDATION` acceptance evidence, eliminating circular dependency on `SPEC_FREEZE`.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §10, §11, `AC-F1-09`, `AC-F1-10`, `AC-F1-11`, `TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`):**
  - Comprehensive 18-command native edit lifecycle matrix formalized (§10).
  - Two-state lineage model formalized (§11): State A (`PROVENANCE_KNOWN`) updates clone UUID atomically; State B (`PROVENANCE_UNKNOWN`) classifies `COLLISION_UNRESOLVED` without silent survivor guessing or Handle-age heuristics.
  - Generic `IEntityIdentityAuditService` specified for collision reporting.
  - Empirical host tests (`TEST-F1-02`, `TEST-F1-03`, `TEST-F1-10`) established as BUILD acceptance evidence.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §7, §8, `AC-F1-13`, `AC-F1-14`, `AC-F1-15`, `TEST-F1-04`):**
  - Canonical storage matrix formalized: `XRecord` (`TTC_METADATA_HEADER`) is primary authoritative source of truth; registered `XData` (`TTC_CAD`) is secondary fast-query index (< 100 bytes).
  - Invariant: `XRecord` wins all conflicts; out-of-sync XData resynchronized at safe write boundaries (`AC-F1-15`).
  - Orphan XData with missing XRecord classified `METADATA_INCOMPLETE`; geometry 100% preserved; zero silent reconstruction (`AC-F1-16`).
  - Fast selection filtering via `Editor.SelectAll()` verified with `TEST-F1-04`.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-007: Metadata Schema Versioning, Migration, and Backward Compatibility
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §7.3, §7.4, §9, `AC-F1-17`, `TEST-F1-13`):**
  - Keyed/tagged `ResultBuffer` encoding formalized with key/value pairs using standard DXF text codes.
  - Order independence and duplicate key rejection enforced.
  - Unknown fields preserved verbatim during read-modify-write cycles (`AC-F1-17`).
  - Semantic versioning rules formalized: exact match (1.0.0), minor version default and upgrade on write, future major classified `UNSUPPORTED_SCHEMA` (mutation blocked, geometry preserved).
  - Malformed schema classified `INVALID_METADATA` without host crash.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-008: Native AutoCAD Event/Reactor Strategy vs Command-Boundary Audit
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
  - Reactors mark in-memory state as `DIRTY`. Derived layout models and spatial indexes are reconstructed on demand at command boundaries (`Editor.CommandEnded`) or explicit QA audit.
  - Active document switch invalidates ephemeral caches.
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §12, `AC-F1-21`, `TEST-F1-09`):**
  - Project policy formalized: reactor callbacks are strictly observation and invalidation only.
  - Absolute prohibitions: zero database write transactions, zero mutation of notifying objects, zero interactive dialogs, zero `SendStringToExecute` (`AC-F1-21`).
  - Cache invalidation contract specified (§12.2): ephemeral caches marked dirty on modification, invalidated on document switch, reconstructed at command boundaries.
  - `Database.BeginSave` mutation classified as non-dependency (`BUILD_VALIDATION_REQUIRED` / optional investigation).
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §14, `AC-F1-22`):**
  - Formalized all 12 block domains in §14: mounting base point at $(0,0,0)$, declared asset units, unit-safe uniform scale derived from unit conversion (not hard-coded 1.0 for non-matching units), rotation policy exposed to downstream (`AllowedRotations / RotationPolicy`), mirror policy, static blocks for catalog items, 1-level nesting recommendation, attribute display decoupling (no EPLAN/BOM creep), dedicated clearance layers (`TTC_CLEARANCE_*`), definition versioning (`TTC_DEFINITION_VERSION`), redefinition instance preservation, and missing asset classification (`MISSING_BLOCK_ASSET`).
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (`SPEC_PROPOSED_RESOLVED_PENDING_REVIEW`)
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
- **SPEC Formalization (`SPEC-FOUNDATION-F1-001` §11.2, §15, `AC-F1-16`):**
  - Standardized 10 deterministic failure statuses (§15).
  - Two-state collision resolution formalized: `COLLISION_UNRESOLVED` requires explicit administrative action without silent survivor guessing (§11.2).
  - Orphan clearance envelopes detected and offered for safe removal.
  - Missing block definitions classified as `MISSING_BLOCK_ASSET`.
  - Missing XRecord with XData classified as `METADATA_INCOMPLETE` (`AC-F1-16`); geometry preserved; zero silent reconstruction.
- **Pending Authority:** Independent Technical Review and Product Owner freeze of `SPEC-FOUNDATION-F1-001`.
