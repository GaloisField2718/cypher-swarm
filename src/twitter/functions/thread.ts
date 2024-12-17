import { ThreadTweet, ThreadResult } from '../types/thread';
import { sendTweet } from './sendTweet';
import { replyToTweet } from './replyToTweet';
import { Logger } from '../../utils/logger';
import { saveThreadToDB, updateThreadStatus } from '../../supabase/functions/twitter/threadQueries';

export async function createThread(tweets: ThreadTweet[], draftId?: string): Promise<ThreadResult> {
  try {
    Logger.log('🧵 Starting thread creation with tweets:', { count: tweets.length });
    let previousTweetId: string | undefined;
    const tweetIds: string[] = [];
    
    for (const tweet of tweets) {
      Logger.log('📤 Posting tweet:', { content: tweet.content.substring(0, 50) + '...' });
      
      const tweetId = !previousTweetId 
        ? await sendTweet(tweet.content, tweet.mediaUrls)
        : (await replyToTweet(previousTweetId, tweet.content, tweet.mediaUrls))?.tweetId || undefined;
      
      if (!tweetId) throw new Error('Failed to send tweet');
      
      tweetIds.push(tweetId);
      previousTweetId = tweetId;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await saveThreadToDB({
      tweetId: tweetIds[0],
      tweetIds,
      content: { tweets },
      status: 'published'
    });

    Logger.log('✅ Thread created and saved:', { threadId: tweetIds[0], tweetCount: tweetIds.length });

    return {
      success: true,
      message: 'Thread created and saved successfully',
      threadId: tweetIds[0],
      tweetIds
    };
  } catch (error) {
    Logger.log('❌ Error creating thread:', error);
    return {
      success: false,
      message: `Thread creation failed: ${error.message}`
    };
  }
} 