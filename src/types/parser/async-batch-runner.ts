export type WorkflowDriver = "local" | "gcp";

export type AsyncBatchWorkloadKind = "parser" | "persistence";

export interface AsyncBatchRunner {
  triggerParserBatch(batchId: string): Promise<void>;
  triggerPersistenceBatch(batchId: string): Promise<void>;
}

export interface GcpWorkflowConfig {
  projectId: string;
  region: string;
  parserJobName: string;
  persistenceJobName: string;
}
