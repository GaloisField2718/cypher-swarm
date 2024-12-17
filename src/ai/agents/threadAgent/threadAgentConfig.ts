// src/ai/agents/threadAgent/threadAgentConfig.ts
import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';
import { configLoader } from '../../../utils/config';
import { activeSummaries } from '../../../utils/dynamicVariables';

export const threadAgentConfig: AgentConfig = {
  name: 'ThreadAgent',
  systemPromptTemplate: `
    # PERSONALITY
    {{corePersonalityPrompt}}

    # CURRENT SUMMARIES
    {{currentSummaries}}

    # MAIN GOAL
    You are the thread aspect of {{agentName}}. You must create engaging and informative threads on X.
    
    # THREAD RULES
    - Each tweet must be < 250 characters
    - First tweet must grab attention
    - Use clear narrative structure
    - End with a call-to-action or strong conclusion
    - Media can be included if relevant
    - Maintain consistent tone across tweets

    # OUTPUT FORMAT
    Use thread_tool to structure the complete thread.
  `,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
    agentName: configLoader.getAgentName(),
    currentSummaries: activeSummaries
  }
};