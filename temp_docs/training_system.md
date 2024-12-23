# Complete Training System Guide

## Initial Setup

1. **Installation**
````bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
````

2. **`.env` File Configuration**
````bash
# Required API Keys
OPENAI_API_KEY=sk-xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# For Twitter Thread Extraction
TWITTER_USERNAME=xxx
TWITTER_PASSWORD=xxx 
TWITTER_EMAIL=xxx
THREAD_TWEETS_LINKS=https://twitter.com/user/status/123456789
````

## Data Preparation

### Folder Structure
````bash
src/
  training/
    data/
      courses/     # Course markdown files
        *.md
      tweets/      # Extracted Twitter threads
        *.txt
````

### Twitter Thread Extraction

The system includes a Twitter thread extractor (`src/utils/extractThread.ts`) that allows you to:

1. Connect to Twitter using credentials from `.env`
2. Extract a complete thread from a URL
3. Save formatted content to `data/tweets/`

**Usage:**
````bash
# Configure THREAD_TWEETS_LINKS in .env
# Then run
bun src/utils/extractThread.ts
````

## Memory System Architecture

### 1. Short-term Memory
- Processes individual files
- Stores in `memory_summaries` (type='short')
- 5 files per batch limit
- Includes metadata and timestamps

### 2. Mid-term Memory
- Consolidates batches of 5 short summaries
- Stores in `memory_summaries` (type='mid')
- Maximum 3 mid summaries before consolidation
- Preserves chronological context

### 3. Long-term Memory
- Consolidates 3 mid summaries into 1 long summary
- Stores in `memory_summaries` (type='long')
- Maintains evolution history
- Optimized for quick retrieval

## Training Process

1. **Launch**
````bash
bun src/training/trainFromData.ts
````

2. **Data Flow**
````
Source Files → Short Summaries (5) → Mid Summaries (3) → Long Memory
````

3. **Monitoring**
- Detailed console logs
- Progress in `training_progress.json`
- Supabase table status

## Database

### Main Tables

1. **memory_summaries**
````sql
CREATE TABLE memory_summaries (
  id SERIAL PRIMARY KEY,
  summary_type TEXT CHECK (summary_type IN ('short', 'mid', 'long')),
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
````

2. **crypto_knowledge**
- Stores processed knowledge
- Indexed for quick search
- Linked to long summaries

## Error Handling

### Common Scenarios

1. **Processing Failure**
- Check `training_progress.json`
- Review console logs
- Retry failed files

2. **Database Errors**
- Check uniqueness constraints
- Clean tables if needed
- Maintain data consistency

## Optimization & Maintenance

### Best Practices
- Regularly clean processed summaries
- Monitor OpenAI API usage
- Regular database backups
- Keep source files clean and well-formatted

### Performance
- Use appropriate indexes
- Efficient session management
- Optimize consolidation queries

## Future Development

1. **Planned Improvements**
- Meditation/dreaming system
- Enhanced memory consolidation
- Automatic cleanup mechanisms
- Extended memory categories

2. **Contributing**
- Follow contribution guidelines
- Thorough testing of changes
- Document modifications
