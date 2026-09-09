# Tranche F1: Common CAD Contracts — Architectural Design

- **Document ID:** `DESIGN-FOUNDATION-F1-001`
- **Version:** `0.2.0` (Corrected Architectural Proposal)
- **Lifecycle Stage:** `DESIGN_CORRECTION`
- **Status:** `PROPOSED_DESIGN / INDEPENDENT_RE_REVIEW_PENDING`
- **Dependency:** Tranche F0 — AutoCAD Foundation (`FROZEN v1.0.0`, Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Inherited Architecture:** Architecture Roadmap (`docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md`)
- **Target Host Baseline:** AutoCAD 2023 Managed .NET API (C#, .NET Framework 4.8)
- **Production Build Authorization:** `NONE`

> [!IMPORTANT]
> **Design Discipline Notice:**
> This document specifies proposed architectural designs, interfaces, and lifecycle contracts for Tranche F1.
> It does NOT freeze final numerical standards, does NOT author feature specifications, and authorizes ZERO production code.
> Candidate parameters remain proposed candidates until formalized in `docs/tranches/F1/SPEC.md` and approved by the Product Owner.

---

## 1. Executive Summary & Design Scope

Tranche F1 establishes the foundational CAD domain contracts, metadata persistence schemas, and native host edit lifecycle rules that all subsequent downstream feature tranches (Panel Designer P1..P9, M&E Cable Tray M1..M8, and CAD Standards C1, C2) will inherit.

```
+-------------------------------------------------------------------------+
|                  Tranche F0: AutoCAD Foundation (FROZEN)                 |
|      Logging (FileLogger) | Settings (JSON) | PaletteSet | Ribbon Host   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|           Tranche F1: Common CAD Contracts (DESIGN_CORRECTION)           |
|  +-----------------------+  +-----------------------+  +--------------+  |
|  |   A/B. Units & Math   |  | C/D. Identity/Meta    |  | F-I. Native  |  |
|  | - Unitless Precedence |  | - Instance Identity   |  |      Edit    |  |
|  | - Typed Tolerances    |  | - Canonical Matrix    |  |   Lifecycle  |  |
|  | - Pure Core Vectors   |  | - Keyed Versioning    |  | - Provenance |  |
|  +-----------------------+  +-----------------------+  +--------------+  |
|  +--------------------------------------------------------------------+  |
|  | J. Block Contracts   | K. Cache Policy | L. Context Lock Matrix    |  |
+-------------------------------------------------------------------------+
          |                                            |
          v                                            v
+-----------------------+                    +-----------------------+
|  Tranche P1: Library  |                    |  Tranche M1..M8: M&E  |
|  (Vendor Footprints)  |                    |  (Cable Trays)        |
+-----------------------+                    +-----------------------+
          |
          v
+-----------------------+
|  Tranche P2: Placement|
|  (TTCPANELPLACE)      |
+-----------------------+
```

---

## Section A: Drawing Unit Architecture

### A.1 Architectural Boundary & Authority Alignment
In accordance with Architecture Roadmap §42:
- **Panel Mechanical Drawings:** Initial engineering assumption is millimeters (`mm`).
- **M&E Infrastructure Drawings:** Project drawing units must be configurable (meters, millimeters, centimeters, or inches).
- **Decoupled Core Calculations:** Core math and layout algorithms must operate on normalized internal engineering units, remaining agnostic of the host DWG's active display unit.
- **Candidate Standard Status:** `INSUNITS = 4` (Millimeters) is classified strictly as a `CANDIDATE` configuration, not an unverified global mandate.

### A.2 Proposed Drawing-Unit Adapter Design
To decouple downstream modules from host drawing unit variations, F1 introduces a two-tier unit architecture:
1. **Core Domain (`TTC.CadTools.Core.Units`):**
   - Pure C# enum: `EngineeringUnit { Millimeter, Centimeter, Meter, Inch, Foot, Unitless }`.
   - Pure conversion utility: `UnitConverter.GetScaleFactor(sourceUnit, targetUnit)`.
   - Immutable measurement structures: `Length`, `Area`, `AngularMeasure`.
2. **AutoCAD Host Adapter (`TTC.CadTools.AutoCAD.Units`):**
   - Host inspection service: `IDrawingUnitService.InspectDrawingUnits(Database db)`.
   - Reads `INSUNITS`, `MEASUREMENT`, `LUNITS`, `INSUNITSDEFSOURCE`, `INSUNITSDEFTARGET`.
   - Produces a structured unit resolution report: `DrawingUnitContext { ReportedInsUnits, InferredUnit, ConversionFactorToMm, ResolutionStatus }`.

### A.3 Handling Non-Millimeter and Unitless (`INSUNITS = 0`) Drawings
To eliminate dangerous silent assumptions while accommodating legacy enterprise drawings:
- **System Variable Semantics:**
  - `INSUNITS = 0`: Formally signifies **UNSPECIFIED / UNITLESS** physical drawing units.
  - `MEASUREMENT`: Controls hatch and linetype definition libraries (`0` = Imperial, `1` = Metric). **`MEASUREMENT` MUST NOT be used as proof that 1 drawing unit equals 1 millimeter.**
  - `LUNITS`: Controls display formatting of coordinates. **`LUNITS` MUST NOT be used to infer physical engineering units.**
  - `INSUNITSDEFSOURCE` / `INSUNITSDEFTARGET`: Control fallback insertion scaling for unitless blocks, but do NOT prove the engineering meaning of existing drawn geometry.
- **Unit Resolution Precedence:**
  Physical unit resolution must evaluate the following strict precedence:
  1. **Explicit Project / Workspace Configuration:** User/project profile defining the drawing unit (e.g. project setting: `PanelUnits = Millimeters`).
  2. **Explicit Non-Zero `INSUNITS`:** If `INSUNITS` is explicitly set (e.g. `4` for Millimeters, `1` for Inches), the explicit setting is respected.
  3. **Unitless Drawing (`INSUNITS = 0`):**
     - Initial physical unit resolution status is strictly **`PhysicalUnitResolution = UNRESOLVED`**.
     - **No Silent Millimeter Assumption:** TTC CAD will NOT silently treat 1 drawing unit as 1 mm simply because `MEASUREMENT = 1`.
     - Execution policy: The drawing requires an approved configuration profile or an explicit user confirmation dialog before automated placement/scaling commands proceed.
- **Handling Non-Metric Drawings (e.g. `INSUNITS = 1` - Inches):**
  - *Panel Designer Tranches:* Emit a validation block: *"Active drawing units set to Inches (INSUNITS=1). TTC Panel placement requires metric drawings."*
  - *M&E Tranches:* Query project configuration and apply normalized unit conversions.
- **Product Owner / SPEC Authority Required:** Formal acceptance criteria for whether unitless drawings prompt for one-time confirmation or read from workspace project settings will be locked in `SPEC.md`.

---

## Section B: Geometric Tolerance Architecture

### B.1 Candidate Tolerance Evaluation
Intake inherited the single candidate linear tolerance $\varepsilon = 10^{-4}\text{ mm}$ ($0.1\,\mu\text{m}$) from the Architecture Roadmap. F1 evaluates two architectural models:
1. **Model 1: Single Global Scalar Epsilon:**
   - Single constant `Tolerance.Epsilon = 1e-4`.
   - *Weakness:* Inadequate for multi-dimensional operations. A linear coincidence threshold of $0.0001\text{ mm}$ cannot be meaningfully applied to angular collinearity (radians/degrees) or vector cross-products.
2. **Model 2: Typed Tolerance Record (Recommended Architectural Model):**
   - Pure Core immutable struct: `GeometricTolerance`.
   - Fields:
     - `LinearCoincidence`: Distance below which two points are deemed identical (candidate: $10^{-4}\text{ mm}$).
     - `AngularAlignment`: Minimum angle between vectors to consider non-parallel (**`TO_BE_DETERMINED_IN_SPEC`**).
     - `CollinearThreshold`: Distance of a point from a line segment to be considered on the line (**`TO_BE_DETERMINED_IN_SPEC`**).
     - `ZeroLengthThreshold`: Length below which a segment or polyline vertex is rejected as degenerate (**`TO_BE_DETERMINED_IN_SPEC`**).
     - `BoundingOverlapMargin`: Minimal penetration required to register a collision/clash (**`TO_BE_DETERMINED_IN_SPEC`**).

> [!IMPORTANT]
> **Tolerance Discipline:**
> The only authorized roadmap numerical candidate is **Linear candidate $\varepsilon = 10^{-4}\text{ mm}$**.
> All other exact numerical thresholds are **`TO_BE_DETERMINED_IN_SPEC`** and must not be invented during DESIGN.

### B.2 Core Encapsulation
- All tolerance comparisons must be encapsulated in pure Core contracts:
  ```csharp
  // Conceptual Core Contract (Zero AutoCAD dependencies)
  namespace TTC.CadTools.Core.Geometry
  {
      public readonly struct GeometricTolerance
      {
          public double LinearEpsilon { get; }
          // Additional tolerance fields to be formalized in SPEC
          public static GeometricTolerance CandidateDefault => new GeometricTolerance(1e-4);

          public GeometricTolerance(double linearEpsilon)
          {
              LinearEpsilon = linearEpsilon;
          }
      }
  }
  ```
- Downstream geometry math in `TTC.CadTools.Core.Geometry` (bounding box containment, clearance collision, alignment snapping) must consume `GeometricTolerance` explicitly rather than using raw C# floating-point equality (`==`).

---

## Section C: TTC Object Identity Architecture

### C.1 Scope of TTC_OBJECT_ID
- **Identity Scope:** `TTC_OBJECT_ID` identifies **one TTC-managed AutoCAD drawing object instance** within a drawing project.
- **Explicit Exclusions:**
  - `TTC_OBJECT_ID` is **NOT** a catalog identity.
  - `TTC_OBJECT_ID` is **NOT** an electrical BOM identity.
  - `TTC_OBJECT_ID` is **NOT** an EPLAN device tag or schematic symbol identifier.
  - `TTC_OBJECT_ID` is **NOT** an electrical part master identity.
- **Separation of Concerns:**
  - `TTC_OBJECT_ID`: Uniquely identifies the physical drawing entity instance (e.g. this specific DIN rail segment or this placed contactor block on panel DIN rail #2).
  - `TTC_LIBRARY_ID`: References the catalog or vendor library asset (e.g. `"SCHNEIDER-LC1D09"`).
  - EPLAN device tagging remains strictly decoupled and belongs to downstream export tranches (C2).

### C.2 The Three Identity Layers

| Identity Layer | Scope | Lifetime | Host Behavior on Clone (`COPY`) | Purpose in TTC CAD |
|---|---|---|---|---|
| **`ObjectId`** | Session / In-Memory | Active drawing session only; changes on close/reopen | New `ObjectId` generated for clone | Transient memory handle for fast transaction lookup. **Must never be stored as persistent identity.** |
| **`Handle`** | Database / DWG File | Persistent across save/reopen; unique within a single `Database` | New, unique `Handle` generated for clone | Host object identifier within one DWG. Does not guarantee cross-DWG uniqueness and has no TTC semantic meaning. |
| **`TTC_OBJECT_ID`** | Drawing Project Instance | Globally unique across project entities; persistent across save/reopen | Cloned unchanged if dictionary is copied | **Authoritative TTC drawing instance identity.** Uniquely identifies a TTC-managed drawing entity instance. |

### C.3 Identifier Format Evaluation
- **Option 1: Pure RFC 4122 GUID (UUIDv4) (Strongly Evaluated):**
  - Format: `36-character hex string` (e.g. `e029b478-f32a-4c22-b5e8-132d03975ef2`).
  - *Advantages:* 100% collision-free; standard .NET `Guid.NewGuid()`; completely decoupled from entity classification.
  - *Classification Cleanliness:* If an entity's role or type changes (e.g. generic component reclassified to terminal block), the immutable identifier does not become misleading.
- **Option 2: Prefixed Semantic Slug + UUIDv4 (Candidate Proposal):**
  - Format: `TTC-{ROLE}-{UUID}` (e.g. `TTC-COMP-e029b478-...` or `TTC-RAIL-...`).
  - *Trade-off Analysis:*
    - Immediate human recognition in raw diagnostic logs and property palettes.
    - *Risk of Semantic Divergence:* If `ROLE` is embedded into the immutable ID, it duplicates `TTC_OBJECT_TYPE`. If an object's classification changes during engineering refactoring, the immutable ID either carries an outdated prefix or requires ID mutation (which breaks persistent references).
- **Design Recommendation:** F1 DESIGN recommends evaluating whether `TTC_OBJECT_ID` should be a pure UUIDv4 with classification stored exclusively in `TTC_OBJECT_TYPE`, or whether a static prefix is retained. **The exact identifier format is NOT frozen in DESIGN and will be finalized in `SPEC.md`.**

---

## Section D: Metadata Storage Architecture

### D.1 Canonical Proposed Metadata-Location Matrix
To resolve previous contradictions, the matrix below establishes the authoritative canonical storage architecture for all baseline metadata keys:

| Metadata Key | Canonical Storage Location | Primary / Authoritative Copy | Secondary / Cached Copy | Mismatch Resolution Rule | Host Clone Behavior | Schema Ownership |
|---|---|---|---|---|---|---|
| **`TTC_OBJECT_ID`** | `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`) | `XRecord` (`TTC_METADATA_HEADER`) | `XData` (RegApp `"TTC_CAD"`) | `XRecord` is authoritative. If `XData` differs or is missing, `XData` is resynchronized from `XRecord`. | Cloned unchanged by native deep-clone; requires F1 clone resolution. | F1 Common Contracts |
| **`TTC_OBJECT_TYPE`** | `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`) | `XRecord` (`TTC_METADATA_HEADER`) | `XData` (RegApp `"TTC_CAD"`) | `XRecord` is authoritative. If `XData` differs or is missing, `XData` is resynchronized from `XRecord`. | Cloned unchanged by native deep-clone. | F1 Common Contracts |
| **`TTC_SCHEMA_VERSION`**| `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`) | `XRecord` (`TTC_METADATA_HEADER`) | None | Only exists in `XRecord`. | Cloned unchanged. | F1 Common Contracts |
| **`TTC_LIBRARY_ID`** | `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`) | `XRecord` (`TTC_METADATA_HEADER`) | None | Only exists in `XRecord`. | Cloned unchanged. | P1 / Common Contracts |
| **`TTC_LIBRARY_VERSION`**| `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`) | `XRecord` (`TTC_METADATA_HEADER`) | None | Only exists in `XRecord`. | Cloned unchanged. | P1 / Common Contracts |

