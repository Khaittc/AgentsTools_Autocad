import React from 'react';
import { SimulatorProvider, useSimulator } from './state/SimulatorContext.tsx';
import { Ribbon } from './shell/Ribbon/Ribbon.tsx';
import { ComponentPalette } from './shell/Palette/ComponentPalette.tsx';
import { DrawingCanvas } from './drawing/DrawingCanvas/DrawingCanvas.tsx';
import { CommandLine } from './shell/CommandLine/CommandLine.tsx';
import { StatusBar } from './shell/StatusBar/StatusBar.tsx';
import { CABINET_CATALOG } from './mock-data/cabinets/catalog.ts';
import './styles/autocad-theme.css';

const CabinetSelectionModal: React.FC = () => {
  const { isCabinetModalOpen, toggleCabinetModal, cabinet, setCabinet } = useSimulator();

  if (!isCabinetModalOpen) return null;

  return (
    <div className="cad-modal-overlay" onClick={toggleCabinetModal}>
      <div className="cad-modal" onClick={e => e.stopPropagation()}>
        <div className="cad-modal-header">
          <span>Select Enclosure Cabinet (TTCCABINET)</span>
          <button
            onClick={toggleCabinetModal}
            style={{ background: 'transparent', border: 'none', color: '#abb2bf', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="cad-modal-body">
          <p style={{ color: '#abb2bf', fontSize: 11 }}>
            Choose an industrial enclosure from the cabinet catalog. Mounting plate dimensions and margins will adjust automatically.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CABINET_CATALOG.map(cab => (
              <div
                key={cab.id}
                style={{
                  padding: 10,
                  borderRadius: 4,
                  border: cab.id === cabinet.id ? '2px solid #61afef' : '1px solid #3e4451',
                  background: cab.id === cabinet.id ? '#2c313a' : '#21252b',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setCabinet(cab);
                  toggleCabinetModal();
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>
                  {cab.series} — {cab.model}
                </div>
                <div style={{ color: '#98c379', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>
                  Enclosure: {cab.width} × {cab.height} × {cab.depth} mm
                </div>
                <div style={{ color: '#abb2bf', fontSize: 10, marginTop: 2 }}>
                  Usable Mounting Plate: {cab.mountingPlate.width} × {cab.mountingPlate.height} mm (Door allowance: {cab.doorInternalAllowance}mm)
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cad-modal-footer">
          <button className="cad-btn-secondary" onClick={toggleCabinetModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SimulatorLayout: React.FC = () => {
  return (
    <div className="cad-app-container">
      {/* App Top Title Bar */}
      <div className="cad-app-header">
        <div className="cad-app-title">
          <span style={{ color: '#e06c75' }}>AUTODESK</span>
          <span>AutoCAD 2023 [SIMULATOR] — Panel Layout Designer v0.1</span>
          <span className="cad-badge">UX SIMULATOR ONLY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="cad-badge-scenario">Module A: Panel Layout</span>
        </div>
      </div>

      {/* AutoCAD Ribbon */}
      <Ribbon />

      {/* Main Canvas & Dockable Palette Area */}
      <div className="cad-workspace-body">
        <DrawingCanvas />
        <ComponentPalette />
      </div>

      {/* AutoCAD Command Line Bar */}
      <CommandLine />

      {/* AutoCAD Status Bar */}
      <StatusBar />

      {/* Modals */}
      <CabinetSelectionModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SimulatorProvider>
      <SimulatorLayout />
    </SimulatorProvider>
  );
};

export default App;
