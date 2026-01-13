
export interface Contract {
  id: string; // Internal ID
  number: number;
  year: number;
  contractId: string; // e.g. "80/2018"
  department: string; // Secretaria
  object: string;
  supplier: string;
  startDate: string;
  endDate: string;
  notes: string;
  daysRemaining: number;
  status: 'active' | 'expired' | 'warning' | 'executed' | 'rescinded';
  manualStatus: 'automatic' | 'executed' | 'rescinded' | null;
  type: string;
  fiscalizationPeriod: 'monthly' | 'on_delivery' | null;
  isEmergency?: boolean;

  // New detailed fields
  renewalInfo: string; // POSSIBILIDADE DE RENOVAÇÃO
  processNumber: string; // P/O
  serviceOrderNumber?: string; // Ordem de Início (Para Obras)
  manager: string; // GESTOR
  technicalFiscal: string; // TECNICO
  administrativeFiscal: string; // ADM
  hasAdministrativeFiscal?: boolean; // Flag to indicate if ADM fiscal is required
  activeAmendmentStatus?: string; // Novo campo para status do aditivo em andamento
}

export interface Minute {
  id: string;
  number: number;
  year: number;
  minuteId: string; // e.g. "15/2024"
  department: string;
  object: string;
  // Supplier removed as requested
  startDate: string;
  endDate: string;
  notes: string;
  daysRemaining: number;
  status: 'active' | 'expired' | 'warning' | 'executed' | 'rescinded';
  manualStatus: 'automatic' | 'executed' | 'rescinded' | null;
  processNumber: string; // Ordem
  type: string;
  fiscalizationPeriod: 'monthly' | 'on_delivery' | null;

  // New fields requested
  renewalInfo: string;
  manager: string;
  technicalFiscal: string;
  administrativeFiscal: string;
  hasAdministrativeFiscal?: boolean; // Flag to indicate if ADM fiscal is required
}

export type ViewMode = 'dashboard' | 'contracts' | 'minutes' | 'bidding' | 'daily_allowances' | 'utility_bills' | 'settings' | 'supplementations' | 'purchase_requests' | 'amendments' | 'pgm_dispatch' | 'fiscalization' | 'users';

export type BiddingModality =
  | 'pregao_eletronico'      // Pregão Eletrônico
  | 'pregao_presencial'      // Pregão Presencial
  | 'concorrencia'           // Concorrência (Legacy)
  | 'concorrencia_eletronica' // Concorrência Eletrônica
  | 'tomada_precos'          // Tomada de Preços
  | 'convite'                // Convite
  | 'dispensa'               // Dispensa
  | 'inexigibilidade'        // Inexigibilidade
  | 'chamamento_publico'     // Chamamento Público
  | 'credenciamento';        // Credenciamento

export type BiddingStatus =
  | 'em_preparacao'           // EM PREPARAÇÃO (Legacy/Default)
  | 'nao_iniciado'            // NÃO INICIADO
  | 'elaborando_edital'       // ELABORANDO EDITAL
  | 'ajustes_necessarios'     // AJUSTES NECESSÁRIOS
  | 'parecer_juridico'        // PARECER JURÍDICO
  | 'aguardando_sessao'       // AGUARDANDO SESSÃO
  | 'habilitacao_recursos'    // HABILITAÇÃO/RECURSOS
  | 'adjudicacao_homologacao' // ADJUDICAÇÃO/HOMOLOGAÇÃO
  | 'deserta'                 // DESERTA
  | 'fracassada'              // FRACASSADA
  | 'bem_sucedida'            // BEM SUCEDIDA
  | 'assinatura_prefeito'     // ASSINATURA PREFEITO
  | 'amostra'                 // AMOSTRA
  | 'contratacao'             // CONTRATAÇÃO
  | 'suspensa'                // SUSPENSA
  | 'proposta';               // PROPOSTA

export interface Bidding {
  id: string;
  number?: number; // Preenchido posteriormente
  year?: number;
  biddingId: string; // e.g. "045/2024"
  modality: BiddingModality;
  department: string; // Secretaria solicitante
  object: string;
  processNumber: string; // Número do processo

  // Datas importantes - Deprecated in favor of events, but keeping openingDate for sorting
  // publicationDate?: string;
  openingDate?: string;
  // homologationDate?: string;
  // signatureDate?: string;

  // Valores - Removed
  // estimatedValue?: number;
  // adjudicatedValue?: number;

  // Vencedor
  winner?: string; // Nome do fornecedor vencedor

  // Status e controle
  status: BiddingStatus;
  notes?: string;

