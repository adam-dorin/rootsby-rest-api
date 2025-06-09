import { promises as fs } from 'fs';
import path from 'path';
import type { WorkflowConfig } from 'rootsby/types';

export default class WorkflowStorage {
  constructor(private dir: string) {
    // directory will be created on demand
  }

  private filePath(id: string) {
    return path.join(this.dir, `${id}.json`);
  }

  async save(workflow: WorkflowConfig): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.filePath(workflow.id), JSON.stringify(workflow, null, 2), 'utf8');
  }

  async get(id: string): Promise<WorkflowConfig | undefined> {
    try {
      const data = await fs.readFile(this.filePath(id), 'utf8');
      return JSON.parse(data);
    } catch (err: any) {
      if (err && err.code === 'ENOENT') {
        return undefined;
      }
      throw err;
    }
  }

  async list(): Promise<WorkflowConfig[]> {
    await fs.mkdir(this.dir, { recursive: true });
    const files = await fs.readdir(this.dir);
    const result: WorkflowConfig[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(this.dir, file), 'utf8');
        result.push(JSON.parse(data));
      }
    }
    return result;
  }
}
