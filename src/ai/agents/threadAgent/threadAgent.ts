import { BaseAgent } from '../baseAgent';
import { ModelClient } from '../../types/agentSystem';
import { threadAgentConfig } from './threadAgentConfig';
import { ThreadTool, threadToolSchema } from '../threadAgent/threadTool';

export class ThreadAgent extends BaseAgent<typeof threadToolSchema> {
  constructor(modelClient: ModelClient) {
    super(threadAgentConfig, modelClient, threadToolSchema);
  }

  protected defineTools(): void {
    this.tools = [ThreadTool];
  }
}
