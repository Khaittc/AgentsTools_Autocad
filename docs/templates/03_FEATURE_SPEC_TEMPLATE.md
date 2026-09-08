# TTC CAD — Feature Specification Template

Status: DRAFT
Feature ID: SPEC-<MODULE>-<FEATURE>-<NNN>
Feature Name: <name>
Command(s): <AutoCAD command names or N/A>
Version: 0.1.0
Owner: <spec owner>
Reviewer: <reviewer>
Date: <YYYY-MM-DD>

> BUILD GATE: This document grants no implementation authority until Status = `FROZEN` and an approved Work Order exists.

## 1. Authority / Traceability

- Intake: <path + version/status>
- Approved Design: <path + version/status>
- Decision IDs: <list>
- Common Specs inherited:
  - CAD Object Contract: <path/version or N/A>
  - Metadata Spec: <path/version or N/A>
  - Units/Tolerance Spec: <path/version or N/A>
  - AutoCAD Host Behavior Spec: <path/version or N/A>
- Roadmap item: <reference>

## 2. Objective

One exact statement of what this feature must accomplish.

## 3. Preconditions

- <required active document/state/library/etc.>

## 4. In Scope

- <behavior>

## 5. Out of Scope / Non-Goals

- <behavior explicitly excluded>

## 6. User Workflow Contract

1. User <action>.
2. System <observable response>.
3. User <action>.
4. System <observable result>.

Avoid implementation detail unless it is contractually required.

## 7. Interaction State Machine

```text
<STATE_A> --<event>--> <STATE_B>
<STATE_B> --Esc--> <CANCELLED/STATE_A>
```

| Current State | Event | Guard | Action | Next State | Observable Feedback |
|---|---|---|---|---|---|
| | | | | | |

All ambiguous A/B alternatives must be resolved before freeze.

## 8. Command Contract

### Command Identity

- Command name:
- Aliases:
- Requires active document: YES/NO
- Allowed in read-only drawing: YES/NO + behavior

### Prompt Sequence

| Step | Prompt | Accepted Input | Invalid Input Behavior | Cancel Behavior |
|---|---|---|---|---|
| 1 | | | | |

### Completion Result

- entities created/modified:
- metadata created/modified:
- command-line/UI result:

## 9. Inputs

| Input ID | Name | Type/Unit | Required | Validation | Source |
|---|---|---|---|---|---|
| IN-01 | | | YES | | |

## 10. Outputs

| Output ID | Output | Type/Representation | Required Properties |
|---|---|---|---|
| OUT-01 | | | |

## 11. CAD Object Contract

### Object Representation

- AutoCAD entity type:
- block/dynamic block rules:
- layer:
- ownership/container:

### Identity

- canonical TTC object ID:
- ID creation rule:
- ID persistence rule:

### Lifecycle Semantics

| Operation | Required Behavior |
|---|---|
| MOVE | |
| ROTATE | |
| SCALE | ALLOWED/FORBIDDEN + rule |
| COPY | preserve/new ID + metadata behavior |
| ERASE | |
| UNDO | |
| REDO | |
| SAVE/REOPEN | |
| WBLOCK/INSERT/XREF if relevant | |

## 12. Metadata / Persistence Contract

| Key | Type | Required | Default | Versioning Rule |
|---|---|---|---|---|
| TTC_OBJECT_ID | | YES | | |

- storage mechanism:
- schema version:
- migration policy:
- behavior when metadata is missing/corrupt:
- behavior when library version differs from drawing object version:

## 13. Engineering Rules

Define each rule as a deterministic contract.

### RULE-<NNN> — <name>

- Purpose:
- Applies to:
- Inputs:
- Calculation/logic:
- PASS condition:
- WARNING condition:
- FAIL condition:
- Severity:
- Boundary-touch semantics:
- Tolerance:
- User-facing message:
- Suggested remediation:

Repeat for all rules.

## 14. Geometry / Units / Tolerance Contract

- internal unit:
- drawing-unit conversion:
- coordinate space: WCS/UCS/local panel coordinates
- angle convention:
- numerical precision:
- geometry tolerance:
- broad-phase representation:
- exact-check representation:
- touching/intersection semantics:
- non-uniform scale handling:
- mirrored block handling:

If any geometry item affects PASS/FAIL, it is mandatory before freeze.

## 15. AutoCAD Host Behavior Contract

