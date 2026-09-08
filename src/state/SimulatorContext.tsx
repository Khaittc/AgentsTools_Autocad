import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CabinetEnclosureDef,
  PlacedEntity,
  PanelComponentDef,
  ActiveTool,
  ViewportState,
  ValidationIssue
} from '../shared/types/index.ts';
import { CABINET_CATALOG } from '../mock-data/cabinets/catalog.ts';
import { COMPONENT_CATALOG } from '../mock-data/components/catalog.ts';
import {
  SCENARIO_S01_EMPTY,
  SCENARIO_S02_TYPICAL,
  SCENARIO_S03_CLEARANCE,
  SCENARIO_S04_TOO_SMALL,
  SCENARIO_S05_DEPTH
} from '../scenarios/panel/scenarioData.ts';

interface SimulatorSettings {
  showClearances: boolean;
  snapToGrid: boolean;
  snapToRail: boolean;
  gridSize: number; // default 10mm
}

interface SimulatorContextType {
  cabinet: CabinetEnclosureDef;
  setCabinet: (cab: CabinetEnclosureDef) => void;
  entities: PlacedEntity[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  activeTool: ActiveTool;
  componentToPlace: PanelComponentDef | null;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  settings: SimulatorSettings;
  setSettings: React.Dispatch<React.SetStateAction<SimulatorSettings>>;
  cmdHistory: string[];
  cmdPrompt: string;
  violations: ValidationIssue[];
  isPaletteOpen: boolean;
  isCabinetModalOpen: boolean;
  cursorMm: { x: number; y: number };
  setCursorMm: (pos: { x: number; y: number }) => void;

  // Actions
  addEntity: (entity: PlacedEntity) => void;
  updateEntity: (id: string, updates: Partial<PlacedEntity>) => void;
  deleteSelected: () => void;
  startPlaceComponent: (comp: PanelComponentDef) => void;
  startDrawRail: () => void;
  startDrawDuct: (ductSize?: string) => void;
  cancelTool: () => void;
  toggleClearances: () => void;
  toggleSnapGrid: () => void;
  togglePalette: () => void;
  toggleCabinetModal: () => void;
  loadScenario: (scenarioId: 'S01' | 'S02' | 'S03' | 'S04' | 'S05') => void;
  runQACheck: () => void;
  runExplicitQACheck: () => void;
  executeCommand: (cmdString: string) => void;
  alignSelected: (type: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'SPACE_H' | 'SPACE_V') => void;
  resetView: () => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cabinet, setCabinet] = useState<CabinetEnclosureDef>(CABINET_CATALOG[1]); // Default 800x1000
  const [entities, setEntities] = useState<PlacedEntity[]>(SCENARIO_S02_TYPICAL.entities);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveTool>('SELECT');
  const [componentToPlace, setComponentToPlace] = useState<PanelComponentDef | null>(null);
  const [viewport, setViewport] = useState<ViewportState>({ panX: 80, panY: 60, zoom: 0.65 });
  const [settings, setSettings] = useState<SimulatorSettings>({
    showClearances: true,
    snapToGrid: true,
    snapToRail: true,
    gridSize: 10
  });
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cmdHistory, setCmdHistory] = useState<string[]>([
    'TTC CAD Engineering Tools — Simulator Initialized.',
    'Module: Panel Layout Designer v0.1',
    'Type HELP or click Ribbon buttons for actions.'
  ]);
  const [cmdPrompt, setCmdPrompt] = useState<string>('Command:');
  const [violations, setViolations] = useState<ValidationIssue[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(true);
  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState<boolean>(false);

  const logCmd = useCallback((msg: string) => {
    setCmdHistory(prev => [...prev.slice(-30), msg]);
  }, []);

  const addEntity = useCallback((entity: PlacedEntity) => {
    setEntities(prev => [...prev, entity]);
    logCmd(`Added ${entity.name} at (${Math.round(entity.x)}, ${Math.round(entity.y)})`);
  }, [logCmd]);

  const updateEntity = useCallback((id: string, updates: Partial<PlacedEntity>) => {
    setEntities(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    setEntities(prev => prev.filter(e => !selectedIds.includes(e.id)));
    logCmd(`Deleted ${selectedIds.length} object(s).`);
    setSelectedIds([]);
  }, [selectedIds, logCmd]);

  const startPlaceComponent = useCallback((comp: PanelComponentDef) => {
    setActiveTool('PLACE_COMPONENT');
    setComponentToPlace(comp);
    setCmdPrompt(`_TTCPANELPLACE: Click on mounting plate to insert ${comp.name} [Esc to cancel]:`);
    logCmd(`Command: TTCPANELPLACE ${comp.model}`);
  }, [logCmd]);

  const startDrawRail = useCallback(() => {
    setActiveTool('DRAW_RAIL');
    setComponentToPlace(null);
    setCmdPrompt('_TTCRAIL: Click start point to draw DIN Rail [Esc to cancel]:');
    logCmd('Command: TTCRAIL');
  }, [logCmd]);

  const startDrawDuct = useCallback((ductSize = '60x80') => {
    setActiveTool('DRAW_DUCT');
    setComponentToPlace(null);
    setCmdPrompt(`_TTCDUCT (${ductSize}): Click start point to draw wiring duct [Esc to cancel]:`);
    logCmd(`Command: TTCDUCT ${ductSize}`);
  }, [logCmd]);

  const cancelTool = useCallback(() => {
    setActiveTool('SELECT');
    setComponentToPlace(null);
    setSelectedIds([]);
    setCmdPrompt('Command:');
    logCmd('*Cancel*');
  }, [logCmd]);

  const toggleClearances = useCallback(() => {
    setSettings(s => {
      const next = !s.showClearances;
      logCmd(`Clearance envelopes: ${next ? 'ON' : 'OFF'}`);
      return { ...s, showClearances: next };
    });
  }, [logCmd]);

  const toggleSnapGrid = useCallback(() => {
    setSettings(s => {
      const next = !s.snapToGrid;
      logCmd(`Snap to Grid: ${next ? 'ON' : 'OFF'}`);
      return { ...s, snapToGrid: next };
    });
  }, [logCmd]);

  const togglePalette = useCallback(() => {
    setIsPaletteOpen(prev => !prev);
  }, []);

  const toggleCabinetModal = useCallback(() => {
    setIsCabinetModalOpen(prev => !prev);
  }, []);

  const resetView = useCallback(() => {
    setViewport({ panX: 80, panY: 60, zoom: 0.65 });
    logCmd('View centered to mounting plate.');
  }, [logCmd]);

  const loadScenario = useCallback((scenarioId: 'S01' | 'S02' | 'S03' | 'S04' | 'S05') => {
    setSelectedIds([]);
    cancelTool();

    switch (scenarioId) {
      case 'S01':
        setCabinet(SCENARIO_S01_EMPTY.cabinet);
        setEntities(SCENARIO_S01_EMPTY.entities);
        logCmd('Loaded Scenario S01: Empty Panel (800x1000mm)');
        break;
      case 'S02':
        setCabinet(SCENARIO_S02_TYPICAL.cabinet);
        setEntities(SCENARIO_S02_TYPICAL.entities);
        logCmd('Loaded Scenario S02: Typical Control Panel (Standard Layout)');
        break;
      case 'S03':
        setCabinet(SCENARIO_S03_CLEARANCE.cabinet);
        setEntities(SCENARIO_S03_CLEARANCE.entities);
        logCmd('Loaded Scenario S03: Clearance Violations (Thermal & lateral conflicts)');
        break;
      case 'S04':
        setCabinet(SCENARIO_S04_TOO_SMALL.cabinet);
        setEntities(SCENARIO_S04_TOO_SMALL.entities);
        logCmd('Loaded Scenario S04: Cabinet Too Small (600x800mm boundary overflow)');
        break;
      case 'S05':
        setCabinet(SCENARIO_S05_DEPTH.cabinet);
        setEntities(SCENARIO_S05_DEPTH.entities);
        logCmd('Loaded Scenario S05: Depth Violation (Chassis exceeds usable enclosure depth)');
        break;
    }
  }, [cancelTool, logCmd]);

  // Compute validation issues across all rules
  const computeIssues = useCallback((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const plateW = cabinet.mountingPlate.width;
    const plateH = cabinet.mountingPlate.height;
    const usableDepth = cabinet.depth - cabinet.mountingPlate.depthOffset - cabinet.doorInternalAllowance;

    // 1. Check Outside Plate Boundary
    entities.forEach(ent => {
      if (ent.x < 0 || ent.y < 0 || ent.x + ent.width > plateW || ent.y + ent.height > plateH) {
        issues.push({
          id: `outside-${ent.id}`,
          severity: 'ERROR',
          ruleCode: 'OUTSIDE_MOUNTING_PLATE',
          message: `${ent.name} exceeds mounting plate boundary (${plateW}x${plateH}mm)!`,
          entityIds: [ent.id]
        });
      }
    });

    const components = entities.filter(e => e.entityType === 'COMPONENT');
    const ducts = entities.filter(e => e.entityType === 'WIRING_DUCT');

    // 2. Check Device-Device Physical Collision
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const a = components[i];
        const b = components[j];
        const overlap =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;

        if (overlap) {
          issues.push({
            id: `collision-${a.id}-${b.id}`,
            severity: 'ERROR',
            ruleCode: 'DEVICE_DEVICE_COLLISION',
            message: `Physical collision between ${a.name} and ${b.name}`,
            entityIds: [a.id, b.id]
          });
        }
      }
    }

    // 3. Check Clearance Overlaps (Thermal / Spacing)
    for (let i = 0; i < components.length; i++) {
      const a = components[i];
      if (!a.clearance) continue;

      const cLeft = a.x - a.clearance.left;
      const cRight = a.x + a.width + a.clearance.right;
      const cTop = a.y - a.clearance.top;
      const cBottom = a.y + a.height + a.clearance.bottom;

      // Clearance vs other components
      for (let j = 0; j < components.length; j++) {
        if (i === j) continue;
        const b = components[j];

        // If a and b are already colliding body-to-body, collision rule takes priority
        const bodyCollision =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;

        if (!bodyCollision) {
          const bInClearance =
            b.x < cRight &&
            b.x + b.width > cLeft &&
            b.y < cBottom &&
            b.y + b.height > cTop;

          if (bInClearance && i < j) {
            issues.push({
              id: `clearance-${a.id}-${b.id}`,
              severity: 'WARNING',
              ruleCode: 'CLEARANCE_OVERLAP',
              message: `Clearance overlap between ${a.name} and ${b.name}`,
              entityIds: [a.id, b.id]
            });
          }
        }
      }

      // Clearance vs Wiring Ducts
      for (const duct of ducts) {
        const bodyInDuct =
          a.x < duct.x + duct.width &&
          a.x + a.width > duct.x &&
          a.y < duct.y + duct.height &&
          a.y + a.height > duct.y;

        if (!bodyInDuct) {
          const ductInClearance =
            duct.x < cRight &&
            duct.x + duct.width > cLeft &&
            duct.y < cBottom &&
            duct.y + duct.height > cTop;

          if (ductInClearance) {
            issues.push({
              id: `clearance-duct-${a.id}-${duct.id}`,
              severity: 'WARNING',
              ruleCode: 'CLEARANCE_OVERLAP',
              message: `${a.name} clearance envelope penetrates into ${duct.name}`,
              entityIds: [a.id, duct.id]
            });
          }
        }
      }
    }

    // 4. Check Cabinet Depth Violation
    components.forEach(comp => {
      const bodyDepth = comp.depth || 0;
      const frontClearance = comp.clearance?.front || 0;
      const reqDepth = bodyDepth + frontClearance;

      if (reqDepth > usableDepth) {
        issues.push({
          id: `depth-${comp.id}`,
          severity: 'ERROR',
          ruleCode: 'CABINET_DEPTH_VIOLATION',
          message: `${comp.name} requires ${reqDepth}mm depth (${bodyDepth}mm body + ${frontClearance}mm clearance), exceeding usable cabinet depth (${usableDepth}mm) by ${reqDepth - usableDepth}mm!`,
          entityIds: [comp.id],
          depthDetails: {
            requiredDepth: reqDepth,
            usableDepth,
            bodyDepth,
            frontClearance
          }
        });
      }
    });

    return issues;
  }, [cabinet, entities]);

  // Live Diagnostics: Automatically update violations in the background
  useEffect(() => {
    const issues = computeIssues();
    setViolations(issues);
  }, [computeIssues]);

  // Explicit QA Check Command: Triggered manually to print formal diagnostic report
  const runExplicitQACheck = useCallback(() => {
    const issues = computeIssues();
    setViolations(issues);

    const usableDepth = cabinet.depth - cabinet.mountingPlate.depthOffset - cabinet.doorInternalAllowance;
    logCmd('───────────────────────────────────────────────────────');
    logCmd(`[QA REPORT] TTCPANELCHECK — Cabinet: ${cabinet.series} (${cabinet.width}x${cabinet.height}x${cabinet.depth}mm)`);
    logCmd(`Mounting Plate: ${cabinet.mountingPlate.width}x${cabinet.mountingPlate.height}mm | Usable Depth: ${usableDepth}mm`);
    logCmd(`Total Issues Found: ${issues.length}`);

    if (issues.length === 0) {
      logCmd('✔ PASS: All equipment within plate limits, clearances, and depth allowances.');
    } else {
      issues.forEach((iss, idx) => {
        logCmd(` [${idx + 1}] [${iss.ruleCode}] ${iss.message}`);
      });
      logCmd(`✖ FAILED: Resolve the ${issues.length} issue(s) highlighted above.`);
    }
    logCmd('───────────────────────────────────────────────────────');
  }, [computeIssues, cabinet, logCmd]);

  // Alignment Tools
  const alignSelected = useCallback((type: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'SPACE_H' | 'SPACE_V') => {
    if (selectedIds.length < 2) {
      logCmd('Please select at least 2 objects to align.');
      return;
    }

    const selectedEntities = entities.filter(e => selectedIds.includes(e.id));
    if (selectedEntities.length < 2) return;

    let newEntities = [...entities];

    if (type === 'LEFT') {
      const minX = Math.min(...selectedEntities.map(e => e.x));
      newEntities = newEntities.map(e => (selectedIds.includes(e.id) ? { ...e, x: minX } : e));
      logCmd(`Aligned ${selectedIds.length} object(s) Left.`);
    } else if (type === 'RIGHT') {
      const maxRight = Math.max(...selectedEntities.map(e => e.x + e.width));
      newEntities = newEntities.map(e => (selectedIds.includes(e.id) ? { ...e, x: maxRight - e.width } : e));
      logCmd(`Aligned ${selectedIds.length} object(s) Right.`);
    } else if (type === 'TOP') {
      const minY = Math.min(...selectedEntities.map(e => e.y));
      newEntities = newEntities.map(e => (selectedIds.includes(e.id) ? { ...e, y: minY } : e));
      logCmd(`Aligned ${selectedIds.length} object(s) Top.`);
    } else if (type === 'BOTTOM') {
      const maxBottom = Math.max(...selectedEntities.map(e => e.y + e.height));
      newEntities = newEntities.map(e => (selectedIds.includes(e.id) ? { ...e, y: maxBottom - e.height } : e));
      logCmd(`Aligned ${selectedIds.length} object(s) Bottom.`);
    } else if (type === 'SPACE_H') {
      // Sort by x
      const sorted = [...selectedEntities].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalWidthOfItems = sorted.reduce((sum, item) => sum + item.width, 0);
      const totalSpan = (last.x + last.width) - first.x;
      const gap = (totalSpan - totalWidthOfItems) / (sorted.length - 1);

      let currentX = first.x;
      const xMap = new Map<string, number>();
      sorted.forEach((item) => {
        xMap.set(item.id, currentX);
        currentX += item.width + gap;
      });

      newEntities = newEntities.map(e => (xMap.has(e.id) ? { ...e, x: Math.round(xMap.get(e.id)!) } : e));
      logCmd(`Distributed ${selectedIds.length} object(s) horizontally.`);
    } else if (type === 'SPACE_V') {
      // Sort by y
      const sorted = [...selectedEntities].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalHeightOfItems = sorted.reduce((sum, item) => sum + item.height, 0);
      const totalSpan = (last.y + last.height) - first.y;
      const gap = (totalSpan - totalHeightOfItems) / (sorted.length - 1);

      let currentY = first.y;
      const yMap = new Map<string, number>();
      sorted.forEach((item) => {
        yMap.set(item.id, currentY);
        currentY += item.height + gap;
      });

      newEntities = newEntities.map(e => (yMap.has(e.id) ? { ...e, y: Math.round(yMap.get(e.id)!) } : e));
      logCmd(`Distributed ${selectedIds.length} object(s) vertically.`);
    }

    setEntities(newEntities);
  }, [entities, selectedIds, logCmd]);

  // Command Line Interpreter
  const executeCommand = useCallback((cmdRaw: string) => {
    const cmd = cmdRaw.trim().toUpperCase();
    if (!cmd) return;

    logCmd(`Command: ${cmd}`);

    switch (cmd) {
      case 'HELP':
        logCmd('Available commands:');
        logCmd('  TTCPANEL       - Toggle Component Palette');
        logCmd('  TTCPANELPLACE  - Insert selected component');
        logCmd('  TTCRAIL        - Draw DIN rail');
        logCmd('  TTCDUCT        - Draw wiring duct');
        logCmd('  TTCPANELCHECK  - Run full QA check and print report');
        logCmd('  TTCCABINET     - Change cabinet size');
        logCmd('  S01            - Load Scenario S01 (Empty Panel)');
        logCmd('  S02            - Load Scenario S02 (Typical Control Panel)');
        logCmd('  S03            - Load Scenario S03 (Clearance Violations)');
        logCmd('  S04            - Load Scenario S04 (Cabinet Too Small)');
        logCmd('  S05            - Load Scenario S05 (Depth Violation)');
        logCmd('  CLEAR          - Clear drawing');
        logCmd('  FIT            - Center view');
        break;

      case 'TTCPANEL':
        setIsPaletteOpen(prev => !prev);
        logCmd(`Component Palette: ${!isPaletteOpen ? 'Opened' : 'Closed'}`);
        break;

      case 'TTCPANELPLACE':
        if (COMPONENT_CATALOG.length > 0) {
          startPlaceComponent(COMPONENT_CATALOG[0]);
        }
        break;

      case 'TTCRAIL':
        startDrawRail();
        break;

      case 'TTCDUCT':
        startDrawDuct('60x80');
        break;

      case 'TTCPANELCHECK':
        runExplicitQACheck();
        break;

      case 'TTCCABINET':
        setIsCabinetModalOpen(true);
        break;

      case 'S01':
        loadScenario('S01');
        break;

      case 'S02':
        loadScenario('S02');
        break;

      case 'S03':
        loadScenario('S03');
        break;

      case 'S04':
        loadScenario('S04');
        break;

      case 'S05':
        loadScenario('S05');
        break;

      case 'CLEAR':
        setEntities([]);
        setSelectedIds([]);
        logCmd('Cleared all entities from mounting plate.');
        break;

      case 'FIT':
      case 'ZOOM EXTENTS':
      case 'ZE':
        resetView();
        break;

      default:
        logCmd(`Unknown command "${cmd}". Type HELP for command list.`);
        break;
    }
  }, [
    isPaletteOpen,
    logCmd,
    startPlaceComponent,
    startDrawRail,
    startDrawDuct,
    runExplicitQACheck,
    loadScenario,
    resetView
  ]);

  const value = useMemo(() => ({
    cabinet,
    setCabinet,
    entities,
    selectedIds,
    setSelectedIds,
    activeTool,
    componentToPlace,
    viewport,
    setViewport,
    settings,
    setSettings,
    cmdHistory,
    cmdPrompt,
    violations,
    isPaletteOpen,
    isCabinetModalOpen,
    cursorMm,
    setCursorMm,
    addEntity,
    updateEntity,
    deleteSelected,
    startPlaceComponent,
    startDrawRail,
    startDrawDuct,
    cancelTool,
    toggleClearances,
    toggleSnapGrid,
    togglePalette,
    toggleCabinetModal,
    loadScenario,
    runQACheck: runExplicitQACheck,
    runExplicitQACheck,
    executeCommand,
    alignSelected,
    resetView
  }), [
    cabinet,
    entities,
    selectedIds,
    activeTool,
    componentToPlace,
    viewport,
    settings,
    cmdHistory,
    cmdPrompt,
    violations,
    isPaletteOpen,
    isCabinetModalOpen,
    cursorMm,
    addEntity,
    updateEntity,
    deleteSelected,
    startPlaceComponent,
    startDrawRail,
    startDrawDuct,
    cancelTool,
    toggleClearances,
    toggleSnapGrid,
    togglePalette,
    toggleCabinetModal,
    loadScenario,
    runExplicitQACheck,
    executeCommand,
    alignSelected,
    resetView
  ]);

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
