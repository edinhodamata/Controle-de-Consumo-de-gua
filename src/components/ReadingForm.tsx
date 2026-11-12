import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Gauge, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { RawReading } from '../types/water';
import { formatNumber, formatDate } from '../utils/calculations';

interface ReadingFormProps {
  existingReadings: RawReading[];
  onSubmit: (reading: RawReading) => Promise<{ success: boolean; message: string }>;
  isSubmitting: boolean;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({
  existingReadings,
  onSubmit,
  isSubmitting,
}) => {
  // Current local ISO string for datetime-local (YYYY-MM-DDTHH:mm)
  const getNowFormatted = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [dataHora, setDataHora] = useState<string>(getNowFormatted());
  const [leitura, setLeitura] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find latest chronological reading for guidance
  const latestReading = existingReadings.length > 0
    ? [...existingReadings].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[existingReadings.length - 1]
    : null;

  // Real-time validation and warning
  useEffect(() => {
    setFormError(null);
    setFormWarning(null);

    if (!leitura || isNaN(Number(leitura))) {
      return;
    }

    const numVal = Number(leitura);

    if (numVal < 0 || !Number.isInteger(numVal)) {
      setFormError('A leitura deve ser um número inteiro positivo ou zero (litros).');
      return;
    }

    // Check chronological predecessor based on input dataHora
    if (dataHora && existingReadings.length > 0) {
      const inputTime = new Date(dataHora).getTime();
      const earlierReadings = existingReadings
        .filter((r) => new Date(r.dataHora).getTime() < inputTime)
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

      if (earlierReadings.length > 0) {
        const preceding = earlierReadings[0];
        if (numVal <= preceding.leitura) {
          setFormWarning(
            `Atenção: Esta leitura (${formatNumber(numVal)} L) é menor ou igual à leitura imediatamente anterior (${formatNumber(preceding.leitura)} L em ${formatDate(preceding.dataHora)}). Verifique se houve virada no hidrômetro ou erro de digitação.`
          );
        }
      }
    }
  }, [leitura, dataHora, existingReadings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!dataHora) {
      setFormError('Informe a data e a hora da leitura.');
      return;
    }

    if (!leitura || isNaN(Number(leitura))) {
      setFormError('Informe o valor numérico da leitura do hidrômetro em litros.');
      return;
    }

    const numLeitura = Number(leitura);
    if (numLeitura < 0 || !Number.isInteger(numLeitura)) {
      setFormError('A leitura deve ser um número inteiro não negativo (ex: 142580).');
      return;
    }

    // Check duplicate timestamp in frontend
    const newTimestamp = new Date(dataHora).getTime();
    const isDuplicate = existingReadings.some(
      (r) => new Date(r.dataHora).getTime() === newTimestamp
    );

    if (isDuplicate) {
      setFormError('Já existe uma leitura registrada com esta data e hora exatas.');
      return;
    }

    const res = await onSubmit({
      dataHora,
      leitura: numLeitura,
    });

    if (res.success) {
      setSuccessMessage(res.message);
      setLeitura('');
      setDataHora(getNowFormatted());
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setFormError(res.message);
    }
  };

  return (
    <div
      id="section-cadastro-leitura"
      className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#122838] to-[#0d1d29] border border-[#1d415b] shadow-xl shadow-black/20"
    >
      <div className="flex items-center justify-between pb-4 border-b border-[#1c384d]/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#3fa9f5]/15 text-[#3fa9f5] ring-1 ring-[#3fa9f5]/30">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-['Space_Grotesk']">
              Cadastrar Nova Leitura
            </h3>
            <p className="text-xs text-slate-400">
              Insira o registro atual do hidrômetro para recalcular consumo e projeções
            </p>
          </div>
        </div>

        {latestReading && (
          <div className="hidden sm:block text-right">
            <span className="text-[11px] text-slate-400 block">Última leitura registrada:</span>
            <span className="text-xs font-semibold text-cyan-300">
              {formatNumber(latestReading.leitura)} L{' '}
              <span className="text-slate-400 font-normal">({formatDate(latestReading.dataHora)})</span>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Data e Hora */}
          <div className="sm:col-span-6 lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#3fa9f5]" />
                Data e Hora da Leitura
              </span>
              <button
                type="button"
                onClick={() => setDataHora(getNowFormatted())}
                className="text-[11px] text-[#3fa9f5] hover:underline normal-case font-normal flex items-center gap-1"
                title="Preencher com a data e hora atual"
              >
                <Clock className="h-3 w-3" />
                Agora
              </button>
            </label>
            <input
              id="input-data-hora"
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1720] border border-[#224761] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3fa9f5] focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Leitura do Hidrômetro em Litros */}
          <div className="sm:col-span-6 lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-[#3fa9f5]" />
                Leitura do Hidrômetro (Litros)
              </span>
              {latestReading && leitura && !isNaN(Number(leitura)) && (
                <span className="text-[11px] text-slate-400 normal-case font-normal">
                  Dif: {Number(leitura) - latestReading.leitura >= 0 ? '+' : ''}
                  {formatNumber(Number(leitura) - latestReading.leitura)} L
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="input-leitura-litros"
                type="number"
                step="1"
                min="0"
                placeholder="Ex: 154200"
                value={leitura}
                onChange={(e) => setLeitura(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1720] border border-[#224761] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3fa9f5] focus:border-transparent transition-all disabled:opacity-50 pr-12 font-['Space_Grotesk'] text-base"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                Litros
              </span>
            </div>
          </div>

          {/* Botão Adicionar Leitura */}
          <div className="sm:col-span-12 lg:col-span-2 flex items-end">
            <button
              id="btn-adicionar-leitura"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#3fa9f5] to-[#1e78ba] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#3fa9f5]/20 ring-1 ring-cyan-400/30"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Adicionar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning Alert if reading <= previous */}
        {formWarning && (
          <div className="p-3 rounded-xl bg-[#2c200c] border border-[#f5a623]/50 text-[#fde68a] text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#f5a623] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[#f5a623]">Aviso de Consistência</span>
              <span>{formWarning}</span>
            </div>
          </div>
        )}

        {/* Form Error */}
        {formError && (
          <div className="p-3 rounded-xl bg-[#2d1216] border border-[#ef4b4b]/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#ef4b4b] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[#ef4b4b]">Erro de Validação</span>
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-[#3ddc97]/50 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#3ddc97] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[#3ddc97]">Sucesso</span>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Help Tip */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Dica: Registre os números pretos e vermelhos do seu hidrômetro convertidos para litros inteiros (1 m³ = 1.000 litros).
          </span>
        </div>
      </form>
    </div>
  );
};
