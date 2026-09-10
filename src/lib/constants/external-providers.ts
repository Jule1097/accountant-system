export const externalProviderOrigins = {
  gcpCloudRunApi: "https://run.googleapis.com",
  gcpOAuthToken: "https://oauth2.googleapis.com",
  gcpMetadata: "http://metadata.google.internal",
} as const

export const gcpWorkflowConfigPatterns = {
  projectId: /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
  region: /^[a-z0-9]+(?:-[a-z0-9]+)+$/,
  jobName: /^[a-z][a-z0-9-]{0,61}[a-z0-9]$/,
} as const

export const externalProviderValidationMessages = {
  invalidGcpWorkflowConfiguration: "Invalid GCP workflow configuration",
} as const
