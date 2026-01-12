
import { supabase } from './supabaseClient';
import { FiscalizationReport, UserProfile, Contract, Minute, FiscalizationStatus } from '../types';
import { logAction } from './logService';

export const getReportForDocument = async (docId: string, month: string): Promise<FiscalizationReport | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('fiscalization_reports')
    .select('*')
    .eq('document_id', docId)
    .eq('reference_month', month)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar relatório:', error);
    throw new Error(`Erro ao buscar relatório: ${error.message}`);
  }

  return data as FiscalizationReport;
};

export const createOrUpdateReport = async (
  reportData: Partial<FiscalizationReport>,
  document: Contract | Minute
) => {
  if (!supabase) throw new Error("Supabase não configurado");

  const { data: existing } = await supabase
    .from('fiscalization_reports')
    .select('id')
    .eq('document_id', reportData.document_id)
    .eq('reference_month', reportData.reference_month)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('fiscalization_reports')
      .update({ content: reportData.content, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Na criação, captura os nomes dos fiscais do documento pai
    // CORREÇÃO: Se hasAdministrativeFiscal for falso, o nome do fiscal ADM deve ser nulo
    // Isso garante que o fluxo de assinatura pule a etapa ADM corretamente.
    const newReportPayload = {
      ...reportData,
      status: 'pending_tech',
      tech_fiscal_name: document.technicalFiscal,
      adm_fiscal_name: document.hasAdministrativeFiscal ? document.administrativeFiscal : null,
      manager_name: document.manager,
    };

    const { data, error } = await supabase
      .from('fiscalization_reports')
      .insert([newReportPayload])
      .select()
      .single();

    if (error) throw error;
    
    await logAction('CREATE', 'REPORT', reportData.document_id || 'N/A', `Relatório de fiscalização criado para ${reportData.reference_month}`);
    return data;
  }
};

export const signReport = async (
  report: FiscalizationReport, 
  role: 'technical' | 'administrative' | 'manager', 
  password: string,
  userProfile: UserProfile
) => {
  if (!supabase) throw new Error("Supabase não configurado");
  
  // 1. Autentica a senha do usuário
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userProfile.email,
    password: password
  });

  if (authError || !authData.user) {
    throw new Error("Senha incorreta. A assinatura não pode ser realizada.");
  }

  // 2. Lógica do Fluxo Sequencial (Com pulo opcional de ADM)
  let nextStatus: FiscalizationStatus = report.status;
  const updates: Partial<FiscalizationReport> = {};
  const now = new Date().toISOString();
  
  if (role === 'technical' && report.status === 'pending_tech') {
    updates.tech_fiscal_signed_at = now;
    updates.tech_fiscal_signer_id = userProfile.id;
    
    // LÓGICA DE PULO: Se não houver Fiscal ADM nomeado, vai direto para o Gestor
    if (report.adm_fiscal_name && report.adm_fiscal_name.trim() !== '') {
        nextStatus = 'pending_adm';
    } else {
        nextStatus = 'pending_manager';
    }

  } else if (role === 'administrative' && report.status === 'pending_adm') {
    updates.adm_fiscal_signed_at = now;
    updates.adm_fiscal_signer_id = userProfile.id;
    nextStatus = 'pending_manager';
  } else if (role === 'manager' && report.status === 'pending_manager') {
    updates.manager_signed_at = now;
    updates.manager_signer_id = userProfile.id;
    nextStatus = 'completed';
  } else {
    let expectedSigner = 'o Fiscal Técnico';
    if (report.status === 'pending_adm') expectedSigner = 'o Fiscal Administrativo';
    if (report.status === 'pending_manager') expectedSigner = 'o Gestor';
    if (report.status === 'completed') throw new Error("Este relatório já foi concluído.");
    
    throw new Error(`Ação não permitida. Aguardando assinatura de ${expectedSigner}.`);
  }
  
  updates.status = nextStatus;
  updates.updated_at = now;

  const { data, error } = await supabase
    .from('fiscalization_reports')
    .update(updates)
    .eq('id', report.id)
    .select()
    .single();

  if (error) throw error;

  await logAction('SIGN', 'REPORT', report.id, `Assinatura realizada por ${userProfile.email} como ${role}`);
  return data;
};

