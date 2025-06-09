import Fastify from 'fastify';
import { Rootsby } from 'rootsby/workflow';
import type { WorkflowConfig } from 'rootsby/types';

const server = Fastify({ logger: true });

// simple in-memory store
const workflows = new Map<string, WorkflowConfig>();

interface CreateWorkflowBody {
  config: WorkflowConfig;
}

server.post<{ Body: CreateWorkflowBody }>('/workflows', async (request, reply) => {
  const { config } = request.body;
  if (!config || !config.id) {
    return reply.code(400).send({ error: 'config with id required' });
  }
  workflows.set(config.id, config);
  return reply.code(201).send({ id: config.id });
});

server.get('/workflows', async () => {
  return Array.from(workflows.values());
});

server.get<{ Params: { id: string } }>('/workflows/:id', async (request, reply) => {
  const workflow = workflows.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: 'not found' });
  }
  return workflow;
});

server.post<{ Params: { id: string }; Body: { input?: any } }>('/workflows/:id/run', async (request, reply) => {
  const workflow = workflows.get(request.params.id);
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
