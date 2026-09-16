# Tranche F1: Common CAD Contracts 鈥?Independent Review Log

> [!IMPORTANT]
> **Role Separation Notice:**
> Antigravity is the implementation/recording agent.
> Independent reviews are conducted by ChatGPT / Independent Technical Reviewer.
> Antigravity MUST NOT self-review or declare review passes.
> After recording an external review, this file is READ-ONLY for the remainder of the correction task.

---

## 1. Status Summary

- **Tranche:** F1 — Common CAD Contracts
- **Lifecycle Stage:** SPEC_CORRECTION
- **Current Review:** `REV-F1-SPEC-001-R3`
- **Current Result:** `NEEDS_FIX`
- **Current Disposition:** `RETURN_TO_SPEC_CORRECTION`
- **F1 SPEC:** `CORRECTION_IN_PROGRESS`
- **Spec Freeze:** `NOT AUTHORIZED`
- **Work Order:** `NOT AUTHORIZED`
- **Build:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`
- **Expected Next Review:** `REV-F1-SPEC-001-R4`



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

---

## 8. Independent Review: REV-F1-SPEC-001

- **Review ID:** `REV-F1-SPEC-001`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-16
- **Reviewed Commit:** `6f54532beae065919091eabe6b3dcc452c4eece3`
- **Reviewed Artifact:** `SPEC-FOUNDATION-F1-001 v0.1.0` (`docs/tranches/F1/SPEC.md`)
- **Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_SPEC_CORRECTION`
- **Governance Compliance:** `PASS`
- **Technical Specification:** `NEEDS_FIX`

### Findings Summary
- **F01 — CRITICAL — TTC_OBJECT_ID cross-DWG uniqueness semantics:** `SPEC.md` §5 limits `TTC_OBJECT_ID` identity/uniqueness to a single AutoCAD database, contradicting global instance uniqueness across drawings and creating ambiguity for WBLOCK, INSERT, COPYCLIP, PASTECLIP. Independent drawing-object instances across drawings must have globally unique IDs.
- **F02 — HIGH — Invalid XRecord DXF code definition:** `SPEC.md` §7.3 specifies `DxfCode.Text (1000 or 1)` for XRecord key/value data. In AutoCAD, XRecord uses standard group codes below 1000 (e.g. 1 / `DxfCode.Text`); group codes 1000+ are strictly reserved for XData. 1000 must not be specified as interchangeable XRecord text code. Correct capacity wording from 2 GB per object to accurate XRecord capacity.
- **F03 — HIGH — Native clone mechanism inaccuracies:** Correct §10 clone mechanism table and `API_VERIFICATION.md`: COPY, ARRAY, MIRROR (source preserved), and INSERT drawing use deepClone; COPYCLIP, PASTECLIP, WBLOCK use wblockClone; MIRROR (source erased) transforms in-place without deepClone; EXPLODE does not clone.
- **F04 — HIGH — Command-boundary API/context correction:** DESIGN/SPEC refer to `Editor.CommandEnded`, but managed .NET event is `Document.CommandEnded`. Document registration lifecycle, DocumentLock/Transaction requirements for reconciliation, and handling for `CommandEnded`, `CommandCancelled`, `CommandFailed` must be specified. Reactors remain observation-only. Add BUILD host validation for command-boundary reconciliation.
- **F05 — HIGH — Acceptance Criteria to BUILD-test traceability incomplete:** 25 ACs must map explicitly to concrete named BUILD tests. Every AC with `AUTOCAD_HOST_TEST` must map to at least one named `TEST-F1-xx`. Add tests to cover WBLOCK, INSERT, COPYCLIP/PASTECLIP, ERASE, OOPS, UNDO, REDO, SAVE/REOPEN, BLOCK REDEFINE, orphan XData, malformed metadata, unsupported schema, mismatch recovery, reactor safety, modeless DocumentLock, transaction rollback, zero-doc safety, vanilla DWG.
- **F06 — HIGH — Invalid proxy compatibility evidence:** `TEST-F1-07` verifying `PROXYNOTICE = 0` suppresses warnings rather than proving zero proxy objects. Must use genuine validation without altering workstation settings.
- **F07 — MEDIUM — Unit conversion precision and asset-unit default:** `AC-F1-04` absolute "zero scaling error" must be replaced with deterministic numerical precision requirement. Missing asset-unit metadata must not silently become millimeters at F1 common level.
- **F08 — MEDIUM — Downstream scope leakage in Common Block Contract:** De-normativize F1 rules belonging to downstream owners (exact `TTC_CLEARANCE_*` layer naming to C1, vendor catalog static block mandate to P1, electrical mirror polarity to P6). Reclassify as downstream recommendations.
- **F09 — MEDIUM — Schema/recovery ambiguity:** Remove ambiguous wording such as `METADATA_INCOMPLETE (or UNREGISTERED_TTC_ASSET)`. Use one canonical machine-readable failure status (`METADATA_INCOMPLETE`). Clarify v1.0.0 behavior; do not claim migration for undefined older schemas.

