import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next()

  const { pathname } = request.nextUrl

  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

  if (origin && allowedOrigins.includes(origin)) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
  }
  supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-company-id')

  const reqContentType = request.headers.get('content-type')
  if (reqContentType) {
    supabaseResponse.headers.set('content-type', reqContentType)
  } else {
    supabaseResponse.headers.delete('content-type')
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: supabaseResponse.headers, status: 204 })
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  const isApiRoute = pathname.startsWith('/api/')
  const isLoginRoute = pathname === '/login'

  if (isApiRoute) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const windowMs = 60 * 1000
    const limit = 100
    const currentKey = `ratelimit:${ip}:${Math.floor(Date.now() / windowMs)}`
    const reqCount = await redis.incr(currentKey)
    if (reqCount === 1) {
      await redis.expire(currentKey, 60)
    }

    if (reqCount > limit) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: supabaseResponse.headers })
    }

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: supabaseResponse.headers })
    }

    const isExempt = pathname === '/api/companies' || pathname.startsWith('/api/auth')
    if (isExempt) {
      return supabaseResponse
    }

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
      const { data: userCompanies, error } = await supabase
        .from('user_company')
        .select('companyId')
        .eq('userId', user.id)

      if (!error && userCompanies && userCompanies.length === 1) {
        activeCompanyId = userCompanies[0].companyId
        request.headers.set('x-company-id', activeCompanyId as string)
        supabaseResponse = NextResponse.next({
          request,
        })
        supabaseResponse.headers.set('x-company-id', activeCompanyId as string)
      } else {
        return NextResponse.json({ error: 'Bad Request: x-company-id header is missing and could not be inferred' }, { status: 400, headers: supabaseResponse.headers })
      }
    }
  } else {
    if (!user && !isLoginRoute) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
