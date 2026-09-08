# TTC CAD — Design Template

Status: DRAFT
Design ID: DESIGN-<MODULE>-<NNN>
Version: 0.1
Owner: <design owner>
Reviewer: <human/reviewer>
Date: <YYYY-MM-DD>

## 1. Authority / Inputs

- Intake: <path + version/status>
- Roadmap: <path>
- Previous decisions: <paths/IDs>
- Simulator version/scenarios: <reference>
- Frozen common contracts inherited: <paths or N/A>

## 2. Design Objective

Describe the solution shape without granting implementation authority.

## 3. Design Principles

Examples:

- drawing-first;
- explicit engineering feedback;
- minimal destructive mutation;
- deterministic rules;
- DWG remains usable without plugin where required.

Project-specific principles:

- <principle>

## 4. Primary User Workflow

```text
<Start>
  -> <Action>
  -> <Tool response>
  -> <Decision>
  -> <Result>
```

### Workflow Steps

| Step | User Action | Tool Response | Drawing/Data Change | Failure/Cancel Path |
|---|---|---|---|---|
| 1 | | | | |

## 5. Simulator / Scenario Evidence

| Scenario ID | Scenario | Observation | Decision Impact | Status |
|---|---|---|---|---|
| S01 | | | | ACCEPT/CHANGE/OPEN |

Simulator evidence informs design; it is not by itself a frozen implementation contract.

## 6. Interaction / State Design

Define states and transitions for interactive commands/palettes.

```text
IDLE
  -> SELECTED
  -> PLACING
  -> COMMITTED
  -> IDLE

PLACING --Esc--> CANCELLED -> IDLE
```

| State | Entry Condition | Allowed Actions | Exit | UI/Command Feedback |
|---|---|---|---|---|
| | | | | |

## 7. UI / Interaction Design

### Surfaces

- Ribbon:
- PaletteSet/WPF:
- Command line:
- Drawing interaction:
- Context menu/grips:

### Selection / Focus Behavior

- <behavior>

### Feedback

- success:
- warning:
- error:
- blocking error:

## 8. Domain Model

| Domain Object | Responsibility | Key Properties | Relationships |
|---|---|---|---|
| PanelComponent | | | |
| Cabinet | | | |

Do not specify implementation classes unless already architecturally frozen.

## 9. CAD Object / Drawing Model

| Concept | Proposed AutoCAD Representation | Why | Open Questions |
|---|---|---|---|
| Component | BlockReference / <other> | | |

Record proposed identity, metadata, geometry ownership, and lifecycle semantics at design level. Exact contract belongs in SPEC.

## 10. Data Flow

```text
User
 -> UI/Command
 -> Application Use Case
 -> Engineering Core
 -> AutoCAD Adapter
 -> DWG/Metadata
 -> Result/Feedback
```

Project-specific flow:

1. <step>
2. <step>

## 11. Architecture / Component Boundaries

| Component/Layer | Responsibility | May Depend On | Must Not Depend On |
|---|---|---|---|
| UI | | | |
| Application | | | |
| Engineering Core | | | AutoCAD UI where possible |
| AutoCAD Adapter | | | |

### Dependency Direction

State the required one-way dependency rule.

## 12. Engineering Rule Design

List rules at conceptual level.

| Rule ID | Purpose | Inputs | Outcome | Needs Exact Spec? |
|---|---|---|---|---|
| RULE-01 | | | | YES |

## 13. Geometry / Units / Tolerance Design

- internal unit proposal:
- coordinate system:
- rotation convention:
- tolerance model:
- broad-phase geometry approach:
- exact-check approach:
- boundary-touch policy candidate:

Any decision that affects PASS/FAIL must be frozen in SPEC before build.

## 14. Persistence / Versioning Design

- library source:
- drawing metadata approach:
- schema versioning:
- behavior when library definition changes:
- backward compatibility strategy:

## 15. AutoCAD Host Integration Design

- document model:
- transaction strategy:
- locking strategy:
- command lifecycle:
- undo grouping approach:
- palette/document synchronization:

## 16. Failure Design

| Failure ID | Condition | User Feedback | Mutation Allowed? | Recovery Path |
|---|---|---|---|---|
| F-01 | | | YES/NO | |

## 17. Alternatives Considered

| Decision | Option A | Option B | Selected | Rationale / Trade-off |
|---|---|---|---|---|
| | | | | |

## 18. Design Decisions

| Decision ID | Decision | Rationale | Evidence | Status |
|---|---|---|---|---|
| D-001 | | | | PROPOSED/APPROVED/FROZEN |

## 19. Non-Goals

- <explicit non-goal>

## 20. Open Questions

| ID | Question | Owner | Must Resolve Before | Status |
|---|---|---|---|---|
| OQ-01 | | | SPEC/BUILD | OPEN |

## 21. Design Gate

- [ ] Intake is approved.
- [ ] Primary workflow is complete.
- [ ] Simulator observations affecting behavior are dispositioned.
- [ ] Interaction states are defined.
- [ ] Domain boundaries are defined.
- [ ] Data flow is defined.
- [ ] Architecture boundaries are defined.
- [ ] Failure paths are designed.
- [ ] Critical alternatives have decisions.
- [ ] No unresolved question is being silently delegated to the coding agent.

Gate Result: `PASS / BLOCKED`

## 22. Approval

Reviewer: <name/role>
Disposition: `APPROVED / RETURNED_FOR_REWORK / BLOCKED`
Date: <YYYY-MM-DD>
Approved Decision IDs: <list>
