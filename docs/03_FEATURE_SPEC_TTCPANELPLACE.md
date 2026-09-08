# TTC CAD — Feature Specification: TTCPANELPLACE (Smart Component Insert)

Status: DRAFT (PROPOSED_FOR_FREEZE)  
Tranche ID: P2  
Module: PANEL  
Capability: Component Placement / TTCPANELPLACE  
Feature ID: SPEC-PANEL-PLACE-001  
Feature Name: Smart Component Insert  
Command(s): `TTCPANELPLACE`, `PANELPLACE`, `TTCPLACE`  
Version: 0.1.0  
Owner: Electrical / M&E Engineering Lead & AI Architectural Specialist  
Reviewer: TTC CAD Project Owner  
Date: 2026-09-08  
Depends On: Tranche F0 (AutoCAD Foundation), Tranche F1 (Common CAD Contracts), Tranche P1 (Component Library)  
Dependency State: BLOCKED_BY_F0_F1_P1  
Build Status: BLOCKED  

> **HARD BUILD GATE:** This document grants **NO implementation authority** until:
> 1. Upstream dependencies (F0, F1, P1) are `FROZEN`;
> 2. This Tranche Spec status = `FROZEN`;
> 3. An approved Work Order exists (`APPROVED_FOR_EXECUTION`).
> Modifying production code without all gates satisfied is strictly forbidden under Section 3 of `ANTIGRAVITY_INSTRUCTIONS.md`.

---

## 1. Authority / Traceability

- **Intake:** [`01_INTAKE_TTCPANELPLACE.md`](./01_INTAKE_TTCPANELPLACE.md) (Version 1.0, Status: `PENDING_HUMAN_CONFIRMATION`).
- **Design Evidence:** [`02_DESIGN_TTCPANELPLACE.md`](./02_DESIGN_TTCPANELPLACE.md) (Version 1.0, Status: `PROPOSED_DESIGN`).
- **Tranche Roadmap:** [`TRANCHE_ROADMAP.md`](./tranches/TRANCHE_ROADMAP.md) (Tranche P2).
- **Tranche Status Register:** [`TRANCHE_STATUS.md`](./tranches/TRANCHE_STATUS.md).
- **Decision Records:** `D-PANEL-001` through `D-PANEL-006` (Status: `PROPOSED`), `TTC-GOV-001` (`APPROVED_BY_OPERATOR_INSTRUCTION` in [`../governance/DECISION_LOG.md`](../governance/DECISION_LOG.md)).
- **Governance Doctrine:** [`../governance/ANTIGRAVITY_INSTRUCTIONS.md`](../governance/ANTIGRAVITY_INSTRUCTIONS.md).
- **Architecture Roadmap:** [`TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md`](./TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md) — Sections 13 (`Smart Component Insert`), 14 (`Clearance Envelope`).

### 1.1. Cross-Feature Technical Values Classification (F1 Audit)

Per governance migration doctrine, cross-feature technical assumptions in this P2 specification are audited and classified as follows:

| Technical Parameter | Current Proposed Value | Classification | Authority Ownership & Status |
|---|---|---|---|
| **Drawing Units** | Millimeters (`INSUNITS = 4`) | `F1-COMMON-CONTRACT` | **PROPOSED** — Authority belongs to Tranche F1 (Units & Tolerance Contract). P2 must inherit final F1 value. |
| **Geometric Tolerance** | $\varepsilon = 1.0 \times 10^{-4}\text{ mm}$ | `F1-COMMON-CONTRACT` | **PROPOSED** — Authority belongs to Tranche F1 (Units & Tolerance Contract). P2 must inherit final F1 value. |
| **Metadata Storage** | `ExtensionDictionary` (`XRecord`) | `F1-COMMON-CONTRACT` | **PROPOSED** — Authority belongs to Tranche F1 (Metadata Lifecycle Contract). P2 inherits F1 schema. |
| **Native COPY Identity Repair** | Generate fresh GUID on copy | `F1-COMMON-CONTRACT` | **PROPOSED** — Authority belongs to Tranche F1 (CAD Object Identity Contract). |
| **Standard Layers & Non-Plot** | `TTC-PANEL-EQUIP`, `TTC-PANEL-CLEARANCE` (`IsPlottable=false`) | `F1-COMMON-CONTRACT` / `C1-CAD-STANDARDS` | **PROPOSED** — Authority belongs to F1/C1 Layer Management. |
| **DIN Rail Snap Capture Radius** | $R_{snap} = 25.0\text{ mm}$ | `P2-SPECIFIC` | Bounded to component placement behavior. |
| **5-Sided Clearance Boundary** | `Top, Bottom, Left, Right, Front` | `P2-SPECIFIC` | Bounded to component footprint definition. |
| **Procedural Block Fallback** | Generate from $W \times H$ if DWG missing | `PROPOSED_PRODUCT_DECISION` | P2-specific resilience fallback. |
| **External Block Path Structure** | `assets/blocks/components/{id}.dwg` | `PROPOSED_PRODUCT_DECISION` | Pending F1/Admin library path convention. |

---

## 2. Objective

Provide the electrical/M&E design engineer with a native AutoCAD 2023 managed command (`TTCPANELPLACE`) to place verified 2D mechanical footprints of panel devices at exact 1:1 metric millimeter scale on layer `TTC-PANEL-EQUIP`, generate non-plot clearance boundaries on layer `TTC-PANEL-CLEARANCE`, snap to DIN rails when applicable, and persist canonical TTC metadata in an `XRecord`, with zero electrical schematic tags or EPLAN synchronization.

