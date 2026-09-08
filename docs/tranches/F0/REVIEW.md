# Tranche F0: AutoCAD Foundation — Review Result & Addendum

> [!IMPORTANT]
> **Independent Review Persistence Rule:**
> This document records external independent technical reviewer evidence received for commit `90f1d30d2407850a653af277738dcfbefb30f378`.
> Antigravity is acting solely as the recording agent, not the reviewer.

Review ID:
REV-F0-001

Reviewer:
ChatGPT / Independent Technical Reviewer

Recorded By:
Antigravity

Review Date:
2026-09-08

Reviewed Commit:
90f1d30d2407850a653af277738dcfbefb30f378

Reviewed Scope:
Tranche F0 Intake, Architectural Design, Feature Specification, Issue Registry, and Continuity Artifacts

Implementation / AutoCAD Runtime Verification:
NOT_PERFORMED (Planning / Specification Stage Only)

---

## 1. Original Review Result

Original Result:
NEEDS_FIX

Original Disposition:
RETURN_TO_SPEC

### Summary of Original Findings

| Finding ID | Topic | Original Reviewer Observation | Severity |
|---|---|---|---|
| **FINDING-01** | PaletteSet `AddVisual` Signature | Claimed 2-parameter `AddVisual(name, visual)` was missing required parameters and caused compile failure. | HIGH |
| **FINDING-02** | PackageContents.xml Load Policy | Claimed `LoadOnAutoCADStartup="True"` on `ComponentEntry` was non-standard and must be replaced by `LoadReasons`. | MEDIUM |
| **FINDING-03** | Command Execution Context & Zero-Doc | Noted `CommandFlags.Session` does not automatically provide an `Editor` in zero-document state; calling `Editor.WriteMessage` when active document is null throws `NullReferenceException`. Noted command discovery wording in `DESIGN.md` implied manual registration in `Initialize()`. | HIGH |
| **FINDING-04** | Premature Domain Repositories in F0 | Noted `IComponentRepository` and `ICabinetRepository` in F0 project tree and `TTCINFO` report pre-empted Tranche P1. | MEDIUM |
| **FINDING-05** | Open Questions Register Discrepancies | Noted collision and misalignment of `OQ-F0-01` through `OQ-F0-06` between `DESIGN.md`, `SPEC.md`, `ISSUES.md`, and `EXECUTION_LOG.md`. | MEDIUM |
| **FINDING-06** | Incomplete Historical Session in Log | Noted `EXECUTION_LOG.md` session `AG-F0-001` had `Ending Commit: PENDING` without post-commit resolution. | LOW |

---

## 2. REVIEWER ADDENDUM — SOURCE-VERIFIED CORRECTIONS

The independent reviewer provided the following formal addendum correcting the initial review:

### A. FINDING-01 Addendum (Original Claim Withdrawn)
The previous review comment asserting that `PaletteSet.AddVisual(string, Visual)` has missing required parameters and causes a compile failure is **WITHDRAWN**.
Autodesk Managed Reference Guide documentation confirms that `PaletteSet` exposes both:
- `AddVisual(string name, Visual visual)` (2 parameters)
- `AddVisual(string name, Visual visual, bool bResizeContentToPaletteSize)` (3 parameters)

The finding is converted from a purported compile failure to an API target-version verification task and resize contract clarification (`bResizeContentToPaletteSize: true` recommended to handle palette docking/resizing cleanly).

### B. FINDING-02 Addendum (Original Claim Withdrawn)
The previous review comment asserting that `LoadOnAutoCADStartup="True"` must be replaced by `LoadReasons` on `ComponentEntry` is **WITHDRAWN**.
Autodesk official customization guides and developer samples confirm that `LoadOnAutoCADStartup="True"` is valid on `ComponentEntry`.
The finding is converted to a manifest verification and load policy synchronization task, confirming why startup loading is chosen for F0 (immediate Ribbon visibility without prior command invocation).

### C. FINDING-03 to FINDING-06 Addendum
Findings 03, 04, 05, and 06 remain valid and must be resolved in F0 documentation as detailed below.

### Overall Review Disposition
Overall Review Disposition remains: **NEEDS_FIX / RETURN_TO_SPEC**.  
*(The withdrawal of incorrect claims for Findings 01 and 02 does not mean F0 has passed; the remaining findings must be fully addressed before re-review).*

---

## 3. Agent Correction & Traceability Matrix

