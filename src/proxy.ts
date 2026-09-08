import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Redis } from '@upstash/redis'

function getProxyRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url) throw new Error('Missing UPSTASH_REDIS_REST_URL')
  if (!token) throw new Error('Missing UPSTASH_REDIS_REST_TOKEN')
  return new Redis({ url, token })
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next()
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  if (origin && allowedOrigins.includes(origin)) supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
  supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-company-id')
  const reqContentType = request.headers.get('content-type')
  if (reqContentType) supabaseResponse.headers.set('content-type', reqContentType)
  else supabaseResponse.headers.delete('content-type')
  if (request.method === 'OPTIONS') return new NextResponse(null, { headers: supabaseResponse.headers, status: 204 })
  const isApiRoute = pathname.startsWith('/api/')
  const isLoginRoute = pathname === '/login'
  if (isApiRoute) {
    const redis = getProxyRedisClient()
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const windowMs = 60 * 1000
    const limit = 100
    const currentKey = `ratelimit:${ip}:${Math.floor(Date.now() / windowMs)}`
    const reqCount = await redis.incr(currentKey)
    if (reqCount === 1) await redis.expire(currentKey, 60)
    if (reqCount > limit) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: supabaseResponse.headers })
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
          supabaseResponse = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !isLoginRoute) return NextResponse.redirect(new URL('/login', request.url))
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
