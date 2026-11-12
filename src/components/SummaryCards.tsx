import React from 'react';
import { Droplet, Calendar, Gauge, TrendingUp, Zap } from 'lucide-react';
import { SummaryStats } from '../types/water';
import { formatNumber, formatDate } from '../utils/calculations';

interface SummaryCardsProps {
  summary: SummaryStats;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Consumo Total */}
      <div
        id="card-consumo-total"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#122736] to-[#0c1b26] border border-[#1c3e57] shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group hover:border-[#3fa9f5]/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Consumo Total
          </span>
          <div className="p-2 rounded-xl bg-[#3fa9f5]/15 text-[#3fa9f5]">
            <Droplet className="h-4 w-4 fill-[#3fa9f5]/30" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              {formatNumber(summary.consumoTotalLitros)}
            </span>
            <span className="text-xs font-semibold text-cyan-300">Litros</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span className="font-semibold text-slate-300">{formatNumber(summary.consumoTotalM3, 3)}</span> m³ faturáveis
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 text-[11px] text-slate-400">
          {summary.totalLeituras > 1 ? (
            <span>Baseado em {summary.totalLeituras} leituras</span>
          ) : (
            <span>Requer ao menos 2 leituras</span>
          )}
        </div>
      </div>

      {/* 2. Período Analisado */}
      <div
        id="card-periodo-analisado"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#122736] to-[#0c1b26] border border-[#1c3e57] shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group hover:border-[#3fa9f5]/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Período Total
          </span>
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <Calendar className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            {summary.periodoFormatado}
          </div>
          <div className="mt-1 text-xs text-slate-400 truncate">
            {summary.primeiraDataHora && summary.ultimaDataHora
              ? `${formatDate(summary.primeiraDataHora).split(' ')[0]} até ${formatDate(summary.ultimaDataHora).split(' ')[0]}`
              : 'Sem intervalo'}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 text-[11px] text-slate-400">
          <span>{summary.periodoHoras > 0 ? `${formatNumber(summary.periodoHoras, 1)}h registradas` : 'Intervalo inicial'}</span>
        </div>
      </div>

      {/* 3. Taxa Média */}
      <div
        id="card-taxa-media"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#122736] to-[#0c1b26] border border-[#1c3e57] shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group hover:border-[#3fa9f5]/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Taxa Média
          </span>
          <div className="p-2 rounded-xl bg-teal-500/15 text-[#3ddc97]">
            <Gauge className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              {formatNumber(summary.taxaMediaLitrosPorHora, 1)}
            </span>
            <span className="text-xs font-semibold text-[#3ddc97]">L/h</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Vazão média contínua
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 text-[11px] text-slate-400">
          <span className={summary.taxaMediaLitrosPorHora >= 45 ? 'text-[#ef4b4b]' : summary.taxaMediaLitrosPorHora >= 30 ? 'text-[#f5a623]' : 'text-[#3ddc97]'}>
            {summary.taxaMediaLitrosPorHora >= 45 ? 'Padrão elevado' : summary.taxaMediaLitrosPorHora >= 30 ? 'Padrão moderado' : 'Consumo sob controle'}
          </span>
        </div>
      </div>

      {/* 4. Projeção Diária */}
      <div
        id="card-projecao-diaria"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#122736] to-[#0c1b26] border border-[#1c3e57] shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group hover:border-[#3fa9f5]/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Projeção Diária
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              {formatNumber(summary.projecaoDiariaLitros, 0)}
            </span>
            <span className="text-xs font-semibold text-cyan-300">L/dia</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Equivalente a <span className="font-semibold text-slate-300">{formatNumber(summary.projecaoDiariaM3, 2)}</span> m³/dia
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 text-[11px] text-slate-400">
          <span>Estimativa para 24 horas</span>
        </div>
      </div>

      {/* 5. Pico de Consumo */}
      <div
        id="card-pico-consumo"
        className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#122736] to-[#0c1b26] border border-[#1c3e57] shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group hover:border-[#ef4b4b]/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pico de Consumo
          </span>
          <div className="p-2 rounded-xl bg-rose-500/15 text-[#ef4b4b]">
            <Zap className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              {summary.picoTaxaLitrosPorHora !== null ? formatNumber(summary.picoTaxaLitrosPorHora, 1) : '-'}
            </span>
            <span className="text-xs font-semibold text-rose-400">L/h</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 truncate">
            {summary.picoDataHora ? formatDate(summary.picoDataHora) : 'Nenhum pico registrado'}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1c384d]/60 text-[11px] text-slate-400">
          <span>Maior vazão pontual</span>
        </div>
      </div>
    </div>
  );
};
