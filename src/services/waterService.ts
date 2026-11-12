import { RawReading, ApiResponse, ConnectionTestResult, ErrorCategory } from '../types/water';

const STORAGE_KEY_URL = 'controle_agua_script_url';
const STORAGE_KEY_SANDBOX = 'controle_agua_sandbox_mode';
const STORAGE_KEY_SANDBOX_DATA = 'controle_agua_sandbox_readings';

export interface ConnectionStatus {
  isConfigured: boolean;
  url: string;
  isSandbox: boolean;
  lastChecked?: string;
  isConnected?: boolean;
  errorMessage?: string;
  category?: ErrorCategory;
}

export function getStoredScriptUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_URL) || '';
}

export function setStoredScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
}

export function isSandboxMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_SANDBOX) === 'true';
}

export function setSandboxMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SANDBOX, enabled ? 'true' : 'false');
}

export function getSandboxReadings(): RawReading[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SANDBOX_DATA);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler dados sandbox:', err);
    return [];
  }
}

export function saveSandboxReadings(readings: RawReading[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SANDBOX_DATA, JSON.stringify(readings));
}

/**
 * Validação rigorosa do formato de URL do Google Apps Script
 */
export function validateAppsScriptUrl(url: string): { valid: boolean; message?: string; category?: ErrorCategory } {
  const clean = url.trim();
  if (!clean) {
    return {
      valid: false,
      category: 'URL_INVALIDA',
      message: 'Por favor, insira a URL do Web App do Google Apps Script.',
    };
  }

  if (!clean.startsWith('https://script.google.com/macros/s/')) {
    return {
      valid: false,
      category: 'URL_INVALIDA',
      message: 'A URL informada deve começar com "https://script.google.com/macros/s/". Verifique o link copiado na implantação.',
    };
  }

  if (!clean.endsWith('/exec')) {
    return {
      valid: false,
      category: 'URL_INVALIDA',
      message:
        'A URL do Web App deve terminar com "/exec". Se você copiou a URL com final "/dev" ou "/edit", obtenha a URL de implantação oficial terminada em "/exec".',
    };
  }

  return { valid: true };
}

/**
 * Testa conectividade e permissões reais com o Web App do Google Apps Script.
 * Usa o proxy do servidor Express para evitar bloqueios de CORS e redirects de login do Google no navegador.
 * Aplica rigorosamente os 12 requisitos de validação.
 */
