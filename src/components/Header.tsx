import React from 'react';
import { Droplet, RefreshCw, Settings, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { ConnectionStatus } from '../services/waterService';

interface HeaderProps {
  status: ConnectionStatus;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isLoading,
  onRefresh,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-[#183648] bg-[#0b1b24]/90 backdrop-blur-md sticky top-0 z-30 shadow-md shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3fa9f5] to-[#1b5e94] flex items-center justify-center shadow-lg shadow-[#3fa9f5]/20 ring-1 ring-cyan-300/30">
            <Droplet className="h-5 w-5 text-white fill-white/20" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Space_Grotesk'] flex items-center gap-2">
              Controle de Água
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Monitoramento Residencial & Gestão de Consumo
            </p>
          </div>
        </div>

        {/* Actions & Connection State */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Status Badge */}
          {status.isSandbox ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
              title="Modo Sandbox: Dados salvos apenas na memória local do navegador"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Modo Sandbox (Local)</span>
            </div>
          ) : status.isConfigured ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-[#3ddc97] border border-emerald-500/30"
              title="Conectado à Planilha Google via Apps Script"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#3ddc97]" />
              <span>Google Sheets Ativo</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30"
              title="URL do Google Apps Script ainda não configurada"
            >
              <CloudOff className="h-3.5 w-3.5 text-red-400" />
              <span>Planilha Não Configurada</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            id="btn-refresh-data"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#132c3d] text-slate-200 hover:bg-[#1b3d54] hover:text-white border border-[#234b66] transition-all disabled:opacity-50 active:scale-95"
            title="Atualizar dados da planilha"
          >
            <RefreshCw className={`h-4 w-4 text-[#3fa9f5] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Settings / Apps Script Modal Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#174668] to-[#1e5884] text-white hover:brightness-110 border border-[#3fa9f5]/40 shadow-sm shadow-[#3fa9f5]/20 transition-all active:scale-95"
            title="Configurar integração com Google Sheets"
          >
            <Settings className="h-4 w-4 text-cyan-300" />
            <span>Configuração</span>
          </button>
        </div>
      </div>
    </header>
  );
};
