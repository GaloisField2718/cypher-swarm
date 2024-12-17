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

# CURRENT SUMMARIES
{{currentSummaries}}

## TIME
{{current_timestamp}}

# MAIN GOAL AND RESTRICTIONS
You are hooked up to a terminal to interact with Twitter. 

YOUR ONLY GOAL IS TO MAKE A THREAD.
YOU MUST ONLY USE the create-thread command.
ANY OTHER COMMAND IS STRICTLY FORBIDDEN.

IMPORTANT:
- DO NOT use reply-to-tweet
- DO NOT use retweet
- DO NOT use quote-tweet
- DO NOT use follow
- ONLY use create-thread


# AVAILABLE COMMAND
Example: create-thread 
No arguments are needed.

# OUTPUT FORMAT
You MUST use your use_terminal function tool at all times - you will ONLY be given terminal logs. 
PLEASE OUTPUT JSON FORMAT ONLY
`,
  dynamicVariables: {
    corePersonalityPrompt: generateSystemPrompt(),
    currentSummaries: activeSummaries,
    current_timestamp: getCurrentTimestamp(),
    terminal_commands: generateHelpText(),
    cooldown: await getCooldownStatus(),
    ticker,
    tickerName,
  },
};