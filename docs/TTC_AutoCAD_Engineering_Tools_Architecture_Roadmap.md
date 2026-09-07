# TTC AutoCAD Engineering Tools
## Architecture & Development Roadmap

**Target platform:** AutoCAD 2023  
**Primary language:** C#  
**Runtime:** .NET Framework 4.8  
**UI:** WPF + AutoCAD PaletteSet  
**Development model:** Modular AutoCAD Managed .NET Plugin  
**Document status:** Approved baseline for Agent development  
**Primary user:** Electrical / M&E design engineer  

---

# 1. Purpose

This document defines the approved architecture, scope, development roadmap, technical rules, and acceptance gates for a custom AutoCAD 2023 engineering toolset.

The toolset has two independent engineering purposes:

1. **Panel Mechanical Layout**
   - Arrange electrical devices mechanically on an electrical panel.
   - Design DIN rails and wiring ducts.
   - Check physical clearances and collisions.
   - Check enclosure depth.
   - Calculate the actual required layout envelope.
   - Recommend a suitable enclosure size from a cabinet library.

2. **M&E Cable Tray Design**
   - Place electrical panels on M&E drawings.
   - Draw cable tray routes efficiently.
   - Manage tray size and elevation.
   - Generate elbows, tees, crosses, reducers, rises/drops, and tray-to-panel connections.
   - Generate supports/hangers.
   - Check route consistency and installation constraints.
   - Calculate installation quantities.

The plugin is not intended to replace EPLAN or become an ECAD schematic system.

---

# 2. Critical Scope Boundary

## 2.1 AutoCAD responsibility

AutoCAD 2023 is used for:

```text
AUTOCAD 2023
│
├── Panel Mechanical Layout
│   ├── Device physical footprint
│   ├── DIN rail
│   ├── Wiring duct
│   ├── Mechanical clearance
│   ├── Collision checking
│   ├── Cabinet depth checking
│   └── Cabinet size selection
│
├── M&E Layout
│   ├── Panel installation position
│   ├── Cable tray route
│   ├── Tray fitting
│   ├── Elevation
│   ├── Support / hanger
│   └── Tray-to-panel connection
│
└── Layout Export
    └── Clean DWG/DXF for downstream documentation
```

## 2.2 EPLAN responsibility

EPLAN 2022 is a completely separate toolchain and is responsible for:

```text
EPLAN 2022
│
├── Electrical schematic
├── Device Tag
├── Part Number
├── Article / Part Master Data
├── Electrical BOM
├── Electrical connection data
└── Electrical project documentation
```

## 2.3 Mandatory separation rule

**AutoCAD and EPLAN do not share a common Master Data system in this project.**

The AutoCAD plugin must not implement:

- EPLAN Part Master synchronization.
- EPLAN Device Tag management.
- Electrical Part Number management.
- Electrical BOM.
- Wire numbering.
- Terminal numbering logic.
- Cable core management.
- Electrical cross-reference.
- Electrical schematic logic.
- Supplier or purchasing data.
- EPLAN API integration unless explicitly opened as a future independent project.

The only relationship is:

```text
Approved AutoCAD mechanical layout
                ↓
       Clean DWG/DXF export
                ↓
        Imported into EPLAN
```

This is a drawing handoff, not a data synchronization workflow.

---

# 3. Product Structure

The approved product structure is:

```text
TTC CAD Engineering Tools
│
├── MODULE A — Panel Layout Designer
│
├── MODULE B — M&E Cable Tray Designer
│
└── MODULE C — CAD Standards & Export
```

Development must be sequential. Do not build all modules at the same time.

---

# 4. Technology Baseline

## 4.1 Required stack

```text
Language            C#
Target Framework    .NET Framework 4.8
Host                AutoCAD 2023
API                 AutoCAD Managed .NET API
UI                  WPF
Dockable UI         PaletteSet
Plugin packaging    AutoCAD .bundle
Configuration       JSON initially
Library storage     JSON or SQLite behind repository interfaces
Logging             File-based structured logging
```

## 4.2 AutoLISP usage

AutoLISP may be used only for:

- Small personal utilities.
- Quick proof-of-concept commands.
- Temporary migration scripts.
- Very small drawing automation.

Core product functionality must be implemented in C#.

## 4.3 ObjectARX

C++ ObjectARX is not part of the initial architecture.

Introduce ObjectARX only if a proven technical limitation of the Managed .NET API requires it.

---

# 5. Architectural Principles

## 5.1 Do not place business rules directly inside AutoCAD commands

Bad architecture:

```text
CommandMethod
    ↓
AutoCAD API
    ↓
All geometry logic
    ↓
All validation logic
    ↓
All data access
```

Approved architecture:

```text
AutoCAD Command / UI
        ↓
Application Service
        ↓
Engineering Core
        ↓
Repository / Geometry Adapter
        ↓
AutoCAD API / Data Storage
```

AutoCAD commands are adapters, not the engineering domain.

---

## 5.2 Separate geometry from engineering rules

Examples:

```text
Geometry
├── Bounding box
├── Offset
├── Intersection
├── Point / vector
├── Polyline
└── Transform

Engineering Rules
├── Device clearance
├── Cabinet usable area
├── Rail compatibility
├── Duct spacing
├── Tray connection
├── Support spacing
└── Cabinet recommendation
```

This separation is mandatory for testability.

---

## 5.3 No hard-coded project standards

