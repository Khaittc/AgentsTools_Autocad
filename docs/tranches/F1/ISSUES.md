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
  - `DESIGN_PROPOSED`: 5 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-004`, `ISSUE-F1-009`, `ISSUE-F1-010`)
  - `HOST_TEST_REQUIRED`: 1 (`ISSUE-F1-005`)
- **Target Resolution Gates:**
  - `DESIGN_COMPLETION`: 4 (Architectural design proposals resolved; awaiting SPEC formalization)
  - `SPEC_FREEZE`: 6 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-004`, `ISSUE-F1-005`, `ISSUE-F1-009`, `ISSUE-F1-010`)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status |
|---|---|---|---|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-02` | Handling non-millimeter and unitless (`INSUNITS=0`) DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **HOST_TEST_REQUIRED** |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-10` | Corrupt, orphan, or missing metadata recovery strategy | `INTAKE.md` §12 | **ISSUE-F1-010** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |

---

## 3. Canonical Issues Register

### ISSUE-F1-001: Drawing-Unit Enforcement vs Validation/Warning Policy
- **Status:** OPEN (`DESIGN_PROPOSED`)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Product Owner / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Candidate standard proposes `INSUNITS = 4` (Millimeters). However, AutoCAD drawings may have `INSUNITS = 0` (Unitless), `1` (Inches), or other values. Does TTC CAD strictly block commands if `INSUNITS != 4`, prompt the user to configure units, or perform runtime scaling?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A):**
  - Implement a 2-tier unit adapter: pure Core `EngineeringUnit` and host `IDrawingUnitService` (`TTC.CadTools.AutoCAD.Units`).
  - Unitless drawings (`INSUNITS = 0`) have `PhysicalUnitResolution = UNRESOLVED`. No silent millimeter assumption is made based on `MEASUREMENT`.
  - For Panel Designer: `INSUNITS = 4` trusted at 1:1; `INSUNITS = 0` requires project configuration or explicit user confirmation; non-metric (`INSUNITS = 1`) emits validation block dialog.
  - For M&E: drawing units remain configurable per project settings.
- **Pending Authority:** Product Owner approval in SPEC on whether non-metric drawings prompt for conversion or block execution outright.

---

### ISSUE-F1-002: Unit Authority and Handling of Unitless (`INSUNITS=0`) DWGs
- **Status:** OPEN (`DESIGN_PROPOSED`)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Legacy or enterprise drawings may use `INSUNITS = 0` (Unspecified/Unitless). `MEASUREMENT` controls hatch/linetype libraries, not model geometry units, and `LUNITS` is coordinate display format only. `INSUNITSDEFSOURCE`/`TARGET` provide insertion scaling defaults but do not define physical scale of model geometry. How does TTC CAD resolve unitless drawings without dangerous silent assumptions or workflow breakage?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A.3):**
  - Strict resolution precedence: (1) Explicit project/workspace configuration; (2) Explicit non-zero `INSUNITS`; (3) Unitless drawings requiring approved configuration or user confirmation.
  - No silent millimeter assumption. Status remains `PhysicalUnitResolution = UNRESOLVED` until resolved.
- **Pending Authority:** Formalization of acceptance criteria in `SPEC.md`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / CORE_MATH
- **Owner:** Core Developer
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
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
- **Problem:** Architecture requires stable internal drawing instance identity (`TTC_OBJECT_ID`). Scope must strictly identify one TTC-managed AutoCAD drawing entity instance, without conflating catalog, BOM, or EPLAN identity. Format must be evaluated for classification divergence if entity role/type changes.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §C):**
  - Scope clarified: Identifies one TTC-managed AutoCAD drawing object instance. Catalog reference uses `TTC_LIBRARY_ID`; EPLAN separation is maintained.
  - Format evaluation: Pure UUIDv4 (fully decoupled from role) vs Prefixed Slug + UUID (human-readable, but carries risk of semantic divergence if entity role changes).
  - Format remains proposed and pending formalization in SPEC; not frozen in DESIGN.
- **Pending Authority:** Formalization of identifier format in `SPEC.md`.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (`HOST_TEST_REQUIRED`)
- **Severity:** CRITICAL
- **Category:** CAD_API / LIFECYCLE
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** When an entity is copied via native AutoCAD commands (`COPY`, `ARRAY`, `MIRROR`) or Windows clipboard (`COPYCLIP`/`PASTECLIP`), AutoCAD assigns a new, distinct `Handle`. However, AutoCAD deeply clones the `ExtensionDictionary` and its `XRecord`s unchanged, causing `TTC_OBJECT_ID` to be duplicated. How does TTC CAD resolve this without arbitrary heuristics or corrupting database state?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §G):**
  - Two-state lineage model:
    - **State A (Provenance Known):** Source retains ID; clone receives new ID; logged to audit.
    - **State B (Provenance Unknown):** Classified as `COLLISION_UNRESOLVED`. No silent guessing or arbitrary rewriting of entities. Controlled reconciliation workflow defined in SPEC.
  - Pre-save mutation via `Database.BeginSave` is classified `HOST_TEST_REQUIRED` (not a proven safe mutation point).
  - Generic `IEntityIdentityAuditService` defined in F1 for cross-tranche reuse.
- **Pending Authority:** Automated host test suite in BUILD (`TEST-F1-02`, `TEST-F1-03`, `TEST-F1-09`); acceptance criteria in `SPEC.md`.

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Contradictions existed regarding whether XData or XRecord is authoritative, and what data belongs in which store given XData's ~16 KB per-entity limit across all applications.
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
- **Problem:** Native database reactors (`ObjectModified`, `ObjectErased`) can trigger recursive transaction exceptions (`eTransactionInProgress`), UI lockups, and crashes if write transactions are initiated inside callbacks.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §K):**
  - Architecture resolved: **Passive Command-Boundary Audits + Ephemeral In-Memory Spatial Caches**.
  - Host notification guidelines classified as `HOST_FACT_SOURCE_VERIFIED`.
  - TTC stability rule prohibiting write transactions inside reactors classified as `PROJECT_POLICY`.
  - Deep audits and reconciliation execute strictly at command boundaries or during explicit QA audit commands.
- **Pending Authority:** Acceptance criteria formalization in `SPEC.md`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (`DESIGN_PROPOSED`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ASSET_MANAGEMENT
- **Owner:** Lead Draftsperson / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Common CAD contract rules for standard AutoCAD blocks must be established while keeping vendor catalog schemas decoupled for Tranche P1.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §J):**
  - Clearly separated Common F1 Block Contract from Panel P1/P2 asset recommendations.
  - Common F1: Uniform scale $ScaleX=ScaleY=ScaleZ=1.0$, static blocks for fixed catalog items, Layer 0 conventions, 1-level nesting limit.
  - Specific basepoint conventions (Bottom-Left vs Center-Center) and catalog schemas are classified as proposed recommendations pending SPEC formalization.
- **Pending Authority:** Formalization of validation rules in `SPEC.md`.

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (`DESIGN_PROPOSED`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ROBUSTNESS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Handling user deletions, external cleaning scripts, or duplicate IDs must be architected without arbitrary silent mutation or coupling F1 to future P6 panel commands.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §N):**
  - Generic `IEntityIdentityAuditService` defined in F1.
  - Two-state collision resolution (no silent arbitrary choice of original on unknown lineage).
  - Missing metadata marked `UNREGISTERED_TTC_ASSET` (geometry preserved; flagged for re-registration).
  - Orphan clearance envelopes detected and offered for safe removal.
- **Pending Authority:** Recovery workflows and UI dialogs specified in `SPEC.md`.
