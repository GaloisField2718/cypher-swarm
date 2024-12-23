import { supabase } from '../supabase/supabaseClient';
import { ExtractorAgent } from '../ai/agents/extractorAgent/extractorAgent';
import { SummaryAgent } from '../ai/agents/summaryAgent/summaryAgent';
import { addCryptoKnowledge } from '../memory/addMemories';
import { ModelClient } from '../ai/types/agentSystem';

export interface TrainingResult {
  sessionId: string;
  content: any;
  filename: string;
}

async function saveSummary(type: 'short' | 'mid' | 'long', summary: string, sessionId?: string) {
  try {
    const { data, error } = await supabase
      .from('memory_summaries')
      .insert({
        summary_type: type,
        summary: summary,
        session_id: sessionId,
        processed: type === 'long'
      });

    if (error) throw error;
    console.log(`${type} summary saved to Supabase`);
    return data;
  } catch (error) {
    console.error(`Error saving ${type} summary:`, error);
    throw error;
  }
}

interface TrainingContext {
  sourceType: 'courses' | 'tweets' | 'default';
  customPrompt?: string;
}

function getTimestampFromFilename(filename: string, sourceType: 'courses' | 'tweets' | 'default'): string {
  try {
    if (sourceType === 'tweets') {
      // Format: 2024-12-03_6148906402437968826.md
      const datePart = filename.split('_')[0];
      return new Date(datePart).toISOString();
    } else {
      // Format: 2015-07-01.md (courses logs)
      return new Date(filename.split('.')[0]).toISOString();
    }
  } catch (error) {
    console.warn(`⚠️ Could not parse date from filename ${filename}, using current date`);
    return new Date().toISOString();
  }
}

function sanitizeContent(content: string): string {
  try {
    // Clean problematic characters
    return content
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uFFFD\uFFFE\uFFFF]/g, '') // Control characters
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/"/g, '\\"')   // Escape quotes
      .trim();
  } catch (error) {
    console.error('Error while cleaning content:', error);
    return content;
  }
}

export async function processTrainingData(
  content: string, 
  modelClient: ModelClient,
  filename: string,
  context?: TrainingContext
): Promise<TrainingResult> {
  const sessionId = `training_${filename}_${Date.now()}`;
  
  const extractorAgent = new ExtractorAgent(modelClient);
  
  // Define prompts specific to source type
  const prompts = {
    courses: `Analyze this course content to extract and synthesize key insights about Bitcoin and its ecosystem. Focus on:
    - **Technical Aspects**: Identify and explain the core technologies and protocols discussed, including their implications for the Bitcoin network.
    - **Cultural Context**: Highlight the community dynamics, key figures, and recurring themes that shape the Bitcoin culture.
    - **Knowledge Sharing**: Summarize the methods of knowledge transfer within the community, including any notable discussions or debates.
    - **Innovative Concepts**: Point out any new ideas, proposals, or innovations introduced in the course material that could impact the future of Bitcoin.
    - **Real-World Applications**: Discuss how the concepts presented can be applied in real-world scenarios, including potential use cases and challenges.
    - **Memes and Cultural Elements**: Analyze any cultural references or memes that are significant to the Bitcoin community and their relevance to the content.
    
    Ensure clarity and conciseness in your summary, providing actionable insights that can enhance understanding and engagement with Bitcoin's technical and cultural landscape.`,
    
    tweets: `Analyze the following tweet from **Mavensbot** to extract key elements that define its persona, tone, and communication style:
    1. **Core Message**: What is the main purpose or theme of the tweet?  
    2. **Community Engagement**: How do likes, retweets, or comments reflect the tone or emotional impact?  
    3. **Cultural/Meme References**: Are there any pop culture or humorous elements, and how are they used?  
    4. **Technical or Market Insights**: What professional or industry-related insights are shared?  
    5. **Community Dynamics**: How does the content foster interaction, unity, or growth within Mavensbot's audience?  
    Focus on clarity and brevity in the summary.
    `,
    
    default: 'Analyze this content and extract key information about Bitcoin wizards'
  };

  try {
    console.log('🔍 Starting knowledge extraction...');
    const sanitizedContent = sanitizeContent(content);
    const extractionResult = await extractorAgent.run(sanitizedContent, {
      customPrompt: context?.customPrompt || prompts[context?.sourceType || 'default']
    });
    
    if (!extractionResult.success) {
      throw new Error(`Extraction failed for ${filename}: ${extractionResult.error}`);
    }

    const summary = extractionResult.output.summary?.toString() || '';

    // Use new function to get timestamp
    const timestamp = getTimestampFromFilename(filename, context?.sourceType || 'default');

    await addCryptoKnowledge([
      { role: 'system', content: `Training data extraction from ${filename}` },
      { role: 'user', content: summary }
    ], { 
      metadata: { 
        type: 'short_term', 
        sessionId,
        source: filename,
        timestamp: timestamp
      }
    });
    
    await saveSummary('short', summary, sessionId);
    console.log('✅ Short-term memory stored');

    return {
      sessionId,
      content: summary,
      filename
    };

  } catch (error) {
    console.error(`❌ Training process failed for ${filename}:`, error);
    throw error;
  }
}

export async function processMidTermBatch(
  shortTermResults: any[], 
  modelClient: ModelClient,
  batchSessionId: string
) {
  console.log(`🔄 Generating mid-term summary for batch ${batchSessionId}...`);
  
  const summaryAgent = new SummaryAgent(modelClient);
  
  try {
    // Combine short term results
    const combinedContent = shortTermResults.map(r => r.content);
    
    // Generate mid-term summary
    const midTermSummary = await summaryAgent.run(JSON.stringify({
      type: 'summarize',
      content: combinedContent
    }));

    if (midTermSummary.success) {
      // Store mid-term summary in wizard_knowledge
      await addCryptoKnowledge([
        { role: 'system', content: 'Batch training summary' },
        { role: 'assistant', content: midTermSummary.output.condensed_summary }
      ], { 
        metadata: { 
          type: 'mid_term', 
          sessionId: batchSessionId,
          source: 'batch_summary',
          timestamp: new Date().toISOString()
        }
      });
      
        // Store also in memory_summaries table
      await saveSummary('mid', midTermSummary.output.condensed_summary, batchSessionId);
      console.log('✅ Mid-term summary stored in both wizard_knowledge and memory_summaries');
    }

  } catch (error) {
    console.error('❌ Mid-term processing failed:', error);
    throw error;
  }
}

export async function generateFinalLongTerm(modelClient: ModelClient) {
  console.log('🔄 Generating final long-term consolidation...');
  
  const summaryAgent = new SummaryAgent(modelClient);

  try {
    const { data: midTermSummaries, error } = await supabase
      .from('memory_summaries')
      .select('summary')
      .eq('summary_type', 'mid')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const longTermSummary = await summaryAgent.run(JSON.stringify({
      type: 'consolidate',
      content: midTermSummaries.map(s => s.summary)
    }));

    if (longTermSummary.success) {
      // Store in crypto_knowledge with full metadata
      await addCryptoKnowledge([
        { role: 'system', content: 'Final learning consolidation' },
        { role: 'assistant', content: longTermSummary.output.condensed_summary }
      ], { 
        metadata: { 
          type: 'long_term',
          source: 'final_consolidation',
          timestamp: new Date().toISOString()
        }
      });
      
      // Store also in memory_summaries
      await saveSummary('long', longTermSummary.output.condensed_summary);
      console.log('✅ Long-term summary stored in both crypto_knowledge and memory_summaries');
    }

  } catch (error) {
    console.error('❌ Long-term processing failed:', error);
    throw error;
  }
} 