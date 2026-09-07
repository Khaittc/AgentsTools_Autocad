import React, { useEffect } from 'react';
import { useSimulator } from '../../state/SimulatorContext.tsx';
import { useCanvasInteraction } from '../Interaction/useCanvasInteraction.ts';

export const DrawingCanvas: React.FC = () => {
  const {
    cabinet,
    entities,
    selectedIds,
    activeTool,
    componentToPlace,
    viewport,
    settings,
    violations,
    cursorMm
  } = useSimulator();

  const {
    canvasRef,
    draftLine,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useCanvasInteraction();

  // Redraw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Clear canvas background
    ctx.fillStyle = '#1e2227';
    ctx.fillRect(0, 0, width, height);

    // Apply viewport transform (pan & zoom)
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Coordinate conversions
    const plateW = cabinet.mountingPlate.width;
    const plateH = cabinet.mountingPlate.height;

    // 2. Draw Grid (Metric mm)
    const viewLeft = -viewport.panX / viewport.zoom;
    const viewTop = -viewport.panY / viewport.zoom;
    const viewRight = viewLeft + width / viewport.zoom;
    const viewBottom = viewTop + height / viewport.zoom;

    // Major grid every 50mm, super grid every 100mm
    const gridStep = 10;
    const startX = Math.floor(viewLeft / gridStep) * gridStep;
    const endX = Math.ceil(viewRight / gridStep) * gridStep;
    const startY = Math.floor(viewTop / gridStep) * gridStep;
    const endY = Math.ceil(viewBottom / gridStep) * gridStep;

    ctx.lineWidth = 1 / viewport.zoom;
    for (let x = startX; x <= endX; x += gridStep) {
      if (x % 100 === 0) {
        ctx.strokeStyle = '#2d333f';
      } else if (x % 50 === 0) {
        ctx.strokeStyle = '#252a34';
      } else {
        ctx.strokeStyle = '#21252d';
      }
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridStep) {
      if (y % 100 === 0) {
        ctx.strokeStyle = '#2d333f';
      } else if (y % 50 === 0) {
        ctx.strokeStyle = '#252a34';
      } else {
        ctx.strokeStyle = '#21252d';
      }
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 3. Draw Cabinet Mounting Plate
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#282f3a';
    ctx.fillRect(0, 0, plateW, plateH);
    ctx.shadowBlur = 0; // reset shadow

    // Plate border
    ctx.strokeStyle = '#5c6370';
    ctx.lineWidth = 2 / viewport.zoom;
    ctx.strokeRect(0, 0, plateW, plateH);

    // Corner screw holes
    const holeRadius = 6;
    const holeMargin = 15;
    const holes = [
      { x: holeMargin, y: holeMargin },
      { x: plateW - holeMargin, y: holeMargin },
      { x: holeMargin, y: plateH - holeMargin },
      { x: plateW - holeMargin, y: plateH - holeMargin }
    ];
    ctx.fillStyle = '#1e2227';
    ctx.strokeStyle = '#4b5263';
    ctx.lineWidth = 1.5 / viewport.zoom;
    holes.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, holeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Plate dimension labels
    ctx.fillStyle = '#61afef';
    ctx.font = `${Math.max(10, 12 / viewport.zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(
      `Mounting Plate: ${plateW} × ${plateH} mm (Cabinet: ${cabinet.width}×${cabinet.height}×${cabinet.depth} mm)`,
      plateW / 2,
      -15
    );

    // 4. Draw Clearance Envelopes (if enabled)
    if (settings.showClearances) {
      entities.forEach(ent => {
        if (ent.entityType === 'COMPONENT' && ent.clearance) {
          const clr = ent.clearance;
          const cx = ent.x - clr.left;
          const cy = ent.y - clr.top;
          const cw = ent.width + clr.left + clr.right;
          const ch = ent.height + clr.top + clr.bottom;

          ctx.fillStyle = 'rgba(97, 175, 239, 0.08)';
          ctx.fillRect(cx, cy, cw, ch);

          ctx.strokeStyle = 'rgba(97, 175, 239, 0.35)';
          ctx.lineWidth = 1 / viewport.zoom;
          ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);
          ctx.strokeRect(cx, cy, cw, ch);
          ctx.setLineDash([]);
        }
      });
    }

    // 5. Draw Wiring Ducts
    entities.filter(e => e.entityType === 'WIRING_DUCT').forEach(duct => {
      ctx.fillStyle = duct.color || '#495057';
      ctx.fillRect(duct.x, duct.y, duct.width, duct.height);

      ctx.strokeStyle = '#6c757d';
      ctx.lineWidth = 1 / viewport.zoom;
      ctx.strokeRect(duct.x, duct.y, duct.width, duct.height);

      // Slotted grill pattern
      ctx.strokeStyle = '#343a40';
      ctx.lineWidth = 1.5 / viewport.zoom;
      const isHorizontal = duct.width >= duct.height;
      if (isHorizontal) {
        for (let sx = duct.x + 10; sx < duct.x + duct.width - 5; sx += 12) {
          ctx.beginPath();
          ctx.moveTo(sx, duct.y + 4);
          ctx.lineTo(sx, duct.y + duct.height - 4);
          ctx.stroke();
        }
      } else {
        for (let sy = duct.y + 10; sy < duct.y + duct.height - 5; sy += 12) {
          ctx.beginPath();
          ctx.moveTo(duct.x + 4, sy);
          ctx.lineTo(duct.x + duct.width - 4, sy);
          ctx.stroke();
        }
      }

      // Text label
      ctx.fillStyle = '#adb5bd';
      ctx.font = `${Math.max(8, 10 / viewport.zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        duct.ductSize ? `Duct ${duct.ductSize}` : 'Duct',
        duct.x + duct.width / 2,
        duct.y + duct.height / 2 + 3
      );
    });

    // 6. Draw DIN Rails
    entities.filter(e => e.entityType === 'DIN_RAIL').forEach(rail => {
      // Main rail metallic strip
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(rail.x, rail.y, rail.width, rail.height);

      ctx.strokeStyle = '#868e96';
      ctx.lineWidth = 1.5 / viewport.zoom;
      ctx.strokeRect(rail.x, rail.y, rail.width, rail.height);

      // Inner groove
      const grooveY = rail.y + 10;
      const grooveH = 15;
      ctx.fillStyle = '#adb5bd';
      ctx.fillRect(rail.x, grooveY, rail.width, grooveH);

      // Slotted mounting screw holes every 25mm
      ctx.fillStyle = '#495057';
      for (let hx = rail.x + 15; hx < rail.x + rail.width - 10; hx += 25) {
        ctx.fillRect(hx, grooveY + 3, 10, 9);
      }

      // Rail label
      ctx.fillStyle = '#495057';
      ctx.font = `bold ${Math.max(8, 9 / viewport.zoom)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('DIN 35', rail.x + 4, rail.y + 8);
    });

    // 7. Draw Components
    entities.filter(e => e.entityType === 'COMPONENT').forEach(comp => {
      const isSelected = selectedIds.includes(comp.id);
      const hasViolation = violations.some(v => v.entityIds.includes(comp.id));

      // Component body
      ctx.fillStyle = comp.color || '#343a40';
      ctx.fillRect(comp.x, comp.y, comp.width, comp.height);

      // Bevel border
      ctx.strokeStyle = hasViolation ? '#e06c75' : isSelected ? '#00e5ff' : '#21252b';
      ctx.lineWidth = (hasViolation || isSelected ? 2.5 : 1) / viewport.zoom;
      ctx.strokeRect(comp.x, comp.y, comp.width, comp.height);

      // Terminal blocks top and bottom
      ctx.fillStyle = '#21252b';
      const termH = Math.min(16, comp.height * 0.15);
      ctx.fillRect(comp.x, comp.y, comp.width, termH);
      ctx.fillRect(comp.x, comp.y + comp.height - termH, comp.width, termH);

      // Terminal screw dots
      ctx.fillStyle = '#dee2e6';
      const screwCount = 3;
      const spacing = comp.width / (screwCount + 1);
      for (let i = 1; i <= screwCount; i++) {
        ctx.beginPath();
        ctx.arc(comp.x + i * spacing, comp.y + termH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(comp.x + i * spacing, comp.y + comp.height - termH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Component Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(9, 11 / viewport.zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      const textY = comp.y + comp.height / 2 - 4;
      ctx.fillText(comp.name, comp.x + comp.width / 2, textY, comp.width - 4);

      // Dimensions subtext
      ctx.fillStyle = '#98c379';
      ctx.font = `${Math.max(8, 9 / viewport.zoom)}px monospace`;
      ctx.fillText(
        `${comp.width}×${comp.height}×${comp.depth || 0}mm`,
        comp.x + comp.width / 2,
        textY + 14
      );

      // Mounting badge
      if (comp.mountingType) {
        ctx.fillStyle = comp.mountingType === 'DIN_RAIL' ? '#4dabf7' : '#ffa94d';
        ctx.font = `italic ${Math.max(7, 8 / viewport.zoom)}px sans-serif`;
        ctx.fillText(
          comp.mountingType === 'DIN_RAIL' ? '[DIN RAIL]' : '[PLATE MOUNT]',
          comp.x + comp.width / 2,
          textY + 26
        );
      }
    });

    // 8. Draw Selection Highlights & Grips
    selectedIds.forEach(id => {
      const ent = entities.find(e => e.id === id);
      if (ent) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2 / viewport.zoom;
        ctx.setLineDash([3 / viewport.zoom, 3 / viewport.zoom]);
        ctx.strokeRect(ent.x - 2, ent.y - 2, ent.width + 4, ent.height + 4);
        ctx.setLineDash([]);

        // Grips on corners
        const gripSize = 6 / viewport.zoom;
        ctx.fillStyle = '#00e5ff';
        const grips = [
          { x: ent.x - 2, y: ent.y - 2 },
          { x: ent.x + ent.width + 2, y: ent.y - 2 },
          { x: ent.x - 2, y: ent.y + ent.height + 2 },
          { x: ent.x + ent.width + 2, y: ent.y + ent.height + 2 }
        ];
        grips.forEach(g => {
          ctx.fillRect(g.x - gripSize / 2, g.y - gripSize / 2, gripSize, gripSize);
        });
      }
    });

    // 9. Draw Draft Line (When dragging to draw rail or duct)
    if (draftLine) {
      const minX = Math.min(draftLine.start.x, draftLine.current.x);
      const maxX = Math.max(draftLine.start.x, draftLine.current.x);
      const minY = Math.min(draftLine.start.y, draftLine.current.y);
      const maxY = Math.max(draftLine.start.y, draftLine.current.y);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = '#61afef';
      ctx.lineWidth = 1.5 / viewport.zoom;
      ctx.setLineDash([4 / viewport.zoom, 2 / viewport.zoom]);

      if (activeTool === 'DRAW_RAIL') {
        const length = Math.max(80, maxX - minX);
        ctx.fillRect(minX, draftLine.start.y, length, 35);
        ctx.strokeRect(minX, draftLine.start.y, length, 35);
      } else if (activeTool === 'DRAW_DUCT') {
        const isHorizontal = Math.abs(draftLine.current.x - draftLine.start.x) >= Math.abs(draftLine.current.y - draftLine.start.y);
        const w = isHorizontal ? Math.max(80, maxX - minX) : 60;
        const h = isHorizontal ? 60 : Math.max(80, maxY - minY);
        ctx.fillRect(minX, minY, w, h);
        ctx.strokeRect(minX, minY, w, h);
      }
      ctx.setLineDash([]);
    }

    // 10. Placement Ghost Preview (When tool is PLACE_COMPONENT)
    if (activeTool === 'PLACE_COMPONENT' && componentToPlace) {
      const ghostX = cursorMm.x - componentToPlace.width / 2;
      const ghostY = cursorMm.y - componentToPlace.height / 2;

      // Clearance ghost
      if (settings.showClearances && componentToPlace.clearance) {
        const clr = componentToPlace.clearance;
        ctx.fillStyle = 'rgba(97, 175, 239, 0.15)';
        ctx.fillRect(
          ghostX - clr.left,
          ghostY - clr.top,
          componentToPlace.width + clr.left + clr.right,
          componentToPlace.height + clr.top + clr.bottom
        );
      }

      // Component ghost
      ctx.fillStyle = 'rgba(97, 175, 239, 0.4)';
      ctx.fillRect(ghostX, ghostY, componentToPlace.width, componentToPlace.height);
      ctx.strokeStyle = '#61afef';
      ctx.lineWidth = 2 / viewport.zoom;
      ctx.strokeRect(ghostX, ghostY, componentToPlace.width, componentToPlace.height);
    }

    ctx.restore();
  }, [
    cabinet,
    entities,
    selectedIds,
    activeTool,
    componentToPlace,
    viewport,
    settings,
    violations,
    cursorMm,
    draftLine,
    canvasRef
  ]);

  return (
    <div className="cad-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="cad-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Floating Canvas HUD */}
      <div className="cad-canvas-hud">
        <div className="cad-hud-row">
          <span className="cad-hud-label">Cabinet:</span>
          <span className="cad-hud-value">{cabinet.series} {cabinet.model}</span>
        </div>
        <div className="cad-hud-row">
          <span className="cad-hud-label">Mounting Plate:</span>
          <span className="cad-hud-value">{cabinet.mountingPlate.width} × {cabinet.mountingPlate.height} mm</span>
        </div>
        <div className="cad-hud-row">
          <span className="cad-hud-label">Items Placed:</span>
          <span className="cad-hud-value">{entities.length}</span>
        </div>
        {violations.length > 0 && (
          <div className="cad-hud-row" style={{ color: '#e06c75' }}>
            <span className="cad-hud-label">QA Issues:</span>
            <span className="cad-hud-value" style={{ color: '#e06c75', fontWeight: 'bold' }}>
              {violations.length} Violation(s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
