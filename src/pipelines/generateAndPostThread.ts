import { Logger } from '../utils/logger';
import { ThreadAgent } from '../ai/agents/threadAgent/threadAgent';
import { OpenAIClient } from '../ai/models/clients/OpenAiClient';
import { logTweet } from '../supabase/functions/twitter/tweetEntries';
import { ThreadResult } from '../twitter/types/thread';
import { getFormattedRecentHistory } from '../supabase/functions/terminal/terminalHistory';
import { loadMemories } from './loadMemories';
import { ensureAuthenticated } from '../twitter/twitterClient';
import { sendTweet } from '../twitter/functions/sendTweet';
import { replyToTweet } from '../twitter/functions/replyToTweet';
import { configLoader } from '../utils/config';

interface GenerateThreadOptions {
  topic: string;
}

/**
 * Génère le contenu du thread en utilisant l'IA
 */
async function generateThreadContent(options: GenerateThreadOptions): Promise<ThreadResult> {
  // Charger l'historique et les mémoires
  const formattedHistory = await getFormattedRecentHistory();
  const relevantMemories = await loadMemories(`Load in memories based on this following topic: ${options.topic}`, {
    worldKnowledge: true,
    cryptoKnowledge: true,
    selfKnowledge: true,
    mainTweets: true,
    replyTweets: false,
    userTweets: false,
    imagePrompts: false,
    quoteTweets: false
  });

  // Configuration des variables d'exécution
  const runtimeVariables = {
    memories: relevantMemories,
    terminalLog: formattedHistory
  };

  // Initialisation et exécution de l'agent
  const threadAgent = new ThreadAgent(new OpenAIClient("gpt-4o-mini"));
  const result = await threadAgent.run(`GENERATE A THREAD ABOUT ${options.topic}`, runtimeVariables);

  if (!result?.output?.thread_tweets?.length) {
    throw new Error('Failed to generate thread content');
  }

  return {
    success: true,
    message: 'Thread content generated successfully',
    thread_tweets: result.output.thread_tweets
  };
}

/**
 * Poste le thread sur Twitter et enregistre les tweets
 */
async function postThreadToTwitter(threadContent: ThreadResult): Promise<ThreadResult> {
  Logger.log('📝 Starting thread posting process...');
  
  await ensureAuthenticated();
  
  for (const tweet of threadContent.thread_tweets) {
    if (tweet.content.length > 280) {
      throw new Error('Tweet content exceeds character limit');
    }
  }

  try {
    // Post du premier tweet avec le type 'thread'
    const firstTweetId = await sendTweet(
      threadContent.thread_tweets[0].content,
      undefined,
      { tweet_type: 'thread' }
    );

    if (!firstTweetId) {
      throw new Error('Failed to post first tweet: No tweet ID returned');
    }

    Logger.log('✅ First tweet posted:', firstTweetId);

    // Post des tweets suivants en réponse
    let lastTweetId = firstTweetId;
    const tweetIds = [firstTweetId];

    for (let i = 1; i < threadContent.thread_tweets.length; i++) {
      const replyResult = await replyToTweet(
        lastTweetId,
        threadContent.thread_tweets[i].content,
        undefined,
        { tweet_type: 'thread' }
      );

      if (!replyResult.success || !replyResult.tweetId) {
        throw new Error(`Failed to post reply tweet ${i + 1}: ${replyResult.message}`);
      }

      tweetIds.push(replyResult.tweetId);
      lastTweetId = replyResult.tweetId;
      Logger.log(`✅ Posted tweet ${i + 1}/${threadContent.thread_tweets.length}`);
    }

    return {
      success: true,
      threadId: firstTweetId,
      tweetIds,
      message: 'Thread posted successfully',
      thread_tweets: threadContent.thread_tweets
    };
  } catch (error) {
    Logger.log('❌ Error posting thread:', error);
    throw error;
  }
}

/**
 * Pipeline principal pour la génération et publication d'un thread
 */
export async function generateAndPostThread(options: GenerateThreadOptions): Promise<ThreadResult> {
  try {
    Logger.log('🚀 Starting thread generation pipeline...');
    
    // 1. Génération du contenu
    const threadContent = await generateThreadContent(options);
    
    // 2. Publication sur Twitter
    const result = await postThreadToTwitter(threadContent);
    
    return result;
  } catch (error) {
    Logger.log('❌ Error in thread pipeline:', error);
    return {
      success: false,
      message: error.message,
      thread_tweets: []
    };
  }
}