---

## 3. Preconditions

1. AutoCAD 2023 is running with an active, initialized document (`doc != null`).
2. The active drawing's database is editable (not read-only).
3. The active document is set to ModelSpace (`doc.Database.CurrentSpaceId == SymbolUtilityServices.GetBlockModelSpaceId(db)`).
4. The component catalog (`catalog.json`) is loaded and contains at least one active component definition.
5. Layers `TTC-PANEL-EQUIP` and `TTC-PANEL-CLEARANCE` (if already existing) are not locked.

---

## 4. In Scope

- Execution via AutoCAD command `TTCPANELPLACE` (and aliases `PANELPLACE`, `TTCPLACE`) and Palette `[Insert]` button.
- Optional CLI argument `TTCPANELPLACE [ComponentId]`.
- Dynamic interactive Jig rendering 1:1 footprint ghost and dashed clearance envelope.
- Intelligent DIN rail snapping for components with `MountingType == DIN_RAIL` when cursor is within $25.0\text{ mm}$ of a recognized DIN rail centerline.
- Insertion of standard AutoCAD `BlockReference` on designated layer `TTC-PANEL-EQUIP`.
- Automatic generation of closed 2D `Polyline` representing the clearance envelope on dedicated non-plot layer `TTC-PANEL-CLEARANCE`.
- Attachment of canonical TTC metadata in an `XRecord` inside the `BlockReference` Extension Dictionary.
- Enforcement of 1:1 metric millimeter scale ($INSUNITS = 4$, scale factor $= (1.0, 1.0, 1.0)$).
- Atomic transaction and single undo unit per placement.
- Clean cancellation via `Esc` leaving zero residual entities.

---

## 5. Out of Scope / Non-Goals

- **NO EPLAN API integration or Master Data synchronization:** AutoCAD does not assign EPLAN device tags (e.g. `=EB1+CA1-Q1`), article numbers, or schematic terminals.
- **NO Electrical Schematics or Wire Numbering:** Footprints represent physical dimensions only; no wiring logic.
- **NO Automatic Cabinet Sizing:** Enclosure evaluation belongs to `TTCPANELSIZE`.
- **NO 3D Solid Model Generation:** 2D mechanical drafting with 2.5D depth metadata.
- **NO Real-Time Thermal CFD:** Physical clearance envelope evaluation only; no heat flow calculation.

---

## 6. User Workflow Contract

1. **User triggers placement:** User clicks `[Insert]` on a selected component in the Component Palette or types `TTCPANELPLACE <ComponentId>` in the AutoCAD command line.
2. **System validates component and starts Jig:** System verifies the component exists, acquires document lock, resolves the block definition, and starts `ComponentPlacementJig`.
3. **User moves cursor:** AutoCAD displays dynamic ghost preview showing the physical footprint rectangle and the dashed clearance boundary tracking the cursor.
4. **Assisted snapping (if applicable):** If the component is DIN-rail mountable and the cursor moves within $25.0\text{ mm}$ of an existing DIN rail, the Jig automatically locks the Y-coordinate to the rail centerline and displays a visual snap indicator.
5. **User confirms insertion point:** User left-clicks in ModelSpace.
6. **System commits placement:**
   - Starts single transaction.
   - Ensures layers `TTC-PANEL-EQUIP` and `TTC-PANEL-CLEARANCE` exist.
   - Appends `BlockReference` at selected WCS coordinates on `TTC-PANEL-EQUIP`.
   - Appends clearance `Polyline` on `TTC-PANEL-CLEARANCE`.
   - Attaches `XRecord` (`TTC_PANEL_DATA`) to the `BlockReference`.
   - Links clearance `Polyline` to `BlockReference`.
   - Commits transaction.
7. **System feedback:** Status bar displays `Placed <Model> at (<X>, <Y>)`. Command terminates (single-shot) and returns to `IDLE`.

---

## 7. Interaction State Machine

```text
               ┌───────────────────────┐
               │         IDLE          │◄────────────────────────────────┐
               └───────────┬───────────┘                                 │
                           │ [Event: TriggerPlacement]                   │
                           │ [Guard: Valid ComponentId & Doc Available]  │
                           ▼                                             │
               ┌───────────────────────┐                                 │
               │      JIG_PLACING      │                                 │
               └─────┬───────────┬─────┘                                 │
                     │           │ [Event: KeyPress_Esc / RightClick_Cancel]
                     │           │ [Guard: True]                         │
                     │           ▼                                       │
                     │   ┌───────────────┐                               │
                     │   │   CANCELLED   │───────────────────────────────┤ (0 entities written)
                     │   └───────────────┘                               │
                     │ [Event: LeftClick_Point]                          │
                     │ [Guard: Point != null]                            │
                     ▼                                                   │
               ┌───────────────────────┐                                 │
               │      COMMITTING       │                                 │
               └─────┬───────────┬─────┘                                 │
                     │           │ [Event: Exception / LayerLocked]      │
                     │           │ [Guard: DB Error]                     │
                     │           ▼                                       │
                     │   ┌───────────────┐                               │
                     │   │    ABORTED    │───────────────────────────────┤ (Rollback)
                     │   └───────────────┘                               │
                     │ [Event: TransactionCommitted]                     │
                     │ [Guard: Success]                                  │
                     ▼                                                   │
               ┌───────────────────────┐                                 │
               │       COMMITTED       │─────────────────────────────────┘
               └───────────────────────┘
```

