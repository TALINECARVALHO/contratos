
import { Contract, Minute } from './types';

export const FISCALIZATION_PERIODS = [
  { key: 'monthly', label: 'Mensal' },
  { key: 'on_delivery', label: 'Na Entrega/Execução' }
] as const;

export const DEPARTMENTS = [
  'ADMINISTRAÇÃO', 'SAÚDE', 'EDUCAÇÃO', 'OBRAS', 'FAZENDA', 'MEIO AMBIENTE', 'TURISMO', 'PLANEJAMENTO', 'GABINETE', 'DES. SOCIAL', 'AGRICULTURA', 'CPD', 'FROTAS', 'ESPORTE', 'RPPS', 'INTERIOR'
] as const;

export const DEFAULT_NOTIFICATION_THRESHOLDS = [180, 150, 120, 90, 60, 30, 7];

export const INITIAL_CONTRACTS: Contract[] = [];
export const INITIAL_MINUTES: Minute[] = [];
