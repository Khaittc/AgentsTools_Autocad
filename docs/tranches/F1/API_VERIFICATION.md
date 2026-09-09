# Tranche F1: Common CAD Contracts — API & Host Verification Record

> **Purpose:** Technical verification evidence for AutoCAD Managed .NET APIs, database object lifecycle events, metadata cloning behaviors, and document transaction mechanics relevant to Tranche F1 Common CAD Contracts.
> **Rule:** Distinguish documented verification (`SOURCE_VERIFIED`), compiled assembly verification (`ASSEMBLY_VERIFIED`), and runtime tests required during BUILD (`HOST_TEST_REQUIRED`). Unverified assumptions must remain marked `UNRESOLVED`. This document is evidence only, not a specification.

---

## 1. Verified Sources Index

| Source ID | Title / Resource | Host / API Target | Reference / URL | Content Verified |
|---|---|---|---|---|
| **SRC-F1-01** | Autodesk Managed Reference: Database.DeepCloneObjects | AutoCAD 2022/2023 Managed API | `Autodesk.AutoCAD.DatabaseServices.Database.DeepCloneObjects` | Confirms `DeepCloneObjects(ObjectIdCollection, ObjectId, IdMapping, bool)` performs deep-copying into target owner; generates `IdMapping` linking source to clone `ObjectId`. |
| **SRC-F1-02** | Autodesk Managed Reference: Handle Struct & ObjectId | AutoCAD 2022/2023 Managed API | `Autodesk.AutoCAD.DatabaseServices.Handle`, `ObjectId` | Confirms `Handle` is a 64-bit integer persistent across save/reopen, unique within a single `Database`. Cloned entities receive new, distinct `Handle`s. `ObjectId` is transient memory-bound locator. |
| **SRC-F1-03** | Autodesk ObjectARX / Managed DevGuide: Extension Dictionaries & XRecords | AutoCAD 2023 DevGuide | `Autodesk.AutoCAD.DatabaseServices.DBDictionary`, `Xrecord` | Confirms `ExtensionDictionary` holds named `XRecord`s; `XRecord.Data` contains `ResultBuffer` typed resbufs; standard cloning duplicates extension dictionary entries unless overridden. |
| **SRC-F1-04** | Autodesk Managed Reference: ResultBuffer & TypedValue | AutoCAD 2023 Managed API | `Autodesk.AutoCAD.DatabaseServices.ResultBuffer`, `DxfCode` | Confirms standard typed storage in `ResultBuffer` via DXF codes (Extended Data / XRecord conventions); supported types: string, int, double, handle. |
| **SRC-F1-05** | Autodesk ObjectARX DevGuide: Deep Clone and WBLOCK Clone | ObjectARX 2023 Developer Guide | `AcDbDatabase::wblockCloneObjects`, `deepCloneObjects` | Confirms native `COPY`, `ARRAY`, `MIRROR` invoke internal deep-clone pipelines; cloned objects receive newly minted handles; sub-objects (including extension dictionaries) are cloned recursively by default. |
| **SRC-F1-06** | Autodesk Managed Reference: Document.LockMode & DocumentLock | AutoCAD 2022/2023 Managed API | `Autodesk.AutoCAD.ApplicationServices.Document.LockDocument` | Confirms `DocumentLock` is required when entering document transactions from modeless contexts (PaletteSet, Windows Message pump, async tasks); NOT required in modal document commands. |
| **SRC-F1-07** | Autodesk Managed DevGuide: Database Events & Reactor Re-Entrancy | AutoCAD 2023 DevGuide | `Database.ObjectModified`, `Database.ObjectErased` | Confirms database reactors fire synchronously; opening objects for write or starting new transactions inside `ObjectModified` risks recursive transaction failure (`eTransactionInProgress`) and host crashes. |
| **SRC-F1-08** | Autodesk Managed Reference: TransactionManager & Transaction | AutoCAD 2022/2023 Managed API | `Autodesk.AutoCAD.DatabaseServices.TransactionManager` | Confirms all entity mutations require managed `Transaction`; `Transaction.Abort()` rolls back all modifications cleanly, restoring database state. |

---

## 2. API & Host Behavior Investigation Details

### API-F1-01: Entity Cloning and Metadata Persistence (`COPY`, `ARRAY`, `MIRROR`)

