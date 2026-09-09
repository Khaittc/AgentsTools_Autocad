# Tranche F1: Common CAD Contracts — Architectural Design

- **Document ID:** `DESIGN-FOUNDATION-F1-001`
- **Version:** `0.1.0` (Draft Architectural Proposal)
- **Lifecycle Stage:** `DESIGN`
- **Status:** `PROPOSED_DESIGN / INDEPENDENT_REVIEW_PENDING`
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
|                Tranche F1: Common CAD Contracts (DESIGN)                 |
|  +-----------------------+  +-----------------------+  +--------------+  |
|  |   A/B. Units & Math   |  | C/D. Identity/Meta    |  | F-I. Native  |  |
|  | - Configurable Units  |  | - TTC_OBJECT_ID (UUID)|  |      Edit    |  |
|  | - Typed Tolerances    |  | - Hybrid XData/XRecord|  |   Lifecycle  |  |
|  | - Pure Core Vectors   |  | - Schema Versioning   |  | - Safe Clones|  |
|  +-----------------------+  +-----------------------+  +--------------+  |
|  +--------------------------------------------------------------------+  |
|  | J. Block Asset Contract | K. Cache Policy | L. Context Lock Matrix |  |
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
2. **AutoCAD Host Adapter (`TTC.CadTools.Acad.Units`):**
   - Host inspection service: `IDrawingUnitService.InspectDrawingUnits(Database db)`.
   - Reads `INSUNITS`, `MEASUREMENT`, `LUNITS`.
   - Produces a structured unit resolution report: `DrawingUnitContext { ReportedInsUnits, InferredUnit, ConversionFactorToMm, IsConfident }`.

### A.3 Handling Non-Millimeter and Unitless (`INSUNITS = 0`) Drawings
To avoid breaking legacy enterprise drawings while preventing physical dimension errors:
- **Case 1: `INSUNITS = 4` (Millimeters):** Fully trusted. Scale factor = 1.0. Commands proceed without prompt.
- **Case 2: `INSUNITS = 0` (Unitless):**
  - The adapter inspects `MEASUREMENT`. If `MEASUREMENT = 1` (Metric), the drawing is flagged as `MetricUnitless`.
  - *Recommended Option:* The command emits an informational log/warning: *"Drawing units are Unitless (INSUNITS=0). Assuming Millimeters per Metric template."* Execution proceeds using 1 unit = 1 mm unless configured otherwise.
  - *Rejected Alternative:* Hard-blocking `INSUNITS = 0` would prevent engineers from using standard enterprise panel templates.
- **Case 3: `INSUNITS` is Non-Metric (e.g. `1` = Inches):**
  - In Panel Designer tranches: Emits a blocking error dialog or validation warning: *"Active drawing units set to Inches (INSUNITS=1). TTC Panel placement requires metric drawings."*
  - In M&E tranches: Queries project configuration and applies the corresponding unit conversion matrix.
- **Product Owner / SPEC Decision Required:** Final decision on whether non-mm drawings in Panel Designer prompt for automatic `INSUNITS` normalization or block outright.

---

## Section B: Geometric Tolerance Architecture

### B.1 Candidate Tolerance Evaluation
Intake introduced candidate tolerance $\varepsilon = 10^{-4}\text{ mm}$ ($0.1\,\mu\text{m}$). The design evaluates two architectural models:
1. **Model 1: Single Global Scalar Epsilon:**
   - Single constant `Tolerance.Epsilon = 1e-4`.
   - *Weakness:* Inadequate for multi-dimensional operations. A linear coincidence threshold of $0.0001\text{ mm}$ cannot be meaningfully applied to angular collinearity (which requires radians/degrees) or vector cross-products.
2. **Model 2: Typed Tolerance Record (Recommended):**
   - Pure Core immutable struct: `GeometricTolerance`.
   - Fields:
     - `LinearCoincidence`: Distance below which two points are deemed identical (candidate: $10^{-4}\text{ mm}$).
     - `AngularAlignment`: Minimum angle between vectors to consider non-parallel (candidate: $10^{-5}\text{ rad}$).
     - `CollinearThreshold`: Distance of a point from a line segment to be considered on the line.
     - `ZeroLengthThreshold`: Length below which a segment or polyline vertex is rejected as degenerate.
     - `BoundingOverlapMargin`: Minimal penetration required to register a collision/clash.

