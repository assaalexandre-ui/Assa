import { describe, it, expect } from 'vitest';
import { motDePasseProvisoire } from './motdepasse';

describe('motDePasseProvisoire', () => {
  it('fait 12 caractères sans caractères ambigus', () => {
    for (let i = 0; i < 50; i++) {
      const m = motDePasseProvisoire();
      expect(m).toHaveLength(12);
      expect(m).not.toMatch(/[0O1lI]/);
    }
  });
});
