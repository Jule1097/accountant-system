import { AsyncBatchWorkloadKind, GcpWorkflowConfig, WorkflowDriver } from "src/types/async-batch-runner";

function normalizeWorkflowDriver(value: string | undefined): WorkflowDriver {
  if (value === "gcp") {
    return "gcp";
  }

  return "local";
}

function getRequiredGcpValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getRequiredBatchIdArgValue(index: number, argv: string[]): string {
  const value = argv[index];

  if (!value) {
    throw new Error("Missing --batch-id value");
  }

  return value;
}

export function getWorkflowDriver(): WorkflowDriver {
  return normalizeWorkflowDriver(process.env.WORKFLOW_DRIVER);
}

export function getGcpWorkflowConfig(): GcpWorkflowConfig {
  return {
    projectId: getRequiredGcpValue("GCP_PROJECT_ID"),
    region: getRequiredGcpValue("GCP_REGION"),
    parserJobName: getRequiredGcpValue("GCP_PARSER_JOB_NAME"),
    persistenceJobName: getRequiredGcpValue("GCP_PERSISTENCE_JOB_NAME"),
  };
}

export function validateWorkflowDriverConfiguration(): void {
  if (getWorkflowDriver() !== "gcp") {
    return;
  }

  getGcpWorkflowConfig();
}

export function getGcpJobName(workload: AsyncBatchWorkloadKind, config: GcpWorkflowConfig): string {
  return workload === "parser" ? config.parserJobName : config.persistenceJobName;
}

export function buildGcpJobRunUrl(config: GcpWorkflowConfig, workload: AsyncBatchWorkloadKind): string {
  const jobName = getGcpJobName(workload, config);
  return `https://run.googleapis.com/v2/projects/${config.projectId}/locations/${config.region}/jobs/${jobName}:run`;
}

export function parseBatchIdArg(argv: string[]): string {
  const flagIndex = argv.findIndex((value) => value === "--batch-id");

  if (flagIndex >= 0) {
    return getRequiredBatchIdArgValue(flagIndex + 1, argv);
  }

  const prefixedArg = argv.find((value) => value.startsWith("--batch-id="));

  if (prefixedArg) {
    return prefixedArg.slice("--batch-id=".length);
  }

  throw new Error("Missing --batch-id argument");
}