### B.2 Core Encapsulation
- All tolerance comparisons must be encapsulated in pure Core contracts:
  ```csharp
  // Conceptual Core Contract (Zero AutoCAD dependencies)
  public readonly struct GeometricTolerance
  {
      public double LinearEpsilon { get; }
      public double AngularEpsilon { get; }
      public double ZeroLengthEpsilon { get; }
      public static GeometricTolerance Default { get; }
  }
  ```
- Downstream geometry math in `TTC.CadTools.Core.Geometry` (bounding box containment, clearance collision, alignment snapping) must consume `GeometricTolerance` explicitly rather than using raw C# floating-point equality (`==`).
- **SPEC Authority Required:** Exact numerical values for all tolerance fields are `TO_BE_DETERMINED` and will be locked during F1 SPEC.

---

## Section C: TTC Object Identity Architecture

### C.1 The Three Identity Layers
AutoCAD and TTC CAD operate across three distinct entity identity concepts:

| Identity Layer | Scope | Lifetime | Host Behavior on Clone (`COPY`) | Purpose in TTC CAD |
|---|---|---|---|---|
| **`ObjectId`** | Session / In-Memory | Active drawing session only; changes on close/reopen | New `ObjectId` generated for clone | Transient memory handle for fast transaction lookup. **Must never be stored as persistent identity.** |
| **`Handle`** | Database / DWG File | Persistent across save/reopen; unique within a single `Database` | New, unique `Handle` generated for clone | Host object identifier within one DWG. Does not guarantee cross-DWG uniqueness and has no TTC semantic meaning. |
| **`TTC_OBJECT_ID`** | System / Semantic | Globally unique; persistent across save/reopen/cross-DWG export | Cloned unchanged if dictionary is copied | **The authoritative TTC object identity.** Uniquely identifies an equipment instance across all drawings, catalogs, and BOMs. |

### C.2 Identifier Format Evaluation
- **Option 1: Raw RFC 4122 GUID (UUIDv4):**
  - Format: `36-character hex string` (e.g. `e029b478-f32a-4c22-b5e8-132d03975ef2`).
  - *Trade-off:* 100% collision-free globally; compact; standard .NET `Guid.NewGuid()`. Low readability in raw AutoCAD diagnostics.
- **Option 2: Prefixed Semantic Slug + GUID (Recommended):**
  - Format: `TTC-{ROLE}-{UUID}` (e.g. `TTC-COMP-e029b478-f32a-4c22-b5e8-132d03975ef2` or `TTC-RAIL-...`).
  - *Trade-off:* Combines global uniqueness with immediate human recognition in diagnostic logs and property palettes.
- **Option 3: Sequential Integer:**
  - *Rejected:* High collision probability when combining drawings, copy-pasting between DWGs, or importing external blocks.

### C.3 Uniqueness Scope & Creation Timing
- **Uniqueness Scope:** Globally unique across all project databases and external references.
- **Creation Timing:** Assigned exactly once at entity insertion time (e.g. when `TTCPANELPLACE` creates a component block reference).
- **Ownership Criteria:** A drawing entity is recognized as a TTC-managed object if and only if it possesses a valid `TTC_OBJECT_TYPE` and `TTC_OBJECT_ID`.

---

## Section D: Metadata Storage Architecture

### D.1 Evaluation of Storage Mechanisms
AutoCAD DWG entities support two standard metadata attachment mechanisms:
1. **Extended Data (`XData`):**
   - Attached directly to `DBObject`.
   - Fast selection filtering via `SelectionFilter(new TypedValue[] { new TypedValue((int)DxfCode.ExtendedDataRegAppName, "TTC_CAD") })`.
   - Hard limit: 16,383 bytes per registered application name.
