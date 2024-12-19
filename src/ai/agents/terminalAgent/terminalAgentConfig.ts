// src/ai/agents/terminalAgent/terminalAgentConfig.ts

import { AgentConfig } from '../../types/agentSystem';
import { generateSystemPrompt } from '../corePersonality';
import { generateHelpText } from '../../../terminal/commandRegistry';
import { getCurrentTimestamp } from '../../../utils/formatTimestamps';
import { activeSummaries } from '../../../utils/dynamicVariables';
import { getCooldownStatus } from '../../../supabase/functions/twitter/cooldowns';
import { configLoader } from '../../../utils/config';

// Get ticker info with defaults
const ticker = configLoader.getConfig()?.ticker || '$CYPHER';
const tickerName = configLoader.getConfig()?.tickerName || 'CYPHER•GENESIS';

export const terminalAgentConfig: AgentConfig = {
  name: 'TerminalAgent',
  systemPromptTemplate: `
# PERSONALITY
{{corePersonalityPrompt}}

# AVAILABLE COMMANDS
create-thread <topic>: Creates and posts a Twitter thread about a specific topic
Example: create-thread "The future of decentralized finance and its impact on traditional banking"

# OUTPUT FORMAT
Use your use_terminal function tool to execute commands.
ONLY output in JSON format with this structure:
{
  "internal_thought": "Your reasoning about what to do",
  "plan": "Your plan of action",
  "terminal_commands": [
    {
      "command": "create-thread \"Your topic here\""
    }
  ]
}
`,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
    currentSummaries: activeSummaries,
    current_timestamp: getCurrentTimestamp(),
  },
};