| Finding ID | Original Reviewer Claim | Current Disposition | Files / Sections Changed | Evidence & Technical Rationale | Remaining Verification |
|---|---|---|---|---|---|
| **FINDING-01** | Two-parameter `AddVisual` is a compile error. | **ORIGINAL_CLAIM_WITHDRAWN / CLARIFIED_PENDING_REVIEW** | `docs/tranches/F0/DESIGN.md` (Sec. 6.3), `SPEC.md` (Sec. 6.4), `API_VERIFICATION.md` (Sec. 2) | Autodesk Managed Reference confirms 2-param & 3-param overloads exist. F0 adopts 3-param overload `AddVisual("Status", control, true)` specifically to automate content resizing upon palette resize. | Assembly compile and host resize test in BUILD (`NOT_RUN`). |
| **FINDING-02** | `LoadOnAutoCADStartup="True"` is invalid; must use `LoadReasons`. | **ORIGINAL_CLAIM_WITHDRAWN / CLARIFIED_PENDING_REVIEW** | `docs/tranches/F0/DESIGN.md` (Sec. 10.3), `SPEC.md` (Sec. 6.7), `API_VERIFICATION.md` (Sec. 2) | Autodesk docs confirm `LoadOnAutoCADStartup="True"` is valid. F0 retains startup loading to ensure Ribbon tab displays upon startup. Manifest paths synchronized to `TTC.CadTools.bundle`. | Autoloader startup test in real AutoCAD 2023 in BUILD (`NOT_RUN`). |
| **FINDING-03** | Zero-document state lacks `Editor`; `TTCINFO` dereferences null `Editor`. Command discovery incorrectly described. | **CORRECTED_PENDING_REVIEW** | `docs/tranches/F0/DESIGN.md` (Sec. 4.2, 6.1, 9), `SPEC.md` (Sec. 6.3, 6.4, 7), `API_VERIFICATION.md` (Sec. 2) | Decoupled output channels: `Editor.WriteMessage` when `MdiActiveDocument != null`; file log + `Application.ShowAlertDialog` when zero-doc (`null`). Removed manual command registration wording; explained native `[CommandMethod]` discovery. | Host zero-doc invocation test in BUILD (`NOT_RUN`). |
| **FINDING-04** | `IComponentRepository` and `ICabinetRepository` in F0 pre-empt Tranche P1. | **CORRECTED_PENDING_REVIEW** | `docs/tranches/F0/INTAKE.md` (Sec. 5), `DESIGN.md` (Sec. 5, 9), `SPEC.md` (Sec. 4, 6.1, 9) | Removed domain repositories from F0 implementation. Marked `FUTURE / DEFERRED TO P1`. F0 strictly implements `ISettingsRepository`. `TTCINFO` reports repository status as `DEFERRED_TO_P1`. | Codebase audit in BUILD (`NOT_RUN`). |
| **FINDING-05** | Open Questions collided and differed across DESIGN, SPEC, ISSUES, EXECUTION_LOG. | **CORRECTED_PENDING_REVIEW** | `docs/tranches/F0/ISSUES.md`, `DESIGN.md` (Sec. 13), `SPEC.md` (Sec. 1), `EXECUTION_LOG.md` | Reconciled all questions into `docs/tranches/F0/ISSUES.md` with unique canonical IDs (`ISSUE-F0-001`..`006`), mapping table, owners, blocked gates, and status. | Documentation review. |
| **FINDING-06** | `EXECUTION_LOG.md` session AG-F0-001 had `Ending Commit: PENDING`. | **CORRECTED_PENDING_REVIEW** | `docs/tranches/F0/EXECUTION_LOG.md` | Appended Historical Session Addendum linking AG-F0-001 to commit `90f1d30d2407850a653af277738dcfbefb30f378`. Created session `AG-F0-002` with commit trailer resolution. | Git log audit. |

---

## 4. Current Status

- **F0 Lifecycle Stage:** `SPEC_REVIEW`
- **F0 Spec Status:** `DRAFT / READY_FOR_REVIEW` (Version 0.1.1)
- **Work Order:** `NONE`
- **Production Build Authorization:** `NOT AUTHORIZED`
- **Agent Correction Status:** `CORRECTED_PENDING_REVIEW`
- **Independent Re-Review Status:** `PENDING_REVIEW`

---

## 5. Next Authorized Action

Independent technical reviewer verifies this correction commit.
