import { describe, it, expect } from 'vitest';
import { shellTool } from '../definitions/shell';

describe('Shell Tool Security', () => {
  it('should block dangerous commands', async () => {
    await expect(shellTool.execute({ command: 'rm -rf /' })).rejects.toThrow('Dangerous command detected.');
  });
});
