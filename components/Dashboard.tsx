
import React, { useMemo, useState, useEffect } from 'react';
import { Contract, UserProfile, Minute, Bidding, DailyAllowance, UtilityBill, PurchaseRequest, SupplementationRequest } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList } from 'recharts';
import { CheckCircle, Clock, Filter, X, FileText, ClipboardList, Briefcase, Calendar, Building, AlertTriangle, TrendingUp, Siren, Gavel, Lightbulb, ShoppingCart, Scale } from 'lucide-react';
import { MonthDetailModal } from './MonthDetailModal';
import { exportDashboardToPDF } from '../services/exportService';
import { calculateDaysRemaining } from '../services/dateUtils';

interface DashboardProps {
  contracts: Contract[];
  minutes: Minute[];
  biddings: Bidding[];
  dailyAllowances: DailyAllowance[];
  utilityBills: UtilityBill[];
  purchaseRequests: PurchaseRequest[];
  supplementations: SupplementationRequest[];
  userProfile: UserProfile | null;
  allUsers?: UserProfile[];
}

const STATUS_COLORS = {
  active: '#22c55e', // green-500
  expired: '#ef4444', // red-500
  warning: '#eab308', // yellow-500
  executed: '#64748b', // slate-500
  rescinded: '#1e293b' // slate-800
};

const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

type DocKind = 'contract' | 'minute' | 'bidding' | 'allowance' | 'bill' | 'purchase' | 'supplementation';

interface UnifiedDocument {
  id: string;
  docKind: DocKind;
  identifier: string;
  department: string;
  object: string;
  status: 'active' | 'warning' | 'expired' | 'executed' | 'rescinded';
  date: string; // EndDate or DueDate or OpeningDate
  daysRemaining: number;
  value?: number;
  isEmergency?: boolean;
}

