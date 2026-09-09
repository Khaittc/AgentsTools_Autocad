# Tranche F1: Common CAD Contracts — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F1.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 10
- **Status:** ALL OPEN (DESIGN_STAGE)
- **Issues Blocking DESIGN Exit:** 0 (Architectural proposals formulated in `DESIGN-FOUNDATION-F1-001`)
- **Issues Blocking BUILD Entry:** 10 (Must be formalized in SPEC and approved before Work Order / BUILD)
- **Disposition Breakdown:**
  - `DESIGN_RESOLVED_PENDING_SPEC`: 6 (`ISSUE-F1-003`, `ISSUE-F1-004`, `ISSUE-F1-006`, `ISSUE-F1-007`, `ISSUE-F1-008`, `ISSUE-F1-009`)
  - `DESIGN_PROPOSED`: 3 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-010`)
  - `HOST_TEST_REQUIRED`: 1 (`ISSUE-F1-005`)
- **Target Resolution Gates:**
  - `DESIGN_COMPLETION`: 6 (Architectural design proposals established; pending SPEC formalization)
  - `SPEC_FREEZE`: 4 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-005`, `ISSUE-F1-010`)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status |
|---|---|---|---|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-02` | Handling non-millimeter and unitless (`INSUNITS=0`) DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **DESIGN_PROPOSED** |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **HOST_TEST_REQUIRED** |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `DESIGN_COMPLETION` | **DESIGN_RESOLVED_PENDING_SPEC** |
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
- **Problem:** Candidate standard proposes `INSUNITS = 4` (Millimeters). However, AutoCAD drawings may be opened with `INSUNITS = 0` (Unitless), `1` (Inches), or other settings. Does TTC CAD strictly block insertion/commands if `INSUNITS != 4`, prompt the user to change `INSUNITS`, or perform runtime scaling?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A):**
  - Implement a 2-tier unit adapter: pure Core `EngineeringUnit` and host `IDrawingUnitService`.
  - For Panel Designer: `INSUNITS = 4` trusted at 1:1; `INSUNITS = 0` checked against `MEASUREMENT = 1` and accepted with warning; non-metric (`INSUNITS = 1`) emits validation block dialog.
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
- **Problem:** Legacy or enterprise drawings may use `INSUNITS = 0` (Unspecified/Unitless) while users may interpret drawing units according to local drafting practice. If TTC CAD strictly checks `INSUNITS == 4`, these drawings will fail or trigger unwanted blocking.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §A.3):**
  - If `INSUNITS == 0` and `MEASUREMENT == 1` (Metric), the system infers millimeters, logs a non-intrusive warning, and avoids disrupting drafting.
  - If `MEASUREMENT == 0` (Imperial), user is alerted to confirm drawing units.
- **Pending Authority:** Formalization of acceptance criteria in `SPEC.md`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / CORE_MATH
- **Owner:** Core Developer
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Candidate single scalar tolerance $\varepsilon = 10^{-4}\text{ mm}$ is proposed as a candidate only. A single scalar may not be appropriate across all geometric calculations (e.g., linear distance vs angular alignment vs collinearity vs zero-length segment rejection).
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §B):**
  - Architecture resolved: Typed Tolerance Record (`GeometricTolerance` struct) in pure Core (`TTC.CadTools.Core.Geometry`) with separate fields for linear, angular, collinear, and zero-length thresholds.
  - Zero AutoCAD assembly references in Core math contracts.
- **Pending Authority:** Exact numerical values remain `CANDIDATE` and will be locked in `SPEC.md`.

---

### ISSUE-F1-004: TTC_OBJECT_ID Generation Format and Uniqueness Scope
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / IDENTITY
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Architecture baseline requires stable internal identity (`TTC_OBJECT_ID`). The format and scope of this identifier must be formalized during DESIGN.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §C):**
  - Architecture resolved: Prefixed Semantic Slug + UUIDv4 (`TTC-{ROLE}-{GUID}`) (e.g. `TTC-COMP-4f8a3b21-72f1-4b2a-b9c1-841f3e76a9b2`).
  - Uniqueness scope: Globally unique across all DWG files and sessions.
  - Distinguished from AutoCAD `Handle` (DWG-local) and `ObjectId` (session-transient).
- **Pending Authority:** Formalization in `SPEC.md`.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (`HOST_TEST_REQUIRED`)
- **Severity:** CRITICAL
- **Category:** CAD_API / LIFECYCLE
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** When an entity is copied via native AutoCAD commands (`COPY`, `ARRAY`, `MIRROR`) or Windows clipboard (`COPYCLIP`/`PASTECLIP`), the resulting clone is a distinct database object with its own new, distinct AutoCAD `Handle`. However, there is a risk that AutoCAD deeply clones the entity's `ExtensionDictionary` and its `XRecord`s unchanged, causing `TTC_OBJECT_ID` metadata to be duplicated and violating the TTC identity uniqueness contract. The exact cloning behavior of extension dictionaries and XRecords across various native commands and host operations is a **HOST BEHAVIOR TO VERIFY IN DESIGN** rather than an established baseline fact.
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §G):**
  - Tolerate duplicate identities transiently in memory during drafting; execute deterministic repair during pre-save hook (`Database.BeginSave`) or explicit QA audit (`TTCPANELCHECK`).
  - Primary entity retains original ID; clone entity receives new generated UUID.
- **Pending Authority:** Automated host test suite in BUILD (`TEST-F1-02`, `TEST-F1-03`); acceptance criteria formalization in `SPEC.md`.

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Both `XData` and `ExtensionDictionary` / `XRecord` are supported by AutoCAD DWG database entities. An authoritative strategy must define what data belongs where.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §D):**
  - Architecture resolved: **Hybrid Storage Strategy**.
  - Registered `XData` (RegApp `TTC_CAD`): Holds lightweight `TTC_OBJECT_TYPE` and `TTC_OBJECT_ID` strings for fast selection filtering.
  - `ExtensionDictionary` / `XRecord`: Holds `TTC_METADATA_HEADER` (schema version, catalog IDs) and rich structured component attributes.
  - 100% standard DWG compatibility; zero custom ObjectARX classes; zero proxy alerts.
- **Pending Authority:** Key names and DXF code structures locked in `SPEC.md`.

---

### ISSUE-F1-007: Metadata Schema Versioning, Migration, and Backward Compatibility
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** As feature capabilities evolve, metadata structure will expand. A drawing created with version `1.0.0` metadata must not crash version `1.2.0` of the plugin, nor should opening a newer drawing in an older plugin corrupt the extended fields.
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §E):**
  - Semantic versioning stored in header (`TTC_SCHEMA_VERSION = "1.0.0"`).
  - Minor version updates read seamlessly with defaults for missing fields.
  - Unsupported future major versions trigger read-only protection with structured warning.
  - Unknown trailing fields preserved during reserialization.
- **Pending Authority:** Migration adapter interfaces specified in `SPEC.md`.

---

### ISSUE-F1-008: Native AutoCAD Event/Reactor Strategy vs Command-Boundary Audit
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** HIGH
- **Category:** CAD_API / HOST_STABILITY
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Users can move, rotate, scale, or delete TTC entities using vanilla AutoCAD commands outside of TTC plugins. To keep layout models coherent, should TTC register active database reactors (`ObjectModified`, `ObjectErased`), or rely on passive command-boundary audits and QA checks?
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §K):**
  - Architecture resolved: **Passive Command-Boundary Audits + Ephemeral In-Memory Spatial Caches**.
  - Live database reactors are strictly prohibited from initiating database transactions or writes.
  - Layout models and spatial indexes are queried or rebuilt from persistent DWG data on demand.
- **Pending Authority:** Acceptance criteria formalization in `SPEC.md`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (`DESIGN_RESOLVED_PENDING_SPEC`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ASSET_MANAGEMENT
- **Owner:** Lead Draftsperson / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Before Tranche P1/P2 insert vendor DWG footprints, the structural rules for candidate blocks must be defined:
  1. Base insertion point (e.g. bottom-left corner vs center of DIN rail mounting clip).
  2. Uniform scale rule: must `ScaleX == ScaleY == ScaleZ == 1.0` be strictly enforced?
  3. Are dynamic blocks permitted, or must blocks be strictly static 2D geometry?
  4. Are nested blocks permitted?
  5. How are block attributes handled (visible vs invisible)?
- **DESIGN Resolution (`DESIGN-FOUNDATION-F1-001` §J):**
  - Base insertion point: Bottom-Left mounting corner (standard) or Center-Center (symmetrical rail components).
  - Uniform scale mandatory: $ScaleX = ScaleY = ScaleZ = 1.0$. Non-uniform scaling flagged as model error.
  - Static 2D blocks required for vendor catalog components; dynamic blocks prohibited for fixed hardware.
  - Linework on Layer `0` with `ByBlock`/`ByLayer` properties.
- **Pending Authority:** Validation rule tolerances formalized in `SPEC.md`.

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (`DESIGN_PROPOSED`)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ROBUSTNESS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** An AutoCAD user might manually erase a clearance envelope while leaving the component footprint, or delete an `XRecord` via an external cleanup script. How does TTC CAD behave when inspecting such an entity?
- **DESIGN Resolution Proposal (`DESIGN-FOUNDATION-F1-001` §N):**
  - Entities with missing dictionaries are marked `UNREGISTERED_TTC_ASSET` (geometry preserved; flagged in QA tool).
  - Orphan clearance envelopes detected and offered for automated cleanup.
  - Duplicate IDs resolved by retaining original on earliest Handle and re-assigning duplicate.
- **Pending Authority:** Recovery command interactions and dialog specifications in `SPEC.md`.
