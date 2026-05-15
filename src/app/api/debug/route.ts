import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function GET() {
  const checks: Record<string, any> = {}

  // Check env vars are set (not their values)
  checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'NOT SET',
  }

  // Test Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await supabase
      .from('users')
      .select('id, email, is_active')
      .eq('email', 'admin@techcare.fr')
      .single()

    if (error) {
      checks.supabase = { ok: false, error: error.message, code: error.code }
    } else {
      checks.supabase = {
        ok: true,
        userFound: !!data,
        isActive: data?.is_active,
        hasPasswordHash: false, // will check below
      }

      // Check password hash exists
      if (data) {
        const { data: withHash } = await supabase
          .from('users')
          .select('password_hash')
          .eq('email', 'admin@techcare.fr')
          .single()
        checks.supabase.hasPasswordHash = !!withHash?.password_hash
        checks.supabase.hashPrefix = withHash?.password_hash?.substring(0, 7) ?? 'none'

        // Test bcrypt comparison
        try {
          const testResult = await bcrypt.compare('Admin1234!', withHash?.password_hash ?? '')
          checks.bcrypt = { passwordMatches: testResult }
        } catch (e: any) {
          checks.bcrypt = { error: e.message }
        }
      }
    }
  } catch (e: any) {
    checks.supabase = { ok: false, exception: e.message }
  }

  return NextResponse.json(checks)
}