### D.2 Hybrid Storage Model Rationale
1. **Primary Authoritative Store (`ExtensionDictionary` / `XRecord`):**
   - Stores structured, typed application data.
   - Bounded by DWG database object size limits / available memory (hundreds of KB to megabytes), avoiding the 16 KB limitation.
   - Cleanly separated into distinct record groups (e.g. `TTC_METADATA_HEADER`, `TTC_COMPONENT_DATA`).
2. **Secondary Fast Index (`XData`):**
   - Registered under RegApp `"TTC_CAD"`.
   - Strictly contains lightweight query keys (`TTC_OBJECT_TYPE`, `TTC_OBJECT_ID`).
   - Enables fast selection set filtering via `Editor.SelectAll(filter)` without opening extension dictionaries for every drawing object.
   - Total XData footprint is minimal (< 200 bytes), well below the ~16 KB per-object limit across all registered applications.

### D.3 Vanilla AutoCAD Usability
- Zero custom ObjectARX classes (`AcDbObject` derivatives).
- All metadata uses standard native AutoCAD structures (`ResultBuffer`, `XRecord`, standard DXF types).
- Vanilla AutoCAD installations will open, view, copy, move, plot, and save TTC-produced DWGs with **zero** proxy alerts, missing application dialogs, or file corruption.

