import tap from "tap";
import * as crypto from "crypto";
import { WorkflowConfig, WorkflowType, WorkflowEvent } from "rootsby/types";
import server from "../src/server";

function createServer(dir: string) {
  process.env.WORKFLOWS_DIR = dir;
  delete require.cache[require.resolve("../src/server")];
  return require("../src/server").default as any;
}

const id1 = crypto.randomUUID();
const id2 = crypto.randomUUID();

const config: WorkflowConfig = {
  id: crypto.randomUUID(),
  name: "test",
  type: WorkflowType.ShortRunning,
  functions: [
    {
      id: id1,
      name: "fn1",
      executor: () => "result1",
      next: [{ functionId: id2, values: [] }],
    },
    {
      id: id2,
      name: "fn2",
      executor: () => "result2",
      next: [],
    },
  ],
};

tap.test("create and run workflow", async (t) => {
  const server = createServer(t.testdir());
  const createRes = await server.inject({
    method: "POST",
    url: "/workflows",
    payload: { config },
  });
  t.equal(createRes.statusCode, 201, "workflow created");

  const runRes = await server.inject({
    method: "POST",
    url: `/workflows/${config.id}/run`,
    payload: { input: { currentStepData: "value" } },
  });
  t.equal(runRes.statusCode, 200, "workflow ran");

  const body = runRes.json();
  t.ok(Array.isArray(body.events), "events captured");
  t.match(
    body.events.map((e: any) => e.event),
    [
      WorkflowEvent.startWorkflow,
      WorkflowEvent.startStep,
      WorkflowEvent.endStep,
      WorkflowEvent.startStep,
      WorkflowEvent.endStep,
      WorkflowEvent.endWorkflow,
    ],
    "events order"
  );
  await server.close();
});

tap.test("update missing workflow returns 404", async (t) => {
  const dir = t.testdir();
  const srv = createServer(dir);
  const missingId = crypto.randomUUID();
  const missingConfig = { ...config, id: missingId };
  const res = await srv.inject({
    method: "PUT",
    url: `/workflows/${missingId}`,
    payload: { config: missingConfig },
  });
  t.equal(res.statusCode, 404, "update rejected for missing workflow");
  await srv.close();
});

tap.test("reject invalid workflow creation", async (t) => {
  const res = await server.inject({
    method: "POST",
    url: "/workflows",
    payload: { config: {} },
  });
  t.equal(res.statusCode, 400, "invalid body rejected");
});

tap.test("reject invalid run payload", async (t) => {
  await server.inject({ method: "POST", url: "/workflows", payload: { config } });
  const res = await server.inject({
    method: "POST",
    url: `/workflows/${config.id}/run`,
    payload: '"not an object"',
    headers: { "content-type": "application/json" },
  });
  t.equal(res.statusCode, 400, "invalid body rejected");

  tap.test("update workflow", async (t) => {
    const updatedConfig = { ...config, name: "updated" };
    tap.test("workflow persists across server instances", async (t) => {
      const dir = t.testdir();
      const server1 = createServer(dir);
      const res = await server1.inject({
        method: "POST",
        url: "/workflows",
        payload: { config },
      });
      t.equal(res.statusCode, 201, "workflow stored");
      await server1.close();

      const server2 = createServer(dir);
      const listRes = await server2.inject({ method: "GET", url: "/workflows" });
      t.same(
        listRes.json().map((w: any) => w.id),
        [config.id],
        "listed after restart"
      );

      const getRes = await server2.inject({ method: "GET", url: `/workflows/${config.id}` });
      const stored = getRes.json();
      t.equal(stored.id, config.id, "id persisted");
      t.equal(stored.name, config.name, "name persisted");
      t.equal(stored.functions.length, config.functions.length, "functions count persisted");
      await server2.close();
    });

    tap.test("update workflow", async (t) => {
      const updatedConfig = { ...config, name: "updated" };
      const updateRes = await server.inject({
        method: "PUT",
        url: `/workflows/${config.id}`,
        payload: { config: updatedConfig },
      });
      t.equal(updateRes.statusCode, 200, "workflow updated");

      const getRes = await server.inject({
        method: "GET",
        url: `/workflows/${config.id}`,
      });
      t.equal(getRes.json().name, "updated", "workflow replaced");
    });

    tap.test("delete workflow", async (t) => {
      const getRes = await server.inject({
        method: "GET",
        url: `/workflows/${config.id}`,
      });
      t.equal(getRes.json().name, "updated", "workflow replaced");
    });

    tap.test("delete workflow", async (t) => {
      const delRes = await server.inject({
        method: "DELETE",
        url: `/workflows/${config.id}`,
      });
      t.equal(delRes.statusCode, 204, "workflow deleted");

      const getRes = await server.inject({
        method: "GET",
        url: `/workflows/${config.id}`,
      });
      t.equal(getRes.statusCode, 404, "workflow no longer exists");
    });
  });
});
