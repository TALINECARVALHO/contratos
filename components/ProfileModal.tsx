import React, { useState } from 'react';
import { changeCurrentUserPassword } from '../services/userService';
import { X, Save, Loader2, Lock } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSaving(true);
    try {
      await changeCurrentUserPassword(newPassword);
      setSuccess("Senha alterada com sucesso!");
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Alterar Minha Senha
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" disabled={isSaving}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Para sua segurança, escolha uma nova senha forte e não a compartilhe com ninguém.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirme a Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
              minLength={6}
            />
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md">{success}</p>}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Nova Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};