---

## Section E: Schema Versioning Architecture

### E.1 Version Identification & Format
- Every entity's `TTC_METADATA_HEADER` records semantic versioning:
  - `TTC_SCHEMA_VERSION`: `"1.0.0"` (SemVer format: `MAJOR.MINOR.PATCH`).
  - `MAJOR`: Breaking structural changes (e.g. restructured dictionaries or renamed core keys).
  - `MINOR`: Backward-compatible additive changes (e.g. new optional fields).
  - `PATCH`: Backward-compatible fixes.

### E.2 Keyed Record Contract & Forward Compatibility
- **Keyed Schema Contract:** Instead of assuming unknown fields are always appended at the end of a sequential list ("trailing entries"), metadata records must use a **keyed / tagged record contract**.
- **Unknown Field Preservation:**
  - When deserializing an `XRecord`, any unrecognized key-value pairs or tagged entries (whether at the beginning, middle, or end of the data stream) are retained in an unparsed collection (`UnrecognizedEntries`).
  - During serialization, all `UnrecognizedEntries` are written back to the `ResultBuffer` unchanged.
  - This prevents an older plugin version from stripping future fields added by newer versions.
- **Compatibility Rules:**
  1. **Exact Match (`1.0.0` == `1.0.0`):** Normal read/write path.
  2. **Minor Version Upgrade (Plugin `1.1.0`, DWG `1.0.0`):** Plugin reads legacy fields seamlessly, applies default values for missing optional fields, and updates `TTC_SCHEMA_VERSION` on next user-authorized write.
  3. **Unknown Major Version (Plugin `1.0.0`, DWG `2.0.0`):**
     - **Fail-Safe Read-Only Mode:** Plugin detects unsupported major version.
     - Protects entity from modification or overwriting.
     - Emits structured warning to Editor: *"Entity [Handle: XYZ] has schema version 2.0.0, unsupported by plugin version 1.0.0. Protected in read-only mode."*