| Host Concern | Required Behavior |
|---|---|
| Active Document | |
| Document Lock | |
| Transaction Boundary | |
| Undo Group | |
| Cancel/Rollback | |
| Locked Layer | |
| Read-only Drawing | |
| Erased/Invalid Object | |
| Document Close During Operation | |
| Save/Reopen | |
| Exception Handling | |

## 16. Undo / Redo / Cancel

### Undo

- one logical operation = <undo unit>
- state restored:

### Redo

- required behavior:

### Cancel

- events that cancel:
- entities/data allowed to remain after cancel: `NONE` unless explicitly listed
- temporary graphics cleanup:

## 17. Errors and User Feedback

| Error ID | Condition | Severity | Message/Feedback | Mutation Allowed? | Recovery |
|---|---|---|---|---|---|
| ERR-01 | | | | NO | |

## 18. Negative Cases

Negative cases are mandatory.

| NC ID | Given | When | Expected Result | Data/Drawing Mutation | AC Link |
|---|---|---|---|---|---|
| NC-01 | dependency missing | command starts | deterministic error | NONE | AC-xx |
| NC-02 | locked layer | mutation requested | | | |
| NC-03 | user presses Esc | placement active | | NONE | |
| NC-04 | invalid/corrupt metadata | object loaded | | | |

Add feature-specific cases.

## 19. Invariants

These must remain true in all supported paths.

- INV-01: <invariant>
- INV-02: <invariant>

Examples of useful invariants:

- cancel leaves no committed entity;
- one live TTC object has one canonical ID;
- copying an object follows the frozen identity rule;
- engineering checks use the frozen unit/tolerance contract.

## 20. Performance / Capacity Requirements

| PERF ID | Scenario | Target | Measurement Method |
|---|---|---|---|
| PERF-01 | | | |

Use `N/A with reason` when performance is irrelevant. Do not invent meaningless targets.

## 21. Acceptance Criteria

Every criterion must be observable and pass/fail.

### AC-01 — <title>

**Given** <precondition>  
**When** <action>  
**Then** <observable result>

### AC-02 — <title>

**Given** ...  
**When** ...  
**Then** ...

## 22. Acceptance Test Matrix

| AC ID | Test Type | Test Scenario/File | Expected Evidence | Status |
|---|---|---|---|---|
| AC-01 | Unit/Integration/Manual AutoCAD | | | NOT_RUN |

## 23. Dependencies

| Dependency | Version/Contract | Required | Failure Behavior |
|---|---|---|---|
| | | YES | |

## 24. Known Limitations

- <limitation or NONE>

## 25. Open Questions

| ID | Question | Disposition | Owner |
|---|---|---|---|
| OQ-01 | | OPEN/DEFERRED/RESOLVED | |

Freeze rule:

- Must-have behavior cannot have `OPEN` questions.
- A deferred question must be explicitly out of the frozen feature scope and must not be required by the Work Order.

## 26. Spec Quality Gate

### Functional

- [ ] Objective is exact.
- [ ] Preconditions are explicit.
- [ ] In/Out scope is explicit.
- [ ] Inputs and outputs are defined.

### Interaction

- [ ] State transitions are explicit.
- [ ] Cancel path is explicit.
- [ ] Invalid-input behavior is explicit.

### CAD

- [ ] Entity/object representation is explicit.
- [ ] Identity rules are explicit.
- [ ] Move/copy/erase/save/reopen semantics are explicit or inherited.
- [ ] Undo/redo/cancel are explicit or inherited.

### Engineering

- [ ] Units/coordinate/tolerance are explicit or inherited.
- [ ] Rule PASS/WARN/FAIL conditions are deterministic.
- [ ] Boundary cases are defined.

### Failure

- [ ] Negative cases exist.
- [ ] Missing/invalid dependency behavior is defined.
- [ ] Rollback/mutation behavior is defined.

### Testability

- [ ] Acceptance Criteria are observable.
- [ ] Every AC has an intended verification method.
- [ ] No must-have behavior contains unresolved `TBD`, `TBC`, `maybe`, or A/B alternatives.

Gate Result: `PASS / BLOCKED`

## 27. Review / Freeze

Reviewer: <name/role>
Review disposition: `APPROVED / RETURNED_FOR_REWORK / BLOCKED`
Review date: <YYYY-MM-DD>

Freeze decision:

- Status: `FROZEN / NOT_FROZEN`
- Frozen version: <x.y.z>
- Frozen commit/hash: <commit/hash or N/A before repo commit>
- Decision record: <ID/path>
- Reopen conditions: <conditions>
