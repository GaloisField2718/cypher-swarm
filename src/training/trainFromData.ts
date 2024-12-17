import { processTrainingData, processMidTermBatch, generateFinalLongTerm, TrainingResult } from './processTraining';
import { OpenAIClient } from '../ai/models/clients/OpenAiClient';
import path from 'path';
import fs from 'fs';
import { ModelClient } from '../ai/types/agentSystem';

const DATA_DIR = path.join(__dirname, 'data');
const BATCH_SIZE = 5;
const PROGRESS_FILE = path.join(__dirname, 'training_progress.json');

interface TrainingProgress {
  lastProcessedBatch: number;
  failedFiles: string[];
}

function saveProgress(progress: TrainingProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadProgress(): TrainingProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { lastProcessedBatch: -1, failedFiles: [] };
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (item.endsWith('.md') || item.endsWith('.txt')) {
      files.push(fullPath);
    }
  });

  return files.sort();
}

async function processBatch(files: string[], modelClient: ModelClient, batchIndex: number) {
  console.log(`\n🔄 Processing batch ${batchIndex + 1} with ${files.length} files`);
  
  const progress = loadProgress();
  if (batchIndex <= progress.lastProcessedBatch) {
    console.log(`Batch ${batchIndex + 1} already processed, skipping...`);
    return;
  }
  
  const shortTermResults: TrainingResult[] = [];
  
  for (const file of files) {
    try {
      const filename = path.basename(file);
      console.log(`\n📝 Processing: ${filename}`);
      const content = fs.readFileSync(file, 'utf8');
      
      // Determine source type based on file path
      const sourceType = file.includes('/courses/') ? 'courses' : 'tweets';
      
      const result = await processTrainingData(content, modelClient, filename, {
        sourceType: sourceType
      });
      
      shortTermResults.push(result);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      progress.failedFiles.push(file);
      saveProgress(progress);
      continue;
    }
  }

  if (shortTermResults.length > 0) {
    const batchSessionId = `batch_${batchIndex}_${Date.now()}`;
    await processMidTermBatch(shortTermResults, modelClient, batchSessionId);
  }

  progress.lastProcessedBatch = batchIndex;
  saveProgress(progress);
}

async function runTraining() {
  console.log('🚀 Starting training process...');
  
  try {
    const modelClient = new OpenAIClient('gpt-4');
    
    // Process courses
    const coursesDir = path.join(DATA_DIR, 'courses');
    console.log(`\n📂 Processing courses from: ${coursesDir}`);
    const courseFiles = getAllFiles(coursesDir);
    
    // Process tweets
    const tweetsDir = path.join(DATA_DIR, 'tweets');
    console.log(`\n📂 Processing tweets from: ${tweetsDir}`);
    const tweetFiles = getAllFiles(tweetsDir);
    
    const allFiles = [...courseFiles, ...tweetFiles];
    console.log(`Found ${allFiles.length} total files to process`);

    const batches: string[][] = [];
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      batches.push(allFiles.slice(i, i + BATCH_SIZE));
    }

    console.log(`Created ${batches.length} batches of ${BATCH_SIZE} files`);

    for (let i = 0; i < batches.length; i++) {
      await processBatch(batches[i], modelClient, i);
    }

    console.log('\n🔄 Generating final long-term summary...');
    await generateFinalLongTerm(modelClient);
    
    console.log('✅ Training completed successfully');
    
  } catch (error) {
    console.error('❌ Training error:', error);
    process.exit(1);
  }
}

runTraining().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 