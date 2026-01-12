import { supabase } from './supabaseClient';
import { DailyAllowance } from '../types';

export const fetchDailyAllowances = async () => {
    const { data, error } = await supabase
        .from('daily_allowances')
        .select('*')
        .order('startDate', { ascending: false });

    if (error) {
        console.error('Error fetching daily allowances:', error);
        throw error;
    }
    return data as DailyAllowance[];
};

export const createDailyAllowance = async (dailyAllowance: Omit<DailyAllowance, 'id'>) => {
    const { data, error } = await supabase
        .from('daily_allowances')
        .insert([dailyAllowance])
        .select()
        .single();

    if (error) {
        console.error('Error creating daily allowance:', error);
        throw error;
    }
    return data as DailyAllowance;
};

export const updateDailyAllowance = async (dailyAllowance: DailyAllowance) => {
    const { data, error } = await supabase
        .from('daily_allowances')
        .update(dailyAllowance)
        .eq('id', dailyAllowance.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating daily allowance:', error);
        throw error;
    }
    return data as DailyAllowance;
};

export const deleteDailyAllowance = async (id: string) => {
    const { error } = await supabase
        .from('daily_allowances')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting daily allowance:', error);
        throw error;
    }
};

export const uploadDailyAllowanceAttachment = async (file: File, folder: 'solicitations' | 'accountability') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('daily-allowances')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('daily-allowances')
        .getPublicUrl(filePath);

    return data.publicUrl;
};
