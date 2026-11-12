export interface RawReading {
  dataHora: string; // ISO string or 'YYYY-MM-DDTHH:mm'
  leitura: number;  // integer in liters
}

export type IntervalStatus = 'normal' | 'atencao' | 'alto' | 'base' | 'invalido';

export interface ProcessedReading {
  index: number;
  dataHora: string;
  dataHoraFormatted: string;
  timestamp: number;
  leitura: number;
  consumoLitros: number | null;
  duracaoMinutos: number | null;
  duracaoFormatted: string;
  taxaLitrosPorHora: number | null;
  status: IntervalStatus;
  statusLabel: string;
  isInvalid: boolean;
  invalidReason?: string;
}

export interface SummaryStats {
  totalLeituras: number;
  consumoTotalLitros: number;
  consumoTotalM3: number;
  periodoFormatado: string;
  periodoHoras: number;
  taxaMediaLitrosPorHora: number;
  projecaoDiariaLitros: number;
  projecaoDiariaM3: number;
  picoTaxaLitrosPorHora: number | null;
  picoDataHora: string | null;
  primeiraDataHora: string | null;
  ultimaDataHora: string | null;
}

export type LeakAlertLevel = 'none' | 'warning' | 'critical';

export interface LeakAlertData {
  hasAlert: boolean;
  level: LeakAlertLevel;
  title: string;
  taxaAtual: number;
  mediaAnterior: number;
  percentualAcima: number;
  recomendacao: string;
}

export interface TariffBracketDetail {
  faixaNome: string;
  faixaRange: string;
  consumoNaFaixa: number; // m³
  tarifaAguaUnit: number;
  tarifaEsgotoUnit: number;
  subtotalAgua: number;
  subtotalEsgoto: number;
  subtotalGeral: number;
}

export interface BillSimulationResult {
  consumoM3: number;
  valorAgua: number;
  valorEsgoto: number;
  totalEstimado: number;
  isExcedente60: boolean;
  detalhesFaixas: TariffBracketDetail[];
}

export interface ApiResponse<T = unknown> {
  sucesso?: boolean;
  mensagem?: string;
  versao?: string;
  dados?: T;
  // Compatibilidade com chaves em inglês
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorType?: string;
}

export type ErrorCategory =
  | 'URL_INVALIDA'
  | 'URL_NAO_ENCONTRADA'
  | 'FALHA_AUTENTICACAO'
  | 'ERRO_HTTP'
  | 'CORPO_VAZIO'
  | 'CONTEUDO_INCOMPATIVEL'
  | 'RESPOSTA_INVALIDA'
  | 'FALHA_REDE';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  versao?: string;
  category?: ErrorCategory;
  httpStatus?: number;
  details?: string;
  timestamp?: string;
  totalLeituras?: number;
}
