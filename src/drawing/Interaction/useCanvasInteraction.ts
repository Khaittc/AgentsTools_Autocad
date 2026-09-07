import { useRef, useState, useCallback, useEffect } from 'react';
import { useSimulator } from '../../state/SimulatorContext.tsx';
import { PlacedEntity, Point2D } from '../../shared/types/index.ts';

export const useCanvasInteraction = () => {
  const {
    cabinet,
    entities,
    selectedIds,
    setSelectedIds,
    activeTool,
    componentToPlace,
    viewport,
    setViewport,
    settings,
    setCursorMm,
    addEntity,
    updateEntity,
    cancelTool
  } = useSimulator();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Point2D>({ x: 0, y: 0 });
  const isDraggingEntityRef = useRef(false);
  const dragEntityStartRef = useRef<{ mouseMm: Point2D; entityOffsets: Map<string, Point2D> } | null>(null);
  const isSpacePressedRef = useRef(false);

  // Track space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // For drawing rail or duct by drag
  const [draftLine, setDraftLine] = useState<{ start: Point2D; current: Point2D } | null>(null);

  // Coordinate Conversion Functions
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point2D => {
      const worldX = (screenX - viewport.panX) / viewport.zoom;
      const worldY = (screenY - viewport.panY) / viewport.zoom;
      return { x: worldX, y: worldY };
    },
    [viewport]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point2D => {
      const screenX = worldX * viewport.zoom + viewport.panX;
      const screenY = worldY * viewport.zoom + viewport.panY;
      return { x: screenX, y: screenY };
    },
    [viewport]
  );

  // Snap to Grid helper
  const snapValue = useCallback(
    (val: number, step: number = settings.gridSize): number => {
      if (!settings.snapToGrid) return Math.round(val);
      return Math.round(val / step) * step;
    },
    [settings.snapToGrid, settings.gridSize]
  );

  // Snap to nearest DIN Rail
  const snapToRailY = useCallback(
    (x: number, y: number, itemHeight: number): { y: number; railId?: string } => {
      if (!settings.snapToRail) return { y };

      const rails = entities.filter(e => e.entityType === 'DIN_RAIL');
      const itemCenterY = y + itemHeight / 2;

      for (const rail of rails) {
        // Check if within rail X bounds
        if (x + 20 >= rail.x && x <= rail.x + rail.width) {
          const railCenterY = rail.y + rail.height / 2;
          // Snap threshold: 40mm
          if (Math.abs(itemCenterY - railCenterY) < 40) {
            return {
              y: Math.round(railCenterY - itemHeight / 2),
              railId: rail.id
            };
          }
        }
      }
      return { y };
    },
    [settings.snapToRail, entities]
  );

  // Find entity at world coordinates (topmost item)
  const hitTest = useCallback(
    (worldX: number, worldY: number): PlacedEntity | null => {
      // Components first, then rails/ducts
      const sorted = [...entities].sort((a, b) => {
        const scoreA = a.entityType === 'COMPONENT' ? 2 : 1;
        const scoreB = b.entityType === 'COMPONENT' ? 2 : 1;
        return scoreB - scoreA;
      });

      for (const ent of sorted) {
        if (
          worldX >= ent.x &&
          worldX <= ent.x + ent.width &&
          worldY >= ent.y &&
          worldY <= ent.y + ent.height
        ) {
          return ent;
        }
      }
      return null;
    },
    [entities]
  );

  // Mouse Wheel (Zoom)
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newZoom = Math.max(0.15, Math.min(3.5, viewport.zoom * zoomFactor));

      // Zoom centered at mouse position
      const newPanX = mouseX - (mouseX - viewport.panX) * (newZoom / viewport.zoom);
      const newPanY = mouseY - (mouseY - viewport.panY) * (newZoom / viewport.zoom);

      setViewport({
        panX: newPanX,
        panY: newPanY,
        zoom: newZoom
      });
    },
    [viewport, setViewport]
  );

  // Mouse Down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = screenToWorld(screenX, screenY);

      // Middle button or Space+Left -> Pan
      if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) {
        isPanningRef.current = true;
        panStartRef.current = { x: screenX - viewport.panX, y: screenY - viewport.panY };
        return;
      }

      if (e.button === 0) {
        // Place component mode
        if (activeTool === 'PLACE_COMPONENT' && componentToPlace) {
          let snappedX = snapValue(world.x - componentToPlace.width / 2);
          let snappedY = snapValue(world.y - componentToPlace.height / 2);

          let associatedRailId: string | undefined = undefined;
          if (componentToPlace.mountingType === 'DIN_RAIL') {
            const snapRail = snapToRailY(snappedX, snappedY, componentToPlace.height);
            snappedY = snapRail.y;
            associatedRailId = snapRail.railId;
          }

          const newComp: PlacedEntity = {
            id: `comp-${Date.now()}`,
            entityType: 'COMPONENT',
            name: componentToPlace.name,
            defId: componentToPlace.id,
            x: snappedX,
            y: snappedY,
            width: componentToPlace.width,
            height: componentToPlace.height,
            depth: componentToPlace.depth,
            mountingType: componentToPlace.mountingType,
            clearance: componentToPlace.clearance,
            color: componentToPlace.color,
            associatedRailId
          };

          addEntity(newComp);
          setSelectedIds([newComp.id]);
          cancelTool();
          return;
        }

        // Draw Rail mode
        if (activeTool === 'DRAW_RAIL') {
          setDraftLine({
            start: { x: snapValue(world.x), y: snapValue(world.y) },
            current: { x: snapValue(world.x), y: snapValue(world.y) }
          });
          return;
        }

        // Draw Duct mode
        if (activeTool === 'DRAW_DUCT') {
          setDraftLine({
            start: { x: snapValue(world.x), y: snapValue(world.y) },
            current: { x: snapValue(world.x), y: snapValue(world.y) }
          });
          return;
        }

        // Select / Drag mode
        const hit = hitTest(world.x, world.y);
        if (hit) {
          let currentSelected = selectedIds;
          if (e.shiftKey) {
            if (currentSelected.includes(hit.id)) {
              currentSelected = currentSelected.filter(id => id !== hit.id);
            } else {
              currentSelected = [...currentSelected, hit.id];
            }
          } else {
            if (!currentSelected.includes(hit.id)) {
              currentSelected = [hit.id];
            }
          }
          setSelectedIds(currentSelected);

          // Prepare dragging
          isDraggingEntityRef.current = true;
          const offsets = new Map<string, Point2D>();
          entities.forEach(ent => {
            if (currentSelected.includes(ent.id)) {
              offsets.set(ent.id, { x: ent.x, y: ent.y });
            }
          });
          dragEntityStartRef.current = {
            mouseMm: { x: world.x, y: world.y },
            entityOffsets: offsets
          };
        } else {
          // Click on empty canvas -> clear selection
          if (!e.shiftKey) {
            setSelectedIds([]);
          }
        }
      }
    },
    [
      viewport,
      activeTool,
      componentToPlace,
      selectedIds,
      entities,
      screenToWorld,
      snapValue,
      snapToRailY,
      hitTest,
      addEntity,
      setSelectedIds,
      cancelTool
    ]
  );

  // Mouse Move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const world = screenToWorld(screenX, screenY);

      setCursorMm({ x: Math.round(world.x), y: Math.round(world.y) });

      // Handle Pan
      if (isPanningRef.current) {
        setViewport(vp => ({
          ...vp,
          panX: screenX - panStartRef.current.x,
          panY: screenY - panStartRef.current.y
        }));
        return;
      }

      // Handle Draft Line (Drawing Rail or Duct)
      if (draftLine) {
        setDraftLine(prev => (prev ? { ...prev, current: { x: snapValue(world.x), y: snapValue(world.y) } } : null));
        return;
      }

      // Handle Entity Dragging
      if (isDraggingEntityRef.current && dragEntityStartRef.current) {
        const deltaX = world.x - dragEntityStartRef.current.mouseMm.x;
        const deltaY = world.y - dragEntityStartRef.current.mouseMm.y;

        dragEntityStartRef.current.entityOffsets.forEach((origPos, entId) => {
          let newX = snapValue(origPos.x + deltaX);
          let newY = snapValue(origPos.y + deltaY);

          const ent = entities.find(i => i.id === entId);
          if (ent && ent.entityType === 'COMPONENT' && ent.mountingType === 'DIN_RAIL') {
            const snapRail = snapToRailY(newX, newY, ent.height);
            newY = snapRail.y;
            updateEntity(entId, { x: newX, y: newY, associatedRailId: snapRail.railId });
          } else {
            updateEntity(entId, { x: newX, y: newY });
          }
        });
      }
    },
    [
      screenToWorld,
      setCursorMm,
      setViewport,
      draftLine,
      snapValue,
      entities,
      snapToRailY,
      updateEntity
    ]
  );

  // Mouse Up
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
      }

      if (isDraggingEntityRef.current) {
        isDraggingEntityRef.current = false;
        dragEntityStartRef.current = null;
      }

      // Finish drawing Rail or Duct
      if (draftLine) {
        const startX = Math.min(draftLine.start.x, draftLine.current.x);
        const endX = Math.max(draftLine.start.x, draftLine.current.x);
        const startY = Math.min(draftLine.start.y, draftLine.current.y);
        const endY = Math.max(draftLine.start.y, draftLine.current.y);

        const deltaX = Math.abs(draftLine.current.x - draftLine.start.x);
        const deltaY = Math.abs(draftLine.current.y - draftLine.start.y);

        if (activeTool === 'DRAW_RAIL') {
          // Rail is predominantly horizontal, standard height 35mm
          const length = Math.max(80, deltaX);
          const newRail: PlacedEntity = {
            id: `rail-${Date.now()}`,
            entityType: 'DIN_RAIL',
            name: `DIN Rail 35 (${length}mm)`,
            x: startX,
            y: snapValue(draftLine.start.y),
            width: length,
            height: 35,
            railType: 'DIN 35x7.5',
            color: '#adb5bd'
          };
          addEntity(newRail);
          setSelectedIds([newRail.id]);
        } else if (activeTool === 'DRAW_DUCT') {
          // Wiring Duct: horizontal or vertical based on gesture
          const isHorizontal = deltaX >= deltaY;
          const ductThickness = 60; // default 60mm

          const newDuct: PlacedEntity = {
            id: `duct-${Date.now()}`,
            entityType: 'WIRING_DUCT',
            name: isHorizontal ? `Wiring Duct H (${Math.max(80, deltaX)}mm)` : `Wiring Duct V (${Math.max(80, deltaY)}mm)`,
            x: isHorizontal ? startX : snapValue(draftLine.start.x - ductThickness / 2),
            y: isHorizontal ? snapValue(draftLine.start.y - ductThickness / 2) : startY,
            width: isHorizontal ? Math.max(80, deltaX) : ductThickness,
            height: isHorizontal ? ductThickness : Math.max(80, deltaY),
            ductSize: '60x80',
            color: '#495057'
          };
          addEntity(newDuct);
          setSelectedIds([newDuct.id]);
        }

        setDraftLine(null);
        cancelTool();
      }
    },
    [draftLine, activeTool, snapValue, addEntity, setSelectedIds, cancelTool]
  );

  return {
    canvasRef,
    draftLine,
    worldToScreen,
    screenToWorld,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
