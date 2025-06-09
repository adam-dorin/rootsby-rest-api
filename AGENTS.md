# Repository guidelines

This repository hosts a Fastify-based REST API written in TypeScript. The following instructions describe the expected environment, development workflow and pull request requirements for contributors.

## Environment
- Node.js LTS version 22 or newer (see `.nvmrc` and CI config).
- TypeScript is compiled with strict settings. Compiled output goes to `build/` which is ignored in git.

## Development
1. Install dependencies with `npm ci`.
2. For active development run the server with `npm run dev`.
3. Execute tests with `npm test` which compiles the sources via the `pretest` script before running `tap` tests under `test/`.

## Contribution guidelines
- Keep all code in TypeScript using strict types.
- Do not commit the compiled `build/` directory.
- Follow the existing lightweight style (no project-specific eslint or prettier setup).
- Pull request messages should briefly summarize the change, list any affected endpoints, and include a snippet of the `npm test` output or mention if tests fail.

## Testing & CI
- Run `npm test` locally before opening a PR.
- GitHub Actions validates the project using Node.js `22.16.0` and executes `npm ci` followed by `npm test`.

