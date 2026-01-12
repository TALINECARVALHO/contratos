
import { supabase } from './supabaseClient';
import { Contract, ContractAmendment } from '../types';
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

export const calculateDays = (dateStr: string) => {
  if (!dateStr) return 0;
  try {
    let day, month, year;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return 0;
      day = parseInt(parts[0]);
      month = parseInt(parts[1]);
      year = parseInt(parts[2]);
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return 0;
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      return 0;
    }
    const targetDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
};

const mapRowToContract = (row: any): Contract => {
  const endDateStr = formatDateFromDB(row.end_date);
  const startDateStr = formatDateFromDB(row.start_date);
  const daysRemaining = calculateDays(endDateStr);

  let status: Contract['status'];
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
    contractId: row.contract_id || `${row.number}/${row.year}`,
    department: row.department || '',
    object: row.object || '',
    supplier: row.supplier || '',
    startDate: startDateStr,
    endDate: endDateStr,
    notes: row.notes || '',
    daysRemaining,
    status,
    manualStatus: row.manual_status ? row.manual_status : 'automatic',
    type: row.type || '',
    fiscalizationPeriod: row.fiscalization_period || null,
    renewalInfo: row.renewal_info || '',
    processNumber: row.process_number || '',
    serviceOrderNumber: row.service_order_number || '',
    manager: row.manager || '',
    technicalFiscal: row.technical_fiscal || '',
    administrativeFiscal: row.administrative_fiscal || '',
    hasAdministrativeFiscal: row.has_administrative_fiscal !== false,
    isEmergency: row.is_emergency || false
  };
};

export const fetchContracts = async (): Promise<Contract[]> => {
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: contractsData, error: contractsError } = await supabase.from('contracts').select('*').order('id', { ascending: false });
  if (contractsError) throw new Error(contractsError.message);

  const { data: amendmentsData, error: amendmentsError } = await supabase.from('contract_amendments').select('*');
  if (amendmentsError) console.error("Erro ao buscar aditivos:", amendmentsError);

  const contracts = (contractsData || []).map(mapRowToContract);
  const amendments = (amendmentsData || []) as any[];

  return contracts.map(contract => {
    // Encontrar aditivos ativos para este contrato
    const activeAmendment = amendments.find(a =>
      String(a.contract_id) === String(contract.id) &&
      a.status !== 'CONCLUÍDO' && a.status !== 'CANCELADO'
    );

    if (activeAmendment) {
      return { ...contract, activeAmendmentStatus: activeAmendment.status };
    }
    return contract;
  });
};

export const createContract = async (contract: Partial<Contract>): Promise<Contract> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const dbPayload: any = {
    number: contract.number,
    year: contract.year,
    contract_id: toUpper(contract.contractId),
    department: toUpper(contract.department),
    object: toUpper(contract.object),
    supplier: toUpper(contract.supplier),
    start_date: formatDateToDB(contract.startDate || ''),
    end_date: formatDateToDB(contract.endDate || ''),
    notes: toUpper(contract.notes),
    type: toUpper(contract.type),
    fiscalization_period: contract.fiscalizationPeriod,
    renewal_info: toUpper(contract.renewalInfo),
    process_number: toUpper(contract.processNumber),
    service_order_number: toUpper(contract.serviceOrderNumber),
    manager: toUpper(contract.manager),
    technical_fiscal: toUpper(contract.technicalFiscal),
    administrative_fiscal: toUpper(contract.administrativeFiscal),
    has_administrative_fiscal: contract.hasAdministrativeFiscal,
    manual_status: contract.manualStatus === 'automatic' ? null : contract.manualStatus,
    is_emergency: contract.isEmergency
  };
  const { data, error } = await supabase.from('contracts').insert([dbPayload]).select().single();
  if (error) throw new Error(error.message);
  const newContract = mapRowToContract(data);
  await logAction('CREATE', 'CONTRACT', newContract.contractId, `Contrato criado.`);
  return newContract;
};

export const updateContract = async (contract: Contract): Promise<Contract> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const dbPayload: any = {
    number: contract.number,
    year: contract.year,
    contract_id: toUpper(contract.contractId),
    department: toUpper(contract.department),
    object: toUpper(contract.object),
    supplier: toUpper(contract.supplier),
    start_date: formatDateToDB(contract.startDate),
    end_date: formatDateToDB(contract.endDate),
    notes: toUpper(contract.notes),
    type: toUpper(contract.type),
    fiscalization_period: contract.fiscalizationPeriod,
    renewal_info: toUpper(contract.renewalInfo),
    process_number: toUpper(contract.processNumber),
    service_order_number: toUpper(contract.serviceOrderNumber),
    manager: toUpper(contract.manager),
    technical_fiscal: toUpper(contract.technicalFiscal),
    administrative_fiscal: toUpper(contract.administrativeFiscal),
    has_administrative_fiscal: contract.hasAdministrativeFiscal,
    manual_status: contract.manualStatus === 'automatic' ? null : contract.manualStatus,
    is_emergency: contract.isEmergency
  };
  const { data, error } = await supabase.from('contracts').update(dbPayload).eq('id', contract.id).select().single();
  if (error) throw new Error(error.message);
  const updatedContract = mapRowToContract(data);
  await logAction('UPDATE', 'CONTRACT', updatedContract.contractId, `Contrato atualizado.`);
  return updatedContract;
};

export const deleteContract = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase não configurado.");
  const { data: existing } = await supabase.from('contracts').select('contract_id, object').eq('id', id).single();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  if (existing) await logAction('DELETE', 'CONTRACT', existing.contract_id || id, `Contrato excluído.`);
};