2. **Extension Dictionary (`ExtensionDictionary`) & `XRecord`:**
   - Named `DBDictionary` attached to the entity.
   - Arbitrary size (no 16KB limit); supports complex hierarchies and multiple records.
   - Clean separation of concerns (e.g. `TTC_IDENTITY`, `TTC_ATTRIBUTES`, `TTC_CLEARANCE`).

### D.2 Recommended Hybrid Storage Strategy
To optimize both selection performance and rich structured storage:

```
Entity (BlockReference / Polyline)
 ├── XData (RegApp: "TTC_CAD")
 │    └── [DxfCode.ExtendedDataAsciiString]: "TTC_OBJECT_TYPE=PANEL_COMPONENT"
 │    └── [DxfCode.ExtendedDataAsciiString]: "TTC_OBJECT_ID=TTC-COMP-..."
 └── ExtensionDictionary
      ├── XRecord: "TTC_METADATA_HEADER"
      │    ├── SchemaVersion: "1.0.0"
      │    ├── LibraryId: "SCHNEIDER-LC1D09"
      │    ├── LibraryVersion: "2026.1"
      │    └── CreatedTimestamp: "2026-09-09T23:30:00Z"
      └── XRecord: "TTC_COMPONENT_DATA"
           ├── Width: 45.0
           ├── Height: 85.0
           ├── Depth: 92.0
           ├── MountingType: "DIN_RAIL"
           └── ThermalDissipationWatts: 5.2
```

### D.3 Vanilla AutoCAD Usability
- Zero custom ObjectARX classes (`AcDbObject` derivatives).
- All metadata uses native AutoCAD primitives (`ResultBuffer`, `XRecord`, standard string/numeric DXF codes).
- Vanilla AutoCAD installations will open, view, copy, move, plot, and save TTC-produced DWGs with **zero** proxy alerts, missing application dialogs, or file corruption.

---

## Section E: Schema Versioning Architecture

### E.1 Version Identification
- Every entity's metadata header records semantic versioning:
  - `TTC_SCHEMA_VERSION`: `"1.0.0"`.
- Format: `MAJOR.MINOR.PATCH`.
  - `MAJOR`: Breaking structural change (e.g. renamed dictionary keys).
  - `MINOR`: Backward-compatible additive changes (e.g. new optional fields).
  - `PATCH`: Non-structural fixes.

### E.2 Compatibility & Migration Rules
1. **Exact Match (`1.0.0` == `1.0.0`):** Normal read/write path.
2. **Minor Version Upgrade (Plugin has `1.1.0`, DWG has `1.0.0`):**
   - Plugin reads legacy fields seamlessly.
   - Default values applied to new optional fields.
   - File is upgraded in-place on next explicit save.
3. **Unknown / Future Major Version (Plugin has `1.0.0`, DWG has `2.0.0`):**
   - **Fail-Safe Read-Only Mode:** Plugin detects unsupported major version.
   - Prevents mutation or overwriting of unknown fields.
   - Emits structured warning: *"Entity has schema version 2.0.0, unsupported by current plugin version 1.0.0. Entity is protected in read-only mode."*
4. **Unknown Field Preservation:** When modifying an existing `XRecord`, the serializer must preserve any unrecognized trailing `TypedValue` entries to avoid data stripping by older plugin versions.

---

## Section F: Native Edit Lifecycle Matrix

The matrix below establishes the architectural design policy for native AutoCAD commands acting on TTC-managed entities:

