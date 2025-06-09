import tap from 'tap';
import server from '../src/server';
import { WorkflowType } from 'rootsby/types';

// Creating a workflow without an ID should fail
 tap.test('create workflow without id', async t => {
  const res = await server.inject({
    method: 'POST',
    url: '/workflows',
    payload: {
      config: {
        name: 'no-id',
        type: WorkflowType.ShortRunning,
        functions: []
      }
    }
  });
  t.equal(res.statusCode, 400, 'should return 400');
});

// Running a workflow that does not exist should return 404
 tap.test('run nonexistent workflow', async t => {
  const res = await server.inject({
    method: 'POST',
    url: '/workflows/does-not-exist/run',
    payload: {}
  });
  t.equal(res.statusCode, 404, 'should return 404');
});

// Sending an invalid body shape when creating a workflow should return 400
 tap.test('invalid workflow body shape', async t => {
  const res = await server.inject({
    method: 'POST',
    url: '/workflows',
    payload: { foo: 'bar' }
  });
  t.equal(res.statusCode, 400, 'should return 400');
});
