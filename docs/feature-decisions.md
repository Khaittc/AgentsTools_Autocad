# TTC Simulator Feature Decisions

Purpose:
Record approved, rejected and postponed feature decisions discovered during UX simulation.

---

## Decisions for Panel Simulator v0.1

### [FD-001] v0.1 Core Scope Definition
- **Decision:** Panel Simulator v0.1 focuses on the core interactive layout experience: AutoCAD-like Shell (Ribbon, Palette, Command Line, Status Bar), Infinite Canvas with mm grid, Component placement from Mock Library, DIN Rail, Wiring Duct, Alignment tools, and visual Clearance Envelopes.
- **Status:** Approved.
- **Rationale:** Validates basic drafting workflow and ergonomics before adding complex rule engines.

### [FD-002] Postpone Complex QA & Cabinet Sizing Engine to v0.2+
- **Decision:** Full clearance overlap algorithms, multi-attribute collision reports, Cabinet Depth checking, and automated Cabinet Sizing recommendation (`TTCPANELSIZE`) are scheduled for v0.2. Basic physical bounding-box collision highlight is included in v0.1 as a preview.
- **Status:** Approved.
- **Rationale:** Keeps v0.1 scope focused and quickly deliverable for initial UX review.

### [FD-003] M&E Cable Tray Modules Deferred
- **Decision:** All M&E Cable Tray features remain in placeholder status until Panel Simulator reaches stable MVP.
- **Status:** Approved.
- **Rationale:** Strict adherence to Section 3 and Section 60 of the Architecture Roadmap.

### [FD-004] Predefined Quick-Load Scenarios
- **Decision:** Include Scenarios S01 (Empty Panel) and S02 (Typical Control Panel) directly in v0.1 for instant testing without manual setup.
- **Status:** Approved.
- **Rationale:** Enables rapid evaluation of layout density and clearance visuals.
