# Tranche F1: Common CAD Contracts — Specification

- **Spec ID:** `SPEC-FOUNDATION-F1-001`
- **Title:** Common CAD Contracts
- **Version:** `0.1.0`
- **Status:** `DRAFT / PROPOSED_FOR_REVIEW`
- **Lifecycle Stage:** `SPEC`
- **Tranche:** F1 — Common CAD Contracts
- **Dependency:** Tranche F0 — AutoCAD Foundation (`FROZEN v1.0.0`, Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Design Authority:** `DESIGN-FOUNDATION-F1-001` v0.3.0 (`COMPLETE / REVIEWED_PASS / PASS_TO_SPEC`)
- **Design Review:** `REV-F1-DESIGN-001-R3` — `PASS / PASS_TO_SPEC`
- **Target Host Baseline:** AutoCAD 2023 Managed .NET API (C#, .NET Framework 4.8)
- **Production Build Authorization:** `NONE`
- **SPEC Freeze Authority:** `NONE`
- **Work Order:** `NONE`

> [!IMPORTANT]
> **Specification Governance & Non-Approval Notice:**
> 1. Antigravity is the authoring agent. Antigravity MUST NOT self-approve or freeze this specification.
> 2. This document represents a formal DRAFT specification submitted for independent technical review.
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
   - Behavior: The drawing unit is unambiguously resolved. The conversion factor to Core canonical millimeters is calculated deterministically ($Factor = DrawingUnit / Millimeter$).
2. **State: `UNRESOLVED`**
   - Condition: Drawing `INSUNITS = 0` (Unitless / Unspecified), and no explicit project configuration or user unit declaration has been supplied.
   - Behavior: Host adapter returns `PhysicalUnitResolution.Unresolved`. Any TTC operation requiring physical-unit interpretation (e.g. component placement, clearance envelope calculation, dimension validation) MUST FAIL deterministically with failure status `UNIT_UNRESOLVED`.
   - Invariant: `INSUNITS = 0` MUST NEVER silently default to millimeters.
3. **State: `UNIT_CONFIGURATION_CONFLICT`**
   - Condition: Explicit project configuration defines drawing units as Unit $U_A$ (e.g. Millimeters), but the active DWG header has non-zero `INSUNITS` specifying Unit $U_B$ (e.g. Inches).
   - Behavior: Host adapter returns `PhysicalUnitResolution.ConfigurationConflict`. Any TTC command requiring unit interpretation MUST BLOCK execution deterministically with failure status `UNIT_CONFIGURATION_CONFLICT`.
   - Invariant: The system MUST NOT silently pick either unit, MUST NOT silently mutate `INSUNITS`, and MUST NOT automatically rescale existing drawing geometry. Resolution requires explicit administrative or user confirmation.

### 3.3 AutoCAD System Variable Discipline
- **`MEASUREMENT` Variable:** Controls default hatch pattern and linetype library files (`acad.pat` vs `acadiso.pat`). It MUST NOT be used to infer model geometry linear units.
- **`LUNITS` Variable:** Controls linear coordinate display formatting (e.g. Scientific, Decimal, Engineering, Architectural, Fractional). It MUST NOT be used to infer model geometry linear units.
- **`INSUNITSDEFSOURCE` / `INSUNITSDEFTARGET` Variables:** Provide fallback insertion scaling defaults for external blocks/xrefs when `INSUNITS` is 0. They MUST NOT be treated as authoritative proof of active model space geometry units.

### 3.4 Downstream Policy Extension
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

### 5.1 Identity Scope & Purpose
`TTC_OBJECT_ID` uniquely identifies **exactly one TTC-managed AutoCAD drawing object instance** within an AutoCAD database.

It is strictly decoupled from:
- **Catalog Part Numbers / Library IDs (`TTC_LIBRARY_ID`):** Identifies a component type or vendor catalog footprint; shared by thousands of placed instances.
- **EPLAN Device Tags (`+CAB1-Q1`):** Functional electrical schematic designations owned exclusively by the external EPLAN 2022 toolchain.
- **Electrical BOM Line Items:** Manufacturing procurement identifiers.
- **AutoCAD Database Handle:** Database-internal object identifier; unique within one DWG but not cross-DWG safe and reassigned on cloning.
- **AutoCAD ObjectId:** Transient memory pointer that changes across drawing open/close sessions.

### 5.2 Representation & Format
- **Format Standard:** RFC 4122 Version 4 UUID (Randomly generated 128-bit integer).
- **Encoding:** Canonical 36-character string in 8-4-4-4-12 format with hyphens (`Guid.ToString("D")`).
- **Casing:** Strictly **lower-case invariant** (`[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}`).
- **No Role/Type Slug Prefix:** The identifier MUST NOT contain a type prefix (e.g. `MCB-...` or `TTC-...`). Object classification is stored independently in `TTC_OBJECT_TYPE`. This prevents identity mutation if an entity is reclassified.

### 5.3 Uniqueness Invariant
Within every valid TTC-managed AutoCAD database, no two independent drawing object instances may possess the same valid `TTC_OBJECT_ID`.
UUIDv4 provides practical global uniqueness ($2^{122}$ possible values), ensuring negligible collision probability without requiring a centralized ID coordinator.

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
| **Authoritative Store** | `DBObject.ExtensionDictionary` $\to$ `XRecord` (`TTC_METADATA_HEADER`) | **PRIMARY TRUTH** (Wins all conflicts) | Full keyed metadata (`TTC_OBJECT_ID`, `TTC_OBJECT_TYPE`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, etc.) | Up to 2 GB per database object (AutoCAD internal object limit) |
| **Derivative Index** | Registered `XData` (RegApp: `"TTC_CAD"`) | **SECONDARY FAST QUERY** (Discardable index) | `TTC_OBJECT_TYPE`, `TTC_OBJECT_ID` only | Shared total ~16 KB per entity across all applications |

### 7.2 Mismatch & Synchronization Rules
1. **XRecord Wins:** In any discrepancy between `XRecord` and `XData`, the `XRecord` content is authoritative.
2. **Stale/Missing XData:** If a valid `TTC_METADATA_HEADER` exists but `XData` is missing, corrupted, or contains mismatched values:
   - Status is marked `XDATA_INDEX_OUT_OF_SYNC`;
   - Entity is treated as valid TTC-managed object based on `XRecord`;
   - `XData` index is queued for resynchronization at the next authorized safe write boundary.
3. **Orphan XData (Missing XRecord):** If entity has `TTC_CAD` registered `XData` but lacks the authoritative `TTC_METADATA_HEADER` `XRecord`:
   - System MUST NOT silently recreate authoritative metadata from `XData`;
   - Entity is classified as `METADATA_INCOMPLETE` (or `UNREGISTERED_TTC_ASSET`);
   - Geometry is 100% preserved;
   - Destructive automated mutations are blocked;
   - Entity is reported to audit logging.

### 7.3 Logical Schema Definition (`TTC_METADATA_HEADER` v1.0.0)
The `TTC_METADATA_HEADER` is encoded as a keyed/tagged `ResultBuffer` containing sequential pairs of DXF entries:
- Key entry: `DxfCode.Text` (1000 or 1) representing the metadata key name.
- Value entry: `DxfCode.Text` (1000 or 1) representing the metadata string value.

```
+-------------------------------------------------------------------------+
|                  TTC_METADATA_HEADER ResultBuffer Layout                |
+-------------------------------------------------------------------------+
| [1000, "TTC_SCHEMA_VERSION"] -> [1000, "1.0.0"]                         |
| [1000, "TTC_OBJECT_ID"]      -> [1000, "c7a3b4e2-9d8f-4e1a-..."]       |
| [1000, "TTC_OBJECT_TYPE"]    -> [1000, "PANEL_COMPONENT"]               |
| [1000, "TTC_LIBRARY_ID"]     -> [1000, "LIB-ABB-XT2N-160"] (Optional)   |
| [1000, "TTC_LIBRARY_VERSION"]-> [1000, "1.2.0"]            (Optional)   |
| [1000, "FUTURE_EXT_KEY"]     -> [1000, "CUSTOM_VALUE"]     (Preserved)  |
+-------------------------------------------------------------------------+
```

### 7.4 Schema Key Invariants
- **Order Independence:** Readers must locate fields by key matching, never by array index position.
- **Duplicate Key Rejection:** A record containing duplicate instances of any required key is invalid and rejected with status `INVALID_METADATA`.
- **Unknown Field Preservation:** During read-modify-write cycles, any key not recognized by the active version of TTC CAD must be preserved verbatim in the record without being stripped.
- **Serialization Standard:** No `BinaryFormatter`, no custom binary serialization, and no ObjectARX custom classes. All data uses native AutoCAD `TypedValue` structures ensuring 100% vanilla DWG compatibility.

---

## 8. XData Index Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 8.1 Registered Application Contract
- **RegApp Name:** Strictly `"TTC_CAD"`.
- **Auto-Registration:** If the `RegAppTable` lacks entry `"TTC_CAD"`, the host adapter registers it atomically within the active write transaction prior to attaching XData.

### 8.2 XData Payload Structure
The XData payload attached under `"TTC_CAD"` consists strictly of:
1. `DxfCode.ExtendedDataRegAppName`: `"TTC_CAD"`
2. `DxfCode.ExtendedDataAsciiString`: `TTC_OBJECT_TYPE` (e.g. `"PANEL_COMPONENT"`)
3. `DxfCode.ExtendedDataAsciiString`: `TTC_OBJECT_ID` (UUID string)

Total payload size is under 100 bytes, far below the shared AutoCAD limit of ~16 KB per entity across all applications.

### 8.3 Fast Selection Query Invariant
Downstream services may perform fast whole-drawing discovery using `Editor.SelectAll()` with a `SelectionFilter` targeting `"TTC_CAD"` XData. However, candidate entities retrieved via selection filter MUST be validated against their authoritative `ExtensionDictionary / XRecord` before performing any business logic.

---

## 9. Schema Versioning & Forward Compatibility

**Classification:** `PROPOSED_SPEC_CONTRACT`

### 9.1 Semantic Versioning Schema
`TTC_SCHEMA_VERSION` follows Semantic Versioning (`MAJOR.MINOR.PATCH`). Initial specification version is **`1.0.0`**.

### 9.2 Version Handling Rules
1. **Exact Version Match (`1.0.0`):** Standard read and write operations.
2. **Older Compatible Minor Version (`1.x.y` where $x < x_{current}$):**
   - Reader parses all known fields;
   - Missing optional fields receive defined safe defaults;
   - Schema version remains unchanged on read;
   - If the entity is modified by an authorized command, the schema version is safely upgraded to current minor version.
3. **Unsupported Future Major Version ($MAJOR > 1$):**
   - Reader detects higher major version;
   - Classification: `UNSUPPORTED_SCHEMA`;
   - Visual entity and geometry are 100% preserved;
   - Automated TTC modifications to the entity are BLOCKED;
   - A structured diagnostic warning is logged to prevent destructive downgrading;
   - Drawing remains fully operable in AutoCAD.
4. **Corrupted or Malformed Schema String:**
   - Classification: `INVALID_METADATA`;
   - Entity geometry preserved;
   - Modification blocked; structured error logged; no AutoCAD crash.

---

## 10. Native Edit Lifecycle Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

The specification formalizes the behavioral invariant for all standard AutoCAD native commands operating on TTC-managed entities across 18 lifecycle operations:

| Command | Host Cloning Mode | Handle Behavior | TTC_OBJECT_ID Requirement | Authority & Classification |
|---|---|---|---|---|
| `MOVE` | Transform in-place | Unchanged | **Preserve existing ID** | `PROPOSED_SPEC_CONTRACT` |
| `ROTATE` | Transform in-place | Unchanged | **Preserve existing ID** | `PROPOSED_SPEC_CONTRACT` |
| `SCALE` | Transform in-place | Unchanged | **Preserve existing ID** (Scale validated per block contract) | `PROPOSED_SPEC_CONTRACT` |
| `COPY` | `deepClone` | New Handle assigned | **Source retains ID; Clone assigned NEW UUID** | `PROPOSED_SPEC_CONTRACT` |
| `ARRAY` | `deepClone` (N times) | N new Handles assigned | **Each resulting instance assigned distinct NEW UUID** | `PROPOSED_SPEC_CONTRACT` |
| `MIRROR` (Source preserved) | `deepClone` | New Handle assigned | **Source retains ID; Mirrored clone assigned NEW UUID** | `PROPOSED_SPEC_CONTRACT` |
| `MIRROR` (Source erased) | Transform in-place | Unchanged | **Preserve existing ID on mirrored original** | `PROPOSED_SPEC_CONTRACT` |
| `ERASE` | Marked `IsErased=true` | Retained until purge | **Logical entity retired from active spatial index** | `PROPOSED_SPEC_CONTRACT` |
| `OOPS` | Un-erased | Restored | **Preserve original ID; re-index in spatial cache** | `PROPOSED_SPEC_CONTRACT` |
| `UNDO` | Host rollback | Rolled back | **Restores exact previous identity and metadata state** | `PROPOSED_SPEC_CONTRACT` |
| `REDO` | Host rollforward | Rolled forward | **Restores exact redone identity and metadata state** | `PROPOSED_SPEC_CONTRACT` |
| `SAVE` | Serialization to DWG | Unchanged | **Preserve existing ID and XRecords verbatim** | `PROPOSED_SPEC_CONTRACT` |
| `REOPEN` | Deserialization from DWG | Invariant Handles | **Preserve existing ID and XRecords verbatim** | `PROPOSED_SPEC_CONTRACT` |
| `EXPLODE` | Primitives created | New Handles | **Original ID NOT propagated to raw geometry primitives** | `PROPOSED_SPEC_CONTRACT` |
| `WBLOCK` | `wblockClone` | New Handles in target | **Clones must not duplicate IDs in target database** | `PROPOSED_SPEC_CONTRACT` |
| `INSERT` | `wblockClone` | New Handles in target | **Imported instances must not enter target with duplicate IDs** | `PROPOSED_SPEC_CONTRACT` |
| `COPYCLIP` | Temp DWG serialize | Exported to clipboard | **Clipboard payload encapsulates metadata** | `PROPOSED_SPEC_CONTRACT` |
| `PASTECLIP` | Temp DWG deserialize | New Handles in target | **Pasted instances must be assigned fresh UUIDs** | `PROPOSED_SPEC_CONTRACT` |
| `BLOCK REDEFINE` | Definition updated | Unchanged on Refs | **BlockReference instances preserve their TTC_OBJECT_ID** | `PROPOSED_SPEC_CONTRACT` |

---

## 11. Clone Lineage & Provenance Contract

**Classification:** `PROPOSED_SPEC_CONTRACT`

To eliminate identity collisions caused by native AutoCAD `deepClone` duplicating extension dictionaries, the specification establishes a rigorous two-state lineage resolution contract:

### 11.1 State A: `PROVENANCE_KNOWN`
When a cloning operation is tracked deterministically (e.g. through TTC custom placement commands, audited command boundaries, or known clone mappings):
1. **Source Entity:** Retains its existing `TTC_OBJECT_ID` unchanged.
2. **Clone Entity:** Assigned a newly generated RFC 4122 UUIDv4.
3. **Metadata Synchronization:** Authoritative `XRecord` and derivative `XData` on the clone are updated atomically within the write transaction.
4. **Audit Trail:** Operation logged to `FileLogger` with source Handle, clone Handle, and new `TTC_OBJECT_ID`.

### 11.2 State B: `PROVENANCE_UNKNOWN`
When duplicate `TTC_OBJECT_ID` values are discovered in the database without deterministic source-vs-clone lineage (e.g. following external native edits, third-party script executions, or multi-step paste operations):
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

### 12.2 Ephemeral Cache Invalidation
Reactors are restricted to:
- Setting an in-memory boolean flag `IsDirty = true`;
- Appending affected entity `ObjectId` locators to a transient thread-safe collection;
- Invalidating ephemeral spatial indexing and derived layout graphs.

Re-indexing and metadata reconciliation occur safely at **command boundaries** (`Editor.CommandEnded`) or upon explicit invocation by an authorized engineering tool.

### 12.3 Pre-Save Mutation Safety
Automatic metadata rewriting inside `Database.BeginSave` is classified as `BUILD_VALIDATION_REQUIRED` / `HOST_TEST_REQUIRED`. The core F1 specification behavioral contract does NOT depend on `BeginSave` writes for identity consistency.

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
| **Reactor Callback** | **PROHIBITED** (Zero writes) | **PROHIBITED** | In-memory flag setting only |
| **Zero-Document State** | **N/A** (No active document) | **PROHIBITED** | Read settings/logs; no DB writes |

### 13.1 Transaction Atomicity & Failure Invariant
All multi-entity operations (e.g. creating a component and attaching clearance geometry) must execute within a single atomic `Transaction`. If any step fails or is cancelled by the user, the entire transaction must abort (`tr.Abort()`), leaving zero partial entities or orphaned dictionary entries in the database.

---

## 14. Common CAD Block Contract (12 Domains)

**Classification:** `PROPOSED_SPEC_CONTRACT`

F1 governs common CAD block behaviors across all engineering features without defining feature-specific catalog schemas:

1. **Mounting Reference Base Point:** Block definition origin $(0, 0, 0)$ must represent the primary mechanical mounting reference (e.g. top-left corner for DIN rail modular components; center or base line for transformers/cable trays).
2. **Declared Asset Units:** Block definitions must declare their internal engineering unit (default: `MILLIMETER`).
3. **Uniform Insertion Scale:**
   - Non-uniform scaling ($ScaleX \neq ScaleY$ or $ScaleX \neq ScaleZ$) is invalid unless explicitly permitted by an owning downstream specification;
   - Expected numeric scale is derived from asset-unit to drawing-unit conversion ($Scale = AssetUnit / DrawingUnit$);
   - When asset unit and drawing unit match, expected uniform scale is exactly `1.0`.
4. **Rotation Policy:** Common contract exposes `AllowedRotations` and `RotationPolicy` to downstream modules. F1 does not freeze a global 90-degree restriction; downstream tranches (e.g. P2) configure allowed angles.
5. **Mirroring Capability:** Block metadata declares whether mirroring is permissible (`AllowMirroring = true/false`). For asymmetrical components with fixed terminal polarity, mirroring is blocked.
6. **Static vs Dynamic Capability:** Fixed vendor catalog parts use standard static blocks to prevent geometry drift. Dynamic blocks are restricted to adjustable-length structural assets (e.g. expandable DIN rails or variable-width cable trays).
7. **Nested Block Hierarchy:** 1-level nesting limit is established as an architectural recommendation (`PANEL_P1_P2_RECOMMENDATION`). Deep arbitrary nesting is strongly discouraged to maintain fast traversal.
8. **Attribute Presentation Boundary:** Block attributes are strictly for human-visible drawing display. They MUST NOT serve as the authoritative store for TTC metadata. F1 strictly excludes EPLAN device tagging, electrical part numbers, and BOM management.
9. **Footprint & Clearance Geometry:** Physical component linework lives on standard geometry layers. Electrical/thermal clearance boundaries must reside on dedicated standardized clearance layers (`TTC_CLEARANCE_*`) to permit independent visibility toggling.
10. **Definition Versioning:** Block definitions may record `TTC_DEFINITION_VERSION` in the block table record extension dictionary to track engineering revisions.
11. **Redefinition Behavior:** Redefining a block definition updates all visible references in the drawing while preserving each instance's individual `TTC_OBJECT_ID` and instance metadata.
12. **Missing Asset Classification:** When a required block definition is missing from the DWG, the system marks the entity as `MISSING_BLOCK_ASSET`, logs structured diagnostics, and prevents automated placement failure cascades.

---

## 15. Failure Classifications & Recovery Behaviors

**Classification:** `PROPOSED_SPEC_CONTRACT`

The specification defines 10 standardized deterministic failure statuses:

| Status Identifier | Severity | Trigger Condition | System Recovery Behavior |
|---|---|---|---|
| `UNIT_UNRESOLVED` | HIGH | Drawing `INSUNITS = 0` with no project config | Block physical calculations; log warning; request unit declaration |
| `UNIT_CONFIGURATION_CONFLICT` | CRITICAL | Project config conflicts with non-zero `INSUNITS` | Block commands; prevent automated scaling; emit conflict diagnostic |
| `INVALID_METADATA` | HIGH | Malformed syntax, duplicate keys, or invalid UUID | Block entity mutation; preserve geometry; log structured error |
| `METADATA_INCOMPLETE` | MEDIUM | Entity has XData tag but missing/empty XRecord | Classify as unregistered asset; preserve geometry; queue for audit |
| `UNSUPPORTED_SCHEMA` | HIGH | Schema `MAJOR` version is higher than supported | Block entity mutation; preserve geometry; log version warning |
| `IDENTITY_COLLISION` | CRITICAL | Known clone created with duplicate ID | Assign new UUID to clone; update XRecord/XData; log audit trail |
| `COLLISION_UNRESOLVED` | CRITICAL | Duplicate IDs found with unknown lineage | Flag both entities; preserve geometry; require manual reconciliation |
| `XDATA_INDEX_OUT_OF_SYNC` | LOW | XData missing or mismatched with XRecord | Rely on authoritative XRecord; queue XData for safe resync |
| `MISSING_BLOCK_ASSET` | HIGH | Block definition referenced by metadata is missing | Log error; preserve instance handle; block automated redraw |
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
| **AC-F1-04** | Unit Conversion Precision | Drawing units convert mathematically to Core canonical millimeters with zero scaling error. | `UNIT_TEST` |
| **AC-F1-05** | Geometric Tolerance Discipline | Linear coincidence comparison uses typed `GeometricTolerance` with $\varepsilon = 10^{-4}\text{ mm}$; zero raw float equality. | `UNIT_TEST` |
| **AC-F1-06** | Identity Format Standard | New TTC objects are assigned lower-case canonical RFC 4122 UUIDv4 strings without role prefixes. | `UNIT_TEST` |
| **AC-F1-07** | Identity Persistence | Closing, saving, and reopening a DWG preserves entity `TTC_OBJECT_ID` and `XRecord` metadata verbatim. | `AUTOCAD_HOST_TEST` |
| **AC-F1-08** | MOVE / ROTATE Invariance | Executing native `MOVE` or `ROTATE` preserves existing `TTC_OBJECT_ID` and `ExtensionDictionary`. | `AUTOCAD_HOST_TEST` |
| **AC-F1-09** | Native COPY Independence | Executing native `COPY` results in source preserving ID and clone receiving distinct new UUID. | `AUTOCAD_HOST_TEST` |
| **AC-F1-10** | Native ARRAY Independence | Executing native `ARRAY` assigns distinct UUIDs to every independently generated resulting instance. | `AUTOCAD_HOST_TEST` |
| **AC-F1-11** | Native MIRROR Semantics | Source-preserved MIRROR assigns new UUID to clone; source-deleted MIRROR preserves ID on original. | `AUTOCAD_HOST_TEST` |
| **AC-F1-12** | Cross-Drawing Clone Safety | Importing entities via `INSERT`, `WBLOCK`, or clipboard paste prevents duplicate IDs entering target database. | `AUTOCAD_HOST_TEST` |
| **AC-F1-13** | Metadata Header Round-Trip | `TTC_METADATA_HEADER` writes, serializes, and deserializes all required and optional fields losslessly. | `AUTOCAD_HOST_TEST` |
| **AC-F1-14** | XData Index Discovery | Fast `Editor.SelectAll()` with `SelectionFilter` locates entities via `"TTC_CAD"` XData without treating XData as truth. | `AUTOCAD_HOST_TEST` |
| **AC-F1-15** | XData Mismatch Recovery | When `XData` conflicts with `XRecord`, `XRecord` wins and `XData` is resynchronized at safe boundary. | `AUTOCAD_HOST_TEST` |
| **AC-F1-16** | Missing XRecord Protection | Entity with orphan `XData` is classified as `METADATA_INCOMPLETE`; geometry is 100% preserved. | `AUTOCAD_HOST_TEST` |
| **AC-F1-17** | Schema Forward Compatibility | System safely defaults older minor versions, preserves unknown fields, and blocks higher major versions. | `UNIT_TEST` / `AUTOCAD_HOST_TEST` |
| **AC-F1-18** | Undo / Redo Restoration | Native `UNDO` and `REDO` restore exact historical entity metadata state without corruption. | `AUTOCAD_HOST_TEST` |
| **AC-F1-19** | Transaction Atomicity | Aborting a multi-entity database transaction rolls back all created entities and dictionary records cleanly. | `AUTOCAD_HOST_TEST` |
| **AC-F1-20** | DocumentLock Compliance | Modeless palette and session operations acquire `DocumentLock` before database write transactions. | `AUTOCAD_HOST_TEST` |
| **AC-F1-21** | Reactor Execution Safety | Database reactor callbacks perform zero database write transactions, zero prompts, and no command calls. | `AUTOCAD_HOST_TEST` |
| **AC-F1-22** | Common Block Validation | Block references are validated for uniform scale, declared units, and clearance layer conventions. | `AUTOCAD_HOST_TEST` |
| **AC-F1-23** | Vanilla DWG Compatibility | Drawings containing TTC metadata open and edit cleanly in standard AutoCAD without proxy warnings. | `AUTOCAD_HOST_TEST` / `MANUAL_AUTOCAD_2023` |
| **AC-F1-24** | ECAD Separation | F1 code contains zero logic for EPLAN device tags, wire numbering, terminal strips, or electrical BOMs. | `STATIC_ANALYSIS` / `UNIT_TEST` |
| **AC-F1-25** | Explicit F1 UI Scope | Tranche F1 introduces zero visible engineering Ribbon buttons or component placement palettes. | `STATIC_ANALYSIS` / `MANUAL_AUTOCAD_2023` |

---

## 17. BUILD Validation Test Matrix

**Classification:** `BUILD_VALIDATION_REQUIRED`

The following empirical host tests are scheduled for execution during the future BUILD stage under an approved Work Order. They serve as runtime acceptance evidence:

1. **TEST-F1-01 (Handle Immutability Across Save/Reopen):** Save, close, and reopen DWG; assert Handles remain invariant.
2. **TEST-F1-02 (Native COPY Handle Uniqueness):** Execute native `COPY`; assert clone has distinct Handle.
3. **TEST-F1-03 (XRecord Clone Duplication Behavior):** Execute native `COPY`; inspect clone ExtensionDictionary and verify host clone behavior.
4. **TEST-F1-04 (Hybrid Storage Selection Filter):** Execute `Editor.SelectAll()` with `SelectionFilter` for `"TTC_CAD"`; verify instant entity retrieval.
5. **TEST-F1-05 (Modeless DocumentLock Enforcement):** Execute write transaction from modeless thread with and without `DocumentLock`; assert `eLockViolation` without lock.
6. **TEST-F1-06 (Transaction Abort Atomicity):** Add entity and dictionary record, call `tr.Abort()`; assert zero database traces remain.
7. **TEST-F1-07 (Vanilla DWG Compatibility):** Open DWG with TTC metadata in vanilla AutoCAD 2023 session; verify `PROXYNOTICE = 0` and zero proxy alerts.
8. **TEST-F1-08 (Core Assembly Decoupling):** Inspect `TTC.CadTools.Core.dll` assembly references via reflection; assert zero Autodesk dependencies.
9. **TEST-F1-09 (BeginSave Write Safety Investigation):** Empirically investigate whether write transactions inside `Database.BeginSave` succeed safely or trigger host stability hazards.
10. **TEST-F1-10 (MIRROR Selective Deep-Clone Behavior):** Verify that `MIRROR` with source preserved duplicates dictionary, while `MIRROR` with source deleted transforms entity in-place.
11. **TEST-F1-11 (ARRAY Instance Duplication Behavior):** Execute native `ARRAY`; verify metadata state across all resulting elements.
12. **TEST-F1-12 (Cross-Drawing Import / Clipboard Cloning):** Execute `COPYCLIP` and `PASTECLIP` between two drawings; verify target ID uniqueness.
13. **TEST-F1-13 (Keyed Schema Lossless Round-Trip):** Encode `TTC_METADATA_HEADER` with custom future keys; read back and verify unknown keys are intact.
14. **TEST-F1-14 (XData/XRecord Mismatch Recovery):** Mutate XData deliberately; invoke repair audit; assert `XRecord` overrides and XData resynchronizes.

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
| **ISSUE-F1-001** | Drawing-Unit Enforcement vs Validation Policy | Section 3.2, 3.4, AC-F1-02, AC-F1-03 |
| **ISSUE-F1-002** | Unit Authority, Unitless DWGs, & Conflict States | Section 3.2, 3.3, AC-F1-02, AC-F1-03, Section 15 |
| **ISSUE-F1-003** | Geometric Tolerance Architecture | Section 4.1, 4.2, 4.3, AC-F1-05 |
| **ISSUE-F1-004** | `TTC_OBJECT_ID` Format & Uniqueness Scope | Section 5.1, 5.2, 5.3, AC-F1-06 |
| **ISSUE-F1-005** | Identity Lifecycle Under Native Clone Operations | Section 10, 11.1, 11.2, AC-F1-09, AC-F1-10, AC-F1-11, TEST-F1-02, 03, 10 |
| **ISSUE-F1-006** | Metadata Storage Split: XRecord vs XData | Section 7.1, 7.2, 8.1, 8.2, AC-F1-13, AC-F1-14, AC-F1-15, TEST-F1-04 |
| **ISSUE-F1-007** | Schema Versioning & Backward Compatibility | Section 7.3, 7.4, 9.1, 9.2, AC-F1-17, TEST-F1-13 |
| **ISSUE-F1-008** | Reactor Safety & Cache Invalidation Strategy | Section 12.1, 12.2, 12.3, AC-F1-21, TEST-F1-09 |
| **ISSUE-F1-009** | Common Mechanical Block Asset Contract | Section 14 (12 domains), AC-F1-22 |
| **ISSUE-F1-010** | Metadata Recovery & Conflict Resolution | Section 11.2, 15 (10 failure statuses), 16 (AC-F1-16) |
