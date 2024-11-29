import { assembleTwitterInterface } from '../twitter/utils/imageUtils';
import { getCurrentTimestamp } from '../utils/formatTimestamps';

/**
 * Test function to log the tweet interface string.
 * @param tweetId - The ID of the tweet to test with.
 */
async function testTweetContext(tweetId: string) {
    try {
        const recentMainTweetsContent = ''; // Replace with actual content if available
        const { textContent, imageContents } = await assembleTwitterInterface(recentMainTweetsContent, tweetId);

        console.log('--- Text Content ---');
        console.log(textContent);

        console.log('--- Image Contents ---');
        imageContents.forEach((image, index) => {
            console.log(`Image ${index + 1}:`);
            console.log(`Sender: ${image.sender}`);
            console.log(`Media Type: ${image.media_type}`);
            console.log('Base64 data retrieved successfully.');
        });
    } catch (error) {
        console.error('Error testing tweet context:', error);
    }
}

// Replace 'YOUR_TWEET_ID_HERE' with an actual tweet ID to test
testTweetContext('1862427713736212878');
console.log(getCurrentTimestamp());