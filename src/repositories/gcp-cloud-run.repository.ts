import { buildGcpJobRunUrl, getGcpWorkflowConfig } from "src/lib/helpers/async-batch-runner";
import { getGcpWorkflowAccessToken } from "src/lib/helpers/gcp-workflow-auth";
import { AsyncBatchWorkloadKind } from "src/types/async-batch-runner";

function buildRunRequestBody(batchId: string): string {
  return JSON.stringify({
    overrides: {
      containerOverrides: [
        {
          args: ["--batch-id", batchId],
        },
      ],
    },
  });
}

export class GcpCloudRunRepository {
  async runBatchJob(workload: AsyncBatchWorkloadKind, batchId: string): Promise<void> {
    const config = getGcpWorkflowConfig();
    const accessToken = await getGcpWorkflowAccessToken();
    const jobRunUrl = buildGcpJobRunUrl(config, workload);

    console.info("Triggering GCP batch job", {
      operation: "trigger-gcp-batch-job",
      workflowState: "triggering",
      providerName: "gcp",
      workload,
      batchId,
      projectId: config.projectId,
      region: config.region,
    });

    const response = await fetch(jobRunUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: buildRunRequestBody(batchId),
    });

    if (response.ok) {
      console.info("Triggered GCP batch job", {
        operation: "trigger-gcp-batch-job",
        workflowState: "triggered",
        providerName: "gcp",
        workload,
        batchId,
      });
      return;
    }

    const errorBody = await response.text();
    throw new Error(`Failed to trigger GCP ${workload} job: ${response.status} ${errorBody}`);
  }
}
