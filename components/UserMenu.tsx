import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { LogOut, Lock, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ userProfile, onLogout, onChangePassword }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!userProfile) return null;

  // Pega a inicial para o avatar
  const initial = userProfile.email ? userProfile.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
      >
        {/* Informações de Texto (Escondido em mobile muito pequeno) */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-sm font-bold text-slate-700 leading-none">
            {userProfile.email.split('@')[0]}
          </span>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 rounded mt-1 uppercase tracking-wide">
            {userProfile.department}
          </span>
        </div>

        {/* Avatar / Ícone */}
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white">
          {initial}
        </div>

        {/* Seta */}
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in origin-top-right">
          <div className="px-4 py-3 border-b border-slate-100 md:hidden">
             <p className="text-sm font-bold text-slate-800 truncate">{userProfile.email}</p>
             <p className="text-xs text-slate-500">{userProfile.department}</p>
          </div>
          
          <div className="px-2">
            <button
              onClick={() => {
                onChangePassword();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Lock size={16} />
              Alterar Senha
            </button>
            
            <div className="my-1 border-t border-slate-100"></div>
            
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Sair do Sistema
            </button>
          </div>
        </div>
      )}
    </div>
  );
};