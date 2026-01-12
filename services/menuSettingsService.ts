import { supabase } from './supabaseClient';

export interface MenuSettings {
    id: number;
    biddings_enabled: boolean;
    fiscalization_enabled: boolean;
    reports_enabled: boolean;
    pgm_dispatch_enabled: boolean;
    updated_at?: string;
}

export const getMenuSettings = async (): Promise<MenuSettings> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('menu_settings')
        .select('*')
        .single();

    if (error) {
        // Se não existir, retornar configuração padrão
        return {
            id: 1,
            biddings_enabled: true,
            fiscalization_enabled: true,
            reports_enabled: true,
            pgm_dispatch_enabled: true
        };
    }

    return data;
};

export const updateMenuSettings = async (settings: Partial<MenuSettings>): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('menu_settings')
        .update({
            ...settings,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1);

    if (error) throw error;
};
