
import React, { useState, useEffect } from 'react';
import { ViewMode, Contract, UserProfile, Minute, AlertDocument, FiscalizationReport, NotificationSettings, ContractAmendment, Bidding, Commitment, DailyAllowance, UtilityBill, SupplementationRequest, UtilityCommitment, PurchaseRequest, UtilityUnit, DynamicSetting, FuelRecord, FuelCommitment, Vehicle, VehicleMaintenance } from './types';
import { fetchContracts, createContract, updateContract, deleteContract } from './services/contractService';
import { fetchMinutes, createMinute, updateMinute, deleteMinute } from './services/minuteService';
import { fetchBiddings, createBidding, updateBidding, deleteBidding } from './services/biddingService';
import { getCurrentUserProfile, getAllProfiles } from './services/userService';
import { getNotificationSettings, sendAppNotification } from './services/notificationService';
import { getMenuSettings, MenuSettings } from './services/menuSettingsService';
import { fetchAllFiscalizationReports } from './services/fiscalizationService';
import { Dashboard } from './components/Dashboard';
import { ContractList } from './components/ContractList';
import { MinuteList } from './components/MinuteList';
import { BiddingList } from './components/BiddingList';
import { BiddingModal } from './components/BiddingModal';
import { BiddingCalendar } from './components/BiddingCalendar';

import { MenuSettingsModal } from './components/MenuSettingsModal';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { SystemTools } from './components/SystemTools';
import { FiscalizationList } from './components/FiscalizationList';
import { PGMDispatchList } from './components/PGMDispatchList';
import { AmendmentModal } from './components/AmendmentModal';
import { fetchAmendments, createAmendment, updateAmendment, deleteAmendment as apiDeleteAmendment } from './services/amendmentService';
import { fetchCommitments, createCommitment, updateCommitment, deleteCommitment } from './services/commitmentService';
import { fetchDailyAllowances, createDailyAllowance, updateDailyAllowance, deleteDailyAllowance } from './services/dailyAllowanceService';
import { fetchUtilityBills, createUtilityBill, updateUtilityBill, deleteUtilityBill, fetchUtilityCommitments, createUtilityCommitment, updateUtilityCommitment, deleteUtilityCommitment } from './services/utilityBillService';
import { fetchUtilityUnits, createUtilityUnit, updateUtilityUnit, deleteUtilityUnit } from './services/utilityUnitService';
import { fetchDepartments } from './services/settingsService';
import { fetchSupplementations, createSupplementation, updateSupplementation, deleteSupplementation } from './services/supplementationService';
import { fetchPurchaseRequests, createPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest } from './services/purchaseService';
import { fetchFuelRecords, createFuelRecord, updateFuelRecord, deleteFuelRecord, fetchFuelCommitments, createFuelCommitment, updateFuelCommitment, deleteFuelCommitment } from './services/fuelService';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle, fetchVehicleMaintenances, createVehicleMaintenance, updateVehicleMaintenance, deleteVehicleMaintenance } from './services/vehicleMaintenanceService';

import { ProfileModal } from './components/ProfileModal';
import { supabase } from './services/supabaseClient';
import { LayoutDashboard, FileText, Menu, Loader2, AlertCircle, Database, Users, ClipboardList, ShieldCheck, FileSearch, Settings, RefreshCw, BookOpen, Scale, Gavel, Eye, Banknote, Briefcase, Lightbulb, TrendingUp, ShoppingCart, ChevronLeft, ChevronRight, Droplet, Wrench } from 'lucide-react';
import { Logo } from './components/Logo';
import { DbConfigModal } from './components/DbConfigModal';
import { ContractModal } from './components/ContractModal';
import { MinuteModal } from './components/MinuteModal';
import { CommitmentList } from './components/CommitmentList';
import { CommitmentModal } from './components/CommitmentModal';
import { DailyAllowanceList } from './components/DailyAllowanceList';
import { DailyAllowanceModal } from './components/DailyAllowanceModal';
import { UtilityBillList } from './components/UtilityBillList';
import { UtilityBillModal } from './components/UtilityBillModal';
import { UtilityUnitModal } from './components/UtilityUnitModal';
import { UtilityCommitmentModal } from './components/UtilityCommitmentModal';
import { SupplementationList } from './components/SupplementationList';
import { SupplementationModal } from './components/SupplementationModal';
import { PurchaseRequestList } from './components/PurchaseRequestList';
import { PurchaseRequestModal } from './components/PurchaseRequestModal';
import { UserMenu } from './components/UserMenu';
import { NotificationCenter } from './components/NotificationCenter';
import { SupplementationForm } from './components/SupplementationForm';
import { AmendmentList } from './components/AmendmentList';
import { addDurationToDate, calculateDaysRemaining } from './services/dateUtils';
import { FuelList } from './components/FuelList';
import { FuelModal } from './components/FuelModal';
import { FuelCommitmentModal } from './components/FuelCommitmentModal';
import { VehicleMaintenanceList } from './components/VehicleMaintenanceList';
import { VehicleMaintenanceModal } from './components/VehicleMaintenanceModal';
import { VehicleModal } from './components/VehicleModal';

