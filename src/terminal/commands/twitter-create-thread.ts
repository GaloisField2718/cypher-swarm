import { Command } from '../types/commands';
import { isCooldownActive } from '../../supabase/functions/twitter/cooldowns';
import { Logger } from '../../utils/logger';
import { generateAndPostThread } from '../../pipelines/generateAndPostThread';

export const createThread: Command = {
  name: 'create-thread',
  description: 'Creates and posts a Twitter thread about a specific topic. Propose a topic and an agent will handle the rest.',
  parameters: [
    {
      name: 'topic',
      description: 'The topic to generate the thread about. Should be a prompt for Thread Agent',
      required: true,
      type: 'string'
    }
  ],
  handler: async (args) => {
    try {
      // Check if topic was provided
      if (!args.topic) {
        return {
          output: '❌ Action: Create Thread\nStatus: Failed\nReason: Topic parameter is required.',
          error: true
        };
      }

      // Vérifier le cooldown
      const cooldownInfo = await isCooldownActive('thread');
      if (cooldownInfo.isActive) {
        return {
          output: `❌ Action: Create Thread\nStatus: Failed\nReason: Thread cooldown active. Wait ${cooldownInfo.remainingTime} minutes.`,
          error: true
        };
      }

      // Générer et poster le thread
      const result = await generateAndPostThread({ topic: args.topic });
      
      if (result.success) {
        return {
          output: `✅ Action: Create Thread\nStatus: Success\nThread ID: ${result.threadId}\nTweets: ${result.tweetIds?.length || 0}`,
          data: result
        };
      } else {
        return {
          output: `❌ Action: Create Thread\nStatus: Failed\nReason: ${result.message}`,
          error: true
        };
      }

    } catch (error) {
      Logger.log('Error in create-thread command:', error);
      return {
        output: `❌ Action: Create Thread\nStatus: Error\nDetails: ${error.message}`,
        error: true
      };
    }
  }
};
