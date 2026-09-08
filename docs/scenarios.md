# TTC Simulator Engineering Scenarios

This document defines the official engineering test scenarios for **TTC AutoCAD Simulator (Panel Layout Designer)**.
Each scenario represents a product/engineering UX experiment designed to evaluate workflow feasibility, diagnostic clarity, and engineer decision-making.

---

## Scenario Summary Matrix

| ID | Name | Focus Area | Cabinet Size | Key Violation / Test Focus |
|:---:|:---|:---|:---:|:---|
| **S01** | **Empty Panel** | Freehand Drafting | 800 × 1000 × 300 mm | Baseline clean plate, drawing rails & ducts |
| **S02** | **Typical Control Panel** | Density & Ergonomics | 800 × 1000 × 300 mm | Baseline standard layout, multi-select alignment |
| **S03** | **Clearance Violations** | Clearance QA | 800 × 1000 × 300 mm | Thermal / lateral clearance conflicts, moving devices |
| **S04** | **Cabinet Too Small** | Boundary Limits | 600 × 800 × 250 mm | Layout overflow on undersized plate, sizing trigger |
| **S05** | **Depth Violation** | 2.5D Enclosure Depth | 600 × 800 × 250 mm | Device depth + front clearance exceeds usable depth |

---

## S01 — Empty Panel

### 1. Purpose
Validate the foundational drafting experience on a clean, unpopulated enclosure mounting plate. Allows the engineer to test drawing DIN rails, wiring ducts, and inserting components from scratch.

### 2. Initial Conditions
- **Cabinet:** Schneider Spacial S3D 800 × 1000 × 300 mm (`NSYS3D10830P`).
- **Usable Mounting Plate:** 740 × 940 mm (usable depth: 245 mm).
- **Entities:** None (clean plate).

### 3. Intentional Violations
- **None.** Baseline clean state.

### 4. User Actions to Test
1. Draw horizontal DIN rails using the Ribbon button or command `TTCRAIL`.
2. Draw perimeter wiring ducts using the Ribbon button or command `TTCDUCT`.
3. Open the Component Palette (`TTCPANEL`) and insert components (MCCB, VFD, Contactor).
4. Drag a DIN-rail component near a rail to verify **Snap to DIN Rail** behavior.
5. Click **Check QA** (`TTCPANELCHECK`) to verify zero false positives.

### 5. Expected Simulator Response
- Canvas displays standard mounting plate boundary with 4 corner screw holes.
- Grid snaps in 10mm increments; live status coordinates track mouse position in mm.
- Components smoothly snap onto DIN rails and track with rail centerline.
- QA diagnostics report: `✔ PASS: 0 Issues Found`.

### 6. UX Questions to Evaluate
- Does drawing rails and ducts by drag-and-drop feel intuitive compared to AutoCAD polyline drafting?
- Does the 10mm grid step provide the right balance between layout precision and speed?
- Is the mounting plate boundary clearly distinct from the infinite workspace canvas?

---

## S02 — Typical Control Panel

### 1. Purpose
Validate layout density, visual hierarchy, and mechanical alignment tools on a realistic, fully populated industrial control panel.

### 2. Initial Conditions
- **Cabinet:** Schneider Spacial S3D 800 × 1000 × 300 mm (Plate: 740 × 940 mm).
- **Structure:**
  - 6 Wiring Ducts (perimeter ducts 60x80mm, two internal dividers 40x60mm).
  - 3 DIN Rails (DIN 35x7.5mm).
- **Installed Equipment (12 items):**
  - Top section: Main MCCB 3P 100A, 24VDC 5A Power Supply, MCB 3P 32A, MCB 1P 10A.
  - Middle section: PLC Controller 24 I/O, 2x Variable Speed Drives (VFD 0.75kW).
  - Bottom section: 2x Contactors 9A, Slim Relay Module, Power and Control Terminal groups.

### 3. Intentional Violations
- **None.** Represents an approved, compliant panel engineering drawing.

### 4. User Actions to Test
1. Pan and zoom across the panel; evaluate text and terminal clarity at various zoom scales.
2. Toggle `CLEARANCES` on the Status Bar or Ribbon to observe non-plot clearance envelopes.
3. Multi-select the contactor pair (`Shift + Click`), test `Align Top` and `Equal Spacing H`.
4. Run explicit Check QA (`TTCPANELCHECK`) to confirm a clean bill of health.

