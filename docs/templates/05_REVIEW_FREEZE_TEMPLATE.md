# TTC CAD — Review & Freeze Template

Status: DRAFT
Review ID: REVIEW-<MODULE>-<FEATURE>-<NNN>
Tranche ID: <F0 / F1 / P1 / etc.>
Feature / Capability: <Feature ID / name>
Reviewer: <reviewer>
Product Owner: <human/owner>
Date: <YYYY-MM-DD>

> [!IMPORTANT]
> **Tranche Closure Principle:**
> Only a `FROZEN` tranche may be treated as stable dependency evidence for downstream tranches.
> Closure requires verified Build evidence, Acceptance Criteria verification, Negative-case verification,
> Regression verification, AutoCAD manual/integration verification, Scope-diff verification, and explicit Product Owner Freeze.

## 1. Reviewed Authority Chain

- Intake: <path/version/status>
- Design Evidence: <path/version/status>
- Feature Spec: <path/version/status>
- Work Order: <path/ID/status>
- Implementation commit/range: <commit/range>
- Build/Execution report: <path/reference>

## 2. Review Question

Does the implementation satisfy the original intent, approved design, frozen specification, active execution authority, and required evidence?

## 3. Scope Review

### Changed Files

| File | Allowed by Work Order? | Purpose | Disposition |
|---|---|---|---|
| | YES/NO | | ACCEPT/REJECT |

Closure-diff result: `PASS / FAIL`

Unexpected/out-of-scope changes: `NONE / <list>`

## 4. Build Evidence Review

| Evidence | Command/Source | Result | Reviewer Disposition |
|---|---|---|---|
| Build | | PASS/FAIL | ACCEPT/REJECT |

## 5. Acceptance Criteria Review

| AC ID | Required Behavior | Evidence | Result | Reviewer Disposition |
|---|---|---|---|---|
| AC-01 | | | PASS/FAIL/NOT_RUN | ACCEPT/REJECT/BLOCK |

No feature may close PASS while a required AC is unverified unless an explicit waiver is recorded.

## 6. Negative Case Review

| NC ID | Evidence | Result | Disposition |
|---|---|---|---|
| NC-01 | | PASS/FAIL/NOT_RUN | |

## 7. Invariant Review

| Invariant | Evidence | Result |
|---|---|---|
| INV-01 | | PASS/FAIL |

## 8. AutoCAD Host Behavior Review

- [ ] transaction behavior matches spec;
- [ ] undo grouping matches spec;
- [ ] cancel/rollback matches spec;
- [ ] locked/read-only behavior matches spec where applicable;
- [ ] save/reopen persistence verified where applicable;
- [ ] copy/move/erase semantics verified where applicable;
- [ ] no temporary graphics/entities leak after cancel.

Notes:

- <notes>

## 9. Engineering / Geometry Review

- [ ] unit handling matches frozen contract;
- [ ] coordinate handling matches frozen contract;
- [ ] tolerance matches frozen contract;
- [ ] boundary-touch semantics match frozen contract;
- [ ] rule severity/pass/warn/fail semantics match spec.

Notes:

- <notes>

## 10. Deviations

| Deviation ID | Description | Authorized? | Impact | Disposition |
|---|---|---|---|---|
| DEV-01 | | YES/NO | | ACCEPT/RETURN/BLOCK |

If none: `NONE`.

## 11. Defects / Findings

| Finding ID | Severity | Description | Required Action | Return Stage |
|---|---|---|---|---|
| F-01 | BLOCKER/MAJOR/MINOR | | | BUILD/SPEC/DESIGN |

## 12. Review Decision

Choose one:

- `PASS_FOR_FREEZE`
- `RETURN_TO_BUILD`
- `RETURN_TO_SPEC`
- `RETURN_TO_DESIGN`
- `BLOCKED`

Decision: <value>

Rationale:

<reviewer rationale>

## 13. Freeze Record

Complete only when Review Decision = `PASS_FOR_FREEZE`.

Freeze Status: `CLOSED_PASS / CLOSED_WITH_LIMITATIONS / NOT_FROZEN`

- Feature Spec frozen version: <version>
- Implementation commit/tag: <commit/tag>
- Test/evidence references: <paths>
- Known limitations: <list or NONE>
- Accepted waivers: <list or NONE>
- Final claim boundary: <what is actually proven>
- Date frozen: <YYYY-MM-DD>
- Freezing authority: <human/reviewer>

## 14. Reopen Conditions

A frozen feature must be reopened if any of these occur:

- required behavior changes;
- engineering rule/tolerance changes;
- AutoCAD host/version baseline changes materially;
- metadata/schema contract changes;
- a production defect proves a frozen invariant or acceptance criterion false;
- an approved roadmap tranche explicitly extends the feature contract.

Feature-specific reopen conditions:

- <condition>

## 15. Next Authorized Move

- `NEXT_FEATURE / NEXT_TRANCHE / HOTFIX_WORK_ORDER / SPEC_AMENDMENT / NONE`

Reference: <path/ID>
