import React from 'react';
import { useSimulator } from '../../state/SimulatorContext.tsx';

export const StatusBar: React.FC = () => {
  const {
    cursorMm,
    settings,
    toggleSnapGrid,
    toggleClearances,
    viewport,
    resetView
  } = useSimulator();

  return (
    <div className="cad-status-bar">
      {/* Left: Millimeter Coordinates */}
      <div className="cad-status-left">
        <div className="cad-coord-display">
          X: {cursorMm.x >= 0 ? `+${cursorMm.x}` : cursorMm.x}.00&nbsp;&nbsp;
          Y: {cursorMm.y >= 0 ? `+${cursorMm.y}` : cursorMm.y}.00&nbsp;&nbsp;
          Z: +0.00 (mm)
        </div>
      </div>

      {/* Right: Quick toggles */}
      <div className="cad-status-right">
        <button className="cad-status-toggle-btn active" title="Model Space Active">
          MODEL
        </button>

        <button
          className={`cad-status-toggle-btn ${settings.snapToGrid ? 'active' : ''}`}
          onClick={toggleSnapGrid}
          title="Toggle Grid Snap (10mm)"
        >
          SNAP ({settings.gridSize}mm)
        </button>

        <button
          className={`cad-status-toggle-btn ${settings.snapToRail ? 'active' : ''}`}
          onClick={() => {}}
          title="Snap to DIN Rail active"
        >
          DIN SNAP
        </button>

        <button
          className={`cad-status-toggle-btn ${settings.showClearances ? 'active' : ''}`}
          onClick={toggleClearances}
          title="Toggle Clearance Envelope non-plot layers"
        >
          CLEARANCES {settings.showClearances ? 'ON' : 'OFF'}
        </button>

        <button className="cad-status-toggle-btn" onClick={resetView} title="Reset view zoom and pan">
          FIT
        </button>

        <span style={{ fontSize: 10, color: '#7f848e', marginLeft: 8 }}>
          {Math.round(viewport.zoom * 100)}%
        </span>
      </div>
    </div>
  );
};
