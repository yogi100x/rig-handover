import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/reader.js';
import { DigestPage } from './views/digest.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  // The date shape is checked first, so :night can never leave runsDir.
  const night = (config: RigConfig, id: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(id) ? readNight(config.runsDir, id) : null;

  app.get('/digest/:night', (c) => {
    const n = night(config, c.req.param('night'));
    if (!n) return c.html(<Layout title="not found" lane={lane()}><p class="mute">no such night</p></Layout>, 404);
    return c.html(
      <Layout title={`digest ${n.night}`} lane={lane()}>
        <DigestPage night={n} />
      </Layout>,
    );
  });

  return app;
}
