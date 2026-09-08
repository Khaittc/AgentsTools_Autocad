# Tranche F0: AutoCAD Foundation — API & Host Verification Record

> **Purpose:** Technical verification evidence for architectural assumptions, AutoCAD Managed .NET APIs, and package manifest properties relevant to Tranche F0 review findings.
> **Rule:** Distinguish documented verification (`DOC_VERIFIED`), compiled assembly verification (`ASSEMBLY_VERIFIED`), and unverified claims (`UNVERIFIED`). Runtime status remains `NOT_RUN` until authorized BUILD.

---

## 1. Verified Sources Index

| Source ID | Title / Resource | Host / Version | URL | Content Verified |
|---|---|---|---|---|
| **SRC-01** | Autodesk Managed Reference: PaletteSet.AddVisual Overloads | AutoCAD 2022 / Managed API | `https://help.autodesk.com/cloudhelp/2022/ENU/OARX-ManagedRefGuide/files/OARX-ManagedRefGuide-__OVERLOADED_AddVisual_Autodesk_AutoCAD_Windows_PaletteSet.html` | Confirms PaletteSet exposes both 2-parameter and 3-parameter `AddVisual` overloads. |
| **SRC-02** | Autodesk Managed Reference: PaletteSet.AddVisual(string, Visual, bool) | AutoCAD 2022 / Managed API | `https://help.autodesk.com/cloudhelp/2022/ENU/OARX-ManagedRefGuide/files/OARX-ManagedRefGuide-Autodesk_AutoCAD_Windows_PaletteSet_AddVisual_string_Visual__MarshalAsUnmanagedType_U1__bool.html` | Confirms 3rd parameter is `bool bResizeContentToPaletteSize` controlling whether child visual resizes with palette. |
| **SRC-03** | AutoCAD 2023 Customization Guide: Components Element Reference | AutoCAD 2023 | `https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Customization/files/GUID-3C25E517-8660-4BB7-9447-2310462EF06F.htm` | Defines component element structure, load-reason semantics, and supported load parameters. |
| **SRC-04** | Autodesk Developer Blog: PackageContents.xml Manifest Examples | AutoCAD 2023–2025 | `https://blog.autodesk.io/autocad-2025-update-your-packagecontentsxml-with-runtimerequirements/` | Demonstrates standalone `LoadOnAutoCADStartup="True"` usage in PackageContents.xml examples and series requirements. |
| **SRC-05** | Autodesk Managed Reference: CommandFlags Enum | AutoCAD 2022 / Managed API | `https://help.autodesk.com/cloudhelp/2022/ENU/OARX-ManagedRefGuide/files/OARX-ManagedRefGuide-Autodesk_AutoCAD_Runtime_CommandFlags.html` | Confirms `CommandFlags.Session` establishes application execution context. Does not by itself guarantee availability of a normal interactive command-line surface after all drawing documents are closed. |
| **SRC-06** | AutoCAD Managed DevGuide: Application Initialization & Command Discovery | AutoCAD 2022 / Managed API | `https://help.autodesk.com/cloudhelp/2022/ENU/OARX-DevGuide-Managed/files/GUID-FA3B4125-F7BD-4E89-969F-9DCC90AC6977.htm` | Confirms AutoCAD runtime reflects on `[CommandMethod]` upon assembly load; manual command registration in `Initialize()` is unnecessary. |

---

## 2. Finding Verification Details

### FINDING-01: PaletteSet.AddVisual Method Signature & Resize Behavior

- **Finding ID:** FINDING-01
- **Target API:** `Autodesk.AutoCAD.Windows.PaletteSet.AddVisual`
- **Source:** SRC-01, SRC-02 (Autodesk Managed Reference Guide)
- **Source Verification Content:**
  - Overload 1: `public void AddVisual(string name, System.Windows.Media.Visual visual)`
  - Overload 2: `public void AddVisual(string name, System.Windows.Media.Visual visual, bool bResizeContentToPaletteSize)`
- **Verification Finding:** The original reviewer claim that the 2-parameter overload causes a compile error is **false** and has been **WITHDRAWN** by the reviewer. Both 2-parameter and 3-parameter signatures exist.
- **Architectural Contract Chosen for F0:**
  Use the 3-parameter overload explicitly:
  ```csharp
  paletteSet.AddVisual("Status", wpfStatusControl, true);
  ```
  **Rationale:** Passing `bResizeContentToPaletteSize: true` ensures the hosted WPF UserControl automatically resizes when the user docks, floats, or resizes the `PaletteSet` window, preventing clipped controls without requiring custom Win32 resize hooks.
- **Verification Status:** `DOC_VERIFIED` (Managed Reference Guide 2022; target assembly verification deferred to BUILD).
- **Runtime Status:** `NOT_RUN` (Requires real AutoCAD 2023 host).

---

### FINDING-02: PackageContents.xml LoadOnAutoCADStartup Attribute & Policy

- **Finding ID:** FINDING-02
- **Target Element / Attribute:** `<ComponentEntry LoadOnAutoCADStartup="True">`
- **Source:** SRC-03 (AutoCAD 2023 Documentation), SRC-04 (Autodesk Developer Blog)
- **Source Attribution Clarification:**
  - **SRC-03:** Official AutoCAD 2023 Customization Guide for the `Components` element. Defines supported parameters, load mechanisms, and load-reason semantics (`LoadReasons`).
  - **SRC-04:** Autodesk Developer Blog documentation demonstrating standalone `LoadOnAutoCADStartup="True"` usage within `PackageContents.xml` examples.
  - *Distinction:* SRC-03 defines the component element framework and parameters, while SRC-04 provides the direct developer sample illustrating standalone `LoadOnAutoCADStartup="True"`.