### 5. Expected Simulator Response
- All 12 devices, 3 rails, and 6 ducts render crisply with terminal blocks, model tags, and dimensions.
- Alignment tools accurately move selected items while maintaining rail snap.
- QA diagnostics report: `✔ PASS: 0 Issues Found`.

### 6. UX Questions to Evaluate
- Does the visual contrast between device bodies, terminals, and clearance outlines remain legible on a dark CAD canvas?
- Is the multi-select alignment workflow fast and predictable for electrical panel designers?

---

## S03 — Clearance Violations

### 1. Purpose
Validate detection, visual communication, and problem-solving workflows for thermal and lateral clearance conflicts. Tests whether the engineer can easily identify why a layout is non-compliant and resolve it by moving components.

### 2. Initial Conditions
- **Cabinet:** Schneider Spacial S3D 800 × 1000 × 300 mm (Plate: 740 × 940 mm).
- **Intentional Conflicts Built Into Layout:**
  1. **Top Duct Penetration:** VFD 1 is placed at `y: 110`. Its 100mm top clearance envelope reaches `y: 10`, cutting 40mm into the top wiring duct (`y: 30-90`).
  2. **Lateral Drive Conflict:** VFD 2 is placed only 5mm away from VFD 1 along Rail 1. Both drives require 20mm lateral clearance (total 40mm recommended gap), causing an overlapping clearance violation.
  3. **Control Clearance Conflict:** PLC Controller (requiring 20mm right clearance) is placed only 5mm away from a 24VDC Power Supply along Rail 2.

### 3. Intentional Violations
- `CLEARANCE_OVERLAP`: VFD 1 clearance envelope penetrates into Wiring Duct 60x80 (Top).
- `CLEARANCE_OVERLAP`: Lateral clearance overlap between VFD 1 and VFD 2.
- `CLEARANCE_OVERLAP`: Lateral clearance overlap between PLC Controller and Power Supply.

### 4. User Actions to Test
1. Click **S03 Clearance** on the SCENARIOS tab $\rightarrow$ inspect canvas.
2. Observe amber/yellow shaded clearance envelopes highlighting the conflict zones.
3. Click **Check QA** (`TTCPANELCHECK`) $\rightarrow$ review the structured report in the Command Line log.
4. Select VFD 1 and drag it downward along its rail away from the top duct.
5. Select VFD 2 and slide it rightward along the rail to establish $\ge 20\text{ mm}$ spacing.
6. Select Power Supply and move it rightward away from the PLC.
7. Click **Check QA** again $\rightarrow$ verify that all clearance violations disappear and status turns to `PASS`.

### 5. Expected Simulator Response
- Conflicting clearance envelopes render with an amber alert tint (`rgba(229, 192, 123, 0.22)`) and warning border.
- Real-time diagnostic engine automatically clears the warning highlights as soon as the user drags items to valid coordinates.
- Command Line report lists rule code `CLEARANCE_OVERLAP` with affected entity names.

### 6. UX Questions to Evaluate
- Does the engineer prefer seeing clearance warnings update live during mouse drag, or only upon releasing the mouse?
- Should clearance violations be treated as non-blocking Warnings or strict blocking Errors?
- Would a "Snap to minimum clearance" helper feature improve drafting efficiency?

---

## S04 — Cabinet Too Small

### 1. Purpose
Validate detection and notification workflows when an engineering equipment list exceeds the physical mounting plate boundary of an undersized cabinet. Prepares the workflow for the future Cabinet Recommendation Engine (`TTCPANELSIZE`).

### 2. Initial Conditions
- **Cabinet:** Schneider Spacial CRN 600 × 800 × 250 mm (`NSYS3D8625P`).
- **Usable Mounting Plate:** 550 × 750 mm.
- **Placed Equipment:** Large bill-of-materials originally intended for an 800mm wide enclosure:
  - 3x DIN rails of width 580mm (extending to `x: 600mm > 550mm`).
  - Main MCCB positioned at `y: -20` (overflowing top plate boundary).
  - Contactors placed at `x: 520` with width 45mm (extending to `565mm > 550mm`).
  - Terminal blocks placed at `y: 720` with height 47mm (extending to `767mm > 750mm`).

