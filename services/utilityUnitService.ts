import { supabase } from './supabaseClient';
import { UtilityUnit } from '../types';

export const fetchUtilityUnits = async () => {
    const { data, error } = await supabase
        .from('utility_units')
        .select('*')
        .order('local_name', { ascending: true });

    if (error) {
        console.error('Error fetching utility units:', error);
        throw error;
    }
    return (data || []).map(mapRowToUtilityUnit);
};

export const createUtilityUnit = async (unit: Omit<UtilityUnit, 'id'>) => {
    const dbPayload = {
        consumer_unit: unit.consumerUnit,
        local_name: unit.localName,
        type: unit.type,
        company: unit.company,
        department: unit.department || null,
        default_commitment_id: unit.default_commitment_id || null,
        due_day: unit.due_day || null
    };

    const { data, error } = await supabase
        .from('utility_units')
        .insert([dbPayload])
        .select()
        .single();

    if (error) {
        console.error('Error creating utility unit:', error);
        throw error;
    }
    return mapRowToUtilityUnit(data);
};

export const updateUtilityUnit = async (unit: UtilityUnit) => {
    const dbPayload = {
        consumer_unit: unit.consumerUnit,
        local_name: unit.localName,
        type: unit.type,
        company: unit.company,
        department: unit.department || null,
        default_commitment_id: unit.default_commitment_id || null,
        due_day: unit.due_day || null
    };

    const { data, error } = await supabase
        .from('utility_units')
        .update(dbPayload)
        .eq('id', unit.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating utility unit:', error);
        throw error;
    }
    return mapRowToUtilityUnit(data);
};

export const deleteUtilityUnit = async (id: string) => {
    const { error } = await supabase
        .from('utility_units')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting utility unit:', error);
        throw error;
    }
};

const mapRowToUtilityUnit = (row: any): UtilityUnit => ({
    id: row.id,
    consumerUnit: row.consumer_unit,
    localName: row.local_name,
    type: row.type,
    company: row.company,
    department: row.department,
    default_commitment_id: row.default_commitment_id,
    due_day: row.due_day,
    created_at: row.created_at
});
