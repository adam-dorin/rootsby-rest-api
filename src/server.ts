import Fastify from 'fastify';
import { Rootsby } from 'rootsby/workflow';
import type { WorkflowConfig } from 'rootsby/types';
import path from 'path';
import WorkflowStorage from './storage';

const server = Fastify({ logger: true });

const storage = new WorkflowStorage(
  process.env.WORKFLOWS_DIR || path.join(process.cwd(), 'data')
);

interface CreateWorkflowBody {
  config: WorkflowConfig;
}

server.post<{ Body: CreateWorkflowBody }>('/workflows', async (request, reply) => {
  const { config } = request.body;
  if (!config || !config.id) {
    return reply.code(400).send({ error: 'config with id required' });
  }
  await storage.save(config);
  return reply.code(201).send({ id: config.id });
});

server.get('/workflows', async () => {
  return storage.list();
});

server.get<{ Params: { id: string } }>('/workflows/:id', async (request, reply) => {
  const workflow = await storage.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: 'not found' });
  }
  return workflow;
});

server.post<{ Params: { id: string }; Body: { input?: any } }>('/workflows/:id/run', async (request, reply) => {
  const workflow = await storage.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: 'not found' });
  }
  const rootsby = new Rootsby();
  const events: any[] = [];
  rootsby.progress({
    events: [
      'startWorkflow',
      'endWorkflow',
      'startStep',
      'endStep',
    ] as any,
    handler: (eventName: any, data: any) => {
      events.push({ event: eventName, data });
    },
  });
  const result = await rootsby.runWorkflow(workflow, request.body.input);
  return { result, events };
});

export default server;

if (require.main === module) {
  server.listen({ port: 3000, host: '0.0.0.0' }).catch(err => {
    server.log.error(err);
    process.exit(1);
  });
}