| Current State | Event | Guard | Action | Next State | Observable Feedback |
|---|---|---|---|---|---|
| **IDLE** | `TriggerPlacement` | Component ID valid & drawing writable | Resolve block; start Jig | `JIG_PLACING` | Cursor acquires ghost preview; CLI: `Specify insertion point:` |
| **IDLE** | `TriggerPlacement` | Component ID invalid | Log error; reject | `IDLE` | CLI: `Error: Component ID not found.` |
| **IDLE** | `TriggerPlacement` | Drawing is read-only | Log error; reject | `IDLE` | CLI / Alert: `Error: Drawing is read-only.` |
| **JIG_PLACING** | `MouseMove` | Cursor $\le 25\text{ mm}$ of DIN rail & `MountingType == DIN_RAIL` | Lock Y to rail centerline; draw snap glyph | `JIG_PLACING` | Ghost snaps to rail; magenta snap glyph displayed |
| **JIG_PLACING** | `MouseMove` | Cursor $> 25\text{ mm}$ of DIN rail | Free cursor tracking | `JIG_PLACING` | Ghost tracks raw mouse coordinates |
| **JIG_PLACING** | `KeyPress_Esc` | None | Destroy Jig; clean up | `CANCELLED` | Status bar: `Placement cancelled.`; returns to `IDLE` |
| **JIG_PLACING** | `LeftClick_Point` | Valid WCS point | End Jig; open transaction | `COMMITTING` | Status bar: `Inserting component...` |
| **COMMITTING** | `TransactionCommitted` | All entities written & valid | Commit transaction | `COMMITTED` | CLI: `Component <Model> inserted successfully.`; returns to `IDLE` |
| **COMMITTING** | `Exception` | Layer locked or DB error | `Transaction.Abort()` | `ABORTED` | CLI: `Error: Placement aborted. <Reason>`; returns to `IDLE` |

---

## 8. Command Contract

### Command Identity
- **Command Name:** `TTCPANELPLACE`
- **Aliases:** `PANELPLACE`, `TTCPLACE`
- **Requires Active Document:** `YES`
- **Allowed in Read-Only Drawing:** `NO` (Command rejects immediately with user message).

### Prompt Sequence

| Step | Prompt | Accepted Input | Invalid Input Behavior | Cancel Behavior |
|:---:|---|---|---|---|
| **1** | `Select component or enter ID <default>: ` (only if invoked via CLI without arguments) | String (Component ID) or Enter (default) | Reprompt: `Invalid component ID. Try again: ` | Pressing `Esc` terminates command. |
| **2** | `Specify insertion point or [Rotation/Cancel]: ` | 2D/3D Point click, coordinate string `X,Y`, or keyword `R`/`C` | Reprompt: `Point or option keyword required.` | Pressing `Esc` destroys Jig, writes 0 entities, exits to `IDLE`. |
| **3** | `Specify rotation angle <0>: ` (if `Rotation` chosen) | Numerical angle in degrees ($0, 90, 180, 270$) | Error: `Invalid angle. Must be 0, 90, 180, or 270.`; reprompts. | Pressing `Esc` reverts to Step 2. |

### Completion Result
- **Entities Created:**
  1. One `BlockReference` appended to ModelSpace on layer `TTC-PANEL-EQUIP`.
  2. One closed lightweight `Polyline` appended to ModelSpace on layer `TTC-PANEL-CLEARANCE`.
- **Metadata Created:**
  - One `XRecord` named `TTC_PANEL_DATA` attached to `BlockReference.ExtensionDictionary`.
  - One `XRecord` named `TTC_PANEL_LINK` attached to `Polyline.ExtensionDictionary` storing `BLOCK_HANDLE`.
- **UI / CLI Result:** CLI outputs `Component [Manufacturer] [Model] placed at (X: {X:F1}, Y: {Y:F1}).`.

---

## 9. Inputs

| Input ID | Name | Type / Unit | Required | Validation | Source |
|:---:|---|---|:---:|---|---|
| **IN-01** | `ComponentId` | String | YES | Must match an active record in `catalog.json`. | Palette selection or CLI argument. |
| **IN-02** | `InsertionPoint` | `Point3d` (WCS, mm) | YES | Valid 2D point on $Z = 0.0$ plane. | User mouse pick or CLI coordinates. |
| **IN-03** | `RotationAngle` | Double (Degrees) | NO | One of $0^\circ, 90^\circ, 180^\circ, 270^\circ$ (default: $0^\circ$). | CLI prompt or Palette property. |
| **IN-04** | `ActiveDocument` | `Document` | YES | `doc != null` and `doc.IsReadOnly == false`. | AutoCAD Host Application. |
| **IN-05** | `DrawingUnits` | `INSUNITS` Int | YES | Must be `4` (Millimeters). | Active AutoCAD database header. |

---

## 10. Outputs

| Output ID | Output Entity / Data | Type / Representation | Required Properties |
|:---:|---|---|---|
| **OUT-01** | Physical Footprint | AutoCAD `BlockReference` | Layer: `TTC-PANEL-EQUIP`, Scale: $(1.0, 1.0, 1.0)$, Rotation: $0.0$, Color: `ByLayer`. |
| **OUT-02** | Clearance Envelope | AutoCAD `Polyline` (Lightweight 2D) | Layer: `TTC-PANEL-CLEARANCE`, Closed: `true`, Linetype: `DASHED` or `HIDDEN`, Non-plot: `IsPlottable = false`. |
| **OUT-03** | Canonical Metadata | AutoCAD `XRecord` (`TTC_PANEL_DATA`) | Contains all required metadata keys listed in Section 12. |
| **OUT-04** | Clearance Link | AutoCAD `XRecord` (`TTC_PANEL_LINK`) | Contains parent `BlockReference` Handle string. |

