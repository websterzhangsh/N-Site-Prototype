// Supabase Edge Function: Auth Middleware (for validating tokens)
// POST /functions/v1/auth-middleware

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TokenPayload {
  sub: string
  tenant_id: string
  tenant_slug: string
  email: string
  role: string
  exp: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    const jwtSecret = Deno.env.get('JWT_SECRET')!
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    let payload: TokenPayload
    try {
      payload = await verify(token, key) as TokenPayload
    } catch {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with tenant context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Set tenant context for RLS
    await supabaseClient.rpc('set_tenant_context', {
      tenant_id: payload.tenant_id,
      user_id: payload.sub
    })

    // Get user details
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, email, first_name, last_name, role, permissions, status')
      .eq('id', payload.sub)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (user.status !== 'active') {
      return new Response(
        JSON.stringify({ valid: false, error: 'User account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant details
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('id, name, slug, ui_config, features')
      .eq('id', payload.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        valid: true,
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
          uiConfig: tenant.ui_config,
          features: tenant.features
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auth middleware error:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