Values such as these must be configurable:

- Default device clearance.
- Minimum panel edge clearance.
- DIN rail spacing.
- Wiring duct spacing.
- Tray support spacing.
- Additional support distance near fittings.
- Cabinet reserve rules.
- Default tray elevation.
- Standard tray sizes.
- Layer names.
- Annotation styles.

Do not hard-code engineering values in command handlers.

---

## 5.4 Preserve normal DWG usability

A drawing created with the plugin must remain readable and editable in standard AutoCAD.

The plugin must not make the DWG dependent on proprietary custom entities unless explicitly approved later.

Prefer standard AutoCAD entities:

- BlockReference.
- Polyline.
- Line.
- MText.
- Dimension.
- Hatch.
- Layer.
- XData / Extension Dictionary / XRecord for plugin metadata.

---

# 6. Proposed Solution Structure

```text
TTC.CadTools.sln
│
├── TTC.CadTools.Core
│   ├── Geometry
│   ├── Rules
│   ├── Validation
│   ├── PanelSizing
│   └── TrayRouting
│
├── TTC.CadTools.Application
│   ├── Panel
│   ├── ME
│   ├── Export
│   └── Common
│
├── TTC.CadTools.AutoCAD
│   ├── Commands
│   ├── AutoCADAdapters
│   ├── DrawingService
│   ├── BlockService
│   ├── GeometryService
│   ├── SelectionService
│   ├── MetadataService
│   └── PluginEntry
│
├── TTC.CadTools.Panel
│   ├── ComponentLibrary
│   ├── CabinetLibrary
│   ├── Layout
│   ├── DinRail
│   ├── WiringDuct
│   └── Checker
│
├── TTC.CadTools.ME
│   ├── CableTray
│   ├── Fittings
│   ├── Elevation
│   ├── Connections
│   ├── Supports
│   ├── Checker
│   └── Quantity
│
├── TTC.CadTools.Data
│   ├── Repositories
│   ├── Json
│   ├── SQLite
│   ├── Settings
│   └── Migration
│
├── TTC.CadTools.UI
│   ├── Palettes
│   ├── Dialogs
│   ├── ViewModels
│   └── CommonControls
│
└── TTC.CadTools.Tests
    ├── Core
    ├── Rules
    ├── PanelSizing
    └── TrayRouting
```

The exact project count may be simplified during the first implementation, but dependency direction must remain clean.

Recommended dependency direction:

```text
Core
 ↑
Application
 ↑
Panel / ME
 ↑
AutoCAD + UI

Data implements repository interfaces defined by Core/Application.
```

`Core` must not reference AutoCAD assemblies.

---

# 7. Plugin UI

## 7.1 Ribbon

Recommended ribbon:

```text
TTC ENGINEERING TOOLS

PANEL
[Components] [Cabinet] [DIN Rail] [Duct] [Arrange] [Check] [Size]

M&E
[Tray Route] [Fitting] [Rise/Drop] [Connect] [Support] [Check]

DATA
[Libraries] [Settings]

OUTPUT
[Quantity] [Export]
```

## 7.2 Palette

Recommended modeless PaletteSet:

```text
TTC Engineering
├── Panel Components
├── Cabinets
├── Panel Analysis
├── Cable Tray
├── M&E Quantity
└── Settings
```

Use MVVM for WPF where practical.

---

# 8. Common Metadata Strategy

Plugin objects should have stable internal identifiers.

Recommended metadata:

```text
TTC_OBJECT_TYPE
TTC_OBJECT_ID
TTC_SCHEMA_VERSION
TTC_LIBRARY_ID
TTC_LIBRARY_VERSION
```

Examples of `TTC_OBJECT_TYPE`:

```text
PANEL_COMPONENT
CABINET
DIN_RAIL
WIRING_DUCT
TRAY_ROUTE
TRAY_FITTING
TRAY_SUPPORT
PANEL_CONNECTION
RESERVED_ZONE
```

Store human-visible values as normal block attributes only when the user needs to edit or see them.

Use XData or Extension Dictionary / XRecord for internal metadata.

Do not use block name as the only identity.

---

# 9. MODULE A — Panel Layout Designer

# 9.1 Objective

The Panel Layout Designer assists the engineer in determining whether a set of devices can be installed inside a selected cabinet and recommends a suitable cabinet size based on actual layout geometry.

The primary workflow is:

```text
Select component
        ↓
Insert mechanical footprint
        ↓
Create DIN rails
        ↓
Create wiring ducts
        ↓
Arrange devices
        ↓
Check clearances
        ↓
Check depth
        ↓
Calculate required envelope
        ↓
Recommend cabinet
```

---

# 10. Panel Mechanical Component Library

## 10.1 Purpose

This is a mechanical CAD footprint library only.

It is not EPLAN Master Data.

## 10.2 Minimum component schema

```text
PanelComponent
├── Id
├── Category
├── Manufacturer              optional
├── Model                     optional
├── Description               optional
├── Width
├── Height
├── Depth
├── MountingType
├── BlockPath
├── DefaultRotation
├── AllowRotation
├── Clearance
│   ├── Top
│   ├── Bottom
│   ├── Left
│   ├── Right
│   └── Front
├── ThermalClass              future / optional
├── LibraryVersion
└── IsActive
```

Recommended mounting types:

```text
DIN_RAIL
MOUNTING_PLATE
DOOR
SIDE_PANEL
OTHER
```

