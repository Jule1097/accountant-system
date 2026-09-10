import { buildGcpJobRunUrl, getGcpWorkflowConfig } from "src/lib/helpers/parser/async-batch-runner";
import { GcpWorkflowConfig } from "src/types/parser/async-batch-runner";

describe("external provider URL security boundary", () => {
  const originalEnv = process.env;
  const validConfig: GcpWorkflowConfig = {
    projectId: "project-id",
    region: "us-central1",
    parserJobName: "parser-job",
    persistenceJobName: "persistence-job",
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GCP_PROJECT_ID = validConfig.projectId;
    process.env.GCP_REGION = validConfig.region;
    process.env.GCP_PARSER_JOB_NAME = validConfig.parserJobName;
    process.env.GCP_PERSISTENCE_JOB_NAME = validConfig.persistenceJobName;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("builds Cloud Run URLs only under the Google API origin", () => {
    const url = new URL(buildGcpJobRunUrl(validConfig, "parser"));

    expect(url.origin).toBe("https://run.googleapis.com");
    expect(url.pathname).toBe("/v2/projects/project-id/locations/us-central1/jobs/parser-job:run");
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  });

  it.each([
    ["projectId", "project/evil"],
    ["projectId", "project?target=internal"],
    ["region", "us-central1/evil"],
    ["region", "us-central1?target=internal"],
    ["parserJobName", "parser-job/evil"],
    ["parserJobName", "parser-job?target=internal"],
  ] as const)("rejects unsafe GCP %s values: %s", (field, value) => {
    expect(() => buildGcpJobRunUrl({ ...validConfig, [field]: value }, "parser")).toThrow("Invalid GCP workflow configuration");
  });

  it("rejects unsafe GCP values loaded from environment", () => {
    process.env.GCP_PROJECT_ID = "project/evil";

    expect(() => getGcpWorkflowConfig()).toThrow("Invalid GCP workflow configuration");
  });
});
