# TTC AutoCAD UX Simulator Rules

This project rule applies to the **SIMULATOR LANE** (`src/`, `public/`, simulator scenarios, and browser UX prototypes).

It is NOT a production AutoCAD plugin.

## Scope Boundary & Lane Applicability

> [!IMPORTANT]
> **Lane Applicability Rule:**
> These restrictions apply **ONLY to the SIMULATOR LANE**.
> They prohibit AutoCAD API / C# production implementation inside simulator code, browser UI prototypes, and simulator tasks.
> They do **NOT** prohibit production AutoCAD implementation inside the explicitly designated **PRODUCTION AUTOCAD LANE** (`production/`) after canonical CVF build authorization (Frozen Spec + Approved Work Order).

## Objective

Simulate TTC CAD Engineering Tools user experience so that engineering functions, workflows, Ribbon design, Palette design, drawing interaction, and engineering decision workflows can be evaluated before production development.

## Mandatory Constraints (Simulator Lane Only)

* Do NOT use AutoCAD APIs inside the simulator.
* Do NOT create a C# AutoCAD plugin inside the simulator directory.
* Do NOT use ObjectARX inside the simulator.
* Do NOT implement real EPLAN APIs.
* Do NOT implement EPLAN Master Data.
* Do NOT create electrical BOM functionality.
* Do NOT create electrical Tag management.
* Do NOT create wire or terminal numbering.
* Do NOT turn this browser simulator into a production CAD system.
* Engineering algorithms may be simplified or simulated for UX feedback.
* UX fidelity is more important than production algorithm accuracy in this lane.
* Panel Simulator must be developed before M&E Simulator.
* Do not implement future simulator modules unless explicitly requested.
* Implement only the current requested simulator increment.
* After completing an increment, test it and STOP.

## Preferred Technology

For the browser UX simulator:

* React
* TypeScript
* Vite
* HTML Canvas / 2D rendering
* Tailwind CSS / CSS Modules
