# <Tranche / Task> — Review Result

> [!IMPORTANT]
> **Independent Review Rule:**
> The implementing Agent must NOT write a fake independent review for its own work.
> An Agent may prepare review evidence and documentation, but Reviewer Disposition must truthfully identify who actually performed the review (e.g. ChatGPT, Human Reviewer, Independent Agent).

Review ID:
REV-<TRANCHE>-<NNN>

Reviewer:
<ChatGPT / Human Reviewer / Independent Agent>

Review Date:
<YYYY-MM-DD>

Reviewed Commit:
<sha>

Reviewed Scope:
<bounded tranche / work order scope>

Authority Sources:
- Spec: <path/version>
- Work Order: <path/ID>
- Execution Log: <path>
- Issues: <path>
- Acceptance Criteria: <list of AC IDs>

---

## Result

PASS / NEEDS_FIX / BLOCKED

---

## Summary

<concise summary of review findings>

---

## What Was Implemented Correctly

- ...
- ...

---

## Findings

### FINDING-01

Severity:
BLOCKING / HIGH / MEDIUM / LOW

Source:
<file/path/section>

Expected:
...

Actual:
...

Required Action:
...

Requires:
IMPLEMENTATION_FIX / SPEC_REOPEN / DESIGN_REOPEN / PRODUCT_DECISION

---

## Acceptance Criteria Review

| AC ID | Required Behavior | Result | Reviewer Evidence |
|---|---|---|---|
| AC-01 | ... | PASS / FAIL / NOT_VERIFIED | ... |

---

## Scope Compliance

PASS / FAIL

---

## Spec Compliance

PASS / FAIL / NOT_VERIFIED

---

## Open Issues

- ISSUE-...

---

## Reviewer Disposition

Choose one:
- `PASS_TO_NEXT_STAGE`
- `RETURN_TO_BUILD`
- `RETURN_TO_SPEC`
- `RETURN_TO_DESIGN`
- `BLOCKED_PRODUCT_OWNER`

Disposition:
<chosen value>

---

## Next Authorized Action

<exact next authorized action>
