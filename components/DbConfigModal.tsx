import React from 'react';
import { DB_CONFIG_SQL } from '../supabase/fiscalization';
import { X, Copy, Database } from 'lucide-react';

interface DbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy?: () => void; // Optional callback for toast
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ isOpen, onClose, onCopy }) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (onCopy) {
      onCopy();
    } else {
      alert("Código SQL copiado! Cole no SQL Editor do Supabase.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-fade-in">
         <div className="p-5 border-b flex justify-between items-center bg-slate-50">
           <h3 className="font-bold flex gap-2 text-green-700"><Database size={20} /> Configuração do Banco de Dados</h3>
           <button onClick={onClose}><X className="text-slate-400" /></button>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
               Para <strong>corrigir erros de acesso (RLS) e ativar novas funcionalidades</strong>, copie o código abaixo e execute no 
               <strong> SQL Editor</strong> do seu projeto Supabase.
            </p>
            <div className="bg-slate-900 rounded-lg p-4 relative group">
               <button 
                 onClick={() => copyToClipboard(DB_CONFIG_SQL)}
                 className="absolute top-2 right-2 p-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                 title="Copiar Código"
               >
                 <Copy size={16} />
               </button>
               <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all overflow-y-auto max-h-60 custom-scrollbar">
                 {DB_CONFIG_SQL}
               </pre>
            </div>
         </div>
         <div className="p-4 border-t bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 font-medium">Fechar</button>
         </div>
      </div>
    </div>
  );
};
