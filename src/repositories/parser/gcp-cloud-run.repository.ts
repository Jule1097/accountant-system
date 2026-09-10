import { buildGcpJobRunUrl, getGcpWorkflowConfig } from "src/lib/helpers/parser/async-batch-runner";
import { getGcpWorkflowAccessToken } from "src/lib/helpers/parser/gcp-workflow-auth";
import { AsyncBatchWorkloadKind } from "src/types/parser/async-batch-runner";

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

    const response = await fetch(jobRunUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: buildRunRequestBody(batchId),
    });

    if (response.ok) {
      return;
    }

    throw new Error(`Failed to trigger GCP ${workload} job: ${response.status}`);
  }
}