| Native Command | Host Entity Action | AutoCAD Handle | TTC_OBJECT_ID Risk | Recommended Design Policy | Verification Category | SPEC Authority Required? |
|---|---|:---:|:---:|---|:---:|:---:|
| **`MOVE` / Grip Edit** | Geometry translation | Unchanged | None | Permitted. Associated clearance envelopes move if grouped. Invalidates spatial cache. | `SOURCE_VERIFIED` | No |
| **`ROTATE` / Grip Edit** | Geometry rotation | Unchanged | None | Permitted. Clearance rotates with component. Invalidates spatial cache. | `SOURCE_VERIFIED` | No |
| **`SCALE`** | Geometry scaling | Unchanged | Dimension distortion | Mechanical components cannot be scaled arbitrarily. Flag non-uniform/non-unit scale as validation error during QA. | `SOURCE_VERIFIED` | Yes (Policy) |
| **`COPY`** | Deep-clones entity | New Handle | **DUPLICATE ID RISK** | Cloned entity receives duplicate `TTC_OBJECT_ID`. Detect on command boundary / audit; regenerate unique ID. | `HOST_TEST_REQUIRED` | Yes (Repair timing) |
| **`ARRAY`** | Multiple clones | New Handles | **DUPLICATE ID RISK** | Associative arrays create complex blocks; non-associative creates multiple clones. Each requires unique ID regeneration. | `HOST_TEST_REQUIRED` | Yes |
| **`MIRROR`** | Mirrors geometry | New Handle | Non-physical flip / duplicate | Electrical components cannot be mirrored. Flag mirrored entities as warning during QA; regenerate ID on copy. | `SOURCE_VERIFIED` | Yes |
| **`ERASE` / `Delete`** | Entity erased | Marked Erased | Orphan clearance | Primary entity erased. Database reactor or command audit marks associated clearance for cleanup. | `SOURCE_VERIFIED` | Yes |
| **`OOPS` / `UNDO`** | Restores erased entity | Restores Handle | Identity restored | Restores entity and associated dictionaries to pre-erased state cleanly. | `SOURCE_VERIFIED` | No |
| **`REDO`** | Restores state | Restores Handle | State restored | AutoCAD native transaction handles cleanly. | `SOURCE_VERIFIED` | No |
| **`EXPLODE`** | Destroys block | Block destroyed | Metadata lost | Block exploded into raw lines. Metadata in extension dictionary is lost or orphaned. Prohibited on TTC blocks via QA audit. | `HOST_TEST_REQUIRED` | Yes |
| **`WBLOCK`** | Exports to DWG | New DB Handles | Export fidelity | Verifies that extension dictionaries survive WBLOCK export for external modular DWG use. | `HOST_TEST_REQUIRED` | Yes |
| **`INSERT`** | Imports external DWG | Imported Handles | Cross-DWG ID collision | External DWG insertion may bring existing IDs. Detect collisions on insert boundary; prompt or re-assign. | `HOST_TEST_REQUIRED` | Yes |
| **`COPYCLIP` / `PASTECLIP`** | Inter-drawing paste | New Handles | Duplicate ID across DWGs | Clipboard paste clones dictionaries. Requires ID audit and regeneration in target drawing. | `HOST_TEST_REQUIRED` | Yes |
| **`SAVE` / `REOPEN`** | File persistence | Persistent Handles | None | Verified round-trip. Extension dictionaries reload 100% intact. | `SOURCE_VERIFIED` | No |
| **`BLOCK REDEFINE`** | Linework update | BlockDef updated | Instance preserved | Instance metadata in `BlockReference.ExtensionDictionary` survives block definition redefinition. | `HOST_TEST_REQUIRED` | No |

---

## Section G: Clone / Deep-Clone Lifecycle Architecture

### G.1 The Identity Divergence Problem
When native `COPY` executes, AutoCAD generates a distinct database object ($B$) from source object ($A$).
- $Handle(B) \neq Handle(A)$ (AutoCAD native uniqueness preserved).
- $XRecord(B) == XRecord(A) \implies TTC\_OBJECT\_ID(B) == TTC\_OBJECT\_ID(A)$ (**TTC Identity Duplication**).

### G.2 Detection & Resolution Strategy Options
1. **Option 1: Synchronous `Database.ObjectAppended` Reactor:**
   - Intercepts clone immediately during `COPY` and overwrites `TTC_OBJECT_ID`.
   - *Rejected Rationale:* High risk of host crash / transaction re-entrancy during compound commands (`ARRAY`, `WBLOCK`, `COPYCLIP`).
