import React, { useState } from 'react';
import { Calculator, ArrowRight, AlertCircle, Info, Droplet, Waves, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateWaterBill, formatCurrency, formatNumber } from '../utils/calculations';

interface BillSimulatorProps {
  totalLeiturasM3: number;
}

export const BillSimulator: React.FC<BillSimulatorProps> = ({ totalLeiturasM3 }) => {
  const [consumoInput, setConsumoInput] = useState<string>('15');
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);

  const numM3 = parseFloat(consumoInput.replace(',', '.'));
  const safeM3 = isNaN(numM3) || numM3 < 0 ? 0 : numM3;
  const result = calculateWaterBill(safeM3);

  const handleUseTotalReadings = () => {
    // Round to 2 decimals for clean m³ representation
    const rounded = Math.round(totalLeiturasM3 * 100) / 100;
    setConsumoInput(String(rounded));
  };

  return (
    <div
      id="section-simulador-fatura"
      className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#122838] to-[#0d1d29] border border-[#1d415b] shadow-xl shadow-black/20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1c384d]/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-[#3ddc97] ring-1 ring-[#3ddc97]/30">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
              Simulador de Fatura (Água & Esgoto)
            </h3>
            <p className="text-xs text-slate-400">
              Cálculo progressivo por faixas de consumo residencial
            </p>
          </div>
        </div>

        {totalLeiturasM3 > 0 && (
          <button
            id="btn-usar-total-leituras"
            type="button"
            onClick={handleUseTotalReadings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#16384e] text-cyan-200 hover:bg-[#1d4763] hover:text-white border border-[#2c5f82] shadow-sm transition-all active:scale-95"
            title="Importar volume total apurado no período acima"
          >
            <ArrowRight className="h-3.5 w-3.5 text-[#3fa9f5]" />
            <span>Usar total das leituras ({formatNumber(totalLeiturasM3, 2)} m³)</span>
          </button>
        )}
      </div>

      {/* Input & Key Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left: Input */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Consumo Faturado (m³)
            </label>
            <div className="relative">
              <input
                id="input-consumo-m3"
                type="number"
                step="0.1"
                min="0"
                value={consumoInput}
                onChange={(e) => setConsumoInput(e.target.value)}
                placeholder="Ex: 18"
                className="w-full px-4 py-3 rounded-xl bg-[#0b1720] border border-[#224761] text-white text-lg font-bold font-['Space_Grotesk'] focus:outline-none focus:ring-2 focus:ring-[#3ddc97] focus:border-transparent transition-all pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                m³
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              1 m³ equivale a 1.000 litros de água tratada.
            </p>
          </div>

          {result.isExcedente60 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Consumo superior a 60 m³: o excedente foi tarifado na alíquota da última faixa (Água: R$ 29,836 / Esgoto: R$ 23,870).
              </span>
            </div>
          )}
        </div>

        {/* Right: Calculated Totals */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card Água */}
          <div className="p-4 rounded-2xl bg-[#0f212f] border border-[#1e425e] shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Valor Água</span>
              <Droplet className="h-4 w-4 text-[#3fa9f5]" />
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk']">
                {formatCurrency(result.valorAgua)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Fornecimento de água tratada
            </div>
          </div>

          {/* Card Esgoto */}
          <div className="p-4 rounded-2xl bg-[#0f212f] border border-[#1e425e] shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Valor Esgoto</span>
              <Waves className="h-4 w-4 text-teal-400" />
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-teal-200 font-['Space_Grotesk']">
                {formatCurrency(result.valorEsgoto)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Coleta e tratamento de esgoto
            </div>
          </div>

          {/* Card Total Estimado */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#103e33] to-[#0c2a23] border border-[#3ddc97]/50 shadow-lg shadow-[#3ddc97]/10 flex flex-col justify-between ring-1 ring-[#3ddc97]/20">
            <div className="flex items-center justify-between text-[#3ddc97] text-xs font-bold uppercase tracking-wider">
              <span>Total Estimado</span>
              <DollarSign className="h-4 w-4 text-[#3ddc97]" />
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk']">
                {formatCurrency(result.totalEstimado)}
              </div>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium">
              Água + Esgoto progressivo
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Tier Breakdown Toggle */}
      <div className="border-t border-[#1c384d]/60 pt-4">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-300 hover:text-white py-1 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#3fa9f5]" />
            Detalhamento do Cálculo por Faixa Tarifária Progressiva
          </span>
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showBreakdown && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-[#1d415b] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0c1a24]">
                  <th className="py-2.5 px-3">Faixa</th>
                  <th className="py-2.5 px-3">Intervalo</th>
                  <th className="py-2.5 px-3 text-right">Consumo Aplicado</th>
                  <th className="py-2.5 px-3 text-right">Tarifa Água</th>
                  <th className="py-2.5 px-3 text-right">Tarifa Esgoto</th>
                  <th className="py-2.5 px-3 text-right">Subtotal Água</th>
                  <th className="py-2.5 px-3 text-right">Subtotal Esgoto</th>
                  <th className="py-2.5 px-3 text-right font-bold">Subtotal Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173447]/60">
                {result.detalhesFaixas.map((f, idx) => (
                  <tr
                    key={idx}
                    className={f.consumoNaFaixa > 0 ? 'bg-[#132d40]/40 font-medium text-slate-200' : 'text-slate-500'}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white">{f.faixaNome}</td>
                    <td className="py-2.5 px-3">{f.faixaRange}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatNumber(f.consumoNaFaixa, 2)} m³
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(f.tarifaAguaUnit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(f.tarifaEsgotoUnit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(f.subtotalAgua)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(f.subtotalEsgoto)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">
                      {formatCurrency(f.subtotalGeral)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legal and Technical Disclaimer */}
      <div className="mt-4 pt-3 border-t border-[#1c384d]/60 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Nota: O simulador calcula exclusivamente o consumo progressivo de água e esgoto conforme as faixas tarifárias regulamentadas. Não inclui taxa mínima de disponibilidade de rede, taxa de iluminação pública, multas, juros, tributos adicionais ou cobranças municipais não especificadas. O resultado é uma estimativa de consumo faturado.
        </span>
      </div>
    </div>
  );
};
