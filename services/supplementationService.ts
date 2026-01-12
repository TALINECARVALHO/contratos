import { supabase } from './supabaseClient';
import { SupplementationRequest } from '../types';

export const fetchSupplementations = async () => {
    const { data, error } = await supabase
        .from('supplementation_requests')
        .select('*, items:supplementation_items(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching supplementations:', error);
        throw error;
    }
    return data as SupplementationRequest[];
};

export const createSupplementation = async (supplementation: any) => {
    // Note: Complex creation with items is handled in SupplementationForm.tsx
    // This function is kept for compatibility or simple inserts if needed.
    const { data, error } = await supabase
        .from('supplementation_requests')
        .insert([supplementation])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateSupplementation = async (supplementation: SupplementationRequest) => {
    const { items, ...mainData } = supplementation;

    // 1. Update Request
    const { data, error } = await supabase
        .from('supplementation_requests')
        .update(mainData)
        .eq('id', supplementation.id)
        .select()
        .single();

    if (error) throw error;

    // 2. Sync Items (Delete all and recreate is simplest)
    if (items && items.length > 0) {
        // Delete old items
        const { error: deleteError } = await supabase
            .from('supplementation_items')
            .delete()
            .eq('request_id', supplementation.id);

        if (deleteError) throw deleteError;

        // Insert new items
        const newItems = items.map(item => ({
            request_id: supplementation.id,
            type: item.type,
            dotation: item.dotation,
            rubric: item.rubric,
            value: item.value,
            resource: item.resource,
            justification: item.justification
        }));

        const { error: insertError } = await supabase
            .from('supplementation_items')
            .insert(newItems);

        if (insertError) throw insertError;
    }

    return data as SupplementationRequest;
};

export const deleteSupplementation = async (id: string) => {
    const { error } = await supabase
        .from('supplementation_requests')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const approveSupplementation = async (id: string) => {
    const { error } = await supabase
        .from('supplementation_requests')
        .update({
            status: 'approved'
        })
        .eq('id', id);

    if (error) throw error;
};

export const addDecreeToSupplementation = async (id: string, decreeNumber: string) => {
    const { error } = await supabase
        .from('supplementation_requests')
        .update({
            decree_number: decreeNumber,
            decree_date: null,
            status: 'published'
        })
        .eq('id', id);

    if (error) throw error;
};

export const rejectSupplementation = async (id: string, reason: string) => {
    const { error } = await supabase
        .from('supplementation_requests')
        .update({
            status: 'rejected',
            rejection_reason: reason
        })
        .eq('id', id);

    if (error) throw error;
};
export const toggleItemVerification = async (itemId: string, verified: boolean) => {
    const { error } = await supabase
        .from('supplementation_items')
        .update({ verified })
        .eq('id', itemId);

    if (error) throw error;
};
