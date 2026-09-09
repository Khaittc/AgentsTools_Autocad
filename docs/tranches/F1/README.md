# TTC CAD — Tranche F1 Front-Door: Common CAD Contracts

- **Tranche:** F1 — Common CAD Contracts
- **Capability:** Common CAD Contracts & Data Abstractions
- **Lifecycle Stage:** DESIGN_CORRECTION
- **Current Status:** `DESIGN_CORRECTED / INDEPENDENT_RE_REVIEW_PENDING`

---

## 1. Governance & Authority

- **Dependency:** F0 — AutoCAD Foundation (`FROZEN / SATISFIED` at baseline `9892f905d6650fdeb6cb4a98431fc8d5e17e84bf`)
- **Intake:** `INTAKE-FOUNDATION-F1-001` — `COMPLETE / PASS_TO_DESIGN` ([INTAKE.md](./INTAKE.md))
- **Latest Review:** `REV-F1-DESIGN-001-R2` — `NEEDS_FIX` / `RETURN_TO_DESIGN_CORRECTION` ([REVIEW.md](./REVIEW.md))
- **Design:** `DESIGN-FOUNDATION-F1-001` (v0.3.0) — `DESIGN_CORRECTED / INDEPENDENT_RE_REVIEW_PENDING` ([DESIGN.md](./DESIGN.md))
- **API Verification:** Architectural Host Evidence ([API_VERIFICATION.md](./API_VERIFICATION.md))
- **Spec:** `NOT_STARTED / NOT AUTHORIZED`
- **Work Order:** `NONE`
- **Build:** `NOT AUTHORIZED`
- **Production Build Authorization:** `NONE`
- **Issue Registry:** `ISSUE-F1-001` through `ISSUE-F1-010` (10 registered) ([ISSUES.md](./ISSUES.md))
- **Execution Log:** [EXECUTION_LOG.md](./EXECUTION_LOG.md)

---

## 2. Downstream Consumers

Tranche F1 establishes the common cross-feature contracts that downstream tranches depend upon:
- **P1:** Component Library (`BLOCKED_BY_F1`)
- **P2:** Component Placement (`TTCPANELPLACE`) (`BLOCKED_BY_F1_P1`)
- **P3..P9:** Panel Designer Capabilities (`BLOCKED`)
- **M1..M8:** Cable Tray Designer (`BLOCKED / FUTURE`)
- **C1, C2:** CAD Standards & Export (`BLOCKED`)

---

## 3. Immediate Next Authorized Action

Independent Technical Re-Review of F1 DESIGN (`REV-F1-DESIGN-001-R3`).

---

## 4. Forbidden Actions at Current Stage

- Authoring F1 SPEC
- Creating F1 Work Order
- Writing production C# code (`production/**`)
- Modifying frozen F0 artifacts or baseline (`docs/tranches/F0/**`)
- Freezing candidate standards without SPEC/freeze authority
- Starting P1, P2, or M&E implementation
- Self-approving DESIGN
