import { supabase } from './supabaseClient';
import { Commitment } from '../types';

export const fetchCommitments = async (contractId?: string) => {
    let query = supabase
        .from('commitments')
        .select('*')
        .order('issueDate', { ascending: false });

    if (contractId) {
        query = query.eq('contractId', contractId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching commitments:', error);
        throw error;
    }
    return data as Commitment[];
};

export const createCommitment = async (commitment: Omit<Commitment, 'id'>) => {
    const { data, error } = await supabase
        .from('commitments')
        .insert([commitment])
        .select()
        .single();

    if (error) {
        console.error('Error creating commitment:', error);
        throw error;
    }
    return data as Commitment;
};

export const updateCommitment = async (commitment: Commitment) => {
    const { data, error } = await supabase
        .from('commitments')
        .update(commitment)
        .eq('id', commitment.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating commitment:', error);
        throw error;
    }
    return data as Commitment;
};

export const deleteCommitment = async (id: string) => {
    const { error } = await supabase
        .from('commitments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting commitment:', error);
        throw error;
    }
};
