# Rootsby REST API

This project provides a simple Fastify server written in TypeScript that allows creating and running workflows powered by [Rootsby](https://www.npmjs.com/package/rootsby).

The application is developed and tested against the current Node.js LTS (v22).

Workflow configurations are persisted on disk. The directory can be customised
using the `WORKFLOWS_DIR` environment variable (defaults to `./data`).

## Scripts

- `npm run dev` – start the server in development using `ts-node-dev`.
- `npm run build` – compile the TypeScript source to the `build` directory.
- `npm start` – run the compiled server.
- `npm test` – build the project and run integration tests with `tap`.

## Configuration

The server listens on the host and port specified by the environment variables:

- `HOST` – defaults to `0.0.0.0`.
- `PORT` – defaults to `3000`.

For example:

```bash
HOST=127.0.0.1 PORT=8080 npm start
```

will start the server on `http://127.0.0.1:8080`.

## Endpoints

### `POST /workflows`
Create a workflow by providing a Rootsby `WorkflowConfig` in the body:

```json
{
  "config": {
    "id": "e26d5294-f540-45a8-9d95-b5d94bab5d23",
    "name": "example",
    "type": "ShortRunning",
    "functions": []
  }
}
```
Example request:

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{"config": {"id":"e26d5294-f540-45a8-9d95-b5d94bab5d23","name":"example","type":"ShortRunning","functions":[]}}'
```

### `GET /workflows`
List all stored workflows.

```bash
curl http://localhost:3000/workflows
```

### `GET /workflows/:id`
Retrieve a single workflow configuration.

```bash
curl http://localhost:3000/workflows/e26d5294-f540-45a8-9d95-b5d94bab5d23
```

### `POST /workflows/:id/run`
Execute a workflow. Optional input can be passed as `{ "input": { ... } }`.
Events generated during execution are returned in the response.

```bash
curl -X POST http://localhost:3000/workflows/e26d5294-f540-45a8-9d95-b5d94bab5d23/run \
  -H "Content-Type: application/json" \
  -d '{"input":{"message":"hello"}}'
```

### `PUT /workflows/:id`
Replace an existing workflow configuration. The body is identical to the
creation endpoint and the `id` must match the path parameter.

```bash
curl -X PUT http://localhost:3000/workflows/e26d5294-f540-45a8-9d95-b5d94bab5d23 \
  -H "Content-Type: application/json" \
  -d '{"config": {"id":"e26d5294-f540-45a8-9d95-b5d94bab5d23","name":"updated","type":"ShortRunning","functions":[]}}'
```

### `DELETE /workflows/:id`
Remove a workflow.

```bash
curl -X DELETE http://localhost:3000/workflows/e26d5294-f540-45a8-9d95-b5d94bab5d23
```
