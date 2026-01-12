
import React, { useState } from 'react';
import { Upload, Download, X, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { generateTemplate, processImport } from '../services/importService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'contracts' | 'minutes';
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess, type }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);

    try {
      const res = await processImport(file, type);
      setResult({ type: 'success', message: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      setResult({ type: 'error', message: error.message || "Erro desconhecido na importação" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">
            Importar {type === 'contracts' ? 'Contratos' : 'Atas'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instrução Google Planilhas - Corrigido com &gt; para o Build */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
              <Info size={16} /> Usa Google Planilhas?
            </h4>
            <p className="text-[11px] text-amber-700 leading-tight">
              Seus dados estão no Google? Vá em <strong>Arquivo &gt; Fazer download &gt; Comma Separated Values (.csv)</strong>. Certifique-se de que os nomes das colunas coincidem com o nosso modelo abaixo.
            </p>
          </div>

          {/* Passo 1: Baixar Modelo */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Download size={16} /> 1. Use a Planilha Modelo
            </h4>
            <p className="text-xs text-blue-600 mb-3">
              Baixe o modelo para ver quais colunas o sistema espera e o formato de data (DD/MM/AAAA).
            </p>
            <button 
              onClick={() => generateTemplate(type)}
              className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded font-medium hover:bg-blue-50 transition-colors shadow-sm"
            >
              Baixar Modelo CSV
            </button>
          </div>

          {/* Passo 2: Upload */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Upload size={16} /> 2. Envie o arquivo CSV
            </h4>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet size={32} className="text-slate-400" />
                {file ? (
                  <span className="text-sm font-medium text-slate-800">{file.name}</span>
                ) : (
                  <span className="text-sm text-slate-500">Clique ou arraste o arquivo CSV aqui</span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback */}
          {result && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="pt-2 flex gap-3">
             <button
               onClick={onClose}
               className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
               disabled={isUploading}
             >
               Cancelar
             </button>
             <button
               onClick={handleUpload}
               disabled={!file || isUploading}
               className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isUploading ? <Loader2 size={18} className="animate-spin" /> : 'Importar Dados'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
