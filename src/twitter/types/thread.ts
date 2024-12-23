import { TweetActionResult } from './tweetResults';

export interface ThreadContent {
  thread_tweets: {
    content: string;
    media_included?: boolean;
  }[];
}

export interface ThreadInput {
  content: {
    thread_tweets: any[];
  } | null;
  generateContent?: boolean;
}

export interface ThreadResult {
  success: boolean;
  threadId?: string;
  tweetIds?: string[];
  message: string;
  thread_tweets: ThreadContent['thread_tweets'];
}
