import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../registry';
import { initTools } from '../init';

describe('Tool Registry', () => {
  it('should have tools registered', () => {
    initTools();
    const tools = toolRegistry.getAllTools();
    expect(tools.length).toBeGreaterThan(0);
  });
});
