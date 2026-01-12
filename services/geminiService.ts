
import { GoogleGenAI } from "@google/genai";
import { Contract } from "../types";

// Inicialização do cliente Gemini utilizando a chave de API do ambiente
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeContractWithGemini = async (contract: Partial<Contract>) => {
  try {
    const ai = getAIClient();
    const prompt = `
      Atue como um consultor jurídico especializado em gestão pública.
      Analise os seguintes dados deste contrato municipal e forneça um resumo executivo curto (máximo 3 parágrafos) em Português (PT-BR).
      
      DADOS DO CONTRATO:
      - Objeto: ${contract.object}
      - Fornecedor: ${contract.supplier}
      - Vigência: ${contract.startDate} até ${contract.endDate}
      - Dias Restantes: ${contract.daysRemaining}
      - Observações: ${contract.notes}
      - Tipo: ${contract.type}
      
      REQUISITOS DA ANÁLISE:
      1. Identifique o objetivo principal de forma clara.
      2. Avalie o risco de encerramento (se está muito próximo do fim e o que isso impacta baseado no objeto).
      3. Sugira uma recomendação prática para o fiscal (ex: verificar entrega, preparar termo aditivo, ou conferir qualidade).
      4. Use um tom profissional e direto.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "Não foi possível gerar uma análise para este contrato.";
  } catch (error: any) {
    console.error("Erro na análise Gemini:", error);
    return `Erro ao processar análise inteligente: ${error.message || "Tente novamente mais tarde."}`;
  }
};
