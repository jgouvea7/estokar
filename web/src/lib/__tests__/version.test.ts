import { CURRENT_VERSION, BUILD_STRING, changelog } from '@/lib/version';

describe('version', () => {
  it('CURRENT_VERSION should be a semver string', () => {
    expect(CURRENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('BUILD_STRING should contain version and build number', () => {
    expect(BUILD_STRING).toMatch(/^v\d+\.\d+\.\d+ \(Build \d+\)$/);
  });

  it('changelog should have at least one entry', () => {
    expect(changelog.length).toBeGreaterThan(0);
  });

  it('each changelog entry should have required fields', () => {
    for (const entry of changelog) {
      expect(entry).toHaveProperty('version');
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('build');
      expect(entry).toHaveProperty('changes');
      expect(Array.isArray(entry.changes)).toBe(true);
    }
  });

  it('each change should have type and text', () => {
    for (const entry of changelog) {
      for (const change of entry.changes) {
        expect(change).toHaveProperty('type');
        expect(change).toHaveProperty('text');
        expect(['feature', 'fix', 'improvement']).toContain(change.type);
      }
    }
  });
});
