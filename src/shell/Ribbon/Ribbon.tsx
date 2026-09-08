import React, { useState } from 'react';
import {
  Layers,
  Box,
  PlusSquare,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  CheckCircle2,
  Eye,
  EyeOff,
  Maximize,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { useSimulator } from '../../state/SimulatorContext.tsx';

export const Ribbon: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PANEL' | 'VIEW' | 'SCENARIOS'>('PANEL');

  const {
    activeTool,
    startDrawRail,
    startDrawDuct,
    cancelTool,
    alignSelected,
    toggleClearances,
    settings,
    runQACheck,
    toggleCabinetModal,
    togglePalette,
    isPaletteOpen,
    resetView,
    loadScenario,
    deleteSelected,
    selectedIds
  } = useSimulator();

  return (
    <div className="cad-ribbon">
      {/* Ribbon Tabs Header */}
      <div className="cad-ribbon-tabs">
        <button
          className={`cad-ribbon-tab ${activeTab === 'PANEL' ? 'active' : ''}`}
          onClick={() => setActiveTab('PANEL')}
        >
          PANEL LAYOUT
        </button>
        <button
          className={`cad-ribbon-tab ${activeTab === 'VIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('VIEW')}
        >
          VIEW & TOOLS
        </button>
        <button
          className={`cad-ribbon-tab ${activeTab === 'SCENARIOS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SCENARIOS')}
        >
          SCENARIOS
        </button>
      </div>

      {/* Ribbon Panels Content */}
      <div className="cad-ribbon-panel">
        {activeTab === 'PANEL' && (
          <>
            {/* Group: Components */}
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <button
                  className={`cad-ribbon-btn-big ${isPaletteOpen ? 'active' : ''}`}
                  onClick={togglePalette}
                  title="Toggle Panel Components Palette (TTCPANEL)"
                >
                  <Layers size={22} />
                  <span>Components</span>
                </button>
                <button
                  className="cad-ribbon-btn-big"
                  onClick={toggleCabinetModal}
                  title="Select or configure cabinet enclosure (TTCCABINET)"
                >
                  <Box size={22} />
                  <span>Cabinet</span>
                </button>
              </div>
              <div className="cad-ribbon-group-title">Enclosure & Parts</div>
            </div>

            {/* Group: Structure (Rail & Duct) */}
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <button
                  className={`cad-ribbon-btn-big ${activeTool === 'DRAW_RAIL' ? 'active' : ''}`}
                  onClick={() => (activeTool === 'DRAW_RAIL' ? cancelTool() : startDrawRail())}
                  title="Draw DIN Rail 35x7.5mm (TTCRAIL)"
                >
                  <PlusSquare size={22} />
                  <span>DIN Rail</span>
                </button>
                <button
                  className={`cad-ribbon-btn-big ${activeTool === 'DRAW_DUCT' ? 'active' : ''}`}
                  onClick={() => (activeTool === 'DRAW_DUCT' ? cancelTool() : startDrawDuct('60x80'))}
                  title="Draw Wiring Duct 60x80mm (TTCDUCT)"
                >
                  <Sliders size={22} />
                  <span>Wiring Duct</span>
                </button>
              </div>
              <div className="cad-ribbon-group-title">Mounting Structure</div>
            </div>

            {/* Group: Arrange & Alignment */}
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <div className="cad-ribbon-btn-grid">
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('LEFT')}
                    title="Align Left (select 2+ items)"
                  >
                    <AlignLeft size={14} />
                    <span>Left</span>
                  </button>
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('RIGHT')}
                    title="Align Right"
                  >
                    <AlignRight size={14} />
                    <span>Right</span>
                  </button>
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('TOP')}
                    title="Align Top"
                  >
                    <AlignVerticalJustifyStart size={14} />
                    <span>Top</span>
                  </button>
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('BOTTOM')}
                    title="Align Bottom"
                  >
                    <AlignVerticalJustifyEnd size={14} />
                    <span>Bottom</span>
                  </button>
                </div>
                <div className="cad-ribbon-btn-grid" style={{ marginLeft: 4 }}>
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('SPACE_H')}
                    title="Equal Horizontal Spacing"
                  >
                    <AlignHorizontalDistributeCenter size={14} />
                    <span>Space H</span>
                  </button>
                  <button
                    className="cad-ribbon-btn-small"
                    onClick={() => alignSelected('SPACE_V')}
                    title="Equal Vertical Spacing"
                  >
                    <AlignVerticalDistributeCenter size={14} />
                    <span>Space V</span>
                  </button>
                </div>
              </div>
              <div className="cad-ribbon-group-title">Mechanical Alignment</div>
            </div>

            {/* Group: QA & Verification */}
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <button
                  className="cad-ribbon-btn-big"
                  onClick={runQACheck}
                  title="Check collisions and boundary limits (TTCPANELCHECK)"
                >
                  <CheckCircle2 size={22} color="#98c379" />
                  <span>Check QA</span>
                </button>
                <button
                  className={`cad-ribbon-btn-big ${settings.showClearances ? 'active' : ''}`}
                  onClick={toggleClearances}
                  title="Toggle Clearance Envelope Visualization"
                >
                  {settings.showClearances ? <Eye size={22} color="#61afef" /> : <EyeOff size={22} />}
                  <span>Clearance</span>
                </button>
              </div>
              <div className="cad-ribbon-group-title">Validation & QA</div>
            </div>
          </>
        )}

        {activeTab === 'VIEW' && (
          <>
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <button className="cad-ribbon-btn-big" onClick={resetView} title="Center view to mounting plate (FIT)">
                  <Maximize size={22} />
                  <span>Fit View</span>
                </button>
                {selectedIds.length > 0 && (
                  <button
                    className="cad-ribbon-btn-big"
                    onClick={deleteSelected}
                    title="Delete selected objects (DEL)"
                    style={{ color: '#e06c75' }}
                  >
                    <RotateCcw size={22} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <div className="cad-ribbon-group-title">Navigation & Edit</div>
            </div>
          </>
        )}

        {activeTab === 'SCENARIOS' && (
          <>
            <div className="cad-ribbon-group">
              <div className="cad-ribbon-group-content">
                <button
                  className="cad-ribbon-btn-big"
                  onClick={() => loadScenario('S01')}
                  title="Load Scenario S01: Clean empty panel"
                >
                  <Box size={20} />
                  <span>S01 Empty</span>
                </button>
                <button
                  className="cad-ribbon-btn-big"
                  onClick={() => loadScenario('S02')}
                  title="Load Scenario S02: Fully populated typical control panel"
                >
                  <Layers size={20} color="#61afef" />
                  <span>S02 Typical</span>
                </button>
                <button
                  className="cad-ribbon-btn-big"
                  onClick={() => loadScenario('S03')}
                  title="Load Scenario S03: Intentional clearance & spacing conflicts"
                >
                  <Eye size={20} color="#e5c07b" />
                  <span>S03 Clearance</span>
                </button>
                <button
                  className="cad-ribbon-btn-big"
                  onClick={() => loadScenario('S04')}
                  title="Load Scenario S04: Equipment overflows 600x800 cabinet"
                >
                  <Sliders size={20} color="#e06c75" />
                  <span>S04 Too Small</span>
                </button>
                <button
                  className="cad-ribbon-btn-big"
                  onClick={() => loadScenario('S05')}
                  title="Load Scenario S05: Component chassis exceeds enclosure depth"
                >
                  <Box size={20} color="#c678dd" />
                  <span>S05 Depth</span>
                </button>
              </div>
              <div className="cad-ribbon-group-title">Predefined Engineering Scenarios</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
