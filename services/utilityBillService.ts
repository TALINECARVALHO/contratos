import { supabase } from './supabaseClient';
import { UtilityBill, UtilityCommitment } from '../types';

// Utility Bills CRUD
export const fetchUtilityBills = async () => {
    const { data, error } = await supabase
        .from('utility_bills')
        .select('*')
        .order('due_date', { ascending: false });

    if (error) {
        console.error('Error fetching utility bills:', error);
        throw error;
    }
    return (data || []).map(mapRowToUtilityBill);
};

export const createUtilityBill = async (bill: Omit<UtilityBill, 'id'>) => {
    // We map to snake_case to match our latest database convention (utility_commitments pattern)
    // If the database has camelCase columns, Supabase will handle the mapping if they are NOT quoted.
    // If they are quoted, we must match them exactly. 
    // Given the "Erro ao salvar conta", it's highly likely the DB expects specific names.
    const dbPayload = {
        type: bill.type,
        company: bill.company,
        consumer_unit: bill.consumerUnit, // Standardizing to snake_case
        local_name: bill.localName || null,
        reference_month: bill.referenceMonth,
        due_date: bill.dueDate,
        value: bill.value,
        barcode: bill.barcode || null,
        status: bill.status,
        payment_date: bill.paymentDate || null,
        commitment_id: bill.commitment_id || null,
        notes: bill.notes || null
    };

    const { data, error } = await supabase
        .from('utility_bills')
        .insert([dbPayload])
        .select()
        .single();

    if (error) {
        console.error('Error creating utility bill:', error);
        throw error;
    }
    return mapRowToUtilityBill(data);
};

export const updateUtilityBill = async (bill: UtilityBill) => {
    const dbPayload = {
        type: bill.type,
        company: bill.company,
        consumer_unit: bill.consumerUnit,
        local_name: bill.localName || null,
        reference_month: bill.referenceMonth,
        due_date: bill.dueDate,
        value: bill.value,
        barcode: bill.barcode || null,
        status: bill.status,
        payment_date: bill.paymentDate || null,
        commitment_id: bill.commitment_id || null,
        notes: bill.notes || null
    };

    const { data, error } = await supabase
        .from('utility_bills')
        .update(dbPayload)
        .eq('id', bill.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating utility bill:', error);
        throw error;
    }
    return mapRowToUtilityBill(data);
};

export const deleteUtilityBill = async (id: string) => {
    const { error } = await supabase
        .from('utility_bills')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting utility bill:', error);
        throw error;
    }
};

export const upsertUtilityCellValue = async (
    consumerUnit: string,
    referenceMonth: string,
    type: 'water' | 'light' | 'phone',
    value: number,
    localName?: string,
    commitmentId?: string
) => {
    // 1. Check if record exists
    const { data: existing } = await supabase
        .from('utility_bills')
        .select('id')
        .eq('consumer_unit', consumerUnit)
        .eq('reference_month', referenceMonth)
        .eq('type', type)
        .maybeSingle();

    if (existing) {
        // Update
        const { error } = await supabase
            .from('utility_bills')
            .update({ value })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        // Insert new entry
        // We need some defaults for required fields like due_date
        const [month, year] = referenceMonth.split('/');
        const defaultDueDate = `${year}-${month}-10`; // Default to 10th of the month

        const dbPayload = {
            type,
            company: type === 'light' ? 'RGE' : (type === 'water' ? 'Corsan' : 'Oi'), // Guessing defaults
            consumer_unit: consumerUnit,
            local_name: localName || null,
            reference_month: referenceMonth,
            due_date: defaultDueDate,
            value,
            status: 'paid', // Default to paid if entered in matrix
            commitment_id: commitmentId || null
        };

        const { error } = await supabase
            .from('utility_bills')
            .insert([dbPayload]);
        if (error) throw error;
    }
};

