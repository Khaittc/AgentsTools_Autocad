# Tranche F1: Common CAD Contracts — Canonical Issue & Question Registry

> **Rule:** This file is the single canonical source of truth for all architectural questions, open investigations, and host quirks for Tranche F1.
> DESIGN.md, SPEC.md, EXECUTION_LOG.md, and AGENT_HANDOFF.md must link to or summarize this registry and must NOT maintain independent, drifting ID schemes.

---

## 1. Registry Summary

- **Total Registered Issues:** 10
- **Status:** ALL OPEN (INTAKE_STAGE)
- **Issues Blocking INTAKE Exit:** 0 (Registered to drive DESIGN and SPEC stages)
- **Issues Blocking BUILD Entry:** 10 (Must be resolved in DESIGN/SPEC before Work Order / BUILD)
- **Target Resolution Gates:**
  - `DESIGN_COMPLETION`: 6 (`ISSUE-F1-003`, `ISSUE-F1-004`, `ISSUE-F1-006`, `ISSUE-F1-007`, `ISSUE-F1-008`, `ISSUE-F1-009`)
  - `SPEC_FREEZE`: 4 (`ISSUE-F1-001`, `ISSUE-F1-002`, `ISSUE-F1-005`, `ISSUE-F1-010`)

---

## 2. Cross-Reference Mapping: Intake Open Questions to Canonical Issues