export async function testConnection(urlToTest?: string): Promise<ConnectionTestResult> {
  const url = (urlToTest || getStoredScriptUrl()).trim();

  // 1. Utilize a URL configurada pelo usuário (preservando-a)
  const validation = validateAppsScriptUrl(url);
  if (!validation.valid) {
    return {
      success: false,
      category: validation.category,
      message: validation.message || 'URL inválida.',
    };
  }

  // 2. Tenta via proxy seguro do servidor (resolve CORS e redirects 302 do Apps Script)
  try {
    const proxyRes = await fetch('/api/sheets/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (proxyRes.ok) {
      const data: ConnectionTestResult = await proxyRes.json();
      return data;
    }
  } catch (proxyErr) {
    console.warn('Proxy local /api/sheets/test falhou, executando validação direta:', proxyErr);
  }

  // 3. Fallback de chamada direta do cliente com as 12 regras estritas
  try {
    // 2. Para testar a conexão, acrescente o parâmetro acao=ping à URL
    const pingUrl = url.includes('?') ? `${url}&acao=ping` : `${url}?acao=ping`;

    // 3. Faça a requisição HTTP GET
    const response = await fetch(pingUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const finalUrl = response.url || '';

    // 4. Verifique o status HTTP
    // 5. Leia o corpo da resposta como texto antes de tentar interpretar o JSON
    const text = await response.text();

    // Verificação de tela de autenticação / login Google (redirect 302 para login)
    if (
      finalUrl.includes('accounts.google.com') ||
      finalUrl.includes('ServiceLogin') ||
      text.includes('accounts.google.com') ||
      text.includes('ServiceLogin') ||
      text.includes('Sign in - Google Accounts') ||
      text.includes('Fazer login nas Contas do Google')
    ) {
      return {
        success: false,
        category: 'FALHA_AUTENTICACAO',
        httpStatus: response.status,
        message:
          'O Google bloqueou o acesso exigindo login de conta. A implantação do Apps Script precisa ser reconfigurada com "Quem pode acessar: Qualquer pessoa" (Anyone).',
      };
    }

    if (response.status === 404 || text.includes('Page Not Found') || text.includes('Não é possível acessar o arquivo')) {
      return {
        success: false,
        category: 'URL_NAO_ENCONTRADA',
        httpStatus: 404,
        message: 'URL não encontrada (HTTP 404). O ID da implantação do Apps Script não existe ou foi excluído.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        category: 'ERRO_HTTP',
        httpStatus: response.status,
        message: `O servidor do Google retornou erro HTTP ${response.status}.`,
      };
    }

    // 6. Se o corpo estiver vazio, mostre um erro específico
    if (!text || text.trim() === '') {
      return {
        success: false,
        category: 'CORPO_VAZIO',
        httpStatus: response.status,
        message: 'O endpoint retornou uma resposta vazia do servidor (corpo vazio).',
      };
    }

    // 7. Se o conteúdo não for JSON válido, mostre uma mensagem informando que o endpoint retornou conteúdo incompatível
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        success: false,
        category: 'CONTEUDO_INCOMPATIVEL',
        httpStatus: response.status,
        message:
          'O endpoint retornou conteúdo incompatível (não é um JSON válido). Verifique se a URL aponta para a implantação Web App do Google Apps Script.',
        details: text.slice(0, 300),
      };
    }

    // 8. Se o JSON tiver sucesso=false, mostre a mensagem enviada pelo Apps Script
    const isExplicitFalse = parsed.sucesso === false || parsed.success === false;
    if (isExplicitFalse) {
      const errorMsg =
        parsed.mensagem ||
        parsed.message ||
        parsed.error ||
        parsed.erro ||
        'O Google Apps Script retornou uma mensagem de erro ao testar a conexão.';
      return {
        success: false,
        category: 'RESPOSTA_INVALIDA',
        message: errorMsg,
        versao: parsed.versao,
      };
    }

    // 9. Considere a conexão validada somente quando receber JSON válido com sucesso=true
    // Não declare a integração resolvida apenas porque o status HTTP foi 200!
    const isSuccess = parsed.sucesso === true || parsed.success === true;
    if (!isSuccess) {
      return {
        success: false,
        category: 'CONTEUDO_INCOMPATIVEL',
        message:
          'O endpoint respondeu com status HTTP 200, mas o JSON retornado não confirmou sucesso (sucesso: true). Não foi possível validar a conexão.',
      };
    }

    return {
      success: true,
      message: parsed.mensagem || parsed.message || 'API Controle de Água funcionando.',
      versao: parsed.versao || '1.0',
      timestamp: new Date().toISOString(),
    };
  } catch (directErr: unknown) {
    const errMsg = directErr instanceof Error ? directErr.message : String(directErr);
    return {
      success: false,
      category: 'FALHA_REDE',
      message: `Falha de rede ao conectar com o script: ${errMsg}. Se esta chamada ocorreu no navegador, verifique se a implantação está configurada com permissão "Qualquer pessoa" (Anyone), pois redirecionamentos para login causam bloqueio imediato de CORS.`,
    };
  }
}

/**
 * Consulta todas as leituras da planilha Google através do backend
 * Suporta o formato oficial em português: { "sucesso": true, "dados": [] }
 */
