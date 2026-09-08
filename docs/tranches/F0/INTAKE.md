# TTC CAD — Intake: Tranche F0 (AutoCAD Foundation)

Status: DRAFT
Intake ID: INTAKE-FOUNDATION-F0
Version: 0.1
Owner: TTC CAD Project Owner
Date: 2026-09-08

## 1. Objective

Establish the smallest real TTC AutoCAD 2023 production plugin foundation that can be compiled, deployed via standard `.bundle` packaging, loaded into real AutoCAD 2023 without unhandled exceptions, and verified via a diagnostic health command (`TTCINFO`), a basic Ribbon tab shell, a modeless `PaletteSet` host shell, JSON configuration validation, and file-based logging infrastructure, without implementing any Panel or M&E production engineering logic.

## 2. Problem Statement / Context

- **Current workflow:** The project has an interactive UX prototype (Simulator Lane in React/TypeScript) with scenarios S01–S05 validated, but zero production C# code targeting the native AutoCAD 2023 host environment exists.
- **Pain point:** Attempting to build complex engineering capabilities (like component placement, rail snapping, or cable tray routing) directly in AutoCAD without a verified, robust host bootstrap foundation introduces high risk of host crashes, unhandled threading/context exceptions, ribbon/palette lifecycle bugs, and brittle project dependencies.
- **Why this matters:** Under Spec-First Per Tranche methodology (`TTC-GOV-001`), establishing and proving the production host shell in Tranche F0 ensures that subsequent tranches (F1 Common CAD Contracts, P1 Component Library, P2 Component Placement) can be built upon a stable, decoupled, and verifiable AutoCAD Managed .NET runtime baseline.
- **What happens today without this tool:** Developers cannot verify whether assemblies load cleanly in AutoCAD 2023, whether Ribbon/PaletteSet initialization timing works, or how settings and logs behave across different deployment paths.

## 3. Target Users

### Primary User
- **Role:** AutoCAD Plugin Developer / QA Engineer / System Integrator.
- **Experience level:** Experienced in C# .NET and AutoCAD Managed API.
- **Work context:** Compiling the production plugin solution, loading it into Autodesk AutoCAD 2023, and inspecting diagnostic logs and host feedback.

### Secondary Users
- **Role:** Electrical / M&E Panel Design Engineers who will eventually use the toolset once subsequent feature tranches are built.

## 4. User Jobs / Core Workflows

1. **Plugin Bootstrap & Verification:** Developer compiles solution, deploys `.bundle` or uses `NETLOAD`, opens AutoCAD 2023, and observes clean plugin loading and startup logging.
2. **Diagnostic Health Check:** User executes `TTCINFO` at the AutoCAD command line to inspect plugin version, runtime environment, configuration status, and logging readiness.
3. **UI Shell Inspection:** User views the TTC Ribbon tab shell and launches the modeless TTC `PaletteSet` dockable window shell.
4. **Configuration Validation:** System automatically loads and validates `settings.json`, providing explicit diagnostics if configuration is missing or malformed.

## 5. In Scope

- AutoCAD 2023 Managed .NET plugin bootstrap targeting `.NET Framework 4.8`.
- Production solution and project structure separating AutoCAD host adapters from core domain contracts (`TTC.Core` must not reference AutoCAD assemblies).
- AutoCAD plugin entry point implementing `IExtensionApplication` with safe initialization and termination hooks.
- Diagnostic health command: `TTCINFO` reporting host environment, assembly versions, configuration status, and log path.
- Ribbon tab/panel shell (`TTC CAD`) displaying placeholder buttons for plugin status, settings, and palette toggle.
- Modeless `PaletteSet` WPF hosting shell with clean show/hide toggling.
- `settings.json` loading, schema validation, and fallback handling.
- File-based structured diagnostic logging with startup, command, and error categorization.
- Foundation settings repository abstraction: `ISettingsRepository` (`IComponentRepository` and `ICabinetRepository` are deferred to Tranche P1).
- AutoCAD Application Package (`.bundle`) manifest (`PackageContents.xml`) for automated discovery and loading.
- Developer build, deployment, and debugging documentation.
- Robust exception boundaries preventing AutoCAD host crashes on startup or command execution.

## 6. Out of Scope / Non-Goals

- **Domain Repositories & Catalogs:** Component Library repository (`IComponentRepository`), Cabinet Library repository (`ICabinetRepository`), and Cable Tray repository (`ITrayLibraryRepository`) are strictly deferred to their respective owning tranches (P1, M1).
- **Panel Mechanical Features:** Component placement (`TTCPANELPLACE`), DIN rail placement (`TTCRAIL`), wiring duct placement (`TTCDUCT`), alignment/spacing tools (`TTCALIGN`), panel clearance checker (`TTCPANELCHECK`), enclosure depth checking, cabinet sizing recommendation (`TTCPANELSIZE`), reserved cable zones.
- **M&E Cable Tray Features:** Tray routing, tray fittings, elevation/rise/drop, supports/hangers, tray-panel connections, M&E QA, quantity takeoff.
- **EPLAN Integration:** EPLAN API, Master Data synchronization, device tags, electrical BOM, wire numbering, terminal logic.
- **Engineering Geometry Algorithms:** Polygon clipping, spatial indexing, collision detection, procedural block generation.
- **Common CAD Contracts (F1 Scope):** Geometric tolerance ($\varepsilon$), drawing units enforcement (`INSUNITS`), native AutoCAD command overrides (`MOVE`/`COPY`/`UNDO`), metadata persistence schema (`XRecord`).

## 7. Constraints

