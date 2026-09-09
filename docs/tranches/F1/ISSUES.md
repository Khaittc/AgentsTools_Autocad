# Tranche F1: Common CAD Contracts — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F1.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 10
- **Status:** ALL OPEN (DESIGN_CORRECTION_STAGE)
- **Current Lifecycle Gate:** `DESIGN_RE_REVIEW`
- **Issues Blocking BUILD Entry:** 10 (Must be formalized in SPEC and approved before Work Order / BUILD)
- **Disposition Breakdown:**
  - `DESIGN_RESOLVED_PENDING_SPEC`: 4 (`ISSUE-F1-003`, `ISSUE-F1-006`, `ISSUE-F1-007`, `ISSUE-F1-008`)
  - `DESIGN_PROPOSED`: 6 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-004`, `ISSUE-F1-005`, `ISSUE-F1-009`, `ISSUE-F1-010`)
- **Target Resolution Gates:**
  - `DESIGN_COMPLETION`: 4 (Architectural design proposals resolved; awaiting SPEC formalization)
  - `SPEC_FREEZE`: 6 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-004`, `ISSUE-F1-005`, `ISSUE-F1-009`, `ISSUE-F1-010`)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status | Verification Evidence Gate |
|---|---|---|---|:---:|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |
| `OQ-F1-02` | Handling non-millimeter, unitless, and conflicted DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** | `BUILD_VALIDATION` |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** | `BUILD_VALIDATION` |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** | `BUILD_VALIDATION` |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** | `BUILD_VALIDATION` |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |
| `OQ-F1-10` | Corrupt, orphan, or missing metadata recovery strategy | `INTAKE.md` §12 | **ISSUE-F1-010** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** | `BUILD_VALIDATION` |

---

## 3. Canonical Issues Register

### ISSUE-F1-001: Drawing-Unit Enforcement vs Validation/Warning Policy
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
- **Pending Authority:** Product Owner approval in SPEC on whether non-metric drawings prompt for conversion or block execution outright.

---

### ISSUE-F1-002: Unit Authority, Unitless DWGs, and Configuration Conflicts
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
- **Pending Authority:** Formalization of acceptance criteria in `SPEC.md`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / CORE_MATH
- **Owner:** Core Developer
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** A single scalar tolerance $\varepsilon = 10^{-4}\text{ mm}$ cannot be meaningfully applied across all geometric calculations (linear distance vs angular alignment vs collinearity vs zero-length segment rejection).
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §B):**
  - Architecture resolved: Typed Tolerance Record (`GeometricTolerance` struct) in pure Core (`TTC.CadTools.Core.Geometry`).
  - Candidate linear tolerance $\varepsilon = 10^{-4}\text{ mm}$ retained as the sole authorized candidate.
  - All other numerical tolerance thresholds are marked `TO_BE_DETERMINED_IN_SPEC`.
  - Zero AutoCAD assembly references in Core math contracts.
- **Pending Authority:** Numerical values to be locked in `SPEC.md`.

---

### ISSUE-F1-004: TTC_OBJECT_ID Generation Format and Uniqueness Scope
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
  - Format remains proposed and pending formalization in SPEC; not frozen in DESIGN.
- **Pending Authority:** Formalization of identifier format in `SPEC.md`.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
- **Pending Authority:** Formalization of collision reconciliation workflow and acceptance criteria in `SPEC.md`.

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Clear demarcation required between XData (~16 KB total limit per entity across all applications) and ExtensionDictionary (up to 2 GB per XRecord).
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §D):**
  - Architecture resolved: **Canonical Storage Matrix**.
  - `ExtensionDictionary / XRecord` is the primary authoritative source of truth for all structured metadata (`TTC_OBJECT_ID`, `TTC_OBJECT_TYPE`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, `TTC_LIBRARY_VERSION`).
  - Registered `XData` (`TTC_CAD`) contains secondary / cached copy of `TTC_OBJECT_TYPE` and `TTC_OBJECT_ID` for fast selection filtering.
  - Mismatch rule: `XRecord` wins; `XData` is resynchronized.
  - 100% vanilla DWG compatible; zero custom ObjectARX classes.
- **Pending Authority:** DXF group codes and record structures formalized in `SPEC.md`.

---

### ISSUE-F1-007: Metadata Schema Versioning, Migration, and Backward Compatibility
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Metadata structures will evolve across plugin releases. Future-compatible fields cannot be assumed to always be trailing entries in a sequential list.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §E):**
  - Keyed/tagged record schema contract where unrecognized fields anywhere in the record are preserved during read/write cycles.
  - Semantic versioning stored in header (`TTC_SCHEMA_VERSION = "1.0.0"`).
  - Minor versions read seamlessly with defaults.
  - Unsupported future major versions trigger read-only protection with structured warning.
- **Pending Authority:** Migration interfaces specified in `SPEC.md`.

---

### ISSUE-F1-008: Native AutoCAD Event/Reactor Strategy vs Command-Boundary Audit
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** CAD_API / HOST_STABILITY
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Verification Evidence Gate:** `BUILD_VALIDATION`
- **Problem:** Native database reactors (`ObjectModified`, `ObjectErased`) can trigger recursive transaction exceptions (`eTransactionInProgress`), UI lockups, and crashes if write transactions are initiated inside callbacks. Native AutoCAD provides no transaction sequence counter or entity timestamp API.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §K):**
  - Architecture resolved: **Passive Command-Boundary Audits + Ephemeral In-Memory Spatial Caches**.
  - Host notification guidelines classified as `HOST_FACT_SOURCE_VERIFIED`.
  - TTC stability rule prohibiting write transactions inside reactors classified as `PROJECT_POLICY`.
  - Reactors mark in-memory state as `DIRTY`. Derived layout models and spatial indexes are reconstructed on demand at command boundaries (`Editor.CommandEnded`) or explicit QA audit.
  - Active document switch invalidates ephemeral caches.
- **Pending Authority:** Acceptance criteria formalization in `SPEC.md`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
- **Pending Authority:** Formalization of validation rules in `SPEC.md`.

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (`DESIGN_PROPOSED`)
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
- **Pending Authority:** Recovery workflows and UI dialogs specified in `SPEC.md`.
