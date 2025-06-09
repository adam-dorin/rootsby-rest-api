import tap from 'tap';
import server from '../src/server';

// start the server on an ephemeral port to verify it can be configured
// at runtime.
tap.test('start server on custom port', async t => {
  const address = await server.listen({ port: 0, host: '127.0.0.1' });
  t.ok(address, 'server started');
  const port = (server.server.address() as any).port;
  t.ok(port, 'port detected');
  t.ok(port !== 3000, 'uses non-default port');

  const res = await fetch(`http://127.0.0.1:${port}/workflows`);
  t.equal(res.status, 200, 'server responded');

  await server.close();
});
