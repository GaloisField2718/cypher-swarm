import { saveThreadToDB, updateThreadStatus, getThreadFromDB } from '../supabase/functions/twitter/threadQueries';
import { supabase } from '../supabase/supabaseClient';
import { ThreadContent } from '../twitter/types/thread';

// Exemple de contenu de thread
const exampleContent: ThreadContent = {
  tweets: [
    { content: "Hello, world!", media_included: false }
  ]
};

async function testThreadQueries() {
  try {
    // Créer une entrée dans twitter_tweets
    console.log('Creating a tweet in twitter_tweets...');
    const { data: tweetData, error: tweetError } = await supabase
      .from('twitter_tweets')
      .insert([
        { tweet_id: '1234567890', text: 'Test tweet', tweet_type: 'main', created_at: new Date().toISOString() }
      ])
      .select()
      .single();

    if (tweetError) throw tweetError;
    console.log('Tweet created:', tweetData);

    // Test de la fonction saveThreadToDB
    console.log('Testing saveThreadToDB...');
    const savedThread = await saveThreadToDB({
      tweetId: '1234567890',
      tweetIds: ['1234567890'],
      content: exampleContent,
      status: 'draft'
    });
    console.log('Thread saved:', savedThread);

    // Test de la fonction updateThreadStatus
    console.log('Testing updateThreadStatus...');
    await updateThreadStatus('1234567890', 'published');
    console.log('Thread status updated to published.');

    // Test de la fonction getThreadFromDB
    console.log('Testing getThreadFromDB...');
    const fetchedThread = await getThreadFromDB('1234567890');
    console.log('Thread fetched:', fetchedThread);

    if (fetchedThread && fetchedThread.status === 'published') {
      console.log('All tests passed successfully!');
    } else {
      console.error('Tests failed.');
    }
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

testThreadQueries();