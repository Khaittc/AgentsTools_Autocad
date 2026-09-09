# Tranche F1: Common CAD Contracts — API & Host Verification Record

> **Purpose:** Technical verification evidence for AutoCAD Managed .NET APIs, database object lifecycle events, metadata cloning behaviors, and document transaction mechanics relevant to Tranche F1 Common CAD Contracts.
> **Rule:** Distinguish documented verification (`SOURCE_VERIFIED`), compiled assembly verification (`ASSEMBLY_VERIFIED`), project architecture policy (`PROJECT_POLICY`), and runtime tests required during BUILD (`HOST_TEST_REQUIRED`). Unverified assumptions must remain marked `UNRESOLVED`. This document is evidence only, not a specification.

---

## 1. Verified Sources Index

| Source ID | Title / Resource | Host / API Target | Exact Documentation Reference & URL | Documented Host Fact vs TTC Design Policy |
|---|---|---|---|---|
| **SRC-F1-01** | Autodesk Managed Reference: Database.DeepCloneObjects | AutoCAD 2023 Managed .NET API (`AcDbMgd.dll`) | `Autodesk.AutoCAD.DatabaseServices.Database.DeepCloneObjects` ([Autodesk Managed Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_DatabaseServices_Database_DeepCloneObjects_ObjectIdCollection_ObjectId_IdMapping_Boolean)) | **HOST FACT (`SOURCE_VERIFIED`):** `DeepCloneObjects(ObjectIdCollection, ObjectId, IdMapping, bool)` clones objects into target owner. Populates `IdMapping` with `(Key = Source ObjectId, Value = IdPair(Clone ObjectId, ...))`. Cloned entities receive newly minted unique `Handle` values. |
| **SRC-F1-02** | Autodesk Managed Reference: Handle Struct & ObjectId | AutoCAD 2023 Managed .NET API (`AcDbMgd.dll`) | `Autodesk.AutoCAD.DatabaseServices.Handle`, `ObjectId` ([Autodesk Handle Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_DatabaseServices_Handle), [Autodesk ObjectId Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_DatabaseServices_ObjectId)) | **HOST FACT (`SOURCE_VERIFIED`):** `Handle` is a persistent 64-bit value uniquely identifying an object within a single DWG database across save/reopen cycles. It is NOT globally unique across drawings. `ObjectId` is an in-memory database locator bound to the active session; changes across close/reopen. |
| **SRC-F1-03** | Autodesk ObjectARX DevGuide: Extension Dictionaries & XRecords | AutoCAD 2023 ObjectARX / Managed DevGuide | *Database Primer > Extension Dictionaries and Xrecords* ([Autodesk DevGuide](https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-8984920B-1A05-4B45-983C-B61E793A248A)), `Autodesk.AutoCAD.DatabaseServices.Xrecord` ([Managed Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_DatabaseServices_Xrecord)) | **HOST FACT (`SOURCE_VERIFIED`):** Extension dictionaries store arbitrary application data attached to `DBObject`. `XRecord` stores data in linked `ResultBuffer` DXF chains. Storage capacity is bounded by DWG object size / available RAM (substantially larger than XData). Deep clone operations clone extension dictionaries and XRecords recursively unless custom clone filtering is applied. |
| **SRC-F1-04** | Autodesk ObjectARX DevGuide: Extended Data (XData) Limits | AutoCAD 2023 ObjectARX DevGuide | *Advanced Topics > Extended Data (Xdata)* ([Autodesk DevGuide](https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-A64DB82E-7EC3-4A59-8DA2-2115C13EC513)) | **HOST FACT (`SOURCE_VERIFIED`):** Maximum extended data for an individual entity is **approximately 16 KB (16,383 bytes) total across all registered applications combined**, NOT per application. Autodesk guidance states XData should be lightweight (e.g. simple tags/keys). `SelectionFilter` efficiently queries registered application name (`DxfCode.ExtendedDataRegAppName`). |
| **SRC-F1-05** | Autodesk ObjectARX DevGuide: Notification Guidelines & Restrictions | AutoCAD 2023 ObjectARX / Managed DevGuide | *Notification Guidelines and Restrictions* ([Autodesk DevGuide](https://help.autodesk.com/view/OARX/2023/ENU/?guid=GUID-E5CDD9A3-97B2-4A73-BE9C-0C59CFDF75F5)), `Database.ObjectModified` | **HOST FACT (`SOURCE_VERIFIED`):** Database reactor event callbacks fire synchronously. Guidelines prohibit: (1) modifying the notifying object, (2) triggering operations that recursively fire the same event, (3) issuing interactive prompts. **TTC POLICY (`PROJECT_POLICY`):** TTC CAD adopts a read-only / dirty-flag policy prohibiting database write transactions inside reactors to avoid `eTransactionInProgress` and recursion. |
| **SRC-F1-06** | Autodesk Managed Reference: Document.LockDocument & Execution Contexts | AutoCAD 2023 Managed .NET API (`AcMgd.dll`) | `Autodesk.AutoCAD.ApplicationServices.Document.LockDocument` ([Autodesk Managed Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_ApplicationServices_Document_LockDocument)) | **HOST FACT (`SOURCE_VERIFIED`):** Writing to a database from modeless UI (such as WPF `PaletteSet`), background threads, or application context throws `eLockViolation` unless `DocumentLock` is held. Modal commands run under an implicit lock. |
| **SRC-F1-07** | Autodesk System Variables: Drawing Units & Defaults | AutoCAD 2023 Command & System Variable Reference | `INSUNITS`, `MEASUREMENT`, `LUNITS`, `INSUNITSDEFSOURCE`, `INSUNITSDEFTARGET` ([Autodesk SysVars](https://help.autodesk.com/view/ACD/2023/ENU/?guid=GUID-9B9AE1FF-48D3-4876-805A-33C623C5E358)) | **HOST FACT (`SOURCE_VERIFIED`):** `INSUNITS = 0` indicates *Unspecified / Unitless* physical units. `MEASUREMENT` controls hatch/linetype scale libraries (0=Imperial, 1=Metric), NOT model physical geometry units. `LUNITS` controls coordinate display format. `INSUNITSDEFSOURCE` and `INSUNITSDEFTARGET` supply fallback insertion scale factors when `INSUNITS=0`, but do NOT prove the engineering meaning of existing model geometry. |
| **SRC-F1-08** | Autodesk Managed Reference: TransactionManager & Atomicity | AutoCAD 2023 Managed .NET API (`AcDbMgd.dll`) | `Autodesk.AutoCAD.DatabaseServices.TransactionManager` ([Autodesk Managed Ref](https://help.autodesk.com/view/OARX/2023/ENU/?guid=OARX-ManagedRefDevGuide-Autodesk_AutoCAD_DatabaseServices_TransactionManager)) | **HOST FACT (`SOURCE_VERIFIED`):** All persistent database mutations require an active `Transaction`. Calling `tr.Abort()` rolls back all uncommitted changes across all objects enlisted in that transaction. Multiple objects (e.g. block reference + clearance boundary + extension dictionary) can be committed or aborted atomically. |

---

## 2. API & Host Behavior Investigation Details

### API-F1-01: Entity Cloning and Metadata Persistence (`COPY`, `ARRAY`, `MIRROR`)

- **Topic:** What happens to `Handle`, `ObjectId`, `ExtensionDictionary`, and `XRecord` when an entity is cloned via native commands?
- **Host Mechanism:** Native `COPY`, `ARRAY`, and `MIRROR` invoke internal deep-clone routines (`deepCloneObjects`).
- **Documented Semantics (SRC-F1-01, SRC-F1-02, SRC-F1-03):**
  - **AutoCAD Handle:** The cloned entity is assigned a brand new, unique AutoCAD `Handle` by the target `Database`.
  - **ObjectId:** The clone is assigned a new, distinct `ObjectId`.
  - **Extension Dictionary & XRecord:** By default, AutoCAD recursively deep-clones the entity's `ExtensionDictionary` and contained `XRecord` entries. The string and binary values in the `ResultBuffer` chain are copied verbatim without semantic interpretation.
- **Architectural Consequence for F1:**
  - Because `XRecord` data is copied unchanged, the clone contains the identical `TTC_OBJECT_ID` string as the source entity.
  - While AutoCAD sees two distinct database entities with unique `Handle`s, TTC CAD business logic sees two entities claiming the same logical `TTC_OBJECT_ID`.
  - This establishes the root cause of identity duplication under native clone operations.
- **Lineage / Provenance Distinction:**
  - **State A: Clone Provenance Known:** When host command execution, command-ended event, or `IdMapping` from deep-cloning identifies both the source entity and the newly created clone, the source retains its `TTC_OBJECT_ID`, the clone receives a fresh `TTC_OBJECT_ID`, and the operation is recorded in the session audit log.
  - **State B: Duplicate Discovered / Provenance Unknown:** When two entities sharing the same `TTC_OBJECT_ID` are discovered during a later audit (e.g., imported via external DWG, WBLOCK, or clipboard paste where lineage was not captured), TTC CAD **must NOT silently guess the "original"** based on arbitrary criteria (such as earlier Handle or timestamp). It must classify the collision as `COLLISION_UNRESOLVED` and follow controlled reconciliation policy defined in SPEC.
- **Pre-Save Mutation Safety (`Database.BeginSave`):**
  - Mutating database entities or regenerating XRecords inside the `Database.BeginSave` event handler is **unverified** and carries high risk of database corruption or file save locks.
  - **Classification:** `HOST_TEST_REQUIRED`. `BeginSave` must be verified via automated host test before SPEC may rely on it for database writes. Passive duplicate detection/blocking is preferred.
- **Verification Status:**
  - `Handle` uniqueness on clone: `HOST_FACT_SOURCE_VERIFIED` (SRC-F1-02).
  - Extension dictionary duplication: `HOST_FACT_SOURCE_VERIFIED` by documentation (SRC-F1-03); runtime behavior across varied entity types is `HOST_TEST_REQUIRED` for BUILD verification.

---

### API-F1-02: Drawing Unit Variable Semantics (`INSUNITS`, `MEASUREMENT`, `LUNITS`)

- **Topic:** Host drawing-level unit flags, fallback variables, and their interplay with physical engineering units.
- **Host Mechanism:** System variables `INSUNITS`, `MEASUREMENT`, `LUNITS`, `INSUNITSDEFSOURCE`, `INSUNITSDEFTARGET`.
- **Documented Semantics (SRC-F1-07):**
  - `INSUNITS`: Specifies drawing units for block insertion scaling (`0` = Unspecified / Unitless, `1` = Inches, `4` = Millimeters, `5` = Centimeters, `6` = Meters).
  - `MEASUREMENT`: Controls hatch pattern and linetype scale libraries (`0` = Imperial `acad.pat`/`acad.lin`, `1` = Metric `acadiso.pat`/`acadiso.lin`). **It does NOT specify or prove that 1 model drawing unit equals 1 millimeter.**
  - `LUNITS`: Controls display formatting of linear coordinates (e.g. 1=Scientific, 2=Decimal, 3=Engineering, 4=Architectural). It has no bearing on physical model dimensioning.
  - `INSUNITSDEFSOURCE` / `INSUNITSDEFTARGET`: Define fallback insertion scale units when `INSUNITS = 0`, but they affect only insertion scaling and are NOT proof of the physical engineering scale of existing drawn geometry.
- **Architectural Consequence for F1:**
  - For drawings where `INSUNITS = 0` (Unitless), the physical unit is formally **UNRESOLVED** (`PhysicalUnitResolution = UNRESOLVED`).
  - TTC CAD **must NOT silently assume 1 drawing unit = 1 millimeter** based solely on `MEASUREMENT = 1`.
  - Resolution must follow explicit precedence:
    1. Explicit project/workspace configuration;
    2. Explicit non-zero `INSUNITS` (e.g. `INSUNITS = 4` candidate);
    3. User confirmation or template-declared profile.
- **Verification Status:** `HOST_FACT_SOURCE_VERIFIED`.

---

### API-F1-03: Metadata Storage Mechanics: Extension Dictionary vs XData

- **Topic:** Storage capacity, query performance, and vanilla DWG compatibility of `XRecord` vs `XData`.
- **Documented Semantics (SRC-F1-03, SRC-F1-04):**
  - **Extended Data (`DBObject.XData`):**
    - Attached directly to `DBObject`.
    - Requires registered application name (`RegAppTableRecord`).
    - Maximum buffer size: **approximately 16 KB (16,383 bytes) total per entity/object across all registered applications combined**.
    - Highly efficient for selection filtering (`SelectionFilter` with DxfCode `ExtendedDataRegAppName`).
    - Autodesk guidelines explicitly recommend keeping XData lightweight.
  - **Extension Dictionary (`DBObject.ExtensionDictionary`) & `XRecord`:**
    - An `AcDbDictionary` owned by the entity.
    - Can contain multiple named `XRecord`s or nested `DBDictionary` instances.
    - Storage capacity bounded by database object size limits / available RAM (hundreds of KB to megabytes), far exceeding XData.
    - Preserves data across vanilla AutoCAD operations; does NOT trigger proxy warnings.
- **Proposed Canonical Storage Strategy:**
  - **Primary Authoritative Source of Truth:** `ExtensionDictionary / XRecord` (`TTC_METADATA_HEADER`, `TTC_COMPONENT_DATA`).
  - **Secondary Query Index / Cache:** Registered `XData` (RegApp `"TTC_CAD"`) storing lightweight query tags (`TTC_OBJECT_TYPE`, `TTC_OBJECT_ID`) for fast `Editor.SelectAll()` filtering.
  - **Authoritative Rule:** If a discrepancy exists between XData and XRecord, the `ExtensionDictionary / XRecord` is authoritative; XData is treated as a derivative index and resynchronized.
- **Verification Status:** `HOST_FACT_SOURCE_VERIFIED`.

---

### API-F1-04: Database Event Reactors vs Command-Boundary Audit

- **Topic:** Safety and re-entrancy risks of listening to `Database.ObjectModified` / `Database.ObjectErased`.
- **Documented Host Facts (SRC-F1-05):**
  - Database reactors fire synchronously during database operations.
  - Autodesk ObjectARX / Managed developer guidelines explicitly warn against:
    1. Modifying the notifying object from within the callback;
    2. Invoking operations that recursively trigger the same notification event;
    3. Initiating interactive operations or displaying modal UI from within notification handlers.
  - While the host API does not universally prohibit every form of transaction under all circumstances, attempting to open modified objects for write or start competing transactions commonly produces `eTransactionInProgress` or unstable host states.
- **TTC Architectural Policy (`PROJECT_POLICY`):**
  - TTC CAD establishes a strict stability policy: **Database reactors must NEVER initiate write transactions or mutate database entities.**
  - Reactors may only set in-memory dirty flags or invalidate ephemeral caches.
  - Deep validation, identity auditing, and duplicate reconciliation execute strictly at **command boundaries** (`CommandEnded`) or during explicit QA audit commands.
- **Verification Status:**
  - Host notification guidelines: `HOST_FACT_SOURCE_VERIFIED`.
  - Read-only reactor rule: `PROJECT_POLICY`.

---

### API-F1-05: Document Locking and Context Isolation

- **Topic:** When is `DocumentLock` required vs redundant?
- **Documented Semantics (SRC-F1-06, SRC-F1-08):**
  - **Modal Document Command:** Invoked via `[CommandMethod("CMD")]` without `CommandFlags.Session`. AutoCAD automatically establishes document context and holds the lock. Explicit locking is not required.
  - **Modeless Palette UI:** When the user interacts with a WPF `PaletteSet`, execution occurs on the Windows UI thread outside the document command loop. Writing to the database without `doc.LockDocument()` throws `Autodesk.AutoCAD.Runtime.Exception: eLockViolation`.
  - **Session Command:** Invoked with `CommandFlags.Session`. Runs in application context; accessing `MdiActiveDocument.Database` requires explicit `doc.LockDocument()`.
  - **Background Task / Timer:** Async execution outside the AutoCAD message loop requires explicit `doc.LockDocument()`.
- **Verification Status:** `HOST_FACT_SOURCE_VERIFIED`.

---

### API-F1-06: WBLOCK, INSERT, and Clipboard Cloning (`COPYCLIP` / `PASTECLIP`)

- **Topic:** Inter-drawing copy-paste and block export behavior.
- **Documented Semantics (SRC-F1-01, SRC-F1-03):**
  - `WBLOCK` exports selected entities into a newly generated DWG database. Extension dictionaries attached to entities are cloned into the new file.
  - `COPYCLIP` creates a temporary DWG file in the user's temp directory containing cloned entities.
  - `PASTECLIP` deep-clones entities from the clipboard DWG into the active drawing database, assigning new Handles.
  - Entities pasted from an external drawing carry their existing `XRecord` metadata, introducing potential `TTC_OBJECT_ID` collisions with entities already in the target drawing.
- **Lineage Constraint:** In `PASTECLIP` or `INSERT`, the source drawing entity may no longer be accessible in the current session; lineage is unknown.
- **Verification Status:** `HOST_TEST_REQUIRED` (Automated verification suite required during BUILD stage).

---

## 3. Host Verification Classification Summary

| Investigation Area | Classification | Notes / Action for Later Stages |
|---|:---:|---|
| Handle immutability and DWG persistence | `HOST_FACT_SOURCE_VERIFIED` | Documented 64-bit integer, unique per DWG database. |
| Clone receives new Handle | `HOST_FACT_SOURCE_VERIFIED` | Cloned objects are distinct database entities with new Handles. |
| Clone duplicates XRecord contents | `HOST_FACT_SOURCE_VERIFIED` / `HOST_TEST_REQUIRED` | Documented standard deepClone behavior; test suite required in BUILD. |
| XData 16 KB total limit & RegApp requirement | `HOST_FACT_SOURCE_VERIFIED` | Shared across all applications per entity. |
| DocumentLock in modeless context | `HOST_FACT_SOURCE_VERIFIED` | Necessary to prevent `eLockViolation`. |
| Reactor re-entrancy guidelines | `HOST_FACT_SOURCE_VERIFIED` | Documented Autodesk notification restrictions. |
| TTC read-only reactor policy | `PROJECT_POLICY` | Architectural requirement for host stability. |
| Pre-save mutation safety (`BeginSave`) | `HOST_TEST_REQUIRED` | Unverified; must be tested before SPEC can rely on pre-save writes. |
| WBLOCK / Clipboard deep-clone | `HOST_TEST_REQUIRED` | Requires automated test in BUILD with real AutoCAD database. |
| Associative Array internal structure | `HOST_TEST_REQUIRED` | Requires investigation in BUILD to determine block/item indexing. |
