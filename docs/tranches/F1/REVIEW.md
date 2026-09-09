# Tranche F1: Common CAD Contracts 鈥?Independent Review Log

> [!IMPORTANT]
> **Role Separation Notice:**
> Antigravity is the implementation/recording agent.
> Independent reviews are conducted by ChatGPT / Independent Technical Reviewer.
> Antigravity MUST NOT self-review or declare review passes.
> After recording an external review, this file is READ-ONLY for the remainder of the correction task.

---

## 1. Status Summary

- **Tranche:** F1 鈥?Common CAD Contracts
- **Lifecycle Stage:** SPEC
- **Current Review:** `REV-F1-DESIGN-001-R3`
- **Current Result:** `PASS`
- **Current Disposition:** `PASS_TO_SPEC`
- **F1 DESIGN:** `COMPLETE / REVIEWED_PASS`
- **F1 SPEC:** `AUTHORIZED / DRAFT_IN_PROGRESS`
- **Production Build Authorization:** `NONE`
- **Expected Next Review:** Independent Technical Review of F1 SPEC



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

- **F01 鈥?Unit contract overclaim:** INTAKE stated that all internal engineering calculations across all TTC modules MUST operate in millimeters. Architecture Roadmap 搂42 specifies that panel mechanical drawings assume millimeters, but M&E drawings have configurable project drawing units. The implementation must not assume all drawings are millimeters without checking configuration/drawing units. Exact normalization belongs to DESIGN/SPEC.
- **F02 鈥?F0 logging path drift:** Inherited frozen logging path was recorded as `%APPDATA%\TTC\Logs` instead of the frozen F0 contract `%APPDATA%\TTC_CadTools\Logs\` (fallback `%TEMP%\TTC_CadTools\Logs\`).
- **F03 鈥?Incorrect AutoCAD Handle semantics:** Problem statement claimed AutoCAD `Handle` is transient. In AutoCAD, `Handle` is persistent across sessions and save/reopen, but unique only within a single Database (not globally unique across databases, and cloned on copy). Transient session locator is `ObjectId`.
- **F04 鈥?Silent design/standard invention:** `ISSUE-F1-003` introduced unverified exact tolerance values (e.g. angular $10^{-6}\text{ rad}$, zero-length $10^{-5}\text{ mm}$). `ISSUE-F1-004` prematurely recommended Prefixed Slug + UUID during INTAKE. `ISSUE-F1-002` made an unverified assertion about Vietnamese drafting template history without Git authority.
- **F05 鈥?Premature reviewer exit-gate checkbox:** `INTAKE.md` Section 15 checked criterion #10 (Independent Technical Reviewer reviews and issues disposition allowing entry into DESIGN) while the review had not passed.
- **F06 鈥?Execution-log Ending Commit unresolved:** `EXECUTION_LOG.md` for session `AG-F1-001` left `Ending Commit: PENDING` in the committed repository history.
- **F07 鈥?Over-broad DocumentLock requirement:** `INTAKE.md` stated blanket requirement that every database modification requires `DocumentLock`. Explicit locks are required for modeless/application contexts, but not for standard modal current-document commands.

### Reviewer Directives
1. Correct technical/authority/continuity defects in `INTAKE.md`, `ISSUES.md`, `EXECUTION_LOG.md`, and continuity files.
2. Maintain `INSUNITS = 4` and $\varepsilon = 10^{-4}\text{ mm}$ strictly as `CANDIDATE` standards.
3. Authoring F1 DESIGN is **NOT AUTHORIZED**.
4. Resubmit for independent re-review: `REV-F1-INTAKE-001-R2`.

---

## 3. Independent Re-Review: REV-F1-INTAKE-001-R2

- **Review ID:** `REV-F1-INTAKE-001-R2`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-09
- **Reviewed Commit:** `fe79da7fb1ac71568c53732e9e7b4c0be04deef4`
- **Reviewed Scope:** `docs/tranches/F1/INTAKE.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/EXECUTION_LOG.md`, `docs/tranches/F1/REVIEW.md`, continuity artifacts.
- **Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_INTAKE_CORRECTION`

### Residual Findings

