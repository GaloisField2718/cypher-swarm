// src/ai/agents/threadAgent/threadTool.ts
import { z } from 'zod';
import { Tool } from '../../types/agentSystem';

const tweetSchema = z.object({
  content: z.string().max(250).describe('Tweet content, must be less than 250 characters'),
  media_included: z.boolean().optional().describe('Whether media should be generated for this tweet')
});

export const threadToolSchema = z.object({
  topic: z.string().describe('Main topic of the thread'),
  main_points: z.array(z.string()).describe('Key points to cover in the thread'),
  thread_tweets: z.array(tweetSchema).min(2).max(8).describe('Array of tweets forming the thread')
});

export const ThreadTool: Tool = {
  type: 'function',
  function: {
    name: 'thread_tool',
    description: 'Creates a structured Twitter thread',
    parameters: {
      type: 'object',
      required: ['topic', 'main_points', 'thread_tweets'],
      properties: {
        topic: {
          type: 'string',
          description: 'Main topic of the thread'
        },
        main_points: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key points to cover in the thread'
        },
        thread_tweets: {
          type: 'array',
          items: {
            type: 'object',
            required: ['content'],
            properties: {
              content: {
                type: 'string',
                maxLength: 250
              },
              media_included: {
                type: 'boolean',
                optional: true
              }
            }
          },
          minItems: 2,
          maxItems: 8
        }
      }
    }
  }
};