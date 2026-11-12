import React from 'react';
import { Database, ArrowRight, Sparkles, ShieldCheck, Settings } from 'lucide-react';

interface UnconfiguredNoticeProps {
  onOpenSetup: () => void;
  onEnableSandbox: () => void;
}

export const UnconfiguredNotice: React.FC<UnconfiguredNoticeProps> = ({
  onOpenSetup,
  onEnableSandbox,
}) => {
  return (
    <div
      id="unconfigured-integration-banner"
      className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#142e42] via-[#0f2333] to-[#0d1d29] border border-[#275373] shadow-xl shadow-black/30"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-[#3fa9f5]/15 text-[#3fa9f5] shrink-0 ring-1 ring-[#3fa9f5]/30">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-cyan-300 border border-sky-400/30 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Integração Google Sheets Pendente
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
              Conecte sua planilha Google para persistência contínua
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              O backend Google Apps Script está 100% desenvolvido e pronto. Para sincronizar leituras diretamente com a aba <strong className="text-white">Leituras</strong> da sua planilha, configure a URL do Web App. Se preferir testar a aplicação de imediato antes de criar a planilha, você pode habilitar o modo de demonstração local.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            id="btn-notice-setup"
            type="button"
            onClick={onOpenSetup}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#3fa9f5] to-[#1e78ba] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3fa9f5]/25"
          >
            <Settings className="h-4 w-4" />
            <span>Configurar Planilha</span>
          </button>

          <button
            id="btn-notice-sandbox"
            type="button"
            onClick={onEnableSandbox}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Modo Demonstração</span>
          </button>
        </div>
      </div>
    </div>
  );
};