---

## Section F: Native Edit Lifecycle Matrix

The matrix below provides the architectural design policy for native AutoCAD commands acting on TTC-managed entities, classifying host API facts separately from TTC design policies:

| Native Command | Host Entity Action | AutoCAD Handle | Host Fact vs Design Policy | Recommended Design Policy | Verification Category | SPEC Authority Required? |
|---|---|:---:|---|---|:---:|:---:|
| **`MOVE` / Grip Edit** | Geometry translation | Unchanged | `HOST_FACT_SOURCE_VERIFIED` | Permitted. Associated clearance envelopes move if grouped (`DESIGN_POLICY`). Invalidates spatial cache. | `HOST_FACT_SOURCE_VERIFIED` | No |
| **`ROTATE` / Grip Edit** | Geometry rotation | Unchanged | `HOST_FACT_SOURCE_VERIFIED` | Permitted. Clearance rotates with component (`DESIGN_POLICY`). Invalidates spatial cache. | `HOST_FACT_SOURCE_VERIFIED` | No |
| **`SCALE`** | Geometry scaling | Unchanged | `HOST_FACT_SOURCE_VERIFIED` | Fixed catalog components cannot be scaled arbitrarily (`SPEC_POLICY_REQUIRED`). Flag non-unit scale as validation error. | `DESIGN_POLICY` | Yes |
| **`COPY`** | Deep-clones entity | New Handle | `HOST_FACT_SOURCE_VERIFIED` | Deep-clone duplicates XRecord unchanged, causing duplicate `TTC_OBJECT_ID`. Apply F1 clone resolution architecture. | `HOST_TEST_REQUIRED` | Yes |
| **`ARRAY`** | Multiple clones | New Handles | `HOST_FACT_SOURCE_VERIFIED` | Associative array creates anonymous block; non-associative creates individual clones. Each clone duplicate must be resolved. | `HOST_TEST_REQUIRED` | Yes |
| **`MIRROR`** | Mirrors geometry | Conditional Handle* | `HOST_FACT_SOURCE_VERIFIED` | *If source preserved: new Handle minted; if source erased: existing entity transformed. Components cannot be mirrored (`SPEC_POLICY_REQUIRED`). | `HOST_FACT_SOURCE_VERIFIED` | Yes |
| **`ERASE` / `Delete`** | Entity erased | Marked Erased | `HOST_FACT_SOURCE_VERIFIED` | Primary entity erased. Database reactor marks cache dirty; command audit detects orphaned clearance envelopes. | `HOST_FACT_SOURCE_VERIFIED` | Yes |
| **`OOPS` / `UNDO`** | Restores erased entity | Restores Handle | `HOST_FACT_SOURCE_VERIFIED` | Restores entity and associated dictionaries cleanly to pre-erased state. | `HOST_FACT_SOURCE_VERIFIED` | No |
| **`REDO`** | Restores state | Restores Handle | `HOST_FACT_SOURCE_VERIFIED` | Native AutoCAD transaction handles state restoration cleanly. | `HOST_FACT_SOURCE_VERIFIED` | No |
| **`EXPLODE`** | Breaks block down | Block destroyed | `HOST_FACT_SOURCE_VERIFIED` | Linework extracted; ExtensionDictionary on BlockReference is lost. Prohibited on TTC blocks via QA validation. | `HOST_TEST_REQUIRED` | Yes |
| **`WBLOCK`** | Exports to DWG | New DB Handles | `HOST_FACT_SOURCE_VERIFIED` | Exports entities to standalone DWG; extension dictionaries survive. | `HOST_TEST_REQUIRED` | Yes |
| **`INSERT`** | Imports external DWG | Imported Handles | `HOST_FACT_SOURCE_VERIFIED` | External DWG insertion brings external IDs. Detect collisions on insert boundary. | `HOST_TEST_REQUIRED` | Yes |
| **`COPYCLIP` / `PASTECLIP`** | Inter-drawing paste | New Handles | `HOST_FACT_SOURCE_VERIFIED` | Clipboard deep-clones dictionaries into target DWG. Provenance is unknown; requires collision detection. | `HOST_TEST_REQUIRED` | Yes |
| **`SAVE` / `REOPEN`** | File persistence | Persistent Handles | `HOST_FACT_SOURCE_VERIFIED` | Entity Handles and extension dictionaries reload intact. Exact record layout round-trip is tested in BUILD. | `HOST_TEST_REQUIRED` | No |
| **`BLOCK REDEFINE`** | Linework update | BlockDef updated | `HOST_FACT_SOURCE_VERIFIED` | Instance metadata in `BlockReference.ExtensionDictionary` survives block definition update. | `HOST_TEST_REQUIRED` | No |

