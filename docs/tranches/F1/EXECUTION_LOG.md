# Tranche F1: Common CAD Contracts — Execution Log

> Append-only task/session history.
> Do not rewrite or erase historical sessions.

---

## Session 2026-09-09 / AG-F1-001

### Identity
- **Agent:** Antigravity
- **Session ID:** `AG-F1-001`
- **Task ID:** `F1-INTAKE-001`
- **Lifecycle Stage:** `INTAKE`
- **Tranche:** `F1 — Common CAD Contracts`
- **Work Order:** `NONE` (Intake Planning Stage Only)
- **Starting Commit:** `012c7613a37cca767cac03e0b80ccbc6f5b6554a`
- **Ending Commit:** PENDING
- **Dependency:** `F0 — AutoCAD Foundation` (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Current Production Build Authorization:** `NONE`

---

### Objective
1. Initiate Tranche F1 (Common CAD Contracts) strictly at the INTAKE lifecycle stage.
2. Author and persist `docs/tranches/F1/INTAKE.md` (`INTAKE-FOUNDATION-F1-001`) covering:
   - Authority & dependency on frozen F0;
   - Problem statement & rationale for F1 preceding P1/P2;
   - Inherited frozen F0 contracts;
   - In-scope common CAD contract domains (A through L);
   - Explicit non-goals and out-of-scope boundaries;
   - Stakeholders and downstream consumers (P1..P9, M1..M8, C1, C2);
   - Required behaviors and Standard DWG Usability;
   - Native AutoCAD lifecycle operations (`MOVE`, `COPY`, `ROTATE`, `ERASE`, `UNDO`, `REDO`, `SAVE`, `REOPEN`, `ARRAY`, `MIRROR`, `WBLOCK`, `INSERT`, `COPYCLIP`/`PASTECLIP`);
   - Failure and corruption scenarios;
   - Candidate standards vs approved standards classification;
   - Ten open questions (`OQ-F1-01` through `OQ-F1-10`);
   - Risk register with mitigations;
   - Acceptance intent for future SPEC;
   - Exit criteria and next lifecycle gate.
3. Establish canonical issue registry `docs/tranches/F1/ISSUES.md` (`ISSUE-F1-001` through `ISSUE-F1-010`).
4. Maintain strict immutability of frozen Tranche F0 and production code paths (`production/**`).
5. Update project continuity artifacts (`docs/tranches/TRANCHE_STATUS.md`, `governance/PROJECT_PROGRESS.md`, `governance/AGENT_HANDOFF.md`).
6. Stop immediately after INTAKE persistence without authoring DESIGN, SPEC, or Work Order.

---

### Execution Details
- **Intake Artifact Created:** `docs/tranches/F1/INTAKE.md` (`INTAKE-FOUNDATION-F1-001`, Status: `DRAFT / INDEPENDENT_REVIEW_PENDING`).
- **Issue Registry Created:** `docs/tranches/F1/ISSUES.md` (10 canonical issues registered for DESIGN/SPEC investigation).
- **Tranche Front-Door (README):** NOT created during this task per Section 17 governance rule (deferred until DESIGN/SPEC).
- **Design / Spec / Work Order:** NOT created (strictly forbidden at INTAKE stage).
- **Production Code Mutation:** ZERO (`production/**` verified unmodified).
- **F0 Spec & Implementation:** 100% frozen and untouched.

---

### Standards Classification Audit
- `INSUNITS = 4` (Millimeters): Classified as `CANDIDATE`.
- Geometric Tolerance $\varepsilon = 10^{-4}\text{ mm}$: Classified as `CANDIDATE`.
- Core Metadata Key Vocabulary (`TTC_OBJECT_TYPE`, `TTC_OBJECT_ID`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, `TTC_LIBRARY_VERSION`): Classified as `INHERITED_ARCHITECTURAL_BASELINE`.
- Storage Split (XData vs Extension Dictionary / XRecord): Classified as `OPEN_QUESTION`.
- AutoCAD 2023 Managed .NET API (.NET Framework 4.8): Classified as `INHERITED_FROZEN`.

---

### Downstream Tranche State
- **F0 (AutoCAD Foundation):** `COMPLETE / FROZEN` (Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- **F1 (Common CAD Contracts):** `INTAKE_DRAFT / INDEPENDENT_REVIEW_PENDING`.
- **P1 (Component Library):** `BLOCKED_BY_F1`.
- **P2 (Component Placement):** `BLOCKED_BY_F1_P1`.
- **P3..P9 (Panel Designer):** `BLOCKED`.
- **M1..M8 (Cable Tray Designer):** `BLOCKED` (Future module).
- **C1, C2 (Standards & Export):** `BLOCKED`.

---

### Next Required Action
Independent technical review of `INTAKE-FOUNDATION-F1-001`. F1 DESIGN is NOT AUTHORIZED until independent review disposition is issued.

---

### Historical Session Addendum (Post-Commit Reconciliation)

- **Session ID:** AG-F1-001
- **Task ID:** F1-INTAKE-001
- **Resolved Ending Commit:** `660a0b9bd8036978dd85097c4bdd16698ec52bd4`
- **Resolution Date:** 2026-09-09
- **Recorded In:** Session `AG-F1-002` (`F1-INTAKE-CORRECTION-001`)
- **Reason:** Reconciled historical completion commit `660a0b9bd8036978dd85097c4bdd16698ec52bd4` in compliance with append-only continuity rules and finding F06.

---

## Session 2026-09-09 / AG-F1-002

### Identity
- **Agent:** Antigravity
- **Session ID:** `AG-F1-002`
- **Task ID:** `F1-INTAKE-CORRECTION-001`
- **Lifecycle Stage:** `INTAKE_CORRECTION`
- **Tranche:** `F1 — Common CAD Contracts`
- **External Review:** `REV-F1-INTAKE-001` (`NEEDS_FIX / RETURN_TO_INTAKE`)
- **Work Order:** `NONE` (Intake Correction Stage Only)
- **Starting Commit:** `660a0b9bd8036978dd85097c4bdd16698ec52bd4`
- **Ending Commit:** PENDING (reconciled post-commit per governance)
- **Dependency:** `F0 — AutoCAD Foundation` (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Current Production Build Authorization:** `NONE`

---

### Objective
1. Persist external review `REV-F1-INTAKE-001` (`NEEDS_FIX / RETURN_TO_INTAKE`) in `docs/tranches/F1/REVIEW.md`.
2. Correct technical, authority, and continuity defects identified in `REV-F1-INTAKE-001`:
   - `F01`: Unit contract overclaim corrected to align with Architecture Roadmap §42 (panel mechanical initial assumption = mm; M&E project drawing unit = configurable; Core uses normalized units where practical; `INSUNITS = 4` candidate only).
   - `F02`: F0 logging path drift corrected to `%APPDATA%\TTC_CadTools\Logs\` (fallback `%TEMP%\TTC_CadTools\Logs\`).
   - `F03`: AutoCAD Handle semantics corrected (persistent across sessions within database, unique within database, duplicate on copy; distinct from transient `ObjectId`).
   - `F04`: Silent design inventions removed from `ISSUES.md` (`ISSUE-F1-003` exact tolerance numbers removed to TO_BE_DETERMINED; `ISSUE-F1-004` premature recommendation of Slug+UUID removed; `ISSUE-F1-002` neutral phrasing on legacy drawings).
   - `F05`: Intake exit gate criterion #10 unchecked in `INTAKE.md` Section 15.
   - `F06`: Execution continuity resolved for `AG-F1-001` ending commit and session `AG-F1-002` appended.
   - `F07`: DocumentLock language corrected to distinguish managed transactions from context-appropriate explicit locking (modeless/app context).
3. Clean up Risk Register in `INTAKE.md` Section 13 to mark ratings as non-authoritative qualitative triage and mitigations as investigation directions.
4. Maintain strict immutability: zero production code changes (`production/**`), zero F0 changes (`docs/tranches/F0/**`), no `DESIGN.md`, `SPEC.md`, or `WORK_ORDER.md`.
5. Update project continuity records (`docs/tranches/TRANCHE_STATUS.md`, `governance/PROJECT_PROGRESS.md`, `governance/AGENT_HANDOFF.md`).
6. Prepare for independent re-review `REV-F1-INTAKE-001-R2`.

---

### Execution Details
- **Review Persisted:** `docs/tranches/F1/REVIEW.md` created with findings F01–F07 and reviewer directives (marked read-only).
- **Intake Corrected:** `docs/tranches/F1/INTAKE.md` updated for F01, F02, F03, F05, F07, and Risk Register triage.
- **Issue Registry Corrected:** `docs/tranches/F1/ISSUES.md` updated for F04 (ISSUE-F1-002, ISSUE-F1-003, ISSUE-F1-004).
- **Production Code Mutation:** ZERO (`production/**` verified unmodified).
- **Frozen F0 Status:** ZERO modifications (`docs/tranches/F0/**` verified untouched).
- **Design / Spec / Work Order:** NOT created (strictly NOT AUTHORIZED).

---

### Downstream Tranche State
- **F0 (AutoCAD Foundation):** `COMPLETE / FROZEN` (Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- **F1 (Common CAD Contracts):** `INTAKE_CORRECTED / INDEPENDENT_RE_REVIEW_PENDING`.
- **P1 (Component Library):** `BLOCKED_BY_F1`.
- **P2 (Component Placement):** `BLOCKED_BY_F1_P1`.
- **P3..P9 (Panel Designer):** `BLOCKED`.
- **M1..M8 (Cable Tray Designer):** `BLOCKED` (Future module).
- **C1, C2 (Standards & Export):** `BLOCKED`.

---

### Next Required Action
Independent technical re-review: `REV-F1-INTAKE-001-R2`. F1 DESIGN remains strictly NOT AUTHORIZED until independent reviewer approval.

---

### Historical Session Addendum (Post-Commit Reconciliation)

- **Session ID:** AG-F1-002
- **Task ID:** F1-INTAKE-CORRECTION-001
- **Resolved Ending Commit:** `fe79da7fb1ac71568c53732e9e7b4c0be04deef4`
- **Resolution Date:** 2026-09-09
- **Recorded In:** Session `AG-F1-003` (`F1-INTAKE-CORRECTION-002`)
- **Reason:** Reconciled historical completion commit `fe79da7fb1ac71568c53732e9e7b4c0be04deef4` in compliance with append-only continuity rules.

---

## Session 2026-09-09 / AG-F1-003

### Identity
- **Agent:** Antigravity
- **Session ID:** `AG-F1-003`
- **Task ID:** `F1-INTAKE-CORRECTION-002`
- **Lifecycle Stage:** `INTAKE_CORRECTION`
- **Tranche:** `F1 — Common CAD Contracts`
- **External Review:** `REV-F1-INTAKE-001-R2` (`NEEDS_FIX / RETURN_TO_INTAKE_CORRECTION`)
- **Work Order:** `NONE` (Intake Correction Stage Only)
- **Starting Commit:** `fe79da7fb1ac71568c53732e9e7b4c0be04deef4`
- **Ending Commit:** PENDING (reconciled post-commit per governance)
- **Dependency:** `F0 — AutoCAD Foundation` (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Current Production Build Authorization:** `NONE`

---

### Objective
1. Persist external re-review `REV-F1-INTAKE-001-R2` into `docs/tranches/F1/REVIEW.md`.
2. Correct `INTAKE.md` Handle semantics:
   - Remove wording claiming AutoCAD Handle is duplicated when entities are copied.
   - Clarify that Handle is persistent across save/reopen and uniquely identifies an AutoCAD database object within a database, but is not the TTC cross-DWG / semantic object identity contract.
   - Clarify that ObjectId is a database-load / in-memory locator and must not be used as persistent TTC identity.
   - Clarify that when an entity is cloned/copied, the clone is a distinct AutoCAD database object with a distinct Handle; the F1 concern is whether TTC metadata (`TTC_OBJECT_ID`) is cloned unchanged, causing TTC logical identity duplication.
   - Phrase exact clone behavior and repair policy as an F1 DESIGN and SPEC investigation.
3. Audit `ISSUE-F1-005` and Risk `RSK-F1-01`:
   - State the risk that `TTC_OBJECT_ID` metadata can be duplicated during cloning without conflating with Handle duplication.
   - Phrase native COPY/XRecord behavior as `HOST BEHAVIOR TO VERIFY IN DESIGN` rather than an established baseline fact.
4. Resolve execution continuity by reconciling `AG-F1-002` ending commit (`fe79da7fb1ac71568c53732e9e7b4c0be04deef4`) and appending `AG-F1-003`.
5. Preserve 10 open issues, zero production mutations, F0 frozen status, and strict build lock (`NONE`).
6. Update continuity records (`docs/tranches/TRANCHE_STATUS.md`, `governance/PROJECT_PROGRESS.md`, `governance/AGENT_HANDOFF.md`).
7. Prepare for independent re-review `REV-F1-INTAKE-001-R3`.

---

### Execution Details
- **Review Persisted:** `REV-F1-INTAKE-001-R2` recorded in `docs/tranches/F1/REVIEW.md`.
- **Intake Corrected:** `docs/tranches/F1/INTAKE.md` Section 2, Section 9, Section 13, and Section 16 updated with accurate Handle/clone semantics.
- **Issues Updated:** `docs/tranches/F1/ISSUES.md` `ISSUE-F1-005` updated to frame native clone behavior as `HOST BEHAVIOR TO VERIFY IN DESIGN`.
- **Production Code Mutation:** ZERO (`production/**` verified unmodified).
- **Frozen F0 Status:** ZERO modifications (`docs/tranches/F0/**` verified untouched).
- **Design / Spec / Work Order:** NOT created (strictly NOT AUTHORIZED).

---

### Downstream Tranche State
- **F0 (AutoCAD Foundation):** `COMPLETE / FROZEN` (Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- **F1 (Common CAD Contracts):** `INTAKE_CORRECTED / INDEPENDENT_RE_REVIEW_PENDING`.
- **P1 (Component Library):** `BLOCKED_BY_F1`.
- **P2 (Component Placement):** `BLOCKED_BY_F1_P1`.
- **P3..P9 (Panel Designer):** `BLOCKED`.
- **M1..M8 (Cable Tray Designer):** `BLOCKED` (Future module).
- **C1, C2 (Standards & Export):** `BLOCKED`.

---

### Next Required Action
Independent technical re-review: `REV-F1-INTAKE-001-R3`. F1 DESIGN remains strictly NOT AUTHORIZED until independent reviewer approval.

---

### Historical Session Addendum (Post-Commit Reconciliation)

- **Session ID:** AG-F1-003
- **Task ID:** F1-INTAKE-CORRECTION-002
- **Resolved Ending Commit:** `df9354d5b679839ed7ed237df52deb395c3e8cb8`
- **Resolution Date:** 2026-09-09
- **Recorded In:** Session `AG-F1-004` (`F1-DESIGN-001`)
- **Reason:** Reconciled historical completion commit `df9354d5b679839ed7ed237df52deb395c3e8cb8` in compliance with append-only continuity rules.

---

## Session 2026-09-09 / AG-F1-004

### Identity
- **Agent:** Antigravity
- **Session ID:** `AG-F1-004`
- **Task ID:** `F1-DESIGN-001`
- **Lifecycle Stage:** `DESIGN`
- **Tranche:** `F1 — Common CAD Contracts`
- **External Intake Review:** `REV-F1-INTAKE-001-R3` (`PASS / PASS_TO_DESIGN`)
- **Work Order:** `NONE` (Architectural Design Stage Only)
- **Starting Commit:** `df9354d5b679839ed7ed237df52deb395c3e8cb8`
- **Ending Commit:** PENDING (reconciled post-commit per governance)
- **Dependency:** `F0 — AutoCAD Foundation` (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Current Production Build Authorization:** `NONE`

---

### Objective
1. Author architectural DESIGN for Tranche F1 (`DESIGN-FOUNDATION-F1-001`).
2. Persist independent review `REV-F1-INTAKE-001-R3` (`PASS / PASS_TO_DESIGN`) in `docs/tranches/F1/REVIEW.md`.
3. Close INTAKE gate in `docs/tranches/F1/INTAKE.md` (`INTAKE_COMPLETE / PASS_TO_DESIGN`).
4. Reconcile execution continuity for `AG-F1-003` (commit `df9354d5b679839ed7ed237df52deb395c3e8cb8`) and append `AG-F1-004`.
5. Create Tranche F1 Front-Door README (`docs/tranches/F1/README.md`).
6. Compile AutoCAD host API verification evidence (`docs/tranches/F1/API_VERIFICATION.md`).
7. Create `docs/tranches/F1/DESIGN.md` covering all 15 required architectural sections (A through O).
8. Update issue dispositions in `docs/tranches/F1/ISSUES.md` (`ISSUE-F1-001` through `ISSUE-F1-010`).
9. Maintain strict immutability: zero production C# code (`production/**`), zero F0 mutations, no `SPEC.md`, no `WORK_ORDER.md`.
10. Update project continuity artifacts (`docs/tranches/TRANCHE_STATUS.md`, `governance/PROJECT_PROGRESS.md`, `governance/AGENT_HANDOFF.md`).
11. Prepare for independent technical review of F1 DESIGN.

---

### Execution Details
- **Review Persisted:** `REV-F1-INTAKE-001-R3` persisted in `docs/tranches/F1/REVIEW.md` (marked read-only).
- **Intake Closed:** `docs/tranches/F1/INTAKE.md` criterion #10 checked, status updated to `INTAKE_COMPLETE / PASS_TO_DESIGN`.
- **Tranche Front-Door Created:** `docs/tranches/F1/README.md` created.
- **API Verification Created:** `docs/tranches/F1/API_VERIFICATION.md` created.
- **Design Document Created:** `docs/tranches/F1/DESIGN.md` (`DESIGN-FOUNDATION-F1-001`, Status: `PROPOSED_DESIGN / INDEPENDENT_REVIEW_PENDING`).
- **Issue Registry Updated:** `docs/tranches/F1/ISSUES.md` updated with DESIGN proposals and dispositions.
- **Production Code Mutation:** ZERO (`production/**` verified unmodified).
- **Frozen F0 Status:** ZERO modifications (`docs/tranches/F0/**` verified untouched).
- **Spec / Work Order:** NOT created (strictly NOT AUTHORIZED).

---

### Downstream Tranche State
- **F0 (AutoCAD Foundation):** `COMPLETE / FROZEN` (Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- **F1 (Common CAD Contracts):** `PROPOSED_DESIGN / INDEPENDENT_REVIEW_PENDING`.
- **P1 (Component Library):** `BLOCKED_BY_F1`.
- **P2 (Component Placement):** `BLOCKED_BY_F1_P1`.
- **P3..P9 (Panel Designer):** `BLOCKED`.
- **M1..M8 (Cable Tray Designer):** `BLOCKED` (Future module).
- **C1, C2 (Standards & Export):** `BLOCKED`.

---

### Next Required Action
Independent technical review of Tranche F1 DESIGN (`DESIGN-FOUNDATION-F1-001`). F1 SPEC and BUILD remain strictly NOT AUTHORIZED.

---

### Historical Session Addendum (Post-Commit Reconciliation)

- **Session ID:** AG-F1-004
- **Task ID:** F1-DESIGN-001
- **Resolved Ending Commit:** `f3f679ac8946c13c08f461f6ecc0e8dba6d91e2f`
- **Resolution Date:** 2026-09-09
- **Recorded In:** Session `AG-F1-005` (`F1-DESIGN-CORRECTION-001`)
- **Reason:** Reconciled historical completion commit `f3f679ac8946c13c08f461f6ecc0e8dba6d91e2f` in compliance with append-only continuity rules.

---

## Session 2026-09-09 / AG-F1-005

### Identity
- **Agent:** Antigravity
- **Session ID:** `AG-F1-005`
- **Task ID:** `F1-DESIGN-CORRECTION-001`
- **Lifecycle Stage:** `DESIGN_CORRECTION`
- **Tranche:** `F1 — Common CAD Contracts`
- **External Design Review:** `REV-F1-DESIGN-001` (`NEEDS_FIX / RETURN_TO_DESIGN_CORRECTION`)
- **Work Order:** `NONE` (Architectural Design Correction Stage Only)
- **Starting Commit:** `f3f679ac8946c13c08f461f6ecc0e8dba6d91e2f`
- **Ending Commit:** PENDING (reconciled post-commit per governance)
- **Dependency:** `F0 — AutoCAD Foundation` (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Current Production Build Authorization:** `NONE`

---

### Objective
1. Persist independent review `REV-F1-DESIGN-001` (`NEEDS_FIX / RETURN_TO_DESIGN_CORRECTION`) in `docs/tranches/F1/REVIEW.md`.
2. Correct architectural design and API verification defects:
   - `D01`: Remove silent millimeter assumption for unitless drawings (`INSUNITS=0`). Establish strict precedence (project config -> explicit non-zero INSUNITS -> unresolved unitless requiring approved config or user confirmation). Clarify `MEASUREMENT` controls hatch/linetype libraries only; `LUNITS` is coordinate display format only.
   - `D02`: Remove invented angular tolerance candidate ($10^{-5}\text{ rad}$). Maintain linear $\varepsilon = 10^{-4}\text{ mm}$ as the sole authorized roadmap candidate; mark all other numerical thresholds `TO_BE_DETERMINED_IN_SPEC`.
   - `D03`: Establish canonical metadata-location matrix for 5 baseline keys (`TTC_OBJECT_TYPE`, `TTC_OBJECT_ID`, `TTC_SCHEMA_VERSION`, `TTC_LIBRARY_ID`, `TTC_LIBRARY_VERSION`). Define `ExtensionDictionary / XRecord` as primary authoritative source of truth, `XData` as secondary query cache/index, and resynchronization rules.
   - `D04`: Correct `TTC_OBJECT_ID` scope: uniquely identifies one TTC-managed AutoCAD drawing object instance. Remove conflation with catalog, BOM, or EPLAN IDs. Decouple from `TTC_LIBRARY_ID`. Evaluate pure UUIDv4 vs Prefixed Slug (semantic divergence on reclassification).
   - `D05`: Redesign clone identity repair into two states: State A (provenance known -> new ID assigned to clone); State B (duplicate discovered / provenance unknown -> classified `COLLISION_UNRESOLVED`, no silent guessing of original, controlled reconciliation in SPEC). Classify pre-save mutation via `Database.BeginSave` as `HOST_TEST_REQUIRED`. Define generic `IEntityIdentityAuditService`.
   - `D06`: Make `API_VERIFICATION.md` independently auditable with exact Autodesk 2023 documentation URLs, correct ~16 KB total XData limit across all applications, correct XRecord database object bounds, and cleanly distinguish host notification guidelines (`HOST_FACT_SOURCE_VERIFIED`) from TTC stability rules (`PROJECT_POLICY`).
   - `D07`: Audit native lifecycle matrix: correct `MIRROR` conditional handle semantics (new handle only if source preserved); classify host facts vs design policies.
   - `D08`: Align namespaces with frozen F0 assembly `TTC.CadTools.AutoCAD` (no rename to `Acad`).
   - `D12`: Replace trailing-fields assumption with keyed/tagged schema preserving unrecognized entries anywhere.
   - `D13`: Distinguish Common F1 Block Contract from downstream Panel P1/P2 asset recommendations.
3. Update canonical issue registry `docs/tranches/F1/ISSUES.md` (`ISSUE-F1-001` through `ISSUE-F1-010`).
4. Reconcile execution continuity for `AG-F1-004` (commit `f3f679ac8946c13c08f461f6ecc0e8dba6d91e2f`) and append `AG-F1-005`.
5. Update front-door `README.md` and master continuity artifacts (`docs/tranches/TRANCHE_STATUS.md`, `governance/PROJECT_PROGRESS.md`, `governance/AGENT_HANDOFF.md`).
6. Maintain strict immutability: zero production code changes (`production/**`), zero F0 changes, no `SPEC.md`, no `WORK_ORDER.md`.
7. Prepare for independent re-review `REV-F1-DESIGN-001-R2`.

---

### Execution Details
- **Review Persisted:** `REV-F1-DESIGN-001` recorded in `docs/tranches/F1/REVIEW.md` (marked read-only).
- **API Verification Corrected:** `docs/tranches/F1/API_VERIFICATION.md` updated with exact documentation URLs, corrected XData limits, and policy distinctions.
- **Design Corrected:** `docs/tranches/F1/DESIGN.md` updated to v0.2.0 addressing findings D01 through D08, D12, and D13.
- **Issue Registry Updated:** `docs/tranches/F1/ISSUES.md` updated with corrected statuses and resolutions.
- **Front-Door Updated:** `docs/tranches/F1/README.md` updated to reflect `DESIGN_CORRECTION` stage.
- **Production Code Mutation:** ZERO (`production/**` verified unmodified).
- **Frozen F0 Status:** ZERO modifications (`docs/tranches/F0/**` verified untouched).
- **Spec / Work Order:** NOT created (strictly NOT AUTHORIZED).

---

### Downstream Tranche State
- **F0 (AutoCAD Foundation):** `COMPLETE / FROZEN` (Baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`).
- **F1 (Common CAD Contracts):** `DESIGN_CORRECTED / INDEPENDENT_RE_REVIEW_PENDING`.
- **P1 (Component Library):** `BLOCKED_BY_F1`.
- **P2 (Component Placement):** `BLOCKED_BY_F1_P1`.
- **P3..P9 (Panel Designer):** `BLOCKED`.
- **M1..M8 (Cable Tray Designer):** `BLOCKED` (Future module).
- **C1, C2 (Standards & Export):** `BLOCKED`.

---

### Next Required Action
Independent technical re-review: `REV-F1-DESIGN-001-R2`. F1 SPEC and BUILD remain strictly NOT AUTHORIZED until independent reviewer approval.