- **Verification Finding:** The original reviewer claim that `LoadOnAutoCADStartup="True"` is invalid and must be replaced by `LoadReasons` is **WITHDRAWN** by the reviewer.
- **Architectural Policy Chosen for F0:**
  - **Proposed Policy:** Startup Loading (`LoadOnAutoCADStartup="True"`).
  - **Rationale:** Tranche F0 aims to display the `TTC CAD` Ribbon tab shell immediately upon AutoCAD startup. If command demand-loading were used instead, the user would be forced to type a command (e.g. `TTCINFO`) before the Ribbon tab ever appears.
  - **Commands Element Role:** The nested `<Commands>` element remains present to register command aliases in AutoCAD's command index, ensuring autocomplete and command routing work seamlessly.
- **Verification Status:** `DOC_VERIFIED` (AutoCAD 2023 Components Element Reference & Developer Samples).
- **Runtime Status:** `NOT_RUN` (Autoloader deployment test requires real AutoCAD 2023).

---

### FINDING-03: Zero-Document State Safety & Command Context

- **Finding ID:** FINDING-03
- **Target APIs:** `CommandFlags.Session`, `Application.DocumentManager.MdiActiveDocument`, `Editor.WriteMessage`, `Application.ShowAlertDialog`
- **Source:** SRC-05, SRC-06
- **Source Verification Content:**
  - **Verified (SRC-05, SRC-06):**
    - `CommandFlags.Session` establishes application execution context.
    - Active document (`Application.DocumentManager.MdiActiveDocument`) can be `null` when all drawings are closed or during document switching.
    - `Editor` is strictly document-associated; accessing `MdiActiveDocument.Editor` when no document is open throws `NullReferenceException`.
  - **Not Implied / Not Proven:**
    - `CommandFlags.Session` does not by itself guarantee availability of a normal interactive command-line surface after all drawing documents are closed.
    - F0 explicitly enforces: `Zero-Document STATE SAFETY` $\neq$ `Guaranteed Zero-Document Command Invocation`.
- **F0 Architectural Contract — State Safety vs. Command Invocation:**
  - The F0 contract requires **Zero-Document STATE SAFETY**, not zero-document interactive command-line availability.
  - **Zero-Document State Safety Contract:**
    - The plugin runtime and initialized `PaletteSet` must remain completely stable when zero documents are open (`MdiActiveDocument == null`).
    - The `PaletteSet` shows "No Active Document" or equivalent diagnostic state; performs zero DWG transactions; dereferences no null `Editor`; creates no dummy document; and restores document awareness when a new drawing is opened.
    - If `TTCINFO` is invoked through a valid application-context mechanism while no document exists, it must use document-independent channels: it writes to the file log and may optionally display a modal dialog via `Application.ShowAlertDialog()`. Under no circumstances may code dereference `Editor` when null or create a dummy document.
- **Command Discovery:** AutoCAD automatically discovers `[CommandMethod]` upon assembly load. Manual registration in `Initialize()` is unnecessary.
- **Verification Status:** `DOC_VERIFIED` (Contract formally scoped to Zero-Document State Safety).
- **Runtime Status:** `NOT_RUN` (Requires real AutoCAD 2023 host).

---

### FINDING-04: Scope Isolation — Deferral of Domain Repositories

- **Finding ID:** FINDING-04
- **Target Concept:** `IComponentRepository`, `ICabinetRepository`, `ITrayLibraryRepository`
- **Source:** Architecture Roadmap (Section 3, 5, 6), `governance/ANTIGRAVITY_INSTRUCTIONS.md`
- **Source Verification Content:** Tranche F0 is strictly an infrastructure foundation shell. Mechanical catalogs, component schemas, and cable tray libraries belong to Tranche P1 and Module B (M1).
- **Verification Finding:** `IComponentRepository` and `ICabinetRepository` must NOT be required or implemented in F0. They are classified as `FUTURE / DEFERRED TO TRANCHE P1`. Only `ISettingsRepository` belongs to F0.
- **Verification Status:** `DOC_VERIFIED` (Roadmap & Governance alignment).
- **Runtime Status:** `NOT_RUN`.

---

### FINDING-05: Canonical Issue & Question Register Reconciliation

- **Finding ID:** FINDING-05
- **Target Artifact:** `docs/tranches/F0/ISSUES.md`
- **Verification Finding:** Cross-artifact discrepancies between DESIGN, SPEC, ISSUES, and EXECUTION_LOG are reconciled using `docs/tranches/F0/ISSUES.md` as the single canonical registry with explicit mapping of historical IDs.
- **Verification Status:** `DOC_VERIFIED`.
- **Runtime Status:** `NOT_RUN`.

---

### FINDING-06: Historical Execution Session Traceability

- **Finding ID:** FINDING-06
- **Target Artifact:** `docs/tranches/F0/EXECUTION_LOG.md`
- **Verification Finding:** Historical session `AG-F0-001` left `Ending Commit: PENDING`. Reconciled by appending a formal Historical Session Addendum linking to commit `90f1d30d2407850a653af277738dcfbefb30f378` without mutating original history.
- **Verification Status:** `DOC_VERIFIED`.
- **Runtime Status:** `NOT_RUN`.