---

## Section G: Clone / Deep-Clone Lifecycle Architecture

### G.1 The Identity Collision Problem
When native `COPY`, `ARRAY`, `WBLOCK`, or `PASTECLIP` executes:
- $Handle(B) \neq Handle(A)$ (AutoCAD assigns a unique Handle to the clone).
- $XRecord(B) == XRecord(A) \implies TTC\_OBJECT\_ID(B) == TTC\_OBJECT\_ID(A)$ (**TTC Identity Duplication**).

### G.2 Two-State Lineage & Repair Architecture
TTC CAD resolves identity collisions through two distinct provenance states:

#### State A: Clone Provenance Known
- **Condition:** The host command or event provides deterministic lineage linking source entity $A$ and clone entity $B$ (e.g. captured during an intercepted command boundary or `IdMapping` from deep-cloning).
- **Resolution Policy:**
  1. Source entity $A$ retains its existing `TTC_OBJECT_ID`.
  2. Clone entity $B$ is assigned a freshly generated `TTC_OBJECT_ID`.
  3. `XRecord` and cached `XData` on clone $B$ are updated within a managed transaction.
  4. An audit log entry is recorded: *"Clone provenance resolved: Entity [Handle: B] assigned new TTC_OBJECT_ID [ID: ...] derived from source [Handle: A]."*