- **Topic:** What happens to `Handle`, `ObjectId`, `ExtensionDictionary`, and `XRecord` when an entity is cloned via native commands?
- **Host Mechanism:** Native `COPY`, `ARRAY`, and `MIRROR` call internal deep-clone routines.
- **Documented Semantics (SRC-F1-01, SRC-F1-02, SRC-F1-05):**
  - The newly created cloned entity is assigned a brand new, unique AutoCAD `Handle` by the target `Database`.
  - The clone is assigned a new, distinct `ObjectId`.
  - By default, AutoCAD recursively deep-clones the entity's `ExtensionDictionary` and the `XRecord`s contained within it.
  - The contents of `XRecord` (`ResultBuffer` chain) are copied bitwise/string-wise without semantic inspection.
- **Architectural Consequence for F1:**
  - Because `XRecord` data is copied unchanged, the clone contains the exact same `TTC_OBJECT_ID` string as the original entity.
  - While AutoCAD sees two distinct database entities (distinct `Handle`s and `ObjectId`s), TTC CAD business logic sees two entities with identical `TTC_OBJECT_ID`.
  - This confirms the root cause of the identity duplication risk.
- **Verification Status:**
  - `Handle` uniqueness on clone: `SOURCE_VERIFIED` (SRC-F1-02).
  - Extension dictionary duplication: `SOURCE_VERIFIED` by documentation (SRC-F1-05), but runtime behavior across varied entity types is marked `HOST_TEST_REQUIRED` for BUILD verification.

---

### API-F1-02: Drawing Unit Variable Semantics (`INSUNITS`, `MEASUREMENT`, `LUNITS`)

- **Topic:** Drawing-level unit flags and their interplay with block insertion scaling.
- **Host Mechanism:** System variables `INSUNITS`, `MEASUREMENT`, `LUNITS`, `LUPREC`.
- **Documented Semantics:**
  - `INSUNITS`: Specifies drawing units for block insertion scaling (`0` = Unspecified/Unitless, `1` = Inches, `4` = Millimeters, `5` = Centimeters, `6` = Meters).
  - `MEASUREMENT`: Specifies whether current drawing uses Imperial (`0`) or Metric (`1`) hatch and linetype defaults.
  - When `INSUNITS = 0` on either the host drawing or the source block DWG, AutoCAD does not automatically apply unit conversion scaling upon block insertion (`INSERT` or `Database.Insert`).
  - When `INSUNITS = 4` on both host and block, 1 unit = 1 mm with scale factor 1.0.
- **Architectural Consequence for F1:**
  - Per Architecture Roadmap (§42), Panel mechanical drawings assume mm, but M&E drawings have configurable project units.
  - Legacy enterprise drawings frequently have `INSUNITS = 0` while drafting 1 unit = 1 mm.
  - Strict blocking on `INSUNITS != 4` would disrupt legacy workflows; passive scaling risks unintended distortion.
- **Verification Status:** `SOURCE_VERIFIED`. Handling of `INSUNITS = 0` remains an open design topic (`ISSUE-F1-002`).

---

### API-F1-03: Metadata Storage Mechanics: Extension Dictionary vs XData

- **Topic:** Storage capacity, query performance, and vanilla DWG compatibility of `XRecord` vs `XData`.
- **Documented Semantics (SRC-F1-03, SRC-F1-04):**
  - **XData (`DBObject.XData`):**
    - Attached directly to `DBObject`.
    - Requires registered application name (`RegAppTableRecord`).
    - Maximum buffer size: 16,383 bytes per registered application per object.
    - Highly efficient for selection filtering (`SelectionFilter` with DxfCode `ExtendedDataRegAppName`).
  - **Extension Dictionary (`DBObject.ExtensionDictionary`):**
    - An `AcDbDictionary` owned by the entity.
    - Can contain multiple named `XRecord`s or nested `DBDictionary` instances.
    - No 16KB size limit (subject only to available memory / DWG capacity).
    - Preserves data across vanilla AutoCAD operations; does NOT trigger proxy warnings.
- **Architectural Consequence for F1:**
  - Hybrid storage is strongly indicated:
    - Registered `XData` for lightweight type tag (`TTC_OBJECT_TYPE`) to allow instant selection filtering via `ed.SelectAll(filter)`.
    - `ExtensionDictionary` / `XRecord` for structured identity, schema version, catalog references, and component dimensions.
- **Verification Status:** `SOURCE_VERIFIED`.

---

### API-F1-04: Database Event Reactors vs Command-Boundary Audit

