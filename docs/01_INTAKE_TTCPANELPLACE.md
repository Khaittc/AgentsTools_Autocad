# TTC CAD — Intake: TTCPANELPLACE (Smart Component Insert)

Status: APPROVED_INTAKE
Intake ID: INTAKE-PANEL-001
Version: 1.0
Owner: Electrical / M&E Engineering Lead
Date: 2026-09-08

---

## 1. Objective

Provide the electrical/M&E panel design engineer with a native AutoCAD 2023 managed command (`TTCPANELPLACE`) to insert verified mechanical component footprints from an approved footprint catalog into a 2D panel layout drawing. The command places standard CAD geometry at exact 1:1 metric scale (mm), creates or attaches non-plot thermal/cable clearance envelopes, and writes immutable canonical TTC metadata (`XRecord`/`XData`), strictly avoiding electrical schematics, wire tagging, and EPLAN master data synchronization.

---

## 2. Problem Statement / Context

- **Current workflow:** Design engineers manually find vendor DWG blocks or sketch rectangles representing devices (VFDs, PLCs, MCCBs, Contactors) on AutoCAD panel layout drawings.
- **Pain points:**
  1. Blocks are frequently inserted with arbitrary scale factors, distorting true physical dimensions.
  2. Electrical engineers forget to reserve required ventilation/thermal clearance spaces, discovered only after cabinet fabrication or assembly clashes occur on site.
  3. Placed linework has no structured metadata connecting it back to physical component specifications (width, height, depth, mounting type).
  4. Manual drawing manipulation risks polluting the DWG with ECAD tags or inconsistent layers.
- **Why this matters:** Physical layout mistakes in AutoCAD directly cause cabinet rework, thermal overheating, and delayed switchboard delivery.
- **What happens today without this tool:** Trial-and-error manual placement with high risk of dimensional inconsistency and downstream fabrication clash.

---

## 3. Target Users

### Primary User
- **Role:** Electrical / Switchboard / M&E Design Engineer.
- **Experience level:** Proficient in 2D AutoCAD drafting, panel assembly layout standards, and industrial equipment clearances.
- **Work context:** AutoCAD 2023 on Windows desktop, drafting 2D switchboard general arrangements (GA) and mounting plate layouts in millimeters.

### Secondary Users
- **Cabinet Assembler / Workshop Technician:** Reads the exported DWG/DXF drawings to verify rail placement and duct clearances.
- **EPLAN Detail Engineer:** Imports the clean mechanical layout DWG into EPLAN 2022 without schematic tag corruption.

---

## 4. User Jobs / Core Workflows

1. **Job 1 — Select and Insert Component:** Engineer browses/filters the mechanical component library in AutoCAD, selects a device (e.g. VFD 0.75kW), specifies insertion point on mounting plate or near a DIN rail, and places the physical footprint with clearance envelope intact.
2. **Job 2 — Snap to DIN Rail (Assisted Placement):** When placing a rail-mounted component near a DIN rail, the insertion point snaps to the rail center elevation.
3. **Job 3 — Maintain Footprint Integrity:** Placed footprint retains canonical metadata (`TTC_OBJECT_ID`, `TTC_LIBRARY_ID`) and true physical dimensions regardless of drawing display units.

---

## 5. In Scope

- Execution via command `TTCPANELPLACE` and interactive Ribbon/Palette trigger.
- Resolution of physical mechanical footprints from the component library (JSON/local catalog).
- Insertion of standard AutoCAD 2D entities (`BlockReference` on designated layer `TTC-PANEL-EQUIP`).
- Generation of non-plot clearance envelope on dedicated non-plot layer `TTC-PANEL-CLEARANCE`.
- Attachment of canonical TTC metadata using Extension Dictionary (`XRecord`) or registered `XData` (`TTC_CAD_TOOLS`).
- Metric millimeter unit validation (`INSUNITS = 4`).
- Undo/Redo transactional integrity (one atomic transaction per placement).
- Clean cancel via `Esc` leaving zero residual entities.

---

## 6. Out of Scope / Non-Goals

- **NO EPLAN API or Master Data integration:** AutoCAD does not manage device tags (e.g. `=EB1+CA1-Q1`), electrical BOM, wire numbers, or terminal cross-references.
- **NO Automatic Cabinet Sizing:** Enclosure evaluation belongs to Phase 4 (`TTCPANELSIZE`).
- **NO 3D Solid Modeling:** 2D drawing-first representation with 2.5D depth metadata.
- **NO Thermal Simulation:** Real-time CFD or thermal dissipation math is out of scope; only geometric clearance boundaries are placed.
- **NO Automated multi-panel routing:** M&E tray routing belongs to Module B.

---

## 7. Constraints