---

## 11. CAD Object Contract

### Object Representation
- **Physical Footprint:** AutoCAD `BlockReference`.
  - Layer: `TTC-PANEL-EQUIP` (Color: 7 / White, Linetype: `Continuous`).
  - Block definition: If external `.dwg` exists at `BlockPath`, load into `BlockTable`; otherwise generate procedurally as a rectangular footprint with mounting centerlines and cross marks.
  - Scale: Strictly $(1.0, 1.0, 1.0)$ uniform scale.
- **Clearance Envelope:** AutoCAD `Polyline` (2D Lightweight closed).
  - Layer: `TTC-PANEL-CLEARANCE` (Color: 8 / Gray or 250, Linetype: `DASHED`, `IsPlottable = false`).
  - Closed boundary wrapping footprint with required clearance offsets.

### Identity
- **Canonical TTC Object ID:** String formatted as `TTC-COMP-{GUID}` (e.g. `TTC-COMP-4F8A3B21-9E8D-4A23-8B77-1C2D3E4F5A6B`).
- **Creation Rule:** Generated at placement time using standard .NET `Guid.NewGuid().ToString("D").ToUpper()`.
- **Persistence Rule:** Stored inside `TTC_PANEL_DATA` XRecord. Never regenerated on normal drawing save/reopen.

### Lifecycle Semantics

| Operation | Required Behavior |
|---|---|
| **MOVE** | Moving the `BlockReference` using TTC arrangement tools (`TTCALIGN`, etc.) moves both footprint and clearance polyline. (If moved via native vanilla AutoCAD `MOVE`, clearance polyline position must be updated or re-synced upon next command invocation or QA check). |
| **ROTATE** | Allowed rotations: $0^\circ, 90^\circ, 180^\circ, 270^\circ$. Clearance envelope rotates synchronously around block insertion origin. |
| **SCALE** | **FORBIDDEN.** Scale must remain strictly $(1.0, 1.0, 1.0)$. Manual scaling is flagged as non-compliant by QA checker. |
| **COPY** | Native `COPY` duplicates the `BlockReference`. Upon detection by TTC tools, a duplicate `TTC_OBJECT_ID` is assigned a fresh unique GUID to maintain identity uniqueness. |
| **ERASE** | Erasing the `BlockReference` causes TTC event handlers or cleanup utilities to remove the associated clearance `Polyline`. |
| **UNDO** | `UNDO` cleanly removes both `BlockReference` and `Polyline` in a single undo step. |
| **REDO** | `REDO` cleanly restores both entities and metadata. |
| **SAVE / REOPEN** | Standard DWG persistence. All entities remain 100% readable in vanilla AutoCAD with zero proxy warnings. |
| **WBLOCK / INSERT** | Preserves Extension Dictionary and XRecords intact. |

---

## 12. Metadata / Persistence Contract

The component metadata is stored in an `XRecord` named `TTC_PANEL_DATA` in the `BlockReference.ExtensionDictionary`.

| Key (DxfCode.Text / ExtendedType) | Data Type | Required | Sample Value | Description |
|---|---|:---:|---|---|
| `TTC_SCHEMA_VERSION` | String | YES | `1.0.0` | Schema version for future migration. |
| `TTC_OBJECT_TYPE` | String | YES | `PANEL_COMPONENT` | Object discriminator. |
| `TTC_OBJECT_ID` | String | YES | `TTC-COMP-4F8A3B21-...` | Unique persistent object ID. |
| `TTC_LIBRARY_ID` | String | YES | `vfd-schneider-atv320-075kw` | Catalog component ID. |
| `TTC_LIBRARY_VERSION` | String | YES | `1.0.0` | Catalog release version. |
| `MANUFACTURER` | String | NO | `Schneider Electric` | Vendor name. |
| `MODEL` | String | YES | `ATV320U07N4B` | Model number. |
| `CATEGORY` | String | YES | `VFD` | Component category. |
| `MOUNTING_TYPE` | String | YES | `DIN_RAIL` | `DIN_RAIL`, `MOUNTING_PLATE`, etc. |
| `WIDTH` | Double | YES | `180.0` | Physical footprint width (mm). |
| `HEIGHT` | Double | YES | `300.0` | Physical footprint height (mm). |
| `DEPTH` | Double | YES | `210.0` | Physical depth for 2.5D check (mm). |
| `CLEARANCE_TOP` | Double | YES | `100.0` | Top thermal clearance (mm). |
| `CLEARANCE_BOTTOM` | Double | YES | `100.0` | Bottom thermal clearance (mm). |
| `CLEARANCE_LEFT` | Double | YES | `50.0` | Side clearance (mm). |
| `CLEARANCE_RIGHT` | Double | YES | `50.0` | Side clearance (mm). |
| `CLEARANCE_FRONT` | Double | YES | `10.0` | Door clearance (mm). |
| `CLEARANCE_HANDLE` | String | YES | `2A4F` | AutoCAD Handle of linked clearance Polyline. |

- **Storage Mechanism:** AutoCAD Extension Dictionary (`ExtensionDictionary`) with typed `ResultBuffer` entries.
- **Migration Policy:** If `TTC_SCHEMA_VERSION` is older than current version upon read, backward-compatibility adapter upgrades record in memory.
- **Missing / Corrupt Metadata:** If `XRecord` is missing, entity is treated as an unmanaged standard block; QA inspector offers "Register as TTC Component" option.

---

## 13. Engineering Rules