### Host / Technical
- **AutoCAD Version:** Autodesk AutoCAD 2023 (Release 24.2).
- **Target Runtime:** .NET Framework 4.8.
- **Language:** C# 10.0 (or highest supported by MSBuild under .NET 4.8).
- **API:** AutoCAD Managed .NET API (`AcCoreMgd.dll`, `AcDbMgd.dll`, `AcMgd.dll`) with `CopyLocal = False`.
- **UI Framework:** Windows Presentation Foundation (WPF) hosted inside `Autodesk.AutoCAD.Windows.PaletteSet`.
- **Packaging:** Standard Autodesk Application Package format (`TTC.bundle` with `PackageContents.xml`).

### Engineering / Domain
- **Decoupling Doctrine:** `TTC.Core` must remain pure C# and MUST NOT reference AutoCAD assemblies.
- **Host Stability:** No unhandled exceptions thrown across the AutoCAD Managed boundary; commands must wrap execution in structured error handling.
- **Lane Isolation:** Production code resides exclusively in `production/`. `src/` and `public/` belong to the simulator lane and must not be modified.

### Delivery
- **Lifecycle Gate:** Intake → Design → Spec preparation. Spec status must reach `FROZEN` and Work Order must be `APPROVED_FOR_EXECUTION` before writing C# production code.

## 8. Dependencies

| ID | Dependency | Required For | Status | Owner |
|---|---|---|---|---|
| DEP-F0-01 | AutoCAD 2023 Managed .NET API Assemblies / NuGet | Project compilation | READY | Product Owner / Environment |
| DEP-F0-02 | .NET Framework 4.8 Developer Pack | C# build toolchain | READY | Build Environment |
| DEP-F0-03 | Visual Studio 2022 / MSBuild | Solution compilation | READY | Developer Workstation |
| DEP-F0-04 | Approved Architecture Roadmap | Architectural alignment | READY | `docs/TTC_AutoCAD_...Roadmap.md` |

## 9. Known Unknowns

| ID | Unknown / Decision Needed | Why It Matters | Resolve In |
|---|---|---|---|
| KU-F0-01 | NuGet vs local DLL reference strategy for AutoCAD assemblies | Affects portable build on CI and diverse developer workstations | DESIGN / SPEC |
| KU-F0-02 | Log file target path when `.bundle` is installed in read-only system folder | Prevents unauthorized file access exceptions on startup | DESIGN / SPEC |
| KU-F0-03 | Modeless PaletteSet document switching event handling | Prevents null reference exceptions when drawings are closed | DESIGN / SPEC |
| KU-F0-04 | Ribbon initialization timing relative to `IExtensionApplication.Initialize()` | AutoCAD ribbon UI may not be loaded when plugin initializes | DESIGN / SPEC |

## 10. Existing Evidence / References

- Architecture Roadmap: `docs/TTC_AutoCAD_Engineering_Tools_Architecture_Roadmap.md` (Sections 4, 5, 6, 7).
- Governance Rules: `governance/ANTIGRAVITY_INSTRUCTIONS.md` (Sections 2.1, 3, 14–16).
- Decision Log: `governance/DECISION_LOG.md` (`TTC-GOV-001`, `TTC-GOV-002`).
- Tranche Roadmap: `docs/tranches/TRANCHE_ROADMAP.md` (Section 4, F0 Definition).
- Production Lane: `production/README.md`.

## 11. Expected Output From This Intake

- Approved Tranche F0 Intake document (`docs/tranches/F0/INTAKE.md`).
- Tranche F0 Architectural Design document (`docs/tranches/F0/DESIGN.md`).
- Bounded Tranche F0 Feature Specification (`docs/tranches/F0/SPEC.md`).
- Acceptance Criteria and Verification Matrix ready for independent review.

## 12. Success Criteria

- [ ] **SC-F0-01:** AutoCAD 2023 can load the TTC assembly without unhandled exception via `.bundle` autoloader or `NETLOAD`.
- [ ] **SC-F0-02:** Command `TTCINFO` executes and displays accurate plugin health diagnostics in the AutoCAD command window.
- [ ] **SC-F0-03:** TTC Ribbon tab/panel shell is constructed and visible in the AutoCAD Ribbon interface.
- [ ] **SC-F0-04:** TTC `PaletteSet` shell opens modelessly, docks cleanly, and hosts a basic WPF view without flickering or exceptions.
- [ ] **SC-F0-05:** Valid `settings.json` loads and deserializes into strongly typed configuration models.
- [ ] **SC-F0-06:** Missing or malformed `settings.json` produces explicit diagnostic warnings without crashing AutoCAD.
- [ ] **SC-F0-07:** File logging initializes at plugin startup and reliably records INFO and ERROR events.
- [ ] **SC-F0-08:** `.bundle` directory layout and `PackageContents.xml` comply with Autodesk Application Package specifications.
- [ ] **SC-F0-09:** Zero Panel or M&E production engineering features exist in F0 (strict scope containment).

## 13. Input Acceptance Gate

- [x] Objective is specific and measurable.
- [x] Primary user is identified.
- [x] In Scope is explicit and bounded to infrastructure.
- [x] Out of Scope explicitly excludes all engineering domain logic.
- [x] Technical/domain constraints are explicit (AutoCAD 2023, .NET 4.8, C#).
- [x] Dependencies are recorded.
- [x] Known unknowns are recorded.
- [x] Success criteria are measurable.
- [x] No known conflict with frozen decisions or upstream roadmap.

Gate Result: `PASS`

## 14. Approval

Reviewer: Independent Technical Reviewer / Product Owner  
Disposition: `PENDING_REVIEW`  
Date: 2026-09-08  
Notes: Initial Intake prepared for Tranche F0. Implementation remains locked until formal review and Work Order approval.
