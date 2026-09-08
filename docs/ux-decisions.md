# TTC Simulator UX Decisions

Purpose:
Record decisions about Ribbon, Palette, commands, drawing interactions, keyboard behavior and engineer workflows discovered during UX simulation.

---

## Decisions for Panel Simulator

### [UXD-001] Separation of Live Diagnostics vs. Explicit QA Check Command

- **Date:** 2026-09-07  
- **Milestone:** Panel Simulator v0.1 — Scenarios S01–S05  
- **Status:** Implemented as dual-layer model for UX evaluation (Not frozen).  

#### Context & Problem
In traditional CAD tools, running engineering rule checks (clash detection, clearance verification) is often a heavy, explicit command that engineers run periodically. However, modern web simulators can calculate geometric intersections in real time. 
If an explicit command is required for everything, engineers might discover clearance violations late in the drafting process. Conversely, if live diagnostics constantly output text or block the UI on every mouse drag, it causes visual clutter and distraction.

#### Implemented UX Model in Simulator
1. **Layer 1 — Silent Live Diagnostics (Background):**
   - Continuously evaluates the layout whenever components or cabinet selections change.
   - Updates visual canvas cues silently:
     - Red glowing borders for physical collisions, plate boundary breaches, and depth violations.
     - Amber tint and dashed borders on conflicting clearance envelopes.
     - Red badge `DEPTH ALERT (+X mm)` directly on offending components.
     - Updates the HUD issue counter (`X Violation(s)`).
   - **Crucial Rule:** Does *not* write to the Command Line history or pop up modals during interactive mouse drags.

2. **Layer 2 — Explicit QA Check Command (`TTCPANELCHECK`):**
   - Triggered deliberately by the engineer via the Ribbon **Check QA** button or typing `TTCPANELCHECK`.
   - Produces a formal, structured audit report in the Command Line log detailing:
     - Cabinet dimensions and calculated usable depth.
     - Number of issues found.
     - Rule codes (`DEVICE_DEVICE_COLLISION`, `OUTSIDE_MOUNTING_PLATE`, `CLEARANCE_OVERLAP`, `CABINET_DEPTH_VIOLATION`).
     - Mathematical breakdown of depth and clearance deficits.
     - Final `PASS` or `FAILED` status.

#### UX Questions for Product Owner Evaluation
1. **Intrusiveness vs. Guidance:** Does real-time amber/red canvas highlighting help engineers place components correctly on the first attempt, or does it feel intrusive while a layout is still work-in-progress?
2. **Toggle Control:** Should the Status Bar have an explicit toggle for `LIVE DIAGNOSTICS: ON/OFF` (similar to AutoCAD's Dynamic Input / Ortho toggles)?
3. **Report Presentation in AutoCAD 2023:** For the production C# plugin, should explicit QA results be presented in a dedicated dockable PaletteSet with "Zoom To Violation" buttons rather than only Command Line text?