// Helper to map DB row to Utility interfaces
const mapRowToUtilityBill = (row: any): UtilityBill => ({
    id: row.id,
    type: row.type,
    company: row.company,
    consumerUnit: row.consumer_unit || row.consumerUnit,
    localName: row.local_name || row.localName,
    referenceMonth: row.reference_month || row.referenceMonth,
    dueDate: row.due_date || row.dueDate,
    value: Number(row.value),
    barcode: row.barcode,
    status: row.status,
    paymentDate: row.payment_date || row.paymentDate,
    commitment_id: row.commitment_id,
    notes: row.notes,
    created_at: row.created_at
});

const mapRowToUtilityCommitment = (row: any): UtilityCommitment => ({
    id: row.id,
    number: row.number,
    type: row.type,
    department: row.department,
    dotation: row.dotation,
    consumerUnit: row.consumer_unit,
    totalValue: Number(row.total_value),
    balance: Number(row.balance),
    notes: row.notes,
    created_at: row.created_at
});

// Utility Commitments (Empenhos) CRUD
export const fetchUtilityCommitments = async () => {
    const { data, error } = await supabase
        .from('utility_commitments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching commitments:', error);
        throw error;
    }
    return (data || []).map(mapRowToUtilityCommitment);
};

export const createUtilityCommitment = async (commitment: Omit<UtilityCommitment, 'id' | 'balance'>) => {
    const dbPayload = {
        number: commitment.number,
        type: commitment.type,
        department: commitment.department,
        dotation: commitment.dotation,
        consumer_unit: commitment.consumerUnit,
        total_value: commitment.totalValue,
        balance: commitment.totalValue,
        notes: commitment.notes
    };

    const { data, error } = await supabase
        .from('utility_commitments')
        .insert([dbPayload])
        .select()
        .single();

    if (error) {
        console.error('Error creating commitment:', error);
        throw error;
    }
    return mapRowToUtilityCommitment(data);
};

export const updateUtilityCommitment = async (commitment: UtilityCommitment) => {
    const dbPayload = {
        number: commitment.number,
        type: commitment.type,
        department: commitment.department,
        dotation: commitment.dotation,
        consumer_unit: commitment.consumerUnit,
        total_value: commitment.totalValue,
        balance: commitment.balance,
        notes: commitment.notes
    };

    const { data, error } = await supabase
        .from('utility_commitments')
        .update(dbPayload)
        .eq('id', commitment.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating commitment:', error);
        throw error;
    }
    return mapRowToUtilityCommitment(data);
};

export const deleteUtilityCommitment = async (id: string) => {
    const { error } = await supabase
        .from('utility_commitments')
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
};

// Predictive Analysis Logic
export const getUtilityStats = (bills: UtilityBill[] = [], commitments: UtilityCommitment[] = []) => {
    return (commitments || []).map(commitment => {
        // Filter bills for this commitment
        const commitmentBills = (bills || []).filter(b => b.commitment_id === commitment.id);

        // Calculate average spending (last 6 months or all since commitment)
        const sortedBills = [...commitmentBills].sort((a, b) => {
            const dateA = a.referenceMonth ? new Date(a.referenceMonth.split('/').reverse().join('-')).getTime() : 0;
            const dateB = b.referenceMonth ? new Date(b.referenceMonth.split('/').reverse().join('-')).getTime() : 0;
            return dateB - dateA;
        });

        const lastSix = sortedBills.slice(0, 6);
        const avgSpending = lastSix.length > 0
            ? lastSix.reduce((acc, b) => acc + b.value, 0) / lastSix.length
            : 0;

        const forecastTwoMonths = avgSpending * 2;
        const isCritical = commitment.balance < forecastTwoMonths && commitment.balance > 0;
        const isExhausted = commitment.balance <= 0;

        return {
            commitmentId: commitment.id,
            avgSpending,
            forecastTwoMonths,
            isCritical,
            isExhausted,
            billCount: commitmentBills.length
        };
    });
};
