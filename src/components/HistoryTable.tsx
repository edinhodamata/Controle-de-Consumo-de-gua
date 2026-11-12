import React from 'react';
import { History, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { ProcessedReading } from '../types/water';
import { formatNumber } from '../utils/calculations';

interface HistoryTableProps {
  readings: ProcessedReading[];
  onOpenSpreadsheet?: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ readings }) => {
  return (
    <div
      id="section-historico"
      className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#122838] to-[#0d1d29] border border-[#1d415b] shadow-xl shadow-black/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1c384d]/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3fa9f5]/15 text-[#3fa9f5] ring-1 ring-[#3fa9f5]/30">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
              Histórico Completo de Leituras
            </h3>
            <p className="text-xs text-slate-400">
              Registros ordenados cronologicamente sem limite artificial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1b3d54] text-cyan-200 border border-[#275373]">
            Total: {readings.length} {readings.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <History className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">Nenhuma leitura cadastrada ainda</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utilize o formulário acima para adicionar a primeira leitura do hidrômetro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1f425b] text-slate-400 uppercase text-[11px] font-bold tracking-wider bg-[#0d1a24]/80">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4 text-right">Leitura (Litros)</th>
                <th className="py-3 px-4 text-right">Consumo</th>
                <th className="py-3 px-4 text-center">Duração</th>
                <th className="py-3 px-4 text-right">Taxa (L/h)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#173447]/60">
              {readings.map((item) => {
                // Status badge styling
                let statusBadge = null;

                if (item.status === 'base') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      <Sparkles className="h-3 w-3 text-slate-400" />
                      Base
                    </span>
                  );
                } else if (item.isInvalid) {
                  statusBadge = (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800/80"
                      title={item.invalidReason || 'Intervalo inconsistente'}
                    >
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      Inválido
                    </span>
                  );
                } else if (item.status === 'alto') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ef4b4b]/20 text-[#ef4b4b] border border-[#ef4b4b]/40">
                      <ShieldAlert className="h-3 w-3 text-[#ef4b4b]" />
                      Alto (≥ 45)
                    </span>
                  );
                } else if (item.status === 'atencao') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40">
                      <AlertTriangle className="h-3 w-3 text-[#f5a623]" />
                      Atenção (30–44)
                    </span>
                  );
                } else {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#3ddc97]/15 text-[#3ddc97] border border-[#3ddc97]/30">
                      <CheckCircle2 className="h-3 w-3 text-[#3ddc97]" />
                      Normal (&lt; 30)
                    </span>
                  );
                }

                return (
                  <tr
                    key={item.index + '-' + item.dataHora}
                    className="hover:bg-[#132c3d]/40 transition-colors"
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">
                      {item.index}
                    </td>

                    {/* Data/Hora */}
                    <td className="py-3 px-4 text-white font-medium whitespace-nowrap">
                      {item.dataHoraFormatted}
                    </td>

                    {/* Leitura */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200">
                      {formatNumber(item.leitura)} L
                    </td>

                    {/* Consumo no intervalo */}
                    <td className="py-3 px-4 text-right font-mono">
                      {item.consumoLitros !== null ? (
                        <span
                          className={`font-semibold ${
                            item.consumoLitros > 500
                              ? 'text-[#ef4b4b]'
                              : item.consumoLitros < 0
                              ? 'text-red-400'
                              : 'text-cyan-300'
                          }`}
                        >
                          {item.consumoLitros > 0 ? '+' : ''}
                          {formatNumber(item.consumoLitros)} L
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Duração */}
                    <td className="py-3 px-4 text-center text-slate-300 font-mono text-xs whitespace-nowrap">
                      {item.duracaoFormatted}
                    </td>

                    {/* Taxa L/h */}
                    <td className="py-3 px-4 text-right font-mono">
                      {item.taxaLitrosPorHora !== null ? (
                        <span
                          className={`font-bold ${
                            item.status === 'alto'
                              ? 'text-[#ef4b4b]'
                              : item.status === 'atencao'
                              ? 'text-[#f5a623]'
                              : 'text-[#3ddc97]'
                          }`}
                        >
                          {formatNumber(item.taxaLitrosPorHora, 1)} L/h
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info footer about spreadsheet corrections */}
      <div className="mt-4 pt-3 border-t border-[#1c384d]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            Para correções ou exclusão de leituras incorretas, edite diretamente as linhas na aba <strong className="text-slate-300">Leituras</strong> da sua Planilha Google.
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Formato de data: DD/MM/AAAA HH:mm
        </div>
      </div>
    </div>
  );
};
