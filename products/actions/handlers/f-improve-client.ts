/**
 * f.improve API Client
 * 
 * Communicates with the f.improve backend (Elixir/Phoenix).
 */

export class FImproveClient {
  private baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Create a new improvement job
   */
  async createJob(params: {
    user_id: string;
    code: string;
    benchmark: string;
    goal: string;
    iterations: number;
  }): Promise<{ id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get job status and results
   */
  async getJob(jobId: string): Promise<{
    id: string;
    status: string;
    best_code?: string;
    improvement_percent?: number;
    iterations_used?: number;
    experiments?: any[];
  }> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get job: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Wait for job completion
   */
  async waitForJob(jobId: string, options: {
    timeout: number;
    pollInterval: number;
  }): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < options.timeout) {
      const job = await this.getJob(jobId);
      
      if (job.status === 'completed' || job.status === 'failed') {
        // Get full results
        const experiments = await this.getExperiments(jobId);
        return {
          ...job,
          experiments,
          iterations_used: experiments.length,
        };
      }
      
      await sleep(options.pollInterval);
    }
    
    throw new Error('Job timed out');
  }
  
  /**
   * Get experiments for a job
   */
  async getExperiments(jobId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/experiments`);
    
    if (!response.ok) {
      throw new Error(`Failed to get experiments: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.experiments || [];
  }
  
  /**
   * Call MCP endpoint
   */
  async callMcp(tool: string, params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: tool, arguments: params },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
  }
  
  /**
   * Stream job updates via SSE
   */
  streamJob(jobId: string, onEvent: (event: string, data: any) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/api/jobs/${jobId}/stream`);
    
    eventSource.addEventListener('experiment', (e) => {
      onEvent('experiment', JSON.parse(e.data));
    });
    
    eventSource.addEventListener('completed', (e) => {
      onEvent('completed', JSON.parse(e.data));
      eventSource.close();
    });
    
    eventSource.addEventListener('error', (e) => {
      onEvent('error', e);
      eventSource.close();
    });
    
    // Return cleanup function
    return () => eventSource.close();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}