export type MountingType = 'DIN_RAIL' | 'MOUNTING_PLATE' | 'DOOR' | 'SIDE_PANEL' | 'OTHER';

export type ComponentCategory = 'POWER' | 'CONTROL' | 'DRIVE' | 'IO' | 'STRUCTURE' | 'ACCESSORY';

export interface ClearanceDef {
  top: number;
  bottom: number;
  left: number;
  right: number;
  front: number;
}

export interface PanelComponentDef {
  id: string;
  name: string;
  category: ComponentCategory;
  manufacturer: string;
  model: string;
  description: string;
  width: number;       // in mm
  height: number;      // in mm
  depth: number;       // in mm
  mountingType: MountingType;
  clearance: ClearanceDef;
  color?: string;
  terminalsTop?: number;
  terminalsBottom?: number;
}

export interface CabinetEnclosureDef {
  id: string;
  manufacturer: string;
  series: string;
  model: string;
  width: number;       // mm
  height: number;      // mm
  depth: number;       // mm
  mountingPlate: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    depthOffset: number;
  };
  doorInternalAllowance: number;
}

export type EntityType = 'COMPONENT' | 'DIN_RAIL' | 'WIRING_DUCT' | 'RESERVED_ZONE';

export interface PlacedEntity {
  id: string;
  entityType: EntityType;
  x: number;           // mm from plate bottom-left or top-left (we use plate top-left as origin (0,0))
  y: number;           // mm
  width: number;       // mm
  height: number;      // mm
  depth?: number;      // mm
  rotation?: number;   // degrees (0, 90, 180, 270)
  defId?: string;      // reference to component def or cabinet
  name: string;
  mountingType?: MountingType;
  clearance?: ClearanceDef;
  color?: string;
  // Specific properties
  railType?: string;   // for DIN rail: standard DIN 35
  ductSize?: string;   // e.g. 40x60, 60x80
  associatedRailId?: string; // if snapped on a DIN rail
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export type ActiveTool =
  | 'SELECT'
  | 'PLACE_COMPONENT'
  | 'DRAW_RAIL'
  | 'DRAW_DUCT';

export interface ValidationIssue {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  ruleCode:
    | 'DEVICE_DEVICE_COLLISION'
    | 'OUTSIDE_MOUNTING_PLATE'
    | 'CLEARANCE_OVERLAP'
    | 'CABINET_DEPTH_VIOLATION'
    | string;
  message: string;
  entityIds: string[];
  depthDetails?: {
    requiredDepth: number;
    usableDepth: number;
    bodyDepth: number;
    frontClearance: number;
  };
}