#### State B: Duplicate Discovered / Provenance Unknown
- **Condition:** Two entities $A$ and $B$ sharing the same `TTC_OBJECT_ID` are discovered during a later audit (e.g. from clipboard paste, external DWG insertion, or unintercepted background drafting), where deterministic lineage cannot be proven.
- **Resolution Policy:**
  1. **No Silent Guessing:** TTC CAD **must NOT silently choose an "original"** based on arbitrary heuristics (such as earlier Handle sequence, file timestamp, or database position).
  2. **Collision Classification:** The collision is formally classified as **`COLLISION_UNRESOLVED`**.
  3. **Non-Destructive Quarantine / Flagging:** Both entities are flagged in the identity audit index. Neither entity is silently mutated without controlled authorization.
  4. **Controlled Reconciliation:** SPEC will finalize the resolution workflow (e.g., interactive prompt displaying both components, visual highlighting in drawing, or automated assignment with audit report).

### G.3 Generic F1 Identity Audit Service Boundary
To avoid coupling F1 to future Panel-specific QA commands (such as P6 `TTCPANELCHECK`):
- F1 defines a reusable, tranche-agnostic identity audit contract:
  ```csharp
  // Conceptual F1 Service Contract
  namespace TTC.CadTools.AutoCAD.Lifecycle
  {
      public interface IEntityIdentityAuditService
      {
          IdentityAuditResult AuditDrawingIdentities(Database db);
          ReconciliationResult ReconcileCollision(Database db, IdentityCollision collision, ReconciliationPolicy policy);
      }
  }
  ```
- Downstream feature tranches (P2 placement, P6 QA, C1 standards) consume `IEntityIdentityAuditService` to audit and reconcile drawing identities.

### G.4 Pre-Save Mutation Safety (`Database.BeginSave`)
- Listening to `Database.BeginSave` to detect collisions is permitted for passive logging or save-warning dialogs.
- **Mutating the database inside `BeginSave` is classified as `HOST_TEST_REQUIRED`.** Database writes inside `BeginSave` risk file lock conflicts or corruption and must not be treated as a proven write point until host verified in BUILD.

---

## Section H: Save / Reopen Persistence Architecture

### H.1 Persistence Invariants
1. **Transaction Scoping:** All metadata written to `ExtensionDictionary` / `XRecord` must be committed inside a closed `Transaction` prior to file save.
2. **Handle Invariance:** AutoCAD `Handle` values remain strictly invariant across document save, close, and reopen cycles within the same DWG file.
3. **Vanilla Primitives:** `XRecord` data contains pure primitives (DXF 1 = string, DXF 40 = double, DXF 70 = int16, DXF 90 = int32). Deserialization does not depend on .NET binary serialization (`BinaryFormatter`), avoiding versioning crashes.

---

## Section I: Undo / Redo & Compound Atomicity Architecture

### I.1 Compound Entity Grouping
In downstream panel tools, a physical component comprises a compound model:
1. `BlockReference`: Visual physical footprint.
2. `Polyline`: Clearance boundary envelope (maintenance, thermal, electrical safety).
3. `ExtensionDictionary`: Metadata record.

### I.2 Atomicity Doctrine
- **Single Transaction Scoping:** Creation of a component footprint, its clearance boundary, and its metadata dictionary must always occur within a single atomic `Transaction`.
- **Atomic Rollback:** If the operation fails, is cancelled by the user (`Esc`), or encounters a geometric collision:
  - The transaction calls `tr.Abort()`.
  - Zero dangling polylines, orphan blocks, or partial dictionaries remain in the `Database`.
- **Native Undo Integrity:** When a user executes AutoCAD native `U` / `UNDO`:
  - Both the footprint and the clearance polyline are rolled back together as a single undo step.

---

## Section J: Block Asset Contract Architecture

### J.1 Distinction: Common F1 Contract vs Panel P1/P2 Recommendations
F1 establishes the **Common CAD Block Contract** governing how the AutoCAD host interacts with block definitions and references. It explicitly distinguishes these common contracts from downstream panel-specific asset recommendations:

| Contract Domain | Common F1 CAD Contract (Tranche F1) | Panel-Specific Asset Recommendation (Tranche P1/P2) | Status |
|---|---|---|---|
| **Base Insertion Point** | Block definition must define a deterministic, consistent base point (0,0,0) relative to physical mounting geometry. | Recommendation: Bottom-Left mounting corner for components; Center-Center for symmetrical DIN rail devices. | `DESIGN_PROPOSED` |
| **Unit Scale Invariance** | Block reference insertion scale must be uniform: $ScaleX = ScaleY = ScaleZ = 1.0$. Non-uniform scaling is prohibited. | Enforced by `TTCPANELPLACE` placement command. | `DESIGN_PROPOSED` |
| **Block Type Rule** | Static blocks required for standard fixed-geometry catalog items. Dynamic blocks disallowed for fixed footprints to prevent dimension tampering. | Dynamic blocks permitted only where authorized (e.g. variable-length DIN rail in P3). | `DESIGN_PROPOSED` |
| **Layer & Linework** | Linework inside block definitions should reside on Layer `0` with `ByBlock` or `ByLayer` properties. | Downstream layer standard C1 defines target presentation layers. | `DESIGN_PROPOSED` |
| **Nesting Limit** | Maximum 1 level of block nesting for compound assemblies. Sub-blocks must not contain conflicting `TTC_OBJECT_ID` records. | Evaluated for contactor + auxiliary contact pairs in P1. | `DESIGN_PROPOSED` |
| **Mirroring Policy** | Host `MIRROR` command triggers validation warning on asymmetrical components. | Catalog assets define whether an item is symmetrical or unmirrorable. | `SPEC_POLICY_REQUIRED` |

*Note: F1 does NOT create or define vendor catalog schemas (which belong to Tranche P1).*

---

## Section K: Host Event & Cache Invalidation Strategy

### K.1 Resolution of ISSUE-F1-008
- **Decision:** **Passive Command-Boundary Audit + Ephemeral Spatial Caches.**
- **Rationale:** While Autodesk guidelines document event notification rules, attempting database writes or nested transactions inside database reactors (`ObjectModified`, `ObjectErased`) introduces severe risks of `eTransactionInProgress`, event recursion, and AutoCAD crashes.
- **TTC Policy (`PROJECT_POLICY`):** Database reactors must remain strictly read-only, setting in-memory dirty flags. No write transactions may be initiated within a reactor callback.

### K.2 Cache Invalidation Rules
1. **Ephemeral Caches:** Spatial index trees (R-Trees for collision detection), clearance graph caches, and panel topology models exist **only in-memory** during active command sessions.
2. **Persistent Source of Truth:** The AutoCAD DWG database (entities, layers, and extension dictionaries) is the sole persistent source of truth.
3. **Invalidation Hooks:**
   - Active document switch: Invalidate in-memory layout cache.
   - Command start: Rebuild or query spatial index from drawing database.
   - External edit detection: Compare database transaction sequence or timestamp before running layout audits.

---

## Section L: Transaction & DocumentLock Execution Matrix

| Execution Context | `DocumentLock` Required? | `Transaction` Required? | Immediate Write Allowed? | Undo Group Boundary | Exception Handling Protocol |
|---|:---:|:---:|:---:|---|---|
| **Modal Command (`[CommandMethod]`)** | NO (Implicitly locked by AutoCAD) | YES | YES | AutoCAD command undo group | Catch exceptions; log to `FileLogger`; abort transaction; emit user-friendly error to Editor. |
| **Session Command (`CommandFlags.Session`)** | **YES** (`doc.LockDocument()`) | YES | YES | Manual undo transaction group | Acquire lock in `using` block; verify `doc != null`; abort on error. |
| **Modeless Palette (`PaletteSet` UI click)** | **YES** (`doc.LockDocument()`) | YES | YES | Wrap in managed transaction | Verify `MdiActiveDocument != null`; acquire lock; abort transaction on failure. |
| **Application-Context Callback** | **YES** | YES | Deferred preferred | No active drawing undo group | Wrap in document lock; execute via `doc.SendStringToExecute` or managed dispatch. |
| **Database Reactor Callback** | **PROHIBITED** | **PROHIBITED** | **NO** (Read-only query only) | N/A | Never start transaction or lock inside reactor; set dirty flag only. |
| **Zero-Document State (`doc == null`)** | NO (No document exists) | NO | NO | N/A | Shield execution; display palette status; disable document-mutating controls. |

---

## Section M: Core vs AutoCAD Dependency Boundaries

