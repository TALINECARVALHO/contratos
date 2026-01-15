import React, { useState } from 'react';
import { VehicleMaintenance, Vehicle, UserProfile, DynamicSetting } from '../types';
import { Plus, Wrench, Car, AlertCircle, BarChart3 } from 'lucide-react';

interface VehicleMaintenanceListProps {
    maintenances: VehicleMaintenance[];
    vehicles: Vehicle[];
    userProfile: UserProfile | null;
    departments: DynamicSetting[];
    onNewMaintenance: () => void;
    onEditMaintenance: (maintenance: VehicleMaintenance) => void;
    onDeleteMaintenance: (id: string) => void;
    onNewVehicle: () => void;
    onEditVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (id: string) => void;
}

export const VehicleMaintenanceList: React.FC<VehicleMaintenanceListProps> = ({
    maintenances,
    vehicles,
    userProfile,
    departments,
    onNewMaintenance,
    onEditMaintenance,
    onDeleteMaintenance,
    onNewVehicle,
    onEditVehicle,
    onDeleteVehicle
}) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'maintenances' | 'vehicles' | 'reports'>('requests');
    const [filterDepartment, setFilterDepartment] = useState('');

    const isFrotas = userProfile?.department === 'FROTAS' || userProfile?.role === 'super_admin' || userProfile?.role === 'admin';

    const filteredMaintenances = maintenances.filter(m =>
        (!filterDepartment || m.requesting_department === filterDepartment) &&
        (isFrotas || m.requesting_department === userProfile?.department)
    );

    const pendingRequests = filteredMaintenances.filter(m => m.status === 'requested');
    const totalCost = filteredMaintenances.reduce((acc, m) => acc + (m.total_value || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manutenção de Veículos</h2>
                    <p className="text-slate-600 text-sm">Solicitações e controle de manutenções</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'requests' && (
                        <button
                            onClick={onNewMaintenance}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Nova Solicitação
                        </button>
                    )}
                    {activeTab === 'vehicles' && isFrotas && (
                        <button
                            onClick={onNewVehicle}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} />
                            Cadastrar Veículo
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <AlertCircle className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Solicitações Pendentes</p>
                            <p className="text-2xl font-bold text-slate-800">{pendingRequests.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Wrench className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total de Manutenções</p>
                            <p className="text-2xl font-bold text-slate-800">{maintenances.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <Car className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Veículos Cadastrados</p>
                            <p className="text-2xl font-bold text-slate-800">{vehicles.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-slate-200">
                <div className="border-b border-slate-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'requests'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Solicitações {pendingRequests.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('maintenances')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'maintenances'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Manutenções
                        </button>
                        <button
                            onClick={() => setActiveTab('vehicles')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'vehicles'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Veículos
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'reports'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Relatórios
                        </button>
                    </div>
                </div>

                {/* Filter */}
                {isFrotas && (activeTab === 'requests' || activeTab === 'maintenances') && (
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Todas as Secretarias</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'requests' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-left">Veículo</th>
                                        <th className="px-4 py-3 text-left">Secretaria</th>
                                        <th className="px-4 py-3 text-left">Tipo</th>
                                        <th className="px-4 py-3 text-left">Prioridade</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pendingRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                Nenhuma solicitação pendente
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingRequests.map(maintenance => (
                                            <tr key={maintenance.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm">
                                                    {new Date(maintenance.request_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{maintenance.vehicle_plate}</td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{maintenance.requesting_department}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {maintenance.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${maintenance.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                            maintenance.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                maintenance.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {maintenance.priority === 'urgent' ? 'Urgente' :
                                                            maintenance.priority === 'high' ? 'Alta' :
                                                                maintenance.priority === 'medium' ? 'Média' : 'Baixa'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                        Aguardando
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditMaintenance(maintenance)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        {isFrotas ? 'Processar' : 'Ver Detalhes'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'maintenances' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-left">Veículo</th>
                                        <th className="px-4 py-3 text-left">Secretaria</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMaintenances.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                                Nenhuma manutenção encontrada
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMaintenances.map(maintenance => (
                                            <tr key={maintenance.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm">
                                                    {new Date(maintenance.request_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{maintenance.vehicle_plate}</td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{maintenance.requesting_department}</td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {maintenance.total_value
                                                        ? maintenance.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${maintenance.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            maintenance.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                maintenance.status === 'approved' ? 'bg-cyan-100 text-cyan-700' :
                                                                    maintenance.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                        'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {maintenance.status === 'completed' ? 'Concluída' :
                                                            maintenance.status === 'in_progress' ? 'Em Andamento' :
                                                                maintenance.status === 'approved' ? 'Aprovada' :
                                                                    maintenance.status === 'rejected' ? 'Rejeitada' :
                                                                        'Solicitada'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditMaintenance(maintenance)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        Ver Detalhes
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'vehicles' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Placa</th>
                                        <th className="px-4 py-3 text-left">Modelo</th>
                                        <th className="px-4 py-3 text-left">Secretaria</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vehicles.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum veículo cadastrado
                                            </td>
                                        </tr>
                                    ) : (
                                        vehicles.map(vehicle => (
                                            <tr key={vehicle.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">{vehicle.plate}</td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 text-sm">{vehicle.department}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                            vehicle.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {vehicle.status === 'active' ? 'Ativo' :
                                                            vehicle.status === 'maintenance' ? 'Em Manutenção' :
                                                                'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onEditVehicle(vehicle)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="text-center py-12 text-slate-500">
                            <BarChart3 size={48} className="mx-auto mb-4 text-slate-300" />
                            <p>Relatórios em desenvolvimento</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
