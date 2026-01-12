
// Added type declaration for Deno global to fix compiler errors
declare const Deno: any;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "ERRO DE CONFIGURAÇÃO: A variável SUPABASE_SERVICE_ROLE_KEY não foi encontrada nos 'Secrets' da Edge Function no painel do Supabase." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(url, serviceKey);
    let body: any = {}
    try {
      const text = await req.text()
      if (text) body = JSON.parse(text)
    } catch (e) { }

    if (body.test === true || body.action === 'test') {
      return new Response(JSON.stringify({ status: "online", version: "v10-ultra" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { email, password, role, department, name, permissions } = body
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Tenta criar o usuário no Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, department, name }
    })

    if (createError) {
      // Se o erro for que o usuário já existe, tentamos apenas atualizar o perfil dele
      if (createError.message.includes('already registered') || createError.status === 422) {
        // Opcional: Você pode buscar o usuário existente aqui se quiser consertar um perfil órfão
        return new Response(
          JSON.stringify({ error: "Este e-mail já está cadastrado no sistema de autenticação. Por favor, exclua-o no painel do Supabase (Auth > Users) para tentar novamente ou use outro e-mail." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: `Erro no Supabase Auth: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Garantia Manual (Caso o gatilho falhe ou demore)
    // Às vezes o gatilho do Postgres falha silenciosamente ou por falta de permissão.
    // Inserimos manualmente no perfil para garantir.
    // AGORA INCLUINDO AS PERMISSÕES
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        role: role || 'user',
        department: department || 'GABINETE',
        name: name || null,
        permissions: permissions || null
      });

      if (profileError) {
        console.error("Erro ao criar perfil manual (Gatilho pode ter falhado):", profileError.message);
        // Não travamos o retorno de sucesso aqui, pois o usuário de Auth já foi criado.
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Erro Interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
