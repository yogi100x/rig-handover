import type { Night } from '../digest/types.js';

const dash = (v: string | null) => v ?? '—';

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.bad > 0 && <p class="warn">{night.bad} unreadable line(s) skipped</p>}
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th><th>last error</th><th>first</th><th>last</th></tr>
          </thead>
          <tbody>
            {night.rows.map((r) => {
              const flag = r.lastStatus === 'fail' || r.retries >= 3;
              return (
                <tr class={flag ? 'warn' : undefined}>
                  <td>{flag ? '! ' : ''}{r.job}</td>
                  <td>{dash(r.owner)}</td>
                  <td>{r.runs}</td>
                  <td>{r.retries}</td>
                  <td>{r.lastStatus}</td>
                  <td>{dash(r.lastError)}</td>
                  <td>{r.first}</td>
                  <td>{r.last}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
