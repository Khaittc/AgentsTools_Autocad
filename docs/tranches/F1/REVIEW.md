# Tranche F1: Common CAD Contracts — Independent Review Log

> [!IMPORTANT]
> **Role Separation Notice:**
> Antigravity is the implementation/recording agent.
> Independent reviews are conducted by ChatGPT / Independent Technical Reviewer.
> Antigravity MUST NOT self-review or declare review passes.
> After recording an external review, this file is READ-ONLY for the remainder of the correction task.

---

## 1. Status Summary

- **Tranche:** F1 — Common CAD Contracts
- **Lifecycle Stage:** INTAKE
- **Current Review:** `REV-F1-INTAKE-001`
- **Current Result:** `NEEDS_FIX`
- **Current Disposition:** `RETURN_TO_INTAKE`
- **F1 DESIGN:** `NOT AUTHORIZED`
- **F1 SPEC:** `NOT_STARTED`
- **Production Build Authorization:** `NONE`
- **Expected Next Review:** `REV-F1-INTAKE-001-R2`

---

## 2. Independent Review: REV-F1-INTAKE-001

- **Review ID:** `REV-F1-INTAKE-001`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-09
- **Reviewed Commit:** `660a0b9bd8036978dd85097c4bdd16698ec52bd4`
- **Reviewed Scope:** `docs/tranches/F1/INTAKE.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/EXECUTION_LOG.md`, continuity artifacts.
- **Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_INTAKE`

### Findings

- **F01 — Unit contract overclaim:** INTAKE stated that all internal engineering calculations across all TTC modules MUST operate in millimeters. Architecture Roadmap §42 specifies that panel mechanical drawings assume millimeters, but M&E drawings have configurable project drawing units. The implementation must not assume all drawings are millimeters without checking configuration/drawing units. Exact normalization belongs to DESIGN/SPEC.
- **F02 — F0 logging path drift:** Inherited frozen logging path was recorded as `%APPDATA%\TTC\Logs` instead of the frozen F0 contract `%APPDATA%\TTC_CadTools\Logs\` (fallback `%TEMP%\TTC_CadTools\Logs\`).
- **F03 — Incorrect AutoCAD Handle semantics:** Problem statement claimed AutoCAD `Handle` is transient. In AutoCAD, `Handle` is persistent across sessions and save/reopen, but unique only within a single Database (not globally unique across databases, and cloned on copy). Transient session locator is `ObjectId`.
- **F04 — Silent design/standard invention:** `ISSUE-F1-003` introduced unverified exact tolerance values (e.g. angular $10^{-6}\text{ rad}$, zero-length $10^{-5}\text{ mm}$). `ISSUE-F1-004` prematurely recommended Prefixed Slug + UUID during INTAKE. `ISSUE-F1-002` made an unverified assertion about Vietnamese drafting template history without Git authority.
- **F05 — Premature reviewer exit-gate checkbox:** `INTAKE.md` Section 15 checked criterion #10 (Independent Technical Reviewer reviews and issues disposition allowing entry into DESIGN) while the review had not passed.
- **F06 — Execution-log Ending Commit unresolved:** `EXECUTION_LOG.md` for session `AG-F1-001` left `Ending Commit: PENDING` in the committed repository history.
- **F07 — Over-broad DocumentLock requirement:** `INTAKE.md` stated blanket requirement that every database modification requires `DocumentLock`. Explicit locks are required for modeless/application contexts, but not for standard modal current-document commands.

### Reviewer Directives
1. Correct technical/authority/continuity defects in `INTAKE.md`, `ISSUES.md`, `EXECUTION_LOG.md`, and continuity files.
2. Maintain `INSUNITS = 4` and $\varepsilon = 10^{-4}\text{ mm}$ strictly as `CANDIDATE` standards.
3. Authoring F1 DESIGN is **NOT AUTHORIZED**.
4. Resubmit for independent re-review: `REV-F1-INTAKE-001-R2`.
