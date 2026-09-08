import { PlacedEntity, CabinetEnclosureDef } from '../../shared/types/index.ts';
import { CABINET_CATALOG } from '../../mock-data/cabinets/catalog.ts';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  cabinet: CabinetEnclosureDef;
  entities: PlacedEntity[];
}

export const SCENARIO_S01_EMPTY: ScenarioDefinition = {
  id: 'S01',
  name: 'S01 — Empty Panel (800x1000mm)',
  description: 'Clean mounting plate ready for drafting rails, ducts, and inserting components.',
  cabinet: CABINET_CATALOG[1], // 800x1000x300
  entities: []
};

export const SCENARIO_S02_TYPICAL: ScenarioDefinition = {
  id: 'S02',
  name: 'S02 — Typical Control Panel',
  description: 'Standard layout with MCCB, VFDs, PLC, Power Supply, Contactors, DIN Rails & Ducts.',
  cabinet: CABINET_CATALOG[1], // 800x1000x300 (Plate: 740x940mm)
  entities: [
    // Wiring Ducts (perimeter & dividers)
    // Left vertical duct
    {
      id: 'duct-left',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (L)',
      x: 30,
      y: 30,
      width: 60,
      height: 880,
      ductSize: '60x80',
      color: '#495057'
    },
    // Right vertical duct
    {
      id: 'duct-right',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (R)',
      x: 650,
      y: 30,
      width: 60,
      height: 880,
      ductSize: '60x80',
      color: '#495057'
    },
    // Top horizontal duct
    {
      id: 'duct-top',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (Top)',
      x: 90,
      y: 30,
      width: 560,
      height: 60,
      ductSize: '60x80',
      color: '#495057'
    },
    // Intermediate horizontal duct 1
    {
      id: 'duct-mid-1',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 40x60 (Mid 1)',
      x: 90,
      y: 280,
      width: 560,
      height: 40,
      ductSize: '40x60',
      color: '#495057'
    },
    // Intermediate horizontal duct 2
    {
      id: 'duct-mid-2',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 40x60 (Mid 2)',
      x: 90,
      y: 560,
      width: 560,
      height: 40,
      ductSize: '40x60',
      color: '#495057'
    },
    // Bottom horizontal duct
    {
      id: 'duct-bot',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (Bot)',
      x: 90,
      y: 850,
      width: 560,
      height: 60,
      ductSize: '60x80',
      color: '#495057'
    },

    // DIN Rails
    // Rail 1 (Top power components)
    {
      id: 'rail-1',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 1',
      x: 230,
      y: 160,
      width: 420,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    // Rail 2 (Middle drives & PLC)
    {
      id: 'rail-2',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 2',
      x: 90,
      y: 410,
      width: 560,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    // Rail 3 (Bottom control & terminals)
    {
      id: 'rail-3',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 3',
      x: 90,
      y: 690,
      width: 560,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },

    // Components:
    // Main MCCB (Plate mounted at top-left)
    {
      id: 'comp-1',
      entityType: 'COMPONENT',
      name: 'MCCB 3P 100A',
      defId: 'comp-mccb-nsx100',
      x: 105,
      y: 105,
      width: 105,
      height: 161,
      depth: 86,
      mountingType: 'MOUNTING_PLATE',
      clearance: { top: 60, bottom: 60, left: 25, right: 25, front: 50 },
      color: '#343a40'
    },
    // Power Supply 24V (Rail 1)
    {
      id: 'comp-2',
      entityType: 'COMPONENT',
      name: 'Power Supply 24VDC',
      defId: 'comp-psu-24v-5a',
      x: 250,
      y: 115,
      width: 40,
      height: 125,
      depth: 113,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-1',
      clearance: { top: 40, bottom: 20, left: 10, right: 10, front: 30 },
      color: '#e67700'
    },
    // MCB 3P (Rail 1)
    {
      id: 'comp-3',
      entityType: 'COMPONENT',
      name: 'MCB 3P 32A',
      defId: 'comp-mcb-3p-32a',
      x: 320,
      y: 135,
      width: 54,
      height: 85,
      depth: 78,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-1',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 20 },
      color: '#495057'
    },
    // MCB 1P (Rail 1)
    {
      id: 'comp-4',
      entityType: 'COMPONENT',
      name: 'MCB 1P 10A',
      defId: 'comp-mcb-1p-10a',
      x: 385,
      y: 135,
      width: 18,
      height: 85,
      depth: 78,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-1',
      clearance: { top: 25, bottom: 25, left: 2, right: 2, front: 20 },
      color: '#495057'
    },

    // Rail 2: PLC and 2x VFD
    // PLC Controller
    {
      id: 'comp-5',
      entityType: 'COMPONENT',
      name: 'PLC Controller 24 I/O',
      defId: 'comp-plc-tm221',
      x: 110,
      y: 382,
      width: 110,
      height: 90,
      depth: 70,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-2',
      clearance: { top: 40, bottom: 40, left: 20, right: 20, front: 30 },
      color: '#2b8a3e'
    },
    // VFD 1
    {
      id: 'comp-6',
      entityType: 'COMPONENT',
      name: 'VFD 0.75kW (Drive 1)',
      defId: 'comp-vfd-atv320-075',
      x: 260,
      y: 356,
      width: 72,
      height: 143,
      depth: 138,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-2',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 40 },
      color: '#1c7ed6'
    },
    // VFD 2
    {
      id: 'comp-7',
      entityType: 'COMPONENT',
      name: 'VFD 0.75kW (Drive 2)',
      defId: 'comp-vfd-atv320-075',
      x: 370,
      y: 356,
      width: 72,
      height: 143,
      depth: 138,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-2',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 40 },
      color: '#1c7ed6'
    },

    // Rail 3: Contactors, Relays, Terminals
    // Contactor 1
    {
      id: 'comp-8',
      entityType: 'COMPONENT',
      name: 'Contactor 9A (KM1)',
      defId: 'comp-contactor-lc1d09',
      x: 120,
      y: 669,
      width: 45,
      height: 77,
      depth: 86,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-3',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 25 },
      color: '#5c7cfa'
    },
    // Contactor 2
    {
      id: 'comp-9',
      entityType: 'COMPONENT',
      name: 'Contactor 9A (KM2)',
      defId: 'comp-contactor-lc1d09',
      x: 180,
      y: 669,
      width: 45,
      height: 77,
      depth: 86,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-3',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 25 },
      color: '#5c7cfa'
    },
    // Relay module
    {
      id: 'comp-10',
      entityType: 'COMPONENT',
      name: 'Slim Relay Module',
      defId: 'comp-relay-module-4p',
      x: 250,
      y: 662,
      width: 25,
      height: 90,
      depth: 75,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-3',
      clearance: { top: 20, bottom: 20, left: 5, right: 5, front: 15 },
      color: '#0ca678'
    },
    // Terminal Blocks
    {
      id: 'comp-11',
      entityType: 'COMPONENT',
      name: 'Power Terminals',
      defId: 'comp-terminals-group',
      x: 350,
      y: 684,
      width: 52,
      height: 47,
      depth: 47,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-3',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 10 },
      color: '#868e96'
    },
    {
      id: 'comp-12',
      entityType: 'COMPONENT',
      name: 'Control Terminals',
      defId: 'comp-terminals-group',
      x: 420,
      y: 684,
      width: 52,
      height: 47,
      depth: 47,
      mountingType: 'DIN_RAIL',
      associatedRailId: 'rail-3',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 10 },
      color: '#868e96'
    }
  ]
};

export const SCENARIO_S03_CLEARANCE: ScenarioDefinition = {
  id: 'S03',
  name: 'S03 — Clearance Violations',
  description: 'Panel with intentional thermal and lateral clearance conflicts between VFDs, PLC, and wiring ducts.',
  cabinet: CABINET_CATALOG[1], // 800x1000x300 (Plate: 740x940mm)
  entities: [
    {
      id: 's3-duct-top',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (Top)',
      x: 30,
      y: 30,
      width: 680,
      height: 60,
      ductSize: '60x80',
      color: '#495057'
    },
    {
      id: 's3-duct-left',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (Left)',
      x: 30,
      y: 90,
      width: 60,
      height: 820,
      ductSize: '60x80',
      color: '#495057'
    },
    {
      id: 's3-duct-right',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80 (Right)',
      x: 650,
      y: 90,
      width: 60,
      height: 820,
      ductSize: '60x80',
      color: '#495057'
    },
    {
      id: 's3-duct-mid',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 40x60 (Mid)',
      x: 90,
      y: 490,
      width: 560,
      height: 40,
      ductSize: '40x60',
      color: '#495057'
    },
    {
      id: 's3-rail-1',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 1 (Top)',
      x: 90,
      y: 190,
      width: 560,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    {
      id: 's3-rail-2',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 2 (Mid)',
      x: 90,
      y: 360,
      width: 560,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    // 1. VFD with top clearance (100mm) penetrating into the top wiring duct (y:30-90)
    {
      id: 's3-vfd-1',
      entityType: 'COMPONENT',
      name: 'VFD 0.75kW (Drive 1)',
      defId: 'comp-vfd-atv320-075',
      x: 120,
      y: 110,
      width: 72,
      height: 143,
      depth: 138,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's3-rail-1',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 40 },
      color: '#1c7ed6'
    },
    // 2. VFD 2 placed only 5mm away from VFD 1 (lateral clearance violation: requires 20mm)
    {
      id: 's3-vfd-2',
      entityType: 'COMPONENT',
      name: 'VFD 0.75kW (Drive 2)',
      defId: 'comp-vfd-atv320-075',
      x: 197,
      y: 110,
      width: 72,
      height: 143,
      depth: 138,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's3-rail-1',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 40 },
      color: '#1c7ed6'
    },
    // 3. PLC placed at mid rail
    {
      id: 's3-plc',
      entityType: 'COMPONENT',
      name: 'PLC Controller 24 I/O',
      defId: 'comp-plc-tm221',
      x: 120,
      y: 332,
      width: 110,
      height: 90,
      depth: 70,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's3-rail-2',
      clearance: { top: 40, bottom: 40, left: 20, right: 20, front: 30 },
      color: '#2b8a3e'
    },
    // 4. Power Supply right next to PLC with 5mm gap (lateral clearance violation)
    {
      id: 's3-psu',
      entityType: 'COMPONENT',
      name: 'Power Supply 24VDC 5A',
      defId: 'comp-psu-24v-5a',
      x: 235,
      y: 315,
      width: 40,
      height: 125,
      depth: 113,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's3-rail-2',
      clearance: { top: 40, bottom: 20, left: 10, right: 10, front: 30 },
      color: '#e67700'
    },
    // 5. MCB on Rail 1
    {
      id: 's3-mcb-1',
      entityType: 'COMPONENT',
      name: 'MCB 3P 32A',
      defId: 'comp-mcb-3p-32a',
      x: 350,
      y: 165,
      width: 54,
      height: 85,
      depth: 78,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's3-rail-1',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 20 },
      color: '#495057'
    }
  ]
};