## 10.3 Mechanical identity rule

Manufacturer and Model exist only to locate the correct physical footprint and dimensional rule.

They are not electrical master-data keys.

---

# 11. Panel Component Palette

The component palette should support:

- Search.
- Filter by Category.
- Filter by Manufacturer.
- Preview.
- Dimensions.
- Clearance values.
- Mounting type.
- Insert.

Example:

```text
PANEL COMPONENTS

Search: [ VFD                       ]

Category: VFD
Manufacturer: Schneider

Model: XXXXX
Width: 180 mm
Height: 300 mm
Depth: 210 mm

Clearance
Top:    100
Bottom: 100
Left:    50
Right:   50

[Preview]

[Insert]
```

---

# 12. Cabinet Library

## 12.1 Cabinet schema

```text
Cabinet
├── Id
├── Manufacturer              optional
├── Series                    optional
├── Model                     optional
├── Width
├── Height
├── Depth
├── MountingPlate
│   ├── Width
│   ├── Height
│   ├── OffsetX
│   ├── OffsetY
│   └── DepthOffset
├── DoorInternalAllowance
├── TopEntryAllowed
├── BottomEntryAllowed
├── SideEntryAllowed
├── BlockPath
├── LibraryVersion
└── IsActive
```

Cabinet sizing must use the usable mounting area, not only outside enclosure dimensions.

---

# 13. Smart Component Insert

Suggested command:

```text
TTCPANELPLACE
```

Operation:

1. Select component from library.
2. Load or resolve the correct block.
3. Insert at selected point.
4. Apply plugin metadata.
5. Create or calculate the clearance envelope.
6. Place on the correct layer.
7. Preserve physical dimensions.

The command must not create electrical Tags or Part Numbers.

---

# 14. Clearance Envelope

A component has two geometric concepts:

```text
Physical Footprint
+
Required Clearance Envelope
```

Example:

```text
┌─────────────────────────┐
│     Clearance Area      │
│                         │
│    ┌───────────────┐    │
│    │ Actual Device │    │
│    │   Footprint   │    │
│    └───────────────┘    │
│                         │
└─────────────────────────┘
```

Clearance objects should normally be:

- Non-plot.
- On a dedicated layer.
- Rebuildable from component metadata.

Do not permanently explode clearance geometry into uncontrolled linework.

---

# 15. DIN Rail Designer

Suggested command:

```text
TTCRAIL
```

User workflow:

```text
Select rail type
→ Pick start point
→ Pick end point
→ Create rail
```

Minimum rail schema:

```text
DinRail
├── Id
├── Type
├── Width
├── Height
├── Length
├── StartPoint
├── EndPoint
└── Layer
```

Future feature:

- Snap compatible components to rail.
- Calculate occupied/free rail length.

---

# 16. Wiring Duct Designer

Suggested command:

```text
TTCDUCT
```

Supported library sizes should be configurable, for example:

```text
25 x 40
40 x 60
60 x 80
80 x 100
```

Minimum duct schema:

```text
WiringDuct
├── Id
├── Width
├── Height
├── Path
└── Layer
```

Duct geometry is included in panel usable-space analysis.

---

# 17. Panel Arrangement Tools

Required utility commands:

```text
Align Left
Align Right
Align Top
Align Bottom

Equal Horizontal Spacing
Equal Vertical Spacing

Align To DIN Rail
Align To Wiring Duct
```

These tools must preserve metadata and block references.

Do not explode the selected devices.

---

# 18. Panel Clearance & Collision Checker

Suggested command:

```text
TTCPANELCHECK
```

Minimum validation rules:

```text
DEVICE_DEVICE_COLLISION
CLEARANCE_OVERLAP
OUTSIDE_MOUNTING_PLATE
DEVICE_DUCT_COLLISION
DEVICE_RAIL_MISMATCH
EDGE_CLEARANCE_VIOLATION
CABINET_DEPTH_VIOLATION
RESERVED_ZONE_COLLISION
```

Result model:

```text
ValidationResult
├── Severity
├── RuleCode
├── Message
├── ObjectIds
├── Location
└── SuggestedAction
```

Severity:

```text
ERROR
WARNING
INFO
```

UI should support:

```text
[Zoom To Object]
[Select Object]
```

Automatic fixing may be added only for rules where the correction is deterministic.

---

# 19. Cabinet Depth Checker

Depth checking is mandatory even when working primarily in 2D.

Concept:

```text
Cabinet usable depth
    =
Cabinet depth
- mounting plate offset
- door/internal allowance
- configured safety allowance
```

Compare against:

```text
Device depth
+ required front clearance
```

The exact formula must be implemented through configurable rules, not hard-coded assumptions.

The tool must identify the device causing the maximum required depth.

---

# 20. Reserved Space

Future expansion space should be represented geometrically.

Recommended object:

```text
ReservedZone
├── Id
├── Rectangle / Polygon
├── Description
└── ReserveType
```

Examples:

```text
FUTURE_DEVICE
FUTURE_EXPANSION
DO_NOT_USE
MAINTENANCE
```

Panel sizing must include reserved zones as occupied space.

---

# 21. Cabinet Size Recommendation Engine

Suggested command:

```text
TTCPANELSIZE
```

This is the central engineering feature of Module A.

## 21.1 Inputs