import { getUserPermissions } from '../utils/permissions';
// ...
export const Dashboard: React.FC<DashboardProps> = ({
  // ... props
  contracts,
  minutes,
  biddings,
  dailyAllowances,
  utilityBills,
  purchaseRequests,
  supplementations,
  userProfile,
  allUsers = []
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthDetail, setMonthDetail] = useState<{ month: string; docs: UnifiedDocument[] } | null>(null);

  const permissions = getUserPermissions(userProfile);
  const isInternalControl = userProfile?.email === 'controleinterno.sfp@gmail.com';
  const isPGM = userProfile?.role === 'pgm';
  const isManager = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || userProfile?.role === 'manager';

  // Align visibility with ContractList: Check granular permissions
  // Creating a merged "can see all contracts" flag, though properly this should be per-doctype.
  // Given the Dashboard filter only specifically restricts 'contract' kind by department currently, this is effective.
  const canSeeAllContracts = permissions.contracts?.view || permissions.contracts?.manage;

  const canSeeAll = isManager || isInternalControl || isPGM || canSeeAllContracts;

  useEffect(() => {
    if (canSeeAll) {
      setDepartmentFilter('all');
    } else if (userProfile && userProfile.department) {
      setDepartmentFilter('all'); // Users filter applied in data processing
    }
  }, [userProfile, canSeeAll]);

  const userDeptNormalized = normalizeText(userProfile?.department || '');

  // 1. UNIFY DATA SOURCES
  const unifiedData = useMemo(() => {
    const all: UnifiedDocument[] = [];

    // Contracts
    contracts.forEach(c => {
      all.push({
        id: c.id,
        docKind: 'contract',
        identifier: c.contractId,
        department: c.department,
        object: c.object,
        status: c.status,
        date: c.endDate,
        daysRemaining: c.daysRemaining,
        isEmergency: c.isEmergency
      });
    });

    // Minutes
    minutes.forEach(m => {
      all.push({
        id: m.id,
        docKind: 'minute',
        identifier: m.minuteId,
        department: m.department,
        object: m.object,
        status: m.status,
        date: m.endDate,
        daysRemaining: m.daysRemaining
      });
    });

    // Biddings
    biddings.forEach(b => {
      // Map Bidding Status to Dashboard Status
      let status: UnifiedDocument['status'] = 'active';
      if (['homologada', 'adjudicada', 'contrato_assinado', 'ata_assinada'].includes(b.status)) status = 'executed';
      else if (['fracassada', 'revogada', 'anulada', 'deserta'].includes(b.status)) status = 'rescinded';

      // Calculate days until opening if applicable
      let daysRemaining = 999;
      let date = b.openingDate || b.created_at || '';
      if (b.openingDate && (status === 'active')) {
        daysRemaining = calculateDaysRemaining(b.openingDate);
      }

      all.push({
        id: b.id,
        docKind: 'bidding',
        identifier: b.biddingId,
        department: b.department,
        object: b.object,
        status,
        date,
        daysRemaining,
        value: b.estimatedValue
      });
    });

    // Utility Bills
    utilityBills.forEach(u => {
      // Pending bills are warning (need payment) or expired (overdue)
      let status: UnifiedDocument['status'] = 'active';
      let daysRemaining = calculateDaysRemaining(u.dueDate);

      if (u.status === 'paid') status = 'executed';
      else {
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining <= 15) status = 'warning';
        else status = 'active';
      }

      all.push({
        id: u.id,
        docKind: 'bill',
        identifier: `${u.type === 'water' ? 'Água' : u.type === 'light' ? 'Luz' : 'Tel'} - ${u.referenceMonth}`,
        department: 'Administrativo', // Usually central, but could try to link to unit department if available
        object: `${u.company} - ${u.consumerUnit}`,
        status,
        date: u.dueDate,
        daysRemaining,
        value: u.value
      });
    });

    // Daily Allowances
    dailyAllowances.forEach(d => {
      let status: UnifiedDocument['status'] = 'active';
      if (d.status === 'paid' || d.status === 'accountability_approved') status = 'executed';
      else if (d.status === 'rejected' || d.status === 'accountability_rejected') status = 'rescinded';
      else status = 'warning'; // Pending approval/payment

      all.push({
        id: d.id,
        docKind: 'allowance',
        identifier: d.beneficiaryName,
        department: 'Diversos', // Usually not clearly linked to a dept in type, or general
        object: `Diária: ${d.destination}`,
        status,
        date: d.startDate,
        daysRemaining: calculateDaysRemaining(d.startDate),
        value: d.totalValue
      });
    });

    // Purchase Requests
    purchaseRequests.forEach(p => {
      let status: UnifiedDocument['status'] = 'active';
      if (p.status === 'completed') status = 'executed';
      else status = 'warning'; // Pending

      all.push({
        id: p.id,
        docKind: 'purchase',
        identifier: p.number,
        department: p.department,
        object: p.object || 'Solicitação de Compra',
        status,
        date: p.date,
        daysRemaining: 0, // Not expiring exactly
      });
    });

    // Supplementations
    supplementations.forEach(s => {
      let status: UnifiedDocument['status'] = 'active';
      if (s.status === 'published') status = 'executed';
      else if (s.status === 'rejected') status = 'rescinded';
      else status = 'warning'; // Pending

      all.push({
        id: s.id,
        docKind: 'supplementation',
        identifier: s.decree_number || 'Pend.',
        department: s.department,
        object: `Suplementação`,
        status,
        date: s.created_at || '',
        daysRemaining: 0,
      });
    });

    return all;
  }, [contracts, minutes, biddings, dailyAllowances, utilityBills, purchaseRequests, supplementations]);


  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    unifiedData.forEach(doc => {
      if (doc.department) depts.add(doc.department);
    });
    return Array.from(depts).sort();
  }, [unifiedData]);

  const filteredDocs = useMemo(() => {
    return unifiedData.filter(doc => {
      // Visibility Rules
      if (!canSeeAll) {
        // Should filter by department for restricted content
        // Simplified: if doc has department, must match user department.
        // Some global items like Utility Bills might be visible to all or just admin.
        // For now sticking to loose filter:
        const docDeptNormalized = normalizeText(doc.department || '');
        if (docDeptNormalized && docDeptNormalized !== userDeptNormalized && doc.docKind === 'contract') return false;
      }

      const matchDept = departmentFilter === 'all' || doc.department === departmentFilter;
      const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchDept && matchStatus;
    });
  }, [unifiedData, departmentFilter, statusFilter, canSeeAll, userDeptNormalized]);

  // KPIs
  const totalDocs = filteredDocs.length;
  const activeCount = filteredDocs.filter(c => c.status === 'active').length;
  const warningCount = filteredDocs.filter(c => c.status === 'warning').length;
  // Refined Emergency Count: Only Active/Warning Emergency Contracts
  const emergencyCount = filteredDocs.filter(c => c.docKind === 'contract' && c.isEmergency && (c.status === 'active' || c.status === 'warning')).length;

  // Counts by Type
  const countsByType = {
    contract: filteredDocs.filter(d => d.docKind === 'contract').length,
    minute: filteredDocs.filter(d => d.docKind === 'minute').length,
    bidding: filteredDocs.filter(d => d.docKind === 'bidding').length,
    bill: filteredDocs.filter(d => d.docKind === 'bill').length,
    allowance: filteredDocs.filter(d => d.docKind === 'allowance').length,
    purchase: filteredDocs.filter(d => d.docKind === 'purchase').length,
    supplementation: filteredDocs.filter(d => d.docKind === 'supplementation').length,
  };

  // Status Chart Data
  const statusData = useMemo(() => {
    const counts = { active: 0, expired: 0, warning: 0, executed: 0, rescinded: 0 };
    filteredDocs.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return [
      { name: 'Vigentes', value: counts.active, color: STATUS_COLORS.active },
      { name: 'Atenção', value: counts.warning, color: STATUS_COLORS.warning },
      { name: 'Vencidos', value: counts.expired, color: STATUS_COLORS.expired },
      { name: 'Executados', value: counts.executed, color: STATUS_COLORS.executed },
      { name: 'Rescindidos', value: counts.rescinded, color: STATUS_COLORS.rescinded },
    ].filter(d => d.value > 0);
  }, [filteredDocs]);

  // Dept Chart Data (Active only)
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDocs.filter(d => d.status === 'active' || d.status === 'warning').forEach(doc => {
      if (doc.department) {
        counts[doc.department] = (counts[doc.department] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredDocs]);

  // Critical Items (Next 30 days + Recent Overdue)
  const nextExpiring = useMemo(() => {
    // 1. Filter relevant items (Active/Warning expiring soon OR Recently Expired)
    const critical = filteredDocs.filter(d => {
      const isWarning = (d.status === 'active' || d.status === 'warning') && d.daysRemaining <= 30 && d.daysRemaining >= 0;
      const isRecentOverdue = d.status === 'expired' && d.daysRemaining >= -30; // Only show overdue heavily if recent
      // Also filter out bad dates (e.g. 1900)
      const isValidDate = !d.date.includes('/1900') && !d.date.includes('/1969') && !d.date.includes('/1970');

      return (isWarning || isRecentOverdue) && isValidDate;
    });

    // 2. Sort: Warnings (0 to 30) first, then Recent Overdue (0 to -30)
    return critical.sort((a, b) => {
      // Prioritize positive (upcoming) over negative (expired)
      if (a.daysRemaining >= 0 && b.daysRemaining < 0) return -1;
      if (a.daysRemaining < 0 && b.daysRemaining >= 0) return 1;

      // If both positive, smaller is better (sooner)
      if (a.daysRemaining >= 0) return a.daysRemaining - b.daysRemaining;

      // If both negative, larger (closer to 0) is better? Or worse?
      // "Recently expired" -> -1 is more relevant than -30 usually.
      return b.daysRemaining - a.daysRemaining; // -1 before -30
    });
  }, [filteredDocs]);

  const useTwoColumns = nextExpiring.length > 5;
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }: any) => {
    if (percent < 0.05 || value === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold">
        {value}
      </text>
    );
  };

  const getIconForType = (type: DocKind) => {
    switch (type) {
      case 'contract': return <FileText size={12} className="text-blue-500" />;
      case 'minute': return <ClipboardList size={12} className="text-purple-500" />;
      case 'bidding': return <Gavel size={12} className="text-orange-500" />;
      case 'bill': return <Lightbulb size={12} className="text-yellow-500" />;
      case 'allowance': return <Briefcase size={12} className="text-green-500" />;
      case 'purchase': return <ShoppingCart size={12} className="text-teal-500" />;
      case 'supplementation': return <TrendingUp size={12} className="text-indigo-500" />;
      default: return <FileText size={12} />;
    }
  };

  const clearFilters = () => {
    setDepartmentFilter('all');
    setStatusFilter('all');
  };

  const handleExport = () => {
    if (!userProfile) return;
    // Adapt to new data structure if needed for export logic, passing basic metrics for now
    const dashboardData = {
      kpis: { total: totalDocs, active: activeCount, warning: warningCount, emergency: emergencyCount },
      statusData, deptData, supplierData: [], nextExpiring: nextExpiring as any
    };
    exportDashboardToPDF(dashboardData, userProfile, departmentFilter === 'all' ? 'Geral' : departmentFilter);
  };

  const hasActiveFilters = departmentFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-blue-500">
          <div>
            <p className="text-sm text-slate-500 font-medium">Total de Itens</p>
            <h3 className="text-3xl font-bold text-slate-800">{totalDocs}</h3>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
              <span title="Contratos" className="flex items-center gap-1"><FileText size={10} /> {countsByType.contract}</span>
              <span title="Atas" className="flex items-center gap-1"><ClipboardList size={10} /> {countsByType.minute}</span>
              <span title="Licitações" className="flex items-center gap-1"><Gavel size={10} /> {countsByType.bidding}</span>
              <span title="Contas" className="flex items-center gap-1"><Lightbulb size={10} /> {countsByType.bill}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600"><Briefcase size={24} /></div>
        </div>

        {/* Active Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-green-500">
          <div><p className="text-sm text-slate-500 font-medium">Vigentes/Em Andamento</p><h3 className="text-3xl font-bold text-green-600">{activeCount}</h3></div>
          <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle size={24} /></div>
        </div>

        {/* Warning Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-yellow-500">
          <div><p className="text-sm text-slate-500 font-medium">Atenção (Pendências)</p><h3 className="text-3xl font-bold text-yellow-600">{warningCount}</h3></div>
          <div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><Clock size={24} /></div>
        </div>

        {/* Emergency/Expired Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md border-l-4 border-l-red-500">
          <div><p className="text-sm text-slate-500 font-medium">Contratos Emergenciais</p><h3 className="text-3xl font-bold text-red-600">{emergencyCount}</h3></div>
          <div className="p-3 bg-red-50 rounded-full text-red-600"><Siren size={24} /></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-medium"><Filter size={20} className="text-blue-600" /><span>Filtros do Dashboard</span></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px] w-full sm:w-auto">
            <option value="all">Todas as Situações</option>
            <option value="active">Vigentes/Em Andamento</option>
            <option value="warning">Atenção</option>
            <option value="expired">Vencidos</option>
            <option value="executed">Concluídos/Executados</option>
          </select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px] w-full sm:w-auto">
            <option value="all">Todas as Secretarias</option>
            {uniqueDepartments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
          </select>
          {hasActiveFilters && (<button onClick={clearFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 justify-center w-full sm:w-auto"><X size={16} /> Limpar</button>)}
          <button onClick={handleExport} className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"><FileText size={16} className="text-red-500" /> Exportar PDF</button>
        </div>
      </div>

      {/* Module Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contratos e Atas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="px-4 py-3 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2"><FileText size={16} /> Contratos e Atas</h3>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{countsByType.contract + countsByType.minute} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {nextExpiring.filter(d => (d.docKind === 'contract' || d.docKind === 'minute') && d.daysRemaining >= 0).length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {nextExpiring.filter(d => (d.docKind === 'contract' || d.docKind === 'minute') && d.daysRemaining >= 0).map((doc, idx) => (
                  <div key={`c-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className={`w-1 h-8 rounded-full shrink-0 ${doc.daysRemaining <= 30 ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-800">{doc.identifier}</span></div>
                      <p className="text-[10px] text-slate-500 truncate">{doc.object}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.daysRemaining <= 30 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {doc.daysRemaining}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">Nenhum vencimento próximo</p>
              </div>
            )}
          </div>
        </div>

        {/* Licitações */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="px-4 py-3 border-b border-slate-100 bg-orange-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2"><Gavel size={16} /> Licitações em Aberto</h3>
            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">{countsByType.bidding} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {filteredDocs.filter(d => d.docKind === 'bidding' && d.status === 'active').length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {filteredDocs.filter(d => d.docKind === 'bidding' && d.status === 'active')
                  .sort((a, b) => a.daysRemaining - b.daysRemaining)
                  .map((doc, idx) => (
                    <div key={`b-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <div className="w-1 h-8 rounded-full shrink-0 bg-orange-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-800">{doc.identifier}</span></div>
                        <p className="text-[10px] text-slate-500 truncate">{doc.object}</p>
                        <p className="text-[10px] text-orange-600 font-medium">{doc.date}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">Nenhuma licitação ativa</p>
              </div>
            )}
          </div>
        </div>

        {/* Pendências Financeiras */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="px-4 py-3 border-b border-slate-100 bg-yellow-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-2"><Lightbulb size={16} /> Financeiro (Pendentes)</h3>
            <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{countsByType.bill + countsByType.allowance + countsByType.supplementation + countsByType.purchase} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            {filteredDocs.filter(d => ['bill', 'allowance', 'supplementation', 'purchase'].includes(d.docKind) && (d.status === 'warning' || d.status === 'expired')).length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {filteredDocs.filter(d => ['bill', 'allowance', 'supplementation', 'purchase'].includes(d.docKind) && (d.status === 'warning' || d.status === 'expired'))
                  .sort((a, b) => a.daysRemaining - b.daysRemaining)
                  .map((doc, idx) => (
                    <div key={`f-${idx}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <div className={`w-1 h-8 rounded-full shrink-0 ${doc.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getIconForType(doc.docKind)}
                          <span className="text-xs font-bold text-slate-800">{doc.identifier}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{doc.object}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {doc.docKind === 'bill' ? `Vanc: ${doc.date}` : doc.status === 'expired' ? 'Vencido' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">Nenhuma pendência financeira</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart className="text-slate-400" size={18} /> Situação Geral</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                  {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (<div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Nenhum dado para exibir.</div>)}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building className="text-slate-400" size={18} /> Top 5 Secretarias</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Ativos/Vigentes</span>
          </div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} name="Itens Ativos">
                  <LabelList dataKey="value" position="right" fill="#64748b" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Nenhum dado para exibir.</div>)}
        </div>
      </div>

      {monthDetail && (/* Reusing existing modal if compatible or create new generic one */
        <MonthDetailModal isOpen={!!monthDetail} onClose={() => setMonthDetail(null)} month={monthDetail.month} documents={monthDetail.docs as any} />
      )}
    </div>
  );
};
