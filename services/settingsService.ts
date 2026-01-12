import { supabase } from './supabaseClient';
import { DynamicSetting } from '../types';
export type { DynamicSetting };

const handleSupabaseError = (error: any) => {
  const message = error.message || "";
  // Erro 42P01 ou mensagem de cache indicam que a tabela não existe fisicamente
  if (error.code === '42P01' || message.includes("Could not find the table") || message.includes("directory 'public' in the schema cache")) {
    return new Error("Tabelas de parâmetros não encontradas no Banco de Dados. Por favor, vá em 'Configurações > Banco de Dados', copie o script SQL e execute-o no SQL Editor do seu Supabase.");
  }
  return new Error(message || "Erro desconhecido ao acessar parâmetros.");
};

// Departamentos
export const fetchDepartments = async (): Promise<DynamicSetting[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw handleSupabaseError(error);
  return data || [];
};

export const createDepartment = async (name: string) => {
  if (!supabase) return;
  const { data, error } = await supabase.from('departments').insert([{ name }]).select().single();
  if (error) throw handleSupabaseError(error);
  return data;
};

export const updateDepartment = async (id: string, name: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('departments').update({ name }).eq('id', id);
  if (error) throw handleSupabaseError(error);
};

export const deleteDepartment = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
};

// Tipos de Contrato
export const fetchDocumentTypes = async (): Promise<DynamicSetting[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('document_types').select('*').order('name');
  if (error) throw handleSupabaseError(error);
  return data || [];
};

export const createDocumentType = async (name: string) => {
  if (!supabase) return;
  const { data, error } = await supabase.from('document_types').insert([{ name }]).select().single();
  if (error) throw handleSupabaseError(error);
  return data;
};

export const updateDocumentType = async (id: string, name: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('document_types').update({ name }).eq('id', id);
  if (error) throw handleSupabaseError(error);
};

export const deleteDocumentType = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('document_types').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
};

// Tipos de Ata
export const fetchMinuteTypes = async (): Promise<DynamicSetting[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('minute_types').select('*').order('name');
  if (error) throw handleSupabaseError(error);
  return data || [];
};

export const createMinuteType = async (name: string) => {
  if (!supabase) return;
  const { data, error } = await supabase.from('minute_types').insert([{ name }]).select().single();
  if (error) throw handleSupabaseError(error);
  return data;
};

export const updateMinuteType = async (id: string, name: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('minute_types').update({ name }).eq('id', id);
  if (error) throw handleSupabaseError(error);
};

export const deleteMinuteType = async (id: string) => {
  if (!supabase) return;
  const { error } = await supabase.from('minute_types').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
};
