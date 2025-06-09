import Fastify from "fastify";
import { Rootsby } from "rootsby/workflow";
import { WorkflowEvent, type WorkflowConfig } from "rootsby/types";
import path from "path";
import WorkflowStorage from "./storage";

const server = Fastify({ logger: true });

const storage = new WorkflowStorage(process.env.WORKFLOWS_DIR || path.join(process.cwd(), "data"));

interface CreateWorkflowBody {
  config: WorkflowConfig;
}

server.post<{ Body: CreateWorkflowBody }>("/workflows", async (request, reply) => {
  const { config } = request.body;
  if (!config || !config.id) {
    return reply.code(400).send({ error: "config with id required" });
  }
  await storage.save(config);
  return reply.code(201).send({ id: config.id });
});

server.get("/workflows", async () => {
  return storage.list();
});

server.get<{ Params: { id: string } }>("/workflows/:id", async (request, reply) => {
  const workflow = await storage.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: "not found" });
  }
  return workflow;
});

// TODO: improve this
server.put<{ Params: { id: string }; Body: CreateWorkflowBody }>("/workflows/:id", async (request, reply) => {
  const { id } = request.params;
  const { config } = request.body;
  if (!config || config.id !== id) {
    return reply.code(400).send({ error: "config id mismatch" });
  }
  const workflow = await storage.get(id);
  if (!workflow) {
    return reply.code(404).send({ error: "not found" });
  }
  if (workflow.id !== id) {
    return reply.code(404).send({ error: "not found" });
  }
  // workflow.set(id, config);
  return { id };
});
// TODO: improve this
server.delete<{ Params: { id: string } }>("/workflows/:id", async (request, reply) => {
  const { id } = request.params;
  const workflow = await storage.get(id);
  if (!workflow) {
    return reply.code(404).send({ error: "not found" });
  }
  // if (!workflow.has(request.params.id)) {
  //   return reply.code(404).send({ error: 'not found' });
  // }
  // workflow.delete(request.params.id);
  return reply.code(204).send();
});

server.post<{ Params: { id: string }; Body: { input?: any } }>("/workflows/:id/run", async (request, reply) => {
  const workflow = await storage.get(request.params.id);
  if (!workflow) {
    return reply.code(404).send({ error: "not found" });
  }
  const rootsby = new Rootsby();
  const events: any[] = [];
  rootsby.progress({
    events: [WorkflowEvent.startWorkflow, WorkflowEvent.endWorkflow, WorkflowEvent.startStep, WorkflowEvent.endStep],
    handler: (eventName: any, data: any) => {
      events.push({ event: eventName, data });
    },
  });
  const result = await rootsby.runWorkflow(workflow, request.body.input);
  return { result, events };
});

export default server;

if (require.main === module) {
  const port = parseInt(process.env.PORT ?? "3000", 10);
  const host = process.env.HOST ?? "0.0.0.0";
  server.listen({ port, host }).catch((err) => {
    server.log.error(err);
    process.exit(1);
  });
}
