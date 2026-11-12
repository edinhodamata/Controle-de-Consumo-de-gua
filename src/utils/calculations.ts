import {
  RawReading,
  ProcessedReading,
  SummaryStats,
  LeakAlertData,
  BillSimulationResult,
  TariffBracketDetail,
} from '../types/water';

export function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 0) return 'Inválido';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return `${hours}h${String(mins).padStart(2, '0')}min`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function processReadings(rawReadings: RawReading[]): {
  processed: ProcessedReading[];
  summary: SummaryStats;
  leakAlert: LeakAlertData;
} {
  // Sort chronologically ascending
  const sorted = [...rawReadings].sort((a, b) => {
    const timeA = new Date(a.dataHora).getTime();
    const timeB = new Date(b.dataHora).getTime();
    return timeA - timeB;
  });

  const processed: ProcessedReading[] = [];
  const validRates: { rate: number; index: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const currentTime = new Date(current.dataHora).getTime();

    if (i === 0) {
      processed.push({
        index: 1,
        dataHora: current.dataHora,
        dataHoraFormatted: formatDate(current.dataHora),
        timestamp: currentTime,
        leitura: current.leitura,
        consumoLitros: null,
        duracaoMinutos: null,
        duracaoFormatted: '-',
        taxaLitrosPorHora: null,
        status: 'base',
        statusLabel: 'Base',
        isInvalid: false,
      });
      continue;
    }

    const prev = sorted[i - 1];
    const prevTime = new Date(prev.dataHora).getTime();
    const diffMs = currentTime - prevTime;
    const duracaoMinutos = diffMs / (1000 * 60);
    const duracaoHoras = duracaoMinutos / 60;
    const consumo = current.leitura - prev.leitura;

    let isInvalid = false;
    let invalidReason = '';

    if (duracaoMinutos <= 0) {
      isInvalid = true;
      invalidReason = 'Duração nula ou negativa';
    } else if (consumo < 0) {
      isInvalid = true;
      invalidReason = 'Consumo negativo (leitura menor que a anterior)';
    }

    if (isInvalid) {
      processed.push({
        index: i + 1,
        dataHora: current.dataHora,
        dataHoraFormatted: formatDate(current.dataHora),
        timestamp: currentTime,
        leitura: current.leitura,
        consumoLitros: consumo,
        duracaoMinutos: duracaoMinutos > 0 ? duracaoMinutos : null,
        duracaoFormatted: duracaoMinutos > 0 ? formatDuration(duracaoMinutos) : '0h00min',
        taxaLitrosPorHora: null,
        status: 'invalido',
        statusLabel: 'Inválido',
        isInvalid: true,
        invalidReason,
      });
    } else {
      const taxa = consumo / duracaoHoras;
      let status: ProcessedReading['status'] = 'normal';
      let statusLabel = 'Normal';

      if (taxa >= 45) {
        status = 'alto';
        statusLabel = 'Alto';
      } else if (taxa >= 30) {
        status = 'atencao';
        statusLabel = 'Atenção';
      } else {
        status = 'normal';
        statusLabel = 'Normal';
      }

      validRates.push({ rate: taxa, index: i + 1 });

      processed.push({
        index: i + 1,
        dataHora: current.dataHora,
        dataHoraFormatted: formatDate(current.dataHora),
        timestamp: currentTime,
        leitura: current.leitura,
        consumoLitros: consumo,
        duracaoMinutos,
        duracaoFormatted: formatDuration(duracaoMinutos),
        taxaLitrosPorHora: taxa,
        status,
        statusLabel,
        isInvalid: false,
      });
    }
  }

  // Summary calculations
  let consumoTotalLitros = 0;
  let periodoFormatado = 'Nenhum período registrado';
  let periodoHoras = 0;
  let taxaMediaLitrosPorHora = 0;
  let projecaoDiariaLitros = 0;
  let projecaoDiariaM3 = 0;
  let picoTaxaLitrosPorHora: number | null = null;
  let picoDataHora: string | null = null;
  const primeiraDataHora = sorted.length > 0 ? sorted[0].dataHora : null;
  const ultimaDataHora = sorted.length > 0 ? sorted[sorted.length - 1].dataHora : null;

  if (sorted.length > 1) {
    // Total consumption: difference between first and last chronological reading
    consumoTotalLitros = sorted[sorted.length - 1].leitura - sorted[0].leitura;
    if (consumoTotalLitros < 0) consumoTotalLitros = 0;

    const startMs = new Date(sorted[0].dataHora).getTime();
    const endMs = new Date(sorted[sorted.length - 1].dataHora).getTime();
    const totalMs = Math.max(0, endMs - startMs);
    const totalMins = totalMs / (1000 * 60);
    periodoHoras = totalMins / 60;

    const dias = Math.floor(periodoHoras / 24);
    const horasRestantes = Math.floor(periodoHoras % 24);
    const minsRestantes = Math.round(totalMins % 60);

    if (dias > 0) {
      periodoFormatado = `${dias}d ${horasRestantes}h ${minsRestantes}m`;
    } else {
      periodoFormatado = `${horasRestantes}h ${minsRestantes}m`;
    }

    // Rate calculations across valid intervals
    const validIntervals = processed.filter(
      (p) => !p.isInvalid && p.taxaLitrosPorHora !== null && p.consumoLitros !== null && p.duracaoMinutos !== null
    );

    if (validIntervals.length > 0) {
      const somaConsumoValido = validIntervals.reduce((acc, p) => acc + (p.consumoLitros ?? 0), 0);
      const somaMinutosValidos = validIntervals.reduce((acc, p) => acc + (p.duracaoMinutos ?? 0), 0);
      const somaHorasValidas = somaMinutosValidos / 60;

      taxaMediaLitrosPorHora = somaHorasValidas > 0 ? somaConsumoValido / somaHorasValidas : 0;
      projecaoDiariaLitros = taxaMediaLitrosPorHora * 24;
      projecaoDiariaM3 = projecaoDiariaLitros / 1000;

      // Peak
      let maxRate = -1;
      let maxItem: ProcessedReading | null = null;
      for (const item of validIntervals) {
        if (item.taxaLitrosPorHora !== null && item.taxaLitrosPorHora > maxRate) {
          maxRate = item.taxaLitrosPorHora;
          maxItem = item;
        }
      }
      if (maxItem && maxRate >= 0) {
        picoTaxaLitrosPorHora = maxRate;
        picoDataHora = maxItem.dataHora;
      }
    }
  }

  const summary: SummaryStats = {
    totalLeituras: sorted.length,
    consumoTotalLitros,
    consumoTotalM3: consumoTotalLitros / 1000,
    periodoFormatado,
    periodoHoras,
    taxaMediaLitrosPorHora,
    projecaoDiariaLitros,
    projecaoDiariaM3,
    picoTaxaLitrosPorHora,
    picoDataHora,
    primeiraDataHora,
    ultimaDataHora,
  };

  // Leak Alert calculation
  // "Comparar a taxa do intervalo mais recente válido com a média aritmética das taxas dos intervalos válidos anteriores, excluindo o intervalo mais recente."
  // percentualAcima = ((taxaAtual - mediaAnterior) / mediaAnterior) * 100
  // 50% ou mais: vermelho "Possível vazamento detectado"
  // De 20% até menos de 50%: amarelo "Consumo acima do padrão"
  // Abaixo de 20%: não mostrar alerta
  // Se não houver média anterior positiva, não gerar percentual.
  let leakAlert: LeakAlertData = {
    hasAlert: false,
    level: 'none',
    title: '',
    taxaAtual: 0,
    mediaAnterior: 0,
    percentualAcima: 0,
    recomendacao: '',
  };

  const validIntervalsList = processed.filter(
    (p) => !p.isInvalid && p.taxaLitrosPorHora !== null && p.status !== 'base'
  );

  if (validIntervalsList.length >= 2) {
    const ultimoIntervalo = validIntervalsList[validIntervalsList.length - 1];
    const intervalosAnteriores = validIntervalsList.slice(0, validIntervalsList.length - 1);

    const taxaAtual = ultimoIntervalo.taxaLitrosPorHora!;
    const somaTaxasAnteriores = intervalosAnteriores.reduce(
      (acc, item) => acc + (item.taxaLitrosPorHora ?? 0),
      0
    );
    const mediaAnterior = somaTaxasAnteriores / intervalosAnteriores.length;

    if (mediaAnterior > 0) {
      const percentualAcima = ((taxaAtual - mediaAnterior) / mediaAnterior) * 100;

      if (percentualAcima >= 50) {
        leakAlert = {
          hasAlert: true,
          level: 'critical',
          title: 'Possível vazamento detectado',
          taxaAtual,
          mediaAnterior,
          percentualAcima,
          recomendacao:
            'A taxa de consumo no intervalo mais recente disparou em relação ao padrão histórico. Recomendamos inspecionar imediatamente torneiras pingando, válvulas de descarga do vaso sanitário, boia de caixa d’água e registros gerais.',
        };
      } else if (percentualAcima >= 20) {
        leakAlert = {
          hasAlert: true,
          level: 'warning',
          title: 'Consumo acima do padrão',
          taxaAtual,
          mediaAnterior,
          percentualAcima,
          recomendacao:
            'A taxa de consumo recente está significativamente acima da sua média anterior. Verifique se houve uso atípico (como lavagem de quintal, piscina ou roupas) ou pequenos vazamentos em torneiras e registros.',
        };
      }
    }
  }

  return {
    processed,
    summary,
    leakAlert,
  };
}

