import { requireRequestContext } from "src/lib/helpers/auth/request-context"
import { resolveRequestContextError } from "src/lib/helpers/auth/request-context-response"
import type { RequestContextResolver, RequestErrorResolver, RequestOperation } from "src/types/api/request-handler"

export async function executeRequestWithContext(request: Request, operation: RequestOperation, resolveError: RequestErrorResolver, resolveContext: RequestContextResolver = requireRequestContext): Promise<Response> {
  try {
    return await operation(await resolveContext(request))
  } catch (error) {
    return resolveRequestContextError(error) ?? resolveError(error)
  }
}
