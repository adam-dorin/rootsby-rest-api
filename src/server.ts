import Fastify from 'fastify';
import { Rootsby } from 'rootsby/workflow';
import type { WorkflowConfig } from 'rootsby/types';
import { WorkflowType } from 'rootsby/types';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const server = Fastify({ logger: true });

// simple in-memory store
const workflows = new Map<string, WorkflowConfig>();

const workflowConfigZod = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(WorkflowType),
  functions: z.array(z.any()),
});

const createWorkflowBodyZod = z.object({
  config: workflowConfigZod,
});
export type CreateWorkflowBody = z.infer<typeof createWorkflowBodyZod>;

const runWorkflowBodyZod = z.object({
  input: z.any().optional(),
});
export type RunWorkflowBody = z.infer<typeof runWorkflowBodyZod>;

const createWorkflowBodySchema = zodToJsonSchema(createWorkflowBodyZod);
const runWorkflowBodySchema = zodToJsonSchema(runWorkflowBodyZod);

server.post<{ Body: CreateWorkflowBody }>('/workflows', {
  schema: { body: createWorkflowBodySchema },
}, async (request, reply) => {
  const parsed = createWorkflowBodyZod.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid body' });
  }
  const { config } = parsed.data;
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


server.post<{ Params: { id: string }; Body: RunWorkflowBody }>('/workflows/:id/run', {
  schema: { body: runWorkflowBodySchema },
}, async (request, reply) => {

server.put<{ Params: { id: string }; Body: CreateWorkflowBody }>(
  '/workflows/:id',
  async (request, reply) => {
    const { id } = request.params;
    const { config } = request.body;
    if (!config || config.id !== id) {
      return reply.code(400).send({ error: 'config id mismatch' });
    }
    if (!workflows.has(id)) {
      return reply.code(404).send({ error: 'not found' });
    }
    workflows.set(id, config);
    return { id };
  }
);

server.delete<{ Params: { id: string } }>('/workflows/:id', async (request, reply) => {
  if (!workflows.has(request.params.id)) {
    return reply.code(404).send({ error: 'not found' });
  }
  workflows.delete(request.params.id);
  return reply.code(204).send();
});
  const workflow = workflows.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: 'not found' });
  }
  const parsed = runWorkflowBodyZod.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'invalid body' });
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
  const result = await rootsby.runWorkflow(workflow, parsed.data.input);
  return { result, events };
});

export default server;

if (require.main === module) {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  server.listen({ port, host }).catch(err => {
    server.log.error(err);
    process.exit(1);
  });
}