### RULE-PANEL-01 — True Metric Scale Rule
- **Purpose:** Ensure all mechanical footprints match exact physical millimeter dimensions.
- **Applies to:** Placed `BlockReference`.
- **Inputs:** `BlockReference.ScaleFactors`, Drawing `INSUNITS`.
- **Calculation / Logic:**
  $$\text{ScaleX} == 1.0 \land \text{ScaleY} == 1.0 \land \text{ScaleZ} == 1.0 \land \text{INSUNITS} == 4$$
- **PASS Condition:** Scale factors are exactly $(1.0, 1.0, 1.0)$ and drawing units are Millimeters ($4$).
- **WARNING Condition:** `INSUNITS != 4` but block scale normalized to equivalent mm.
- **FAIL Condition:** Scale factor $\neq (1.0, 1.0, 1.0)$ or non-uniform scale.
- **Severity:** `BLOCKING_ERROR` on placement; `FAIL` in QA inspection.
- **Tolerance:** $\Delta \le 1.0 \times 10^{-4}$.
- **User-Facing Message:** `Error: Footprint scale factor distorted. True 1:1 metric scale required.`
- **Remediation:** Reset scale factors to $(1.0, 1.0, 1.0)$.

### RULE-PANEL-02 — Clearance Envelope Construction Rule
- **Purpose:** Construct exact rectangular clearance boundary surrounding device footprint.
- **Applies to:** Placed clearance `Polyline`.
- **Inputs:** Insertion point $(X_0, Y_0)$, `Width` ($W$), `Height` ($H$), `Clearance` ($T, B, L, R$).
- **Calculation / Logic:**
  Assuming footprint baseline origin at bottom-left $(X_0, Y_0)$:
  $$\text{Corner}_1 = (X_0 - L, Y_0 - B)$$
  $$\text{Corner}_2 = (X_0 + W + R, Y_0 - B)$$
  $$\text{Corner}_3 = (X_0 + W + R, Y_0 + H + T)$$
  $$\text{Corner}_4 = (X_0 - L, Y_0 + H + T)$$
- **PASS Condition:** Closed 2D lightweight Polyline created through corners 1 to 4 and closed.
- **WARNING Condition:** None.
- **FAIL Condition:** Polyline cannot be created or coordinates are non-numeric (`NaN`).
- **Severity:** `BLOCKING_ERROR`.
- **Tolerance:** $\varepsilon = 1.0 \times 10^{-4}\text{ mm}$.
- **User-Facing Message:** `Error: Failed to construct clearance boundary.`
- **Remediation:** Re-verify catalog clearance numerical values.

### RULE-PANEL-03 — DIN Rail Elevation Snapping Rule
- **Purpose:** Assist accurate alignment of rail-mounted equipment to DIN rail centerline.
- **Applies to:** Insertion point calculation during `JIG_PLACING`.
- **Inputs:** Cursor point $P_{cursor}(X_c, Y_c)$, `MountingType`, Nearby DIN rails $R_i$.
- **Calculation / Logic:**
  For each horizontal DIN rail $R_i$ with centerline elevation $Y_{rail}$ and bounds $[X_{start}, X_{end}]$:
  $$\text{Distance} = |Y_c - Y_{rail}|$$
  If $X_{start} \le X_c \le X_{end}$ and $\text{Distance} \le R_{snap}$ ($25.0\text{ mm}$):
  $$Y_{snapped} = Y_{rail} - \frac{H}{2} \quad (\text{or rail mounting offset})$$
- **PASS Condition:** Insertion point Y locked to rail mount line when within $25.0\text{ mm}$.
- **WARNING Condition:** None.
- **FAIL Condition:** Snapping fails to lock when cursor is within threshold.
- **Severity:** `USABILITY_DEFECT`.
- **Tolerance:** Snap capture radius $R_{snap} = 25.0\text{ mm}$.
- **User-Facing Message:** Visual snap glyph rendered on DIN rail centerline.
- **Remediation:** Adjust cursor closer to rail or disable snap with Shift key.

### RULE-PANEL-04 — Layer Segregation and Non-Plot Rule
- **Purpose:** Ensure separation of physical equipment from virtual clearance linework.
- **Applies to:** Layers `TTC-PANEL-EQUIP` and `TTC-PANEL-CLEARANCE`.
- **Inputs:** Active AutoCAD `LayerTable`.
- **Calculation / Logic:**
  - `TTC-PANEL-EQUIP` must exist, `IsPlottable == true`.
  - `TTC-PANEL-CLEARANCE` must exist, `IsPlottable == false`.
- **PASS Condition:** Layers exist with required properties and entities assigned `ByLayer`.
- **WARNING Condition:** Layer existed with wrong plot property; auto-corrected to `IsPlottable = false`.
- **FAIL Condition:** Layer is locked or cannot be created.
- **Severity:** `BLOCKING_ERROR`.
- **Tolerance:** Exact string match.
- **User-Facing Message:** `Error: Cannot create or access target layer [LayerName]. Layer may be locked.`
- **Remediation:** Unlock target layer in AutoCAD Layer Properties Manager.

---

## 14. Geometry / Units / Tolerance Contract

