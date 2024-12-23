import { scraper, ensureAuthenticated } from '../twitter/twitterClient';
import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/logger';

async function extractFractalTweets() {
    try {
        await ensureAuthenticated();
        
        Logger.log('Extraction des tweets de @fractal_bitcoin...');
        const tweets = [];
        
        // Utilisation de getTweets avec un itérateur
        for await (const tweet of scraper.getTweets('fractal_bitcoin', 600)) {
            tweets.push(tweet);
        }
        
        Logger.log(`Nombre de tweets récupérés: ${tweets.length}`);

        // Formater en markdown
        let markdown = '# Tweets et Réponses de @fractal\n\n';
        
        for (const tweet of tweets) {
            const date = new Date(tweet.timeParsed || Date.now()).toLocaleDateString('fr-FR');
            markdown += `## Tweet du ${date}\n\n`;
            markdown += `${tweet.text}\n\n`;
            
            markdown += `Likes: ${tweet.likes || 0} | `;
            markdown += `Retweets: ${tweet.retweets || 0} | `;
            markdown += `Replies: ${tweet.replies || 0}\n\n`;
            
            if (tweet.isReply && tweet.inReplyToStatusId) {
                const replyToTweet = await scraper.getTweet(tweet.inReplyToStatusId);
                if (replyToTweet?.username) {
                    markdown += `↳ En réponse à: @${replyToTweet.username}\n\n`;
                }
            }
            
            markdown += '---\n\n';
        }

        // Sauvegarder dans un fichier
        const outputPath = path.resolve(__dirname, './data/fractal_tweets.md');
        fs.writeFileSync(outputPath, markdown);
        
        Logger.log(`Tweets extraits avec succès dans ${outputPath}`);

    } catch (error) {
        Logger.log('Erreur lors de l\'extraction des tweets:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            response: error.response
        });
    }
}

extractFractalTweets(); 