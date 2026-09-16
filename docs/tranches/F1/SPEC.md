# Tranche F1: Common CAD Contracts — Specification

- **Spec ID:** `SPEC-FOUNDATION-F1-001`
- **Title:** Common CAD Contracts
- **Version:** `0.4.0`
- **Status:** `CORRECTED_DRAFT / INDEPENDENT_RE_REVIEW_PENDING`
- **Lifecycle Stage:** `SPEC_CORRECTION`
- **Tranche:** F1 — Common CAD Contracts
- **Dependency:** Tranche F0 — AutoCAD Foundation (`FROZEN v1.0.0`, Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Design Authority:** `DESIGN-FOUNDATION-F1-001` v0.3.0 (`COMPLETE / REVIEWED_PASS / PASS_TO_SPEC`)
- **Latest External Review:** `REV-F1-SPEC-001-R3` — `NEEDS_FIX / RETURN_TO_SPEC_CORRECTION`
- **Target Host Baseline:** AutoCAD 2023 Managed .NET API (C#, .NET Framework 4.8)
- **Production Build Authorization:** `NONE`
- **SPEC Freeze Authority:** `NONE`
- **Work Order:** `NONE`

> [!IMPORTANT]
> **Specification Governance & Non-Approval Notice:**
> 1. Antigravity is the authoring/recording agent. Antigravity MUST NOT self-approve or freeze this specification.
> 2. This document represents a formal CORRECTED DRAFT specification submitted for independent technical re-review (`REV-F1-SPEC-001-R4`).
> 3. Statements marked `PROPOSED_SPEC_CONTRACT` are technical proposals pending independent review and explicit Product Owner freeze. They must NOT be represented as already approved by the Product Owner.
> 4. Work Order creation is strictly **NOT AUTHORIZED**. Production code modification (`production/**`) is strictly **NOT AUTHORIZED**.

---

## 1. Governance & Classification Discipline

Every architectural and technical requirement in this specification is classified under one of five canonical categories:

1. `INHERITED_FROZEN`: Contracts frozen in Tranche F0 or governance that must not be altered (e.g. logging paths, settings persistence, Ribbon/Palette host shell).
2. `INHERITED_ARCHITECTURAL_BASELINE`: Core requirements established in the Architecture Roadmap (e.g. Pure Core decoupling, .NET Framework 4.8 target).
3. `PROPOSED_SPEC_CONTRACT`: Definitive technical rules and invariants proposed in this specification for F1, subject to independent review and Product Owner freeze.
4. `BUILD_VALIDATION_REQUIRED`: Runtime empirical host evidence to be gathered during the future BUILD stage under an approved Work Order.
5. `DEFERRED_TO_DOWNSTREAM`: Capabilities or policies reserved for subsequent tranches (P1..P9, M1..M8, C1, C2).

---

## 2. Explicit F1 UI Boundary

**Classification:** `PROPOSED_SPEC_CONTRACT`

Tranche F1 is strictly a foundational CAD contracts, data abstraction, and host safety tranche. It does NOT introduce end-user feature UI.

### 2.1 Excluded UI Components
Tranche F1 explicitly does NOT introduce:
- Component Library browser or catalog palette (`DEFERRED_TO_DOWNSTREAM / P1`);
- Panel component placement dialogs or interactive placement commands like `TTCPANELPLACE` (`DEFERRED_TO_DOWNSTREAM / P2`);
- New Panel Designer Ribbon tabs, Ribbon panels, or Ribbon buttons (`DEFERRED_TO_DOWNSTREAM / P1, P2`);
- DIN Rail placement or configuration UI (`DEFERRED_TO_DOWNSTREAM / P3`);
- Wiring Duct placement or configuration UI (`DEFERRED_TO_DOWNSTREAM / P4`);
- Component arrangement or alignment UI (`DEFERRED_TO_DOWNSTREAM / P5`);
- Panel QA or clearance inspection UI like `TTCPANELCHECK` (`DEFERRED_TO_DOWNSTREAM / P6`);
- Cabinet depth, sizing, or reserved zone UI (`DEFERRED_TO_DOWNSTREAM / P7, P8, P9`);
- M&E Cable tray routing or fitting UI (`DEFERRED_TO_DOWNSTREAM / M1..M8`).

### 2.2 Authorized Technical Exposures
Tranche F1 may expose only:
- Internal CAD services and domain interfaces consumed programmatically by downstream modules;
- Diagnostic logging to the frozen F0 `FileLogger` (`%APPDATA%\TTC_CadTools\Logs\`);
- Structured validation results and error classifications returned via service APIs;
- Service-level health and unit status queried by the existing frozen F0 palette shell if needed for troubleshooting.

---

## 3. Core Engineering Unit Contract & Host Unit Resolution

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 3.1 Pure Core Canonical Unit
1. **Canonical Engineering Unit:** The canonical linear engineering unit for all pure Core mathematical computations, geometry algorithms, and spatial indexes is **`MILLIMETER`**.
2. **Decoupled Representation:** Pure Core (`TTC.CadTools.Core`) represents all spatial coordinates, bounding envelopes, and clearance offsets in millimeters, completely isolated from AutoCAD database settings.
3. **No Blanket Drawing Assumption:** The Core millimeter standard does NOT imply that all AutoCAD drawings must physically operate in millimeters. AutoCAD drawings may use different units; conversion is performed strictly at the host adapter boundary.

### 3.2 Host Drawing Unit Resolution Precedence
The host adapter (`TTC.CadTools.AutoCAD.Units.IDrawingUnitService`) determines the active drawing unit according to three deterministic states:

```
+-------------------------------------------------------------------------+
|                  AutoCAD Drawing Unit Resolution Engine                 |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
| Project Config Exists |                       | No Project Config     |
+-----------------------+                       +-----------------------+
            |                                               |
   +--------+--------+                             +--------+--------+
   |                 |                             |                 |
   v                 v                             v                 v
INSUNITS Matches  INSUNITS Differs             INSUNITS != 0     INSUNITS == 0
   |                 |                             |                 |
   v                 v                             v                 v
[ RESOLVED ]  [ UNIT_CONFIGURATION_CONFLICT ] [ RESOLVED ]     [ UNRESOLVED ]
```

1. **State: `RESOLVED`**
   - Condition A: Explicit project/workspace configuration exists, and drawing `INSUNITS` either matches or `INSUNITS = 0`.
   - Condition B: No project configuration exists, but drawing `INSUNITS` is an explicit non-zero supported engineering unit (e.g. `4` for Millimeters, `1` for Inches, `6` for Meters).
   - Behavior: The drawing unit is unambiguously resolved. The conversion factor to Core canonical millimeters is calculated deterministically using the explicit dimensional property `MillimetersPerDrawingUnit`:
     ```text
     coreMillimeters = drawingCoordinate * MillimetersPerDrawingUnit
     drawingCoordinate = coreMillimeters / MillimetersPerDrawingUnit
     ```
2. **State: `UNRESOLVED`**
   - Condition: Drawing `INSUNITS = 0` (Unitless / Unspecified), and no explicit project configuration or user unit declaration has been supplied.
   - Behavior: Host adapter returns `PhysicalUnitResolution.Unresolved`. Any TTC operation requiring physical-unit interpretation (e.g. component placement, clearance envelope calculation, dimension validation) MUST FAIL deterministically with failure status `UNIT_UNRESOLVED`.
   - Invariant: `INSUNITS = 0` MUST NEVER silently default to millimeters.
3. **State: `UNIT_CONFIGURATION_CONFLICT`**
   - Condition: Explicit project configuration defines drawing units as Unit $U_A$ (e.g. Millimeters), but the active DWG header has non-zero `INSUNITS` specifying Unit $U_B$ (e.g. Inches).
   - Behavior: Host adapter returns `PhysicalUnitResolution.ConfigurationConflict`. Any TTC command requiring unit interpretation MUST BLOCK execution deterministically with failure status `UNIT_CONFIGURATION_CONFLICT`.
   - Invariant: The system MUST NOT silently pick either unit, MUST NOT silently mutate `INSUNITS`, and MUST NOT automatically rescale existing drawing geometry. Resolution requires explicit administrative or user confirmation.

### 3.3 Authoritative Physical Unit Conversion Constants
Unit conversions between host drawing coordinates and Core canonical millimeters MUST use explicitly defined authoritative physical conversion constants evaluated in IEEE 754 64-bit double precision:

| Supported Engineering Unit | DXF INSUNITS Value | Authoritative Constant (`MillimetersPerDrawingUnit`) | Inverse (`DrawingUnitsPerMillimeter`) |
|---|:---:|---|---|
| **Millimeter** | `4` | `1.0` | `1.0` |
| **Centimeter** | `5` | `10.0` | `0.1` |
| **Meter** | `6` | `1000.0` | `0.001` |
| **Inch** | `1` | `25.4` | `1.0 / 25.4` |
| **Foot** | `2` | `304.8` | `1.0 / 304.8` |

- **Deterministic Precision & Evaluation Policy (Addressing R3-F02):**
  - Conversions must execute in IEEE 754 double precision using the authoritative physical conversion constants above.
  - The linear coincidence tolerance $\varepsilon = 10^{-4}\text{ mm}$ is strictly a geometric coincidence threshold and MUST NOT be used as a floating-point computation budget or conversion accuracy limit.
  - No new physical tolerance number is invented. Numerical comparison in software tests is governed by an explicit `TEST_IMPLEMENTATION_DETAIL` (bounded relative/ULP double comparison in the test harness), NOT a domain `ENGINEERING_TOLERANCE`.
- **Deterministic Coordinate Test Domain:**
  Numerical conversion and round-trip fidelity ($x \to x_{mm} \to x$) must be verified against exact mathematical reference values over a declared bounded test suite of coordinates:
  1. `0.0` (origin);
  2. `1.0` (positive unit);
  3. `-1.0` (negative unit);
  4. `0.001` (small coordinate / 1 micron);
  5. `1250.75` (typical panel engineering coordinate);
  6. `500000.0` (large supported engineering coordinate / 500 m).
  Round-trip identity across this suite must return to the original input value within bounded double precision (`TEST-F1-28`).

### 3.4 AutoCAD System Variable Discipline
- **`MEASUREMENT` Variable:** Controls default hatch pattern and linetype library files (`acad.pat` vs `acadiso.pat`). It MUST NOT be used to infer model geometry linear units.
- **`LUNITS` Variable:** Controls linear coordinate display formatting (e.g. Scientific, Decimal, Engineering, Architectural, Fractional). It MUST NOT be used to infer model geometry linear units.
- **`INSUNITSDEFSOURCE` / `INSUNITSDEFTARGET` Variables:** Provide fallback insertion scaling defaults for external blocks/xrefs when `INSUNITS` is 0. They MUST NOT be treated as authoritative proof of active model space geometry units.

### 3.5 Downstream Policy Extension
Downstream feature tranches may further constrain allowed `RESOLVED` units:
- Tranche P2 (`TTCPANELPLACE`) may require that resolved units evaluate strictly to `MILLIMETER` (`INSUNITS = 4`);
- Tranche M1..M8 (Cable Tray) may allow configurable project units (e.g. Millimeters or Meters).
F1 provides the universal unit evaluation engine without hard-coding downstream-specific restrictions.

---

## 4. Geometric Tolerance Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 4.1 Pure Core Typed Tolerance Record
1. **Zero Autodesk Coupling:** Geometric tolerances are defined exclusively in pure Core (`TTC.CadTools.Core.Geometry.GeometricTolerance`) with zero references to Autodesk assemblies.
2. **Typed Categories:** Tolerances are encapsulated in a strongly typed immutable record rather than passed as loose double literals. Categories include:
   - `LinearCoincidence`: Maximum distance between two points to be considered coincident.
   - `AngularAlignment`: Maximum angular deviation (in radians) between two vectors to be considered parallel or collinear.
   - `ZeroLength`: Minimum length threshold below which a curve or line segment is rejected as degenerate.
   - `ScaleComparison`: Maximum allowable delta between insertion scale factors.

### 4.2 Authorized Numerical Values for F1 v1
- **Linear Coincidence ($\varepsilon$):** `1e-4 mm` ($0.0001\text{ mm} = 0.1\,\mu\text{m}$). This is the sole authorized numerical tolerance candidate from the Architecture Roadmap (§42) and is proposed for formal specification freeze.
- **All Other Tolerance Categories:** Marked **`NO GLOBAL VALUE IN F1 v1`**.
  - `AngularAlignment`: No global value in F1 v1. Consuming tranches or downstream specs must explicitly provide the angular tolerance threshold.
  - `ZeroLength`: No global value in F1 v1. Supplied by caller or downstream spec.
  - `ScaleComparison`: No global value in F1 v1. Supplied by caller or downstream spec.

### 4.3 Floating-Point Comparison Invariant
Direct equality comparisons (`==` or `!=`) on floating-point coordinates, distances, or areas are strictly prohibited across all geometry calculation routines. All geometric evaluations must evaluate against the typed tolerance contract.

---

## 5. `TTC_OBJECT_ID` Instance Identity Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 5.1 Identity Scope & Global Purpose
`TTC_OBJECT_ID` uniquely identifies **exactly one independent TTC-managed AutoCAD drawing object instance across all drawing databases and sessions**.

It is strictly decoupled from:
- **Catalog Part Numbers / Library IDs (`TTC_LIBRARY_ID`):** Identifies a component type or vendor catalog footprint; shared by thousands of placed instances across drawings.
- **EPLAN Device Tags (`+CAB1-Q1`):** Functional electrical schematic designations owned exclusively by the external EPLAN 2022 toolchain.
- **Electrical BOM Line Items:** Manufacturing procurement identifiers.
- **AutoCAD Database Handle:** Database-internal object identifier; unique only within one DWG file, not cross-DWG safe, and reassigned during native copying.
- **AutoCAD ObjectId:** Transient memory pointer that changes across drawing open/close sessions.

### 5.2 Representation & Format
- **Format Standard:** RFC 4122 Version 4 UUID (Randomly generated 128-bit integer).
- **Encoding:** Canonical 36-character string in 8-4-4-4-12 format with hyphens (`Guid.ToString("D")`).
- **Casing:** Strictly **lower-case invariant** (`[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`).
- **No Role/Type Slug Prefix:** The identifier MUST NOT contain a type prefix (e.g. `MCB-...` or `TTC-...`). Object classification is stored independently in `TTC_OBJECT_TYPE`. This prevents identity mutation if an entity is reclassified.

### 5.3 Global Uniqueness Invariant
1. **Cross-Drawing Invariant:** Within every valid TTC CAD project environment, no two independent drawing object instances may possess the same valid `TTC_OBJECT_ID`, regardless of whether they reside in the same drawing database or across different DWG files.
2. **Cross-Database Clone Rule:** When a drawing entity is exported, imported, or transferred across databases (e.g. via `WBLOCK`, `INSERT`, `COPYCLIP`, `PASTECLIP`), the resulting independent instance in the target database **MUST be assigned a fresh, distinct RFC 4122 UUIDv4**. Independent drawing objects in different DWGs MUST NEVER silently share an identity.
3. **Statistical Uniqueness:** UUIDv4 provides practical global uniqueness ($2^{122}$ possible values), ensuring negligible collision probability ($< 10^{-15}$) without requiring a centralized online database coordinator.

---

## 6. TTC Object Ownership Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

An AutoCAD entity is classified as a valid **TTC-managed object** if and only if it satisfies all of the following conditions:

1. **Authoritative Extension Dictionary:** The entity possesses an `ExtensionDictionary` containing an `XRecord` with entry name `TTC_METADATA_HEADER`.
2. **Valid Required Metadata Keys:** The `TTC_METADATA_HEADER` record contains valid, non-empty values for:
   - `TTC_OBJECT_ID`: Valid RFC 4122 UUIDv4 string.
   - `TTC_OBJECT_TYPE`: Valid non-empty semantic classification string (e.g. `PANEL_COMPONENT`, `DIN_RAIL`, `WIRING_DUCT`, `CABLE_TRAY`).
   - `TTC_SCHEMA_VERSION`: Valid SemVer string matching supported major version (`1.x.x`).
3. **Optional Library Metadata:** `TTC_LIBRARY_ID` and `TTC_LIBRARY_VERSION` are optional at the F1 Common Contract level. Not every TTC entity originates from a vendor library.

### 6.1 Non-Ownership Negative Invariants
The following conditions MUST NOT be used to infer TTC ownership:
- Entity layer name (e.g. layer `TTC_COMPONENTS` alone does not make an entity TTC-managed);
- Block definition name (e.g. a block named `SCHNEIDER_NSX100` is unmanaged unless it possesses the authoritative metadata header);
- Presence of AutoCAD `Handle` or `ObjectId`;
- Human-visible block attributes alone.

---

## 7. Canonical Metadata Storage & Logical Schema Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 7.1 Authoritative Store vs Derivative Cache Matrix

| Storage Layer | AutoCAD Mechanism | Authoritative Role | Content | Capacity Limit |
|---|---|---|---|---|
| **Authoritative Store** | `DBObject.ExtensionDictionary` $\to$ `XRecord` (`TTC_METADATA_HEADER`) | **PRIMARY TRUTH** (Wins all conflicts) | Full keyed metadata (`TTC_OBJECT_ID`, `TTC_OBJECT_TYPE`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, etc.) | Unconstrained by ~16 KB XData limit; bounded only by AutoCAD database object storage architecture. Payload kept compact (< 1 KB). |
| **Derivative Index** | Registered `XData` (RegApp: `"TTC_CAD"`) | **SECONDARY FAST QUERY** (Discardable index) | `TTC_OBJECT_TYPE`, `TTC_OBJECT_ID` only | Shared total ~16 KB per entity across all applications. TTC index payload strictly < 100 bytes. |

### 7.2 Mismatch & Synchronization Rules
1. **XRecord Wins:** In any discrepancy between `XRecord` and `XData`, the `XRecord` content is authoritative.
2. **Stale/Missing XData & Authoritative Rediscovery:** If a valid `TTC_METADATA_HEADER` exists but `XData` is missing, corrupted, or contains mismatched values:
   - Status is marked `XDATA_INDEX_OUT_OF_SYNC`;
   - Entity is treated as valid TTC-managed object based on `XRecord`;
   - Because fast selection filters cannot locate entities lacking XData, discovery relies on the Authoritative Fallback Discovery Service (`ITtcMetadataAuditService`, §8.4);
   - `XData` index is resynchronized or rebuilt at the next authorized safe write boundary.
3. **Orphan XData (Missing XRecord):** If entity has `TTC_CAD` registered `XData` but lacks the authoritative `TTC_METADATA_HEADER` `XRecord`:
   - System MUST NOT silently recreate authoritative metadata from `XData`;
   - Entity is classified as **`METADATA_INCOMPLETE`**;
   - Geometry is 100% preserved;
   - Destructive automated mutations are blocked;
   - Entity is reported to audit logging.

### 7.3 Logical Schema Definition (`TTC_METADATA_HEADER` v1.0.0)
The `TTC_METADATA_HEADER` is encoded as a keyed/tagged `ResultBuffer` containing sequential pairs of standard DXF entries below group code 1000:
- Key entry: Standard text group code `1` (`DxfCode.Text`, integer 1) representing the metadata key name.
- Value entry: Standard text group code `1` (`DxfCode.Text`, integer 1) representing the metadata string value.
- **Group Code Restriction:** Group codes 1000–1071 (`DxfCode.ExtendedData*`) are strictly reserved for XData and MUST NOT be used in XRecord `ResultBuffer` encoding.

```
+-------------------------------------------------------------------------+
|                  TTC_METADATA_HEADER ResultBuffer Layout                |
+-------------------------------------------------------------------------+
| [1, "TTC_SCHEMA_VERSION"] -> [1, "1.0.0"]                               |
| [1, "TTC_OBJECT_ID"]      -> [1, "c7a3b4e2-9d8f-4e1a-..."]             |
| [1, "TTC_OBJECT_TYPE"]    -> [1, "PANEL_COMPONENT"]                     |
| [1, "TTC_LIBRARY_ID"]     -> [1, "LIB-ABB-XT2N-160"] (Optional)         |
| [1, "TTC_LIBRARY_VERSION"]-> [1, "1.2.0"]            (Optional)         |
| [1, "FUTURE_EXT_KEY"]     -> [1, "CUSTOM_VALUE"]     (Preserved)        |
+-------------------------------------------------------------------------+
```

### 7.4 Schema Key Invariants
- **Order Independence:** Readers must locate fields by key matching, never by array index position.
- **Duplicate Key Rejection:** A record containing duplicate instances of any required key is invalid and rejected with status `INVALID_METADATA`.
- **Unknown Field Preservation:** During read-modify-write cycles, any key not recognized by the active version of TTC CAD must be preserved verbatim in the record without being stripped.
- **Serialization Standard:** No `BinaryFormatter`, no custom binary serialization, and no ObjectARX custom classes. All data uses native AutoCAD `TypedValue` structures with standard DXF group code `1`, ensuring 100% vanilla DWG compatibility.

---

## 8. XData Index Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 8.1 Registered Application Contract
- **RegApp Name:** Strictly `"TTC_CAD"`.
- **Auto-Registration:** If the `RegAppTable` lacks entry `"TTC_CAD"`, the host adapter registers it atomically within the active write transaction prior to attaching XData.

### 8.2 XData Payload Structure
The XData payload attached under `"TTC_CAD"` consists strictly of extended-data codes (1000+):
1. `DxfCode.ExtendedDataRegAppName` (1001): `"TTC_CAD"`
2. `DxfCode.ExtendedDataAsciiString` (1000): `TTC_OBJECT_TYPE` (e.g. `"PANEL_COMPONENT"`)
3. `DxfCode.ExtendedDataAsciiString` (1000): `TTC_OBJECT_ID` (UUID string)

Total payload size is under 100 bytes, far below the shared AutoCAD limit of ~16 KB per entity across all applications.

### 8.3 Fast Selection Query Invariant
Downstream services may perform fast whole-drawing discovery using `Editor.SelectAll()` with a `SelectionFilter` targeting `"TTC_CAD"` XData. However, candidate entities retrieved via selection filter MUST be validated against their authoritative `ExtensionDictionary / XRecord` before performing any business logic.

### 8.4 Authoritative Fallback Discovery & Index Rebuild Service
**Classification:** `PROPOSED_SPEC_CONTRACT`

Because the secondary fast query mechanism (`Editor.SelectAll()` with `SelectionFilter` targeting `"TTC_CAD"` XData) cannot discover entities whose XData has been stripped, corrupted, or not yet created, Tranche F1 defines a generic bounded authoritative audit and index rebuild service interface: `ITtcMetadataAuditService` (contract in `TTC.CadTools.AutoCAD.Audit.ITtcMetadataAuditService`).

#### Service Contract & Responsibilities:
1. **Authoritative Enumeration:** When invoked at an authorized execution boundary, the service enumerates relevant database entities, opens their `ExtensionDictionary`, and inspects for `TTC_METADATA_HEADER`, discovering all valid TTC-managed objects even when `"TTC_CAD"` XData is entirely absent.
2. **Deterministic State Classification:**
   - Valid `XRecord` + Missing/Outdated `XData` $\to$ classified as `XDATA_INDEX_OUT_OF_SYNC`;
   - Orphan `"TTC_CAD"` `XData` + Missing `XRecord` $\to$ classified as `METADATA_INCOMPLETE` without destructive repair.
3. **Safe Index Rebuilding:** At an authorized write boundary (requiring explicit `DocumentLock` and managed `Transaction`), the service resynchronizes the derivative `"TTC_CAD"` XData payload from authoritative XRecord values.
4. **Subsequent Fast Query Restoration:** Once resynchronized, the entity is immediately discoverable by fast `Editor.SelectAll()` selection filters.

#### Performance & Safety Invariants:
- **Prohibited Scans:** Authoritative database scans MUST NOT run during `PointMonitor`, cursor movement, high-frequency reactor callbacks, or continuous background polling.
- **Authorized Execution Boundaries:** Authoritative scans and rebuilds are permitted strictly at:
  - Explicit QA audit or repair commands (e.g. `TTC_AUDIT_METADATA`);
  - Controlled document open / index initialization when explicitly configured;
  - Post-import or batch-reconciliation command boundaries under an explicit `DocumentLock`.

---

## 9. Schema Versioning & Forward Compatibility

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 9.1 Semantic Versioning Schema
`TTC_SCHEMA_VERSION` follows Semantic Versioning (`MAJOR.MINOR.PATCH`). Active baseline specification version is **`1.0.0`**.

### 9.2 Normative Schema Compatibility Matrix (Addressing R3-F03)

The following compatibility matrix defines the normative behavior of the `1.0.x` plugin runtime across drawing metadata schema variants:

| Plugin Runtime Version | DWG Metadata Schema | Required Behavior | Mutation & Version Rules |
|---|---|---|---|
| **`1.0.x`** | **`1.0.x`** | Normal Supported Read / Write | All known fields parsed; mutations encoded per v1.0.0 schema standard. |
| **`1.0.x`** | **Future `1.N.x` (`N > 0`)** | Forward-Compatible Read; Constrained Write | Read known fields; preserve unrecognized fields verbatim across read-modify-write cycles; write operations are permitted ONLY when unknown fields can be guaranteed preserved without data loss; schema version string is NOT downgraded. |
| **`1.0.x`** | **Future Major `2.x.x`** | `UNSUPPORTED_SCHEMA` (Read-Only Protection) | Geometry displayed normally; automated TTC entity mutations BLOCKED; structured diagnostic warning logged; zero silent mutation; drawing remains fully operable in AutoCAD. |
| **`1.0.x`** | **Malformed / Corrupted** | `INVALID_METADATA` | Entity geometry 100% preserved; mutation BLOCKED; structured error logged; zero AutoCAD crash. |

### 9.3 Compatibility Rules & Invariants
1. **Active Baseline Scope:** The current baseline schema is `1.0.0`. There are no historical prior minor schemas; consequently, no prior minor defaults or automatic schema migration routines are specified in F1 v1.
2. **Future Minor Read-Modify-Write Safety:** When the `1.0.x` plugin operates on an entity authored by a future minor release (`1.N.x`):
   - All unrecognized tagged DXF group code 1 pairs in the `TTC_METADATA_HEADER` XRecord are read into an uninterpreted collection;
   - If a subsequent write operation occurs on that entity, the serializer MUST write back all unrecognized key/value pairs verbatim;
   - The plugin runtime MUST NOT rewrite the `TTC_SCHEMA_VERSION` downward to `"1.0.0"`; the original future schema version string MUST be preserved;
   - If a write cannot guarantee lossless preservation of unknown fields, the write is aborted with status `OPERATION_ABORTED_PRESERVATION_RISK`.
3. **Major Version Boundary:** Any future major revision (`2.0.0`+) introduces incompatible structural changes. The runtime strictly treats such entities as read-only to avoid corrupting future structures.
4. **Zero Geometry Destruction:** In neither `UNSUPPORTED_SCHEMA` nor `INVALID_METADATA` states does the plugin delete, alter, or hide the entity's underlying AutoCAD geometry.

---

## 10. Native Edit Lifecycle Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

The specification formalizes the behavioral invariant for all standard AutoCAD native commands operating on TTC-managed entities across 18 lifecycle operations, clearly distinguishing host cloning mechanisms from TTC identity requirements:

| Command | Host Cloning Mode | Handle Behavior | TTC_OBJECT_ID Requirement | Authority & Classification |
|---|---|---|---|---|
| `MOVE` | Transform in-place (no clone) | Unchanged | **Preserve existing ID** | `PROPOSED_SPEC_CONTRACT` |
| `ROTATE` | Transform in-place (no clone) | Unchanged | **Preserve existing ID** | `PROPOSED_SPEC_CONTRACT` |
| `SCALE` | Transform in-place (no clone) | Unchanged | **Preserve existing ID** (Scale validated per block contract) | `PROPOSED_SPEC_CONTRACT` |
| `COPY` | `deepClone` | New Handle assigned | **Source retains ID; Clone assigned NEW UUIDv4** | `PROPOSED_SPEC_CONTRACT` |
| `ARRAY` | `deepClone` (N times) | N new Handles assigned | **Each resulting instance assigned distinct NEW UUIDv4** | `PROPOSED_SPEC_CONTRACT` |
| `MIRROR` (Source preserved) | `deepClone` | New Handle assigned | **Source retains ID; Mirrored clone assigned NEW UUIDv4** | `PROPOSED_SPEC_CONTRACT` |
| `MIRROR` (Source erased) | Transform in-place (no `deepClone`, original transformed) | Unchanged | **Preserve existing ID on mirrored original** | `PROPOSED_SPEC_CONTRACT` |
| `ERASE` | Marked `IsErased=true` (no clone) | Retained until purge | **Logical entity retired from active spatial index** | `PROPOSED_SPEC_CONTRACT` |
| `OOPS` | Un-erased (no clone) | Restored | **Preserve original ID; re-index in spatial cache** | `PROPOSED_SPEC_CONTRACT` |
| `UNDO` | Host rollback (no clone) | Rolled back | **Restores exact previous identity and metadata state** | `PROPOSED_SPEC_CONTRACT` |
| `REDO` | Host rollforward (no clone) | Rolled forward | **Restores exact redone identity and metadata state** | `PROPOSED_SPEC_CONTRACT` |
| `SAVE` | Serialization to DWG (no clone) | Unchanged | **Preserve existing ID and XRecords verbatim** | `PROPOSED_SPEC_CONTRACT` |
| `REOPEN` | Deserialization from DWG (no clone) | Invariant Handles | **Preserve existing ID and XRecords verbatim** | `PROPOSED_SPEC_CONTRACT` |
| `EXPLODE` | Primitives created from definition linework (no clone) | New Handles on primitives | **Original ID NOT propagated to raw geometry primitives** | `PROPOSED_SPEC_CONTRACT` |
| `WBLOCK` | `wblockClone` to target database | New Handles in target DB | **Clones exported to target DWG assigned distinct NEW UUIDv4** | `PROPOSED_SPEC_CONTRACT` |
| `INSERT` (drawing/block) | `deepClone` from source into target DB | New Handles in target DB | **Imported instances assigned distinct NEW UUIDv4 upon insertion** | `PROPOSED_SPEC_CONTRACT` |
| `COPYCLIP` | `wblockClone` to temporary clipboard database | New Handles in clipboard DB | **Clipboard payload encapsulates objects; source retains ID** | `PROPOSED_SPEC_CONTRACT` |
| `PASTECLIP` | `wblockClone` from temporary clipboard database | New Handles in target DB | **Pasted instances assigned distinct NEW UUIDv4 in target DB** | `PROPOSED_SPEC_CONTRACT` |
| `BLOCK REDEFINE` | Definition linework updated (no clone) | Unchanged on Refs | **BlockReference instances preserve their TTC_OBJECT_ID** | `PROPOSED_SPEC_CONTRACT` |

### 10.1 Undo / Redo Identity Invariant & Command Categories (Addressing R3-F01, R3-F04)
**Classification:** `PROPOSED_SPEC_CONTRACT`

The native command lifecycle is divided into two distinct command categories with respect to the Undo stack and database boundary:

#### 10.1.1 Category A: Active Database Clone and Mutation Commands
Category A encompasses native AutoCAD commands that create, duplicate, or mutate entities within the active drawing database:
`COPY`, `ARRAY`, `MIRROR` (source preserved), `PASTECLIP`, `INSERT`, `ERASE`, `OOPS`.

1. **Behavioral Invariant:** After any native Category A operation followed by any sequence of native `UNDO` and `REDO` commands, the active drawing database MUST NOT contain independently active TTC-managed instances sharing one valid `TTC_OBJECT_ID`.
2. **Undone Clone Invariant:** If a clone operation is undone:
   - The clone entity's logical TTC identity must disappear from the active drawing with the undone entity;
   - No orphan index or cache entry for the clone may survive in ephemeral caches;
   - The source entity must retain its valid original `TTC_OBJECT_ID`.
3. **Redone Clone Invariant:** If a subsequent `REDO` restores the clone:
   - Resulting source and clone entities must again possess valid, mutually independent `TTC_OBJECT_ID` instances;
   - Ephemeral caches must reconstruct consistent index entries.

#### 10.1.2 Category B: Cross-Database Export Commands (`WBLOCK`)
`WBLOCK` extracts entities from the active drawing and writes them to an independent target DWG database:
1. **Source Document Integrity:** The source drawing entities retain their original `TTC_OBJECT_ID` and remain unaffected (`AC-F1-10`).
2. **Target Document Independence:** Cloned entities in the target DWG receive independent distinct identities upon insertion or opening (`AC-F1-12`, `TEST-F1-12`).
3. **Undo Stack Scope:** The target DWG does NOT participate in the source document's active Undo stack; executing `UNDO` in the source document rolls back only source modifications and does not alter the already-exported external DWG file.

#### 10.1.3 Host Integration & Candidate Reconciliation Mechanisms
The exact integration of TTC post-command metadata reconciliation with AutoCAD's native Undo stack is classified as:
`BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED`.

- `Document.CommandEnded` identifies a safe reconciliation opportunity.
- The implementation MAY adopt either:
  - **Mechanism A (Direct):** Reconcile persistently immediately within the command boundary handler under `DocumentLock` and managed `Transaction`; or
  - **Mechanism B (Deferred):** Schedule/defer persistent reconciliation to another controlled execution context (e.g. idle callback or command boundary pipeline),
  provided that BUILD host validation proves host stability and the Category A UNDO/REDO identity invariants.
- Neither mechanism is assumed universally safe or universally forbidden prior to host testing.
- The frozen requirement is the resulting behavioral invariant, NOT an unverified assumption about internal AutoCAD Undo grouping. Host tests in BUILD (`TEST-F1-21`) validate the complete `clone` $\to$ `reconcile` $\to$ `UNDO` $\to$ `REDO` sequence across all Category A commands (`COPY`, `ARRAY`, `MIRROR`, `PASTECLIP`, `INSERT`, `ERASE`/`OOPS`).

---

## 11. Clone Lineage & Provenance Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

To eliminate identity collisions caused by native AutoCAD `deepClone` or `wblockClone` duplicating extension dictionaries, the specification establishes a rigorous two-state lineage resolution contract:

### 11.1 State A: `PROVENANCE_KNOWN`
When a cloning operation is tracked deterministically (e.g. through TTC custom placement commands, audited command boundaries, or known clone mappings across drawings):
1. **Source Entity:** Retains its existing `TTC_OBJECT_ID` unchanged.
2. **Clone Entity (Same or Cross-DWG):** Assigned a newly generated RFC 4122 UUIDv4.
3. **Metadata Synchronization:** Authoritative `XRecord` and derivative `XData` on the clone are updated atomically within the write transaction.
4. **Audit Trail:** Operation logged to `FileLogger` with source Handle, clone Handle, and new `TTC_OBJECT_ID`.

### 11.2 State B: `PROVENANCE_UNKNOWN`
When duplicate `TTC_OBJECT_ID` values are discovered in a database without deterministic source-vs-clone lineage (e.g. following external native edits, third-party script executions, or multi-step paste operations):
1. **Classification:** Marked deterministically as `COLLISION_UNRESOLVED`.
2. **Strict Non-Destructive Invariants:**
   - The system MUST NOT arbitrarily choose a "survivor" or "original";
   - The system MUST NOT use Handle numerical magnitude ("older Handle = original") because Handle ordering is not guaranteed across drawing sessions or imported blocks;
   - The system MUST NOT use timestamps or metadata creation dates to guess the original;
   - The system MUST NOT silently overwrite either entity's `TTC_OBJECT_ID`.
3. **Recovery & Reconciliation:**
   - Both entities are flagged in the generic `IEntityIdentityAuditService`;
   - Visual geometry of both entities is fully preserved;
   - Automated layout/QA operations involving the collided entities are blocked;
   - Controlled reconciliation requires explicit administrative confirmation or interactive user selection.

---

## 12. Reactor & Cache Invalidation Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 12.1 Observation-Only Reactor Policy (`PROJECT_POLICY`)
AutoCAD database reactor callbacks (`ObjectModified`, `ObjectErased`, `ObjectAppended`) operate in an extremely sensitive execution context. To guarantee rock-solid host stability:
1. **Zero Database Writes:** Reactor callbacks MUST NOT start, commit, or abort database `Transaction` instances.
2. **No Notifying Object Mutation:** Reactor callbacks MUST NOT modify properties or metadata of the notifying entity.
3. **No Interactive Workflows:** Reactor callbacks MUST NOT launch modal dialogs, message boxes, or user prompts.
4. **No Command Injection:** Reactor callbacks MUST NOT issue `SendStringToExecute`.

### 12.2 Managed Document Command Lifecycle Events
Command boundary notifications are handled exclusively via the Managed .NET API on `Autodesk.AutoCAD.ApplicationServices.Document`:
- `Document.CommandEnded`
- `Document.CommandCancelled`
- `Document.CommandFailed`

#### Registration & Lifecycle Discipline
1. **Subscription & Startup Enumeration:**
   - Upon plugin initialization (`IExtensionApplication.Initialize()`):
     a. The subscription service MUST enumerate all documents currently open in `Application.DocumentManager`;
     b. For each existing document, attach document lifecycle handlers (`Document.CommandEnded`, `Document.CommandCancelled`, `Document.CommandFailed`) exactly once;
     c. Subscribe to `DocumentCollection.DocumentCreated` to register subsequent newly opened or created documents;
     d. Ensure idempotent registration to prevent duplicate handler attachment upon re-initialization.
   - Upon document closure:
     a. Handlers safely unsubscribe via `Document.BeginDocumentClose` or document destruction;
     b. Ephemeral caches and tracking states for the closing document are purged.
2. **Unsubscription:** Handlers safely unsubscribe upon document close via `Document.BeginDocumentClose` or document destruction.
3. **Behavior on `CommandEnded` (Addressing R3-F01):**
   - If the in-memory flag `IsDirty` is `true`, ephemeral caches (spatial indexes, graph models) are invalidated.
   - `Document.CommandEnded` identifies a safe reconciliation opportunity.
   - Persistent reconciliation from or immediately following `CommandEnded` may execute under Mechanism A (direct `DocumentLock` + `Transaction`) or Mechanism B (scheduled/deferred execution context), provided host validation proves host stability and Category A UNDO/REDO invariants (`BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED`).
   - Database reactors (`ObjectModified`, `ObjectErased`, `ObjectAppended`) remain strictly observation-only (zero database writes).
4. **Behavior on `CommandCancelled` or `CommandFailed`:**
   - Transient dirty tracking is discarded or reset;
   - Ephemeral caches are invalidated to mirror host transaction rollback;
   - No persistent database reconciliation is executed.

### 12.3 Pre-Save Mutation Safety
Automatic metadata rewriting inside `Database.BeginSave` is classified as `BUILD_VALIDATION_REQUIRED` / `HOST_TEST_REQUIRED`. The core F1 specification behavioral contract does NOT depend on `BeginSave` writes for identity consistency.

### 12.4 Multi-Document State Isolation Invariant
**Classification:** `PROPOSED_SPEC_CONTRACT`

To ensure multi-document AutoCAD sessions operate reliably without cross-drawing state pollution:
1. **Per-Document / Per-Database Scoping:** All tracking flags (`IsDirty`), affected `ObjectId` change sets, identity lookup maps, spatial indexes, audit registries, and event subscriptions MUST be scoped strictly per `Document` / `Database` instance.
2. **No Application-Global State Sharing:** TTC CAD services MUST NOT use static application-global collections to store drawing-specific cache data or dirty states across unrelated DWGs.
3. **Active Document Switching:** Switching active documents via `DocumentCollection.DocumentActivated` switches the active service context to the corresponding per-document cache without invalidating unaffected background document caches.

---

## 13. Transaction & DocumentLock Execution Matrix

**Classification:** `PROPOSED_SPEC_CONTRACT`

All database mutations must adhere to the context-driven execution matrix:

| Execution Context | Explicit DocumentLock Required? | Transaction Required? | Permitted Actions |
|---|:---:|:---:|---|
| **Modal AutoCAD Command** (`CommandFlags.Modal`) | NO (AutoCAD locks implicitly) | **YES** (`using (var tr = ...)`) | Read/write active database |
| **Session AutoCAD Command** (`CommandFlags.Session`) | **YES** (`using (doc.LockDocument())`) | **YES** | Read/write active database |
| **Modeless UI / PaletteSet** | **YES** (`using (doc.LockDocument())`) | **YES** | Read/write active database |
| **Cross-Document Mutation** | **YES** (Lock target document) | **YES** (Target DB transaction) | Read/write target database |
| **Application-Context Callback** | **YES** (Prior to active document write) | **YES** | Read/write active database |
| **Command-Boundary Reconciliation** | **YES** (`using (doc.LockDocument())`) | **YES** | Read/write active database if reconciliation authorized (Candidate Mechanism A or B; `BUILD_VALIDATION_REQUIRED`) |
| **Reactor Callback** | **PROHIBITED** (Zero writes) | **PROHIBITED** | In-memory flag setting only |
| **Zero-Document State** | **N/A** (No active document) | **PROHIBITED** | Read settings/logs; no DB writes |

### 13.1 Transaction Atomicity & Failure Invariant
All multi-entity operations (e.g. creating a component and attaching clearance geometry) must execute within a single atomic `Transaction`. If any step fails or is cancelled by the user, the entire transaction must abort (`tr.Abort()`), leaving zero partial entities or orphaned dictionary entries in the database.

---

## 14. Common CAD Block Contract (12 Domains)

**Classification:** `PROPOSED_SPEC_CONTRACT`

F1 defines generic common CAD block contracts across all engineering features, without defining feature-specific catalog schemas or encroaching on downstream responsibilities:

1. **Mounting Reference Base Point:** Block definition origin $(0, 0, 0)$ represents the primary mechanical mounting reference point.
2. **Declared Asset Units:**
   - Block definitions must declare their internal engineering unit via metadata or block definition properties.
   - If asset-unit metadata is missing or undeclared, the block unit status evaluates to `UNRESOLVED` at the common F1 level.
   - F1 common logic MUST NOT silently assume millimeters. (Any requirement that vendor catalog blocks default to millimeters is strictly a downstream feature policy, e.g. Panel P1/P2 catalog specifications).
3. **Uniform Insertion Scale:**
   - Non-uniform scaling ($ScaleX \neq ScaleY$ or $ScaleX \neq ScaleZ$) is invalid unless explicitly permitted by an owning downstream specification;
   - Expected numeric uniform insertion scale is derived from explicit dimensional conversion constants:
     ```text
     ExpectedInsertionScale = MillimetersPerAssetUnit / MillimetersPerDrawingUnit
     ```
   - Standard conversion examples:
     - Asset in Millimeters ($1.0$), Drawing in Millimeters ($1.0$): `ExpectedInsertionScale = 1.0 / 1.0 = 1.0`;
     - Asset in Millimeters ($1.0$), Drawing in Meters ($1000.0$): `ExpectedInsertionScale = 1.0 / 1000.0 = 0.001`;
     - Asset in Inches ($25.4$), Drawing in Millimeters ($1.0$): `ExpectedInsertionScale = 25.4 / 1.0 = 25.4`;
   - When asset unit and drawing unit match, expected uniform scale is exactly `1.0`.
4. **Rotation Policy:** Common contract exposes `AllowedRotations` and `RotationPolicy` interfaces to downstream modules. F1 does not freeze a global 90-degree restriction; downstream tranches (e.g. P2) configure allowed angles.
5. **Mirroring Capability:** Block metadata exposes an `AllowMirroring` boolean capability contract. Downstream tranches (e.g. P6 for electrical/polarity constraints) specify which component classes prohibit mirroring.
6. **Static vs Dynamic Capability:** F1 provides common support for both static and dynamic block references. Vendor catalog footprint policies (e.g. mandating static blocks for standard vendor parts) are owned and specified by Tranche P1.
7. **Nested Block Hierarchy:** 1-level nesting limit is established as an architectural recommendation (`PANEL_P1_P2_RECOMMENDATION`) for panel components, not a frozen global F1 invariant. Deep arbitrary nesting is strongly discouraged to maintain fast traversal.
8. **Attribute Presentation Boundary:** Block attributes are strictly for human-visible drawing display. They MUST NOT serve as the authoritative store for TTC metadata. F1 strictly excludes EPLAN device tagging, electrical part numbers, and BOM management.
9. **Footprint & Clearance Reference Geometry:** Physical component linework and clearance reference boundaries reside on separate layers to allow independent visibility toggling. Exact standardized layer names (such as `TTC_CLEARANCE_*`) and layer color/linetype standards are owned and specified by Tranche C1.
10. **Definition Versioning:** Block definitions may record `TTC_DEFINITION_VERSION` in the block table record extension dictionary to track engineering revisions.
11. **Redefinition Behavior:** Redefining a block definition updates all visible references in the drawing while preserving each instance's individual `TTC_OBJECT_ID` and instance metadata.
12. **Missing Asset Classification:**
    - `MISSING_BLOCK_ASSET` represents a library-level asset resolution failure condition, occurring when:
      a. A requested library reference (`TTC_LIBRARY_ID`) cannot resolve to a usable block definition in the active drawing's `BlockTable`, and the required source block is unavailable in the configured library catalog path;
      b. A required source block definition file or version cannot be located or loaded;
      c. A referenced auxiliary block definition (e.g. clearance envelope definition) has been purged from the drawing.
    - It does NOT define an impossible AutoCAD database condition where a valid `BlockReference` points to a non-existent `BlockTableRecord` in a healthy database.
    - Upon detection, the entity is flagged `MISSING_BLOCK_ASSET`, structured diagnostics are logged, its instance Handle is preserved, and automated placement/redraw cascades are safely blocked.

---

## 15. Failure Classifications & Recovery Behaviors

**Classification:** `PROPOSED_SPEC_CONTRACT`

The specification defines 10 standardized deterministic machine-readable failure statuses:

| Status Identifier | Severity | Trigger Condition | System Recovery Behavior |
|---|---|---|---|
| `UNIT_UNRESOLVED` | HIGH | Drawing `INSUNITS = 0` with no project config | Block physical calculations; log warning; request unit declaration |
| `UNIT_CONFIGURATION_CONFLICT` | CRITICAL | Project config conflicts with non-zero `INSUNITS` | Block commands; prevent automated scaling; emit conflict diagnostic |
| `INVALID_METADATA` | HIGH | Malformed syntax, duplicate keys, or invalid UUID | Block entity mutation; preserve geometry; log structured error |
| `METADATA_INCOMPLETE` | MEDIUM | Entity has XData tag but missing/empty XRecord | Classify as incomplete metadata; preserve geometry; queue for audit |
| `UNSUPPORTED_SCHEMA` | HIGH | Schema `MAJOR` version is higher than supported | Block entity mutation; preserve geometry; log version warning |
| `IDENTITY_COLLISION` | CRITICAL | Known clone created with duplicate ID | Assign new UUIDv4 to clone; update XRecord/XData; log audit trail |
| `COLLISION_UNRESOLVED` | CRITICAL | Duplicate IDs found with unknown lineage | Flag both entities; preserve geometry; require manual reconciliation |
| `XDATA_INDEX_OUT_OF_SYNC` | LOW | XData missing or mismatched with XRecord | Rely on authoritative XRecord; discover via `ITtcMetadataAuditService`; resync at safe write boundary |
| `MISSING_BLOCK_ASSET` | HIGH | Library asset or required block definition cannot be located or loaded | Log error; preserve instance handle; block automated placement/redraw |
| `INVALID_BLOCK_SCALE` | MEDIUM | Non-uniform scale or scale factor mismatch | Flag validation warning; offer normalization to expected scale |

---

## 16. Acceptance Criteria Matrix

**Classification:** `PROPOSED_SPEC_CONTRACT`

The following 25 numbered acceptance criteria define the verifiable requirements for Tranche F1:

| ID | Title | Verifiable Requirement | Verification Method |
|---|---|---|---|
| **AC-F1-01** | Core Decoupling Integrity | `TTC.CadTools.Core.dll` contains ZERO references to Autodesk assemblies (`accoremgd`, `acdbmgd`, `acmgd`). | `STATIC_ANALYSIS` / `UNIT_TEST` |
| **AC-F1-02** | Unit Resolution States | Host unit resolver deterministically evaluates `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`. | `UNIT_TEST` / `AUTOCAD_HOST_TEST` |
| **AC-F1-03** | No Silent Unit Assumption | Drawing with `INSUNITS = 0` and no project config is evaluated as `UNRESOLVED` and never silently assumes millimeters. | `UNIT_TEST` / `AUTOCAD_HOST_TEST` |
| **AC-F1-04** | Unit Conversion Precision | Drawing units convert mathematically to Core canonical millimeters using authoritative physical conversion constants (`MillimetersPerDrawingUnit`) in IEEE 754 double precision with deterministic reference value matching across declared test domain (0, 1, -1, small, typical, large coordinates) and round-trip identity fidelity; numerical comparison is governed by double-precision test utility policy (`TEST_IMPLEMENTATION_DETAIL`); no unauthorized tolerance thresholds. | `UNIT_TEST` |
| **AC-F1-05** | Geometric Tolerance Discipline | Linear coincidence comparison uses typed `GeometricTolerance` with $\varepsilon = 10^{-4}\text{ mm}$; zero raw float equality. | `UNIT_TEST` |
| **AC-F1-06** | Identity Format Standard | New TTC objects are assigned lower-case canonical RFC 4122 UUIDv4 strings without role prefixes. | `UNIT_TEST` |
| **AC-F1-07** | Identity Persistence | Closing, saving, and reopening a DWG preserves entity `TTC_OBJECT_ID` and `XRecord` metadata verbatim. | `AUTOCAD_HOST_TEST` |
| **AC-F1-08** | MOVE / ROTATE Invariance | Executing native `MOVE` or `ROTATE` preserves existing `TTC_OBJECT_ID` and `ExtensionDictionary`. | `AUTOCAD_HOST_TEST` |
| **AC-F1-09** | Native COPY Independence | Executing native `COPY` results in source preserving ID and clone receiving distinct new UUIDv4. | `AUTOCAD_HOST_TEST` |
| **AC-F1-10** | Native ARRAY Independence | Executing native `ARRAY` assigns distinct UUIDv4s to every independently generated resulting instance. | `AUTOCAD_HOST_TEST` |
| **AC-F1-11** | Native MIRROR Semantics | Source-preserved MIRROR assigns new UUIDv4 to clone; source-deleted MIRROR preserves ID on original. | `AUTOCAD_HOST_TEST` |
| **AC-F1-12** | Cross-Drawing Clone Safety | Importing entities via `INSERT`, `WBLOCK`, or clipboard paste prevents duplicate IDs entering target database and ensures cross-drawing independent instances receive distinct fresh UUIDv4s. | `AUTOCAD_HOST_TEST` |
| **AC-F1-13** | Metadata Header Round-Trip | `TTC_METADATA_HEADER` writes, serializes, and deserializes all required and optional fields losslessly using standard DXF group code 1. | `AUTOCAD_HOST_TEST` |
| **AC-F1-14** | XData Index Discovery | Fast `Editor.SelectAll()` with `SelectionFilter` locates entities via `"TTC_CAD"` XData without treating XData as truth. | `AUTOCAD_HOST_TEST` |
| **AC-F1-15** | XData Mismatch & Fallback Recovery | When XData is missing, corrupt, or mismatched with XRecord, the authoritative `ITtcMetadataAuditService` discovers the entity via XRecord scan, classifies status as `XDATA_INDEX_OUT_OF_SYNC`, and resynchronizes derivative `"TTC_CAD"` XData at an authorized write boundary. | `AUTOCAD_HOST_TEST` |
| **AC-F1-16** | Missing XRecord Protection | Entity with orphan `XData` is classified as `METADATA_INCOMPLETE`; geometry is 100% preserved. | `AUTOCAD_HOST_TEST` |
| **AC-F1-17** | Schema Forward Compatibility | System safely reads known fields, preserves unknown fields verbatim on future minor schemas (`1.N.x`) without downward version rewrite, blocks future major schemas (`2.x.x`) with `UNSUPPORTED_SCHEMA`, and safely handles malformed syntax as `INVALID_METADATA`. | `UNIT_TEST` / `AUTOCAD_HOST_TEST` |
| **AC-F1-18** | Undo / Redo Identity Invariance | After any native Category A command (`COPY`, `ARRAY`, `MIRROR` preserve-source, `PASTECLIP`, `INSERT`, `ERASE`, `OOPS`) followed by UNDO/REDO sequences, the active database never contains duplicate `TTC_OBJECT_ID` instances; undone clones lose active identity and redo restores mutually independent identities. | `AUTOCAD_HOST_TEST` |
| **AC-F1-19** | Transaction Atomicity | Aborting a multi-entity database transaction rolls back all created entities and dictionary records cleanly. | `AUTOCAD_HOST_TEST` |
| **AC-F1-20** | DocumentLock Compliance | Modeless palette and session operations acquire `DocumentLock` before database write transactions. | `AUTOCAD_HOST_TEST` |
| **AC-F1-21** | Document Lifecycle & Reactor Safety | Document event handlers subscribe to existing open documents at startup and newly created documents idempotently; database reactor callbacks perform zero writes, zero prompts, zero commands; reconciliation writes require explicit `DocumentLock`. | `AUTOCAD_HOST_TEST` |
| **AC-F1-22** | Common Block Validation | Block references are validated for uniform scale, declared units, and clearance layer separation. | `AUTOCAD_HOST_TEST` |
| **AC-F1-23** | Vanilla DWG Compatibility | Drawings containing TTC metadata open and edit cleanly in standard AutoCAD with default warning settings (`PROXYNOTICE = 1`) with zero proxy warnings and zero proxy entity/object classes. | `AUTOCAD_HOST_TEST` / `MANUAL_AUTOCAD_2023` |
| **AC-F1-24** | ECAD Separation | F1 code contains zero logic for EPLAN device tags, wire numbering, terminal strips, or electrical BOMs. | `STATIC_ANALYSIS` / `UNIT_TEST` |
| **AC-F1-25** | Explicit F1 UI Scope | Tranche F1 introduces zero visible engineering Ribbon buttons or component placement palettes. | `STATIC_ANALYSIS` / `MANUAL_AUTOCAD_2023` |

---

## 17. BUILD Validation Test Matrix & Traceability

**Classification:** `BUILD_VALIDATION_REQUIRED`

The following 28 empirical host tests are scheduled for execution during the future BUILD stage under an approved Work Order as runtime acceptance evidence. Every host-tested acceptance criterion maps to at least one concrete named test:

| Test ID | Test Name | Purpose & Verification Procedure | Mapped Acceptance Criteria |
|---|---|---|---|
| **TEST-F1-01** | Handle and Identity Invariance Across Save/Reopen | Save, close, and reopen DWG; assert Handles and `TTC_OBJECT_ID` remain invariant. | `AC-F1-07` |
| **TEST-F1-02** | Native COPY Handle Uniqueness | Execute native `COPY`; assert clone has distinct Handle and distinct `TTC_OBJECT_ID`. | `AC-F1-09` |
| **TEST-F1-03** | XRecord Clone Host Behavior | Execute native `COPY`; inspect clone ExtensionDictionary and verify host clone behavior. | `AC-F1-09` |
| **TEST-F1-04** | Hybrid Storage Selection Filter | Execute `Editor.SelectAll()` with `SelectionFilter` for `"TTC_CAD"`; verify instant entity retrieval. | `AC-F1-14` |
| **TEST-F1-05** | Modeless DocumentLock Enforcement | Execute write transaction from modeless thread with and without `DocumentLock`; assert `eLockViolation` without lock. | `AC-F1-20` |
| **TEST-F1-06** | Transaction Abort Atomicity & Rollback | Add entity and dictionary record, call `tr.Abort()`; assert zero database traces remain. | `AC-F1-19` |
| **TEST-F1-07** | Vanilla DWG Proxy-Free Compatibility & Class Audit | Open DWG with TTC metadata in vanilla AutoCAD 2023 session with default `PROXYNOTICE = 1`; assert zero proxy alerts and zero `ProxyEntity`/`ProxyObject` instances in database. | `AC-F1-23` |
| **TEST-F1-08** | Core Assembly Decoupling Integrity | Inspect `TTC.CadTools.Core.dll` assembly references via reflection; assert zero Autodesk dependencies. | `AC-F1-01` |
| **TEST-F1-09** | BeginSave Write Safety Investigation | Empirically investigate whether write transactions inside `Database.BeginSave` succeed safely or trigger host stability hazards. | `AC-F1-21` |
| **TEST-F1-10** | MIRROR Selective Deep-Clone & Identity Preservation | Verify that `MIRROR` with source preserved creates a clone with new UUIDv4, while `MIRROR` with source deleted transforms entity in-place preserving ID. | `AC-F1-11` |
| **TEST-F1-11** | ARRAY Instance Identity Duplication and Fresh UUID Assignment | Execute native `ARRAY`; verify metadata state across all resulting elements and assert distinct UUIDv4s. | `AC-F1-10` |
| **TEST-F1-12** | WBLOCK, INSERT, and Clipboard Cross-Database Independence | Execute `WBLOCK`, `INSERT`, `COPYCLIP`, and `PASTECLIP` between drawings; assert all imported/pasted instances receive fresh UUIDv4s with zero cross-drawing duplicate IDs. | `AC-F1-12` |
| **TEST-F1-13** | Keyed Schema Lossless Round-Trip & Unknown Field Preservation | Encode `TTC_METADATA_HEADER` using standard DXF group code 1 with custom future keys; read back and verify unknown keys are intact. | `AC-F1-13`, `AC-F1-17` |
| **TEST-F1-14** | XData/XRecord Mismatch Safe Resynchronization | Mutate XData deliberately; invoke repair audit; assert `XRecord` overrides and XData resynchronizes. | `AC-F1-15` |
| **TEST-F1-15** | Command-Boundary Reconciliation Safety & Mechanism Verification | Verify that `Document.CommandEnded` identifies reconciliation opportunities, triggers cache invalidation, and executes persistent reconciliation under candidate Mechanism A (direct `DocumentLock` + `Transaction`) or Mechanism B (scheduled/deferred execution context), asserting host stability and zero crashes. | `AC-F1-21` |
| **TEST-F1-16** | Host Unit Resolution States | Open drawings with matching units, non-matching units, and project configs; assert host resolver returns `RESOLVED`, `UNRESOLVED`, and `UNIT_CONFIGURATION_CONFLICT`. | `AC-F1-02` |
| **TEST-F1-17** | Unitless INSUNITS=0 Host Enforcement | Open unitless drawing with `INSUNITS = 0` without project config; assert resolver returns `UNRESOLVED` and blocks physical placement. | `AC-F1-03` |
| **TEST-F1-18** | MOVE / ROTATE Identity Preservation | Execute native `MOVE` and `ROTATE` commands; assert `TTC_OBJECT_ID` and dictionary remain invariant. | `AC-F1-08` |
| **TEST-F1-19** | Orphan XData / Missing XRecord Non-Destructive Protection | Attach XData to an entity without XRecord; assert classification is `METADATA_INCOMPLETE` and geometry is preserved without silent repair. | `AC-F1-16` |
| **TEST-F1-20** | Unsupported Schema Protection & Malformed Metadata Safety | Attach metadata with major version `2.0.0` or corrupt syntax; assert classified `UNSUPPORTED_SCHEMA` or `INVALID_METADATA` without crashing AutoCAD. | `AC-F1-17` |
| **TEST-F1-21** | Native Clone & Mutation Undo/Redo Behavioral Invariant Verification | Execute native `COPY` $\to$ verify distinct UUIDs $\to$ `UNDO` $\to$ verify clone entity is removed without leaving duplicate UUID $\to$ `REDO` $\to$ verify independent UUIDs restored. Repeat across all Category A commands: `ARRAY`, `MIRROR` (preserve source), `PASTECLIP`, `INSERT`, and `ERASE`/`OOPS`. | `AC-F1-18` |
| **TEST-F1-22** | Session and Zero-Document Safety | Invoke commands in `CommandFlags.Session` and zero-document states; assert proper document locking and zero null-pointer crashes. | `AC-F1-20` |
| **TEST-F1-23** | Database Reactor Observation-Only Safety | Fire database reactors during entity mutation; verify zero transactions started in callback and `IsDirty` flag is set safely. | `AC-F1-21` |
| **TEST-F1-24** | Common Block Scale, Rotation, and Redefinition Verification | Insert blocks with uniform and non-uniform scales, test rotation policies, and redefine block definition; assert instance identity preservation. | `AC-F1-22` |
| **TEST-F1-25** | F1 Headless UI Scope Audit | Inspect loaded menus, ribbons, and palette sets; assert zero engineering UI buttons or placement palettes were introduced by F1. | `AC-F1-25` |
| **TEST-F1-26** | Existing Document Event Subscription at Plugin Load | Open DWG in AutoCAD session prior to loading TTC CAD plugin; load plugin via `Initialize()`; execute native `COPY`; assert command boundary event fires, clone reconciliation executes, and per-document cache operates without document reopen. | `AC-F1-21` |
| **TEST-F1-27** | Missing-XData Authoritative Fallback Discovery & Index Rebuild | (1) Create valid TTC object with `TTC_METADATA_HEADER`; (2) Remove `"TTC_CAD"` XData only; (3) Verify fast `SelectAll` with XData filter does not discover it; (4) Run `ITtcMetadataAuditService` authoritative scan; (5) Verify entity discovered by XRecord inspection; (6) Verify classification `XDATA_INDEX_OUT_OF_SYNC`; (7) Resynchronize XData at safe write boundary; (8) Verify subsequent fast XData query discovers entity. | `AC-F1-14`, `AC-F1-15` |
| **TEST-F1-28** | Pure Core Unit Conversion Reference Value & Round-Trip Tests | Verify unit conversion against authoritative conversion constants (`MillimetersPerDrawingUnit`) across Millimeter, Centimeter, Meter, Inch, Foot using fixed declared coordinate suite (0.0, 1.0, -1.0, 0.001, 1250.75, 500000.0); assert `expectedMm == actualMm` using bounded double precision comparison (`TEST_IMPLEMENTATION_DETAIL`) and verify round-trip identity across all test coordinates. | `AC-F1-04` |

---

## 18. Performance, Safety & Robustness Standards

**Classification:** `PROPOSED_SPEC_CONTRACT`

1. **No Always-On Whole-Drawing Scans:** The system MUST NOT perform full-drawing entity iterations during cursor movement (`PointMonitor`) or high-frequency events. Scans are strictly bounded to command start/finish or explicit QA actions.
2. **Safe Exception Handling:** All internal exceptions in TTC CAD must be caught and logged to `FileLogger`. No unhandled exceptions may escape into the AutoCAD host process.
3. **No Unmanaged C++ Dependencies:** Implementation is 100% managed C# targeting .NET Framework 4.8.
4. **No Custom ObjectARX Entities:** Zero custom database classes (`AcDbEntity` derivatives), ensuring third parties can view and edit DWG files without proxy object warnings.

---

## 19. Explicit Out-of-Scope & Downstream Boundaries

**Classification:** `DEFERRED_TO_DOWNSTREAM`

The following capabilities are explicitly OUT OF SCOPE for Tranche F1:
- Component Library database schema, vendor catalog files, footprint ingestion (`Tranche P1`);
- `TTCPANELPLACE` command, live snap points, collision envelopes during placement (`Tranche P2`);
- DIN rail extrusion calculations, cut-length rounding, screw-pitch snapping (`Tranche P3`);
- Wiring duct sizing, fill percentage calculations (`Tranche P4`);
- Automatic component alignment and spacing algorithms (`Tranche P5`);
- Thermal/electrical clearance rules, busbar clearances, panel QA verification (`Tranche P6`);
- Cabinet depth validation (`Tranche P7`);
- Cabinet size recommendation algorithms (`Tranche P8`);
- Reserved zone enforcement (`Tranche P9`);
- Cable tray routing, 3D/2D duct fittings, support brackets (`Tranches M1..M8`);
- Layer standards enforcement and color/linetype mapping (`Tranche C1`);
- Clean DWG/DXF export engine (`Tranche C2`);
- EPLAN Data Portal or EPLAN Electric P8 API integration (Belongs exclusively to EPLAN 2022 toolchain).

---

## 20. Traceability Matrix to Canonical Issues

The requirements in this specification resolve all 10 canonical F1 issues:

| Canonical Issue ID | Issue Topic | Resolving Specification Sections |
|---|---|---|
| **ISSUE-F1-001** | Drawing-Unit Enforcement vs Validation Policy | Section 3.2, 3.3, 3.5, AC-F1-02, AC-F1-03, TEST-F1-16, TEST-F1-17 |
| **ISSUE-F1-002** | Unit Authority, Unitless DWGs, & Conflict States | Section 3.2, 3.4, AC-F1-02, AC-F1-03, Section 15, TEST-F1-16, TEST-F1-17 |
| **ISSUE-F1-003** | Geometric Tolerance Architecture | Section 3.3, 4.1, 4.2, 4.3, AC-F1-04, AC-F1-05, TEST-F1-28 |
| **ISSUE-F1-004** | `TTC_OBJECT_ID` Format & Global Uniqueness Scope | Section 5.1, 5.2, 5.3, AC-F1-06, AC-F1-12, TEST-F1-12 |
| **ISSUE-F1-005** | Identity Lifecycle Under Native Clone Operations | Section 10, 10.1, 11.1, 11.2, AC-F1-09, AC-F1-10, AC-F1-11, AC-F1-12, AC-F1-18, TEST-F1-02, 03, 10, 11, 12, 21 |
| **ISSUE-F1-006** | Metadata Storage Split: XRecord vs XData | Section 7.1, 7.2, 7.3, 8.1, 8.2, 8.4, AC-F1-13, AC-F1-14, AC-F1-15, TEST-F1-04, TEST-F1-13, TEST-F1-14, TEST-F1-27 |
| **ISSUE-F1-007** | Schema Versioning & Backward Compatibility | Section 7.3, 7.4, 9.1, 9.2, 9.3, AC-F1-17, TEST-F1-13, TEST-F1-20 |
| **ISSUE-F1-008** | Reactor Safety & Cache Invalidation Strategy | Section 12.1, 12.2, 12.3, 12.4, 13, AC-F1-21, TEST-F1-09, TEST-F1-15, TEST-F1-23, TEST-F1-26 |
| **ISSUE-F1-009** | Common Mechanical Block Asset Contract | Section 14 (12 domains), AC-F1-22, TEST-F1-24 |
| **ISSUE-F1-010** | Metadata Recovery & Conflict Resolution | Section 8.4, 11.2, 15 (10 failure statuses), 16 (AC-F1-15, AC-F1-16), TEST-F1-19, TEST-F1-27 |
