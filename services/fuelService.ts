import { supabase } from './supabaseClient';
import { FuelCommitment, FuelRecord } from '../types';

// ============================================
// FUEL COMMITMENTS (Empenhos de Combustível)
// ============================================

export const fetchFuelCommitments = async (): Promise<FuelCommitment[]> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('fuel_commitments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createFuelCommitment = async (commitment: Partial<FuelCommitment>): Promise<FuelCommitment> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('fuel_commitments')
        .insert({
            number: commitment.number,
            department: commitment.department,
            dotation: commitment.dotation,
            totalValue: commitment.totalValue,
            balance: commitment.totalValue, // Saldo inicial = valor total
            notes: commitment.notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateFuelCommitment = async (commitment: FuelCommitment): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('fuel_commitments')
        .update({
            number: commitment.number,
            department: commitment.department,
            dotation: commitment.dotation,
            totalValue: commitment.totalValue,
            balance: commitment.balance,
            notes: commitment.notes
        })
        .eq('id', commitment.id);

    if (error) throw error;
};

export const deleteFuelCommitment = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('fuel_commitments')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// FUEL RECORDS (Lançamentos de Combustível)
// ============================================

export const fetchFuelRecords = async (): Promise<FuelRecord[]> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('fuel_records')
        .select('*')
        .order('reference_month', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createFuelRecord = async (record: Partial<FuelRecord>): Promise<FuelRecord> => {
    if (!supabase) throw new Error('Supabase não configurado');

    // Verificar saldo do empenho antes de criar
    const { data: commitment, error: commitmentError } = await supabase
        .from('fuel_commitments')
        .select('balance')
        .eq('id', record.commitment_id)
        .single();

    if (commitmentError) throw commitmentError;

    if (commitment.balance < (record.total_value || 0)) {
        throw new Error('Saldo insuficiente no empenho selecionado');
    }

    // Criar o lançamento
    const { data, error } = await supabase
        .from('fuel_records')
        .insert({
            department: record.department,
            reference_month: record.reference_month,
            total_liters: record.total_liters,
            total_value: record.total_value,
            commitment_id: record.commitment_id,
            details: record.details,
            status: record.status || 'pending',
            notes: record.notes
        })
        .select()
        .single();

    if (error) throw error;

    // Atualizar saldo do empenho
    const newBalance = commitment.balance - (record.total_value || 0);
    await supabase
        .from('fuel_commitments')
        .update({ balance: newBalance })
        .eq('id', record.commitment_id);

    return data;
};

export const updateFuelRecord = async (record: FuelRecord): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    // Buscar valor anterior do lançamento
    const { data: oldRecord, error: oldError } = await supabase
        .from('fuel_records')
        .select('total_value, commitment_id')
        .eq('id', record.id)
        .single();

    if (oldError) throw oldError;

    // Buscar saldo atual do empenho
    const { data: commitment, error: commitmentError } = await supabase
        .from('fuel_commitments')
        .select('balance')
        .eq('id', record.commitment_id)
        .single();

    if (commitmentError) throw commitmentError;

    // Calcular diferença de valor
    const valueDifference = record.total_value - oldRecord.total_value;

    // Verificar se há saldo suficiente para a diferença
    if (valueDifference > 0 && commitment.balance < valueDifference) {
        throw new Error('Saldo insuficiente no empenho para esta atualização');
    }

    // Atualizar o lançamento
    const { error } = await supabase
        .from('fuel_records')
        .update({
            department: record.department,
            reference_month: record.reference_month,
            total_liters: record.total_liters,
            total_value: record.total_value,
            commitment_id: record.commitment_id,
            details: record.details,
            status: record.status,
            payment_date: record.payment_date,
            notes: record.notes
        })
        .eq('id', record.id);

    if (error) throw error;

    // Atualizar saldo do empenho
    const newBalance = commitment.balance - valueDifference;
    await supabase
        .from('fuel_commitments')
        .update({ balance: newBalance })
        .eq('id', record.commitment_id);
};

export const deleteFuelRecord = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    // Buscar o lançamento para devolver o valor ao empenho
    const { data: record, error: recordError } = await supabase
        .from('fuel_records')
        .select('total_value, commitment_id')
        .eq('id', id)
        .single();

    if (recordError) throw recordError;

    // Deletar o lançamento
    const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', id);

    if (error) throw error;

    // Devolver valor ao saldo do empenho
    const { data: commitment } = await supabase
        .from('fuel_commitments')
        .select('balance')
        .eq('id', record.commitment_id)
        .single();

    if (commitment) {
        await supabase
            .from('fuel_commitments')
            .update({ balance: commitment.balance + record.total_value })
            .eq('id', record.commitment_id);
    }
};
