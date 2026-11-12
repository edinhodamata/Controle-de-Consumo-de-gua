import React from 'react';
import { AlertCircle, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';
import { LeakAlertData } from '../types/water';
import { formatNumber } from '../utils/calculations';

interface LeakAlertBannerProps {
  alert: LeakAlertData;
}

export const LeakAlertBanner: React.FC<LeakAlertBannerProps> = ({ alert }) => {
  if (!alert.hasAlert || alert.level === 'none') {
    return null;
  }

  const isCritical = alert.level === 'critical';

  return (
    <div
      id="leak-alert-banner"
      className={`rounded-2xl p-4 sm:p-5 transition-all shadow-xl border ${
        isCritical
          ? 'bg-gradient-to-r from-[#2e1014] via-[#240c10] to-[#1a080b] border-[#ef4b4b]/60 shadow-[#ef4b4b]/10'
          : 'bg-gradient-to-r from-[#2c200c] via-[#221807] to-[#181104] border-[#f5a623]/60 shadow-[#f5a623]/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Icon & Titles */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${
              isCritical
                ? 'bg-[#ef4b4b]/20 text-[#ef4b4b] ring-1 ring-[#ef4b4b]/40'
                : 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/40'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                  isCritical
                    ? 'bg-[#ef4b4b] text-white'
                    : 'bg-[#f5a623] text-black font-extrabold'
                }`}
              >
                {isCritical ? 'Alerta Crítico' : 'Aviso de Consumo'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {alert.title}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl leading-relaxed">
              {alert.recomendacao}
            </p>
          </div>
        </div>

        {/* Right Side: Metrics Badge */}
        <div
          className={`shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 rounded-xl border w-full sm:w-auto ${
            isCritical
              ? 'bg-[#ef4b4b]/10 border-[#ef4b4b]/30'
              : 'bg-[#f5a623]/10 border-[#f5a623]/30'
          }`}
        >
          <div className="text-xs text-slate-300">Variação recente</div>
          <div
            className={`text-xl sm:text-2xl font-black font-['Space_Grotesk'] ${
              isCritical ? 'text-[#ef4b4b]' : 'text-[#f5a623]'
            }`}
          >
            +{formatNumber(alert.percentualAcima, 1)}%
          </div>
          <div className="text-[11px] text-slate-400">
            Atual: <span className="text-white font-semibold">{formatNumber(alert.taxaAtual, 1)} L/h</span> |
            Média: <span className="text-white font-semibold">{formatNumber(alert.mediaAnterior, 1)} L/h</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-slate-400">
        <HelpCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          Aviso importante: Este é um indicador estatístico de aumento atípico de consumo na taxa horária, não uma confirmação física de vazamento.
        </span>
      </div>
    </div>
  );
};