```text
Actual component geometry
Clearance envelopes
DIN rails
Wiring ducts
Reserved zones
Panel edge rules
Depth requirements
Cabinet usable-area definitions
Cabinet library
```

## 21.2 Required calculation

The engine must determine:

```text
Required usable width
Required usable height
Required usable depth
```

It must not use only:

```text
Total device area / cabinet area
```

because area alone does not represent layout feasibility.

## 21.3 Recommendation output

Example:

```text
Calculated Requirement

Width       718 mm
Height     1035 mm
Depth       276 mm
```

Candidate table:

```text
600 x 1000 x 300     FAIL
800 x 1000 x 300     FAIL: HEIGHT
800 x 1200 x 300     PASS
800 x 1400 x 300     PASS
```

Recommended:

```text
800 x 1200 x 300
```

Also report:

```text
Width reserve
Height reserve
Depth reserve
```

The recommendation must explain why smaller cabinets fail.

---

# 22. Future Thermal Rule Layer

Full thermal simulation is not part of the initial scope.

The architecture may later support rule-based layout constraints such as:

```text
HIGH_HEAT
HEAT_SENSITIVE
VENTILATION_REQUIRED
```

Examples:

- VFD should not be placed inside another device's thermal clearance.
- Sensitive electronics should not be placed immediately above high-heat devices.
- Fan/ventilation reserved zones.

Do not build this until the Panel MVP is stable.

---

# 23. MODULE B — M&E Cable Tray Designer

# 23.1 Objective

Create an engineering routing assistant for cable tray layout in AutoCAD.

Primary workflow:

```text
Place panels
      ↓
Draw tray centerline
      ↓
Assign tray properties
      ↓
Generate tray geometry
      ↓
Generate fittings
      ↓
Manage elevation
      ↓
Connect tray to panel
      ↓
Generate supports
      ↓
Check route
      ↓
Calculate quantity
```

---

# 24. Cable Tray Route Model

Recommended route schema:

```text
CableTrayRoute
├── Id
├── RouteCode
├── TrayType
├── Width
├── Height
├── Elevation
├── System
├── Centerline
├── LibraryVersion
└── IsActive
```

Recommended systems:

```text
POWER
CONTROL
INSTRUMENT
COMMUNICATION
OTHER
```

These are M&E classification values only.

---

# 25. Smart Cable Tray Route

Suggested command:

```text
TTCTRAY
```

Workflow:

1. Select tray type.
2. Select width.
3. Select height.
4. Set elevation.
5. Draw centerline polyline.
6. Generate tray edge geometry.
7. Store route metadata.

The centerline should remain the controlling geometry whenever practical.

Changing route properties should allow regeneration.

---

# 26. Tray Fittings

Required fitting types:

```text
HORIZONTAL_ELBOW
VERTICAL_ELBOW
TEE
CROSS
REDUCER
STRAIGHT
CUSTOM
```

The system should detect common route conditions and recommend/generate appropriate fittings.

Do not silently generate ambiguous fittings when route geometry is unclear. Return a validation warning or ask the user to select the fitting.

---

# 27. Elevation Manager

Required functions:

- Show tray routes and elevations.
- Edit route elevation.
- Highlight selected route.
- Update associated annotation.
- Support filtered editing.

Example:

```text
Route    Size       Elevation
CT01     300x100    +3200
CT02     200x100    +2800
CT03     400x100    +3500
```

---

# 28. Rise / Drop Tool

Suggested commands:

```text
TTCRISE
TTCDROP
```

A transition must store:

```text
FromElevation
ToElevation
DeltaElevation
RelatedRouteId
```

The tool must create standardized annotation.

---

# 29. M&E Panel Placement

Panel blocks used in M&E layout may contain:

```text
PanelME
├── Id
├── Width
├── Depth
├── Orientation
├── FrontMaintenanceZone
├── DoorSwing
├── EntryTop
├── EntryBottom
├── EntryLeft
└── EntryRight
```

This model is installation geometry only.

It does not contain EPLAN electrical device data.

---

# 30. Tray-to-Panel Connection Assistant

Suggested command:

```text
TTCTRAYCONNECT
```

Workflow:

```text
Select tray
→ Select panel
→ Select entry zone
→ Select connection method
→ Generate connection geometry
```

Connection methods may include:

```text
STRAIGHT
HORIZONTAL_BEND
VERTICAL_BEND
REDUCER
DROP
CUSTOM
```

The final fitting must remain editable.

---

# 31. Support / Hanger Generator

Suggested command:

```text
TTCTRAYSUPPORT
```

Support rules must be configurable.

Example settings:

```text
Default straight spacing
Maximum straight spacing
Distance from elbow
Distance from tee
Distance from reducer
Distance from panel connection
```

No support spacing value may be hard-coded as a universal engineering standard.

The generator should place supports and assign them to the route.

---

# 32. M&E Route Checker

Suggested command:

```text
TTCMECHECK
```

Minimum rules:

```text
BROKEN_ROUTE
MISSING_FITTING
TRAY_WIDTH_TRANSITION_WITHOUT_REDUCER
ROUTE_ELEVATION_CONFLICT
INVALID_PANEL_CONNECTION
SUPPORT_SPACING_EXCEEDED
DUPLICATE_ROUTE_ID
INVALID_ROUTE_GEOMETRY
```

Optional future rules:

```text
WALL_CLEARANCE
CEILING_CLEARANCE
PIPE_CONFLICT
DUCT_CONFLICT
STRUCTURAL_CONFLICT
```

