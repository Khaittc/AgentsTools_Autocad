import { CabinetEnclosureDef } from '../../shared/types/index.ts';

export const CABINET_CATALOG: CabinetEnclosureDef[] = [
  {
    id: 'cab-600x800x250',
    manufacturer: 'Schneider Electric',
    series: 'Spacial CRN',
    model: 'NSYS3D8625P',
    width: 600,
    height: 800,
    depth: 250,
    mountingPlate: {
      width: 550,
      height: 750,
      offsetX: 25,
      offsetY: 25,
      depthOffset: 25
    },
    doorInternalAllowance: 20
  },
  {
    id: 'cab-800x1000x300',
    manufacturer: 'Schneider Electric',
    series: 'Spacial S3D',
    model: 'NSYS3D10830P',
    width: 800,
    height: 1000,
    depth: 300,
    mountingPlate: {
      width: 740,
      height: 940,
      offsetX: 30,
      offsetY: 30,
      depthOffset: 30
    },
    doorInternalAllowance: 25
  },
  {
    id: 'cab-800x1200x300',
    manufacturer: 'Schneider Electric',
    series: 'Spacial SF',
    model: 'NSYVD20830',
    width: 800,
    height: 1200,
    depth: 300,
    mountingPlate: {
      width: 740,
      height: 1140,
      offsetX: 30,
      offsetY: 30,
      depthOffset: 35
    },
    doorInternalAllowance: 30
  }
];