2. **Option 2: Command-Boundary Interceptor (`Editor.CommandEnded`):**
   - Listens for completion of `COPY`, `PASTECLIP`, `ARRAY`. Scans newly appended entities and regenerates IDs.
   - *Trade-off:* Moderate complexity; handles normal interactive commands well.
3. **Option 3: Deferred Audit & Clean-On-Save (Recommended Core Strategy):**
   - Duplicate identities are tolerated in-memory during drafting, but flagged as `DUPLICATE_ID`.
   - A deterministic resolution algorithm executes:
     - On explicit QA check (`TTCPANELCHECK`);
     - Pre-save document hook (`Database.BeginSave`);
     - Automated batch audit.
   - **Resolution Policy:**
     - The entity created first (earlier `Handle` sequence or timestamp) retains original `TTC_OBJECT_ID`.
     - The newer entity is assigned a new `Guid.NewGuid()` with an audit log entry: *"Regenerated duplicate TTC_OBJECT_ID on entity [Handle: XYZ]."*.

---

## Section H: Save / Reopen Persistence Architecture

### H.1 Persistence Invariants
1. **No Data Loss on Close:** All metadata written to `ExtensionDictionary` / `XRecord` must be committed inside a closed `Transaction` before document save.
2. **Handle Invariance:** AutoCAD `Handle` values remain strictly invariant across document save, close, and reopen cycles within the same DWG file.
3. **No Dynamic Assembly Binding:** `XRecord` data contains pure primitives (DXF 1 = string, DXF 40 = double, DXF 70 = int16, DXF 90 = int32). Deserialization does not depend on .NET binary serialization (`BinaryFormatter`), avoiding versioning crashes.

---

## Section I: Undo / Redo & Compound Atomicity Architecture

### I.1 Compound Entity Grouping
In Panel Designer, a physical component comprises a compound object model:
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

### J.1 Architectural Scope Boundary
F1 defines the common CAD contract rules for standard AutoCAD blocks; it does NOT define vendor component catalog data (which belongs to Tranche P1).

### J.2 Block Reference Constraints
1. **Base Point Standard:**
   - All component footprint blocks must have their base insertion point defined at:
     - Standard: **Bottom-Left corner** (X=0, Y=0, Z=0) of the mounting surface.
     - Alternative for symmetrical rail components: **Center-Center** on DIN rail mounting centerline.
2. **Scale Invariance:**
   - Blocks must be drawn 1:1 in true millimeter physical dimensions.
   - Component placement commands must enforce uniform insertion scale:
     $$ScaleX = 1.0, \quad ScaleY = 1.0, \quad ScaleZ = 1.0$$
   - Non-uniform scaling (`ScaleX != ScaleY`) is strictly prohibited and flagged as a model corruption.
3. **Dynamic Block Policy:**
   - Standard electrical components must be **static blocks**.
   - Dynamic block stretching/visibility parameters are disallowed for fixed-dimension vendor footprints to prevent accidental distortion of physical catalog dimensions.
   - Dynamic block parameters may only be used where explicitly authorized (e.g. adjustable-length DIN rails in Tranche P3).
4. **Nesting & Layer Standards:**
   - Geometry inside block definitions should reside on Layer `0` with `ByBlock` or `ByLayer` properties so that color/layer control can be managed host-wide.
   - Nested blocks are allowed up to 1 level for compound assemblies (e.g. breaker + auxiliary contact), provided sub-blocks do not hold conflicting `TTC_OBJECT_ID` records.

---

## Section K: Host Event & Cache Invalidation Strategy

### K.1 Resolution of ISSUE-F1-008
- **Decision:** **Passive Command-Boundary Audit + Ephemeral Spatial Caches.**
- **Rationale:** AutoCAD Managed .NET database reactors (`ObjectModified`, `ObjectErased`) are notorious for triggering recursive transaction exceptions (`eTransactionInProgress`), UI freezing, and host crash conditions during complex native commands (`UNDO`, `EXPLODE`, `PURGE`).

