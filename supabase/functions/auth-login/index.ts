// Supabase Edge Function: User Login
// POST /functions/v1/auth-login

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'
import { sign, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoginRequest {
  email: string
  password: string
  tenantSlug: string
}

interface LoginResponse {
  success: boolean
  token?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    permissions: string[]
  }
  tenant?: {
    id: string
    name: string
    slug: string
    uiConfig: any
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, tenantSlug }: LoginRequest = await req.json()

    // Validate input
    if (!email || !password || !tenantSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' } as LoginResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('id, name, slug, ui_config, status, features')
      .eq('slug', tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tenant not found' } as LoginResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (tenant.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, error: 'Tenant is not active' } as LoginResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user by email and tenant
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, password_hash, first_name, last_name, role, permissions, status, email_verified')
      .eq('tenant_id', tenant.id)
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' } as LoginResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (user.status !== 'active') {
      return new Response(
        JSON.stringify({ success: false, error: 'Account is not active' } as LoginResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      // Log failed login attempt
      await supabaseClient.from('audit_logs').insert({
        tenant_id: tenant.id,
        user_id: user.id,
        action: 'login_failed',
        resource_type: 'user',
        resource_id: user.id,
        details: { reason: 'invalid_password', ip: req.headers.get('x-forwarded-for') }
      })

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' } as LoginResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate JWT tokens
    const jwtSecret = Deno.env.get('JWT_SECRET')!
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )

    const now = Math.floor(Date.now() / 1000)
    const tokenExpiry = now + (24 * 60 * 60) // 24 hours
    const refreshExpiry = now + (7 * 24 * 60 * 60) // 7 days

    const token = await sign(
      { 
        sub: user.id,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        email: user.email,
        role: user.role,
        iat: now,
        exp: tokenExpiry
      },
      key
    )

    const refreshToken = await sign(
      {
        sub: user.id,
        type: 'refresh',
        iat: now,
        exp: refreshExpiry
      },
      key
    )

    // Create session
    const { error: sessionError } = await supabaseClient
      .from('user_sessions')
      .insert({
        user_id: user.id,
        tenant_id: tenant.id,
        token_hash: await bcrypt.hash(token, 10),
        refresh_token_hash: await bcrypt.hash(refreshToken, 10),
        expires_at: new Date(tokenExpiry * 1000).toISOString(),
        refresh_expires_at: new Date(refreshExpiry * 1000).toISOString(),
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent')
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
    }

    // Update last login
    await supabaseClient
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: req.headers.get('x-forwarded-for'),
        login_count: supabaseClient.rpc('increment_login_count', { user_id: user.id })
      })
      .eq('id', user.id)

    // Log successful login
    await supabaseClient.from('audit_logs').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      action: 'login_success',
      resource_type: 'user',
      resource_id: user.id,
      details: { ip: req.headers.get('x-forwarded-for') }
    })

    const response: LoginResponse = {
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        permissions: user.permissions
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        uiConfig: tenant.ui_config
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' } as LoginResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
