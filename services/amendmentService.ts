
import { supabase } from './supabaseClient';
import { ContractAmendment, AmendmentChecklist } from '../types';
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

const mapRowToAmendment = (row: any): ContractAmendment => {
    return {
        id: row.id,
        contractId: row.contract_id,
        contractIdentifier: row.contracts?.contract_id || 'N/A',
        type: row.type,
        duration: row.duration,
        durationUnit: row.duration_unit,
        eventName: row.event_name,
        entryDate: formatDateFromDB(row.entry_date),
        status: row.status,
        checklist: row.checklist,
        folderLink: row.folder_link || '',
        contractsSectorNotes: row.contracts_sector_notes || '',
        pgmNotes: row.pgm_notes || '',
        pgmDecision: row.pgm_decision || null,
        pgmHistory: row.pgm_history || [],
        created_at: row.created_at
    };
};

export const fetchAmendments = async (): Promise<ContractAmendment[]> => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data, error } = await supabase
        .from('contract_amendments')
        .select('*, contracts(contract_id)')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapRowToAmendment);
};

export const createAmendment = async (amendment: Partial<ContractAmendment>): Promise<ContractAmendment> => {
    if (!supabase) throw new Error("Supabase não configurado.");

    const dbPayload = {
        contract_id: amendment.contractId,
        type: amendment.type,
        duration: amendment.duration,
        duration_unit: amendment.durationUnit,
        event_name: amendment.eventName?.toUpperCase().trim(),
        entry_date: formatDateToDB(amendment.entryDate || ''),
        status: amendment.status,
        checklist: amendment.checklist,
        folder_link: amendment.folderLink || null,
        contracts_sector_notes: amendment.contractsSectorNotes || null,
        pgm_notes: amendment.pgmNotes || null,
        pgm_decision: amendment.pgmDecision || null,
        pgm_history: amendment.pgmHistory || []
    };

    const { data, error } = await supabase
        .from('contract_amendments')
        .insert([dbPayload])
        .select('*, contracts(contract_id)')
        .single();

    if (error) throw new Error(error.message);

    const newAmendment = mapRowToAmendment(data);
    await logAction('CREATE', 'SYSTEM', newAmendment.id, `Aditivo criado para contrato ${newAmendment.contractIdentifier}`);
    return newAmendment;
};

export const updateAmendment = async (amendment: ContractAmendment): Promise<ContractAmendment> => {
    if (!supabase) throw new Error("Supabase não configurado.");

    const dbPayload = {
        type: amendment.type,
        duration: amendment.duration,
        duration_unit: amendment.durationUnit,
        event_name: amendment.eventName?.toUpperCase().trim(),
        entry_date: formatDateToDB(amendment.entryDate),
        status: amendment.status,
        checklist: amendment.checklist,
        folder_link: amendment.folderLink || null,
        contracts_sector_notes: amendment.contractsSectorNotes || null,
        pgm_notes: amendment.pgmNotes || null,
        pgm_decision: amendment.pgmDecision || null,
        pgm_history: amendment.pgmHistory || [],
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('contract_amendments')
        .update(dbPayload)
        .eq('id', amendment.id)
        .select('*, contracts(contract_id)')
        .single();

    if (error) throw new Error(error.message);

    const updatedAmendment = mapRowToAmendment(data);
    await logAction('UPDATE', 'SYSTEM', updatedAmendment.id, `Aditivo atualizado.`);
    return updatedAmendment;
};

export const deleteAmendment = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado.");
    // Converte para número para garantir compatibilidade com BIGINT
    const numericId = Number(id);
    const { error } = await supabase.from('contract_amendments').delete().eq('id', numericId);
    if (error) throw new Error(error.message);
    await logAction('DELETE', 'SYSTEM', id, `Aditivo excluído.`);
};
