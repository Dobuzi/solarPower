import { PanelPreset } from '../core/types';

export const panelPresets: PanelPreset[] = [
  {
    id: 'generic-400',
    name: 'Generic 400W',
    manufacturer: 'Generic',
    model: 'Mono-400',
    config: {
      width: 1.134,
      height: 2.278,
      ratedPower: 400,
      efficiency: 0.195,
      tempCoefficient: -0.35,
      noct: 45,
    },
  },
  {
    id: 'tesla-solar-panel',
    name: 'Tesla Solar Panel',
    manufacturer: 'Tesla',
    model: '425W',
    config: {
      width: 1.135,
      height: 2.024,
      ratedPower: 425,
      efficiency: 0.198,
      tempCoefficient: -0.30,
      noct: 44,
    },
  },
  {
    id: 'lg-neon-h',
    name: 'LG NeON H',
    manufacturer: 'LG',
    model: 'LG380N1C-E6',
    config: {
      width: 1.024,
      height: 2.024,
      ratedPower: 380,
      efficiency: 0.218,
      tempCoefficient: -0.33,
      noct: 44,
    },
  },
  {
    id: 'sunpower-maxeon-3',
    name: 'SunPower Maxeon 3',
    manufacturer: 'SunPower',
    model: 'SPR-MAX3-400',
    config: {
      width: 1.046,
      height: 1.690,
      ratedPower: 400,
      efficiency: 0.226,
      tempCoefficient: -0.29,
      noct: 41.5,
    },
  },
  {
    id: 'rec-alpha-pure',
    name: 'REC Alpha Pure',
    manufacturer: 'REC',
    model: 'REC405AA',
    config: {
      width: 1.016,
      height: 1.821,
      ratedPower: 405,
      efficiency: 0.219,
      tempCoefficient: -0.26,
      noct: 44,
    },
  },
  {
    id: 'canadian-solar-hiku6',
    name: 'Canadian Solar HiKu6',
    manufacturer: 'Canadian Solar',
    model: 'CS6R-410MS',
    config: {
      width: 1.134,
      height: 1.762,
      ratedPower: 410,
      efficiency: 0.205,
      tempCoefficient: -0.34,
      noct: 45,
    },
  },
  {
    id: 'jinko-tiger-neo',
    name: 'Jinko Tiger Neo',
    manufacturer: 'Jinko Solar',
    model: 'JKM425N-54HL4-V',
    config: {
      width: 1.134,
      height: 1.762,
      ratedPower: 425,
      efficiency: 0.213,
      tempCoefficient: -0.30,
      noct: 45,
    },
  },
];

export function getPanelPreset(id: string): PanelPreset | undefined {
  return panelPresets.find((p) => p.id === id);
}

export function getDefaultPreset(): PanelPreset {
  return panelPresets[0];
}