export async function fetchAllReadings(): Promise<{ success: boolean; data: RawReading[]; message?: string; category?: ErrorCategory }> {
  const sandbox = isSandboxMode();
  if (sandbox) {
    return {
      success: true,
      data: getSandboxReadings(),
      message: 'Dados carregados do armazenamento sandbox local.',
    };
  }

  const url = getStoredScriptUrl().trim();
  if (!url) {
    return {
      success: false,
      data: [],
      category: 'URL_INVALIDA',
      message: 'Integração não configurada. Defina a URL do Web App do Google Apps Script.',
    };
  }

  // 1. Tenta via proxy do servidor backend
  try {
    const proxyRes = await fetch('/api/sheets/readings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result.success && Array.isArray(result.data)) {
        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      } else {
        return {
          success: false,
          data: [],
          category: result.category,
          message: result.message || 'Falha ao recuperar leituras da planilha.',
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy /api/sheets/readings falhou, tentando fallback direto:', proxyErr);
  }

  // 2. Fallback direto do navegador
  try {
    const fetchUrl = url.includes('?') ? `${url}&acao=listar` : `${url}?acao=listar`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await response.text();

    if (text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('<!DOCTYPE html>')) {
      return {
        success: false,
        data: [],
        category: 'FALHA_AUTENTICACAO',
        message: 'Acesso não autorizado pelo Google. Configure a implantação para "Quem pode acessar: Qualquer pessoa" (Anyone).',
      };
    }

    if (!text || text.trim() === '') {
      return {
        success: false,
        data: [],
        category: 'CORPO_VAZIO',
        message: 'O endpoint de leitura retornou uma resposta vazia do servidor.',
      };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        success: false,
        data: [],
        category: 'CONTEUDO_INCOMPATIVEL',
        message: 'A resposta da planilha Google não pôde ser interpretada como JSON válido.',
      };
    }

    const isSuccess = result.sucesso === true || result.success === true;
    if (isSuccess) {
      const rawList = result.dados !== undefined ? result.dados : result.data;
      const listArray = Array.isArray(rawList) ? rawList : [];

      const normalized: RawReading[] = listArray
        .map((item: any) => {
          const dt = item.dataHora || item.DataHora || item.data_hora || item.timestamp || '';
          const val = item.leitura !== undefined ? item.leitura : (item.Leitura !== undefined ? item.Leitura : item.valor);
          return {
            dataHora: String(dt),
            leitura: Math.round(Number(val) || 0),
          };
        })
        .filter((item: RawReading) => item.dataHora && !isNaN(new Date(item.dataHora).getTime()));

      return {
        success: true,
        data: normalized,
        message: result.mensagem || result.message,
      };
    } else {
      return {
        success: false,
        data: [],
        category: 'RESPOSTA_INVALIDA',
        message: result.mensagem || result.message || result.error || 'Falha ao obter leituras da planilha.',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      data: [],
      category: 'FALHA_REDE',
      message: `Erro de comunicação com o backend: ${errorMsg}`,
    };
  }
}

/**
 * Adiciona uma nova leitura na planilha Google através do backend
 * Suporta retorno oficial: { "sucesso": true, "mensagem": "..." }
 */
export async function addReading(
  reading: RawReading
): Promise<{ success: boolean; message: string; updatedData?: RawReading[]; category?: ErrorCategory }> {
  const sandbox = isSandboxMode();
  if (sandbox) {
    const current = getSandboxReadings();
    const timestampNew = new Date(reading.dataHora).getTime();
    const duplicate = current.some((r) => new Date(r.dataHora).getTime() === timestampNew);
    if (duplicate) {
      return {
        success: false,
        message: 'Já existe uma leitura cadastrada exatamente para esta data e hora no modo sandbox.',
      };
    }

    const updated = [...current, reading].sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );
    saveSandboxReadings(updated);
    return {
      success: true,
      message: 'Leitura cadastrada no armazenamento sandbox local com sucesso!',
      updatedData: updated,
    };
  }

  const url = getStoredScriptUrl().trim();
  if (!url) {
    return {
      success: false,
      category: 'URL_INVALIDA',
      message: 'Integração não configurada. Defina a URL do Web App antes de cadastrar leituras.',
    };
  }

  // 1. Tenta via proxy do servidor backend
  try {
    const proxyRes = await fetch('/api/sheets/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, reading }),
    });

    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Leitura salva com sucesso na planilha Google!',
          updatedData: Array.isArray(result.data) ? result.data : undefined,
        };
      } else {
        return {
          success: false,
          category: result.category,
          message: result.message || 'Falha ao gravar leitura na planilha.',
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy /api/sheets/add falhou, tentando fallback direto:', proxyErr);
  }

  // 2. Fallback direto usando Content-Type: text/plain para evitar preflight OPTIONS
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        dataHora: reading.dataHora,
        leitura: Number(reading.leitura),
      }),
      redirect: 'follow',
    });

    const text = await response.text();

    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
      return {
        success: false,
        category: 'FALHA_AUTENTICACAO',
        message: 'O servidor retornou erro de permissão. Certifique-se de implantar o Apps Script com permissão "Quem pode acessar: Qualquer pessoa" (Anyone).',
      };
    }

    if (!text || text.trim() === '') {
      return {
        success: false,
        category: 'CORPO_VAZIO',
        message: 'O servidor retornou uma resposta vazia ao tentar gravar a leitura.',
      };
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        success: false,
        category: 'CONTEUDO_INCOMPATIVEL',
        message: 'O servidor respondeu com formato inválido (não-JSON) ao salvar leitura.',
      };
    }

    const isSuccess = result.sucesso === true || result.success === true;
    if (isSuccess) {
      const rawList = result.dados !== undefined ? result.dados : result.data;
      let normalizedList: RawReading[] | undefined = undefined;
      if (Array.isArray(rawList)) {
        normalizedList = rawList.map((item: any) => ({
          dataHora: String(item.dataHora || item.DataHora || item.data_hora || ''),
          leitura: Math.round(Number(item.leitura !== undefined ? item.leitura : item.Leitura) || 0),
        }));
      }

      return {
        success: true,
        message: result.mensagem || result.message || 'Leitura cadastrada com sucesso!',
        updatedData: normalizedList,
      };
    } else {
      return {
        success: false,
        category: 'RESPOSTA_INVALIDA',
        message: result.mensagem || result.message || result.error || 'Erro reportado pelo Google Apps Script ao salvar.',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      category: 'FALHA_REDE',
      message: `Erro ao enviar leitura para o Google Apps Script: ${errorMsg}`,
    };
  }
}