- **Internal Unit:** Millimeters ($1.0 = 1.0\text{ mm}$).
- **Drawing-Unit Conversion:** Active drawing `INSUNITS` must be `4` (Millimeters). If `INSUNITS == 0` (Unspecified), command sets or prompts to set `INSUNITS = 4`.
- **Coordinate Space:** World Coordinate System (WCS). All points transformed to WCS prior to database commit.
- **Angle Convention:** Radians internally, degrees in UI ($0^\circ, 90^\circ, 180^\circ, 270^\circ$). Counter-clockwise positive.
- **Numerical Precision:** 64-bit IEEE double floating-point (`double`).
- **Geometry Tolerance:** $\varepsilon = 1.0 \times 10^{-4}\text{ mm}$.
- **Broad-Phase Representation:** 2D Axis-Aligned Bounding Box (`Extents2d`).
- **Exact-Check Representation:** Planar polygon boundary geometry.
- **Touching / Intersection Semantics:**
  - Boundary touch: Distance between boundaries $\le 1.0 \times 10^{-4}\text{ mm}$ is considered **touching / adjacent** (`PASS`).
  - Boundary overlap: Area of intersection $> 1.0 \times 10^{-4}\text{ mm}^2$ is considered an **overlap / clash** (`VIOLATION`).
- **Non-Uniform Scale Handling:** Rejected unconditionally ($X_{scale} == Y_{scale} == Z_{scale} == 1.0$).
- **Mirrored Block Handling:** Negative scale factors (mirroring) are **FORBIDDEN** for panel components (physical equipment cannot be mirrored).

---

## 15. AutoCAD Host Behavior Contract

| Host Concern | Required Behavior |
|---|---|
| **Active Document** | Must verify `Application.DocumentManager.MdiActiveDocument != null`. Abort if null. |
| **Document Lock** | Modeless Palette UI calls must wrap database operations in `using (doc.LockDocument())`. |
| **Transaction Boundary** | All entity creation, table updates, and metadata writes must occur inside one single `using (Transaction tr = db.TransactionManager.StartTransaction())`. |
| **Undo Group** | The transaction boundary forms a single atomic Undo step. Typing `UNDO` reverses footprint, clearance, and metadata simultaneously. |
| **Cancel / Rollback** | If user cancels (e.g. presses `Esc`), Jig terminates, transaction is never committed, and zero entities exist in the database. |
| **Locked Layer** | If `TTC-PANEL-EQUIP` or `TTC-PANEL-CLEARANCE` is locked, command reports clear error and rolls back without modifying drawing. |
| **Read-Only Drawing** | Command checks `db.IsReadOnly`. If true, displays error and terminates before user picks a point. |
| **Erased / Invalid Object** | When referencing DIN rails for snapping, check `rail.IsErased` before computing snap coordinates. |
| **Document Close During Operation** | Unhook Jig and palette event handlers gracefully; suppress secondary exceptions. |
| **Save / Reopen** | Footprints and clearances persist as standard DWG entities; XRecords persist in Extension Dictionary. |
| **Exception Handling** | All unhandled exceptions inside command handler are logged to structured file logger and displayed to user as concise error message; transaction calls `Abort()`. |

---

## 16. Undo / Redo / Cancel

### Undo
- **One Logical Operation:** One component placement ($1 \times \text{BlockReference} + 1 \times \text{Polyline} + 1 \times \text{XRecord}$).
- **State Restored:** Drawing database is restored to the exact state prior to placement. All entities and dictionary entries are removed.

### Redo
- **Required Behavior:** AutoCAD native `REDO` restores both entities and metadata completely.

### Cancel
- **Events That Cancel:**
  1. User presses `Esc` during Jig placement.
  2. User right-clicks and chooses `Cancel` from context menu.
  3. User enters `C` or `Cancel` at command line.
- **Entities Allowed to Remain After Cancel:** `NONE` (Zero entities, zero layers created if transaction aborted).
- **Temporary Graphics Cleanup:** `ComponentPlacementJig` cleans up all transient graphics and memory on cancel.

---

## 17. Errors and User Feedback

| Error ID | Condition | Severity | Message / Feedback | Mutation Allowed? | Recovery |
|:---:|---|:---:|---|:---:|---|
| **ERR-01** | No active document open in AutoCAD. | `BLOCKING_ERROR` | `No active drawing. Open a DWG to place components.` | **NO** | Abort command. |
| **ERR-02** | Active drawing is read-only. | `BLOCKING_ERROR` | `Active drawing is read-only. Cannot insert component.` | **NO** | Abort command. |
| **ERR-03** | Requested Component ID not found in library. | `BLOCKING_ERROR` | `Component ID '[Id]' not found in catalog.` | **NO** | Reprompt or return to IDLE. |
| **ERR-04** | Target layer is locked. | `BLOCKING_ERROR` | `Target layer '[LayerName]' is locked. Unlock to insert.` | **NO** | Rollback transaction. |
| **ERR-05** | Drawing units not millimeters (`INSUNITS != 4`). | `WARNING` | `Drawing units are not millimeters (INSUNITS = {val}). Standardizing to mm.` | **YES** | Set `INSUNITS = 4` or scale accordingly. |
| **ERR-06** | Unexpected database exception during commit. | `BLOCKING_ERROR` | `Internal database error during placement: {ExceptionMessage}` | **NO** | Abort transaction; log stack trace. |

---

## 18. Negative Cases

| NC ID | Given | When | Expected Result | Data/Drawing Mutation | AC Link |
|:---:|---|---|---|:---:|:---:|
| **NC-01** | No document open in AutoCAD | User invokes `TTCPANELPLACE` | Error message displayed; command aborts | `NONE` | AC-06 |
| **NC-02** | Drawing is open as Read-Only | User triggers placement | Error message displayed; command aborts | `NONE` | AC-06 |
| **NC-03** | User triggers placement, Jig active | User presses `Esc` | Placement cancelled; status bar reports cancel | `NONE` | AC-05 |
| **NC-04** | Layer `TTC-PANEL-EQUIP` is locked | User clicks insertion point | Error message displayed; transaction aborted | `NONE` | AC-06 |
| **NC-05** | Invalid Component ID `xyz-nonexistent` | CLI invoked: `TTCPANELPLACE xyz-nonexistent` | Error message displayed; Jig does not start | `NONE` | AC-07 |
| **NC-06** | Database exception occurs during write | Commit attempted | Transaction aborts; error logged to file | `NONE` | AC-06 |