- **R01 鈥?Handle Semantics Inaccuracy:** `INTAKE.md` stated that AutoCAD `Handle` "is duplicated when entities are copied." In AutoCAD, `Handle` is an immutable, unique identifier within a single `Database`; when an entity is cloned/copied, AutoCAD assigns a new, distinct `Handle` to the clone. The actual F1 identity concern is whether application metadata in the Extension Dictionary / `XRecord` (specifically `TTC_OBJECT_ID`) is cloned unchanged, causing TTC logical identity duplication.
- **R02 鈥?Unverified Native Clone / XRecord Behavior:** `ISSUE-F1-005` and Risk `RSK-F1-01` asserted native deep-cloning of `ExtensionDictionary` / `TTC_OBJECT_ID` as an already-proven universal fact rather than a host behavior to be investigated and verified during DESIGN.

### Reviewer Directives
1. Remove statement that Handle is duplicated when entities are copied.
2. Formulate Handle vs ObjectId vs TTC_OBJECT_ID factual distinctions properly:
   - Handle is persistent across save/reopen and identifies an AutoCAD database object within a database.
   - Handle is not the TTC cross-DWG / semantic object identity contract.
   - ObjectId is a database-load/in-memory locator and must not be used as persistent TTC identity.
   - When a TTC entity is cloned/copied, the clone is a distinct AutoCAD database object; the F1 concern is whether TTC metadata (`TTC_OBJECT_ID`) is cloned unchanged, causing TTC identity duplication.
   - Exact clone behavior and repair policy remains an F1 DESIGN/SPEC investigation.
3. Audit `ISSUE-F1-005` and `RSK-F1-01` to phrase native COPY / XRecord behavior as `HOST BEHAVIOR TO VERIFY IN DESIGN`.
4. Resolve execution continuity for `AG-F1-002` (commit `fe79da7fb1ac71568c53732e9e7b4c0be04deef4`) and append session `AG-F1-003`.
5. Authoring F1 DESIGN remains strictly **NOT AUTHORIZED**.
6. Resubmit for independent re-review: `REV-F1-INTAKE-001-R3`.

---

## 4. Independent Review: REV-F1-INTAKE-001-R3

- **Review ID:** `REV-F1-INTAKE-001-R3`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-09
- **Reviewed Commit:** `df9354d5b679839ed7ed237df52deb395c3e8cb8`
- **Reviewed Scope:** `docs/tranches/F1/INTAKE.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/EXECUTION_LOG.md`, `docs/tranches/F1/REVIEW.md`, continuity artifacts.
- **Result:** `PASS`
- **Disposition:** `PASS_TO_DESIGN`

