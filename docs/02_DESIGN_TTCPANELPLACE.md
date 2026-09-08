# TTC CAD — Design: TTCPANELPLACE (Smart Component Insert)

Status: PROPOSED_DESIGN  
Tranche ID: P2  
Module: PANEL  
Capability: Component Placement / TTCPANELPLACE  
Design ID: DESIGN-PANEL-001  
Version: 1.0  
Owner: Electrical / M&E Engineering Lead & AI Architectural Specialist  
Reviewer: TTC CAD Project Owner  
Date: 2026-09-08  

---

## 1. Authority / Inputs

- **Intake:** [`01_INTAKE_TTCPANELPLACE.md`](./01_INTAKE_TTCPANELPLACE.md) (Version 1.0, Status: `PENDING_HUMAN_CONFIRMATION`).
- **Tranche Roadmap:** [`TRANCHE_ROADMAP.md`](./tranches/TRANCHE_ROADMAP.md) (Tranche P2, Depends on F0, F1, P1).
- **Architecture Roadmap:** [`TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md`](./TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md) — Sections 2 (Scope Boundaries), 4 (Technology Baseline), 5 (Architectural Principles), 6 (Solution Structure), 8 (Metadata Strategy), 10 (Component Library Schema), 11 (Component Palette), 13 (Smart Component Insert), 14 (Clearance Envelope), 34 (Layer Management), 40 (Error Handling), 41 (AutoCAD Transactions), 42 (Geometry Rules).
- **Previous Decisions:** [`../governance/DECISION_LOG.md`](../governance/DECISION_LOG.md) — Decision `TTC-GOV-001`.
- **Simulator Reference & Scenarios:** `TTC-AutoCAD-Simulator` (`src/shell/Palette/ComponentPalette.tsx`, `src/drawing/DrawingCanvas/DrawingCanvas.tsx`) and [`scenarios.md`](./scenarios.md) (Scenarios S01, S02, S03, S05).
- **Governance Doctrine:** [`../governance/ANTIGRAVITY_INSTRUCTIONS.md`](../governance/ANTIGRAVITY_INSTRUCTIONS.md). *(Note: External `.CVF` template reference exists outside repository; in-repo governance authority is `ANTIGRAVITY_INSTRUCTIONS.md`).*

---

## 2. Design Objective

Define the technical design, interaction state machine, software architecture, AutoCAD drawing representation, and metadata strategy for command `TTCPANELPLACE`. This tool empowers the engineer to place 2D mechanical footprints of panel-mounted electrical devices with exact metric dimensions, non-plot clearance envelopes, and structured metadata, while preserving standard vanilla DWG compatibility and preventing electrical ECAD/EPLAN data contamination.

> **GATE NOTICE:** This design document defines the technical solution shape and resolves or exposes architectural alternatives. It does NOT grant implementation authority for production code. Implementation authority requires a `FROZEN` Feature Spec and an `APPROVED_FOR_EXECUTION` Work Order.

---

## 3. Design Principles