In strict adherence to the Decoupling Doctrine established in F0:
- **`TTC.CadTools.Core` (Pure C# Standard / .NET Framework 4.8):**
  - **Zero** references to `AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`, or `AdWindows.dll`.
  - Houses pure domain models, geometric algorithms, tolerance math, unit converters, and metadata envelope abstractions.
- **`TTC.CadTools.AutoCAD` (AutoCAD Managed .NET Host Assembly):**
  - References AutoCAD 2023 assemblies.
  - Retains the frozen F0 host assembly name (`TTC.CadTools.AutoCAD`).
  - Contains host adapter namespaces:
    - `TTC.CadTools.AutoCAD.Units`
    - `TTC.CadTools.AutoCAD.Metadata`
    - `TTC.CadTools.AutoCAD.Lifecycle`
    - `TTC.CadTools.AutoCAD.Blocks`

### Proposed Conceptual Interfaces for Core
```csharp
// Pure Core Concept (Zero AutoCAD references)
namespace TTC.CadTools.Core.Contracts
{
    public interface ITtcIdentifiable
    {
        string TtcObjectId { get; }
        string TtcObjectType { get; }
        string SchemaVersion { get; }
    }

    public interface IToleranceService
    {
        bool AreEqual(double a, double b, double epsilon);
        bool ArePointsCoincident(double x1, double y1, double x2, double y2);
        bool AreVectorsParallel(double vx1, double vy1, double vx2, double vy2);
    }

    public interface IUnitConverter
    {
        double Convert(double value, EngineeringUnit from, EngineeringUnit to);
    }
}
```

---

## Section N: Failure & Recovery Architecture

F1 defines robust recovery strategies for corruption and edge cases:

1. **Duplicate `TTC_OBJECT_ID` Collision:**
   - *Detection:* `IEntityIdentityAuditService` scans drawing entities. Maps `TTC_OBJECT_ID` $\to$ `List<Handle>`. If count > 1, collision exists.
   - *Recovery:* Apply two-state resolution: if provenance is known, update clone; if unknown, classify `COLLISION_UNRESOLVED`, log collision, and require controlled reconciliation.
2. **Orphan Clearance Envelope:**
   - *Detection:* Clearance polyline references a missing component `TTC_OBJECT_ID`.
   - *Recovery:* Audit tool prompts user: *"Orphan clearance boundary found [Handle: XYZ]. Remove boundary?"* User accepts $\to$ erased safely.
3. **Missing or Corrupted `XRecord`:**
   - *Detection:* Entity has `XData` tag but `ExtensionDictionary` is empty or lacks `TTC_METADATA_HEADER`.
   - *Recovery:* Entity classified as `UNREGISTERED_TTC_ASSET`. Visual geometry preserved; flagged for footprint re-registration.
4. **Drawing Unit Mismatch / Unitless Drawing:**
   - *Detection:* `INSUNITS = 0` or non-metric setting.
   - *Recovery:* Visual banner in PaletteSet displays: *"Drawing units: Unitless (INSUNITS=0). Please confirm drawing units."* Blocks automated insertions until confirmed.

---

## Section O: Host Verification Plan for BUILD Stage

During the future BUILD stage, the following automated host tests and runtime verifications must be executed against AutoCAD 2023:

1. **TEST-F1-01 (Handle Immutability):** Verify that entity Handles remain invariant across save, close, and reopen of a DWG file.
2. **TEST-F1-02 (Native Clone Handle Uniqueness):** Verify that native `COPY` creates a clone with a distinct Handle.
3. **TEST-F1-03 (XRecord Clone Duplication):** Verify that native `COPY` duplicates `XRecord` data without mutating `TTC_OBJECT_ID`.
4. **TEST-F1-04 (Hybrid Storage Filter):** Verify that registered `XData` allows instant selection filtering via `Editor.SelectAll()` while `XRecord` preserves rich attributes.
5. **TEST-F1-05 (DocumentLock Modeless Safety):** Verify that palette-invoked database mutations succeed with `DocumentLock` and throw `eLockViolation` without it.
6. **TEST-F1-06 (Transaction Abort Atomicity):** Verify that aborting a transaction rolls back both a block reference and its clearance polyline with zero database leaks.
7. **TEST-F1-07 (Vanilla DWG Compatibility):** Verify that a DWG saved with TTC extension dictionaries opens in standard vanilla AutoCAD 2023 with zero proxy alerts.
8. **TEST-F1-08 (Decoupling Integrity):** 100% automated test confirming `TTC.CadTools.Core.dll` contains zero references to Autodesk assemblies.
9. **TEST-F1-09 (Pre-Save Mutation Safety):** Verify whether `Database.BeginSave` can safely execute write transactions or if it must be strictly read-only.
