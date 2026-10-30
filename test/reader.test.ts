import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  const n = readNight('runs', '2026-10-28');

  it('reads 5 jobs and counts the one bad line', () => {
    expect(n?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(n?.bad).toBe(1);
  });

  it('counts runs, retries and last status', () => {
    const fx = n?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: null, owner: 'rook' });
    const bk = n?.rows.find((r) => r.job === 'notes/backup');
    expect(bk).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null, and the original time offset', () => {
    const d = n?.rows.find((r) => r.job === 'digest/render');
    expect(d?.owner).toBeNull();
    expect(d?.first).toBe('2026-10-29T05:41:09+01:00');
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2000-01-01')).toBeNull();
  });
});