---

## 19. Invariants

- **INV-01 (Zero Residue on Cancel):** If placement is cancelled or aborted at any point before commit, exactly zero entities, layers, or dictionary entries remain in the drawing.
- **INV-02 (Canonical Identity Uniqueness):** Every successfully placed component has a unique non-null `TTC_OBJECT_ID` GUID.
- **INV-03 (Standard DWG Usability):** Placed DWG files contain 0 custom ObjectARX proxy entities and can be opened in vanilla AutoCAD 2023 without warnings.
- **INV-04 (True Metric Scale):** The `BlockReference` scale factors must always evaluate to $(1.0, 1.0, 1.0)$ in millimeter drawing space.
- **INV-05 (Non-Plot Clearance):** Layer `TTC-PANEL-CLEARANCE` must have `IsPlottable = false` in all supported scenarios.
- **INV-06 (Atomic Undo):** One `UNDO` command removes both footprint block and clearance polyline.

---

## 20. Performance / Capacity Requirements

| PERF ID | Scenario | Target | Measurement Method |
|:---:|---|:---:|---|
| **PERF-01** | Placement Jig responsiveness | $\ge 30\text{ FPS}$ during cursor drag | Frame time measurement during `DrawJig` rendering in dense drawing (100 components). |
| **PERF-02** | Transaction commit duration | $< 100\text{ ms}$ from point pick to commit | Stopwatch timing of placement transaction in AutoCAD 2023. |
| **PERF-03** | Drawing load / reopen impact | $< 50\text{ ms}$ overhead | Difference in DWG open time between clean panel DWG and populated DWG. |

---

## 21. Acceptance Criteria

### AC-01 — Valid Component Placement
**Given** an open, writable metric drawing in AutoCAD 2023 with `catalog.json` loaded,  
**When** the user invokes `TTCPANELPLACE` with valid component ID `vfd-schneider-atv320-075kw` and clicks point $(200, 350)$,  
**Then** an AutoCAD `BlockReference` is created at $(200, 350)$ on layer `TTC-PANEL-EQUIP` with scale $(1.0, 1.0, 1.0)$,  
**And** an AutoCAD `Polyline` is created on layer `TTC-PANEL-CLEARANCE` representing the bounding box plus clearances ($Top=100, Bottom=100, Left=50, Right=50$),  
**And** layer `TTC-PANEL-CLEARANCE` has `IsPlottable == false`.

### AC-02 — Persistent Metadata Attachment
**Given** a successfully placed component from AC-01,  
**When** the drawing is saved, closed, and reopened in AutoCAD,  
**Then** the `BlockReference` contains an `ExtensionDictionary` with an `XRecord` named `TTC_PANEL_DATA`,  
**And** the `XRecord` contains valid entries for `TTC_OBJECT_ID`, `TTC_LIBRARY_ID`, `CATEGORY`, `WIDTH`, `HEIGHT`, and `DEPTH`.

### AC-03 — DIN Rail Snapping Assist
**Given** a horizontal DIN rail exists at centerline elevation $Y = 400.0\text{ mm}$ spanning from $X = 100$ to $X = 700$,  
**When** placing a DIN-rail mountable component (`MountingType == DIN_RAIL`) and cursor position is $(300, 412)$,  
**Then** the Jig locks the insertion elevation to the DIN rail centerline,  
**And** a visual snap indicator is rendered at the rail intersection.

### AC-04 — Single Undo Unit
**Given** a component has just been placed via AC-01,  
**When** the user executes the AutoCAD `UNDO` command,  
**Then** both the `BlockReference` and the clearance `Polyline` are removed from the drawing in one single undo step,  
**And** no residual dictionary entries or unreferenced entities remain in ModelSpace.

### AC-05 — Clean Cancel via Esc
**Given** the placement Jig is active and tracking cursor coordinates,  
**When** the user presses `Esc`,  
**Then** the command terminates immediately,  
**And** exactly 0 entities, 0 layers, and 0 dictionary records are committed to the drawing database.

### AC-06 — Read-Only / Locked Layer Rejection
**Given** an active drawing where layer `TTC-PANEL-EQUIP` is locked (or drawing is read-only),  
**When** the user attempts to place a component,  
**Then** the command displays a clear error message and cleanly aborts,  
**And** zero drawing mutations occur.

### AC-07 — Invalid Component ID Rejection
**Given** an invalid component ID `non-existent-device-999`,  
**When** invoked via `TTCPANELPLACE non-existent-device-999`,  
**Then** the command prints `Error: Component ID 'non-existent-device-999' not found in catalog.` and does not start the Jig.

### AC-08 — Zero ECAD / EPLAN Contamination
**Given** a component placed via `TTCPANELPLACE`,  
**When** inspecting block attributes, XRecords, and DWG entity linework,  
**Then** no EPLAN tags (e.g. `=EB1+CA1-Q1`), wire numbers, or electrical schematic symbols are created.

---

## 22. Acceptance Test Matrix

