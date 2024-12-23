import { Scraper, SearchMode } from 'goat-x';
import { Tweet } from 'goat-x';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface ThreadExtractorOptions {
  includeQuotedTweets?: boolean;
  includeMedia?: boolean;
}

class ThreadExtractor {
  private scraper: Scraper;

  constructor() {
    this.scraper = new Scraper();
  }

  /**
   * Initialize Twitter connection
   */
  async initialize(): Promise<void> {
    try {
      // Check if already logged in
      const isLoggedIn = await this.scraper.isLoggedIn();
      
      if (!isLoggedIn) {
        // Login with credentials from .env
        await this.scraper.login(
          process.env.TWITTER_USERNAME!,
          process.env.TWITTER_PASSWORD!,
          process.env.TWITTER_EMAIL
        );
        console.log('Successfully connected to Twitter');
      }
    } catch (error) {
      console.error('Error during connection:', error);
      throw error;
    }
  }

  /**
   * Extract a complete Twitter thread from a tweet ID
   */
  async extractThread(tweetId: string, options: ThreadExtractorOptions = {}): Promise<Tweet[]> {
    try {
      console.log('Fetching initial tweet...');
      const initialTweet = await this.scraper.getTweet(tweetId);
      
      if (!initialTweet) {
        throw new Error(`Tweet ${tweetId} not found`);
      }

      const thread: Tweet[] = [initialTweet];
      
      // Get username from initial tweet
      const username = initialTweet.username;
      if (!username) {
        throw new Error("Username not found");
      }

      console.log(`Fetching thread from user: ${username}`);

      // Use search to find all tweets in the thread
      const searchQuery = `from:${username} conversation_id:${initialTweet.conversationId}`;
      const searchResults = this.scraper.searchTweets(searchQuery, 100, SearchMode.Latest);

      // Collect all tweets from the search results
      for await (const tweet of searchResults) {
        if (tweet.id !== initialTweet.id && 
            tweet.conversationId === initialTweet.conversationId) {
          thread.push(tweet);
        }
      }

      // Sort chronologically
      thread.sort((a, b) => {
        const timeA = a.timeParsed?.getTime() || 0;
        const timeB = b.timeParsed?.getTime() || 0;
        return timeA - timeB;
      });

      console.log(`Found ${thread.length} tweets in thread`);
      return thread;

    } catch (error) {
      console.error('Error extracting thread:', error);
      throw error;
    }
  }

  /**
   * Format a thread for display
   */
  formatThread(thread: Tweet[]): string {
    return thread.map((tweet, index) => {
      let formattedTweet = `\n[${index + 1}/${thread.length}] ${tweet.text}`;
      
      // Add media URLs
      if (tweet.photos.length > 0) {
        formattedTweet += '\n📷 Images:';
        tweet.photos.forEach(photo => {
          formattedTweet += `\n${photo.url}`;
        });
      }

      if (tweet.videos.length > 0) {
        formattedTweet += '\n🎥 Videos:';
        tweet.videos.forEach(video => {
          formattedTweet += `\n${video.url || video.preview}`;
        });
      }

      // Add quoted tweet if present
      if (tweet.quotedStatus) {
        formattedTweet += `\n💬 Quoted tweet: ${tweet.quotedStatus.text}`;
      }

      return formattedTweet;
    }).join('\n---\n');
  }
}

// Example usage
async function main() {
  const threadExtractor = new ThreadExtractor();
  
  try {
    await threadExtractor.initialize();
    
    // Extract tweet ID from URL
    const tweetUrl = process.env.THREAD_TWEETS_LINKS || '';
    const tweetId = tweetUrl.split('/status/')[1];
    
    const thread = await threadExtractor.extractThread(tweetId, {
      includeQuotedTweets: true,
      includeMedia: true
    });

    const formattedThread = threadExtractor.formatThread(thread);
    console.log('Extracted thread:');
    console.log(formattedThread);

    // Save to file
    const outputPath = path.join(__dirname, '../training/data/tweets', `thread_${tweetId}.txt`);
    fs.writeFileSync(outputPath, formattedThread, 'utf8');
    console.log(`Thread saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
