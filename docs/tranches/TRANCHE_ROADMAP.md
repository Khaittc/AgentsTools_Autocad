# TTC CAD — Tranche-Based Incremental Development Roadmap

Status: APPROVED_BY_OPERATOR_INSTRUCTION  
Governance Authority: [ANTIGRAVITY_INSTRUCTIONS.md](../../governance/ANTIGRAVITY_INSTRUCTIONS.md)  
Governance Decision: [TTC-GOV-001](../../governance/DECISION_LOG.md)  
Date: 2026-09-08  

---

## 1. Development Methodology: Spec-First Per Tranche

TTC CAD uses a **Spec-First Per Tranche** production model. 

We do **NOT** attempt to fully specify every future product feature upfront before starting production AutoCAD development. Instead, development proceeds through bounded, verifiable tranches:

```text
Establish product baseline
        ↓
Build smallest production foundation (F0)
        ↓
Run in real AutoCAD 2023
        ↓
Review / Freeze
        ↓
Add one bounded capability
        ↓
Run in real AutoCAD
        ↓
Review / Freeze
        ↓
Next tranche
```

### Canonical Lifecycle Per Tranche
Every tranche must independently progress through the formal CVF stages:
```text
INTAKE -> DESIGN -> SPEC -> WORK ORDER -> BUILD -> REVIEW -> FREEZE
```

> [!IMPORTANT]
> **Hard Build Gate Invariant:**
> Under no circumstances is production code implemented without:
> 1. Tranche / Feature Spec = `FROZEN`
> 2. Active Work Order = `APPROVED_FOR_EXECUTION`

---

## 2. Product Lane Separation

The repository is strictly divided into two distinct operational lanes:

```text
TTC CAD Repository
│
├── SIMULATOR LANE (src/, public/, docs/scenarios.md)
│   └── Purpose: Browser UX, workflow prototyping, user validation evidence.
│   └── Rule: No AutoCAD APIs, no production C#, no schema lock.
│
└── PRODUCTION AUTOCAD LANE (production/)
    └── Purpose: Governed AutoCAD 2023 Managed .NET plugin implementation.
    └── Rule: Requires frozen Spec + approved Work Order per tranche.
```

### Role of the Simulator
- **Design / UX Evidence:** Explores Ribbon layouts, Palette ergonomics, command prompt sequences, and layout problem-solving scenarios (S01–S05).
- **Non-Authority:** The simulator does **not** prove AutoCAD API behavior, transaction boundaries, document locking, native AutoCAD command interactions (`MOVE`/`COPY`/`UNDO`), or drawing persistence. Those must be proven in real AutoCAD.

---

## 3. Real AutoCAD Development Philosophy

```text
Small Spec
    ↓
Small Work Order
    ↓
Small Production Capability
    ↓
Run in Real AutoCAD
    ↓
Review
    ↓
Freeze
    ↓
Next Capability
```

Early host validation in AutoCAD 2023 prevents late-stage architectural rework. If discoveries during AutoCAD runtime testing require behavioral or structural adjustments, those findings must be fed back through the `DESIGN` and `SPEC` stages before amending code. Never silently patch frozen behavior.

---

## 4. Master Tranche Map

### Foundation Tranches (F-Series)
- **F0 — AutoCAD Foundation:** Smallest real AutoCAD 2023 Managed .NET plugin shell. Command `TTCINFO`, Ribbon tab, modeless `PaletteSet` host, JSON settings loader, structured logging, `.bundle` package.
- **F1 — Common CAD Contracts:** Cross-feature standards: Host integration, CAD object identity (`TTC_OBJECT_ID`), metadata lifecycle (`XRecord`), native `MOVE`/`COPY`/`ERASE`/`UNDO`/`REDO`/`SAVE`/`REOPEN` semantics, drawing units (`INSUNITS = 4`), geometric tolerance ($\varepsilon = 10^{-4}\text{ mm}$), and block asset management.