### Authority
- **F1 SPEC CORRECTION:** `AUTHORIZED`
- **F1 SPEC FREEZE:** `NOT AUTHORIZED`
- **WORK ORDER:** `NOT AUTHORIZED`
- **BUILD:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`

After recording, this file is READ-ONLY for task `F1-SPEC-CORRECTION-001`.

---

## 9. Independent Re-Review: REV-F1-SPEC-001-R2

- **Review ID:** `REV-F1-SPEC-001-R2`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-16
- **Reviewed HEAD:** `91f7a19821e0717bfe6efd87ccd8c14a7e14b65d`
- **Reviewed Artifact:** `SPEC-FOUNDATION-F1-001 v0.2.0` (`docs/tranches/F1/SPEC.md`)
- **Previous Review:** `REV-F1-SPEC-001`
- **Governance Result:** `PASS`
- **Technical Result:** `NEEDS_FIX`
- **Review Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_SPEC_CORRECTION`

### Previous Finding Closure State (F01–F09)
- **F01 — Cross-DWG identity semantics:** `RESOLVED` (§5.1, §5.3, §10, §11, AC-F1-12, TEST-F1-12).
- **F02 — XRecord DXF codes and capacity:** `RESOLVED` (§7.1, §7.3, SRC-F1-03, API-F1-03).
- **F03 — Native clone mechanisms:** `RESOLVED` (§10, API_VERIFICATION.md).
- **F04 — Command-boundary lifecycle events:** `RESOLVED` (§12.2, §13, AC-F1-21, TEST-F1-15).
- **F05 — AC to BUILD test traceability:** `RESOLVED` (§17, TEST-F1-01..25).
- **F06 — Proxy compatibility evidence:** `RESOLVED` (AC-F1-23, TEST-F1-07, §18.4).
- **F07 — Unit precision & block defaults:** `PARTIALLY_RESOLVED` (Asset units default to mm fixed, but introduced unauthorized `< 1e-9 mm` bound).
- **F08 — Downstream scope leakage:** `RESOLVED` (§14, §19).
- **F09 — Canonical failure statuses:** `RESOLVED` (§7.2, §9.2, §15, AC-F1-16).

### New / Residual Findings
- **R2-F01 — MEDIUM — Unauthorized numerical precision threshold:** `AC-F1-04` specified `maximum numerical deviation < 1e-9 mm` without architectural authority. The linear coincidence tolerance $\varepsilon = 10^{-4}\text{ mm}$ must not be reused as a generic floating-point conversion accuracy threshold. Rewrite unit conversion contract to use explicit authoritative physical conversion constants (`MillimetersPerDrawingUnit`) and IEEE 754 `double` precision.
- **R2-F02 — MEDIUM — Undo/Redo integrity risk for post-command identity reconciliation:** Command-boundary reconciliation in `Document.CommandEnded` may have a different Undo boundary from native clone commands. Freeze the behavioral invariant: after any clone + subsequent UNDO/REDO sequence, the active database must not contain independently active TTC-managed instances sharing one valid `TTC_OBJECT_ID`. Mark exact AutoCAD Undo stack integration as `BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED`.
- **R2-F03 — LOW — Existing documents not explicitly subscribed at plugin initialization:** Plugin initialization (`IExtensionApplication.Initialize()`) must enumerate open documents in `Application.DocumentManager`, attach handlers (`CommandEnded`, `CommandCancelled`, `CommandFailed`) once per document, and subscribe to `DocumentCreated` for future documents.
- **R2-F04 — LOW — Unit conversion notation is dimensionally ambiguous:** Expressions like $Factor = DrawingUnit / Millimeter$ and $Scale = AssetUnit / DrawingUnit$ are ambiguous. Introduce explicit dimensional names: `MillimetersPerDrawingUnit`, `MillimetersPerAssetUnit`, and `ExpectedInsertionScale = MillimetersPerAssetUnit / MillimetersPerDrawingUnit`.
- **R2-F05 — LOW — MISSING_BLOCK_ASSET semantics are ambiguous:** Define `MISSING_BLOCK_ASSET` as a TTC/library-level condition (requested `TTC_LIBRARY_ID` cannot resolve to usable block asset, source block definition unavailable, library file unavailable) rather than an impossible healthy database condition where a valid `BlockReference` points to a non-existent `BlockTableRecord`.
- **R2-F06 — MEDIUM — Missing authoritative fallback discovery when XData index is absent:** Fast selection query targeting `"TTC_CAD"` XData cannot discover entities when XData is missing. Define a generic F1 audit/index rebuild service (`ITtcMetadataAuditService` / `IEntityIdentityAuditService`) capable of bounded authoritative discovery from ExtensionDictionary / `TTC_METADATA_HEADER` and index rebuilding at safe boundaries.