### Evaluation
- **F0 dependency/immutability:** PASS (Frozen F0 baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf` remains untouched).
- **Intake scope:** PASS (Clear problem statement, domains A through L, non-goals, stakeholders).
- **Candidate-vs-standard discipline:** PASS (`INSUNITS = 4` and $\varepsilon = 10^{-4}\text{ mm}$ strictly maintained as candidates).
- **Units boundary:** PASS (Respects Architecture Roadmap 搂42: panel = mm assumption, M&E = configurable project units, Core = normalized units where practical).
- **Handle / ObjectId / TTC_OBJECT_ID semantics:** PASS (Factual distinction properly maintained; Handle identified as persistent database object identity within DWG, not duplicated on clone; ObjectId as transient memory locator; TTC_OBJECT_ID as cross-DWG / clone-safe contract).
- **Clone / XRecord uncertainty classification:** PASS (Native copy / dictionary deep-clone classified as `HOST BEHAVIOR TO VERIFY IN DESIGN`).
- **Metadata / lifecycle problem boundary:** PASS (Native lifecycle cases MOVE..REDEFINE, failure scenarios systematically identified).
- **Transaction / DocumentLock boundary:** PASS (Managed transactions required for DB mutation; explicit DocumentLock required contextually for modeless UI / application contexts).
- **Ten canonical issues:** VALID / OPEN FOR DESIGN-SPEC (`ISSUE-F1-001` through `ISSUE-F1-010`).
- **Production mutation:** NONE (`production/**` verified unmodified).

### Authority
- **F1 DESIGN:** `AUTHORIZED`
- **F1 SPEC:** `NOT AUTHORIZED`
- **F1 BUILD:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`

---

## 5. Independent Review: REV-F1-DESIGN-001

- **Review ID:** `REV-F1-DESIGN-001`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-09
- **Reviewed Commit:** `f3f679ac8946c13c08f461f6ecc0e8dba6d91e2f`
- **Reviewed Scope:** `docs/tranches/F1/DESIGN.md`, `docs/tranches/F1/API_VERIFICATION.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/README.md`, `docs/tranches/F1/EXECUTION_LOG.md`, continuity artifacts.
- **Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_DESIGN_CORRECTION`

### Findings

- **D01 鈥?Unitless drawing inference is unsafe:** `DESIGN.md` assumed `INSUNITS = 0` + `MEASUREMENT = 1` implies 1 drawing unit = 1 mm. `MEASUREMENT` controls hatch and linetype defaults, not model geometry units; `LUNITS` is display format only. Unitless drawings must have `PhysicalUnitResolution = UNRESOLVED` until resolved by approved project configuration or user confirmation. No silent millimeter assumption.
- **D02 鈥?Unsupported numerical tolerance candidate introduced:** `AngularAlignment candidate = 1e-5 rad` and other exact numbers were introduced without repository authority. The only roadmap candidate is linear $\varepsilon = 10^{-4}\text{ mm}$. All other fields must remain `TO_BE_DETERMINED_IN_SPEC`.
- **D03 鈥?TTC_OBJECT_ID canonical storage contradiction:** Contradictions existed between `DESIGN.md`, `API_VERIFICATION.md`, and `ISSUES.md` regarding XData vs XRecord storage. A canonical metadata-location matrix must define authoritative source of truth, secondary caching, and mismatch resolution.
- **D04 鈥?TTC_OBJECT_ID scope conflates drawing identity with catalog/BOM:** `TTC_OBJECT_ID` was described as identifying an equipment instance "across drawings, catalogs, and BOMs." It identifies only one TTC-managed AutoCAD drawing object instance. Catalog/library references belong to `TTC_LIBRARY_ID`. Strict EPLAN separation must be maintained.
- **D05 鈥?Duplicate identity repair strategy cannot reliably identify original:** Determining "original" via earlier Handle, CreatedTimestamp, or metadata timestamp is unreliable in WBLOCK/INSERT/clipboard cases. Must design two distinct states: (A) Clone provenance known, and (B) Duplicate discovered / provenance unknown (no silent arbitrary rewriting). Pre-save mutation via `Database.BeginSave` is unverified and must be classified `HOST_TEST_REQUIRED`. Generic F1 identity audit service boundary required.
- **D06 鈥?API verification evidence contains accuracy/traceability defects:** Lacked official Autodesk documentation references/URLs. XData capacity was misstated as 16,383 bytes per registered app (actual: approximately 16 KB per object total, shared across all applications). XRecord capacity was described as "arbitrary/unlimited". Event/reactor evidence conflated Autodesk API restrictions with TTC project design policies.
- **D07 鈥?Native lifecycle matrix overclaims host behavior:** MIRROR does not unconditionally create a new Handle if source is erased. Conflated host facts with TTC design policies and unverified behaviors.
- **D08 鈥?Frozen AutoCAD assembly/namespace boundary drift:** Silently introduced `TTC.CadTools.Acad` instead of the frozen F0 assembly `TTC.CadTools.AutoCAD`.

### Reviewer Directives
1. Correct architectural design and API verification defects (D01 through D08).
2. Authoring F1 SPEC is **NOT AUTHORIZED**.
3. Work Order creation is **NOT AUTHORIZED**.
4. Production code mutation is **NOT AUTHORIZED** (`production/**` remains untouched).
5. Tranche F0 remains **FROZEN** (`docs/tranches/F0/**` untouched).
6. Resubmit for independent re-review: `REV-F1-DESIGN-001-R2`.

After recording, this file is READ-ONLY for the remainder of task `F1-DESIGN-CORRECTION-001`.

---

## 6. Independent Re-Review: REV-F1-DESIGN-001-R2

- **Review ID:** `REV-F1-DESIGN-001-R2`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-09
- **Reviewed Commit:** `b9911a6f0985b71a689ef858f9ed383a48e73e41`
- **Reviewed Scope:** `docs/tranches/F1/DESIGN.md`, `docs/tranches/F1/API_VERIFICATION.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/README.md`, `docs/tranches/F1/EXECUTION_LOG.md`, continuity artifacts.
- **Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_DESIGN_CORRECTION`

### Findings

- **R2-D01 鈥?Issue gate deadlock:** `ISSUE-F1-005` created a circular lifecycle dependency by requiring host tests scheduled in BUILD as a prerequisite for `SPEC_FREEZE`. Architectural spec invariant must be separated from runtime test evidence.
- **R2-D02 鈥?MIRROR/API contradiction:** Unconditional statements claiming `COPY`, `ARRAY`, `MIRROR` always invoke deepClone contradicted host facts. MIRROR uses deepClone only when original objects are preserved; if original objects are erased, deepClone is not used and the original objects are mirrored.
- **R2-D03 鈥?API verification residual accuracy/traceability:** Lacked direct reference to Autodesk documentation *"AutoCAD Commands That Use Deep Clone and Wblock Clone"*. XRecord capacity was not grounded in Autodesk-supported reference (up to 2 GB per XRecord).
- **R2-D04 鈥?Identity wording residuals:** Claimed EPLAN device tagging belongs to C2 (it belongs exclusively to separate EPLAN 2022 toolchain; C2 owns only DWG/DXF export). Described UUIDv4 as "100% collision-free" (should be practical global uniqueness with negligibly small collision probability).
- **R2-D05 鈥?Unit configuration conflict missing:** Lacked explicit conflict handling when project configuration and non-zero `INSUNITS` contradict (e.g. Project = Millimeters, INSUNITS = Inches). A distinct `UNIT_CONFIGURATION_CONFLICT` state is required.
- **R2-D06 鈥?Block Asset Contract incomplete:** Section J lacked coverage for several required block concerns (mounting reference, drawing units, rotation, attributes, definition versioning, redefinition, missing assets) and arbitrary 1-nesting level was presented as established invariant rather than candidate.
- **R2-D07 鈥?Event/cache mechanism needs correction:** Unsubstantiated claims regarding "compare database transaction sequence or timestamp" must be removed. `BeginSave` must not depend on interactive prompts or SendStringToExecute.

### Reviewer Directives
1. Close residual findings R2-D01 through R2-D07 in `DESIGN.md`, `API_VERIFICATION.md`, `ISSUES.md`, and continuity files.
2. Authoring F1 SPEC is **NOT AUTHORIZED**.
3. Work Order creation is **NOT AUTHORIZED**.
4. Production code mutation is **NOT AUTHORIZED** (`production/**` remains untouched).
5. Tranche F0 remains **FROZEN** (`docs/tranches/F0/**` untouched).
6. Resubmit for independent re-review: `REV-F1-DESIGN-001-R3`.

After recording, this file is READ-ONLY for the remainder of task `F1-DESIGN-CORRECTION-002`.

---

## 7. Independent Review: REV-F1-DESIGN-001-R3

- **Review ID:** `REV-F1-DESIGN-001-R3`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-10
- **Reviewed Commit:** `628ecb6ea7119c0cf76c4187473b98e2e6659f74`
- **Reviewed Scope:** `docs/tranches/F1/DESIGN.md`, `docs/tranches/F1/API_VERIFICATION.md`, `docs/tranches/F1/ISSUES.md`, `docs/tranches/F1/README.md`, `docs/tranches/F1/EXECUTION_LOG.md`, continuity artifacts.
- **Result:** `PASS`
- **Disposition:** `PASS_TO_SPEC`

### Evaluation
- **Design scope coverage:** PASS
- **Unit architecture:** PASS
- **Unitless/conflict handling:** PASS
- **Tolerance discipline:** PASS
- **Identity scope:** PASS
- **Metadata authority model:** PASS
- **Schema/version model:** PASS
- **Clone lifecycle design:** PASS
- **SPEC/BUILD gate separation:** PASS
- **Native lifecycle semantics:** PASS
- **API verification evidence:** PASS_FOR_SPEC_AUTHORING
- **Block contract coverage:** PASS
- **Reactor/cache strategy:** PASS
- **Frozen F0 assembly boundary:** PASS
- **F0 immutability:** PASS
- **Production mutation:** NONE

### Authority
- **F1 SPEC AUTHORING:** `AUTHORIZED`
- **F1 SPEC FREEZE:** `NOT AUTHORIZED`
- **WORK ORDER:** `NOT AUTHORIZED`
- **BUILD:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`

After recording, this file is READ-ONLY for task `F1-SPEC-001`.