// Bill calculation brackets
// Faixa 0–10 m³: Água: R$ 6,416/m³ | Esgoto: R$ 5,132/m³
// Faixa 10–20 m³: Água: R$ 12,433/m³ | Esgoto: R$ 9,947/m³
// Faixa 20–30 m³: Água: R$ 18,983/m³ | Esgoto: R$ 15,186/m³
// Faixa 30–40 m³: Água: R$ 25,858/m³ | Esgoto: R$ 20,686/m³
// Faixa 40–60 m³: Água: R$ 29,836/m³ | Esgoto: R$ 23,870/m³
// > 60 m³: aplicar tarifa da última faixa ao excedente e mostrar aviso
interface TariffDef {
  nome: string;
  range: string;
  min: number;
  max: number;
  agua: number;
  esgoto: number;
}

const TARIFF_TIERS: TariffDef[] = [
  { nome: 'Faixa 1', range: '0 a 10 m³', min: 0, max: 10, agua: 6.416, esgoto: 5.132 },
  { nome: 'Faixa 2', range: '10 a 20 m³', min: 10, max: 20, agua: 12.433, esgoto: 9.947 },
  { nome: 'Faixa 3', range: '20 a 30 m³', min: 20, max: 30, agua: 18.983, esgoto: 15.186 },
  { nome: 'Faixa 4', range: '30 a 40 m³', min: 30, max: 40, agua: 25.858, esgoto: 20.686 },
  { nome: 'Faixa 5', range: '40 a 60 m³', min: 40, max: 60, agua: 29.836, esgoto: 23.87 },
];

