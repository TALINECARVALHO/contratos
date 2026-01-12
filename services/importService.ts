
import Papa from 'papaparse';
import { supabase } from './supabaseClient';
import { FISCALIZATION_PERIODS } from '../constants';

// Helper para converter data DD/MM/YYYY para YYYY-MM-DD
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const cleanDate = dateStr.trim();
  
  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return null;
};

// Helper para converter texto para maiúsculo
const normalize = (val: any) => (typeof val === 'string' ? val.toUpperCase().trim() : val);

// Gera CSV de modelo para o usuário baixar
export const generateTemplate = (type: 'contracts' | 'minutes') => {
  let headers: string[] = [];
  let exampleRow: string[] = [];

  if (type === 'contracts') {
    headers = ['Numero', 'Ano', 'Secretaria', 'Tipo', 'Objeto', 'Fornecedor', 'Data_Inicio', 'Data_Fim', 'Processo', 'Ordem_Inicio', 'Gestor', 'Fiscal_Tecnico', 'Fiscal_ADM', 'Observacoes', 'Status'];
    exampleRow = ['100', '2024', 'SAÚDE', 'AQUISIÇÃO', 'AQUISIÇÃO DE MEDICAMENTOS', 'DISTRIBUIDORA X', '01/01/2024', '31/12/2024', '500/2023', '', 'JOÃO SILVA', 'MARIA SOUZA', 'PEDRO SANTOS', 'CONTRATO RENOVÁVEL', 'EXECUTADO'];
  } else {
    headers = ['Numero', 'Ano', 'Secretaria', 'Tipo', 'Objeto', 'Data Inicio', 'Data Fim', 'Renovavel', 'Ordem', 'Gestor', 'Fiscal Tecnico', 'Fiscal Adm', 'Observacoes', 'Status'];
    exampleRow = ['15', '2024', 'OBRAS', 'ITEM', 'MATERIAL DE CONSTRUÇÃO', '01/02/2024', '01/02/2025', 'PODE RENOVAR', '600/2023', 'CARLOS LIMA', 'ANA COSTA', 'ROBERTO ALVES', 'REGISTRO DE PREÇOS', ''];
  }

  const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modelo_importacao_${type}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const processImport = async (file: File, type: 'contracts' | 'minutes') => {
  return new Promise<{ success: number; errors: number; message: string }>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const payload: any[] = [];
        let errors = 0;

        const statusMap: { [key: string]: 'executed' | 'rescinded' } = {
          'executado': 'executed',
          'rescindido': 'rescinded',
        };

        for (const row of rows) {
          try {
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              normalizedRow[key.trim()] = row[key];
            });
            
            const manualStatusValue = normalizedRow.Status?.toLowerCase().trim();
            const mappedStatus = statusMap[manualStatusValue] || null;

            if (type === 'contracts') {
              if (!normalizedRow.Numero || !normalizedRow.Ano || !normalizedRow.Objeto) {
                errors++;
                continue;
              }
              
              payload.push({
                number: parseInt(normalizedRow.Numero),
                year: parseInt(normalizedRow.Ano),
                contract_id: `${normalizedRow.Numero}/${normalizedRow.Ano}`,
                department: normalize(normalizedRow.Secretaria),
                type: normalize(normalizedRow.Tipo),
                object: normalize(normalizedRow.Objeto),
                supplier: normalize(normalizedRow.Fornecedor),
                start_date: parseDate(normalizedRow.Data_Inicio),
                end_date: parseDate(normalizedRow.Data_Fim),
                fiscalization_period: null,
                notes: normalize(normalizedRow.Observacoes),
                process_number: normalize(normalizedRow.Processo),
                service_order_number: normalize(normalizedRow.Ordem_Inicio),
                manager: normalize(normalizedRow.Gestor),
                technical_fiscal: normalize(normalizedRow.Fiscal_Tecnico),
                administrative_fiscal: normalize(normalizedRow.Fiscal_ADM),
                renewal_info: '',
                manual_status: mappedStatus
              });

            } else {
              if (!normalizedRow.Numero || !normalizedRow.Ano || !normalizedRow.Objeto) {
                errors++;
                continue;
              }
              
              payload.push({
                number: parseInt(normalizedRow.Numero),
                year: parseInt(normalizedRow.Ano),
                minute_id: `${normalizedRow.Numero}/${normalizedRow.Ano}`,
                department: normalize(normalizedRow.Secretaria),
                type: normalize(normalizedRow.Tipo),
                object: normalize(normalizedRow.Objeto),
                start_date: parseDate(normalizedRow['Data Inicio']),
                end_date: parseDate(normalizedRow['Data Fim']),
                fiscalization_period: null,
                notes: normalize(normalizedRow.Observacoes),
                process_number: normalize(normalizedRow.Ordem),
                renewal_info: normalize(normalizedRow.Renovavel),
                manager: normalize(normalizedRow.Gestor),
                technical_fiscal: normalize(normalizedRow['Fiscal Tecnico']),
                administrative_fiscal: normalize(normalizedRow['Fiscal Adm']),
                manual_status: mappedStatus
              });
            }
          } catch (e) {
            console.error("Erro ao processar linha", row, e);
            errors++;
          }
        }

        if (payload.length > 0) {
          const tableName = type === 'contracts' ? 'contracts' : 'minutes';
          
          if (!supabase) {
             resolve({ success: payload.length, errors, message: "Modo Demo: Importação simulada com sucesso." });
             return;
          }

          let { error } = await supabase.from(tableName).insert(payload);
          
          if (error && error.code === '42703' && error.message.includes('service_order_number')) {
             const sanitizedPayload = payload.map(item => {
                 const { service_order_number, ...rest } = item;
                 return rest;
             });
             const retry = await supabase.from(tableName).insert(sanitizedPayload);
             if (!retry.error) {
                 resolve({ 
                    success: payload.length, 
                    errors, 
                    message: `Importado com sucesso. (Aviso: Campo 'Ordem de Início' ignorado por incompatibilidade de DB).`
                 });
                 return;
             }
             error = retry.error;
          }

          if (error) {
            reject(new Error(`Erro no banco de dados: ${error.message}`));
          } else {
            resolve({ 
              success: payload.length, 
              errors, 
              message: `Importado com sucesso: ${payload.length} registros. ${errors > 0 ? `${errors} linhas ignoradas por erro.` : ''}`
            });
          }
        } else {
          resolve({ success: 0, errors, message: "Nenhum dado válido encontrado para importar." });
        }
      },
      error: (err) => {
        reject(new Error(`Erro ao ler arquivo CSV: ${err.message}`));
      }
    });
  });
};
