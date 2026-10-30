import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (o: object) => JSON.stringify(o);
const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir };
const app = createApp(config);

beforeAll(() => {
  writeFileSync(
    join(dir, '2026-01-02.jsonl'),
    [
      line({ at: '2026-01-02T01:00:00+01:00', job: 'b/job', status: 'ok', owner: 'rook' }),
      line({ at: '2026-01-02T02:00:00+01:00', job: 'a/job', status: 'fail', owner: null, error: 'boom' }),
      '{"at":"2026-01-02T03:00:00+01:00","job":"c/jo',
    ].join('\n'),
  );
  writeFileSync(join(dir, '2026-01-03.jsonl'), '');
});

describe('digest page', () => {
  it('renders rows sorted by job, flags a fail, shows — for a null owner', async () => {
    const res = await app.request('/digest/2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('! a/job');
    expect(html).toContain('<td>—</td>');
  });

  it('survives a bad line and says so', async () => {
    const html = await (await app.request('/digest/2026-01-02')).text();
    expect(html).toContain('1 unreadable line(s) skipped');
  });

  it('renders an empty night as nothing ran', async () => {
    const res = await app.request('/digest/2026-01-03');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('returns 404 for a night with no file and for a malformed night', async () => {
    expect((await app.request('/digest/2000-01-01')).status).toBe(404);
    expect((await app.request('/digest/not-a-date')).status).toBe(404);
  });
});

describe('digest JSON', () => {
  it('has the same jobs in the same order as the page', async () => {
    const rows = (await (await app.request('/api/digest/2026-01-02')).json()) as { job: string }[];
    expect(rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
  });

  it('returns [] for an empty night and 404 for a missing one', async () => {
    expect(await (await app.request('/api/digest/2026-01-03')).json()).toEqual([]);
    expect((await app.request('/api/digest/2000-01-01')).status).toBe(404);
  });
});
