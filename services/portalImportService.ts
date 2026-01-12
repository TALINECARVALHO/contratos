// Serviço para importação de licitações do Portal de Compras Públicas

export interface PortalBiddingData {
    processId: string;
    number: number;
    year: number;
    modality: string;
    object?: string;
    publicationDate?: string;
    openingDate?: string;
    estimatedValue?: number;
}

/**
 * Extrai dados da URL do Portal de Compras Públicas
 * Exemplo: https://www.portaldecompraspublicas.com.br/processos/rs/prefeitura-municipal-de-sao-francisco-de-paula-3324/pe-87-2025-2025-445825
 */
export const extractDataFromPortalUrl = (url: string): PortalBiddingData | null => {
    try {
        // Extrair ID do processo (último número da URL)
        const processIdMatch = url.match(/-(\d+)$/);
        if (!processIdMatch) return null;
        const processId = processIdMatch[1];

        // Extrair tipo-numero-ano (ex: pe-87-2025)
        const biddingMatch = url.match(/\/([a-z]{2})-(\d+)-(\d{4})-/i);
        if (!biddingMatch) return null;

        const modalityCode = biddingMatch[1].toUpperCase();
        const number = parseInt(biddingMatch[2]);
        const year = parseInt(biddingMatch[3]);

        return {
            processId,
            number,
            year,
            modality: mapModalityFromPortal(modalityCode)
        };
    } catch (error) {
        console.error('Erro ao extrair dados da URL:', error);
        return null;
    }
};

/**
 * Mapeia código de modalidade do portal para o sistema
 */
const mapModalityFromPortal = (code: string): string => {
    const map: Record<string, string> = {
        'PE': 'pregao_eletronico',
        'PP': 'pregao_presencial',
        'CC': 'concorrencia',
        'TP': 'tomada_precos',
        'CV': 'convite',
        'DP': 'dispensa',
        'DL': 'dispensa',
        'IX': 'inexigibilidade',
        'CP': 'chamamento_publico',
        'CR': 'credenciamento'
    };
    return map[code] || 'pregao_eletronico';
};

/**
 * Tenta buscar dados completos via API do Portal
 * Nota: Requer configuração de CORS ou proxy
 */
export const fetchFromPortalAPI = async (processId: string): Promise<any | null> => {
    try {
        // Tentar endpoint público
        const response = await fetch(
            `https://apipcp.portaldecompraspublicas.com.br/publico/api/processos/${processId}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.warn('API do portal retornou erro:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        return data;
    } catch (error) {
        console.warn('Erro ao buscar dados da API:', error);
        return null;
    }
};

/**
 * Converte dados da API do portal para formato do sistema
 */
export const convertPortalDataToBidding = (portalData: any, extractedData: PortalBiddingData): Partial<any> => {
    // Função auxiliar para converter data
    const formatDate = (dateString?: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Extrair objeto/resumo
    const object = portalData?.resumo ||
        portalData?.objeto ||
        portalData?.descricao ||
        '';

    // Extrair datas
    const publicationDate = formatDate(
        portalData?.dataHoraPublicacao ||
        portalData?.dataPublicacao
    );

    const openingDate = formatDate(
        portalData?.dataHoraAbertura ||
        portalData?.dataAbertura ||
        portalData?.dataHoraFinalRecebimentoPropostas
    );

    const homologationDate = formatDate(
        portalData?.dataHomologacao
    );

    const signatureDate = formatDate(
        portalData?.dataAssinatura
    );

    // Extrair valores
    const estimatedValue = portalData?.valorEstimado ||
        portalData?.valorTotal ||
        portalData?.valorOrcado ||
        null;

    const adjudicatedValue = portalData?.valorAdjudicado ||
        portalData?.valorHomologado ||
        null;

    // Extrair número do processo
    const processNumber = portalData?.numeroProcesso ||
        portalData?.processo ||
        '';

    // Extrair vencedor
    const winner = portalData?.vencedor?.nome ||
        portalData?.fornecedorVencedor ||
        '';

    return {
        number: extractedData.number,
        year: extractedData.year,
        biddingId: `${String(extractedData.number).padStart(3, '0')}/${extractedData.year}`,
        modality: extractedData.modality,
        object: object,
        processNumber: processNumber,
        publicationDate: publicationDate,
        openingDate: openingDate,
        homologationDate: homologationDate,
        signatureDate: signatureDate,
        estimatedValue: estimatedValue,
        adjudicatedValue: adjudicatedValue,
        winner: winner,
        status: determineStatus(portalData),
        notes: `Importado do Portal de Compras Públicas\nID do Processo: ${extractedData.processId}\nÚltima atualização: ${new Date().toLocaleString('pt-BR')}`
    };
};

/**
 * Determina o status da licitação baseado nos dados da API
 */
const determineStatus = (portalData: any): string => {
    if (portalData?.status) {
        const statusMap: Record<string, string> = {
            'PUBLICADA': 'publicada',
            'ABERTA': 'aberta',
            'EM_ANALISE': 'em_analise',
            'HOMOLOGADA': 'homologada',
            'ADJUDICADA': 'adjudicada',
            'DESERTA': 'deserta',
            'FRACASSADA': 'fracassada',
            'REVOGADA': 'revogada',
            'ANULADA': 'anulada'
        };
        return statusMap[portalData.status.toUpperCase()] || 'publicada';
    }

    // Inferir status baseado em datas
    if (portalData?.dataAssinatura) return 'contrato_assinado';
    if (portalData?.dataHomologacao) return 'homologada';
    if (portalData?.dataAbertura) return 'aberta';
    if (portalData?.dataPublicacao) return 'publicada';

    return 'em_preparacao';
};