### 3. Intentional Violations
- `OUTSIDE_MOUNTING_PLATE`: Multiple items (DIN Rails, MCCB, Contactor, Terminals) extend beyond the 550mm width and 750mm height boundaries of the mounting plate.

### 4. User Actions to Test
1. Click **S04 Too Small** on the SCENARIOS tab $\rightarrow$ inspect canvas.
2. Observe prominent red outlines on all equipment overflowing the mounting plate edges.
3. Click **Check QA** (`TTCPANELCHECK`) $\rightarrow$ review the list of boundary violation errors.
4. Click **Cabinet** on the Ribbon or type `TTCCABINET` $\rightarrow$ switch enclosure to `800x1000x300` or `800x1200x300` $\rightarrow$ observe that all equipment now fits comfortably inside the expanded plate boundaries!

### 5. Expected Simulator Response
- Overflowing entities are highlighted with red warning borders (`#e06c75`).
- HUD shows `OUTSIDE_MOUNTING_PLATE` count.
- Switching to an appropriately sized cabinet immediately updates the plate dimensions and resolves boundary errors.

### 6. UX Questions to Evaluate
- When changing to a larger cabinet, should existing equipment remain at current coordinates or auto-center?
- How should boundary violations be visualized when equipment is partially vs completely outside the plate?

---

## S05 — Depth Violation

### 1. Purpose
Validate enclosure depth verification in a 2.5D drafting environment. Ensures that engineers are alerted when heavy or deep equipment (e.g. large drives, rotary handles) cannot fit within the usable depth between the mounting plate and the closed cabinet door.

### 2. Initial Conditions
- **Cabinet:** Schneider Spacial CRN 600 × 800 × 250 mm (`NSYS3D8625P`).
  - Nominal Enclosure Depth: 250 mm.
  - Mounting Plate Depth Offset: 25 mm.
  - Door Internal Allowance: 20 mm.
  - **Usable Cabinet Depth:** $250 - 25 - 20 = \mathbf{205\text{ mm}}$.
- **Placed Items:**
  - Standard devices: PLC (depth 70mm + clearance 30mm = 100mm $\le$ 205mm: PASS).
  - Standard devices: Power Supply (depth 113mm + clearance 30mm = 143mm $\le$ 205mm: PASS).
  - **Heavy VFD 15kW (Deep Chassis):**
    - Body Depth: 210 mm.
    - Front Clearance Required: 60 mm.
    - **Total Required Depth:** $210 + 60 = \mathbf{270\text{ mm}}$.
    - **Deficit:** $270 - 205 = \mathbf{65\text{ mm}}$ violation!

### 3. Intentional Violations
- `CABINET_DEPTH_VIOLATION`: Heavy VFD 15kW requires 270mm depth, exceeding usable enclosure depth (205mm) by 65mm.

### 4. User Actions to Test
1. Click **S05 Depth** on the SCENARIOS tab $\rightarrow$ inspect canvas.
2. Observe the red `DEPTH ALERT (+65mm)` badge displayed directly on the 15kW VFD footprint.
3. Inspect the Canvas HUD showing:
   - `Cabinet: Spacial CRN NSYS3D8625P (600x800x250mm)`
   - `Usable Depth: 205 mm`
4. Click **Check QA** (`TTCPANELCHECK`) $\rightarrow$ review the Command Line report detailing exact arithmetic ($210\text{mm body} + 60\text{mm clearance} = 270\text{mm} > 205\text{mm}$).
5. Open Cabinet modal (`TTCCABINET`), switch to an enclosure with 300mm depth (e.g. `800x1000x300`, usable depth 245mm) or deeper $\rightarrow$ observe how depth deficit recalculates.

### 5. Expected Simulator Response
- 2D canvas communicates a 3D Z-axis collision clearly via badges and error highlights without requiring a complex 3D orbit view.
- Diagnostic report provides transparent calculation details.

### 6. UX Questions to Evaluate
- Is an on-canvas badge (`DEPTH ALERT (+X mm)`) sufficient for 2D layout engineers, or is an auxiliary side-elevation profile view required?
- Should the system prevent the user from inserting a device that exceeds cabinet depth, or allow placement with a persistent warning?