  // Vinculação com contratos/atas
  resultType?: 'contract' | 'minute' | null;
  resultId?: string; // ID do contrato ou ata gerado

  // Auditoria
  created_at?: string;
  updated_at?: string;
  created_by?: string;

  // New Spreadsheet Fields
  entryDate?: string; // Data de Entrada
  currentResponsible?: string; // Responsável Atual
  deadline?: string; // Prazo Limite
  progress?: string; // Andamento
  submissionStatus?: string; // Status de Envio

  // Dynamic Events
  events?: BiddingEvent[];

  // PGM Flow
  pgmSentDate?: string;
  pgmReturnDate?: string;
  pgmDecision?: 'approved' | 'approved_with_reservation' | 'rejected';
  pgmNotes?: string;
}

export interface BiddingEvent {
  id: string;
  description: string;
  date: string;
  created_at?: string;
}

export interface DashboardMetric {
  name: string;
  value: number;
  color?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'pgm' | 'user';

export interface ModulePermission {
  view: boolean;
  manage: boolean; // Aprovar, validar, editar
}

export interface UserPermissions {
  daily_allowance?: ModulePermission;
  purchase_request?: ModulePermission;
  contracts?: ModulePermission;
  biddings?: ModulePermission;
  minutes?: ModulePermission;
  utility_bills?: ModulePermission;
  supplementation?: ModulePermission;
  fiscalization?: ModulePermission;
  pgm_dispatch?: ModulePermission;
  users?: ModulePermission;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string; // Nome do usuário (Opcional pois usuários antigos podem não ter)
  role: UserRole;
  department: string;
  permissions?: UserPermissions; // Nova estrutura de permissões granulares
  is_active?: boolean; // Campo de  status: 'draft' | 'published';
  created_at?: string;
}

export interface PurchaseOrder {
  id: string;
  requestId: string;
  number: string;
  date: string;
  commitmentNumber?: string;
  commitmentDate?: string;
  rejectionReason?: string; // Motivo da reprovação da Ordem
  commitmentRejectionReason?: string; // Motivo da recusa do Empenho (Fazenda)
  created_at?: string;
}

export interface PurchaseRequest {
  id: string;
  number: string; // Nº do Pedido
  date: string; // Carimbo de data/hora
  department: string; // Secretaria Solicitante
  type: string; // Qual o tipo? (Ata, Inexigibilidade, Contratos...)
  typeDetail?: string; // Detalhe do tipo (opcional)
  contractNumber?: string; // Add contract number optional field
  requester_id?: string;
  requester?: { name: string };
  object?: string;
  description?: string;

  // Compras (Agora suporta múltiplas ordens)
  orders?: PurchaseOrder[];
  orderNumber?: string; // Mantendo para compatibilidade visual simples caso necessário
  orderDate?: string;

  // Fazenda
  commitmentNumber?: string; // Empenho
  commitmentDate?: string;

  status: 'requested' | 'ordered' | 'committed' | 'completed' | 'rejected';
  rejectionReason?: string;
  notes?: string;
  created_at?: string;
}

export interface AlertDocument {
  id: string;
  type: 'contract' | 'minute';
  identifier: string; // Nº do contrato ou ata
  object: string;
  department: string;
  endDate: string;
  daysRemaining: number;
}

export interface NotificationSettings {
  id: number;
  thresholds: number[]; // e.g. [180, 150, 120, 90, 60, 30, 7]
  additional_emails: string[]; // e.g. ['prefeito@...', 'juridico@...']
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SIGN';
  resource_type: 'CONTRACT' | 'MINUTE' | 'USER' | 'SYSTEM' | 'REPORT';
  resource_id: string;
  details: string;
  created_at: string;
}

export interface AppNotification {
  id: number;
  department: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export type FiscalizationStatus = 'pending_tech' | 'pending_adm' | 'pending_manager' | 'completed';

export interface FiscalizationReport {
  id: string;
  document_id: string;
  document_type: 'contract' | 'minute';
  reference_month: string;
  content: any; // Changed from string to any for structured form data
  status: FiscalizationStatus;
  created_at: string;
  updated_at?: string | null;

  // Fiscais designados no momento da criação do relatório
  manager_name: string | null;
  tech_fiscal_name: string | null;
  adm_fiscal_name: string | null;

  // Assinaturas Gestor
  manager_signed_at: string | null;
  manager_signer_id?: string | null;

  // Assinaturas Fiscal Técnico
  tech_fiscal_signed_at: string | null;
  tech_fiscal_signer_id?: string | null;

