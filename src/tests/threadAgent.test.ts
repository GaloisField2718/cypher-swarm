import { describe, it, expect, vi } from 'vitest';
import { ThreadAgent } from '../ai/agents/threadAgent/threadAgent';
import { OpenAIClient } from '../ai/models/clients/OpenAiClient';
import { threadPipeline } from '../pipelines/threadPipeline';
import { saveThreadToDB } from '../supabase/functions/twitter/threadQueries';

const mockThreadResponse = {
  success: true,
  output: {
    topic: "Test Topic",
    main_points: ["Point 1", "Point 2"],
    thread_tweets: [
      { content: "Tweet 1" },
      { content: "Tweet 2" }
    ]
  }
};

// Mock des dépendances
vi.mock('../ai/models/clients/OpenAiClient', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    modelType: 'openai',
    run: vi.fn().mockResolvedValue(mockThreadResponse),
    chatCompletion: vi.fn().mockResolvedValue(mockThreadResponse)
  }))
}));
vi.mock('../twitter/functions/sendTweet');
vi.mock('../pipelines/generateReply');
vi.mock('../supabase/functions/twitter/threadQueries', () => ({
  saveThreadToDB: vi.fn().mockResolvedValue({
    tweet_id: '123',
    tweet_ids: ['123', '456'],
    content: {
      thread_tweets: [
        { content: 'Tweet 1' },
        { content: 'Tweet 2' }
      ]
    },
    status: 'published'
  })
}));

describe('Thread Creation System', () => {
  it('should generate a valid thread structure', async () => {
    const mockClient = new OpenAIClient();
    const agent = new ThreadAgent(mockClient);
    const result = await agent.run("Create a thread", {
      worldKnowledge: "true",
      cryptoKnowledge: "true"
    });
    
    expect(result.success).toBe(true);
    expect(result.output.thread_tweets).toBeInstanceOf(Array);
    expect(result.output.thread_tweets.length).toBeGreaterThanOrEqual(2);
  });

  it('should successfully save thread to database', async () => {
    const mockThread = {
      tweet_id: '123',
      tweet_ids: ['123', '456'],
      content: {
        thread_tweets: [
          { content: 'Tweet 1' },
          { content: 'Tweet 2' }
        ]
      },
      status: 'published' as const
    };

    const result = await saveThreadToDB(mockThread);
    expect(result).not.toBeNull();
    expect(result?.tweet_id).toBe('123');
  });

  it('should handle errors gracefully', async () => {
    const mockInput = {
      content: {
        thread_tweets: []
      }
    };

    const result = await threadPipeline(mockInput);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Thread content is required');
  });
}); 