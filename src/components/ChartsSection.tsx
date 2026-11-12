import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { BarChart3, LineChart, Info } from 'lucide-react';
import { ProcessedReading } from '../types/water';
import { formatNumber } from '../utils/calculations';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  processedReadings: ProcessedReading[];
  taxaMediaGeral: number;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  processedReadings,
  taxaMediaGeral,
}) => {
  // Only intervals (excluding base index 0)
  const intervals = processedReadings.filter((p) => p.status !== 'base');

  if (intervals.length === 0) {
    return (
      <div
        id="section-graficos-empty"
        className="rounded-2xl p-8 bg-gradient-to-br from-[#102433] to-[#0c1c28] border border-[#1b3b52] text-center shadow-lg shadow-black/20"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#3fa9f5]/10 flex items-center justify-center text-[#3fa9f5] mb-3">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
          Gráficos de Consumo e Vazão
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Cadastre ao menos duas leituras consecutivas para gerar os gráficos de consumo em litros e taxa horária (L/h).
        </p>
      </div>
    );
  }

  // Prepare chart labels (interval date short)
  const labels = intervals.map((item) => {
    const parts = item.dataHoraFormatted.split(' ');
    const datePart = parts[0]?.slice(0, 5) || '';
    const timePart = parts[1] || '';
    return `${datePart} ${timePart}`;
  });

  // Bar Chart Data: consumption in liters, > 500L highlighted in red
  const barValues = intervals.map((item) => (item.isInvalid ? 0 : item.consumoLitros || 0));
  const barBackgroundColors = intervals.map((item) => {
    if (item.isInvalid) return 'rgba(100, 116, 139, 0.4)';
    const val = item.consumoLitros || 0;
    return val > 500 ? '#ef4b4b' : '#3fa9f5';
  });
  const barBorderColors = intervals.map((item) => {
    if (item.isInvalid) return '#64748b';
    const val = item.consumoLitros || 0;
    return val > 500 ? '#ff7878' : '#60b5f7';
  });

  const barData = {
    labels,
    datasets: [
      {
        label: 'Consumo no Intervalo (Litros)',
        data: barValues,
        backgroundColor: barBackgroundColors,
        borderColor: barBorderColors,
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: intervals.map((item) =>
          (item.consumoLitros || 0) > 500 ? '#dc2626' : '#2563eb'
        ),
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0c1b26',
        borderColor: '#224b69',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const rawVal = context.raw as number;
            const item = intervals[context.dataIndex];
            if (item && item.isInvalid) {
              return `Inválido: ${item.invalidReason || 'Erro'}`;
            }
            const isHigh = rawVal > 500;
            return `Consumo: ${formatNumber(rawVal)} L ${isHigh ? '⚠️ (> 500L)' : ''} | Duração: ${item.duracaoFormatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 25,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.07)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val) => `${val} L`,
        },
        beginAtZero: true,
      },
    },
  };

  // Line Chart Data: Rate L/h with horizontal dashed average line
  const rateValues = intervals.map((item) => (item.isInvalid ? null : item.taxaLitrosPorHora));
  const avgValues = intervals.map(() => (taxaMediaGeral > 0 ? taxaMediaGeral : null));

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Taxa de Consumo (L/h)',
        data: rateValues,
        borderColor: '#3fa9f5',
        backgroundColor: 'rgba(63, 169, 245, 0.12)',
        borderWidth: 2.5,
        pointBackgroundColor: intervals.map((item) => {
          if (item.isInvalid) return '#64748b';
          const r = item.taxaLitrosPorHora || 0;
          if (r >= 45) return '#ef4b4b';
          if (r >= 30) return '#f5a623';
          return '#3ddc97';
        }),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4.5,
        pointHoverRadius: 6,
        tension: 0.25,
        fill: true,
      },
      {
        label: `Média do Período (${formatNumber(taxaMediaGeral, 1)} L/h)`,
        data: avgValues,
        borderColor: '#f5a623',
        borderWidth: 2,
        borderDash: [6, 6],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0c1b26',
        borderColor: '#224b69',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const rawVal = context.raw as number | null;
            if (rawVal === null) return 'Dado indisponível';
            return `${context.dataset.label}: ${formatNumber(rawVal, 1)} L/h`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 25,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.07)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val) => `${val} L/h`,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div id="section-graficos" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Bar Chart: Consumo por intervalo */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#122736] to-[#0d1d29] border border-[#1b3d54] shadow-xl shadow-black/20 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c384d]/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#3fa9f5]/15 text-[#3fa9f5]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk']">
                Consumo por Intervalo (Litros)
              </h3>
              <p className="text-[11px] text-slate-400">
                Volume medido entre leituras consecutivas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3fa9f5]" /> Normal
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4b4b]" /> &gt; 500 L
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <Bar data={barData} options={barOptions} />
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3 text-slate-400" /> Barras em vermelho indicam consumo elevado no intervalo (&gt;500L).
          </span>
          <span>{intervals.length} intervalos</span>
        </div>
      </div>

      {/* 2. Line Chart: Taxa de consumo L/h */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#122736] to-[#0d1d29] border border-[#1b3d54] shadow-xl shadow-black/20 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c384d]/60 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-[#3ddc97]">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk']">
                Taxa de Vazão Horária (L/h)
              </h3>
              <p className="text-[11px] text-slate-400">
                Velocidade de consumo e linha média de referência
              </p>
            </div>
          </div>
          <div className="text-[11px] text-[#f5a623] font-semibold flex items-center gap-1">
            <span className="w-3 border-t-2 border-dashed border-[#f5a623]" />
            Média: {formatNumber(taxaMediaGeral, 1)} L/h
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <Line data={lineData} options={lineOptions} />
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3ddc97]" /> Normal &lt;30
            <span className="w-2 h-2 rounded-full bg-[#f5a623] ml-2" /> Atenção 30-44
            <span className="w-2 h-2 rounded-full bg-[#ef4b4b] ml-2" /> Alto &ge;45 L/h
          </span>
          <span>Taxa = Litros ÷ Horas</span>
        </div>
      </div>
    </div>
  );
};
