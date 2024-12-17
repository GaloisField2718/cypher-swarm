// src/pipelines/threadPipeline.ts
import { Logger } from '../utils/logger';
import { ThreadResult, ThreadInput } from '../twitter/types/thread';
import { sendTweet } from '../twitter/functions/sendTweet';
import { generateAndPostTweetReply } from '../pipelines/generateReply';
import { saveThreadToDB, updateThreadStatus } from '../supabase/functions/twitter/threadQueries';
import { ensureAuthenticated } from '../twitter/twitterClient';
import { ThreadAgent } from '../ai/agents/threadAgent/threadAgent';
import { OpenAIClient } from '../ai/models/clients/OpenAiClient';

export async function generateAndPostThread(generatedThread: ThreadResult): Promise<ThreadResult> {
  try {
    Logger.log('🚀 Starting thread posting process');
    
    // Vérifier la longueur de chaque tweet
    for (const tweet of generatedThread.thread_tweets) {
      if (tweet.content.length > 280) { // Limite standard Twitter
        throw new Error('Tweet content exceeds character limit');
      }
    }
    
    // 1. Envoyer le premier tweet avec l'API standard (pas de note_tweet)
    const mainTweetId = await sendTweet(generatedThread.thread_tweets[0].content);
    if (!mainTweetId) throw new Error('Failed to post main tweet');
    Logger.log('✅ Main tweet posted:', mainTweetId);
    
    // 2. Itérer pour les réponses en utilisant l'API de réponse standard
    let lastTweetId = mainTweetId;
    const tweetIds = [mainTweetId];
    
    for (const tweet of generatedThread.thread_tweets.slice(1)) {
      const replyResult = await generateAndPostTweetReply(
        lastTweetId,
        [],
        tweet.content
      );
      
      if (!replyResult.success || !replyResult.tweetId) {
        throw new Error(`Failed to post reply: ${replyResult.message}`);
      }
      
      tweetIds.push(replyResult.tweetId);
      lastTweetId = replyResult.tweetId;
      Logger.log('✅ Reply tweet posted:', replyResult.tweetId);
    }
    
    // 3. Sauvegarder dans Supabase
    await saveThreadToDB({
      tweet_id: mainTweetId,
      tweet_ids: tweetIds,
      content: generatedThread,
      status: 'published'
    });
    Logger.log('✅ Thread saved to database');

    return {
      success: true,
      threadId: mainTweetId,
      tweetIds: tweetIds,
      message: 'Thread published successfully',
      thread_tweets: generatedThread.thread_tweets
    };
  } catch (error) {
    Logger.log('❌ Error in generateAndPostThread:', error);
    return {
      success: false,
      message: error.message,
      thread_tweets: []
    };
  }
}

export async function threadPipeline(input: ThreadInput): Promise<ThreadResult> {
  const draftId = `draft_${Date.now()}`;
  
  try {
    Logger.log('🚀 Starting thread pipeline');
    await ensureAuthenticated();

    let threadContent = input.content;

    // Generate content if needed
    if (input.generateContent) {
      const threadAgent = new ThreadAgent(new OpenAIClient("gpt-4o-mini"));
      const result = await threadAgent.run("Create a thread about the latest developments", {
        worldKnowledge: "true",
        cryptoKnowledge: "true",
        selfKnowledge: "true"
      });

      if (!result.success) {
        throw new Error(`Failed to generate thread content: ${result.error}`);
      }

      threadContent = {
        thread_tweets: result.output.thread_tweets
      };
    }

    if (!threadContent?.thread_tweets || threadContent.thread_tweets.length === 0) {
      throw new Error('Thread content is required');
    }

    // Save initial draft
    await saveThreadToDB({
      tweet_id: draftId,
      tweet_ids: [],
      content: threadContent,
      status: 'draft'
    });

    // Mettre à jour le statut en 'publishing'
    await updateThreadStatus(draftId, 'publishing');
    
    // Générer et poster le thread
    const result = await generateAndPostThread({
      success: true,
      message: 'Thread content ready',
      thread_tweets: threadContent.thread_tweets
    });

    return result;
  } catch (error) {
    Logger.log('❌ Thread pipeline failed:', error);
    await updateThreadStatus(draftId, 'failed');
    return {
      success: false,
      message: error.message,
      thread_tweets: []
    };
  }
}
