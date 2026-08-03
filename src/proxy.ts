import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Redis } from '@upstash/redis'

// Initialize Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  // 1. CORS Validation
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

  if (origin && allowedOrigins.includes(origin)) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
  }
  supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-company-id')

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: supabaseResponse.headers, status: 204 })
  }

  // If not an API route, just return early
  if (!pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // 2. Rate Limiting (100 req / minute)
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const windowMs = 60 * 1000 // 1 minute
  const limit = 100

  const currentKey = `ratelimit:${ip}:${Math.floor(Date.now() / windowMs)}`
  const reqCount = await redis.incr(currentKey)
  if (reqCount === 1) {
    await redis.expire(currentKey, 60)
  }

  if (reqCount > limit) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: supabaseResponse.headers })
  }

  // 3. Supabase Authentication & Session Refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: supabaseResponse.headers })
  }

  // 4. Company Association Check (x-company-id)
  let activeCompanyId = request.headers.get('x-company-id')

  if (activeCompanyId) {
    const { data: userCompany, error } = await supabase
      .from('user_company')
      .select('companyId')
      .eq('userId', user.id)
      .eq('companyId', activeCompanyId)
      .single()

    if (error || !userCompany) {
      return NextResponse.json({ error: 'Forbidden: User does not belong to this company' }, { status: 403, headers: supabaseResponse.headers })
    }
  } else {
    // Infer it if the user has only one company
    const { data: userCompanies, error } = await supabase
      .from('user_company')
      .select('companyId')
      .eq('userId', user.id)

    if (!error && userCompanies && userCompanies.length === 1) {
      activeCompanyId = userCompanies[0].companyId
      // Append the inferred company ID to the request headers
      request.headers.set('x-company-id', activeCompanyId as string)
      supabaseResponse = NextResponse.next({
        request: {
          headers: request.headers, // Request headers now include x-company-id
        },
      })
      supabaseResponse.headers.set('x-company-id', activeCompanyId as string) // Also set on response
    } else {
      return NextResponse.json({ error: 'Bad Request: x-company-id header is missing and could not be inferred' }, { status: 400, headers: supabaseResponse.headers })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
