import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  /**
   * Helper function to validate Apps Script Web App URL structure
   */
  function validateScriptUrl(urlStr: unknown): { valid: boolean; cleanUrl: string; error?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, cleanUrl: '', error: 'URL do Google Apps Script não informada.' };
    }
    const cleanUrl = urlStr.trim();
    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      return {
        valid: false,
        cleanUrl,
        error: 'A URL deve iniciar com "https://script.google.com/macros/s/". Verifique o link copiado da implantação.',
      };
    }
    if (!cleanUrl.endsWith('/exec')) {
      return {
        valid: false,
        cleanUrl,
        error: 'A URL do Web App deve terminar com "/exec". Se você copiou a URL terminada em "/dev" ou "/edit", use a URL de implantação terminada em "/exec".',
      };
    }
    return { valid: true, cleanUrl };
  }

  /**
   * Helper to inspect response for Google login / authentication issues
   */
  function checkAuthenticationIssue(finalUrl: string, text: string): boolean {
    return (
      finalUrl.includes('accounts.google.com') ||
      finalUrl.includes('ServiceLogin') ||
      text.includes('accounts.google.com') ||
      text.includes('ServiceLogin') ||
      text.includes('Sign in - Google Accounts') ||
      text.includes('Fazer login nas Contas do Google')
    );
  }

  /**
   * POST /api/sheets/test
   * Rigorous test endpoint executed from backend (bypasses browser CORS & iframe limitations)
   * Follows all 12 validation requirements strictly.
   */
  app.post('/api/sheets/test', async (req, res) => {
    const { url } = req.body || {};
    const validation = validateScriptUrl(url);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        category: 'URL_INVALIDA',
        message: validation.error,
      });
    }

    // 1. Utilize a URL configurada pelo usuário (preservando-a)
    const scriptUrl = validation.cleanUrl;

    // 2. Acrescente o parâmetro acao=ping à URL
    const pingUrl = scriptUrl.includes('?') ? `${scriptUrl}&acao=ping` : `${scriptUrl}?acao=ping`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 3. Faça a requisição HTTP GET com acompanhamento de redirecionamento do Apps Script
      const response = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const finalUrl = response.url || '';

      // 4. Verifique o status HTTP (e leia o corpo antes)
      // 5. Leia o corpo da resposta como texto antes de tentar interpretar o JSON
      const text = await response.text();

      // Verificação de autenticação / login Google (redirecionamento 302 para login)
      if (checkAuthenticationIssue(finalUrl, text)) {
        return res.status(200).json({
          success: false,
          category: 'FALHA_AUTENTICACAO',
          httpStatus: response.status,
          message:
            'O Google redirecionou a requisição para a tela de login. A implantação do Apps Script NÃO está com acesso para "Qualquer pessoa" (Anyone). Abra o Apps Script, altere "Quem pode acessar" para "Qualquer pessoa", gere uma Nova Versão e tente novamente.',
        });
      }

      // 404 - URL não encontrada
      if (response.status === 404 || text.includes('Page Not Found') || text.includes('Não é possível acessar o arquivo')) {
        return res.status(200).json({
          success: false,
          category: 'URL_NAO_ENCONTRADA',
          httpStatus: 404,
          message:
            'A URL informada retornou HTTP 404 (Página não encontrada). O ID da implantação não existe ou o App da Web foi desativado/excluído no Google Apps Script.',
        });
      }

      // Verifique status HTTP diferente de 200 OK
      if (!response.ok) {
        return res.status(200).json({
          success: false,
          category: 'ERRO_HTTP',
          httpStatus: response.status,
          message: `O servidor do Google retornou erro HTTP ${response.status} (${response.statusText || 'Erro'}).`,
        });
      }

      // 6. Se o corpo estiver vazio, mostre um erro específico
      if (!text || text.trim() === '') {
        return res.status(200).json({
          success: false,
          category: 'CORPO_VAZIO',
          httpStatus: response.status,
          message:
            'O endpoint retornou uma resposta vazia do servidor (corpo vazio). Verifique se o Google Apps Script está ativo e implantado corretamente.',
        });
      }

      // 7. Se o conteúdo não for JSON válido, mostre uma mensagem informando que o endpoint retornou conteúdo incompatível
      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch (parseErr) {
        return res.status(200).json({
          success: false,
          category: 'CONTEUDO_INCOMPATIVEL',
          httpStatus: response.status,
          message:
            'O endpoint retornou conteúdo incompatível (não é um JSON válido). Verifique se a URL aponta para a implantação Web App (/exec) do Google Apps Script.',
          details: text.slice(0, 300),
        });
      }

      // 8. Se o JSON tiver sucesso=false, mostre a mensagem enviada pelo Apps Script
      const isExplicitFalse = parsedData.sucesso === false || parsedData.success === false;
      if (isExplicitFalse) {
        const errorMsg =
          parsedData.mensagem ||
          parsedData.message ||
          parsedData.error ||
          parsedData.erro ||
          'Falha reportada pelo Google Apps Script.';
        return res.status(200).json({
          success: false,
          category: 'RESPOSTA_INVALIDA',
          message: errorMsg,
          details: parsedData.versao ? `Versão da API: ${parsedData.versao}` : undefined,
        });
      }

      // 9. Considere a conexão validada somente quando receber JSON válido com sucesso=true
      // Não declare a integração resolvida apenas porque o status HTTP foi 200!
      const isSuccess = parsedData.sucesso === true || parsedData.success === true;
      if (!isSuccess) {
        return res.status(200).json({
          success: false,
          category: 'CONTEUDO_INCOMPATIVEL',
          message:
            'O endpoint respondeu com status HTTP 200, porém o JSON retornado não confirmou a chave "sucesso": true. Resposta incompatível recebida.',
          details: typeof parsedData === 'object' ? JSON.stringify(parsedData).slice(0, 200) : text.slice(0, 200),
        });
      }

      // Conexão validada com sucesso
      return res.status(200).json({
        success: true,
        message: parsedData.mensagem || parsedData.message || 'API Controle de Água funcionando.',
        versao: parsedData.versao || '1.0',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);

      return res.status(200).json({
        success: false,
        category: 'FALHA_REDE',
        message: isAbort
          ? 'Tempo limite de conexão esgotado (15s). O Google Apps Script demorou muito para responder.'
          : `Falha de rede ao conectar com o servidor do Google: ${errMsg}.`,
      });
    }
  });

  /**
   * POST /api/sheets/readings
   * Fetches all readings via server proxy (immune to browser CORS / preflight)
   * Supports Portuguese backend format: { "sucesso": true, "dados": [] }
   */
  app.post('/api/sheets/readings', async (req, res) => {
    const { url } = req.body || {};
    const validation = validateScriptUrl(url);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        category: 'URL_INVALIDA',
        message: validation.error,
        data: [],
      });
    }

    const scriptUrl = validation.cleanUrl;
    const fetchUrl = scriptUrl.includes('?') ? `${scriptUrl}&acao=listar` : `${scriptUrl}?acao=listar`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const finalUrl = response.url || '';
      const text = await response.text();

      if (checkAuthenticationIssue(finalUrl, text)) {
        return res.status(200).json({
          success: false,
          category: 'FALHA_AUTENTICACAO',
          message:
            'Acesso não autorizado pelo Google. A implantação do Apps Script precisa estar configurada como "Quem pode acessar: Qualquer pessoa" (Anyone).',
          data: [],
        });
      }

      if (!response.ok) {
        return res.status(200).json({
          success: false,
          category: 'ERRO_HTTP',
          httpStatus: response.status,
          message: `Erro HTTP ${response.status} ao consultar planilha Google.`,
          data: [],
        });
      }

      if (!text || text.trim() === '') {
        return res.status(200).json({
          success: false,
          category: 'CORPO_VAZIO',
          message: 'O endpoint de leitura retornou uma resposta vazia do servidor.',
          data: [],
        });
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch {
        return res.status(200).json({
          success: false,
          category: 'CONTEUDO_INCOMPATIVEL',
          message: 'A resposta da planilha Google não pôde ser interpretada como JSON válido.',
          data: [],
        });
      }

      const isSuccess = parsedData.sucesso === true || parsedData.success === true;
      if (!isSuccess) {
        const errorMsg =
          parsedData.mensagem ||
          parsedData.message ||
          parsedData.error ||
          parsedData.erro ||
          'Falha ao recuperar leituras da planilha Google.';
        return res.status(200).json({
          success: false,
          category: 'RESPOSTA_INVALIDA',
          message: errorMsg,
          data: [],
        });
      }

      // Suporta { sucesso: true, dados: [] } ou { success: true, data: [] }
      const rawList = parsedData.dados !== undefined ? parsedData.dados : parsedData.data;
      const listArray = Array.isArray(rawList) ? rawList : [];

      const normalized = listArray
        .map((item: any) => {
          const dt = item.dataHora || item.DataHora || item.data_hora || item.timestamp || '';
          const val = item.leitura !== undefined ? item.leitura : (item.Leitura !== undefined ? item.Leitura : item.valor);
          return {
            dataHora: String(dt),
            leitura: Math.round(Number(val) || 0),
          };
        })
        .filter((item: any) => item.dataHora && !isNaN(new Date(item.dataHora).getTime()));

      return res.status(200).json({
        success: true,
        data: normalized,
        total: normalized.length,
        message: parsedData.mensagem || parsedData.message,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(200).json({
        success: false,
        category: 'FALHA_REDE',
        message: `Falha de rede ao consultar o Google Apps Script: ${errMsg}`,
        data: [],
      });
    }
  });

  /**
   * POST /api/sheets/add
   * Adds a new reading to Google Sheets via server proxy
   * Supports Portuguese backend format: { "sucesso": true, "mensagem": "..." }
   */
  app.post('/api/sheets/add', async (req, res) => {
    const { url, reading } = req.body || {};
    const validation = validateScriptUrl(url);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        category: 'URL_INVALIDA',
        message: validation.error,
      });
    }

    if (!reading || !reading.dataHora || reading.leitura === undefined) {
      return res.status(400).json({
        success: false,
        category: 'RESPOSTA_INVALIDA',
        message: 'Dados da leitura incompletos (dataHora e leitura são obrigatórios).',
      });
    }

    const scriptUrl = validation.cleanUrl;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          dataHora: reading.dataHora,
          leitura: Number(reading.leitura),
        }),
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const finalUrl = response.url || '';
      const text = await response.text();

      if (checkAuthenticationIssue(finalUrl, text)) {
        return res.status(200).json({
          success: false,
          category: 'FALHA_AUTENTICACAO',
          message:
            'Acesso negado pelo Google. Configure a implantação como "Quem pode acessar: Qualquer pessoa" para permitir a gravação de leituras.',
        });
      }

      if (!response.ok) {
        return res.status(200).json({
          success: false,
          category: 'ERRO_HTTP',
          httpStatus: response.status,
          message: `Erro HTTP ${response.status} ao gravar leitura na planilha.`,
        });
      }

      if (!text || text.trim() === '') {
        return res.status(200).json({
          success: false,
          category: 'CORPO_VAZIO',
          message: 'O servidor retornou uma resposta vazia ao tentar gravar a leitura.',
        });
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch {
        return res.status(200).json({
          success: false,
          category: 'CONTEUDO_INCOMPATIVEL',
          message: 'O servidor respondeu com formato inválido (não-JSON) ao salvar leitura.',
        });
      }

      const isSuccess = parsedData.sucesso === true || parsedData.success === true;
      if (isSuccess) {
        const rawList = parsedData.dados !== undefined ? parsedData.dados : parsedData.data;
        let normalizedList: any[] | undefined = undefined;
        if (Array.isArray(rawList)) {
          normalizedList = rawList.map((item: any) => ({
            dataHora: String(item.dataHora || item.DataHora || item.data_hora || ''),
            leitura: Math.round(Number(item.leitura !== undefined ? item.leitura : item.Leitura) || 0),
          }));
        }

        return res.status(200).json({
          success: true,
          message: parsedData.mensagem || parsedData.message || 'Leitura gravada com sucesso na planilha Google!',
          data: normalizedList,
          leituraAdicionada: parsedData.leituraAdicionada,
        });
      } else {
        const errorMsg =
          parsedData.mensagem ||
          parsedData.message ||
          parsedData.error ||
          parsedData.erro ||
          'Erro ao registrar leitura na planilha Google.';
        return res.status(200).json({
          success: false,
          category: 'RESPOSTA_INVALIDA',
          message: errorMsg,
        });
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(200).json({
        success: false,
        category: 'FALHA_REDE',
        message: `Falha de rede ao salvar leitura no Google Apps Script: ${errMsg}`,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Controle de Água backend + Vite running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
