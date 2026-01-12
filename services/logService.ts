
import { supabase } from './supabaseClient';
import { AuditLog } from '../types';

export const logAction = async (
  action: AuditLog['action'],
  resourceType: AuditLog['resource_type'],
  resourceId: string,
  details: string
) => {
  if (!supabase) return;

  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || 'Sistema/Desconhecido';

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_email: userEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details
      }]);

    if (error) {
      console.error('Falha ao criar log no banco:', error.message || error);
    }
  } catch (err: any) {
    console.error('Erro de exceção ao registrar log:', err.message || err);
  }
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500); // Limite de segurança para performance

  if (error) {
    console.error('Erro ao buscar logs:', error.message || error);
    throw new Error(error.message);
  }

  return data as AuditLog[];
};