import { getUserPermissions } from './utils/permissions';

const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem('app_current_view') as ViewMode) || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [biddings, setBiddings] = useState<Bidding[]>([]);
  const [dailyAllowances, setDailyAllowances] = useState<DailyAllowance[]>([]);
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [utilityCommitments, setUtilityCommitments] = useState<UtilityCommitment[]>([]);
  const [utilityUnits, setUtilityUnits] = useState<UtilityUnit[]>([]);
  const [supplementations, setSupplementations] = useState<SupplementationRequest[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [reports, setReports] = useState<FiscalizationReport[]>([]);
  const [departments, setDepartments] = useState<DynamicSetting[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionsError, setIsPermissionsError] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDbConfigModalOpen, setIsDbConfigModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingMinute, setEditingMinute] = useState<Minute | null>(null);
  const [isMinuteModalOpen, setIsMinuteModalOpen] = useState(false);
  const [editingBidding, setEditingBidding] = useState<Bidding | null>(null);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [isBiddingCalendarOpen, setIsBiddingCalendarOpen] = useState(false);

  const [amendments, setAmendments] = useState<ContractAmendment[]>([]);
  const [editingAmendment, setEditingAmendment] = useState<ContractAmendment | null>(null);
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [selectedContractForPortal, setSelectedContractForPortal] = useState<Contract | null>(null);
  const [menuSettings, setMenuSettings] = useState<MenuSettings | null>(null);
  const [isMenuSettingsModalOpen, setIsMenuSettingsModalOpen] = useState(false);

  // New Modals State
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [editingDailyAllowance, setEditingDailyAllowance] = useState<DailyAllowance | null>(null);
  const [editingDailyAllowanceKey, setEditingDailyAllowanceKey] = useState<'solicitation' | 'accountability'>('solicitation');
  const [isDailyAllowanceModalOpen, setIsDailyAllowanceModalOpen] = useState(false);
  const [editingUtilityBill, setEditingUtilityBill] = useState<UtilityBill | null>(null);
  const [isUtilityBillModalOpen, setIsUtilityBillModalOpen] = useState(false);
  const [editingUtilityUnit, setEditingUtilityUnit] = useState<UtilityUnit | null>(null);
  const [isUtilityUnitModalOpen, setIsUtilityUnitModalOpen] = useState(false);
  const [editingUtilityCommitment, setEditingUtilityCommitment] = useState<UtilityCommitment | null>(null);
  const [isUtilityCommitmentModalOpen, setIsUtilityCommitmentModalOpen] = useState(false);
  const [editingSupplementation, setEditingSupplementation] = useState<SupplementationRequest | null>(null);
  const [isSupplementationModalOpen, setIsSupplementationModalOpen] = useState(false);

  const [editingPurchaseRequest, setEditingPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [purchaseRequestMode, setPurchaseRequestMode] = useState<'create' | 'edit' | 'manage'>('create');
  const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] = useState(false);
  const [isCreatingSupplementation, setIsCreatingSupplementation] = useState(false);

  // Fuel Management States
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [fuelCommitments, setFuelCommitments] = useState<FuelCommitment[]>([]);
  const [editingFuelRecord, setEditingFuelRecord] = useState<FuelRecord | null>(null);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuelCommitment, setEditingFuelCommitment] = useState<FuelCommitment | null>(null);
  const [isFuelCommitmentModalOpen, setIsFuelCommitmentModalOpen] = useState(false);

  // Vehicle Maintenance States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleMaintenances, setVehicleMaintenances] = useState<VehicleMaintenance[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleMaintenance, setEditingVehicleMaintenance] = useState<VehicleMaintenance | null>(null);
  const [isVehicleMaintenanceModalOpen, setIsVehicleMaintenanceModalOpen] = useState(false);

  useEffect(() => { localStorage.setItem('app_current_view', view); }, [view]);

  useEffect(() => {
    if (!supabase) { setError("Falha no Banco de Dados."); setIsAppReady(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile();
      setIsAppReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { fetchUserProfile(); } else { setUserProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    } catch (e) { console.error("Failed profile load", e); }
  };

  const loadData = async () => {
    if (!session) return;
    setIsLoadingData(true);
    setError(null);
    setIsPermissionsError(false);
    try {
      const [contractsData, minutesData, biddingsData, reportsData, usersData, settingsData, amendmentsData, menuSettingsData, dailyAllowancesData, utilityBillsData, utilityCommitmentsData, utilityUnitsData, supplementationsData, purchaseRequestsData, departmentsData, fuelRecordsData, fuelCommitmentsData, vehiclesData, vehicleMaintenancesData] = await Promise.all([
        fetchContracts(),
        fetchMinutes().catch(() => []),
        fetchBiddings().catch(() => []),
        fetchAllFiscalizationReports().catch(() => []),
        (userProfile?.role === 'super_admin' || userProfile?.role === 'admin') ? getAllProfiles().catch(() => []) : Promise.resolve([]),
        getNotificationSettings().catch(() => null),
        fetchAmendments().catch(() => []),
        getMenuSettings().catch(() => null),
        fetchDailyAllowances().catch(() => []),
        fetchUtilityBills().catch(() => []),
        fetchUtilityCommitments().catch(() => []),
        fetchUtilityUnits().catch(() => []),
        fetchSupplementations().catch(() => []),
        fetchPurchaseRequests().catch(() => []),
        fetchDepartments().catch(() => []),
        fetchFuelRecords().catch(() => []),
        fetchFuelCommitments().catch(() => []),
        fetchVehicles().catch(() => []),
        fetchVehicleMaintenances().catch(() => [])
      ]);
      setContracts(contractsData);
      setMinutes(minutesData);
      setBiddings(biddingsData);
      setReports(reportsData);
      setAllUsers(usersData);
      setNotificationSettings(settingsData);
      setAmendments(amendmentsData);
      setMenuSettings(menuSettingsData);
      setDailyAllowances(dailyAllowancesData);
      setUtilityBills(utilityBillsData);
      setUtilityCommitments(utilityCommitmentsData);
      setUtilityUnits(utilityUnitsData);
      setSupplementations(supplementationsData);
      setPurchaseRequests(purchaseRequestsData);
      setDepartments(departmentsData);
      setFuelRecords(fuelRecordsData);
      setFuelCommitments(fuelCommitmentsData);
      setVehicles(vehiclesData);
      setVehicleMaintenances(vehicleMaintenancesData);
    } catch (err: any) {
      console.error("Load error:", err);
      if (err.message.includes("policy")) setIsPermissionsError(true);
      setError(`Erro de Permissão: ${err.message}`);
    } finally { setIsLoadingData(false); }
  };

  const enrichedContracts = React.useMemo(() => {
    return contracts.map(contract => {
      // Filtra apenas aditivos de prazo CONCLUÍDOS (step8 = true)
      const contractAmendments = amendments.filter(a => {
        const isSigned = typeof a.checklist?.step5 === 'object' ? a.checklist.step5.received : a.checklist?.step5;
        return String(a.contractId) === String(contract.id) &&
          a.type === 'prazo' &&
          (a.checklist?.step8 === true || isSigned);
      });

      let effectiveEndDate = contract.endDate;
      contractAmendments.forEach(amendment => {
        effectiveEndDate = addDurationToDate(effectiveEndDate, amendment.duration, amendment.durationUnit);
      });

      const daysRemaining = calculateDaysRemaining(effectiveEndDate);

      let status: Contract['status'];
      if (contract.manualStatus === 'executed' || contract.manualStatus === 'rescinded') {
        status = contract.manualStatus;
      } else {
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining <= 30) status = 'warning';
        else status = 'active';
      }

      const activeAmendment = amendments.find(a => String(a.contractId) === String(contract.id) && a.type === 'prazo' && !a.checklist?.step8);
      let activeAmendmentStatus = '';
      if (activeAmendment) {
        if (activeAmendment.checklist.step4) {
          switch (activeAmendment.checklist.step4) {
            case 'approved': activeAmendmentStatus = 'PGM: Aprovado'; break;
            case 'rejected': activeAmendmentStatus = 'PGM: Reprovado'; break;
            case 'approved_with_reservation': activeAmendmentStatus = 'PGM: Ressalva'; break;
          }
        } else if (activeAmendment.checklist.step3) {
          const lastHistory = activeAmendment.pgmHistory && activeAmendment.pgmHistory.length > 0 ? activeAmendment.pgmHistory[activeAmendment.pgmHistory.length - 1] : null;
          if (lastHistory && lastHistory.decision === 'comment') {
            activeAmendmentStatus = 'PGM: Comentário';
          } else {
            activeAmendmentStatus = 'PGM: Em Análise';
          }
        } else {
          activeAmendmentStatus = 'Em Elaboração';
        }
      }

      return {
        ...contract,
        endDate: effectiveEndDate,
        baseEndDate: contract.endDate, // Mantemos o original para referência se necessário
        daysRemaining,
        status,
        activeAmendmentStatus
      };
    });
  }, [contracts, amendments]);

  useEffect(() => { if (userProfile) loadData(); }, [userProfile]);

  const handleLogout = async () => { await supabase?.auth.signOut(); setSession(null); setUserProfile(null); setView('dashboard'); };

  if (!isAppReady) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-blue-500 mb-4" size={48} /><h2 className="text-xl font-bold">Iniciando...</h2></div>;
  if (!session) return <Login />;

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin';
  const isPGM = userProfile?.role === 'pgm';
  const isInternalControl = userProfile?.email === 'controleinterno.sfp@gmail.com';

  const perms = getUserPermissions(userProfile);

  const getViewTitle = (currentView: string) => {
    switch (currentView) {
      case 'dashboard': return 'PAINEL DE CONTROLE';
      case 'contracts': return 'GESTÃO DE CONTRATOS';
      case 'minutes': return 'ATAS DE REGISTRO DE PREÇOS';
      case 'bidding': return 'CONTROLE DE LICITAÇÕES';
      case 'fiscalization': return 'FISCALIZAÇÃO MENSAL';
      case 'reports': return 'RELATÓRIOS E CONSULTAS';
      case 'users': return 'GESTÃO DE USUÁRIOS';
      case 'settings': return 'CONFIGURAÇÕES DO SISTEMA';
      case 'help': return 'MANUAL DO USUÁRIO';
      case 'pgm_dispatch': return 'DESPACHOS PGM';
      case 'purchase_requests': return 'EMPENHOS';
      case 'daily_allowances': return 'DIÁRIAS';
      case 'utility_bills': return 'CONTAS DE CONSUMO';
      case 'supplementations': return 'SUPLEMENTAÇÃO ORÇAMENTÁRIA';
      case 'amendments': return 'GESTÃO DE ADITIVOS';
      case 'fuel_management': return 'GESTÃO DE COMBUSTÍVEL';
      case 'vehicle_maintenance': return 'MANUTENÇÃO DE VEÍCULOS';
      default: return currentView.toUpperCase();
    }
  };

  // Helper to render nav items
  const NavItem = ({ viewName, icon: Icon, label, enabled = true }: { viewName: ViewMode, icon: any, label: string, enabled?: boolean }) => {
    if (!enabled) return null;
    const isActive = view === viewName;
    return (
      <button
        onClick={() => { setView(viewName); setIsSidebarOpen(false); }}
        title={isSidebarCollapsed ? label : ''}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon size={20} className="shrink-0" />
        {!isSidebarCollapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  // ... (rest of the component)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed md:relative z-30 h-full bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-4 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && <Logo size={32} showText={true} lightMode={true} />}
          {isSidebarCollapsed && <Logo size={32} showText={false} lightMode={true} />}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <NavItem viewName="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem viewName="contracts" icon={FileText} label="Contratos" enabled={!!perms.contracts?.view} />
          <NavItem viewName="amendments" icon={RefreshCw} label="Aditivos" enabled={!!perms.contracts?.view} />
          <NavItem viewName="minutes" icon={ClipboardList} label="Atas" enabled={!!perms.minutes?.view} />
          <NavItem viewName="bidding" icon={Gavel} label="Licitações" enabled={!!(perms.biddings?.view && menuSettings?.biddings_enabled)} />
          <NavItem viewName="purchase_requests" icon={ShoppingCart} label="Empenhos" enabled={!!perms.purchase_request?.view} />
          <NavItem viewName="daily_allowances" icon={Briefcase} label="Diárias" enabled={!!perms.daily_allowance?.view} />
          <NavItem viewName="utility_bills" icon={Lightbulb} label="Água/Luz" enabled={!!perms.utility_bills?.view} />
          <NavItem viewName="fuel_management" icon={Droplet} label="Combustível" enabled={!!perms.fuel_management?.view} />
          <NavItem viewName="vehicle_maintenance" icon={Wrench} label="Manutenção" enabled={!!perms.vehicle_maintenance?.view} />
          <NavItem viewName="supplementations" icon={TrendingUp} label="Suplementação" enabled={!!perms.supplementation?.view} />
          <NavItem viewName="pgm_dispatch" icon={Scale} label="Despachos PGM" enabled={!!(perms.pgm_dispatch?.view && menuSettings?.pgm_dispatch_enabled)} />
          <NavItem viewName="fiscalization" icon={ShieldCheck} label="Fiscalização" enabled={!!(perms.fiscalization?.view && menuSettings?.fiscalization_enabled)} />
          <NavItem viewName="users" icon={Users} label="Usuários" enabled={!!perms.users?.view} />
          {isSuperAdmin && <NavItem viewName="settings" icon={Settings} label="Configurações" />}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
          <div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"><Menu size={24} /></button><h1 className="text-xl font-bold text-slate-800">{getViewTitle(view)}</h1></div>
          <div className="flex items-center gap-4">
            <button onClick={() => loadData()} disabled={isLoadingData} className={`p-2 rounded-full ${isLoadingData ? 'text-blue-500' : 'text-slate-400 hover:bg-slate-100'}`} title="Atualizar"><RefreshCw size={20} className={isLoadingData ? 'animate-spin' : ''} /></button>
            {isSuperAdmin && (
              <button
                onClick={() => setIsMenuSettingsModalOpen(true)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100"
                title="Controlar Visibilidade de Menus"
              >
                <Eye size={20} />
              </button>
            )}
            {isPermissionsError && <button onClick={() => setIsDbConfigModalOpen(true)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"><Database size={14} /> Reparar Acesso</button>}
            <NotificationCenter userProfile={userProfile} />
            <UserMenu userProfile={userProfile} onLogout={handleLogout} onChangePassword={() => setIsProfileModalOpen(true)} />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between shadow-sm"><div><p className="font-bold">Aviso de Banco de Dados</p><p className="text-sm">{error}</p></div><button onClick={() => setIsDbConfigModalOpen(true)} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium">Corrigir SQL</button></div>}
          {view === 'dashboard' && (
            <Dashboard
              contracts={enrichedContracts}
              minutes={minutes}
              biddings={biddings}
              dailyAllowances={dailyAllowances}
              utilityBills={utilityBills}
              purchaseRequests={purchaseRequests}
              supplementations={supplementations}
              userProfile={userProfile}
              allUsers={allUsers}
            />
          )}
          {view === 'contracts' && <ContractList contracts={enrichedContracts} reports={reports} userProfile={userProfile} onNewContract={() => { setEditingContract(null); setIsContractModalOpen(true); }} onEditContract={(c) => { setEditingContract(c); setIsContractModalOpen(true); }} onDeleteContract={deleteContract} />}
          {view === 'minutes' && <MinuteList minutes={minutes} reports={reports} userProfile={userProfile} onNewMinute={() => { setEditingMinute(null); setIsMinuteModalOpen(true); }} onEditMinute={(m) => { setEditingMinute(m); setIsMinuteModalOpen(true); }} onDeleteMinute={deleteMinute} />}
          {view === 'bidding' && <BiddingList biddings={biddings} userProfile={userProfile} onNewBidding={() => { setEditingBidding(null); setIsBiddingModalOpen(true); }} onEditBidding={(b) => { setEditingBidding(b); setIsBiddingModalOpen(true); }} onDeleteBidding={deleteBidding} onViewCalendar={() => setIsBiddingCalendarOpen(true)} />}
          {view === 'fiscalization' && <FiscalizationList contracts={enrichedContracts} minutes={minutes} userProfile={userProfile} />}
          {view === 'pgm_dispatch' && <PGMDispatchList
            amendments={amendments}
            contracts={enrichedContracts}
            userProfile={userProfile}
            onEditAmendment={(a) => { setEditingAmendment(a); setIsAmendmentModalOpen(true); }}
            onRemoveFromAnalysis={async (amendment) => {
              try {
                // Remove de análise PGM (step3 = false) e limpa status PGM (step4 = null)
                const updatedChecklist = { ...amendment.checklist, step3: false, step4: null };
                // Also reset decision
                const updatePayload = {
                  ...amendment,
                  checklist: updatedChecklist,
                  pgmDecision: null,
                  pgmNotes: ''
                } as ContractAmendment;

                await updateAmendment(updatePayload);

                // Notifica que foi devolvido
                const contract = contracts.find(c => String(c.id) === String(amendment.contractId));
                const { sendAppNotification } = await import('./services/notificationService');
                await sendAppNotification({
                  department: contract?.department || 'GABINETE',
                  title: `Aditivo Devolvido pela PGM: ${amendment.eventName}`,
                  message: `O aditivo foi removido da lista de análise e devolvido para elaboração.`,
                });

                loadData();
              } catch (error) {
                console.error("Erro ao remover da análise:", error);
                alert("Erro ao remover item da análise.");
              }
            }}
          />}
          {view === 'purchase_requests' && <PurchaseRequestList requests={purchaseRequests} userProfile={userProfile} onNew={() => { setEditingPurchaseRequest(null); setPurchaseRequestMode('create'); setIsPurchaseRequestModalOpen(true); }} onEdit={(r) => { setEditingPurchaseRequest(r); setPurchaseRequestMode('edit'); setIsPurchaseRequestModalOpen(true); }} onManage={(r) => { setEditingPurchaseRequest(r); setPurchaseRequestMode('manage'); setIsPurchaseRequestModalOpen(true); }} onDelete={async (id) => { await deletePurchaseRequest(id); loadData(); }} />}
          {view === 'daily_allowances' && (
            <DailyAllowanceList
              dailyAllowances={dailyAllowances}
              userProfile={userProfile}
              onNew={() => { setEditingDailyAllowance(null); setEditingDailyAllowanceKey('solicitation'); setIsDailyAllowanceModalOpen(true); }}
              onEdit={(d) => { setEditingDailyAllowance(d); setEditingDailyAllowanceKey('solicitation'); setIsDailyAllowanceModalOpen(true); }}
              onAccountability={(d) => { setEditingDailyAllowance(d); setEditingDailyAllowanceKey('accountability'); setIsDailyAllowanceModalOpen(true); }}
              onDelete={async (id) => { await deleteDailyAllowance(id); loadData(); }}
            />
          )}
          {view === 'utility_bills' && (
            <UtilityBillList
              bills={utilityBills}
              userProfile={userProfile}
              commitments={utilityCommitments}
              onNew={() => { setEditingUtilityBill(null); setIsUtilityBillModalOpen(true); }}
              onEdit={(b) => { setEditingUtilityBill(b); setIsUtilityBillModalOpen(true); }}
              onDelete={async (id) => { await deleteUtilityBill(id); loadData(); }}
              onManageCommitment={(c) => { setEditingUtilityCommitment(c); setIsUtilityCommitmentModalOpen(true); }}
              onDeleteCommitment={async (id) => { await deleteUtilityCommitment(id); loadData(); }}
              onManageUnit={(u) => { setEditingUtilityUnit(u); setIsUtilityUnitModalOpen(true); }}
              onDeleteUnit={async (id) => { await deleteUtilityUnit(id); loadData(); }}
              units={utilityUnits}
              departments={departments}
              onRefresh={loadData}
            />
          )}
          {view === 'supplementations' && (
            isCreatingSupplementation ? (
              <SupplementationForm
                onCancel={() => {
                  setIsCreatingSupplementation(false);
                  setEditingSupplementation(null);
                }}
                userProfile={userProfile}
                initialData={editingSupplementation as any}
              />
            ) : (
              <SupplementationList
                supplementations={supplementations}
                userProfile={userProfile}
                onNew={() => {
                  setEditingSupplementation(null);
                  setIsCreatingSupplementation(true);
                }}
                onEdit={(s) => {
                  setEditingSupplementation(s as any);
                  setIsCreatingSupplementation(true);
                }}
                onDelete={async (id) => { await deleteSupplementation(id); loadData(); }}
                onUpdate={loadData}
              />
            )
          )}
          {view === 'amendments' && (
            <AmendmentList
              contracts={contracts}
              amendments={amendments}
              onEditContract={(c) => { setEditingContract(c); setIsContractModalOpen(true); }}
              userProfile={userProfile}
            />
          )}
          {view === 'fuel_management' && (
            <FuelList
              records={fuelRecords}
              commitments={fuelCommitments}
              userProfile={userProfile}
              departments={departments}
              onNewRecord={() => { setEditingFuelRecord(null); setIsFuelModalOpen(true); }}
              onEditRecord={(r) => { setEditingFuelRecord(r); setIsFuelModalOpen(true); }}
              onDeleteRecord={async (id) => { await deleteFuelRecord(id); loadData(); }}
              onNewCommitment={() => { setEditingFuelCommitment(null); setIsFuelCommitmentModalOpen(true); }}
              onEditCommitment={(c) => { setEditingFuelCommitment(c); setIsFuelCommitmentModalOpen(true); }}
              onDeleteCommitment={async (id) => { await deleteFuelCommitment(id); loadData(); }}
            />
          )}
          {view === 'vehicle_maintenance' && (
            <VehicleMaintenanceList
              maintenances={vehicleMaintenances}
              vehicles={vehicles}
              userProfile={userProfile}
              departments={departments}
              onNewMaintenance={() => { setEditingVehicleMaintenance(null); setIsVehicleMaintenanceModalOpen(true); }}
              onEditMaintenance={(m) => { setEditingVehicleMaintenance(m); setIsVehicleMaintenanceModalOpen(true); }}
              onDeleteMaintenance={async (id) => { await deleteVehicleMaintenance(id); loadData(); }}
              onNewVehicle={() => { setEditingVehicle(null); setIsVehicleModalOpen(true); }}
              onEditVehicle={(v) => { setEditingVehicle(v); setIsVehicleModalOpen(true); }}
              onDeleteVehicle={async (id) => { await deleteVehicle(id); loadData(); }}
            />
          )}
          {view === 'users' && <UserManagement />}
          {view === 'settings' && <SystemTools />}
        </main>
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <DbConfigModal isOpen={isDbConfigModalOpen} onClose={() => setIsDbConfigModalOpen(false)} />
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contract={editingContract}
        userProfile={userProfile}
        onSave={async (c) => { if (editingContract) await updateContract(c as Contract); else await createContract(c); loadData(); }}
        onNewAmendment={() => { setSelectedContractForPortal(editingContract); setEditingAmendment(null); setIsAmendmentModalOpen(true); }}
        onEditAmendment={(a) => { setSelectedContractForPortal(editingContract); setEditingAmendment(a); setIsAmendmentModalOpen(true); }}
        onDeleteAmendment={async (id) => { await apiDeleteAmendment(id); loadData(); }}
        amendments={amendments}
        isReadOnly={!isAdmin && !isSuperAdmin && !perms.contracts?.manage}
      />
      <MinuteModal isOpen={isMinuteModalOpen} onClose={() => setIsMinuteModalOpen(false)} minute={editingMinute} userProfile={userProfile} onSave={async (m) => { if (editingMinute) await updateMinute(m as Minute); else await createMinute(m); loadData(); }} isReadOnly={!isAdmin && !isSuperAdmin && !perms.minutes?.manage} />
      <BiddingModal
        isOpen={isBiddingModalOpen}
        onClose={() => setIsBiddingModalOpen(false)}
        bidding={editingBidding}
        userProfile={userProfile}
        onSave={async (b) => {
          const previousBidding = editingBidding;
          if (editingBidding) {
            const { dateChanges } = await updateBidding(b as Bidding, previousBidding);
            // Notificar secretaria sobre mudanças de datas
            if (dateChanges.length > 0) {
              await sendAppNotification({
                department: b.department || '',
                title: `Licitação ${b.biddingId} - Datas Atualizadas`,
                message: `As seguintes datas foram atualizadas: ${dateChanges.join(', ')}. Objeto: ${b.object}`,
              });
            }
          } else {
            await createBidding(b);
            // Notificar secretaria sobre nova licitação
            await sendAppNotification({
              department: b.department || '',
              title: `Nova Licitação Cadastrada: ${b.biddingId}`,
              message: `Modalidade: ${b.modality}. Objeto: ${b.object}`,
            });
          }
          loadData();
        }}
        isReadOnly={!isAdmin && !isSuperAdmin && !perms.biddings?.manage}
      />

      {
        isBiddingCalendarOpen && (
          <BiddingCalendar
            biddings={biddings}
            onClose={() => setIsBiddingCalendarOpen(false)}
            onEditBidding={(b) => {
              setIsBiddingCalendarOpen(false);
              setEditingBidding(b);
              setIsBiddingModalOpen(true);
            }}
          />
        )
      }
      <AmendmentModal
        isOpen={isAmendmentModalOpen}
        onClose={() => setIsAmendmentModalOpen(false)}
        amendment={editingAmendment}
        contracts={enrichedContracts}
        fixedContractId={selectedContractForPortal?.id}
        onSave={async (a) => {
          const previousAmendment = editingAmendment;

          if (editingAmendment) {
            await updateAmendment({ ...editingAmendment, ...a } as ContractAmendment);
          } else {
            // Se estivermos criando via portal, garante que o ID do contrato selecionado seja usado
            const payload = { ...a, contractId: a.contractId || selectedContractForPortal?.id };
            await createAmendment(payload);
          }

          // Lógica de notificações
          const contract = enrichedContracts.find(c => String(c.id) === String(a.contractId || selectedContractForPortal?.id));

          // Notificar PGM quando o aditivo for enviado (step3 mudou para true)
          if (a.checklist?.step3 && !previousAmendment?.checklist?.step3) {
            try {
              const { sendAppNotification } = await import('./services/notificationService');
              await sendAppNotification({
                department: 'PGM',
                title: `Novo Aditivo para Análise: ${a.eventName}`,
                message: `Contrato ${contract?.contractId || 'N/A'} - ${contract?.supplier || 'N/A'}. ${a.contractsSectorNotes || 'Sem observações'}`,
              });
            } catch (e) {
              console.error('Erro ao enviar notificação para PGM:', e);
            }
          }

          // Notificar o departamento quando a PGM decidir (step4 foi preenchido)
          if (a.checklist?.step4 && (!previousAmendment?.checklist?.step4 || previousAmendment.checklist.step4 !== a.checklist.step4)) {
            try {
              const { sendAppNotification } = await import('./services/notificationService');
              const decisionText = a.checklist.step4 === 'approved' ? 'APROVADO'
                : a.checklist.step4 === 'rejected' ? 'REPROVADO'
                  : 'APROVADO COM RESSALVA';

              await sendAppNotification({
                department: contract?.department || 'GABINETE',
                title: `Retorno PGM: ${a.eventName} - ${decisionText}`,
                message: `Contrato ${contract?.contractId || 'N/A'}. Decisão: ${decisionText}. ${a.pgmNotes || 'Sem parecer registrado'}`,
              });
            } catch (e) {
              console.error('Erro ao enviar notificação de retorno:', e);
            }
          }

          loadData();
        }}
        isReadOnly={!isAdmin && !isSuperAdmin && !isPGM && userProfile?.role !== 'manager' && !perms.contracts?.manage}
        userProfile={userProfile}
      />
      <MenuSettingsModal
        isOpen={isMenuSettingsModalOpen}
        onClose={() => {
          setIsMenuSettingsModalOpen(false);
          loadData(); // Recarregar configurações após fechar
        }}
      />
      <PurchaseRequestModal isOpen={isPurchaseRequestModalOpen} onClose={() => setIsPurchaseRequestModalOpen(false)} request={editingPurchaseRequest} mode={purchaseRequestMode as any} userProfile={userProfile} onSave={async (r) => { if (editingPurchaseRequest) await updatePurchaseRequest(r as PurchaseRequest); else await createPurchaseRequest(r); loadData(); }} />
      <DailyAllowanceModal
        isOpen={isDailyAllowanceModalOpen}
        onClose={() => setIsDailyAllowanceModalOpen(false)}
        dailyAllowance={editingDailyAllowance}
        userProfile={userProfile}
        initialTab={editingDailyAllowanceKey}
        onSave={async (d) => { if (editingDailyAllowance) await updateDailyAllowance(d as DailyAllowance); else await createDailyAllowance(d); loadData(); }}
        isReadOnly={!isAdmin && !isSuperAdmin && !perms.daily_allowance?.manage}
      />
      <UtilityBillModal
        isOpen={isUtilityBillModalOpen}
        onClose={() => setIsUtilityBillModalOpen(false)}
        bill={editingUtilityBill}
        userProfile={userProfile}
        onSave={async (b) => { if (editingUtilityBill) await updateUtilityBill(b as UtilityBill); else await createUtilityBill(b); loadData(); }}
        isReadOnly={!isAdmin && !isSuperAdmin && !perms.utility_bills?.manage}
        departments={departments}
        units={utilityUnits}
        commitments={utilityCommitments}
        bills={utilityBills}
      />
      <UtilityCommitmentModal
        isOpen={isUtilityCommitmentModalOpen}
        onClose={() => setIsUtilityCommitmentModalOpen(false)}
        commitment={editingUtilityCommitment}
        departments={departments}
        onSave={async (c) => {
          if (editingUtilityCommitment) await updateUtilityCommitment(c as UtilityCommitment);
          else await createUtilityCommitment(c as any);
          loadData();
        }}
        bills={utilityBills}
      />
      <UtilityUnitModal
        isOpen={isUtilityUnitModalOpen}
        onClose={() => setIsUtilityUnitModalOpen(false)}
        unit={editingUtilityUnit}
        commitments={utilityCommitments}
        departments={departments}
        onSave={async (u) => {
          if (editingUtilityUnit) await updateUtilityUnit(u as UtilityUnit);
          else await createUtilityUnit(u as any);
          loadData();
        }}
      />
      {/* Old Modal - Kept for editing existing legacy items if needed, but new flow uses Form */}
      <SupplementationModal isOpen={isSupplementationModalOpen} onClose={() => setIsSupplementationModalOpen(false)} supplementation={editingSupplementation as any} onSave={async (s) => { if (editingSupplementation) await updateSupplementation(s as any); else await createSupplementation(s); loadData(); }} isReadOnly={!isAdmin && !isSuperAdmin && !perms.supplementation?.manage} />

      {/* Fuel Management Modals */}
      <FuelModal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        record={editingFuelRecord}
        commitments={fuelCommitments}
        userProfile={userProfile}
        departments={departments}
        onSave={async (r) => { if (editingFuelRecord) await updateFuelRecord(r as FuelRecord); else await createFuelRecord(r); loadData(); }}
      />
      <FuelCommitmentModal
        isOpen={isFuelCommitmentModalOpen}
        onClose={() => setIsFuelCommitmentModalOpen(false)}
        commitment={editingFuelCommitment}
        departments={departments}
        records={fuelRecords}
        onSave={async (c) => { if (editingFuelCommitment) await updateFuelCommitment(c as FuelCommitment); else await createFuelCommitment(c); loadData(); }}
      />

      {/* Vehicle Maintenance Modals */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicle={editingVehicle}
        departments={departments}
        onSave={async (v) => { if (editingVehicle) await updateVehicle(v as Vehicle); else await createVehicle(v); loadData(); }}
      />
      <VehicleMaintenanceModal
        isOpen={isVehicleMaintenanceModalOpen}
        onClose={() => setIsVehicleMaintenanceModalOpen(false)}
        maintenance={editingVehicleMaintenance}
        vehicles={vehicles}
        userProfile={userProfile}
        onSave={async (m) => { if (editingVehicleMaintenance) await updateVehicleMaintenance(m as VehicleMaintenance); else await createVehicleMaintenance(m); loadData(); }}
      />
    </div >
  );
};

export default App;
