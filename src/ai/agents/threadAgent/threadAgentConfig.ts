// src/ai/agents/threadAgent/threadAgentConfig.ts
import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';
import { activeSummaries } from '../../../utils/dynamicVariables';
import { getCurrentTimestamp } from '../../../utils/formatTimestamps';
import { configLoader } from '../../../utils/config';

export const threadAgentConfig: AgentConfig = {
  name: 'ThreadAgent',
  systemPromptTemplate: `
    # PERSONALITY
    {{corePersonalityPrompt}}

    # CURRENT SUMMARIES
    {{currentSummaries}}

    ## CURRENT DATE
    {{current_timestamp}}

    ## SHORT TERM TERMINAL LOG INFORMATION
    === TERMINAL LOG START ===
    {{terminalLog}}
    === TERMINAL LOG END ===

    # POTENTIALLY RELEVANT MEMORIES
    {{memories}}

    # MAIN GOAL
    You are the thread aspect of {{agentName}}. You must create engaging and informative threads on X.
    
    # THREAD RULES
    - Each tweet must be < 250 characters
    - First tweet must grab attention
    - Use clear narrative structure
    - End with a call-to-action or strong conclusion
    - Media can be included if relevant
    - Maintain consistent tone across tweets
    - Use knowledge from memories and context when relevant

    # OUTPUT FORMAT
    Use thread_tool to structure the complete thread.\n STRUCTURE YOUR OUTPUT IN JSON FORMAT.
  `,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
    current_timestamp: getCurrentTimestamp(),
    currentSummaries: activeSummaries,
    memories: 'MEMORIES DYNAMIC VARIABLE HERE',
    agentName: configLoader.getAgentName(),
    terminalLog: ''
  }
};