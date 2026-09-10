import { isIP } from "node:net"
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { Redis } from "@upstash/redis"
import { httpMethods, httpStatusCodes } from "src/lib/constants/http"
import { rateLimitMaxRequests, rateLimitWindowMs, rateLimitWindowSeconds, securityHeaders } from "src/lib/constants/security"

function getProxyRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url) throw new Error("Missing UPSTASH_REDIS_REST_URL")
  if (!token) throw new Error("Missing UPSTASH_REDIS_REST_TOKEN")
  return new Redis({ url, token })
}

function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter((value) => value && value !== "*")
}

function isUnsafeMethod(method: string): boolean {
  return [httpMethods.post, httpMethods.put, httpMethods.patch, httpMethods.delete].includes(method as typeof httpMethods.post | typeof httpMethods.put | typeof httpMethods.patch | typeof httpMethods.delete)
}

function resolveRateLimitIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",").map((value) => value.trim()) || []
  const validIp = forwardedFor.find((value) => isIP(value) > 0)
  return validIp || "unknown"
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(...securityHeaders.contentTypeOptions)
  response.headers.set(...securityHeaders.frameOptions)
  response.headers.set(...securityHeaders.referrerPolicy)
  return response
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = applySecurityHeaders(NextResponse.next())
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin")
  const allowedOrigins = getAllowedOrigins()
  if (origin && allowedOrigins.includes(origin)) {
    supabaseResponse.headers.set("Access-Control-Allow-Origin", origin)
    supabaseResponse.headers.set("Vary", "Origin")
  }
  supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-company-id")
  const reqContentType = request.headers.get("content-type")
  if (reqContentType) supabaseResponse.headers.set("content-type", reqContentType)
  else supabaseResponse.headers.delete("content-type")
  if (isUnsafeMethod(request.method) && (!origin || !allowedOrigins.includes(origin))) {
    return applySecurityHeaders(NextResponse.json({ error: "Origen no permitido." }, { status: httpStatusCodes.forbidden, headers: supabaseResponse.headers }))
  }
  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.includes(origin)) return applySecurityHeaders(NextResponse.json({ error: "Origen no permitido." }, { status: httpStatusCodes.forbidden, headers: supabaseResponse.headers }))
    return applySecurityHeaders(new NextResponse(null, { headers: supabaseResponse.headers, status: httpStatusCodes.noContent }))
  }
  const isApiRoute = pathname.startsWith("/api/")
  const isLoginRoute = pathname === "/login"
  if (isApiRoute) {
    const redis = getProxyRedisClient()
    const rateLimitIdentity = resolveRateLimitIp(request)
    const currentKey = `ratelimit:${rateLimitIdentity}:${Math.floor(Date.now() / rateLimitWindowMs)}`
    const reqCount = await redis.incr(currentKey)
    if (reqCount === 1) await redis.expire(currentKey, rateLimitWindowSeconds)
    if (reqCount > rateLimitMaxRequests) return applySecurityHeaders(NextResponse.json({ error: "Demasiadas solicitudes." }, { status: httpStatusCodes.tooManyRequests, headers: supabaseResponse.headers }))
    return supabaseResponse
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = applySecurityHeaders(NextResponse.next())
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isLoginRoute) return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)))
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
