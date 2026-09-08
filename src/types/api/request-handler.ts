import type { RequestContext } from "src/types/auth/request-context"

export type RequestContextResolver = (request: Request) => Promise<RequestContext>
export type RequestErrorResolver = (error: unknown) => Response
export type RequestOperation = (context: RequestContext) => Promise<Response>