Only add cross-discipline clash rules when the required drawing information is available and reliable.

---

# 33. M&E Quantity Takeoff

Suggested command:

```text
TTCMEQTY
```

This is an installation quantity report, not an EPLAN electrical BOM.

Minimum quantities:

```text
Tray straight length by size/type
Horizontal elbows
Vertical elbows
Tees
Crosses
Reducers
Supports
Panel connection fittings
```

Example:

| Item | Size | Quantity |
|---|---|---:|
| Cable tray | 300x100 | 43.5 m |
| Cable tray | 200x100 | 18.2 m |
| Horizontal elbow | 300x100 | 6 |
| Tee | 300x100 | 3 |
| Reducer | 300→200 | 2 |
| Support | configurable | 42 |

Export formats may include:

```text
CSV
XLSX
```

XLSX export is an output feature only and must not create an electrical parts database.

---

# 34. MODULE C — CAD Standards & Export

# 34.1 Layer Manager

Initial configurable layers may include:

```text
TTC-PANEL-EQUIP
TTC-PANEL-DUCT
TTC-PANEL-DIN
TTC-PANEL-CLEARANCE
TTC-PANEL-RESERVED
TTC-PANEL-DIM

TTC-ME-TRAY-POWER
TTC-ME-TRAY-CONTROL
TTC-ME-TRAY-FITTING
TTC-ME-TRAY-SUPPORT
TTC-ME-PANEL
TTC-ME-ANNOTATION
```

Functions:

- Create missing layers.
- Apply configured properties.
- Move plugin objects to the correct layer.
- Validate wrong-layer objects.

Layer names must come from configuration.

---

# 35. Export Layout for EPLAN

Suggested command:

```text
TTCEPLANEXPORT
```

The name describes the target workflow only. This command must not call the EPLAN API.

Workflow:

```text
Approved AutoCAD panel layout
        ↓
Select export boundary / layout
        ↓
Create clean copy
        ↓
Remove development-only objects
        ↓
Remove non-plot clearance objects if configured
        ↓
Remove plugin calculation overlays if configured
        ↓
Purge export copy
        ↓
Save clean DWG/DXF
        ↓
User imports file into EPLAN manually
```

Critical rule:

**Never destructively clean the engineer's source drawing.**

Create an export copy or transactionally operate on a cloned database.

---

# 36. Data Storage Strategy

Two acceptable approaches are defined.

## Option A — JSON

Use for:

- Early MVP.
- Settings.
- Small libraries.
- Easy source-control review.

Advantages:

- Simple.
- Human-readable.
- Easy backup.
- Easy Agent development.

Disadvantages:

- Weak search for large data.
- Limited concurrency.
- Manual migration becomes harder at scale.

## Option B — SQLite

Use when libraries grow.

Advantages:

- Structured queries.
- Indexing.
- Version management.
- Better scaling for local engineering libraries.

Disadvantages:

- Additional database layer.
- Migration management required.

## Approved architecture

Repositories must isolate persistence:

```text
IComponentRepository
ICabinetRepository
ITrayLibraryRepository
ISettingsRepository
```

Therefore the project may begin with JSON and migrate to SQLite without rewriting UI or engineering logic.

---

# 37. Library Versioning

Every library entity should support:

```text
Id
SchemaVersion
LibraryVersion
UpdatedAt
IsActive
```

Do not automatically overwrite a drawing's existing footprint merely because the library contains a newer version.

A future update workflow should:

```text
Detect outdated library object
→ Show differences
→ User approves update
→ Preserve position/orientation
```

---

# 38. Configuration Model

Recommended configuration sections:

```text
settings.json
│
├── General
├── Layers
├── Panel
│   ├── EdgeClearance
│   ├── DepthAllowance
│   ├── DefaultReserve
│   └── Validation
│
├── DINRail
├── WiringDuct
├── CableTray
│   ├── StandardSizes
│   ├── DefaultElevation
│   ├── SupportRules
│   └── FittingRules
│
├── Export
└── Logging
```

Settings must be validated at startup.

Invalid values must produce a clear error instead of silently falling back to unsafe assumptions.

---

# 39. Command Naming Convention

All custom commands should share a unique prefix to avoid command collisions.

Recommended prefix:

```text
TTC
```

Example commands:

```text
TTCPANEL
TTCPANELPLACE
TTCRAIL
TTCDUCT
TTCPANELCHECK
TTCPANELSIZE

TTCTRAY
TTCRISE
TTCDROP
TTCTRAYCONNECT
TTCTRAYSUPPORT
TTCMECHECK
TTCMEQTY

TTCSETTINGS
TTCLIBRARY
TTCEPLANEXPORT
```

Final names may be changed once, before public/internal release.

---

# 40. Error Handling Rules

Every AutoCAD command must:

1. Validate document availability.
2. Use transactions correctly.
3. Catch expected user-cancel operations separately.
4. Roll back failed operations.
5. Avoid leaving partial geometry.
6. Log technical exceptions.
7. Show concise actionable messages to the engineer.

Never suppress an exception without logging.

---

# 41. AutoCAD Transaction Rules

Agent must follow these rules:

- Use `using` blocks for AutoCAD transactions.
- Open objects for read by default.
- Upgrade to write only when required.
- Minimize transaction scope.
- Do not keep DBObject references outside their valid transaction lifetime.
- Respect document locking when modifying drawings from modeless UI.
- Do not block the AutoCAD UI with long operations.
- Batch expensive geometry analysis when possible.

