import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Layers } from 'lucide-react';
import { useSimulator } from '../../state/SimulatorContext.tsx';
import { COMPONENT_CATALOG } from '../../mock-data/components/catalog.ts';
import { ComponentCategory } from '../../shared/types/index.ts';

export const ComponentPalette: React.FC = () => {
  const { isPaletteOpen, togglePalette, startPlaceComponent, activeTool, componentToPlace } = useSimulator();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: { label: string; value: string }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Power', value: 'POWER' },
    { label: 'Control', value: 'CONTROL' },
    { label: 'Drive', value: 'DRIVE' },
    { label: 'I/O', value: 'IO' },
    { label: 'Structure', value: 'STRUCTURE' }
  ];

  const filteredCatalog = useMemo(() => {
    return COMPONENT_CATALOG.filter(comp => {
      const matchCat = selectedCategory === 'ALL' || comp.category === (selectedCategory as ComponentCategory);
      const matchSearch =
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  if (!isPaletteOpen) return null;

  return (
    <div className="cad-palette">
      {/* Header */}
      <div className="cad-palette-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={16} color="#61afef" />
          <span>Panel Components</span>
        </div>
        <button
          onClick={togglePalette}
          style={{ background: 'transparent', border: 'none', color: '#abb2bf', cursor: 'pointer' }}
          title="Close Palette (TTCPANEL)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="cad-palette-search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, color: '#636d83' }} />
          <input
            type="text"
            placeholder="Search component, model..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 26 }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="cad-palette-categories">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`cad-cat-btn ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Component Cards List */}
      <div className="cad-palette-list">
        {filteredCatalog.map(comp => {
          const isPlacingThis = activeTool === 'PLACE_COMPONENT' && componentToPlace?.id === comp.id;

          return (
            <div
              key={comp.id}
              className="cad-comp-card"
              style={{
                borderColor: isPlacingThis ? '#61afef' : undefined,
                background: isPlacingThis ? '#283344' : undefined
              }}
              onClick={() => startPlaceComponent(comp)}
            >
              <div className="cad-comp-card-top">
                <div>
                  <div className="cad-comp-card-title">{comp.name}</div>
                  <div className="cad-comp-card-mfg">{comp.manufacturer} · {comp.model}</div>
                </div>
                <span className="cad-comp-card-badge">
                  {comp.mountingType === 'DIN_RAIL' ? 'DIN RAIL' : 'PLATE'}
                </span>
              </div>

              <div className="cad-comp-card-dims">
                W: {comp.width}mm × H: {comp.height}mm × D: {comp.depth}mm
              </div>

              <div className="cad-comp-card-clearance">
                Clearance: T:{comp.clearance.top} B:{comp.clearance.bottom} L:{comp.clearance.left} R:{comp.clearance.right}mm
              </div>

              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="cad-btn-primary"
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    startPlaceComponent(comp);
                  }}
                >
                  <Plus size={12} />
                  <span>Insert</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredCatalog.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#636d83' }}>
            No matching components found.
          </div>
        )}
      </div>
    </div>
  );
};