| Intake Question ID | Question Topic | Source Document | Canonical Issue ID | Blocks BUILD? | Required Closure Gate | Current Status |
|---|---|---|---|:---:|:---:|:---:|
| `OQ-F1-01` | Drawing-unit enforcement vs validation/warning | `INTAKE.md` §12 | **ISSUE-F1-001** | YES | `SPEC_FREEZE` | **OPEN** |
| `OQ-F1-02` | Handling non-millimeter and unitless (`INSUNITS=0`) DWGs | `INTAKE.md` §12 | **ISSUE-F1-002** | YES | `SPEC_FREEZE` | **OPEN** |
| `OQ-F1-03` | Geometric tolerance model: single $\varepsilon$ vs typed tolerances | `INTAKE.md` §12 | **ISSUE-F1-003** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-04` | `TTC_OBJECT_ID` generation format & uniqueness scope | `INTAKE.md` §12 | **ISSUE-F1-004** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-05` | Identity lifecycle under native clone/copy operations | `INTAKE.md` §12 | **ISSUE-F1-005** | YES | `SPEC_FREEZE` | **OPEN** |
| `OQ-F1-06` | Metadata storage split: XData vs Extension Dictionary/XRecord | `INTAKE.md` §12 | **ISSUE-F1-006** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-07` | Schema versioning, migration, and backward compatibility | `INTAKE.md` §12 | **ISSUE-F1-007** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-08` | Native AutoCAD event/reactor strategy vs command-boundary audit | `INTAKE.md` §12 | **ISSUE-F1-008** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-09` | Mechanical block asset contracts, scaling, and orientation rules | `INTAKE.md` §12 | **ISSUE-F1-009** | YES | `DESIGN_COMPLETION` | **OPEN** |
| `OQ-F1-10` | Corrupt, orphan, or missing metadata recovery strategy | `INTAKE.md` §12 | **ISSUE-F1-010** | YES | `SPEC_FREEZE` | **OPEN** |

---

## 3. Canonical Issues Register

### ISSUE-F1-001: Drawing-Unit Enforcement vs Validation/Warning Policy
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Product Owner / Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Candidate standard proposes `INSUNITS = 4` (Millimeters). However, AutoCAD drawings may be opened with `INSUNITS = 0` (Unitless), `1` (Inches), or other settings. Does TTC CAD strictly block insertion/commands if `INSUNITS != 4`, prompt the user to change `INSUNITS`, or perform runtime scaling?
- **Options Under Consideration:**
  1. *Strict Blocking:* Command refuses execution with an explicit error dialog if `INSUNITS != 4`.
  2. *Interactive Prompt:* Command detects `INSUNITS != 4` and prompts the user: "Change drawing units to Millimeters?".
  3. *Passive Scaling:* Command scales inserted block geometry by conversion factor without modifying drawing system variables.
- **Trade-offs:** Strict blocking prevents unit distortion but may disrupt users working with inherited enterprise templates. Passive scaling risks non-standard entity scale factors.

---

### ISSUE-F1-002: Unit Authority and Handling of Unitless (`INSUNITS=0`) DWGs
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** HIGH
- **Category:** DOMAIN / UNITS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** Many Vietnamese electrical panel drafting templates are historically configured with `INSUNITS = 0` (Unspecified/Unitless) while drawn 1 unit = 1 mm. If TTC CAD strictly checks `INSUNITS == 4`, these common legacy drawings will fail.
- **Investigation Needed:** Determine whether `MEASUREMENT = 1` (Metric) combined with `INSUNITS = 0` can be accepted with a warning, or if `INSUNITS` must be normalized to `4`.

---

### ISSUE-F1-003: Geometric Tolerance Model: Single Scalar vs Typed Tolerances
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / CORE_MATH
- **Owner:** Core Developer
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Roadmap proposes candidate tolerance $\varepsilon = 10^{-4}\text{ mm}$. A single scalar may not be appropriate for all geometric calculations (e.g., linear distance vs angular alignment in radians/degrees vs collinearity cross-product vs zero-length segment rejection).
- **Options Under Consideration:**
  1. *Single Scalar:* Global `Constants.Epsilon = 1e-4`.
  2. *Typed Tolerance Record:* Struct/class defining `LinearTolerance` ($10^{-4}\text{ mm}$), `AngularTolerance` ($10^{-6}\text{ rad}$), `ZeroLengthTolerance` ($10^{-5}\text{ mm}$), and `ScaleTolerance` ($10^{-5}$).
- **Target Seam:** Pure Core contracts in `TTC.CadTools.Core` with zero AutoCAD references.

---

### ISSUE-F1-004: TTC_OBJECT_ID Generation Format and Uniqueness Scope
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / IDENTITY
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Architecture baseline requires stable internal identity (`TTC_OBJECT_ID`). The format and scope of this identifier must be formalized.
- **Options Under Consideration:**
  1. *Raw RFC 4122 GUID:* `Guid.NewGuid().ToString("D")` (36 characters).
  2. *Prefixed Slug + GUID/Hex:* e.g. `TTC-COMP-4F8A3B21-...` or `TTC-RAIL-...` providing human-readable diagnostic recognition while preserving uniqueness.
  3. *Sequential / Database-Local ID:* Short numeric IDs (prone to collision when merging DWGs).
- **Recommendation for Design:** Prefixed Slug + UUID ensures global uniqueness and clean diagnostic log tracing.

---

### ISSUE-F1-005: Identity Lifecycle Under Native Clone / Copy Operations
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** CRITICAL
- **Category:** CAD_API / LIFECYCLE
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** When an entity is copied via native AutoCAD `COPY`, `ARRAY`, `MIRROR`, or Windows clipboard (`COPYCLIP`/`PASTECLIP`), AutoCAD performs a deep clone of the entity and its `ExtensionDictionary`. Both original and clone then possess the *identical* `TTC_OBJECT_ID`, violating the uniqueness contract.
- **Questions for Design & Spec:**
  1. How are duplicate IDs detected? (On-demand audit, database save reactor, or custom copy command wrapper?)
  2. When detected, does the system automatically re-assign a new GUID to the copy?
  3. How does the system distinguish the original from the duplicate?

---

### ISSUE-F1-006: Metadata Storage Split: XData vs Extension Dictionary / XRecord
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** HIGH
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Both `XData` and `ExtensionDictionary` / `XRecord` are supported by AutoCAD DWG database entities. An authoritative strategy must define what data belongs where.
- **Options Under Consideration:**
  1. *Pure XRecord:* All metadata stored in named `XRecord` in `ExtensionDictionary`. Clean, extensible, no 16KB XData size limit.
  2. *Hybrid:* Lightweight identifier in registered `XData` (`TTC_OBJECT_TYPE`, `TTC_OBJECT_ID` for fast selection filtering via `SelectionFilter`), while rich structured properties (catalog ID, width, height, clearances) reside in `XRecord`.
  3. *Pure XData:* Limited to small data, risk of exceeding 16KB buffer per object.

---

### ISSUE-F1-007: Metadata Schema Versioning, Migration, and Backward Compatibility
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** MEDIUM
- **Category:** ARCHITECTURE / PERSISTENCE
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** As feature capabilities evolve, metadata structure will expand. A drawing created with version `1.0.0` metadata must not crash version `1.2.0` of the plugin, nor should opening a newer drawing in an older plugin corrupt the extended fields.
- **Requirements for Design:** Formalize semantic versioning in `TTC_SCHEMA_VERSION`, unknown field preservation, and migration adapter contracts.

---

### ISSUE-F1-008: Native AutoCAD Event/Reactor Strategy vs Command-Boundary Audit
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** HIGH
- **Category:** CAD_API / HOST_STABILITY
- **Owner:** AutoCAD Specialist
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `DESIGN_COMPLETION`
- **Problem:** Users can move, rotate, scale, or delete TTC entities using vanilla AutoCAD commands outside of TTC plugins. To keep layout models coherent, should TTC register active database reactors (`ObjectModified`, `ObjectErased`), or rely on passive command-boundary audits and QA checks?
- **Risk:** Heavy live reactors in AutoCAD Managed .NET often cause recursive transaction errors, UI freezing, and host crashes during complex native commands like `EXPLODE` or `UNDO`.

---

### ISSUE-F1-009: Mechanical Block Asset Contracts, Scaling, and Orientation Rules
- **Status:** OPEN (INTAKE_STAGE)
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

---

### ISSUE-F1-010: Corrupt, Orphan, or Missing Metadata Recovery Strategy
- **Status:** OPEN (INTAKE_STAGE)
- **Severity:** MEDIUM
- **Category:** DOMAIN / ROBUSTNESS
- **Owner:** Architect
- **Blocks Entry To BUILD:** YES
- **Required Closure Gate:** `SPEC_FREEZE`
- **Problem:** An AutoCAD user might manually erase a clearance envelope while leaving the component footprint, or delete an `XRecord` via an external cleanup script. How does TTC CAD behave when inspecting such an entity?
- **Investigation Needed:** Define a "Repair / Re-register" workflow in the QA inspection tool rather than crashing or discarding the entity.
