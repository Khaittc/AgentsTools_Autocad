# TTC CAD — Intake: Tranche F1 (Common CAD Contracts)

Status: DRAFT / INDEPENDENT_REVIEW_PENDING<br>
Intake ID: INTAKE-FOUNDATION-F1-001<br>
Tranche ID: F1<br>
Capability: Common CAD Contracts<br>
Version: 0.1.0<br>
Author: Antigravity<br>
Owner / Dispatcher: TTC CAD Product Owner<br>
Reviewer: Independent Technical Reviewer / Product Owner<br>
Date: 2026-09-09<br>
Lifecycle Stage: INTAKE<br>
Dependency: F0 — AutoCAD Foundation (SATISFIED / FROZEN)<br>
Frozen F0 Baseline Commit: `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`<br>
Current Production Build Authorization: NONE

---

## 1. Authority & Dependency

### 1.1 Governance Authority
- `governance/ANTIGRAVITY_INSTRUCTIONS.md` (Version 1.0, `FROZEN_TEMPLATE`)
- `TTC-GOV-001`: Spec-First Per Tranche Methodology (`governance/DECISION_LOG.md`)
- `TTC-GOV-002`: Git-Based Agent Continuity & Handoff Protocol (`governance/DECISION_LOG.md`)
- `docs/tranches/TRANCHE_ROADMAP.md` (Approved Tranche Map & Lifecycle)
- `docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md` (Approved Baseline)

### 1.2 Upstream Dependency Baseline
Tranche F1 strictly depends upon Tranche F0 (AutoCAD Foundation).
- **Tranche F0 Status:** `COMPLETE / FROZEN` (authorized by Product Owner freeze decision following `REV-F0-002-R3`).
- **Frozen F0 Implementation Baseline:** `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`.
- **F0 Production Mutation Authority:** `CLOSED / REQUIRES REOPEN AUTHORITY`.

F1 inherits F0 contracts without re-opening, modifying, or re-implementing them.

---

## 2. Problem Statement

AutoCAD is an open, unconstrained drafting environment. Users may draw at arbitrary scales, use mixed units, manipulate geometry via standard commands (`MOVE`, `COPY`, `ARRAY`, `MIRROR`, `ERASE`, `UNDO`, `WBLOCK`), and copy linework between disparate DWGs.

In earlier development phases, engineering features (such as `TTCPANELPLACE`) were drafted assuming that drawing entities would automatically preserve identity, true physical millimeter scale, and structured metadata. However:
1. **No Shared Cross-Feature / Semantic Identity Contract:**
   - An AutoCAD `Handle` is persistent across save/reopen and uniquely identifies an AutoCAD database object within a single `Database`. However, `Handle` is not the TTC cross-DWG or semantic object identity contract.
   - An AutoCAD `ObjectId` is merely a database-load / in-memory locator and must not be used as persistent TTC identity.
   - When a TTC entity is cloned or copied via native AutoCAD commands (`COPY`, `ARRAY`, `MIRROR`, clipboard), the clone is a distinct AutoCAD database object with its own new, distinct AutoCAD `Handle`. The F1 architectural concern is whether TTC metadata, especially `TTC_OBJECT_ID` stored in dictionaries, is cloned unchanged and therefore causes TTC identity duplication.
   - Exact host clone behavior, duplicate detection, and repair policy remain an F1 DESIGN and SPEC investigation.
   - Therefore, a dedicated `TTC_OBJECT_ID` contract and lifecycle management strategy are necessary.
2. **No Standardized Metadata Strategy:** Without an authoritative convention for XData versus Extension Dictionary / `XRecord` storage, downstream features risk writing fragmented, conflicting, or unversioned metadata.
3. **No Drawing Unit or Tolerance Standard:** If one module assumes millimeters while a drawing is set to Inches (`INSUNITS=1`) or Unitless (`INSUNITS=0`), or if geometric algorithms use different floating-point tolerances ($\varepsilon$), physical dimensions and collision detection fail silently.
4. **No Native Edit Lifecycle Management:** Normal user drafting actions (`COPY`, `ERASE`, `UNDO`, `REDO`, `SAVE`, `REOPEN`) can duplicate entity IDs, orphan associated clearance geometry, or corrupt metadata caches unless host transaction and event boundaries are explicitly defined.

