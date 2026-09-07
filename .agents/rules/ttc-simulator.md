# TTC AutoCAD UX Simulator Rules

This project is a UX and workflow simulator.

It is NOT a production AutoCAD plugin.

## Objective

Simulate TTC CAD Engineering Tools user experience so that engineering functions, workflows, Ribbon design, Palette design, drawing interaction and engineering decision workflows can be evaluated before production development.

## Mandatory Constraints

* Do NOT use AutoCAD APIs.
* Do NOT create a C# AutoCAD plugin.
* Do NOT use ObjectARX.
* Do NOT implement EPLAN APIs.
* Do NOT implement EPLAN Master Data.
* Do NOT create electrical BOM functionality.
* Do NOT create electrical Tag management.
* Do NOT create wire or terminal numbering.
* Do NOT turn this simulator into a production CAD system.
* Engineering algorithms may be simplified or simulated.
* UX fidelity is more important than production algorithm accuracy.
* Panel Simulator must be developed before M&E Simulator.
* Do not implement future simulator modules unless explicitly requested.
* Implement only the current requested simulator increment.
* After completing an increment, test it and STOP.

## Preferred Technology

When application implementation begins later:

* React
* TypeScript
* Vite
* React-Konva
* CSS

Do NOT install or configure these technologies during this folder-creation task unless the project already contains them.
