import '@testing-library/jest-dom'

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'mock-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key'
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'redis://mock:6379'
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token'
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock-gemini-key'
process.env.VOUCHER_PARSER_TEMP_BUCKET = process.env.VOUCHER_PARSER_TEMP_BUCKET || 'mock-temp-bucket'