export const SCENARIO_S04_TOO_SMALL: ScenarioDefinition = {
  id: 'S04',
  name: 'S04 — Cabinet Too Small',
  description: 'Full equipment assembly placed inside a 600x800 cabinet, overflowing plate boundaries.',
  cabinet: CABINET_CATALOG[0], // 600x800x250 (Mounting plate: 550x750mm)
  entities: [
    {
      id: 's4-rail-top',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail Top (600mm)',
      x: 20,
      y: 160,
      width: 580,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    {
      id: 's4-rail-mid',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail Mid (600mm)',
      x: 20,
      y: 420,
      width: 580,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    {
      id: 's4-rail-bot',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail Bot (600mm)',
      x: 20,
      y: 680,
      width: 580,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    {
      id: 's4-mccb',
      entityType: 'COMPONENT',
      name: 'MCCB 3P 100A',
      defId: 'comp-mccb-nsx100',
      x: 30,
      y: -20, // Extends above plate (y < 0)
      width: 105,
      height: 161,
      depth: 86,
      mountingType: 'MOUNTING_PLATE',
      clearance: { top: 60, bottom: 60, left: 25, right: 25, front: 50 },
      color: '#343a40'
    },
    {
      id: 's4-vfd-1',
      entityType: 'COMPONENT',
      name: 'VFD 0.75kW (Drive 1)',
      defId: 'comp-vfd-atv320-075',
      x: 180,
      y: 106,
      width: 72,
      height: 143,
      depth: 138,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's4-rail-top',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 40 },
      color: '#1c7ed6'
    },
    {
      id: 's4-vfd-2',
      entityType: 'COMPONENT',
      name: 'VFD 2.2kW (Drive 2)',
      defId: 'comp-vfd-atv320-22',
      x: 290,
      y: 85,
      width: 105,
      height: 184,
      depth: 158,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's4-rail-top',
      clearance: { top: 100, bottom: 100, left: 20, right: 20, front: 50 },
      color: '#1864ab'
    },
    {
      id: 's4-plc',
      entityType: 'COMPONENT',
      name: 'PLC Controller',
      defId: 'comp-plc-tm221',
      x: 430,
      y: 132,
      width: 110,
      height: 90,
      depth: 70,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's4-rail-top',
      clearance: { top: 40, bottom: 40, left: 20, right: 20, front: 30 },
      color: '#2b8a3e'
    },
    // Contactor overflowing right edge (x: 520, width: 45 -> 565mm > 550mm plate width)
    {
      id: 's4-contactor-overflow',
      entityType: 'COMPONENT',
      name: 'Contactor 9A (Overflow)',
      defId: 'comp-contactor-lc1d09',
      x: 520,
      y: 399,
      width: 45,
      height: 77,
      depth: 86,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's4-rail-mid',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 25 },
      color: '#5c7cfa'
    },
    // Terminal blocks overflowing bottom edge (y: 720, height: 47 -> 767mm > 750mm plate height)
    {
      id: 's4-term-overflow',
      entityType: 'COMPONENT',
      name: 'Power Terminals (Bottom Overflow)',
      defId: 'comp-terminals-group',
      x: 100,
      y: 720,
      width: 52,
      height: 47,
      depth: 47,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's4-rail-bot',
      clearance: { top: 30, bottom: 30, left: 5, right: 5, front: 10 },
      color: '#868e96'
    }
  ]
};

export const SCENARIO_S05_DEPTH: ScenarioDefinition = {
  id: 'S05',
  name: 'S05 — Depth Violation',
  description: 'Component chassis and required front clearance exceed usable cabinet enclosure depth.',
  cabinet: CABINET_CATALOG[0], // 600x800x250 (Depth 250, offset 25, door 20 -> Usable Depth = 205mm)
  entities: [
    {
      id: 's5-duct-left',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80',
      x: 30,
      y: 30,
      width: 60,
      height: 690,
      ductSize: '60x80',
      color: '#495057'
    },
    {
      id: 's5-duct-right',
      entityType: 'WIRING_DUCT',
      name: 'Wiring Duct 60x80',
      x: 460,
      y: 30,
      width: 60,
      height: 690,
      ductSize: '60x80',
      color: '#495057'
    },
    {
      id: 's5-rail-1',
      entityType: 'DIN_RAIL',
      name: 'DIN Rail 1',
      x: 90,
      y: 520,
      width: 370,
      height: 35,
      railType: 'DIN 35x7.5',
      color: '#adb5bd'
    },
    {
      id: 's5-plc',
      entityType: 'COMPONENT',
      name: 'PLC Controller 24 I/O',
      defId: 'comp-plc-tm221',
      x: 110,
      y: 492,
      width: 110,
      height: 90,
      depth: 70,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's5-rail-1',
      clearance: { top: 40, bottom: 40, left: 20, right: 20, front: 30 },
      color: '#2b8a3e'
    },
    {
      id: 's5-psu',
      entityType: 'COMPONENT',
      name: 'Power Supply 24VDC',
      defId: 'comp-psu-24v-5a',
      x: 250,
      y: 475,
      width: 40,
      height: 125,
      depth: 113,
      mountingType: 'DIN_RAIL',
      associatedRailId: 's5-rail-1',
      clearance: { top: 40, bottom: 20, left: 10, right: 10, front: 30 },
      color: '#e67700'
    },
    // VIOLATION: Deep Heavy VFD (Body depth: 210mm, Front clearance: 60mm -> Required depth: 270mm vs Usable: 205mm)
    {
      id: 's5-vfd-deep',
      entityType: 'COMPONENT',
      name: 'Heavy VFD 15kW (Deep)',
      defId: 'comp-vfd-15kw',
      x: 170,
      y: 100,
      width: 180,
      height: 330,
      depth: 210,
      mountingType: 'MOUNTING_PLATE',
      clearance: { top: 150, bottom: 150, left: 30, right: 30, front: 60 },
      color: '#092b60'
    }
  ]
};

