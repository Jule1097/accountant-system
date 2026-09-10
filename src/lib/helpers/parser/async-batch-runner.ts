import { externalProviderValidationMessages, externalProviderOrigins, gcpWorkflowConfigPatterns } from "src/lib/constants/external-providers";
import { AsyncBatchWorkloadKind, GcpWorkflowConfig, WorkflowDriver } from "src/types/parser/async-batch-runner";

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

function isValidGcpWorkflowConfig(config: GcpWorkflowConfig): boolean {
  return gcpWorkflowConfigPatterns.projectId.test(config.projectId) && gcpWorkflowConfigPatterns.region.test(config.region) && gcpWorkflowConfigPatterns.jobName.test(config.parserJobName) && gcpWorkflowConfigPatterns.jobName.test(config.persistenceJobName);
}

function validateGcpWorkflowConfig(config: GcpWorkflowConfig): void {
  if (!isValidGcpWorkflowConfig(config)) throw new Error(externalProviderValidationMessages.invalidGcpWorkflowConfiguration);
}

export function getWorkflowDriver(): WorkflowDriver {
  return normalizeWorkflowDriver(process.env.WORKFLOW_DRIVER);
}

export function getGcpWorkflowConfig(): GcpWorkflowConfig {
  const config = {
    projectId: getRequiredGcpValue("GCP_PROJECT_ID"),
    region: getRequiredGcpValue("GCP_REGION"),
    parserJobName: getRequiredGcpValue("GCP_PARSER_JOB_NAME"),
    persistenceJobName: getRequiredGcpValue("GCP_PERSISTENCE_JOB_NAME"),
  };
  validateGcpWorkflowConfig(config);
  return config;
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
  validateGcpWorkflowConfig(config);
  const jobName = getGcpJobName(workload, config);
  return new URL(`/v2/projects/${encodeURIComponent(config.projectId)}/locations/${encodeURIComponent(config.region)}/jobs/${encodeURIComponent(jobName)}:run`, externalProviderOrigins.gcpCloudRunApi).toString();
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