// Gera um formulário estruturado em JSON
export const generateTemplate = (
    docType: 'contract' | 'minute',
    docInfo: { number: string; supplier: string; object: string; type: string; }
) => {
    const mainTitle = docType === 'contract' 
        ? 'RELATÓRIO DE FISCALIZAÇÃO DE CONTRATO'
        : 'RELATÓRIO DE ACOMPANHAMENTO DE ATA';

    const header = `Referência: ${docType === 'contract' ? 'Contrato' : 'Ata'} nº ${docInfo.number}\n` +
                   (docType === 'contract' ? `Contratado: ${docInfo.supplier}\n` : '') +
                   `Objeto: ${docInfo.object}`;
    
    let sections: any[] = [];
    const normalizedType = docInfo.type?.toUpperCase() || 'OUTRO';

    if (normalizedType.includes('CONTÍNUO') || normalizedType.includes('PRESTAÇÃO DE SERVIÇO') || normalizedType.includes('SOFTWARE')) {
        sections = [
            { title: "1. EXECUÇÃO DO OBJETO", fields: [
                { id: "servico_continuo", label: "O serviço foi prestado de forma contínua e sem interrupções?", type: "checkbox", value: false },
                { id: "qualidade_ok", label: "A qualidade do serviço atendeu ao contratado?", type: "checkbox", value: false },
                { id: "prazos_ok", label: "Os prazos e cronogramas foram cumpridos?", type: "checkbox", value: false },
            ]},
            { title: "2. OCORRÊNCIAS", fields: [
                { id: "ocorrencias", label: "Descreva ocorrências, se houver.", type: "textarea", value: "Nenhuma ocorrência registrada." }
            ]},
            { title: "3. CONCLUSÃO", fields: [
                { id: "conclusao", label: "Observações finais do fiscal.", type: "textarea", value: "Declaro que os serviços foram recebidos e estão de acordo, autorizando o pagamento." }
            ]}
        ];
    } else if (normalizedType.includes('OBRA')) {
        sections = [
            { title: "1. ANDAMENTO DA OBRA", fields: [
                { id: "cronograma_ok", label: "O cronograma físico-financeiro está sendo cumprido?", type: "checkbox", value: false },
                { id: "medicoes_ok", label: "As medições do período foram realizadas e conferidas?", type: "checkbox", value: false },
                { id: "qualidade_obra_ok", label: "A qualidade dos materiais e da execução está conforme o projeto?", type: "checkbox", value: false },
            ]},
            { title: "2. OCORRÊNCIAS", fields: [
                { id: "ocorrencias_obra", label: "Descreva ocorrências ou desvios.", type: "textarea", value: "Nenhuma ocorrência registrada." }
            ]},
            { title: "3. CONCLUSÃO", fields: [
                { id: "conclusao_obra", label: "Parecer do fiscal.", type: "textarea", value: "Atesto a execução da etapa fiscalizada, autorizando o pagamento da medição." }
            ]}
        ];
    } else if (normalizedType.includes('AQUISIÇÃO') || normalizedType.includes('ITEM') || normalizedType.includes('MATERIAL')) {
        sections = [
             { title: "1. RECEBIMENTO E CONFORMIDADE", fields: [
                { id: "prazo_entrega_ok", label: "Os materiais foram entregues dentro do prazo?", type: "checkbox", value: false },
                { id: "quantidade_ok", label: "A quantidade entregue confere com a nota fiscal e o pedido?", type: "checkbox", value: false },
                { id: "especificacoes_ok", label: "As especificações dos materiais estão de acordo com o solicitado?", type: "checkbox", value: false },
            ]},
            { title: "2. OCORRÊNCIAS", fields: [
                { id: "ocorrencias_material", label: "Descreva avarias, faltas ou trocas.", type: "textarea", value: "Nenhuma ocorrência registrada." }
            ]},
            { title: "3. CONCLUSÃO", fields: [
                { id: "conclusao_material", label: "Observações sobre o recebimento.", type: "textarea", value: "Declaro o recebimento e conformidade dos materiais, autorizando o pagamento." }
            ]}
        ];
    } else {
         sections = [
            { title: "1. EXECUÇÃO DO OBJETO", fields: [
                { id: "execucao_ok", label: "O objeto foi executado/entregue conforme as especificações?", type: "checkbox", value: false },
                { id: "prazos_geral_ok", label: "Os prazos foram cumpridos?", type: "checkbox", value: false },
            ]},
            { title: "2. OCORRÊNCIAS", fields: [
                { id: "ocorrencias_geral", label: "Descreva qualquer ocorrência.", type: "textarea", value: "Nenhuma ocorrência registrada." }
            ]},
            { title: "3. CONCLUSÃO", fields: [
                 { id: "conclusao_geral", label: "Parecer final do fiscal.", type: "textarea", value: "Declaro para os devidos fins que os serviços/materiais foram recebidos e estão de acordo, autorizando o prosseguimento para pagamento." }
            ]}
        ];
    }

    return { title: mainTitle, header, sections };
};

export const fetchAllReportsInRange = async (
  startDate: string, // YYYY-MM
  endDate: string    // YYYY-MM
): Promise<FiscalizationReport[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fiscalization_reports')
    .select('*')
    .gte('reference_month', startDate)
    .lte('reference_month', endDate)
    .order('reference_month', { ascending: false });

  if (error) {
    console.error('Erro ao buscar relatórios de fiscalização por período:', error);
    throw new Error(`Falha ao buscar relatórios: ${error.message}`);
  }

  return (data as FiscalizationReport[]) || [];
};

export const fetchAllFiscalizationReports = async (): Promise<FiscalizationReport[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('fiscalization_reports')
    .select('*');
  if (error) {
    console.error("Failed to fetch all reports", error);
    throw new Error(`Falha ao buscar todos os relatórios: ${error.message}`);
  }
  return (data as FiscalizationReport[]) || [];
};

export const fetchReportsForDocument = async (docId: string): Promise<FiscalizationReport[]> => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('fiscalization_reports')
        .select('*')
        .eq('document_id', docId)
        .order('reference_month', { ascending: false });

    if (error) {
        console.error("Failed to fetch reports for document:", error);
        throw new Error(`Falha ao buscar histórico de relatórios: ${error.message}`);
    }
    return (data as FiscalizationReport[]) || [];
}
