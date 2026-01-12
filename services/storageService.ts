import { supabase } from './supabaseClient';

const BUCKET_NAME = 'documents';

export const uploadDocument = async (file: File, folder: 'contracts' | 'minutes', id: string) => {
  if (!supabase) throw new Error("Supabase não configurado");

  const fileExt = file.name.split('.').pop();
  // Cria um nome único: contracts/80_2018_timestamp.pdf
  const fileName = `${folder}/${id.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Erro no upload:', error);
    throw error;
  }

  // Retorna a URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
};

export const deleteDocument = async (fileUrl: string) => {
  if (!supabase || !fileUrl) return;

  // Extrai o caminho do arquivo da URL completa
  // Ex: https://.../storage/v1/object/public/documents/contracts/file.pdf -> contracts/file.pdf
  const path = fileUrl.split(`${BUCKET_NAME}/`).pop();

  if (path) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
    
    if (error) {
      console.error('Erro ao deletar arquivo:', error);
    }
  }
};
