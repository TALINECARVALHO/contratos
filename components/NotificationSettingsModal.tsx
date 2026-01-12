
import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';
import { getNotificationSettings, updateNotificationSettings } from '../services/notificationService';
import { DEFAULT_NOTIFICATION_THRESHOLDS } from '../constants';
import { X, Save, Loader2, Bell, Plus, Trash2, Mail, RotateCcw } from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [newThreshold, setNewThreshold] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar configurações. Verifique se a tabela 'notification_settings' existe no Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateNotificationSettings(settings);
      alert("Configurações salvas com sucesso!");
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar configurações: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!settings) return;
    if (window.confirm("Isso irá restaurar os dias de alerta para o padrão (180, 150, 120, 90, 60, 30, 7). Deseja continuar?")) {
      setSettings({
        ...settings,
        thresholds: [...DEFAULT_NOTIFICATION_THRESHOLDS]
      });
    }
  };

  const addThreshold = () => {
    if (!settings || !newThreshold) return;
    const val = parseInt(newThreshold);
    if (isNaN(val) || val <= 0) return;
    
    if (!settings.thresholds.includes(val)) {
      const newThresholds = [...settings.thresholds, val].sort((a, b) => b - a);
      setSettings({ ...settings, thresholds: newThresholds });
    }
    setNewThreshold('');
  };

  const removeThreshold = (val: number) => {
    if (!settings) return;
    setSettings({ ...settings, thresholds: settings.thresholds.filter(t => t !== val) });
  };

  const addEmail = () => {
    if (!settings || !newEmail) return;
    if (!newEmail.includes('@')) {
      alert("E-mail inválido");
      return;
    }
    
    if (!settings.additional_emails.includes(newEmail)) {
      setSettings({ ...settings, additional_emails: [...settings.additional_emails, newEmail] });
    }
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    if (!settings) return;
    setSettings({ ...settings, additional_emails: settings.additional_emails.filter(e => e !== email) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            Configurar Notificações
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : settings ? (
            <div className="space-y-6">
              
              {/* Thresholds Config */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Dias para alerta de vencimento
                  </label>
                  <button 
                    onClick={handleResetDefaults}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    title="Restaurar padrão: 180, 150, 120, 90, 60, 30, 7"
                  >
                    <RotateCcw size={12} /> Restaurar Padrões
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Ex: 45"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addThreshold()}
                  />
                  <button 
                    onClick={addThreshold}
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.thresholds.map(days => (
                    <span key={days} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {days} dias
                      <button onClick={() => removeThreshold(days)} className="text-slate-400 hover:text-red-500 ml-1">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Um e-mail será enviado quando faltarem exatamente estes dias para o vencimento.
                </p>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Additional Emails Config */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destinatários Adicionais (Cópia)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <button 
                    onClick={addEmail}
                    className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {settings.additional_emails.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum email adicional configurado.</p>
                  )}
                  {settings.additional_emails.map(email => (
                    <div key={email} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {email}
                      </div>
                      <button onClick={() => removeEmail(email)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Estes e-mails receberão alertas de todas as secretarias.
                </p>
              </div>

            </div>
          ) : (
            <div className="text-center text-red-500">Falha ao carregar dados.</div>
          )}

          <div className="pt-6 flex gap-3 mt-4">
             <button
               onClick={onClose}
               className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
               disabled={isSaving}
             >
               Cancelar
             </button>
             <button
               onClick={handleSave}
               disabled={isSaving || !settings}
               className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               Salvar
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