- **Topic:** Safety and re-entrancy risks of listening to `Database.ObjectModified` / `Database.ObjectErased`.
- **Documented Semantics (SRC-F1-07):**
  - Database reactors fire synchronously inside the current transaction or database mutation event.
  - Calling `Open(OpenMode.ForWrite)` or starting a nested `Transaction` inside `ObjectModified` often throws `eTransactionInProgress` or causes recursive callback loops.
  - Complex user operations (e.g. `EXPLODE`, `BLOCK`, `UNDO`) fire hundreds of object modification events in rapid succession.
- **Architectural Consequence for F1:**
  - Heavy active reactors must be avoided to guarantee AutoCAD host stability.
  - F1 should adopt a **passive / command-boundary audit** architecture:
    - Validate geometry and metadata at command entry and command exit.
    - Defer deep duplicate detection and audit to explicit QA / check commands (e.g. `TTCPANELCHECK` in P6).
    - If live reactors are ever needed for cache invalidation, they must strictly mark in-memory flags as dirty and NEVER execute database writes inside the reactor callback.
- **Verification Status:** `SOURCE_VERIFIED`.

---

### API-F1-05: Document Locking and Context Isolation

- **Topic:** When is `DocumentLock` required vs prohibited?
- **Documented Semantics (SRC-F1-06, SRC-F1-08):**
  - **Modal Document Command:** When a command is invoked from the command line (`[CommandMethod("CMD")]`) without `CommandFlags.Session`, AutoCAD automatically sets the document context and holds the lock. Calling `doc.LockDocument()` is redundant (though harmless if disposed, but unnecessary overhead).
  - **Modeless Palette UI:** When the user clicks a button on a WPF `PaletteSet`, execution occurs on the Windows GUI thread outside the document command loop. Writing to the database without `doc.LockDocument()` throws `Autodesk.AutoCAD.Runtime.Exception: eLockViolation`.
  - **Session Command:** Invoked with `CommandFlags.Session`, execution runs in the application context. Accessing `MdiActiveDocument.Database` requires explicit `doc.LockDocument()`.
  - **Background Task / Timer:** Async execution outside AutoCAD message loop requires `doc.LockDocument()`.
- **Architectural Consequence for F1:**
  - The transaction helper layer must distinguish modal command contexts from modeless/application contexts and provide scoped locking where required.
- **Verification Status:** `SOURCE_VERIFIED`.

---

### API-F1-06: WBLOCK, INSERT, and Clipboard Cloning (`COPYCLIP` / `PASTECLIP`)

- **Topic:** Inter-drawing copy-paste and block export behavior.
- **Documented Semantics (SRC-F1-01, SRC-F1-05):**
  - `WBLOCK` exports entities into a new, standalone DWG database. Extension dictionaries are copied, but external application dictionary links may be broken if not root-referenced.
  - `COPYCLIP` creates a temporary DWG in `%TEMP%` containing cloned entities. `PASTECLIP` deep-clones them into the active drawing database.
  - Entities pasted from another DWG may collide with existing `TTC_OBJECT_ID`s or contain mismatched schema versions.
- **Verification Status:** `HOST_TEST_REQUIRED` (Specific behavior of custom dictionary structures during clipboard transfer requires verification test suite during BUILD).

---

## 3. Host Verification Classification Summary

| Investigation Area | Classification | Notes / Action for Later Stages |
|---|:---:|---|
| Handle immutability and persistence | `SOURCE_VERIFIED` | Documented 64-bit integer, unique per DWG database. |
| Clone receives new Handle | `SOURCE_VERIFIED` | Cloned objects are distinct database entities with new Handles. |
| Clone duplicates XRecord contents | `SOURCE_VERIFIED` / `HOST_TEST_REQUIRED` | Documented standard behavior; test suite required in BUILD. |
| XData 16KB limit & RegApp requirement | `SOURCE_VERIFIED` | Standard AutoCAD limitation. |
| DocumentLock in modeless context | `SOURCE_VERIFIED` | Necessary to prevent `eLockViolation`. |
| Reactor re-entrancy risks | `SOURCE_VERIFIED` | Informs design rule against in-reactor database writes. |
| WBLOCK / Clipboard deep-clone | `HOST_TEST_REQUIRED` | Requires automated test in BUILD with real AutoCAD database. |
| Associative Array internal structure | `HOST_TEST_REQUIRED` | Requires investigation in BUILD to determine block/item indexing. |
