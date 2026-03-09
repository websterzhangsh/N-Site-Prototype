// Supabase Edge Function: Get Tenant Configuration
// GET /functions/v1/tenant-config?slug=partner1

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TenantConfig {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  uiConfig: {
    primaryColor: string
    logoUrl: string | null
    faviconUrl: string | null
    customCss: string | null
    hiddenSections: string[]
    customSections: any[]
  }
  features: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing tenant slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tenant configuration
    const { data: tenant, error } = await supabaseClient
      .from('tenants')
      .select('id, name, slug, status, plan, ui_config, features')
      .eq('slug', slug)
      .single()

    if (error || !tenant) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (tenant.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Tenant is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const config: TenantConfig = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      uiConfig: tenant.ui_config,
      features: tenant.features
    }

    return new Response(
      JSON.stringify(config),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Tenant config error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
