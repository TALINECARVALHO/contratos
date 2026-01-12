
import { supabase } from './supabaseClient';
import { Minute } from '../types';
import { calculateDays } from './contractService';
import { logAction } from './logService';

const formatDateFromDB = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-'); 
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const formatDateToDB = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
};

// Helper para garantir que textos sejam sempre maiúsculos
const toUpper = (val: any) => (typeof val === 'string' ? val.toUpperCase().trim() : val);

const mapRowToMinute = (row: any): Minute => {
  const endDateStr = formatDateFromDB(row.end_date);
  const startDateStr = formatDateFromDB(row.start_date);
  const daysRemaining = calculateDays(endDateStr);

  let status: Minute['status'];
  if (row.manual_status === 'executed' || row.manual_status === 'rescinded') {
    status = row.manual_status;
  } else {
    if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 30) status = 'warning';
    else status = 'active';
  }

  return {
    id: String(row.id),
    number: row.number,
    year: row.year,
    minuteId: row.minute_id || `${row.number}/${row.year}`,
    department: row.department || '',
    object: row.object || '',
    startDate: startDateStr,
    endDate: endDateStr,
    notes: row.notes || '',
    daysRemaining,
    status,
    manualStatus: row.manual_status ? row.manual_status : 'automatic',
    type: row.type || '',
    fiscalizationPeriod: row.fiscalization_period || null,
    processNumber: row.process_number || '',
    renewalInfo: row.renewal_info || '',
    manager: row.manager || '',
    technicalFiscal: row.technical_fiscal || '',
    administrativeFiscal: row.administrative_fiscal || '',
    hasAdministrativeFiscal: row.has_administrative_fiscal !== false
  };
};

export const fetchMinutes = async (): Promise<Minute[]> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from('minutes').select('*').order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapRowToMinute);
};

export const createMinute = async (minute: Partial<Minute>): Promise<Minute> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const dbPayload: any = {
    number: minute.number,
    year: minute.year,
    minute_id: toUpper(minute.minuteId),
    department: toUpper(minute.department),
    object: toUpper(minute.object),
    start_date: formatDateToDB(minute.startDate || ''),
    end_date: formatDateToDB(minute.endDate || ''),
    notes: toUpper(minute.notes),
    type: toUpper(minute.type),
    fiscalization_period: minute.fiscalizationPeriod,
    process_number: toUpper(minute.processNumber),
    renewal_info: toUpper(minute.renewalInfo),
    manager: toUpper(minute.manager),
    technical_fiscal: toUpper(minute.technicalFiscal),
    administrative_fiscal: toUpper(minute.administrativeFiscal),
    has_administrative_fiscal: minute.hasAdministrativeFiscal,
    manual_status: minute.manualStatus === 'automatic' ? null : minute.manualStatus
  };
  const { data, error } = await supabase.from('minutes').insert([dbPayload]).select().single();
  if (error) throw new Error(error.message);
  const newMinute = mapRowToMinute(data);
  await logAction('CREATE', 'MINUTE', newMinute.minuteId, `Ata criada.`);
  return newMinute;
};

export const updateMinute = async (minute: Minute): Promise<Minute> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const dbPayload: any = {
    number: minute.number,
    year: minute.year,
    minute_id: toUpper(minute.minuteId),
    department: toUpper(minute.department),
    object: toUpper(minute.object),
    start_date: formatDateToDB(minute.startDate),
    end_date: formatDateToDB(minute.endDate),
    notes: toUpper(minute.notes),
    type: toUpper(minute.type),
    fiscalization_period: minute.fiscalizationPeriod,
    process_number: toUpper(minute.processNumber),
    renewal_info: toUpper(minute.renewalInfo),
    manager: toUpper(minute.manager),
    technical_fiscal: toUpper(minute.technicalFiscal),
    administrative_fiscal: toUpper(minute.administrativeFiscal),
    has_administrative_fiscal: minute.hasAdministrativeFiscal,
    manual_status: minute.manualStatus === 'automatic' ? null : minute.manualStatus
  };
  const { data, error } = await supabase.from('minutes').update(dbPayload).eq('id', minute.id).select().single();
  if (error) throw new Error(error.message);
  const updatedMinute = mapRowToMinute(data);
  await logAction('UPDATE', 'MINUTE', updatedMinute.minuteId, `Ata atualizada.`);
  return updatedMinute;
};

export const deleteMinute = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data: existing } = await supabase.from('minutes').select('minute_id, object').eq('id', id).single();
  const { error } = await supabase.from('minutes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  if (existing) await logAction('DELETE', 'MINUTE', existing.minute_id || id, `Ata excluída.`);
};