export function calculateWaterBill(consumoM3: number): BillSimulationResult {
  const safeConsumo = Math.max(0, isNaN(consumoM3) ? 0 : consumoM3);
  let totalAgua = 0;
  let totalEsgoto = 0;
  const detalhesFaixas: TariffBracketDetail[] = [];

  for (const tier of TARIFF_TIERS) {
    if (safeConsumo > tier.min) {
      const volumeNaFaixa = Math.min(safeConsumo, tier.max) - tier.min;
      const subAgua = volumeNaFaixa * tier.agua;
      const subEsgoto = volumeNaFaixa * tier.esgoto;
      totalAgua += subAgua;
      totalEsgoto += subEsgoto;

      detalhesFaixas.push({
        faixaNome: tier.nome,
        faixaRange: tier.range,
        consumoNaFaixa: volumeNaFaixa,
        tarifaAguaUnit: tier.agua,
        tarifaEsgotoUnit: tier.esgoto,
        subtotalAgua: subAgua,
        subtotalEsgoto: subEsgoto,
        subtotalGeral: subAgua + subEsgoto,
      });
    } else {
      detalhesFaixas.push({
        faixaNome: tier.nome,
        faixaRange: tier.range,
        consumoNaFaixa: 0,
        tarifaAguaUnit: tier.agua,
        tarifaEsgotoUnit: tier.esgoto,
        subtotalAgua: 0,
        subtotalEsgoto: 0,
        subtotalGeral: 0,
      });
    }
  }

  // Handle surplus above 60 m³
  const isExcedente60 = safeConsumo > 60;
  if (isExcedente60) {
    const excedente = safeConsumo - 60;
    const lastTier = TARIFF_TIERS[TARIFF_TIERS.length - 1];
    const subAgua = excedente * lastTier.agua;
    const subEsgoto = excedente * lastTier.esgoto;
    totalAgua += subAgua;
    totalEsgoto += subEsgoto;

    detalhesFaixas.push({
      faixaNome: 'Excedente (> 60 m³)',
      faixaRange: 'Acima de 60 m³',
      consumoNaFaixa: excedente,
      tarifaAguaUnit: lastTier.agua,
      tarifaEsgotoUnit: lastTier.esgoto,
      subtotalAgua: subAgua,
      subtotalEsgoto: subEsgoto,
      subtotalGeral: subAgua + subEsgoto,
    });
  }

  return {
    consumoM3: safeConsumo,
    valorAgua: totalAgua,
    valorEsgoto: totalEsgoto,
    totalEstimado: totalAgua + totalEsgoto,
    isExcedente60,
    detalhesFaixas,
  };
}