---

# 42. Geometry Rules

All engineering calculations must have a defined drawing-unit strategy.

Initial assumption:

```text
Panel mechanical drawings: millimeters
M&E drawings: project drawing unit configurable
```

The implementation must not assume that every drawing unit is millimeters without checking configuration/drawing units.

Core geometry should use normalized internal engineering units where practical.

Tolerance must be configurable or centrally defined.

Do not compare floating-point geometry using exact equality.

---

# 43. Performance Requirements

Target examples:

## Panel

A normal panel drawing with approximately:

```text
200 mechanical components
100 ducts/rails/zones
```

should remain interactive.

## M&E

A drawing with:

```text
hundreds of tray segments
hundreds of fittings
```

must not require a full drawing scan on every cursor move.

Use:

- Cached indexes where appropriate.
- Layer/object-type filtering.
- Metadata filtering.
- Spatial filtering.
- Deferred validation.

Avoid repeatedly iterating over every entity in ModelSpace.

---

# 44. Logging

Minimum log categories:

```text
STARTUP
COMMAND
LIBRARY
GEOMETRY
VALIDATION
EXPORT
ERROR
PERFORMANCE
```

Each error should include:

```text
Timestamp
Command
Drawing
Operation
Exception
ObjectId when relevant
```

Do not log confidential drawing contents unnecessarily.

---

# 45. Development Workflow for Agent

Every module follows this gate:

```text
Read current roadmap
        ↓
Confirm current module only
        ↓
Review existing code
        ↓
Implement smallest coherent scope
        ↓
Build
        ↓
Unit test engineering core
        ↓
Manual AutoCAD test
        ↓
Regression test previous modules
        ↓
Update technical documentation
        ↓
Git checkpoint
        ↓
Stop
```

Agent must not automatically proceed to the next module in the same task unless explicitly instructed.

---

# 46. Phase 0 — Technical Baseline

## Scope

Create only the technical foundation.

Deliverables:

```text
Solution structure
AutoCAD 2023 plugin entry point
Basic command
Ribbon
PaletteSet shell
Settings loader
Logging
Repository interfaces
Plugin .bundle packaging
Developer README
```

Example health command:

```text
TTCINFO
```

Expected output:

```text
TTC CAD Engineering Tools
AutoCAD Host: 2023
Plugin: Loaded
Configuration: Valid
Libraries: Available
```

## Do not implement

- Panel layout logic.
- Cabinet sizing.
- Cable tray.
- EPLAN integration.

## Checkpoint

```text
cad-tools-baseline
```

---

# 47. Phase 1 — Panel Mechanical Library

## Scope

Implement:

```text
Component mechanical data model
Cabinet data model
JSON repository
Component library palette
Cabinet library palette
Block preview/selection
Library validation
```

## Acceptance

- Can create/edit component definitions.
- Can create/edit cabinet definitions.
- Invalid dimensions are rejected.
- Missing block files are reported.
- Libraries persist after AutoCAD restart.
- No EPLAN data model exists.

## Checkpoint

```text
panel-library-v1
```

---

# 48. Phase 2 — Panel Layout Basics

## Scope

Implement:

```text
Smart component insert
DIN rail
Wiring duct
Panel object metadata
Align commands
Equal spacing
Layer assignment
```

## Acceptance

- Inserted component retains correct footprint.
- Metadata survives save/reopen.
- Rail and duct objects are editable.
- Alignment preserves block references.
- Undo works correctly.
- No electrical Tag/Part generation.

## Checkpoint

```text
panel-layout-v1
```

---

# 49. Phase 3 — Panel Clearance & QA

## Scope

Implement:

```text
Clearance envelopes
Device collision
Device-clearance violation
Device-duct collision
Mounting plate boundary
Edge clearance
Basic results palette
Zoom to violation
```

## Acceptance

Create test drawings with intentional violations.

Every expected violation must be detected consistently.

No false PASS is allowed when an object exceeds the mounting plate.

## Checkpoint

```text
panel-check-v1
```

---

# 50. Phase 4 — Cabinet Sizing

## Scope

Implement:

```text
Usable layout envelope calculation
Required width
Required height
Required depth
Candidate cabinet evaluation
Recommended cabinet
Failure reason per candidate
Reserve margin reporting
```

## Acceptance test example

Given a layout requiring:

```text
718 x 1035 x 276
```

and cabinets:

```text
600x1000x300
800x1000x300
800x1200x300
800x1400x300
```

the tool must explain:

```text
600x1000x300     FAIL width + height
800x1000x300     FAIL height
800x1200x300     PASS
800x1400x300     PASS
```

and select the smallest valid cabinet according to the configured recommendation rule.

## Checkpoint

```text
panel-sizing-v1
```

---

# 51. Phase 5 — Panel Depth & Reserved Space

## Scope

Implement:

```text
Depth check
Mounting plate depth offset
Door/internal allowance
Reserved zones
Reserved-zone collision
Sizing integration
```

## Checkpoint

```text
panel-engineering-v1
```

At this point Panel MVP is considered complete.

---

# 52. Phase 6 — M&E Basic Routing

## Scope

Implement:

```text
M&E panel placement
Cable tray route model
Centerline route drawing
Tray width/height
Tray type
Elevation
Route metadata
Tray edge generation
```