### Host / Technical
- **AutoCAD Host:** AutoCAD 2023 (Release 24.2).
- **Runtime:** .NET Framework 4.8.
- **Language:** C# 9.0 / 10.0 targeting .NET 4.8.
- **API:** AutoCAD Managed .NET API (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`).
- **UI:** WPF Modeless PaletteSet + AutoCAD Ribbon.
- **DWG Usability:** Resulting DWG must remain 100% readable and editable in vanilla AutoCAD without proxy entity warnings (`Standard DWG Usability`).

### Engineering / Domain
- **Drawing Units:** Millimeters (1 DWG unit = 1.0 mm).
- **Mounting Types:** `DIN_RAIL`, `MOUNTING_PLATE`, `DOOR`, `SIDE_PANEL`, `OTHER`.
- **Clearance Model:** 5-sided bounding box (`Top`, `Bottom`, `Left`, `Right`, `Front`).

### Delivery
- Must strictly follow CVF-Lite governance (`ANTIGRAVITY_INSTRUCTIONS.md`).
- Production code must remain blocked until Spec freeze and Work Order approval.

---

## 8. Dependencies

| ID | Dependency | Required For | Status | Owner |
|---|---|---|---|---|
| DEP-01 | Phase 0 Baseline Architecture & Plugin Entry (`TTCINFO`) | AutoCAD Managed assembly host | READY (Roadmap Approved) | Project Owner |
| DEP-02 | Component Library Repository (`IComponentRepository`) | Sourcing footprint definitions | OPEN (Spec In-Progress) | Core Dev |
| DEP-03 | Layer Management Standard (`TTC-*`) | Assigning layer & non-plot properties | READY (Roadmap Sec. 34) | Project Owner |

---

## 9. Known Unknowns (Marked Explicitly)

| ID | Unknown / Decision Needed | Why It Matters | Resolve In | Status |
|---|---|---|---|:---:|
| **KU-01** | **Clearance Linkage Strategy:** Should the clearance boundary be an entity inside the block definition, an independent `Polyline` linked via Handle/XData, or dynamically drawn on-demand? | Impacts DWG standard compatibility, explode behavior, and layer freezing. | DESIGN / SPEC | **OPEN** |
| **KU-02** | **Block Definition Sourcing:** Should footprint blocks be imported from external `.dwg` files, generated programmatically in the block table, or both? | Impacts offline usability and asset directory dependencies. | DESIGN / SPEC | **OPEN** |
| **KU-03** | **Interactive Snap-to-Rail Mechanism:** Does snapping happen live during `Editor.Drag` (Jig) or snap mathematically upon point picking? | Impacts UI responsiveness and managed transaction locking during mouse moves. | DESIGN / SPEC | **OPEN** |
| **KU-04** | **Command Repetition:** Does `TTCPANELPLACE` exit after placing one component, or loop continuously until `Esc`? | Affects user ergonomics and undo stack grouping. | DESIGN / SPEC | **OPEN** |

---

## 10. Existing Evidence / References

- **Architecture Roadmap:** [TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md](file:///f:/OneDrive/001_RealGroup/Z1005_TranQuocKhai/0012_Agent_Tools/00_Tools_Autocad/TTC-AutoCAD-Simulator/docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md) — Section 10, 11, 13, 14, 48.
- **Simulator Implementation:** `src/shell/Palette/ComponentPalette.tsx`, `src/drawing/DrawingCanvas/DrawingCanvas.tsx` (Component insert, ghost preview, DIN rail snap).
- **Simulator Scenarios:** [scenarios.md](file:///f:/OneDrive/001_RealGroup/Z1005_TranQuocKhai/0012_Agent_Tools/00_Tools_Autocad/TTC-AutoCAD-Simulator/docs/scenarios.md) — Scenarios S01, S02, S03.
- **CVF Governance Rules:** [.CVF/CVF_AUTOCAD_GOVERNANCE_RULES.md](file:///f:/OneDrive/001_RealGroup/Z1005_TranQuocKhai/0012_Agent_Tools/00_Tools_Autocad/.CVF/CVF_AUTOCAD_GOVERNANCE_RULES.md).

---

## 11. Expected Output From This Intake

- Approved Module Design Document (`docs/02_DESIGN_TTCPANELPLACE.md`).
- Bounded Feature Specification (`docs/03_FEATURE_SPEC_TTCPANELPLACE.md`).
- Formal resolution of KU-01 through KU-04 before Spec freeze.
- Zero production code written in this step.

---

## 12. Success Criteria

- [ ] **SC-01:** Engineer can trigger `TTCPANELPLACE` with a valid component ID, pick a point, and have a compliant block inserted in under 1 second.
- [ ] **SC-02:** Inserted entity contains standard `BlockReference` with exact millimeter dimensions matching the catalog.
- [ ] **SC-03:** Non-plot clearance envelope is generated on layer `TTC-PANEL-CLEARANCE` and does not plot to PDF/paper.
- [ ] **SC-04:** Canonical metadata (`TTC_OBJECT_ID`, `TTC_LIBRARY_ID`) is written to `ExtensionDictionary`/`XData` and persists across `SAVE` -> `CLOSE` -> `REOPEN`.
- [ ] **SC-05:** Pressing `Esc` or cancelling aborts cleanly with 0 entities left in `ModelSpace`.

---

## 13. Input Acceptance Gate

- [x] Objective is specific and measurable.
- [x] Primary user is identified.
- [x] In Scope is explicit.
- [x] Out of Scope is explicit.
- [x] Technical/domain constraints are explicit.
- [x] Dependencies are recorded.
- [x] Known unknowns are recorded explicitly.
- [x] Success criteria are measurable.
- [x] No known conflict with a frozen decision/doctrine.

**Gate Result:** `PASS`

---

## 14. Approval

Reviewer: TTC CAD Project Owner  
Disposition: `APPROVED`  
Date: 2026-09-08  
Notes: Baseline intake verified against Roadmap Section 13 and CVF doctrine. Proceed to DESIGN.
