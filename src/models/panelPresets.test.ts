import { describe, it, expect } from 'vitest';
import { panelPresets, getPanelPreset, getDefaultPreset } from './panelPresets';


describe('panel presets', () => {
  it('should provide a default preset', () => {
    const preset = getDefaultPreset();
    expect(preset.id).toBe(panelPresets[0].id);
  });

  it('should find a preset by id', () => {
    const preset = getPanelPreset('generic-400');
    expect(preset?.config.ratedPower).toBe(400);
  });

  it('should return undefined for unknown id', () => {
    expect(getPanelPreset('missing-id')).toBeUndefined();
  });
});