### Module A: Panel Layout Designer Tranches (P-Series)
- **P1 — Component Library:** Repository layer and data model for reading mechanical footprint specifications from `catalog.json` with dimensional caching.
- **P2 — Component Placement (`TTCPANELPLACE`):** Interactive placement Jig, DIN rail snap assist, `BlockReference` on `TTC-PANEL-EQUIP`, non-plot clearance `Polyline` on `TTC-PANEL-CLEARANCE`, and `XRecord` persistence.
- **P3 — DIN Rail (`TTCRAIL`):** 2D DIN rail placement, standard rail profiles (35x7.5mm), centerline elevation tracking.
- **P4 — Wiring Duct (`TTCDUCT`):** Perimeter and divider wiring ducts, standard sizing (60x80, 40x60mm).
- **P5 — Arrange Tools (`TTCALIGN`):** Alignment (Left, Right, Top, Bottom) and equal spacing (H, V) preserving block references and metadata.
- **P6 — Panel QA & Clearance Checker (`TTCPANELCHECK`):** Explicit clash detection, thermal clearance overlap checking, reporting audit log.
- **P7 — Depth Validation:** 2.5D enclosure depth vs device depth + door allowance verification.
- **P8 — Cabinet Size Recommendation (`TTCPANELSIZE`):** Usable mounting plate calculation and automatic enclosure selection from cabinet catalog.
- **P9 — Reserved Zones & Panel MVP Closure:** Reserved spaces for incoming/outgoing cables, final Panel MVP review and freeze.

### Module B: M&E Cable Tray Designer Tranches (M-Series)
> [!CAUTION]
> **STATUS: FUTURE / BLOCKED**
> All M&E tranches remain strictly blocked until Panel MVP reaches operational closure.
- **M1:** Tray Network Foundation
- **M2:** Basic Tray Routing
- **M3:** Fittings (Elbows, Tees, Crosses, Reducers)
- **M4:** Elevation / Rise / Drop
- **M5:** Tray-Panel Connection
- **M6:** Supports & Hangers
- **M7:** M&E QA
- **M8:** Quantity Takeoff

### Module C: CAD Standards & Export Tranches (C-Series)
- **C1 — CAD Standards:** Layer manager, linetype definitions, dimension styles.
- **C2 — Clean DWG/DXF Export (`TTCEPLANEXPORT`):** Production drawing cleanup, stripping non-plot layers, creating clean DWG for downstream EPLAN import without corrupting original source.

---

## 5. Dependency Graph

```text
F0 AUTOCAD FOUNDATION
        │
        ▼
F1 COMMON CAD CONTRACTS
        │
        ▼
P1 COMPONENT LIBRARY
        │
        ▼
P2 COMPONENT PLACEMENT (TTCPANELPLACE)
        │
        ├───────────────┐
        ▼               ▼
P3 DIN RAIL        P4 WIRING DUCT
        │               │
        └───────┬───────┘
                ▼
           P5 ARRANGE
                │
                ▼
           P6 PANEL QA
                │
          ┌─────┴─────┐
          ▼           ▼
       P7 DEPTH    P8 CABINET SIZE
          │           │
          └─────┬─────┘
                ▼
        P9 PANEL MVP FREEZE
                │
                ▼
        MODULE B (M1..M8) [FUTURE]
```

### Dependency Rules
1. **Inheritance of Frozen Contracts:** Downstream tranches inherit approved and frozen upstream contracts without re-inventing cross-cutting architecture.
2. **Immutable Upstream:** A downstream tranche must never silently redefine or contradict an upstream frozen contract.
3. **Escalation on Conflict:** If host implementation in tranche $N$ exposes a flaw in upstream tranche $M$, tranche $N$ stops, logs `BLOCKED_DEPENDENCY_CONFLICT`, and upstream tranche $M$ is formally reopened.

---

## 6. Tranche Lifecycle Status Model

```text
PLANNED
  ↓
DESIGN
  ↓
SPEC_DRAFT
  ↓
SPEC_REVIEW
  ↓
SPEC_FROZEN ──────── (Human Product Owner Authority Required)
  ↓
WO_DRAFT
  ↓
WO_REVIEW
  ↓
WO_APPROVED ──────── (Human Product Owner Authority Required)
  ↓
BUILDING
  ↓
REVIEW
  ↓
FROZEN ───────────── (Human Product Owner Authority Required)
```

> **Operator Approval Boundary:**
> Only the Product Owner / Project Owner has the authority to transition:
> - `SPEC_REVIEW -> SPEC_FROZEN`
> - `WO_REVIEW -> WO_APPROVED`
> - `REVIEW -> FROZEN`
> 
> The implementation agent (Antigravity) must never self-approve or self-freeze these transitions.