### Authority
- **F1 SPEC CORRECTION:** `AUTHORIZED`
- **F1 SPEC FREEZE:** `NOT AUTHORIZED`
- **WORK ORDER:** `NOT AUTHORIZED`
- **BUILD:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`

After recording, this file is READ-ONLY for task `F1-SPEC-CORRECTION-002`.

---

## 10. Independent Re-Review: REV-F1-SPEC-001-R3

- **Review ID:** `REV-F1-SPEC-001-R3`
- **Reviewer:** ChatGPT / Independent Technical Reviewer
- **Recorded By:** Antigravity
- **Date:** 2026-09-16
- **Reviewed HEAD:** `2e25d6205c9ca0e8260c2755935995dc593d00d6`
- **Reviewed Artifact:** `SPEC-FOUNDATION-F1-001 v0.3.0` (`docs/tranches/F1/SPEC.md`)
- **Previous Review:** `REV-F1-SPEC-001-R2`
- **Governance Result:** `PASS`
- **Technical Result:** `NEEDS_FIX`
- **Review Result:** `NEEDS_FIX`
- **Disposition:** `RETURN_TO_SPEC_CORRECTION`

### Previous Finding Closure State (R2-F01–R2-F06)
- **R2-F01 — Numerical precision threshold:** `RESOLVED_IN_PRINCIPLE / PRECISION_IMPROVEMENT_NEEDED` (Removed `< 1e-9 mm`, but test acceptance requires deterministic reference-based values).
- **R2-F02 — Undo/Redo behavioral invariant:** `RESOLVED` (Frozen database invariant in §10.1; host grouping marked `BUILD_VALIDATION_REQUIRED`).
- **R2-F03 — Existing documents startup subscription:** `RESOLVED` (§12.2, TEST-F1-26, per-document isolation in §12.4).
- **R2-F04 — Dimensional conversion names:** `RESOLVED` (`MillimetersPerDrawingUnit`, `ExpectedInsertionScale`).
- **R2-F05 — MISSING_BLOCK_ASSET clarification:** `RESOLVED` (§14 domain 12, §15 deterministic failure matrix).
- **R2-F06 — Authoritative fallback discovery:** `RESOLVED` (§7.2, §8.4 `ITtcMetadataAuditService`, TEST-F1-27).

### New / Residual Findings
- **R3-F01 — HIGH — Align command-boundary reconciliation authority:** Reconcile conflicting descriptions of command-boundary mutation. Database reactors remain strictly observation-only (zero writes). Document command-boundary handlers (`CommandEnded`, `CommandCancelled`, `CommandFailed`) detect reconciliation work. Persistent reconciliation directly under `DocumentLock` + `Transaction` or via scheduled/deferred context is permitted as an implementation mechanism whose exact host/undo safety is `BUILD_VALIDATION_REQUIRED / HOST_TEST_REQUIRED`. The frozen requirement is the resulting behavioral invariant.
- **R3-F02 — MEDIUM — Make numerical conversion acceptance deterministic:** Replace vague numerical acceptance wording ("within machine epsilon", "standard engineering coordinates", "exact mathematical reference values") with a deterministic reference-based test suite in `TEST-F1-28` using explicit test coordinates (0, 1, -1, small coordinate, typical coordinate, large coordinate). Define comparison criterion using software numerical policy appropriate for IEEE 754 doubles as a `TEST_IMPLEMENTATION_DETAIL`. Deprecate historical `< 1e-9 mm>` in DESIGN.
- **R3-F03 — MEDIUM — Define one schema compatibility matrix:** Create one normative matrix in §9: `1.0.x` on `1.0.x` supported read/write; `1.0.x` on future `1.N.x` reads known fields, preserves unknown fields, performs writes only if unknown fields are preserved, and does not downgrade schema version; `1.0.x` on `2.x.x` triggers `UNSUPPORTED_SCHEMA` (read-only protection, no mutation, geometry preserved); malformed triggers `INVALID_METADATA`. Remove unsupported "defaults older minor versions" wording.
- **R3-F04 — MEDIUM — Align Undo/Redo normative scope and test coverage:** Explicitly distinguish Category A (active database clone/mutation commands: `COPY`, `ARRAY`, `MIRROR` preserve-source, `PASTECLIP`, `INSERT`, `ERASE/OOPS`) with Undo/Redo invariant from Category B (cross-database export: `WBLOCK`, requiring source integrity and independent target identities under AC-F1-12/TEST-F1-12). Align `AC-F1-18` and `TEST-F1-21` to include `INSERT`.
- **R3-F05 — LOW — Complete API source traceability:** Add official Autodesk documentation source `SRC-F1-10` covering Managed .NET Document and DocumentCollection events, and link from `API-F1-08`. Frame non-retroactive event subscription as `PROJECT_POLICY / ARCHITECTURAL_CONSEQUENCE`.

### Authority
- **F1 SPEC CORRECTION:** `AUTHORIZED`
- **F1 SPEC FREEZE:** `NOT AUTHORIZED`
- **WORK ORDER:** `NOT AUTHORIZED`
- **BUILD:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`
- **Next Task:** `F1-SPEC-CORRECTION-003`
- **Expected Next Review:** `REV-F1-SPEC-001-R4`

After recording, this file is READ-ONLY for task `F1-SPEC-CORRECTION-003`.
