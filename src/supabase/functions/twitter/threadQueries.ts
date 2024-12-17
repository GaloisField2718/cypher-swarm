import { Logger } from '../../../utils/logger';
import { ThreadContent } from '../../../twitter/types/thread';
import { supabase } from '../../supabaseClient';

export interface ThreadRecord {
  id: number;
  tweet_id: string;
  tweet_ids: string[];
  content: ThreadContent;
  status: 'draft' | 'publishing' | 'published' | 'failed';
  bot_username: string;
  created_at?: string;
  updated_at: string;
}

export async function saveThreadToDB(thread: Omit<ThreadRecord, 'id' | 'bot_username' | 'created_at' | 'updated_at'>): Promise<ThreadRecord | null> {
  try {
    const { data, error } = await supabase
      .from('threads')
      .insert([{
        ...thread,
        bot_username: process.env.TWITTER_USERNAME,
        updated_at: new Date().toISOString()
      }])
      .select<'*', ThreadRecord>()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    Logger.log('Error saving thread to DB:', error);
    return null;
  }
}

export async function updateThreadStatus(tweetId: string, status: ThreadRecord['status']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('threads')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('tweet_id', tweetId);

    if (error) throw error;
    return true;
  } catch (error) {
    Logger.log('Error updating thread status:', error);
    return false;
  }
}

export async function getThreadFromDB(tweetId: string): Promise<ThreadRecord | null> {
  try {
    const { data, error } = await supabase
      .from('threads')
      .select<'*', ThreadRecord>()
      .eq('tweet_id', tweetId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    Logger.log('Error fetching thread from DB:', error);
    return null;
  }
}
