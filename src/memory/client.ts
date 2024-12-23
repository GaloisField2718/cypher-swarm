import { MemoryClient } from 'mem0ai';
import { Logger } from '../utils/logger';

// Throw error early if API key is missing
const apiKey = process.env.MEM0_API_KEY;
if (!apiKey) throw new Error('MEM0_API_KEY environment variable is required');

// Check for project name in environment variables
const projectId = process.env.MEM0_PROJECT_ID;
const organizationId = process.env.MEM0_ORGANIZATION_ID;

console.log('MEM0_PROJECT_ID from env:', projectId); // Debug log
console.log('MEM0_ORGANIZATION_ID from env:', organizationId); // Debug log
// Configure client with optional project name
const clientConfig: { apiKey: string;organizationId?: string; projectId?: string  } = {
    apiKey: apiKey,
};

if (projectId?.trim()) {
    clientConfig.projectId = projectId.trim();
    console.log(`Initializing mem0 client with project: ${projectId}`);
    console.log('Client config:', clientConfig); // Debug log
} else {
    console.log('Initializing mem0 client with default project');
}

if (organizationId?.trim()) {
    clientConfig.organizationId = organizationId.trim();
    console.log(`Initializing mem0 client with organization: ${organizationId}`);
    console.log('Client config:', clientConfig); // Debug log
} else {
    console.log('Initializing mem0 client with default organization');
}

// Export the configured client
export const client = new MemoryClient(clientConfig);

// Verify client configuration
console.log('Client config:', clientConfig); // Debug log