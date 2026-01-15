import React, { useState, useEffect } from 'react';
import { Vehicle, DynamicSetting } from '../types';
import { X, Save, Car, Loader2 } from 'lucide-react';

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle | null;
    departments: DynamicSetting[];
    onSave: (data: Vehicle | Omit<Vehicle, 'id'>) => Promise<void>;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
    isOpen,
    onClose,
    vehicle,
    departments,
    onSave
}) => {
    const [formData, setFormData] = useState<Partial<Vehicle>>({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        department: '',
        type: 'car',
        status: 'active',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (vehicle) {
            setFormData(vehicle);
        } else {
            setFormData({
                plate: '',
                brand: '',
                model: '',
                year: new Date().getFullYear(),
                department: '',
                type: 'car',
                status: 'active',
                notes: ''
            });
        }
    }, [vehicle, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'year' ? parseInt(value) || new Date().getFullYear() : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData as Vehicle);
            onClose();
        } catch (error) {
            console.error('Failed to save vehicle', error);
            alert('Erro ao salvar veículo.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="text-blue-600" />
                        {vehicle ? 'Editar Veículo' : 'Cadastrar Veículo'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
                            <input
                                type="text"
                                name="plate"
                                required
                                value={formData.plate}
                                onChange={handleChange}
                                placeholder="ABC-1234"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                            <select
                                name="type"
                                required
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="car">Carro</option>
                                <option value="truck">Caminhão</option>
                                <option value="motorcycle">Moto</option>
                                <option value="bus">Ônibus</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
                            <input
                                type="text"
                                name="brand"
                                required
                                value={formData.brand}
                                onChange={handleChange}
                                placeholder="Ex: Volkswagen"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
                            <input
                                type="text"
                                name="model"
                                required
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="Ex: Gol"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ano *</label>
                            <input
                                type="number"
                                name="year"
                                required
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                            <select
                                name="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="active">Ativo</option>
                                <option value="maintenance">Em Manutenção</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria *</label>
                        <select
                            name="department"
                            required
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione...</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                        />
                    </div>
                </form>

                <div className="flex justify-end p-6 border-t border-slate-200 gap-2 bg-slate-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="vehicle-form"
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-70"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? 'Salvando...' : (vehicle ? 'Atualizar' : 'Cadastrar')}
                    </button>
                </div>
            </div>
        </div>
    );
};