  // Assinaturas Fiscal Administrativo
  adm_fiscal_signed_at: string | null;
  adm_fiscal_signer_id?: string | null;
}


export interface EnrichedFiscalizationReport extends FiscalizationReport {
  documentIdentifier: string;
  documentObject: string;
  documentDepartment: string;
}

export interface ContractAmendment {
  id: string;
  contractId: string; // Internal ID of parent contract
  contractIdentifier: string; // e.g. "80/2018"
  type: 'prazo' | 'valor';
  duration: number;
  durationUnit: 'dia' | 'mes' | 'ano';
  eventName: string;
  entryDate: string;
  status: string;
  checklist: AmendmentChecklist;
  folderLink?: string; // Link para pasta do contrato
  contractsSectorNotes?: string; // Nota do setor de contratos para a PGM
  pgmNotes?: string; // Análise da PGM
  pgmDecision?: 'approved' | 'rejected' | 'approved_with_reservation' | null;
  pgmHistory?: PGMAnalysis[];
  created_at?: string;
}

export interface PGMAnalysis {
  date: string;
  notes: string;
  decision: 'approved' | 'rejected' | 'approved_with_reservation' | 'comment';
  analyst?: string;
}

export interface AmendmentChecklist {
  step1: boolean; // Criação
  step2: boolean; // Fazendo
  step3: boolean; // Enviado para PGM
  step4: 'approved' | 'approved_with_reservation' | 'rejected' | null; // Devolvido da PGM
  step5: boolean | { sent: boolean; received: boolean }; // Assinatura Fornecedor
  step6: boolean; // Assinatura Prefeito
  step7: {
    grp: boolean;
    attachments: boolean;
    licitacon: boolean;
    purchaseOrder: boolean;
  };
  step8: boolean; // Assinatura Testemunhas
}

export interface Commitment {
  id: string;
  contractId: string;
  number: string;
  issueDate: string;
  value: number;
  description: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string;
  created_at?: string;
}

export interface DailyAllowance {
  id: string;
  beneficiaryName: string;
  beneficiaryRole: string;
  missionDescription: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalValue: number;

  // New Workflow Fields
  commitmentNumber?: string; // Empenho
  paymentOrderNumber?: string; // Ordem de Pagamento
  paymentOrderDate?: string;

  // File attachments
  solicitationFileUrl?: string;
  accountabilityFileUrl?: string;

  // Status e Controle
  status: 'requested' | 'approved' | 'committed' | 'payment_ordered' | 'paid' | 'rejected' | 'accountability_analysis' | 'accountability_approved' | 'accountability_rejected';
  rejectionReason?: string;
  feedback?: string;

  // Metadata
  type?: 'antecipated' | 'posteriori';
  bankName?: string;
  agency?: string;
  accountNumber?: string;

  created_at?: string;
  updated_at?: string;
  notes?: string;
}

export interface UtilityUnit {
  id: string;
  consumerUnit: string;
  localName: string;
  type: 'water' | 'light' | 'phone';
  company: string;
  department?: string;
  default_commitment_id?: string;
  due_day?: number;
  created_at?: string;
}

export interface UtilityCommitment {
  id: string;
  number: string;
  type: 'water' | 'light' | 'phone';
  department: string;
  dotation?: string;
  consumerUnit?: string;
  totalValue: number;
  balance: number;
  notes?: string;
  created_at?: string;
}

export interface UtilityBill {
  id: string;
  type: 'water' | 'light' | 'phone';
  company: string;
  consumerUnit: string; // Matrícula
  localName?: string;    // Nome do Local (ex: Bomba d'água)
  referenceMonth: string; // MM/AAAA
  dueDate: string;
  value: number;
  barcode: string;
  status: 'pending' | 'paid';
  paymentDate?: string;
  commitment_id?: string;
  notes: string;
  created_at?: string;
}

export interface SupplementationItem {
  id?: string;
  type: 'addition' | 'reduction';
  dotation: string;
  rubric: string;
  value: number;
  resource: string;
  justification?: string; // Required for addition
  verified?: boolean;
}

export interface SupplementationRequest {
  id: string;
  department: string;
  responsible_name: string;
  is_excess_revenue: boolean;
  is_surplus: boolean;
  items: SupplementationItem[];
  status: 'pending' | 'approved' | 'rejected' | 'published';
  created_at?: string;

  total_addition?: number;
  total_reduction?: number;

  decree_number?: string;
  rejection_reason?: string;
}
export interface DynamicSetting {
  id: string;
  name: string;
}