## Checkpoint

```text
me-tray-route-v1
```

---

# 53. Phase 7 — Tray Fittings

## Scope

Implement:

```text
Horizontal elbow
Vertical elbow
Tee
Cross
Reducer
Fitting metadata
Fitting regeneration
```

## Checkpoint

```text
me-fittings-v1
```

---

# 54. Phase 8 — Elevation & Rise/Drop

## Scope

Implement:

```text
Elevation manager
Elevation annotations
Rise
Drop
Elevation transition metadata
```

## Checkpoint

```text
me-elevation-v1
```

---

# 55. Phase 9 — Tray to Panel Connection

## Scope

Implement:

```text
Panel entry zones
Tray-to-panel connection
Connection fitting
Connection validation
```

## Checkpoint

```text
me-panel-connect-v1
```

---

# 56. Phase 10 — Supports

## Scope

Implement:

```text
Support library
Configurable support spacing
Automatic support generation
Extra supports near fittings
Support regeneration
```

## Checkpoint

```text
me-support-v1
```

---

# 57. Phase 11 — M&E QA

## Scope

Implement:

```text
Broken route
Missing fitting
Missing reducer
Elevation conflict
Invalid panel connection
Support spacing
Route geometry validation
Results palette
Zoom to violation
```

## Checkpoint

```text
me-check-v1
```

---

# 58. Phase 12 — M&E Quantity

## Scope

Implement:

```text
Tray length
Fitting quantities
Support quantities
Connection quantities
CSV export
Optional XLSX export
```

## Checkpoint

```text
me-quantity-v1
```

---

# 59. Phase 13 — CAD Standards & EPLAN Drawing Export

## Scope

Implement:

```text
Layer standards
Object layer validation
Export settings
Clean export copy
DWG export
DXF export
Purge export copy
Exclude development-only layers
```

Critical rule:

```text
No EPLAN API
No EPLAN Master Data
No electrical data sync
```

## Checkpoint

```text
cad-export-v1
```

---

# 60. MVP Definition

The first useful Panel MVP is complete at:

```text
Phase 0
Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
```

It must support this complete engineering workflow:

```text
Load component library
        ↓
Select components
        ↓
Insert mechanical footprints
        ↓
Create DIN rails
        ↓
Create wiring ducts
        ↓
Arrange layout
        ↓
Check mechanical clearances
        ↓
Check cabinet depth
        ↓
Reserve future space
        ↓
Calculate required envelope
        ↓
Recommend standard cabinet
```

Do not begin M&E development before this workflow is stable unless the project owner explicitly changes the priority.

---

# 61. Definition of Done — Every Module

A module is not complete until all applicable conditions are satisfied:

- Scope matches this roadmap.
- No future-module features were added without approval.
- Project builds successfully.
- AutoCAD 2023 loads the plugin successfully.
- Commands can be executed without unhandled exceptions.
- Undo/Redo behavior is acceptable.
- Save → close → reopen retains required metadata.
- Existing previous-module functionality still works.
- Engineering calculations have unit tests where practical.
- Geometry tolerance cases are tested.
- User cancel does not leave partial geometry.
- Invalid configuration produces clear errors.
- Test drawing is included or documented.
- Technical documentation is updated.
- No EPLAN data integration has been introduced.
- Git checkpoint is created only after acceptance.

---

# 62. Required Regression Tests

## Common

```text
Plugin load
Plugin unload/reload if supported
New drawing
Existing drawing
Save
Save As
Close/reopen
Undo
Redo
User cancel
Invalid selection
Locked layer
Missing block/library
Invalid settings
```

## Panel

```text
Component insert
Rotate component
Move component
Copy component
Delete component
Rail
Duct
Clearance
Collision
Boundary
Depth
Reserved zone
Cabinet recommendation
```

## M&E

```text
Straight route
Multiple segments
Elbow
Tee
Cross
Reducer
Rise
Drop
Elevation edit
Panel connection
Support generation
Route validation
Quantity
```

---

# 63. Agent Guardrails

The development Agent must follow these mandatory rules.

## 63.1 Scope control

> Implement only the current roadmap phase.

Do not implement a later phase because the data model makes it possible.

## 63.2 Do not convert AutoCAD into an ECAD system

Never introduce:

```text
Electrical Tag Engine
Electrical Part Master
Electrical BOM
Wire Number
Terminal Number
EPLAN Master synchronization
```

unless this roadmap is explicitly revised.

## 63.3 Do not rewrite existing drawing data destructively

Before any migration or cleanup:

- Preserve source entities.
- Provide rollback.
- Prefer copy/regenerate.
- Never explode user drawings unnecessarily.

## 63.4 Do not invent engineering standards

If a required engineering number has not been specified:

- Make it configurable.
- Provide a clearly labeled default only if approved.
- Do not claim the value is universally correct.

## 63.5 Do not silently correct geometry

If correction could change engineering intent:

```text
Detect
→ Report
→ Let engineer approve
```

## 63.6 Do not use block names as the database

Blocks are graphical assets.

Library IDs are canonical plugin identifiers.

## 63.7 Core must remain AutoCAD-independent

Engineering calculations in `Core` must be unit-testable without launching AutoCAD whenever possible.

---

# 64. Recommended Development Priorities

Priority matrix:

| Feature | Engineering Value | Complexity | Priority |
|---|---:|---:|---:|
| Mechanical Component Library | Very High | Medium | P0 |
| Cabinet Library | Very High | Low-Medium | P0 |
| Smart Insert | Very High | Medium | P0 |
| DIN Rail | High | Low-Medium | P0 |
| Wiring Duct | High | Low-Medium | P0 |
| Align / Equal Spacing | High | Low | P0 |
| Clearance Checker | Very High | Medium | P0 |
| Depth Checker | Very High | Medium | P0 |
| Cabinet Recommendation | Very High | High | P0 |
| Reserved Zones | High | Medium | P1 |
| Tray Route | Very High | Medium | P1 |
| Tray Fittings | Very High | High | P1 |
| Elevation | High | Medium | P1 |
| Tray-to-Panel Connection | Very High | High | P1 |
| Supports | High | Medium | P2 |
| M&E QA | Very High | High | P2 |
| Quantity Takeoff | High | Medium | P2 |
| Thermal Rules | Medium | High | Future |
| 3D Clash | Medium-High | Very High | Future |

---

# 65. Recommended First Agent Task

The first implementation task after this document should be:

```text
PHASE 0 — Technical Baseline
```

The Agent should create:

1. AutoCAD 2023 C# solution targeting .NET Framework 4.8.
2. AutoCAD plugin entry point.
3. `TTCINFO` command.
4. Basic Ribbon.
5. Empty PaletteSet shell.
6. Configuration service.
7. Logging service.
8. Core/Application/AutoCAD dependency boundaries.
9. Repository interfaces.
10. `.bundle` packaging skeleton.
11. Developer setup README.
12. Build instructions.

It must **not** implement Panel Library in the same task.

After Phase 0 is tested inside AutoCAD 2023, create Git checkpoint:

```text
cad-tools-baseline
```

Then begin Phase 1.

---

# 66. Final Architecture Summary

```text
                     TTC CAD ENGINEERING TOOLS
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         PANEL LAYOUT       M&E DESIGN      CAD COMMON
              │                │                │
      Component Library    Tray Routes       Settings
      Cabinet Library      Fittings          Layers
      DIN Rail             Elevation         Metadata
      Wiring Duct          Connections       Logging
      Arrangement          Supports          Export
      Clearance            QA
      Depth                Quantity
      Cabinet Sizing
              │                │
              └────────┬───────┘
                       │
                 AutoCAD 2023
                       │
                 DWG / DXF Output
                       │
                Manual EPLAN Import
                       │
                   EPLAN 2022
```

Key product rule:

> AutoCAD owns physical layout and M&E installation geometry.  
> EPLAN owns electrical schematic and electrical Master Data.  
> The two toolchains remain independent.

---

# 67. Roadmap Status at Baseline

```text
PHASE 0  — Technical Baseline                 : NEXT
PHASE 1  — Panel Mechanical Library           : BLOCKED
PHASE 2  — Panel Layout Basics                : BLOCKED
PHASE 3  — Panel Clearance & QA               : BLOCKED
PHASE 4  — Cabinet Sizing                     : BLOCKED
PHASE 5  — Depth & Reserved Space             : BLOCKED
PHASE 6  — M&E Basic Routing                  : BLOCKED
PHASE 7  — Tray Fittings                      : BLOCKED
PHASE 8  — Elevation & Rise/Drop              : BLOCKED
PHASE 9  — Tray-to-Panel Connection           : BLOCKED
PHASE 10 — Supports                           : BLOCKED
PHASE 11 — M&E QA                             : BLOCKED
PHASE 12 — M&E Quantity                       : BLOCKED
PHASE 13 — CAD Standards & Export             : BLOCKED
```

Only one phase should be opened at a time.

---

# 68. Change-Control Rule

Any future change that introduces one of the following requires an explicit roadmap revision before implementation:

- EPLAN API integration.
- Shared AutoCAD/EPLAN Master Data.
- Electrical BOM inside AutoCAD.
- Electrical Tagging inside AutoCAD.
- Full 3D panel design.
- Thermal simulation.
- Full multi-discipline clash detection.
- Cloud backend.
- Multi-user library synchronization.
- Web-based library management.
- Automatic manufacturer catalog synchronization.

Do not allow implementation convenience to silently expand product scope.

---

**End of approved AutoCAD architecture and development roadmap.**


# 69. Official Autodesk Technical References

The technical baseline in this roadmap should be checked against the following Autodesk documentation when setting up the development environment:

1. **AutoCAD 2023 — Managed .NET Compatibility**  
   AutoCAD 2023 (release 24.2) supports .NET Framework 4.8.  
   https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Customization/files/GUID-A6C680F2-DE2E-418A-A182-E4884073338A.htm

2. **AutoCAD 2023 — About .NET Managed Applications**  
   Managed .NET applications can use C#/.NET to access AutoCAD drawing/database and user-interface functionality.  
   https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Customization/files/GUID-3A5E2EE7-9A06-4965-A614-AD97A49B849A.htm

3. **AutoCAD 2023 — PackageContents.xml Format Reference**  
   Defines AutoCAD application package metadata, supported releases/platforms, components, and loading behavior for `.bundle` deployment.  
   https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Customization/files/GUID-BC76355D-682B-46ED-B9B7-66C95EEF2BD0.htm

---

**Technical baseline verified for AutoCAD 2023: C# + .NET Framework 4.8 + AutoCAD Managed .NET API.**
