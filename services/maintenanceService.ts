
import { supabase } from './supabaseClient';

export const removeDuplicates = async (target: 'contracts' | 'minutes' | 'all' = 'all') => {
  if (!supabase) throw new Error("Supabase não configurado.");

  try {
    // Tenta chamar a função SQL otimizada (RPC)
    const { data, error } = await supabase.rpc('remove_duplicates_db');
    
    if (error) {
       console.error("Erro na função RPC remove_duplicates_db:", error);
       // Se o erro for que a função não existe, lança um erro amigável
       if (error.code === 'PGRST202' || error.message.includes('function') || error.message.includes('not found')) {
           throw new Error("A função de limpeza rápida não foi instalada no Banco de Dados. Por favor, vá em Configurações > Banco de Dados e execute o script de atualização.");
       }
       throw new Error(error.message);
    }

    return { 
        deletedContracts: data?.deletedContracts || 0, 
        deletedMinutes: data?.deletedMinutes || 0 
    };

  } catch (err: any) {
    throw err;
  }
};
