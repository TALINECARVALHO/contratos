
import { supabase } from './supabaseClient';
import { UserProfile, UserRole } from '../types';

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return null;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar perfil:", error.message);
      return {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as UserRole) || 'user',
        department: user.user_metadata?.department || 'GABINETE',
        name: user.user_metadata?.name || ''
      };
    }

    if (!data) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          role: (user.user_metadata?.role as UserRole) || 'user',
          department: user.user_metadata?.department || 'GABINETE',
          name: user.user_metadata?.name || ''
        }])
        .select()
        .single();
      return newProfile as UserProfile;
    }

    return data as UserProfile;
  } catch (e) {
    return null;
  }
};

export const getAllProfiles = async (): Promise<UserProfile[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('email');
  if (error) throw error;
  return data as UserProfile[];
};

export const updateUserProfile = async (id: string, updates: Partial<UserProfile>) => {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteUser = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
};

export const changeCurrentUserPassword = async (newPassword: string) => {
  if (!supabase) throw new Error("Supabase não configurado.");
  return await supabase.auth.updateUser({ password: newPassword });
};

export const createUser = async (params: { email: string; name?: string; password?: string; role: UserRole; department: string; permissions?: any }) => {
  if (!supabase) throw new Error("Supabase não configurado.");

  try {
    // IMPORTANTE: No SDK v2, se o status for non-2xx, 'error' será preenchido e 'data' será null.
    // A resposta do servidor fica em error.context
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: params,
    });

    if (error) {
      let errorMessage = error.message;

      // Tenta extrair a mensagem de erro detalhada do corpo da resposta HTTP
      // O Supabase SDK v2 coloca a resposta no campo context
      const httpError = error as any;
      if (httpError.context) {
        try {
          // Se for um objeto Response (padrão em muitos ambientes)
          if (typeof httpError.context.json === 'function') {
            const body = await httpError.context.json();
            if (body && body.error) errorMessage = body.error;
          }
          // Se o body já estiver disponível como texto/objeto
          else if (httpError.context.body) {
            const body = typeof httpError.context.body === 'string'
              ? JSON.parse(httpError.context.body)
              : httpError.context.body;
            if (body && body.error) errorMessage = body.error;
          }
        } catch (e) {
          console.warn("Não foi possível processar o corpo do erro da função:", e);
        }
      }

      // Tratamento para Função não encontrada
      if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found')) {
        throw new Error(
          "FUNÇÃO NÃO ENCONTRADA: A Edge Function 'create-user' não existe no Supabase.\n\nVá em 'Configurações > Status Funções' no sistema para copiar o código e criar a função."
        );
      }

      // Se a mensagem ainda for a genérica "non-2xx", aplicamos o nosso guia de solução amigável
      if (errorMessage.includes('non-2xx')) {
        throw new Error("Falha no servidor de criação (Erro 400/500). Causas prováveis:\n1. E-mail já cadastrado.\n2. Variável SUPABASE_SERVICE_ROLE_KEY não configurada no painel de Segredos do Supabase.\n3. Erro de sintaxe na função.");
      }

      throw new Error(errorMessage);
    }

    // Se o usuário foi criado com sucesso, vamos garantir que as permissões sejam salvas
    // Caso a Edge Function não esteja atualizada para salvar permissões, fazemos um update manual aqui.
    if (data?.user?.id && params.permissions) {
      await supabase.from('profiles').update({ permissions: params.permissions }).eq('id', data.user.id);
    }

    return data;
  } catch (err: any) {
    console.error("Erro detalhado na criação de usuário:", err);
    throw new Error(err.message || "Erro desconhecido na função de criação.");
  }
};