| AC ID | Test Type | Test Scenario / Setup | Expected Evidence | Status |
|:---:|---|---|---|:---:|
| **AC-01** | Integration / Manual AutoCAD | S01 Empty Panel; place VFD ATV320 | Entity dump: BlockRef on `TTC-PANEL-EQUIP`, Polyline on `TTC-PANEL-CLEARANCE`. | `NOT_RUN` |
| **AC-02** | Integration / Manual AutoCAD | Save DWG, close AutoCAD, reopen DWG | XRecord dump confirms `TTC_PANEL_DATA` intact. | `NOT_RUN` |
| **AC-03** | Integration / Manual AutoCAD | S01 Empty Panel; cursor near DIN rail | Screen capture / log confirms snap lock within $25\text{ mm}$. | `NOT_RUN` |
| **AC-04** | Unit / Integration | Run placement -> execute `UNDO` | `tr.Undo()` restores clean ModelSpace count. | `NOT_RUN` |
| **AC-05** | Manual AutoCAD | Start placement -> press `Esc` | Editor reports `Placement cancelled.`; 0 entities. | `NOT_RUN` |
| **AC-06** | Integration / Manual AutoCAD | Lock `TTC-PANEL-EQUIP` -> run command | Editor prints lock error; database unchanged. | `NOT_RUN` |
| **AC-07** | Unit / Integration | Call CLI with fake ID | Command returns failure code; CLI message logged. | `NOT_RUN` |
| **AC-08** | Automated Inspection | Scan DWG entities & attributes | Zero EPLAN tag attributes or schematic references found. | `NOT_RUN` |

---

## 23. Dependencies

| Dependency | Version / Contract | Required | Failure Behavior |
|---|---|:---:|---|
| **AutoCAD 2023 Managed API** | `AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll` (24.2) | YES | Cannot load plugin; fatal host error. |
| **Component Repository** | `IComponentRepository` loading `catalog.json` | YES | Command reports catalog unavailable; disables `[Insert]`. |
| **Layer Standards Contract** | Section 34.1 (`TTC-PANEL-EQUIP`, `TTC-PANEL-CLEARANCE`) | YES | Creates missing layers dynamically on demand. |

---

## 24. Known Limitations

- **L-01:** Clearance boundary is currently generated as a rectangular bounding box. Irregular/asymmetric polygonal clearance zones are deferred to future revisions.
- **L-02:** When moving a component with native AutoCAD `MOVE`, the clearance envelope does not track dynamically in vanilla AutoCAD unless moved with TTC arrangement commands (`TTCALIGN`, etc.) or re-synced via `TTCPANELCHECK`.

---

## 25. Open Questions

| ID | Question | Disposition | Owner |
|:---:|---|:---:|:---:|
| **OQ-PANEL-01 (KU-01)** | Should the clearance boundary move synchronously when the user moves the component with vanilla AutoCAD `MOVE` command (e.g. via an AutoCAD `Group` or database reactor)? | **DEFERRED** (For initial release, clearance linked via Handle; full synchronous reactor movement deferred to Phase 1.1). | Operator / Human Lead |
| **OQ-PANEL-02 (KU-02)** | Authoritative directory structure for external `.dwg` block definitions. | **RESOLVED** (Procedural block generated from $W \times H$ by default; external override at `assets/blocks/components/{id}.dwg` if file exists). | Lead CAD Admin |
| **OQ-PANEL-03 (KU-04)** | Default placement repetition mode. | **RESOLVED** (Single-shot placement is default; continuous placement available via `[Multiple]` CLI option). | Product Owner |

---

## 26. Spec Quality Gate

### Functional
- [x] Objective is exact.
- [x] Preconditions are explicit.
- [x] In/Out scope is explicit.
- [x] Inputs and outputs are defined.

### Interaction
- [x] State transitions are explicit.
- [x] Cancel path is explicit.
- [x] Invalid-input behavior is explicit.

### CAD
- [x] Entity/object representation is explicit (`BlockReference` + `Polyline`).
- [x] Identity rules are explicit (`TTC-COMP-{GUID}`).
- [x] Move/copy/erase/save/reopen semantics are explicit.
- [x] Undo/redo/cancel are explicit.

### Engineering
- [x] Units/coordinate/tolerance are explicit (Metric mm, WCS, $\varepsilon = 10^{-4}\text{ mm}$).
- [x] Rule PASS/WARN/FAIL conditions are deterministic.
- [x] Boundary cases are defined (touching vs overlapping).

### Failure
- [x] Negative cases exist (NC-01 through NC-06).
- [x] Missing/invalid dependency behavior is defined.
- [x] Rollback/mutation behavior is defined.

### Testability
- [x] Acceptance Criteria are observable (AC-01 through AC-08 in Given/When/Then).
- [x] Every AC has an intended verification method.
- [x] No must-have behavior contains unresolved `TBD`, `TBC`, `maybe`, or unhandled A/B alternatives.

**Gate Result:** `PASS` (Spec is structurally complete and ready for human review / freeze).

---

## 27. Review / Freeze

Reviewer: TTC CAD Project Owner  
Review Disposition: `PENDING_HUMAN_REVIEW`  
Review Date: 2026-09-08  

Freeze Decision:
- **Status:** `DRAFT` (PROPOSED_FOR_FREEZE)
- **Frozen Version:** `N/A`
- **Frozen Commit / Hash:** `N/A`
- **Decision Record:** `D-PANEL-001` through `D-PANEL-006`
- **Reopen Conditions:** Any alteration to layer conventions, clearance representation, or metadata schema requires reopening `DESIGN` and updating this specification before authoring a Work Order.
