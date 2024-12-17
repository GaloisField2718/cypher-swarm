// src/terminal/commands/twitter-create-thread.ts
import { Command } from '../types/commands';
import { isCooldownActive } from '../../supabase/functions/twitter/cooldowns';
import { Logger } from '../../utils/logger';
import { generateAndPostThread } from '../../pipelines/threadPipeline';

/**
 * @command create-thread
 * @description Creates and posts a Twitter thread
 */
export const createThread: Command = {
  name: 'create-thread',
  description: 'Creates and posts a Twitter thread',
  parameters: [],
  handler: async () => {
    try {
      // Vérifier le cooldown
      const cooldown = await isCooldownActive('thread');
      if (cooldown.isActive) {
        return { 
          output: `Thread cooldown is active. Time remaining: ${cooldown.remainingTime} minutes`,
          error: true 
        };
      }

      Logger.log('Starting thread creation pipeline...');
      const result = await generateAndPostThread({
        success: true,
        message: 'Thread content ready',
        thread_tweets: [
          // Le contenu sera généré par l'agent
        ]
      });

      return { 
        output: `Thread created successfully!\nFirst Tweet: ${result.thread_tweets[0].content}` 
      };

    } catch (error) {
      Logger.log('Error in create-thread command:', error);
      return { 
        output: `Error creating thread: ${error.message}`, 
        error: true 
      };
    }
  }
};