---

## 3. Why F1 is Required Before P1/P2 and Downstream Modules

Tranches P1 (Component Library), P2 (Component Placement), P3..P9 (Panel Designer), and M1..M8 (Cable Tray Designer) must create, modify, inspect, and export persistent AutoCAD entities.

Attempting to implement P1 or P2 without F1 would force each engineering feature to invent its own ad-hoc identity generator, metadata serializer, unit check, and clone handler. This would cause:
- **Architectural Fragmentation:** Incompatible metadata schemas between panels, rails, ducts, and trays.
- **Silent Data Corruption:** Duplicate IDs when an electrician copies a VFD or DIN rail in AutoCAD.
- **Host Instability:** Disorganized reactor / transaction handling leading to drawing lockups or fatal crashes.
- **Rework Cascades:** Any later change to identity or unit rules would invalidate all previously implemented engineering features.

F1 solves these foundational CAD problems once for all downstream capabilities.

```text
┌────────────────────────────────────────────────────────┐
│             F0: AutoCAD Foundation (FROZEN)            │
│ (Plugin Bootstrap, Ribbon/Palette Hosts, Settings, Log)│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           F1: Common CAD Contracts (INTAKE)            │
│  - Drawing Units & Geometric Tolerance Contracts       │
│  - Persistent Object Identity & Metadata Schema        │
│  - Native AutoCAD Lifecycle (Clone, Erase, Undo, Save) │
│  - Block Asset Standards & Host Integration Boundaries │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│   Module A: Panel Layout  │ │ Module B: M&E Cable Tray  │
│ (P1: Library, P2: Place,  │ │  (M1: Network, M2: Route, │
│  P3: Rail, P4: Duct...)   │ │   M3: Fittings...)        │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 4. Inherited Frozen F0 Contracts

F1 inherits the following technical contracts from F0 without re-specification:

1. **Host Platform Baseline:** AutoCAD 2023 (Release 24.2), .NET Framework 4.8, C# Managed .NET API (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`).
2. **Decoupling Doctrine:** `TTC.CadTools.Core` must remain pure C# with **zero** references to Autodesk/AutoCAD assemblies.
3. **Packaging & Deployment:** Standard Autodesk Application Package `.bundle` layout (`TTC.CadTools.bundle`) in `%APPDATA%\Autodesk\ApplicationPlugins` with `PackageContents.xml` autoloader.
4. **Structured Logging:** `ILogger` and `FileLogger` rolling daily diagnostic logging in `%APPDATA%\TTC_CadTools\Logs\` with safe `%TEMP%\TTC_CadTools\Logs\` fallback.
5. **Configuration Foundation:** `ISettingsRepository` with JSON schema validation, structured warnings, and safe defaults.
6. **UI Hosting Shell:** Modeless dockable WPF `PaletteSet` and Ribbon tab shell (`TTC CAD`).
7. **Application-Context Safety:** Commands and UI handlers must execute safely when zero drawings are open (`MdiActiveDocument == null`), without dereferencing null editors or creating unwanted dummy drawings.
8. **Product Scope Separation:** AutoCAD is strictly for physical/mechanical 2D CAD and M&E layout. All electrical schematics, device tags, part masters, and electrical BOMs belong exclusively to EPLAN 2022. F1 will not introduce ECAD or master data synchronization.

---

## 5. In-Scope Common CAD Contract Domains

INTAKE identifies 12 essential problem domains that F1 must formally address before downstream implementation:

### Domain A: Drawing Unit Contract
- Establishing the project's internal geometric measurement system.
- Defining how TTC tools behave under various AutoCAD drawing unit settings (`INSUNITS`, `MEASUREMENT`).
- Defining unit validation, user warnings, or normalization policies.

### Domain B: Geometric Tolerance Contract
- Defining precision standards for equality, collinearity, orthogonality, and point coincidence.
- Determining whether a single global scalar ($\varepsilon$) is sufficient or if typed tolerances are required (linear, angular, area, zero-length).
- Preventing floating-point drift and sliver geometry in downstream clearance and collision checks.

### Domain C: TTC Object Identity Contract
- Establishing the canonical identity model for all plugin-owned AutoCAD entities.
- Defining identity generation timing, format, uniqueness scope, and immutability.
- Maintaining identity across native AutoCAD commands.

### Domain D: Metadata Storage Contract
- Standardizing the physical storage mechanism in the DWG database (Extension Dictionary / `XRecord` vs `XData`).
- Defining access patterns, read/write efficiency, and isolation from vanilla CAD commands.

### Domain E: Metadata Schema & Versioning Contract
- Standardizing schema identification (`TTC_SCHEMA_VERSION`), migration rules, and backward compatibility.
- Handling legacy, missing, partial, or malformed metadata without crashing or discarding entities.

### Domain F: Native AutoCAD Edit Lifecycle Contract
- Defining entity and metadata state transitions under normal user drafting operations: `MOVE`, `ROTATE`, `SCALE`, `STRETCH`, `EXPLODE`.
- Defining policies for preserving or invalidating dependent auxiliary linework (e.g., non-plot clearance boundaries).

### Domain G: Clone / Copy / Insert Identity Lifecycle
- Defining identity behavior when a TTC entity is duplicated via `COPY`, `ARRAY`, `MIRROR`, `COPYCLIP`/`PASTECLIP`, or deep clone.
- Preventing duplicate `TTC_OBJECT_ID` collisions in the same drawing database.
- Defining automated or deferred identity re-generation policies for clones.

### Domain H: Save / Close / Reopen Persistence
- Ensuring all TTC entities, dictionaries, and records serialize cleanly to native DWG format.
- Ensuring drawings saved by TTC can be opened and edited in vanilla AutoCAD without proxy warnings or missing application alerts.

### Domain I: Undo / Redo Semantics
- Defining transactional atomicity so that complex multi-entity operations (e.g., component + clearance envelope) undo and redo as a single unified action without leaving orphan linework.

### Domain J: Erase / Restore Semantics
- Defining behavior when a primary entity is deleted via `ERASE` or restored via `OOPS` / `UNDO`.
- Managing coupled helper geometry (e.g., clearance envelopes).

### Domain K: Block Asset Contract
- Establishing standards for mechanical block definitions: insertion base points, unit scaling, uniform scale requirement, rotation conventions, dynamic block restrictions, and attribute policies.

### Domain L: Host Integration & Transaction Boundary Requirements
- Establishing transaction scoping rules (`TransactionManager.StartTransaction`), context-appropriate document locking protocols (`DocumentLock` where required by execution context), command-context vs application-context execution, and exception shielding.

---

## 6. Explicit Out of Scope

The following items are strictly **excluded** from Tranche F1:

1. **Component Catalog / Library Implementation:** Owning, parsing, or caching `catalog.json` footprints belongs to Tranche P1.
2. **Cabinet Library Implementation:** Cabinet catalog structures and sizing belong to Tranche P8.
3. **Engineering Command Implementations:** `TTCPANELPLACE` (P2), `TTCRAIL` (P3), `TTCDUCT` (P4), `TTCALIGN` (P5), `TTCPANELCHECK` (P6), `TTCPANELSIZE` (P8).
4. **Collision & QA Algorithms:** Polygon clipping, R-Tree spatial indexing, and thermal clearance checking belong to P6.
5. **M&E Cable Tray Implementations:** Routing, fittings, hangers, and takeoff belong to Module B (M1..M8).
6. **CAD Layer Standards Implementation:** Layer creation, color schemes, and linetypes belong to Tranche C1.
7. **DWG/DXF Export Implementation:** EPLAN export cleanup belongs to Tranche C2.
8. **EPLAN API / Master Data Integration:** Completely out of product scope.
9. **Custom ObjectARX Proxy Entities:** Forbidden by architectural baseline.
10. **Production C# Code Mutation:** No production code may be authored during INTAKE.

---

## 7. Stakeholders & Downstream Consumers

| Consumer Tranche | Downstream Feature | Contract Dependencies on F1 |
|:---|:---|:---|
| **P1** | Component Library | Relies on Block Asset Contract and metadata serialization model. |
| **P2** | `TTCPANELPLACE` | Relies on Drawing Units, Tolerance, `TTC_OBJECT_ID`, `XRecord` schema, and `BlockReference` lifecycle. |
| **P3** | DIN Rail (`TTCRAIL`) | Relies on Tolerance, Snap contracts, Curve/Polyline metadata, and Undo/Redo atomicity. |
| **P4** | Wiring Duct (`TTCDUCT`) | Relies on Geometric Tolerance, Bounding Box calculation, and Object Identity. |
| **P5** | Arrange Tools (`TTCALIGN`) | Relies on Entity coordinate extraction, geometric tolerance, and transform safety. |
| **P6** | Panel QA (`TTCPANELCHECK`) | Relies on Metadata query, Tolerance, and persistent Object IDs for reporting clashing pairs. |
| **P7..P8** | Depth & Cabinet Sizing | Relies on 2.5D depth metadata contracts and dimensional tolerance. |
| **M1..M8** | Cable Tray Designer | Relies on Core 3D/2.5D tolerance, Route Identity, and connection topology contracts. |
| **C1..C2** | Standards & Export | Relies on Metadata stripping rules and DWG standard compatibility. |

---

## 8. Required Behaviors

### 8.1 Drawing Unit Strategy & Inspection
- Per Architecture Roadmap (§42), all engineering calculations must have a defined drawing-unit strategy:
  - Panel mechanical drawings: initial assumption = millimeters.
  - M&E drawings: project drawing unit = configurable.
- The implementation must inspect/configure drawing units and MUST NOT assume every drawing is millimeters without checking configuration and drawing units.
- Core geometry should use normalized internal engineering units where practical, but the exact normalization and conversion strategy belongs to F1 DESIGN and SPEC.
- Candidate standard `INSUNITS = 4` remains a proposed candidate only and is not an approved project-wide standard at INTAKE.

### 8.2 Standard DWG Usability (No Proxy Warnings)
- All drawings produced using TTC CAD must remain standard DWG files.
- An engineer without TTC CAD installed must be able to open, view, print, edit, and save the DWG in vanilla AutoCAD with **zero** proxy entity dialogs, warnings, or missing ObjectARX application errors.
- Internal metadata must reside in standard AutoCAD data structures (`ExtensionDictionary`, `XRecord`, `XData`).

### 8.3 Stable Internal Identity
- Every TTC-managed entity must possess an immutable, persistent `TTC_OBJECT_ID`.
- Object identity must not depend solely on the block definition name, layer name, or session-transient `ObjectId`.
- Entity identity must survive document save, close, and reopen.

### 8.4 Deterministic Geometric Precision
- All geometric comparisons (coincidence, containment, intersection) must evaluate against explicitly specified tolerances.
- Tolerances must prevent false positives/negatives caused by IEEE 754 floating-point inaccuracies.

### 8.5 Transactional Safety & Context-Appropriate Locking
- **Transactions:** All operations modifying drawing database entities must execute inside managed AutoCAD transactions (`TransactionManager.StartTransaction`) according to the host database modification contract.
- **Document Locking:** Explicit `DocumentLock` is required when the execution context demands it—specifically in modeless UI interactions (e.g. `PaletteSet` handlers), application-context operations (`Session` commands where applicable), cross-document modifications, and background tasks. Normal modal command contexts operating on the active document must not be specified as requiring an unnecessary explicit lock.
- If an operation fails or the user cancels via `Esc`, the transaction must abort/rollback cleanly, leaving zero dangling, orphan, or corrupted entities.
- Exact transaction lifecycle and document lock scoping will be formalized during F1 DESIGN.

---

## 9. Native AutoCAD Lifecycle Cases

F1 must determine the expected behavior when a user performs standard AutoCAD editing commands on TTC-managed entities.

| Lifecycle Operation | Trigger / User Action | Problem / Risk | Required F1 Analysis Category |
|:---|:---|:---|:---:|
| **MOVE** | Native `MOVE` command or grip edit | Geometry moves. Does associated clearance move? Are cached coordinates invalidated? | `REQUIRED_FOR_F1` |
| **ROTATE** | Native `ROTATE` command or grip edit | Component orientation changes. Does clearance rotate? Are mounting rules affected? | `REQUIRED_FOR_F1` |
| **SCALE** | Native `SCALE` command | Mechanical equipment cannot be physically scaled. Should non-uniform/arbitrary scale be prevented or flagged? | `REQUIRED_FOR_F1` |
| **COPY** | Native `COPY` command | Clones entity into a distinct database object with a new Handle. If extension dictionary metadata is cloned unchanged (host behavior to verify in DESIGN), duplicate `TTC_OBJECT_ID` results. | `REQUIRED_FOR_F1` |
| **ARRAY** | Native `ARRAY` (Rectangular/Polar/Path) | Creates multiple cloned entities with distinct Handles. How and when are new unique TTC IDs assigned if metadata is cloned? | `REQUIRED_FOR_F1` |
| **MIRROR** | Native `MIRROR` command | Electrical components (e.g. VFDs) cannot be mirrored physically. How is mirror handled? | `REQUIRED_FOR_F1` |
| **ERASE** | Native `ERASE` or `Delete` key | Primary entity deleted. What happens to associated clearance envelope or downstream references? | `REQUIRED_FOR_F1` |
| **OOPS / UNDO** | Native `OOPS` or `U` / `UNDO` | Entity restored after erase. Must restore valid identity and linkages. | `REQUIRED_FOR_F1` |
| **REDO** | Native `REDO` command | Restores state prior to undo cleanly. | `REQUIRED_FOR_F1` |
| **EXPLODE** | Native `EXPLODE` command | Destroys `BlockReference`, leaving loose lines. Does metadata perish or warn user? | `NEEDS_DESIGN_INVESTIGATION` |
| **WBLOCK** | Exporting selection to new DWG | Does metadata carry over cleanly? | `NEEDS_DESIGN_INVESTIGATION` |
| **INSERT** | Inserting external DWG as block | May bring external TTC entities into current drawing. ID collisions possible. | `NEEDS_DESIGN_INVESTIGATION` |
| **COPYCLIP / PASTECLIP** | Windows clipboard copy-paste between drawings | Entities pasted into new drawing retain old IDs, creating cross-drawing or intra-drawing collisions. | `NEEDS_DESIGN_INVESTIGATION` |
| **SAVE / REOPEN** | Standard DWG save, close, reopen | Extension dictionaries and XRecords must reload without data loss or corruption. | `REQUIRED_FOR_F1` |
| **BLOCK REDEFINE** | Redefining existing block definition | Replaces internal linework. Must not destroy existing instance metadata. | `NEEDS_DESIGN_INVESTIGATION` |
| **PURGE** | Native `PURGE` command | Unused block definitions or registered apps may be purged. Must not corrupt active contracts. | `DEFERRED` |
| **XREF / BIND** | Referencing external DWGs | External references containing TTC objects. Must be ignored or handled read-only. | `DEFERRED` |

---

## 10. Failure & Corruption Scenarios

INTAKE identifies failure modes that F1 contracts must guard against:

1. **Duplicate Object ID Collision:** Two distinct entities in the same drawing share identical `TTC_OBJECT_ID` (caused by native `COPY` or `PASTECLIP`).
2. **Orphan Metadata / Ghost Entities:** Primary block reference is erased, but clearance polyline or extension dictionary record remains in database.
3. **Mismatched Drawing Units:** DWG is drafted in Inches (`INSUNITS=1`) or Centimeters (`INSUNITS=5`), causing footprint blocks inserted at 1:1 to appear 25.4x smaller or 10x larger than intended.
4. **Missing or Corrupt XRecord:** User or third-party tool clears the Extension Dictionary or mutates `ResultBuffer` data types.
5. **Schema Version Mismatch:** Drawing created with a future version of TTC CAD is opened in an older plugin version (or vice versa).
6. **Non-Uniform Scaling Distortion:** User stretches or non-uniformly scales a mechanical block (`ScaleX != ScaleY`), violating true physical footprint constraints.
7. **Document Context Collision:** An edit command attempts to access a document without obtaining a `DocumentLock`, or runs during an invalid reactor callback.

---

## 11. Standards Classification: Candidate vs Approved

To ensure strict compliance with Section 15 ("No Silent Standard Invention"), all technical parameters under consideration are explicitly classified below:

| Parameter / Item | Proposed / Candidate Value | Current Formal Status | Authority Source | Disposition / Next Step |
|:---|:---|:---:|:---|:---|
| **Drawing Units (`INSUNITS`)** | `4` (Millimeters) | `CANDIDATE` | `TRANCHE_ROADMAP.md` §4 | Needs evaluation in F1 DESIGN & SPEC. |
| **Geometric Tolerance ($\varepsilon$)** | $1.0 \times 10^{-4}\text{ mm}$ ($1\text{e-}4$) | `CANDIDATE` | `TRANCHE_ROADMAP.md` §4 | Needs evaluation: scalar vs typed in DESIGN. |
| **Core Metadata Keys** | `TTC_OBJECT_TYPE`, `TTC_OBJECT_ID`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, `TTC_LIBRARY_VERSION` | `INHERITED_ARCHITECTURAL_BASELINE` | `Architecture Roadmap` §8 | Canonical vocabulary preserved. |
| **Storage Mechanism** | Extension Dictionary / `XRecord` vs `XData` | `OPEN_QUESTION` | `Architecture Roadmap` §8 | Strategy to be decided in DESIGN. |
| **Target Host Baseline** | AutoCAD 2023, .NET Framework 4.8, C# | `INHERITED_FROZEN` | Tranche F0 Freeze (`SPEC-FOUNDATION-F0-001`) | Frozen invariant. |
| **Decoupling Doctrine** | `TTC.CadTools.Core` has 0 CAD references | `INHERITED_FROZEN` | Tranche F0 Freeze (`SPEC-FOUNDATION-F0-001`) | Frozen invariant. |
| **Standard DWG Usability** | No proxy objects, vanilla AutoCAD compatible | `INHERITED_ARCHITECTURAL_BASELINE` | `Architecture Roadmap` §2 | Mandatory constraint. |
| **EPLAN Scope Boundary** | Zero ECAD schematic / wire / master data | `INHERITED_ARCHITECTURAL_BASELINE` | `Architecture Roadmap` §2.3 | Mandatory constraint. |
| **Identity Generation Format** | GUID vs Prefixed String (e.g. `TTC-COMP-...`) | `OPEN_QUESTION` | `03_FEATURE_SPEC_TTCPANELPLACE.md` (Evidence only) | To be resolved in F1 DESIGN. |
| **Clone Identity Repair Policy** | Automatic on save/check vs synchronous via reactor | `OPEN_QUESTION` | Intake Analysis | To be evaluated in F1 DESIGN. |

---

## 12. Open Questions (OQ)

The following ten questions are registered for resolution during the `DESIGN` and `SPEC` stages:

- **OQ-F1-01 (Units Enforcement):** Should TTC CAD strictly enforce `INSUNITS = 4` (refusing execution if not met), automatically prompt to convert the drawing, or simply emit a warning and scale dynamically?
- **OQ-F1-02 (Unitless DWGs):** How should drawings with `INSUNITS = 0` (Unitless) or legacy unit configurations be handled when inserting metric assets?
- **OQ-F1-03 (Tolerance Model):** Is a single global scalar ($\varepsilon = 10^{-4}\text{ mm}$) sufficient across all operations, or does TTC require distinct typed tolerances (linear coincidence, angular alignment, zero-length threshold, area overlap)?
- **OQ-F1-04 (Identity Format & Uniqueness):** What format should `TTC_OBJECT_ID` use (RFC 4122 GUID, prefixed human-readable ID like `TTC-OBJ-UUID`, or numeric)? What is the uniqueness scope (single DWG database vs globally unique)?
- **OQ-F1-05 (Clone / Copy Identity Lifecycle):** When a user executes native `COPY`, `ARRAY`, or clipboard paste, how and when are duplicate `TTC_OBJECT_ID`s detected and re-assigned? Should repair be automatic, prompt-driven, or deferred to QA audit?
- **OQ-F1-06 (Metadata Storage Distribution):** What is the exact division between lightweight registered `XData` (e.g., fast filtering of `TTC_OBJECT_TYPE`) and `ExtensionDictionary` / `XRecord` (rich structured component attributes)?
- **OQ-F1-07 (Schema Versioning & Migration):** How should the system handle backward compatibility when older drawings with version `1.0.0` metadata are opened by newer plugin releases? Are schema migrations performed in-memory, on-demand, or upon save?
- **OQ-F1-08 (Native AutoCAD Reactor Strategy):** Does F1 require AutoCAD database reactors (`Database.ObjectModified`, `ObjectErased`, etc.) to monitor out-of-command edits, or can validation be deferred to command boundaries and QA checks to avoid reactor re-entrancy bugs?
- **OQ-F1-09 (Block Asset Contract & Constraints):** What constraints must be placed on mechanical block definitions (uniform scale = 1.0, insertion base point at bottom-left/center, prohibition of dynamic block stretching, handling of nested blocks)?
- **OQ-F1-10 (Corrupt / Missing Metadata Recovery):** When an entity has lost its `XRecord` or contains invalid data types, how does TTC CAD classify and recover the entity without discarding geometry?

---

## 13. Risk Register

> [!NOTE]
> **Triage Notice:** Risk ratings and priorities below represent qualitative intake triage only and do not constitute an authoritative project risk-scoring methodology. Mitigation strategies indicate preliminary investigation directions to be analyzed during F1 DESIGN rather than finalized design decisions.

| Risk ID | Risk Description | Qualitative Priority | Investigation Direction in F1 Design |
|:---|:---|:---:|:---|
| **RSK-F1-01** | **TTC Identity Duplication via Native Clone:** Native `COPY` / cloning assigns distinct AutoCAD Handles, but if `ExtensionDictionary` metadata is cloned unchanged (host behavior to verify in DESIGN), duplicate `TTC_OBJECT_ID`s will result. | High | Investigate and verify native clone/XRecord behavior in Managed .NET; investigate duplicate detection and ID regeneration mechanisms during save, audit, or clone events. |
| **RSK-F1-02** | **Metadata Stripping via WBLOCK:** `WBLOCK` or external export may drop application-specific dictionaries if not properly configured. | High | Investigate `WBLOCK` / `INSERT` object cloning behavior in Managed .NET and evaluate persistence rules. |
| **RSK-F1-03** | **Drawing Unit Distortion:** Components inserted into non-metric drawings appear with wrong physical dimensions if units are assumed. | High | Investigate drawing unit inspection, configuration gates, and normalization strategies before placing geometry. |
| **RSK-F1-04** | **Reactor Re-entrancy & Crash:** Database reactors reacting to entity modification invoke transactions recursively, risking AutoCAD fatal crashes. | High | Investigate deferred validation and command-boundary audits as alternatives to complex live reactors. |
| **RSK-F1-05** | **Tolerance Floating-Point Creep:** Different modules using slight variations of floating-point comparison cause false positive clash detection. | Medium | Investigate encapsulating geometric comparison functions in pure Core math contracts (`TTC.CadTools.Core`). |
| **RSK-F1-06** | **Undo / Redo Fragmentation:** Undoing an insert operation removes the block reference but leaves clearance geometry or dictionary entries behind. | High | Investigate single atomic transaction grouping (`TransactionManager`) for compound entity creation. |
| **RSK-F1-07** | **Proxy Entity Warnings:** Inadvertent use of non-standard object types triggers AutoCAD proxy alerts in vanilla installations. | High | Investigate reliance exclusively on standard native entities with XRecords, avoiding custom ObjectARX classes. |
| **RSK-F1-08** | **Downstream Coupling to Unstable Contracts:** P1/P2 proceed with provisional metadata schemas that break when F1 is finalized. | High | Maintain Hard Build Gate: P1 and P2 remain BLOCKED until F1 reaches FROZEN status. |

---

## 14. Acceptance Intent for Later SPEC

When Tranche F1 reaches the `SPEC` stage, the following verifiable acceptance themes must be formalized into measurable criteria:

1. **Unit Contract Verification:** Automated tests proving that TTC commands correctly identify `INSUNITS` and execute the approved policy (e.g. PASS for mm, explicit warning/block for non-mm).
2. **Tolerance Contract Verification:** Unit tests for Core geometric comparison functions verifying exact, boundary, and near-boundary cases against specified tolerances.
3. **Object Identity Lifecycle:** Automated and host tests verifying that `TTC_OBJECT_ID` is correctly generated, persists across save/reopen, and that duplicate IDs resulting from `COPY` are reliably detected and resolved.
4. **Metadata Storage & Round-Trip:** Verification that structured metadata writes to `ExtensionDictionary` / `XRecord`, reloads without loss, and maintains schema versioning.
5. **Vanilla DWG Compatibility:** Verification that a drawing containing TTC entities opens in standard AutoCAD 2023 with zero proxy warnings, and entities can be manipulated with native commands.
6. **Compound Undo / Redo Atomicity:** Verification that compound entity operations roll back completely on `UNDO` or `Esc` without orphan linework.
7. **Decoupling Integrity:** 100% verification that Core library contracts (`TTC.CadTools.Core`) have zero dependency on Autodesk assemblies.

---

## 15. Exit Criteria from INTAKE

Tranche F1 may exit `INTAKE` and transition to `DESIGN` only when all of the following are satisfied:

1. [x] Upstream dependency Tranche F0 is `FROZEN` and verified.
2. [x] Problem statement, capability boundaries, and downstream consumer dependencies are documented.
3. [x] Inherited frozen F0 contracts and architecture roadmap boundaries are explicitly cited.
4. [x] Explicit non-goals and out-of-scope boundaries are documented.
5. [x] All candidate values are explicitly classified and distinguished from approved/frozen standards.
6. [x] Native AutoCAD edit lifecycle cases and corruption scenarios are systematically enumerated.
7. [x] Open questions are formally captured and cross-referenced to `docs/tranches/F1/ISSUES.md`.
8. [x] Risks are registered with appropriate mitigation strategies.
9. [x] Zero production C# code has been written for F1.
10. [x] Independent Technical Reviewer reviewed Intake and authorized DESIGN.

---

## 16. Next Lifecycle Gate

- **Current Status:** `INTAKE_COMPLETE / PASS_TO_DESIGN`
- **Intake Review Baseline:** `REV-F1-INTAKE-001-R3` (`PASS / PASS_TO_DESIGN`)
- **Historical Reviews:** `REV-F1-INTAKE-001` (`NEEDS_FIX`), `REV-F1-INTAKE-001-R2` (`NEEDS_FIX`)
- **Current Lifecycle Stage:** `DESIGN` (Authoring `docs/tranches/F1/DESIGN.md`)
- **Spec Status:** `NOT_STARTED / NOT AUTHORIZED`
- **Production Build Authorization:** `NONE` (Remains strictly unauthorized).
