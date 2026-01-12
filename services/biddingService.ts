import { supabase } from './supabaseClient';
import { Bidding } from '../types';

export const fetchBiddings = async (): Promise<Bidding[]> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('biddings')
        .select('*')
        .order('year', { ascending: false })
        .order('number', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        number: row.number,
        year: row.year,
        biddingId: row.bidding_id,
        modality: row.modality,
        department: row.department,
        object: row.object,
        processNumber: row.process_number,
        openingDate: row.opening_date,
        winner: row.winner,
        status: row.status,
        notes: row.notes,
        resultType: row.result_type,
        resultId: row.result_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by: row.created_by,
        // Map new fields if they exist in DB, otherwise leaving undefined for now until DB migration confirms
        entryDate: row.entry_date,
        currentResponsible: row.current_responsible,
        deadline: row.deadline,
        progress: row.progress,
        submissionStatus: row.submission_status,
        events: row.events || []
    }));
};

export const createBidding = async (bidding: Partial<Bidding>): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase.from('biddings').insert({
        number: bidding.number,
        year: bidding.year,
        bidding_id: bidding.biddingId,
        modality: bidding.modality,
        department: bidding.department,
        object: bidding.object,
        process_number: bidding.processNumber || null,
        opening_date: bidding.openingDate || null,
        winner: bidding.winner || null,
        status: bidding.status || 'em_preparacao',
        notes: bidding.notes || null,
        result_type: bidding.resultType || null,
        result_id: bidding.resultId || null,
        // New fields
        entry_date: bidding.entryDate || null,
        current_responsible: bidding.currentResponsible || null,
        deadline: bidding.deadline || null,
        progress: bidding.progress || null,
        submission_status: bidding.submissionStatus || null,
        events: bidding.events || []
    });

    if (error) {
        console.error('Erro ao criar licitação:', error);
        throw error;
    }
};

export const updateBidding = async (bidding: Bidding, previousBidding?: Bidding): Promise<{ dateChanges: string[] }> => {
    if (!supabase) throw new Error('Supabase não configurado');

    // Detectar mudanças de datas para notificações (Simplified)
    const dateChanges: string[] = [];
    if (previousBidding) {
        if (bidding.openingDate !== previousBidding.openingDate) {
            dateChanges.push('abertura');
        }
        // Add check for events if needed, but keeping simple for now
    }

    const { error } = await supabase
        .from('biddings')
        .update({
            number: bidding.number,
            year: bidding.year,
            bidding_id: bidding.biddingId,
            modality: bidding.modality,
            department: bidding.department,
            object: bidding.object,
            process_number: bidding.processNumber,
            opening_date: bidding.openingDate || null,
            winner: bidding.winner || null,
            status: bidding.status,
            notes: bidding.notes || null,
            result_type: bidding.resultType || null,
            result_id: bidding.resultId || null,
            updated_at: new Date().toISOString(),
            // New fields
            entry_date: bidding.entryDate || null,
            current_responsible: bidding.currentResponsible || null,
            deadline: bidding.deadline || null,
            progress: bidding.progress || null,
            submission_status: bidding.submissionStatus || null,
            events: bidding.events || []
        })
        .eq('id', bidding.id);

    if (error) throw error;

    return { dateChanges };
};

export const deleteBidding = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('biddings')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// Função auxiliar para gerar próximo número de licitação
export const getNextBiddingNumber = async (year: number): Promise<number> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('biddings')
        .select('number')
        .eq('year', year)
        .order('number', { ascending: false })
        .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? data[0].number + 1 : 1;
};

// Mapeamento de Labels exportável para uso em selects
export const BiddingModalityLabels: Record<string, string> = {
    pregao_eletronico: 'Pregão Eletrônico',
    pregao_presencial: 'Pregão Presencial',
    concorrencia: 'Concorrência',
    concorrencia_eletronica: 'Concorrência Eletrônica',
    tomada_precos: 'Tomada de Preços',
    convite: 'Convite',
    dispensa: 'Dispensa',
    inexigibilidade: 'Inexigibilidade',
    chamamento_publico: 'Chamamento Público',
    credenciamento: 'Credenciamento'
};

export const BiddingStatusLabels: Record<string, string> = {
    em_preparacao: 'EM PREPARAÇÃO',
    nao_iniciado: 'NÃO INICIADO',
    elaborando_edital: 'ELABORANDO EDITAL',
    ajustes_necessarios: 'AJUSTES NECESSÁRIOS',
    parecer_juridico: 'PARECER JURÍDICO',
    aguardando_sessao: 'AGUARDANDO SESSÃO',
    habilitacao_recursos: 'HABILITAÇÃO/RECURSOS',
    adjudicacao_homologacao: 'ADJUDICAÇÃO/HOMOLOGAÇÃO',
    deserta: 'DESERTA',
    fracassada: 'FRACASSADA',
    bem_sucedida: 'BEM SUCEDIDA',
    assinatura_prefeito: 'ASSINATURA PREFEITO',
    amostra: 'AMOSTRA',
    contratacao: 'CONTRATAÇÃO',
    suspensa: 'SUSPENSA',
    proposta: 'PROPOSTA',
    revogada: 'REVOGADA',
    anulada: 'ANULADA'
};

// Função para obter nome amigável da modalidade
export const getModalityLabel = (modality: string): string => {
    return BiddingModalityLabels[modality] || modality;
};

// Função para obter nome amigável do status
export const getStatusLabel = (status: string): string => {
    return BiddingStatusLabels[status] || status;
};
