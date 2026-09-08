# TTC CAD — Agent Work Order Template

Status: DRAFT
Work Order ID: WO-<MODULE>-<FEATURE>-<NNN>
Tranche ID: <F0 / F1 / P1 / etc.>
Owner/Dispatcher: <human/orchestrator>
Implementer: Antigravity
Reviewer: <reviewer>
Date: <YYYY-MM-DD>
Base Commit/Version: <commit/tag>

## Dispatch Prompt Envelope

Read this Work Order and every artifact in `Required First Reads` before editing production files.

You are authorized to execute **only** this bounded assignment.

> [!IMPORTANT]
> **Single-Tranche Authorization Rule:**
> One Work Order normally authorizes exactly **one bounded tranche**.
> Do not bundle future tranches merely because implementation is convenient.
> A downstream tranche must never begin until its upstream dependencies are `FROZEN`.

Hard prerequisites:

- Target Tranche Feature Spec must be `FROZEN`.
- All upstream dependencies must be `FROZEN`.
- This Work Order must be `APPROVED_FOR_EXECUTION`.
- If any prerequisite is false, do not mutate production code.

## 1. Mission

Describe one bounded implementation mission and what success means.

## 2. Authority Chain

- Operator instruction: <reference/date>
- Intake: <path/version/status>
- Design Evidence: <path/version/status>
- Frozen Feature Spec: <path/version/status>
- Frozen Upstream Dependencies: <list of Tranche IDs & frozen spec paths>
- Decision records: <IDs/paths>
- Roadmap item: <reference>

Authority boundary:

- this Work Order governs execution scope;
- the frozen Feature Spec governs required behavior;
- this Work Order may narrow but must not contradict the frozen spec.

## 3. Roles

- Dispatcher/Owner:
- Implementer: Antigravity
- Reviewer:
- Operator approval required for:
  - spec change;
  - scope expansion;
  - architecture/public-interface change;
  - dependency/runtime/AutoCAD version change;
  - destructive or irreversible action.

## 4. Allowed Scope

- <allowed action>
- <allowed action>

## 5. Forbidden Scope

- <explicitly forbidden feature/action>
- unrelated refactoring;
- future-roadmap implementation;
- frozen spec modification unless explicitly authorized.

## 6. Allowed / Owned Paths

| Path | Write Mode | Purpose |
|---|---|---|
| `src/...` | MODIFY/CREATE | |
| `tests/...` | MODIFY/CREATE | |

## 7. Forbidden Paths

- `<path>`
- `<path>`

Any required edit outside Allowed Paths => `BLOCKED_SCOPE_EXPANSION` unless the operator amends this Work Order.

## 8. Required First Reads

Read in order:

1. `governance/ANTIGRAVITY_INSTRUCTIONS.md`
2. <frozen Feature Spec path>
3. <common contract path>
4. <approved Design path>
5. <relevant existing source files>

## 9. Source Verification / Pre-Flight

Before implementation verify:

- [ ] all referenced paths exist;
- [ ] named commands/classes/interfaces actually exist where claimed;
- [ ] current project targets the expected AutoCAD/.NET baseline;
- [ ] working tree/base commit is understood;
- [ ] no unresolved spec ambiguity blocks the assignment.

Record commands/checks:

```text
<git status / build baseline / source searches / project target checks>
```

Expected result:

- <result>

If source facts differ materially from this Work Order, stop and report `BLOCKED_STALE_SOURCE_FACT` instead of inventing replacement symbols.

## 10. Roadmap/Spec-to-Work-Order Trace Matrix

| Requirement / AC | Work Order Instruction | Output Artifact/Path | Verification | Status |
|---|---|---|---|---|
| AC-01 | | | | PENDING |

Every Acceptance Criterion in scope must have a row.

## 11. Implementation Constraints

- preserve project architecture boundaries;
- prefer minimal, reviewable diffs;
- no stack/dependency upgrade unless explicitly listed;
- no public command/interface rename unless explicitly listed;
- no silent fallback that changes engineering behavior;
- all drawing mutations must follow frozen AutoCAD host behavior contract;
- temporary/preview entities must not survive cancel unless specified.

Feature-specific constraints:

- <constraint>

## 12. Required Tests

| Test ID / AC | Required Test | Type | Required Result |
|---|---|---|---|
| AC-01 | | Unit/Integration/Manual AutoCAD | PASS |

## 13. Required Evidence

### Build

- exact build command/tool;
- result;
- relevant warnings/errors.

### Tests

- command/test runner;
- AC mapping;
- PASS/FAIL.

### AutoCAD Integration/Manual

Where applicable:

- AutoCAD version;
- test drawing;
- steps;
- expected result;
- actual result;
- screenshots/logs if useful.

### Scope

- final changed-file list;
- confirmation all changes stayed inside Allowed Paths;
- closure diff reviewed.

## 14. Stop Conditions

This Work Order is invalid for execution without explicit stop conditions.

Stop and return a blocker when:

- frozen spec is missing or no longer frozen;
- behavior needed for implementation is ambiguous;
- implementation requires scope outside Allowed Paths;
- current source contradicts a material Work Order assumption;
- required AutoCAD API/host behavior is unsupported by the frozen baseline;
- a fix requires changing architecture/public interface not authorized here;
- destructive/irreversible action would be required;
- required dependency/tool/credential is unavailable and no approved fallback exists.

Use blocker codes where possible:

- `BLOCKED_SPEC_AMBIGUITY`
- `BLOCKED_SCOPE_EXPANSION`
- `BLOCKED_STALE_SOURCE_FACT`
- `BLOCKED_HOST_CAPABILITY`
- `BLOCKED_DEPENDENCY`

## 15. Worker Autonomy / No-Question Rule

Within Allowed Scope, Antigravity must independently repair and rerun routine issues caused by its implementation, including compile errors, tests, lint/formatting, and mechanical wiring mistakes.

Do not escalate routine allowed-scope remediation as a preference question.

Do not use this rule to make product/design decisions that belong in DESIGN or SPEC.

## 16. Required Completion Packet

Return exactly these sections:

```text
Execution Status: PASS / PARTIAL / BLOCKED
Lifecycle Stage: BUILD
Feature Spec: <path/version>
Work Order: <ID/version>
Spec Compliance: PASS / FAIL / NOT_VERIFIED
Scope Compliance: PASS / FAIL
Build: PASS / FAIL
Tests: <summary>
Acceptance Criteria:
- AC-01: PASS/FAIL/NOT_RUN
- ...
Changed Files:
- <path>: <purpose>
Deviations:
- NONE / <deviation>
Known Limitations:
- NONE / <limitation>
Evidence:
- <command/result/path>
Required Next Stage: REVIEW / SPEC / DESIGN
```

## 17. Approval For Execution

Reviewer/Owner: <name>
Disposition: `APPROVED_FOR_EXECUTION / RETURNED_FOR_REWORK / BLOCKED`
Date: <YYYY-MM-DD>
Approved Base Commit/Version: <value>
