

import { supabase } from './supabaseClient';
import { NotificationSettings, AppNotification } from '../types';
import { DEFAULT_NOTIFICATION_THRESHOLDS } from '../constants';
import { calculateDays } from './contractService';

export interface PendingNotification {
  identifier: string;
  object: string;
  daysRemaining: number;
  alertReason: string;
}

export const getPendingNotificationsForToday = async (): Promise<PendingNotification[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.functions.invoke('check-contracts', {
      body: { action: 'get_pending_list' },
    });

    if (error) {
      console.error("Edge function 'get_pending_list' error:", error);
      throw error;
    }

    // A função retorna { pending: [...] }
    return data.pending || [];

  } catch (error) {
    console.error("Failed to fetch pending notifications from server:", error);
    // Retorna vazio em caso de falha, para não quebrar a UI.
    return [];
  }
};


export const triggerNotifications = async (forceTest = false): Promise<{ success: boolean; message: string; version?: string }> => {
  if (!supabase) return { success: false, message: "Supabase não configurado" };

  let serverResponse = null;
  let shouldUseFallback = false;
  let fallbackReason = "";

  try {
    const { data, error } = await supabase.functions.invoke('check-contracts', {
      body: { action: 'check_and_notify', force: forceTest },
    });

    if (error) {
      shouldUseFallback = true;
      fallbackReason = `Erro Edge: ${error.message}`;
    } else if (!data || !data.version || !data.version.startsWith('v20')) {
      // Exige v20
      shouldUseFallback = true;
      fallbackReason = `Versão do servidor (${data?.version || 'Antiga'}) é diferente da exigida (v20). Faça o deploy.`;
    } else {
      serverResponse = data;
    }

  } catch (err: any) {
    shouldUseFallback = true;
    fallbackReason = `Falha Rede: ${err.message}`;
  }

  if (!shouldUseFallback && serverResponse) {
    return serverResponse;
  }

  console.warn(`[FALLBACK] ${fallbackReason}`);
  try {
    const stats = await generateNotificationsLocally(forceTest);
    return {
      success: true,
      message: `[MODO LOCAL / CONTINGÊNCIA]\nMotivo: ${fallbackReason}\n\nExecução Local: ${stats.analyzed} docs analisados.`,
      version: 'fallback'
    };
  } catch (localErr: any) {
    return { success: false, message: `Erro Total: ${localErr?.message}` };
  }
};

const generateNotificationsLocally = async (forceTest: boolean) => {
  if (!supabase) return { analyzed: 0, generated: 0 };
  try {
    let thresholds = [...DEFAULT_NOTIFICATION_THRESHOLDS];
    try {
      const settings = await getNotificationSettings();
      if (settings?.thresholds) thresholds = settings.thresholds;
    } catch (e) { }

    const { data: contracts } = await supabase.from('contracts').select('*');
    const { data: minutes } = await supabase.from('minutes').select('*');

    const notificationsToInsert: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let analyzedCount = 0;

    const checkDoc = (doc: any, type: string, idField: string) => {
      if (!doc.end_date) return;
      analyzedCount++;
      const dateStr = String(doc.end_date).trim();
      let endDate: Date | null = null;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        endDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      if (!endDate || isNaN(endDate.getTime())) return;

      const diffTime = endDate.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const shouldNotify = thresholds.includes(days);

      if (shouldNotify) {
        const identifier = doc[idField] || `${doc.number}/${doc.year}`;
        notificationsToInsert.push({
          department: doc.department,
          title: `Alerta Local: ${type} ${identifier}`,
          message: `Objeto: "${doc.object}". Vencimento: ${new Date(doc.end_date).toLocaleDateString('pt-BR')} (${days} dias).`,
          is_read: false
        });
      }
    };

    contracts?.forEach(c => checkDoc(c, 'Contrato', 'contract_id'));
    minutes?.forEach(m => checkDoc(m, 'Ata', 'minute_id'));

    if (notificationsToInsert.length > 0) {
      // Para simulações, não vamos poluir o banco de dados com notificações antigas
      // Apenas inserimos se não for um teste forçado ou se houver poucas notificações para não sobrecarregar
      if (!forceTest || notificationsToInsert.length < 50) {
        await supabase.from('notifications').insert(notificationsToInsert);
      }
    }
    return { analyzed: analyzedCount, generated: notificationsToInsert.length };
  } catch (localError) {
    return { analyzed: 0, generated: 0 };
  }
};

export const getAppNotifications = async (department: string, isAdmin: boolean): Promise<AppNotification[]> => {
  if (!supabase) return [];
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (!isAdmin) query = query.eq('department', department);
  const { data } = await query;
  return data as AppNotification[] || [];
};

export const markNotificationAsRead = async (id: number) => {
  if (!supabase) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
};

export const markAllAsRead = async (ids: number[]) => {
  if (!supabase || ids.length === 0) return;
  await supabase.from('notifications').update({ is_read: true }).in('id', ids);
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.from('notification_settings').select('*').single();
  if (error) return { id: 1, thresholds: [...DEFAULT_NOTIFICATION_THRESHOLDS], additional_emails: [] };
  return data as NotificationSettings;
};

export const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
  if (!supabase) throw new Error("Supabase não configurado");
  const { data } = await supabase.from('notification_settings').upsert({
    id: 1,
    thresholds: settings.thresholds || [],
    additional_emails: settings.additional_emails || [],
    updated_at: new Date().toISOString()
  }).select();
};

export const checkEmailConfigStatus = async () => { return { active: true, sandbox: false }; };

/**
 * Envia uma notificação manual para um departamento específico
 * Usado para notificar sobre eventos importantes do fluxo PGM
 */
export const sendAppNotification = async (params: {
  department: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> => {
  if (!supabase) throw new Error("Supabase não configurado");

  await supabase.from('notifications').insert({
    department: params.department,
    title: params.title,
    message: params.message,
    link: params.link,
    is_read: false
  });
};