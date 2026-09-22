import { NextRequest, NextResponse } from "next/server"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { resolveApplicationErrorResponse } from "src/lib/helpers/api/application-error-response"
import { Metric } from "src/services/metric/Metric"

export async function GET(request: NextRequest): Promise<Response> {
  return executeRequestWithContext(request, async ({ companyId }) => {
    const metric = new Metric()
    const metrics = await metric.getMetrics(companyId)
    return NextResponse.json(metrics)
  }, (error) => resolveApplicationErrorResponse(error, { request, operation: "fetch metrics", resource: "metrics", workflow: "query", unexpectedMessage: apiResponseMessages.metrics.loadFailed }))
}