1. **Drawing-First Mechanical Authority:** AutoCAD owns 2D physical footprint geometry, cabinet dimensions, and physical clearance reservations.
2. **Standard DWG Usability:** Drawings must open cleanly in vanilla AutoCAD without ObjectARX proxy entity warnings or third-party enabler requirements.
3. **Dedicated Non-Plot Clearance Layer:** Clearance envelopes reside on layer `TTC-PANEL-CLEARANCE` configured with `IsPlottable = false`, preventing accidental output to production fabrication drawings.
4. **Strict Architectural Layering:** Core engineering and geometry rules must have zero dependency on AutoCAD assemblies (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`) or UI frameworks.
5. **Atomic Transactional Integrity:** One component placement corresponds to exactly one atomic AutoCAD database transaction and one single undo unit.
6. **Zero ECAD Contamination:** Under no circumstances will this tool generate EPLAN device tags (`-Q1`), wire numbers, or electrical schematic symbols.

---

## 4. Primary User Workflow

```text
[User selects Component in Palette or types TTCPANELPLACE]
                     ↓
[AutoCAD resolves Component Footprint Definition & Dimensions]
                     ↓
[Placement Jig starts: Ghost Footprint + Clearance Outline track Cursor]
                     ↓
[Cursor near DIN Rail? (if rail-mounted)]
       ├── YES: Jig snaps Y-elevation to DIN Rail Centerline
       └── NO:  Jig follows freehand cursor coordinates
                     ↓
[User clicks Insertion Point or presses Esc]
       ├── Esc: Clean cancel, 0 entities written, returns to IDLE
       └── Click: Validates layer/drawing -> Opens Transaction
                     ↓
[Commit: Creates BlockReference + Clearance Polyline + Writes XRecord]
                     ↓
[Command terminates / Palette status reports placement confirmed]
```

### Workflow Steps

| Step | User Action | Tool Response | Drawing/Data Change | Failure/Cancel Path |
|:---:|---|---|---|---|
| **1** | Clicks `[Insert]` in Component Palette or enters `TTCPANELPLACE <Id>` in CLI. | Validates component ID in library; initializes `ComponentPlacementJig`. | None yet. | If ID is invalid, CLI prints `Component ID not found` and aborts. |
| **2** | Moves cursor across AutoCAD drawing canvas. | Jig dynamically renders 1:1 footprint ghost and dashed clearance envelope. | Ephemeral graphics only (`TransientManager` or `EntityJig`). | Pressing `Esc` destroys Jig with zero drawing mutations. |
| **3** | Moves cursor within 25 mm of a horizontal DIN rail (for rail-mounted devices). | Jig snaps Y-coordinate to rail centerline and renders visual snap indicator. | Ephemeral snap glyph rendered. | User can move cursor > 25 mm away to break snap. |
| **4** | Left-clicks desired insertion point. | Captures WCS point, terminates Jig, begins atomic database transaction. | Database transaction opened. | If drawing is read-only or target layer is locked, transaction rolls back with error message. |
| **5** | Automatic completion. | Creates `BlockReference`, generates clearance `Polyline`, writes `XRecord`, commits transaction. | `BlockReference` on `TTC-PANEL-EQUIP`, `Polyline` on `TTC-PANEL-CLEARANCE`, `XRecord` attached. | On database exception, transaction calls `Abort()` and cleans up. |

---

## 5. Simulator / Scenario Evidence

| Scenario ID | Scenario Name | Simulator Observation | Design Impact | Status |
|:---:|---|---|---|:---:|
| **S01** | **Empty Panel** | Component snaps smoothly to DIN rail centerline when within capture distance; tracks horizontally along rail. | Snap-to-rail assist is mandatory for `MountingType == DIN_RAIL`. Snap distance threshold set to 25.0 mm. | **ACCEPT** |
| **S02** | **Typical Control Panel** | Realistic density with 12 devices requires distinct visual separation between physical body and clearance boundary. | Footprint lines on `TTC-PANEL-EQUIP` (continuous white/color 7); Clearance envelope on `TTC-PANEL-CLEARANCE` (hidden/dashed line, non-plot). | **ACCEPT** |
| **S03** | **Clearance Violations** | Top duct penetration and lateral drive-to-drive spacing issues require exact clearance box calculations. | Clearance envelope must be deterministically constructed from 4-quadrant offsets (`Top`, `Bottom`, `Left`, `Right`). | **ACCEPT** |
| **S04** | **Cabinet Too Small** | Placement outside usable mounting plate area should not be hard-blocked during drafting, but flagged during QA. | `TTCPANELPLACE` allows free placement on plate; placement does NOT hard-reject boundary overflow (deferred to `TTCPANELCHECK`). | **ACCEPT** |
| **S05** | **Depth Violation** | Component depth + front clearance exceeds enclosure usable depth. | Footprint metadata must persist 2.5D `Depth` and `FrontClearance` for downstream depth evaluation by `TTCPANELCHECK`. | **ACCEPT** |

---

## 6. Interaction / State Design

```text
       ┌──────────────┐
       │     IDLE     │◄─────────────────────────────────────┐
       └──────┬───────┘                                      │
              │ Component Selected / TTCPANELPLACE invoked   │
              ▼                                              │
       ┌──────────────┐                                      │
       │ JIG_PLACING  │──────────── User presses Esc ────────┤ (Zero mutations)
       └──────┬───────┘                                      │
              │ User left-clicks insertion point             │
              ▼                                              │
       ┌──────────────┐                                      │
       │  COMMITTING  │──────────── Exception / Abort ───────┤ (Rollback)
       └──────┬───────┘                                      │
              │ Transaction Commit                           │
              ▼                                              │
       ┌──────────────┐                                      │
       │  COMMITTED   │──────────────────────────────────────┘
       └──────────────┘
```

| State | Entry Condition | Allowed Actions | Exit Condition | UI / Command Feedback |
|---|---|---|---|---|
| **IDLE** | Plugin initialized or command finished. | Select component, click Palette, run CLI command. | Command triggered. | Palette enabled, command prompt: `Command:`. |
| **JIG_PLACING** | Valid component loaded; Jig initialized. | Mouse move (drag), snap toggle, left click (place), `Esc` (cancel). | Left click -> `COMMITTING`; `Esc` -> `IDLE`. | Cursor tracks ghost; CLI: `Specify insertion point:`. |
| **COMMITTING** | Left click received. | None (modal atomic database transaction). | Commit -> `COMMITTED`; Exception -> `IDLE`. | Status bar: `Inserting component...`. |
| **COMMITTED** | Transaction successfully committed. | Automatic transition back to `IDLE` (single-shot) or prompt next point (if continuous). | Immediate return to `IDLE`. | CLI: `Component <Model> inserted successfully.`. |

---

## 7. UI / Interaction Design

### Surfaces
- **AutoCAD Ribbon:** Tab `TTC ENGINEERING TOOLS` -> Panel `PANEL` -> PushButton `Insert Component` (Large icon, Tooltip: `Place mechanical footprint with clearance envelope (TTCPANELPLACE)`).
- **Modeless PaletteSet (WPF):** Tab `Panel Components` containing:
  - Search TextBox with instant filter.
  - Category Dropdown (All, VFD, PLC, Power Supply, MCCB, Contactor, Terminal, Relay).
  - Component Data Grid / Card list showing Model, Dimensions ($W \times H \times D$), Mounting Type.
  - Detail Inspection Box displaying `Clearance: Top/Bottom/Left/Right/Front`.
  - `[Insert]` Button (triggers placement of selected item).
- **Command Line (CLI):** Command `TTCPANELPLACE` supporting optional argument `TTCPANELPLACE [ComponentId]`. If omitted, prompts for ID or launches Palette selection.
- **Drawing Canvas Interaction:** Custom `DrawJig` rendering:
  - Solid rectangle of device footprint (`Width` $\times$ `Height`).
  - Dashed rectangular envelope representing `Width + Left + Right` by `Height + Top + Bottom`.
  - DIN rail snap glyph (magenta crosshair) when cursor is within 25 mm of a recognized rail.

### Selection / Focus Behavior
- When clicking `[Insert]` on the modeless WPF Palette, focus is programmatically shifted back to the AutoCAD drawing editor via `Autodesk.AutoCAD.Internal.Utils.SetFocusToDwgView()`.
- Active document lock must be acquired using `using (doc.LockDocument())` before initiating placement from the modeless palette.

### Feedback
- **Success:** Status bar updates: `Component [Model] placed at (X, Y)`. Block is highlighted.
- **Warning:** If placed outside mounting plate bounds: CLI warning `Warning: Component placed outside detected mounting plate boundary. Run TTCPANELCHECK to verify.`.
- **Blocking Error:** If drawing is read-only: Alert dialog and CLI error `Error: Active drawing is read-only. Operation aborted.`.

---

## 8. Domain Model

```text
┌────────────────────────────────────────────────────────┐
│                   PanelComponent                       │
├────────────────────────────────────────────────────────┤
│ + Id: string                                           │
│ + Category: ComponentCategory                          │
│ + Manufacturer: string                                 │
│ + Model: string                                        │
│ + Description: string                                  │
│ + Width: double (mm)                                   │
│ + Height: double (mm)                                  │
│ + Depth: double (mm)                                   │
│ + MountingType: MountingType                           │
│ + Clearance: ClearanceEnvelope                         │
│ + BlockPath: string (optional)                         │
│ + DefaultRotation: double                              │
│ + AllowRotation: bool                                  │
│ + LibraryVersion: string                               │
│ + IsActive: bool                                       │
└──────────────────────────┬─────────────────────────────┘
                           │ 1
                           ▼ 1
┌────────────────────────────────────────────────────────┐
│                 ClearanceEnvelope                      │
├────────────────────────────────────────────────────────┤
│ + Top: double (mm)                                     │
│ + Bottom: double (mm)                                  │
│ + Left: double (mm)                                    │
│ + Right: double (mm)                                   │
│ + Front: double (mm)                                   │
└────────────────────────────────────────────────────────┘
```

| Domain Object | Responsibility | Key Properties | Relationships |
|---|---|---|---|
| **PanelComponent** | Encapsulates immutable physical specifications of an industrial device footprint. | `Id`, `Category`, `Model`, `Width`, `Height`, `Depth`, `MountingType`, `LibraryVersion`. | Has 1:1 `ClearanceEnvelope`. |
| **ClearanceEnvelope** | Defines mandatory 5-sided ventilation, thermal, and maintenance clearance offsets. | `Top`, `Bottom`, `Left`, `Right`, `Front` (all in mm). | Owned by `PanelComponent`. |
| **DinRailReference** | Lightweight CAD representation of an installed DIN rail for snapping calculation. | `RailId`, `CenterLineY`, `StartX`, `EndX`, `RailType`. | Used by Placement Jig to assist positioning. |
| **PlacedComponent** | Represents an instantiated component footprint in the CAD drawing. | `TtcObjectId`, `LibraryId`, `InsertionPoint`, `Rotation`, `BlockRefHandle`, `ClearanceHandle`. | Maps to AutoCAD `BlockReference` and `Polyline`. |

---

## 9. CAD Object / Drawing Model

| Concept | Proposed AutoCAD Representation | Why | Open Questions / Trade-offs |
|---|---|---|---|
| **Physical Footprint** | `BlockReference` referencing a dedicated `BlockTableRecord` on layer `TTC-PANEL-EQUIP`. | Standard AutoCAD block allows instancing, block editing, native grips, high graphic fidelity, and 0 proxy entity footprint. | Standardized block creation (KU-02): external DWG vs procedural linework. |
| **Clearance Envelope** | Closed lightweight 2D `Polyline` on layer `TTC-PANEL-CLEARANCE` (`IsPlottable = false`, color 8 / gray, dashed line). | Independent non-plot polyline allows standard AutoCAD layer isolation (`LAYOFF`, `LAYISO`) without affecting the device body. | **KU-01**: Linkage mechanism (linked Polyline vs internal entity inside Block). |
| **TTC Metadata** | Extension Dictionary (`ExtensionDictionary`) attached to the `BlockReference` containing an `XRecord` named `TTC_PANEL_DATA`. | `XRecord` is native DWG, survives standard `WBLOCK`/`INSERT`/`COPY`, and cannot be accidentally edited by user typing in properties window. | Attribute sync vs internal XRecord. |

---

## 10. Data Flow

```text
[User selects Component in UI]
             ↓
[IPanelPlacementApplicationService.BeginPlacement(componentId)]
             ↓
[IComponentRepository.GetById(componentId)]
             ↓
[IAutoCADPlacementService.StartPlacementJig(panelComponent)]
             ↓
[AutoCAD Editor: ComponentPlacementJig renders Ghost & Snaps to Rail]
             ↓
[User clicks Point (X, Y)]
             ↓
[AutoCAD Transaction opens]
       ├── Ensure Layer 'TTC-PANEL-EQUIP' exists
       ├── Ensure Layer 'TTC-PANEL-CLEARANCE' exists (IsPlottable = false)
       ├── Resolve/Create BlockTableRecord for Component Footprint
       ├── Append BlockReference to ModelSpace on 'TTC-PANEL-EQUIP'
       ├── Calculate Clearance Polygon & Append Polyline on 'TTC-PANEL-CLEARANCE'
       ├── Attach XRecord to BlockReference (TTC_OBJECT_ID, LIBRARY_ID, etc.)
       └── Attach XRecord to Polyline linking it to BlockReference Handle
             ↓
[Transaction Commit]
             ↓
[UI / Command Line logs completion event]
```

---

## 11. Architecture / Component Boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│                       TTC.CadTools.UI                       │
│    (WPF Views, ViewModels, PaletteSet, AutoCAD Ribbon)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ depends on
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  TTC.CadTools.Application                   │
│         (Use Cases, Commands, Orchestration, DTOs)          │
└──────────────┬───────────────────────────────┬──────────────┘
               │ depends on                    │ depends on
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     TTC.CadTools.Core       │ │      TTC.CadTools.Data      │
│ (Pure Domain Models, Math,  │ │ (JSON/SQLite Repositories,  │
│    Geometry, Rules, QA)     │ │   Settings, File Storage)   │
│  [NO AUTOCAD DEPENDENCIES]  │ └─────────────────────────────┘
└─────────────────────────────┘
               ▲
               │ depends on (Adapter)
┌──────────────┴──────────────────────────────────────────────┐
│                   TTC.CadTools.AutoCAD                      │
│ (AcDbMgd, AcCoreMgd, Jigs, Layers, Transactions, XRecords)  │
└─────────────────────────────────────────────────────────────┘
```

### Boundary Table

| Component / Layer | Responsibility | May Depend On | Must Not Depend On |
|---|---|---|---|
| **TTC.CadTools.Core** | Pure domain objects, geometric bounding math, clearance sizing calculations, validation logic. | System .NET runtime libraries only. | **AutoCAD APIs** (`AcCoreMgd`, `AcDbMgd`), WPF, UI, Data access. |
| **TTC.CadTools.Application** | Application services, use case coordination, command handlers, interfaces. | `TTC.CadTools.Core`. | AutoCAD UI, WPF UI controls. |
| **TTC.CadTools.Data** | Persistence of component catalog (`catalog.json`), user settings, file repositories. | `TTC.CadTools.Core`, `TTC.CadTools.Application`. | AutoCAD database or transaction classes. |
| **TTC.CadTools.AutoCAD** | AutoCAD host adapters, transaction lifecycles, Jigs, layer creation, XRecord reading/writing. | `TTC.CadTools.Core`, `TTC.CadTools.Application`, AutoCAD Managed APIs. | WPF UI controls. |
| **TTC.CadTools.UI** | WPF PaletteSet user interface, Ribbon bindings, ViewModel event dispatching. | `TTC.CadTools.Application`, `TTC.CadTools.Core`. | Direct AutoCAD database transaction writing. |

### Dependency Direction Rule
Dependencies flow **strictly inward** toward `Core`. `Core` is 100% platform-agnostic and unit-testable without launching AutoCAD.

---

## 12. Engineering Rule Design

| Rule ID | Rule Name | Purpose | Conceptual Inputs | Outcome | Needs Exact Spec? |
|:---:|---|---|---|---|:---:|
| **RULE-PANEL-01** | **True Scale Placement** | Guarantees placed footprint matches exact physical millimeter dimensions (1 unit = 1 mm). | Block extents, `INSUNITS`, Scale factor $(1.0, 1.0, 1.0)$. | `PASS` if scale is $(1,1,1)$ and drawing unit is mm ($INSUNITS = 4$); `FAIL` otherwise. | **YES** |
| **RULE-PANEL-02** | **Clearance Envelope Construction** | Calculates rectangular clearance bounds around device footprint based on 4-sided offsets. | Footprint bounding box, `ClearanceEnvelope` (`Top`, `Bottom`, `Left`, `Right`). | Generates closed Polyline with coordinates: $(X_{min}-Left, Y_{min}-Bottom)$ to $(X_{max}+Right, Y_{max}+Top)$. | **YES** |
| **RULE-PANEL-03** | **DIN Rail Elevation Snapping** | Aligns device mounting centerline with DIN rail centerline when placed within snap threshold. | Component insertion point, `MountingType`, Nearby DIN rails, snap distance threshold ($25\text{ mm}$). | Overrides insertion Y-coordinate to DIN rail center Y. | **YES** |
| **RULE-PANEL-04** | **Layer Segregation & Non-Plot Rule** | Ensures footprint linework and clearance lines are placed on correct standardized layers with non-plot enforcement. | Target layers `TTC-PANEL-EQUIP` and `TTC-PANEL-CLEARANCE`. | `TTC-PANEL-CLEARANCE` set to `IsPlottable = false`. Entities assigned `ByLayer`. | **YES** |

---

## 13. Geometry / Units / Tolerance Design

- **Internal Engineering Unit:** Millimeters ($1.0 = 1.0\text{ mm}$).
- **Drawing Unit Conversion:** AutoCAD drawing `INSUNITS` must equal `4` (Millimeters). If `INSUNITS != 4`, system warns the user and normalizes insertion scale to achieve exact metric equivalence.
- **Coordinate System:** World Coordinate System (WCS) 2D plane ($Z = 0.0$).
- **Rotation Convention:** Radians internally, degrees in UI ($0^\circ, 90^\circ, 180^\circ, 270^\circ$). Default $= 0^\circ$.
- **Numerical Precision / Tolerance:**
  - Geometric identity tolerance: $\varepsilon = 1.0 \times 10^{-4}\text{ mm}$.
  - Snap capture tolerance: $R_{snap} = 25.0\text{ mm}$.
- **Broad-Phase Geometry Approach:** 2D Axis-Aligned Bounding Box (`Extents2d`).
- **Exact-Check Approach:** 2D Polyline polygon boundary intersection.
- **Boundary-Touch Policy:** Touching boundaries (clearance boundary perfectly touching an adjacent duct or plate edge with $\Delta \le 1.0 \times 10^{-4}\text{ mm}$) is evaluated as `PASS` (valid edge-to-edge abutment). Penetration $> 1.0 \times 10^{-4}\text{ mm}$ constitutes an overlap.

---

## 14. Persistence / Versioning Design

- **Library Source:** Local structured JSON file (`catalog.json`) loaded at plugin startup behind `IComponentRepository`.
- **Drawing Metadata Storage:** AutoCAD Extension Dictionary (`ExtensionDictionary`) attached directly to the `BlockReference` and clearance `Polyline`. Contains an `XRecord` named `TTC_PANEL_DATA`.
- **Schema Versioning:**
  - `TTC_SCHEMA_VERSION = "1.0.0"`.
  - Stored inside every written `XRecord`.
- **Behavior When Library Definition Changes:**
  - Placing a component copies its current definition into the drawing's `BlockTableRecord` and metadata.
  - If a component in `catalog.json` is updated later, existing drawings are **NOT** automatically mutated upon open (adhering to Section 37 of Roadmap).
  - Outdated components are flagged during future inspection, offering an explicit user-approved update action.

---

## 15. AutoCAD Host Integration Design

- **Document Model:** Operates on `Application.DocumentManager.MdiActiveDocument`. Validates that `doc != null` before command execution.
- **Document Locking:** Modeless WPF Palette must acquire a document lock (`using (doc.LockDocument())`) before initiating database modification.
- **Transaction Strategy:** Single `using (Transaction tr = db.TransactionManager.StartTransaction())` block per placement.
- **Undo Grouping:** The single transaction wraps the `BlockReference` creation, clearance `Polyline` creation, layer assignment, and `XRecord` attachment. In AutoCAD, `UNDO` reverses the entire placement in a single step.
- **Palette / Document Synchronization:** Palette listens to `Editor.SelectionChanged` and `Database.ObjectAppended` events to update property displays reactively.

---

## 16. Failure Design

| Failure ID | Condition | User Feedback | Mutation Allowed? | Recovery Path |
|:---:|---|---|---|---|
| **F-01** | No active document open in AutoCAD. | Toast / Dialog: `No active AutoCAD drawing. Open a DWG to insert components.`. | **NO** | Abort command cleanly. |
| **F-02** | Active drawing is read-only. | Error message: `Drawing is read-only. Save drawing before placing components.`. | **NO** | Abort command cleanly. |
| **F-03** | Target layer (`TTC-PANEL-EQUIP` or `TTC-PANEL-CLEARANCE`) is locked. | Error message: `Layer [LayerName] is locked. Unlock layer to place components.`. | **NO** | Abort transaction; 0 entities written. |
| **F-04** | Invalid / unknown Component ID requested. | Error message: `Component ID [Id] not found in catalog.`. | **NO** | Abort command; return to IDLE. |
| **F-05** | User presses `Esc` during Jig placement. | Status bar: `Placement cancelled.`. | **NO** | Destroy Jig, rollback transaction, 0 entities left. |
| **F-06** | Target Block definition missing external DWG file. | Fallback / Warning: `External DWG missing. Generated procedural geometric footprint.`. | **YES** (procedural fallback) | Procedural footprint created from dimensions ($W \times H$). |

---

## 17. Alternatives Considered

| Decision Area | Option A | Option B | Selected Option | Rationale / Trade-off |
|---|---|---|:---:|---|
| **Clearance Linkage (KU-01)** | Independent `Polyline` on `TTC-PANEL-CLEARANCE` linked via `XRecord` to `BlockReference`. | Clearance geometry embedded directly inside `BlockTableRecord` on layer `TTC-PANEL-CLEARANCE`. | **Option A (Proposed)** | Option A allows the user to explode, adjust, or recalculate clearance without editing the block definition. It also allows downstream export tools (`TTCEPLANEXPORT`) to easily strip or isolate clearances. Marked for Spec confirmation. |
| **Block Definition Sourcing (KU-02)** | External `.dwg` block file loaded from disk only. | Procedural block definition generated from dimensional attributes ($W \times H$) with fallback to external DWG if present. | **Option B (Hybrid Procedural First)** | Prevents plugin breakage when external asset paths are broken or missing. Footprints are always dimensionally accurate even without vendor CAD files. |
| **Snap to DIN Rail (KU-03)** | Interactive dynamic snapping in `DrawJig` during cursor movement. | Post-click mathematical snap upon mouse click. | **Option A (Interactive Jig)** | Validated in Simulator Scenario S01: live snapping gives immediate visual feedback to the engineer, preventing misaligned placement. |
| **Command Repetition (KU-04)** | Single-shot placement (command ends after 1 insert). | Continuous placement loop (repeats until user presses `Esc`). | **Option A (Single-shot, default)** | Standard AutoCAD convention for complex equipment insertion; prevents accidental duplicate placements. A `Multiple` option can be provided via CLI prompt. |

---

## 18. Design Decisions

| Decision ID | Decision | Rationale | Evidence / Source | Status |
|:---:|---|---|---|:---:|
| **D-PANEL-001** | Use native `BlockReference` on layer `TTC-PANEL-EQUIP` for component footprint. | Ensures 100% vanilla DWG compatibility without proxy objects. | Roadmap Sec. 5.4, CVF Governance. | **PROPOSED** |
| **D-PANEL-002** | Place clearance envelope on dedicated non-plot layer `TTC-PANEL-CLEARANCE`. | Prevents clearance linework from plotting to PDF/paper while keeping it visible during drafting. | Roadmap Sec. 14, 34; Simulator S02/S03. | **PROPOSED** |
| **D-PANEL-003** | Store component metadata in `ExtensionDictionary` (`XRecord`) under `TTC_PANEL_DATA`. | Immutable, standard DWG persistence that survives native copy/paste and does not pollute visual drawing space. | Roadmap Sec. 8, CVF Governance. | **PROPOSED** |
| **D-PANEL-004** | Hybrid block definition resolution: procedural generation from dimensions ($W \times H$) with external DWG asset override. | Zero external dependency failure while allowing high-detail vendor blocks when available. | KU-02 Analysis. | **PROPOSED** |
| **D-PANEL-005** | Interactive snap to DIN rail centerline within $25\text{ mm}$ capture threshold. | Ensures rail-mounted equipment snaps cleanly to mounting rail without manual coordinate entry. | Simulator Scenario S01, Roadmap Sec. 15. | **PROPOSED** |
| **D-PANEL-006** | Enforce 1:1 metric scale ($INSUNITS = 4$, Scale $= 1.0$). | Prevents distorted footprints and guarantees true physical dimensional fidelity. | Roadmap Sec. 42, CVF Rule 1. | **PROPOSED** |

---

## 19. Non-Goals

- **NO EPLAN API integration or ECAD schema sync:** AutoCAD does not assign electrical tags (`-Q1`), wire numbers, or terminal cross-references.
- **NO Automatic Cabinet Sizing:** Cabinet selection belongs to Phase 4 (`TTCPANELSIZE`).
- **NO Multi-panel 3D Solid modeling:** 2D drawing-first layout with 2.5D depth attributes.
- **NO Thermal CFD Simulation:** Geometric clearance checking only; no thermodynamics.

---

## 20. Open Questions

| ID | Question | Owner | Must Resolve Before | Status |
|:---:|---|---|:---:|:---:|
| **OQ-PANEL-01 (KU-01)** | Should the clearance boundary move synchronously when the user moves the component with vanilla AutoCAD `MOVE` command? | Operator / Human Lead | SPEC / BUILD | **OPEN** (Requires deciding whether to attach an AutoCAD database reactor or bundle into an AutoCAD `Group`). |
| **OQ-PANEL-02 (KU-02)** | What is the authoritative directory structure for external component block files (`.dwg`) when vendor graphics are provided? | Lead CAD Admin | SPEC / BUILD | **OPEN** (Default proposed: `assets/blocks/components/{id}.dwg`). |
| **OQ-PANEL-03 (KU-04)** | Should continuous placement mode be the default when launched from the Component Palette, or single-shot? | Product Owner | SPEC / BUILD | **OPEN** (Single-shot recommended for safety). |

---

## 21. Design Gate

- [x] Intake submitted ([01_INTAKE_TTCPANELPLACE.md](./01_INTAKE_TTCPANELPLACE.md), Status: `PENDING_HUMAN_CONFIRMATION`).
- [x] Primary workflow is complete.
- [x] Simulator observations affecting behavior are dispositioned (S01, S02, S03, S05).
- [x] Interaction states are defined.
- [x] Domain boundaries are defined.
- [x] Data flow is defined.
- [x] Architecture boundaries are defined.
- [x] Failure paths are designed.
- [x] Critical alternatives have decisions.
- [x] No unresolved question is being silently delegated to the coding agent (all marked in OQ / KU table).

**Gate Result:** `PASS` (Proceed to FEATURE SPEC; no build authority granted)

---

## 22. Approval

Reviewer: TTC CAD Project Owner  
Disposition: `PENDING_HUMAN_REVIEW`  
Date: 2026-09-08  
Proposed Decision IDs: `D-PANEL-001`, `D-PANEL-002`, `D-PANEL-003`, `D-PANEL-004`, `D-PANEL-005`, `D-PANEL-006`
