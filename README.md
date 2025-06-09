# Rootsby REST API

This project provides a simple Fastify server written in TypeScript that allows creating and running workflows powered by [Rootsby](https://www.npmjs.com/package/rootsby).

## Scripts

- `npm run dev` – start the server in development using `ts-node-dev`.
- `npm run build` – compile the TypeScript source to the `build` directory.
- `npm start` – run the compiled server.
- `npm test` – build the project and run integration tests with `tap`.

## Endpoints

### `POST /workflows`
Create a workflow by providing a Rootsby `WorkflowConfig` in the body:

```json
{
  "config": {
    "id": "<uuid>",
    "name": "test",
    "type": "ShortRunning",
    "functions": []
  }
}
```

### `GET /workflows`
List all stored workflows.

### `GET /workflows/:id`
Retrieve a single workflow configuration.

### `POST /workflows/:id/run`
Execute a workflow. Optional input can be passed as `{ "input": { ... } }`.
Events generated during execution are returned in the response.
