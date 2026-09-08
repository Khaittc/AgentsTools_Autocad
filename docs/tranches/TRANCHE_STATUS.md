# TTC CAD — Master Tranche Status Register

Status: ACTIVE_REGISTER  
Last Updated: 2026-09-08  
Development Model: Spec-First Per Tranche ([TTC-GOV-001](../../governance/DECISION_LOG.md))  

---

## 1. Production Tranches Register

| Tranche ID | Capability | Depends On | Spec Status | Work Order | Build Status | Frozen? | Current Disposition |
|:---:|---|---|:---:|:---:|:---:|:---:|---|
| **F0** | **AutoCAD Foundation** | Product Baseline | `FROZEN (v1.0.0)` | `APPROVED / WO-F0-001` | `AUTHORIZED / NOT_STARTED` | NO | **BUILD_READY** (WO-F0-001 approved for execution; build authorized for F0 only; implementation not started; Tranche not frozen) |
| **F1** | **Common CAD Contracts** | F0 | `NOT_STARTED` | `NONE` | `BLOCKED` | NO | `PLANNED` (Blocked by F0) |
| **P1** | **Component Library** | F0, F1 | `NOT_STARTED` | `NONE` | `BLOCKED` | NO | `PLANNED` (Blocked by F1) |
| **P2** | **Component Placement (`TTCPANELPLACE`)** | F0, F1, P1 | `DRAFT` | `NONE` | `BLOCKED` | NO | **BLOCKED_BY_UPSTREAM** (Spec evidence exists in `docs/03_FEATURE_SPEC_TTCPANELPLACE.md`; awaiting F0/F1/P1) |
| **P3** | **DIN Rail (`TTCRAIL`)** | P2 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P4** | **Wiring Duct (`TTCDUCT`)** | P2 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P5** | **Arrange Tools (`TTCALIGN`)** | P3, P4 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P6** | **Panel QA & Clearance (`TTCPANELCHECK`)** | P5 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P7** | **Depth Validation** | P6 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P8** | **Cabinet Size Recommendation (`TTCPANELSIZE`)** | P6 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **P9** | **Reserved Zones & Panel MVP Freeze** | P7, P8 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **M1..M8** | **M&E Cable Tray Designer** | Panel MVP (P9) | `PLANNED` | `NONE` | `BLOCKED` | NO | **FUTURE / BLOCKED** (Deferred until Panel MVP) |
| **C1** | **CAD Standards & Layers** | F1 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |
| **C2** | **Clean DWG/DXF Export (`TTCEPLANEXPORT`)** | P9, C1 | `PLANNED` | `NONE` | `BLOCKED` | NO | `PLANNED` |

---

## 2. Hard Build Gate Summary

- **Production Build Authorization:** `AUTHORIZED_FOR_F0_ONLY`
- **Frozen Specs:** `F0 — docs/tranches/F0/SPEC.md v1.0.0`
- **Approved Active Work Orders:** `WO-F0-001`
- **Draft Work Orders:** `NONE`
- **Production Code Status:** `NOT_STARTED` (0 `.cs` files exist)
