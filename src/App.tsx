import React, { useState, useEffect, useCallback } from 'react';
import { RawReading, ProcessedReading, SummaryStats, LeakAlertData } from './types/water';
import { processReadings } from './utils/calculations';
import {
  fetchAllReadings,
  addReading,
  getStoredScriptUrl,
  isSandboxMode,
  setSandboxMode,
  ConnectionStatus,
} from './services/waterService';
import { Header } from './components/Header';
import { LeakAlertBanner } from './components/LeakAlertBanner';
import { SummaryCards } from './components/SummaryCards';
import { ReadingForm } from './components/ReadingForm';
import { ChartsSection } from './components/ChartsSection';
import { HistoryTable } from './components/HistoryTable';
import { BillSimulator } from './components/BillSimulator';
import { SetupModal } from './components/SetupModal';
import { UnconfiguredNotice } from './components/UnconfiguredNotice';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  const [rawReadings, setRawReadings] = useState<RawReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => {
    const url = getStoredScriptUrl();
    const sandbox = isSandboxMode();
    return {
      isConfigured: !!url,
      url,
      isSandbox: sandbox,
    };
  });

  const updateStatus = useCallback(() => {
    const url = getStoredScriptUrl();
    const sandbox = isSandboxMode();
    setConnectionStatus({
      isConfigured: !!url,
      url,
      isSandbox: sandbox,
    });
  }, []);

  // Load readings from backend or sandbox
  const loadReadings = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetchAllReadings();
      if (res.success) {
        setRawReadings(res.data);
      } else {
        // If not configured, keep empty or show notice
        setRawReadings([]);
        if (res.message && !res.message.includes('não configurada')) {
          setNotification({ type: 'error', message: res.message });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: 'error', message: `Erro ao carregar leituras: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  // Handle configuration changes from SetupModal
  const handleConfigChanged = () => {
    updateStatus();
    loadReadings();
  };

  const handleEnableSandbox = () => {
    setSandboxMode(true);
    updateStatus();
    loadReadings();
    setNotification({
      type: 'info',
      message: 'Modo Sandbox ativado! Você pode cadastrar leituras de teste na memória do navegador.',
    });
  };

  // Add Reading Handler
  const handleAddReading = async (newReading: RawReading): Promise<{ success: boolean; message: string }> => {
    setIsSubmitting(true);
    try {
      const res = await addReading(newReading);
      if (res.success) {
        if (res.updatedData) {
          setRawReadings(res.updatedData);
        } else {
          // Append and sort
          setRawReadings((prev) =>
            [...prev, newReading].sort(
              (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
            )
          );
        }
        setNotification({
          type: 'success',
          message: res.message,
        });
        return { success: true, message: res.message };
      } else {
        setNotification({
          type: 'error',
          message: res.message,
        });
        return { success: false, message: res.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errMsg = `Falha ao gravar leitura: ${msg}`;
      setNotification({ type: 'error', message: errMsg });
      return { success: false, message: errMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process readings for calculations, alerts, and charts
  const { processed, summary, leakAlert } = processReadings(rawReadings);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#091721] via-[#08141d] to-[#050c12] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`p-3.5 rounded-xl shadow-2xl flex items-start gap-3 border ${
              notification.type === 'success'
                ? 'bg-[#0f2d24] border-[#3ddc97]/50 text-emerald-100'
                : notification.type === 'error'
                ? 'bg-[#331114] border-[#ef4b4b]/50 text-red-100'
                : 'bg-[#152e42] border-[#3fa9f5]/50 text-sky-100'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-[#3ddc97] shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-[#ef4b4b] shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-[#3fa9f5] shrink-0 mt-0.5" />
            )}

            <div className="text-xs leading-relaxed flex-1">
              <span className="font-bold block mb-0.5">
                {notification.type === 'success'
                  ? 'Sucesso'
                  : notification.type === 'error'
                  ? 'Atenção'
                  : 'Informação'}
              </span>
              <span>{notification.message}</span>
            </div>

            <button
              onClick={() => setNotification(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header */}
      <Header
        status={connectionStatus}
        isLoading={isLoading}
        onRefresh={() => loadReadings(true)}
        onOpenSettings={() => setIsSetupOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Unconfigured state notice if neither Sheets nor Sandbox is active */}
        {!connectionStatus.isConfigured && !connectionStatus.isSandbox && (
          <UnconfiguredNotice
            onOpenSetup={() => setIsSetupOpen(true)}
            onEnableSandbox={handleEnableSandbox}
          />
        )}

        {/* 2. Banner de Alerta de Possível Vazamento */}
        {leakAlert.hasAlert && <LeakAlertBanner alert={leakAlert} />}

        {/* 3. Cards de Resumo Geral */}
        <section aria-label="Resumo Geral">
          <SummaryCards summary={summary} />
        </section>

        {/* 4. Formulário de Nova Leitura */}
        <section aria-label="Cadastro de Leitura">
          <ReadingForm
            existingReadings={rawReadings}
            onSubmit={handleAddReading}
            isSubmitting={isSubmitting}
          />
        </section>

        {/* 5. Gráficos de Consumo e Taxa Horária */}
        <section aria-label="Gráficos de Consumo">
          <ChartsSection
            processedReadings={processed}
            taxaMediaGeral={summary.taxaMediaLitrosPorHora}
          />
        </section>

        {/* 6. Histórico Completo de Leituras */}
        <section aria-label="Histórico de Leituras">
          <HistoryTable
            readings={processed}
            onOpenSpreadsheet={() => setIsSetupOpen(true)}
          />
        </section>

        {/* 7. Simulador de Fatura de Água e Esgoto */}
        <section aria-label="Simulador de Fatura">
          <BillSimulator totalLeiturasM3={summary.consumoTotalM3} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#132c3d] bg-[#07131b] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Controle de Água © {new Date().getFullYear()} • Sistema Residencial de Monitoramento e Gestão Hídrica
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="text-[#3fa9f5] hover:underline"
            >
              Configuração Google Apps Script
            </button>
          </div>
        </div>
      </footer>

      {/* Setup & Instructions Modal */}
      <SetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onConfigurationChanged={handleConfigChanged}
      />
    </div>
  );
}
