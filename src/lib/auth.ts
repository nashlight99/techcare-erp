import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
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
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, password_hash, role, store_id, permissions, is_active')
          .eq('email', credentials.email)
          .single()
        if (!user || !user.is_active) return null
        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null
        await supabaseAdmin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)
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
