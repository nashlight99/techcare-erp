import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, full_name, password_hash, role, store_id, permissions, is_active')
          .eq('email', credentials.email.toLowerCase().trim())
          .single()

        if (error) {
          console.error('[Auth] Supabase error:', error.message)
          return null
        }
        if (!user || !user.is_active) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id).then(() => {})

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          storeId: user.store_id,
          permissions: user.permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.storeId = (user as any).storeId
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.storeId = token.storeId as string | null
      session.user.permissions = token.permissions as any
      return session
    },
    async redirect({ url, baseUrl }) {
      // Block external redirects (open redirect prevention)
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/customers`
    },
  },
}

declare module 'next-auth' {
  interface User {
    role: string
    storeId: string | null
    permissions: Record<string, boolean>
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      storeId: string | null
      permissions: Record<string, boolean>
    }
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    storeId: string | null
    permissions: Record<string, boolean>
  }
}