### K.2 Cache Invalidation Rules
1. **Ephemeral Caches:** Spatial index trees (R-Trees for collision detection), clearance graph caches, and panel topology models exist **only in-memory** during active command sessions.
2. **Persistent Source of Truth:** The AutoCAD DWG database (entities, layers, and extension dictionaries) is the sole persistent source of truth.
3. **Invalidation Hooks:**
   - Active document switch: Invalidate in-memory layout cache.
   - Command start: Rebuild or query spatial index from drawing database.
   - External edit detection: Compare database transaction sequence or timestamp before running layout audits.

---

## Section L: Transaction & DocumentLock Execution Matrix

The matrix below provides the authoritative execution rules for all AutoCAD API interactions:

| Execution Context | `DocumentLock` Required? | `Transaction` Required? | Immediate Write Allowed? | Undo Group Boundary | Exception Handling Protocol |
|---|:---:|:---:|:---:|---|---|
| **Modal Command (`[CommandMethod]`)** | NO (Implicitly locked by AutoCAD) | YES | YES | AutoCAD command undo group | Catch all exceptions; log to `FileLogger`; abort transaction; emit user-friendly error to Editor. |
| **Session Command (`CommandFlags.Session`)** | **YES** (`doc.LockDocument()`) | YES | YES | Manual undo transaction group | Acquire lock in `using` block; verify `doc != null`; abort on error. |
| **Modeless Palette (`PaletteSet` UI click)** | **YES** (`doc.LockDocument()`) | YES | YES | Must wrap in managed transaction | Verify `MdiActiveDocument != null`; acquire lock; abort transaction on failure. |
| **Application-Context Callback** | **YES** | YES | Deferred preferred | No active drawing undo group | Wrap in document lock; execute via `doc.SendStringToExecute` or managed dispatch. |
| **Database Reactor Callback** | **PROHIBITED** | **PROHIBITED** | **NO** (Read-only query only) | N/A | Never start transaction or lock inside reactor; set dirty flag only. |
| **Zero-Document State (`doc == null`)** | NO (No document exists) | NO | NO | N/A | Shield execution; display palette status; disable document-mutating controls. |

---

## Section M: Core vs AutoCAD Dependency Boundaries

In strict adherence to the Decoupling Doctrine established in F0:
- **`TTC.CadTools.Core` (Pure C# Standard / .NET 4.8):**
  - **Zero** references to `AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`, or `AdWindows.dll`.
  - Houses pure domain models, geometric algorithms, tolerance math, unit converters, and metadata envelope abstractions.
- **`TTC.CadTools.Acad` (AutoCAD Managed .NET Adapter):**
  - References AutoCAD 2023 assemblies.
  - Implements adapters that translate between AutoCAD database objects and pure Core models.

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

F1 defines robust recovery strategies for common corruption and edge cases:

1. **Duplicate `TTC_OBJECT_ID` Collision:**
   - *Detection:* QA check scans all entities with `TTC_OBJECT_TYPE`. Maps `TTC_OBJECT_ID` $\to$ `List<Handle>`. If count > 1, collision exists.
   - *Recovery:* Keep original on earliest created entity; generate fresh `Guid` for duplicates; record audit log.
2. **Orphan Clearance Envelope:**
   - *Detection:* Clearance polyline references a missing component `TTC_OBJECT_ID`.
   - *Recovery:* QA tool prompts user: *"Orphan clearance boundary found [Handle: XYZ]. Remove boundary?"* User accepts $\to$ erased safely.
3. **Missing or Corrupted `XRecord`:**
   - *Detection:* Entity has `XData` tag but `ExtensionDictionary` is empty or lacks `TTC_METADATA_HEADER`.
   - *Recovery:* Entity is classified as `UNREGISTERED_TTC_ASSET`. Retains visual geometry; flagged in QA tool for re-tagging or footprint re-registration.
4. **Drawing Unit Mismatch:**
   - *Detection:* `INSUNITS` is non-metric or undefined.
   - *Recovery:* Visual banner in PaletteSet displays: *"Drawing units: Unitless / Inches. Check active drawing setup."* Blocks automated insertions until confirmed.

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
