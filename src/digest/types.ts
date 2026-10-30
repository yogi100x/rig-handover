export type Status = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Missing owner / error are null, rendered as —.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: Status;
  lastError: string | null;
  first: string;
  last: string;
};

// bad = lines that did not parse. counts = rows by lastStatus.
export type Night = {
  night: string;
  rows: DigestRow[];
  bad: number;
  counts: Record<Status, number>;
};

// null when runs/<night>.jsonl does not exist. An empty file gives rows: [].
export type ReadNight = (runsDir: string, night: string) => Night | null;
