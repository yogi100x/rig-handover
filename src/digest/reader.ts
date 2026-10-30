import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, Status } from './types.js';

const STATUSES: readonly string[] = ['ok', 'retry', 'fail'];

type Line = { at: string; job: string; status: Status; owner: string | null; error: string | null };

// Parse at the edge: anything that is not a well-formed log line is undefined, never thrown.
function parseLine(text: string): Line | undefined {
  try {
    const o: unknown = JSON.parse(text);
    if (typeof o !== 'object' || o === null) return undefined;
    const r = o as Record<string, unknown>;
    if (typeof r.at !== 'string' || typeof r.job !== 'string') return undefined;
    if (typeof r.status !== 'string' || !STATUSES.includes(r.status)) return undefined;
    return {
      at: r.at,
      job: r.job,
      status: r.status as Status,
      owner: typeof r.owner === 'string' ? r.owner : null,
      error: typeof r.error === 'string' ? r.error : null,
    };
  } catch {
    return undefined;
  }
}

export const readNight: ReadNight = (runsDir, night): Night | null => {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const byJob = new Map<string, DigestRow>();
  let bad = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (!line) {
      bad++;
      continue;
    }
    const row = byJob.get(line.job);
    if (!row) {
      byJob.set(line.job, {
        job: line.job,
        owner: line.owner,
        runs: 1,
        retries: line.status === 'retry' ? 1 : 0,
        lastStatus: line.status,
        lastError: line.error,
        first: line.at,
        last: line.at,
      });
    } else {
      row.runs++;
      if (line.status === 'retry') row.retries++;
      row.owner = line.owner;
      row.lastStatus = line.status;
      row.lastError = line.error;
      row.last = line.at;
    }
  }

  const rows = [...byJob.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
  const counts: Record<Status, number> = { ok: 0, retry: 0, fail: 0 };
  for (const r of rows) counts[r.lastStatus]++;
  return { night, rows, bad, counts };
};
