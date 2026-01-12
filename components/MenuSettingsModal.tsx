import React, { useState, useEffect } from 'react';
import { MenuSettings, getMenuSettings, updateMenuSettings } from '../services/menuSettingsService';
import { X, Eye, EyeOff } from 'lucide-react';

interface MenuSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MenuSettingsModal: React.FC<MenuSettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<MenuSettings>({
        id: 1,
        biddings_enabled: true,
        fiscalization_enabled: true,
        reports_enabled: true,
        pgm_dispatch_enabled: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const data = await getMenuSettings();
            setSettings(data);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateMenuSettings(settings);
            alert('Configurações salvas! Recarregue a página para aplicar as mudanças.');
            onClose();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSetting = (key: keyof MenuSettings) => {
        if (typeof settings[key] === 'boolean') {
            setSettings({
                ...settings,
                [key]: !settings[key]
            });
        }
    };

    if (!isOpen) return null;

    const menuItems = [
        { key: 'biddings_enabled' as keyof MenuSettings, label: 'Licitações', description: 'Módulo de controle de licitações' },
        { key: 'fiscalization_enabled' as keyof MenuSettings, label: 'Fiscalização', description: 'Relatórios de fiscalização mensal' },
        { key: 'reports_enabled' as keyof MenuSettings, label: 'Relatórios', description: 'Relatórios e consultas' },
        { key: 'pgm_dispatch_enabled' as keyof MenuSettings, label: 'Despachos PGM', description: 'Despachos da Procuradoria' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Controle de Visibilidade de Menus</h2>
                        <p className="text-sm text-slate-600">Ative ou desative menus para trabalhar em funcionalidades offline</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-600">Carregando configurações...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Nota:</strong> Menus desativados ficarão ocultos para todos os usuários, mas você (super_admin) continuará vendo todos os menus. Recarregue a página após salvar para aplicar as mudanças.
                                </p>
                            </div>

                            {menuItems.map(item => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800">{item.label}</h3>
                                        <p className="text-sm text-slate-600">{item.description}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting(item.key)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${settings[item.key]
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {settings[item.key] ? (
                                            <>
                                                <Eye size={18} />
                                                Visível
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff size={18} />
                                                Oculto
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
