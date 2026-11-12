import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  HelpCircle,
  Play,
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';
import { APPS_SCRIPT_CODE } from '../data/appsScriptCode';
import { ConnectionTestResult, ErrorCategory } from '../types/water';
import {
  testConnection,
  setStoredScriptUrl,
  getStoredScriptUrl,
  setSandboxMode,
  isSandboxMode,
} from '../services/waterService';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationChanged: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  onConfigurationChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'codigo' | 'instrucoes' | 'checklist'>('url');
  const [urlInput, setUrlInput] = useState<string>(getStoredScriptUrl());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sandbox, setSandbox] = useState<boolean>(isSandboxMode());

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar código:', err);
    }
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setTestResult({ success: false, message: 'Por favor, insira a URL do Web App.' });
      setIsTesting(false);
      return;
    }

    const res = await testConnection(cleanUrl);
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      setStoredScriptUrl(cleanUrl);
      setSandboxMode(false);
      setSandbox(false);
      onConfigurationChanged();
    }
  };

  const handleToggleSandbox = (enable: boolean) => {
    setSandbox(enable);
    setSandboxMode(enable);
    onConfigurationChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0e212e] border border-[#214763] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1c3e57] flex items-center justify-between bg-[#0a1720]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#3fa9f5]/15 text-[#3fa9f5]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white">
                Integração Google Sheets & Apps Script
              </h2>
              <p className="text-xs text-slate-400">
                Configure a persistência segura sem intermediários
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1c3e57] bg-[#0c1a24] px-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'url'
                ? 'border-[#3fa9f5] text-[#3fa9f5]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Conexão do Web App
          </button>
          <button
            onClick={() => setActiveTab('codigo')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'codigo'
                ? 'border-[#3fa9f5] text-[#3fa9f5]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            Código Apps Script (Code.gs)
          </button>
          <button
            onClick={() => setActiveTab('instrucoes')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'instrucoes'
                ? 'border-[#3fa9f5] text-[#3fa9f5]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Passo a Passo de Publicação
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-[#3fa9f5] text-[#3fa9f5]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Checklist de Validação
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: URL & CONNECTION */}
          {activeTab === 'url' && (
            <div className="space-y-6">
              <div className="bg-[#122736] p-4 sm:p-5 rounded-2xl border border-[#1e4460]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3fa9f5]" />
                  URL do Web App Publicado
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Cole aqui a URL gerada na publicação do seu Google Apps Script (geralmente com o formato{' '}
                  <code className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px]">
                    https://script.google.com/macros/s/AKfycb.../exec
                  </code>
                  ).
                </p>

                <form onSubmit={handleTestAndSave} className="space-y-3">
                  <div>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#09151e] border border-[#234d6d] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3fa9f5] font-mono"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="py-2.5 px-5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#3fa9f5] to-[#1e78ba] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3fa9f5]/20 disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Testando Conexão...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-white" />
                          <span>Testar e Salvar Conexão</span>
                        </>
                      )}
                    </button>

                    {urlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoredScriptUrl('');
                          setUrlInput('');
                          setTestResult(null);
                          onConfigurationChanged();
                        }}
                        className="text-xs text-slate-400 hover:text-red-300 transition-colors"
                      >
                        Limpar URL salva
                      </button>
                    )}
                  </div>
                </form>

                {/* Test Result Message */}
                {testResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-xs border ${
                      testResult.success
                        ? 'bg-emerald-950/80 border-[#3ddc97]/50 text-emerald-200'
                        : 'bg-red-950/80 border-[#ef4b4b]/50 text-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-[#3ddc97] shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-[#ef4b4b] shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">
                            {testResult.success ? 'Conexão Realizada com Sucesso!' : 'Falha na Conexão'}
                          </span>
                          {testResult.category && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                                testResult.category === 'FALHA_AUTENTICACAO'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : testResult.category === 'URL_INVALIDA' || testResult.category === 'URL_NAO_ENCONTRADA'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                  : testResult.category === 'CORPO_VAZIO'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : testResult.category === 'CONTEUDO_INCOMPATIVEL'
                                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                  : testResult.category === 'ERRO_HTTP'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : testResult.category === 'RESPOSTA_INVALIDA'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {testResult.category === 'FALHA_AUTENTICACAO' && 'Permissão / Login Google Exigido'}
                              {testResult.category === 'URL_INVALIDA' && 'Formato de URL Inválido'}
                              {testResult.category === 'URL_NAO_ENCONTRADA' && 'URL Inexistente (404)'}
                              {testResult.category === 'CORPO_VAZIO' && 'Resposta Vazia do Servidor'}
                              {testResult.category === 'CONTEUDO_INCOMPATIVEL' && 'Conteúdo Incompatível (Não-JSON)'}
                              {testResult.category === 'ERRO_HTTP' && `Erro HTTP ${testResult.httpStatus || ''}`}
                              {testResult.category === 'RESPOSTA_INVALIDA' && 'Resposta Inválida / Erro no Script'}
                              {testResult.category === 'FALHA_REDE' && 'Falha de Conexão de Rede'}
                            </span>
                          )}
                          {testResult.httpStatus && (
                            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono text-slate-300">
                              HTTP {testResult.httpStatus}
                            </span>
                          )}
                        </div>

                        <p className="leading-relaxed text-slate-200">{testResult.message}</p>

                        {/* Informações detalhadas de sucesso */}
                        {testResult.success && (
                          <div className="bg-emerald-900/40 p-2.5 rounded-lg border border-emerald-700/40 text-[11px] text-emerald-300 space-y-1">
                            <p>✓ Comunicação GET com <strong>acao=ping</strong> validada com sucesso.</p>
                            <p>✓ JSON válido com <strong>sucesso: true</strong> recebido da API.</p>
                            {testResult.versao && (
                              <p>✓ Versão da API: <strong className="font-mono">{testResult.versao}</strong></p>
                            )}
                            {testResult.totalLeituras !== undefined && (
                              <p>✓ Registros existentes na planilha: <strong>{testResult.totalLeituras}</strong> leitura(s).</p>
                            )}
                            {testResult.timestamp && (
                              <p className="text-[10px] text-emerald-400/80 font-mono">
                                Validado em: {new Date(testResult.timestamp).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Guia de correção rápida para erros frequentes */}
                        {!testResult.success && testResult.category === 'FALHA_AUTENTICACAO' && (
                          <div className="bg-amber-950/60 p-3 rounded-lg border border-amber-500/40 text-[11px] text-amber-200 space-y-1.5">
                            <span className="font-bold text-amber-300 block">Como resolver a permissão de acesso no Google Apps Script:</span>
                            <ol className="list-decimal list-inside space-y-1 text-slate-300">
                              <li>Abra sua planilha e vá em <strong>Extensões &gt; Apps Script</strong>.</li>
                              <li>Clique no botão azul <strong>Implantar &gt; Gerenciar implantações</strong>.</li>
                              <li>Clique no ícone de lápis (Editar) ao lado da implantação ativa.</li>
                              <li>No campo <strong>"Quem pode acessar"</strong>, selecione estritamente <strong>"Qualquer pessoa" (Anyone)</strong>.</li>
                              <li>No campo <strong>"Versão"</strong>, selecione <strong>"Nova versão"</strong> (obrigatório para aplicar alterações).</li>
                              <li>Clique em <strong>Implantar</strong> e teste novamente aqui.</li>
                            </ol>
                          </div>
                        )}

                        {!testResult.success && testResult.category === 'URL_INVALIDA' && (
                          <div className="bg-orange-950/60 p-2.5 rounded-lg border border-orange-500/40 text-[11px] text-orange-200">
                            <strong>Dica de formato:</strong> A URL correta é gerada após clicar em <em>Implantar &gt; Nova Implantação &gt; App da Web</em> e termina em <code className="px-1 rounded bg-black/40 text-cyan-300 font-mono">/exec</code> (não utilize URLs terminadas em /edit ou /dev).
                          </div>
                        )}

                        {!testResult.success && testResult.category === 'RESPOSTA_INVALIDA' && (
                          <div className="bg-purple-950/60 p-2.5 rounded-lg border border-purple-500/40 text-[11px] text-purple-200">
                            <strong>Dica do Script:</strong> Acesse a aba <strong>"Código Apps Script (Code.gs)"</strong> deste modal, copie o código completo, cole no seu editor do Apps Script substituindo todo o conteúdo, salve e gere uma <strong>Nova Versão</strong> na implantação.
                          </div>
                        )}

                        {!testResult.success && (testResult.category === 'CONTEUDO_INCOMPATIVEL' || testResult.category === 'CORPO_VAZIO') && (
                          <div className="bg-pink-950/60 p-2.5 rounded-lg border border-pink-500/40 text-[11px] text-pink-200">
                            <strong>Dica de compatibilidade:</strong> O endpoint não respondeu com um JSON válido ou retornou corpo vazio. Verifique se a URL termina em <code className="px-1 rounded bg-black/40 text-cyan-300 font-mono">/exec</code> e se o código em <strong>Code.gs</strong> foi salvo e implantado como Web App.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sandbox Toggle Box */}
              <div className="bg-[#122736]/60 p-4 sm:p-5 rounded-2xl border border-[#1b3d54] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                      Ambiente de Testes Local
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">
                    Modo Sandbox (Sem Planilha Google)
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xl mt-1">
                    Permite testar todos os cálculos, formulários, alertas e gráficos usando o armazenamento local do navegador, sem gravar na Planilha Google.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleSandbox(!sandbox)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    sandbox
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-[#1b394f] text-slate-300 hover:text-white border border-[#2b597b]'
                  }`}
                >
                  {sandbox ? 'Desativar Sandbox' : 'Ativar Modo Sandbox'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CÓDIGO APPS SCRIPT */}
          {activeTab === 'codigo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Código Google Apps Script (Code.gs)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Arquivo completo pronto para colar no editor do Google Apps Script
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#3fa9f5] text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#3fa9f5]/20"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-[#08121a] border border-[#1c384d] p-4 max-h-96 overflow-y-auto font-mono text-xs text-slate-300">
                <pre className="whitespace-pre">{APPS_SCRIPT_CODE}</pre>
              </div>

              <div className="p-3 rounded-xl bg-[#122736] border border-[#1b3d54] text-xs text-slate-300 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3ddc97] shrink-0 mt-0.5" />
                <span>
                  O código inclui verificação e criação automática da aba <strong>Leituras</strong> com cabeçalho <strong>DataHora | Leitura</strong>, ordenação cronológica, bloqueio de concorrência com <code>LockService</code> e validação rigorosa de inteiros não negativos.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: PASSO A PASSO */}
          {activeTab === 'instrucoes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Guia Rápido de Configuração em 5 Etapas
              </h3>

              <div className="space-y-3 text-xs">
                {/* Passo 1 */}
                <div className="p-4 rounded-2xl bg-[#122736] border border-[#1c3e57] flex gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3fa9f5] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Crie a Planilha Google</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Acesse <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-[#3fa9f5] underline font-semibold">sheets.new</a> e nomeie a planilha como <strong>“Controle de Água”</strong>. Não é necessário criar colunas manualmente: o script configurará automaticamente a aba <strong>Leituras</strong> com <code>DataHora</code> e <code>Leitura</code>.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-4 rounded-2xl bg-[#122736] border border-[#1c3e57] flex gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3fa9f5] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Abra o Google Apps Script</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Na planilha, clique no menu superior <strong>Extensões &gt; Apps Script</strong>. Uma nova aba será aberta com o editor de código.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-4 rounded-2xl bg-[#122736] border border-[#1c3e57] flex gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3fa9f5] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Cole o Código e Salve</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Apague qualquer código existente no arquivo <code>Code.gs</code>, copie o código da aba <strong>“Código Apps Script”</strong> deste painel, cole e salve pressionando <code>Ctrl+S</code> (ou no ícone de disquete).
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="p-4 rounded-2xl bg-[#122736] border border-[#1c3e57] flex gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3fa9f5] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Implantar como Web App (Crucial)</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      No canto superior direito, clique em <strong>Implantar &gt; Nova implantação</strong>. Na engrenagem, selecione <strong>App da Web</strong>. Configure exatamente:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-cyan-200">
                      <li><strong>Executar como:</strong> Eu (sua conta de email)</li>
                      <li><strong>Quem pode acessar:</strong> Qualquer pessoa (Anyone)</li>
                    </ul>
                    <p className="text-amber-300 mt-2">
                      ⚠️ Atenção: Se não marcar "Qualquer pessoa", o Google bloqueará as requisições HTTP do aplicativo web.
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="p-4 rounded-2xl bg-[#122736] border border-[#1c3e57] flex gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-[#3ddc97] text-black font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Copie a URL e Conecte</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Copie a URL gerada (terminada em <code>/exec</code>), volte na aba <strong>“Conexão do Web App”</strong> deste modal, cole e clique em <strong>Testar e Salvar Conexão</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHECKLIST DE VALIDAÇÃO */}
          {activeTab === 'checklist' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Checklist de Validação do Sistema
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Leituras & Hidrômetro
                  </div>
                  <p className="text-slate-400">
                    Valida inteiros não negativos, bloqueia duplicidade de data/hora e emite aviso caso a leitura seja menor ou igual à anterior.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Cálculos de Consumo
                  </div>
                  <p className="text-slate-400">
                    Consumo total pela diferença entre primeira e última leitura; duração formatada como XhYYmin; taxa horária em L/h.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Alerta de Vazamento
                  </div>
                  <p className="text-slate-400">
                    Banner vermelho se a taxa recente for ≥50% acima da média anterior; amarelo se entre 20% e 50%; sem falso positivo com menos de 2 intervalos válidos.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Gráficos Integrados
                  </div>
                  <p className="text-slate-400">
                    Barras com destaque vermelho para consumo &gt; 500L; linha de vazão com tracejado horizontal da média do período.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Histórico Completo
                  </div>
                  <p className="text-slate-400">
                    Sem paginação e sem limites artificiais; ordenação cronológica e rolagem horizontal adaptável.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#122736] border border-[#1b3d54]">
                  <div className="flex items-center gap-2 font-bold text-white mb-1">
                    <CheckCircle2 className="h-4 w-4 text-[#3ddc97]" />
                    Simulador Progressivo
                  </div>
                  <p className="text-slate-400">
                    Tarifação em 5 faixas progressivas (0-10, 10-20, 20-30, 30-40, 40-60 e &gt;60 m³), botão de importação direta e detalhamento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1c3e57] bg-[#0a1720] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Controle de Água • Versão Web App Apps Script
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1a384d] text-white hover:bg-[#234b67] transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
