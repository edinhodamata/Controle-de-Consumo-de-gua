export const APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * CONTROLE DE ÁGUA - BACKEND GOOGLE APPS SCRIPT
 * ============================================================================
 * Planilha Google: Controle de Água
 * Aba: Leituras
 * Colunas: DataHora | Leitura
 *
 * INSTRUÇÕES DE PUBLICAÇÃO:
 * 1. Crie uma nova Planilha Google com o nome "Controle de Água" (ou abra sua planilha existente).
 * 2. Acesse o menu: Extensões > Apps Script.
 * 3. Cole este código no arquivo Code.gs, substituindo qualquer código existente.
 * 4. Clique no ícone de salvar (ou Ctrl+S).
 * 5. Clique no botão azul "Implantar" (Deploy) no canto superior direito > "Nova implantação".
 * 6. Em "Selecionar tipo", clique na engrenagem e escolha "App da Web" (Web App).
 * 7. Preencha os campos:
 *    - Descrição: API Controle de Água
 *    - Executar como: "Eu" (seu endereço de email)
 *    - Quem pode acessar: "Qualquer pessoa" (Anyone) -> ESSENCIAL para permitir chamadas do frontend
 * 8. Clique em "Implantar" e conceda as permissões solicitadas pela sua conta Google.
 * 9. Copie a URL do App da Web gerada (termina em /exec) e cole nas configurações do aplicativo.
 * ============================================================================
 */

const SHEET_NAME = 'Leituras';
const HEADER_ROW = ['DataHora', 'Leitura'];

/**
 * Obtém ou inicializa a aba 'Leituras' na planilha ativa.
 * Garante que o cabeçalho exista e formata a visualização inicial.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER_ROW);
    sheet.setFrozenRows(1);

    // Formatação do cabeçalho
    const headerRange = sheet.getRange(1, 1, 1, 2);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0f2330');
    headerRange.setFontColor('#3fa9f5');

    // Larguras recomendadas
    sheet.setColumnWidth(1, 190);
    sheet.setColumnWidth(2, 140);
  } else {
    // Garante que a primeira linha tenha o cabeçalho correto
    const firstRowValues = sheet.getRange(1, 1, 1, 2).getValues()[0];
    if (firstRowValues[0] !== HEADER_ROW[0] || firstRowValues[1] !== HEADER_ROW[1]) {
      sheet.insertRowsBefore(1, 1);
      sheet.getRange(1, 1, 1, 2).setValues([HEADER_ROW]);
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

/**
 * Resposta padronizada em JSON com suporte a CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint GET
 * - acao=ping: Teste de conectividade com a API
 * - acao=listar / padrão: Retorna todas as leituras cadastradas
 */
function doGet(e) {
  try {
    const acao = (e && e.parameter && (e.parameter.acao || e.parameter.action)) || 'listar';

    if (acao === 'ping' || acao === 'test') {
      return createJsonResponse({
        sucesso: true,
        mensagem: "API Controle de Água funcionando.",
        versao: "1.0"
      });
    }

    const leituras = listarTodasLeituras();
    return createJsonResponse({
      sucesso: true,
      dados: leituras
    });
  } catch (error) {
    return createJsonResponse({
      sucesso: false,
      mensagem: "Falha ao processar requisição GET no Apps Script: " + error.message
    });
  }
}

/**
 * Endpoint POST
 * Adiciona uma leitura com validação, controle de concorrência e bloqueio de duplicidade.
 * Também suporta ação acao=ping via POST.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Aguarda lock por até 10 segundos para controle de concorrência
    const hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return createJsonResponse({
        sucesso: false,
        mensagem: 'Servidor ocupado processando outra requisição. Tente novamente em alguns instantes.',
      });
    }

    let payload = null;

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        // Tenta interpretar form-urlencoded caso o cliente envie como parâmetros
        payload = e.parameter;
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    if (!payload) {
      return createJsonResponse({
        sucesso: false,
        mensagem: 'Nenhum dado recebido no corpo da requisição.',
      });
    }

    // Suporte a ping via POST
    if (payload.acao === 'ping' || payload.action === 'ping') {
      return createJsonResponse({
        sucesso: true,
        mensagem: "API Controle de Água funcionando.",
        versao: "1.0"
      });
    }

    const dataHora = payload.dataHora || payload.DataHora || payload.data_hora;
    const leitura = payload.leitura !== undefined ? payload.leitura : payload.Leitura;

    // 1. Validação da Data/Hora
    if (!dataHora || typeof dataHora !== 'string' || dataHora.trim() === '') {
      return createJsonResponse({
        sucesso: false,
        mensagem: 'O campo DataHora é obrigatório e deve ser uma data válida.',
      });
    }

    const parsedDate = new Date(dataHora);
    if (isNaN(parsedDate.getTime())) {
      return createJsonResponse({
        sucesso: false,
        mensagem: 'A data e hora fornecidas são inválidas: ' + dataHora,
      });
    }

    // 2. Validação da Leitura (inteiro não-negativo)
    const numLeitura = Number(leitura);
    if (isNaN(numLeitura) || !Number.isInteger(numLeitura) || numLeitura < 0) {
      return createJsonResponse({
        sucesso: false,
        mensagem: 'O campo Leitura deve ser um número inteiro maior ou igual a zero (litros).',
      });
    }

    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    // 3. Verificação de Duplicidade de Data/Hora
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const newTimestamp = parsedDate.getTime();

      for (let i = 0; i < existingData.length; i++) {
        const rowDate = new Date(existingData[i][0]);
        if (!isNaN(rowDate.getTime()) && rowDate.getTime() === newTimestamp) {
          return createJsonResponse({
            sucesso: false,
            mensagem: 'Já existe uma leitura cadastrada exatamente para esta data e hora.',
          });
        }
      }
    }

    // Formata a data para salvar de forma padronizada
    const isoString = parsedDate.toISOString();

    // 4. Inserção do registro
    sheet.appendRow([isoString, numLeitura]);

    // 5. Ordenação cronológica da planilha pela coluna DataHora (Coluna 1)
    if (sheet.getLastRow() > 2) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).sort({ column: 1, ascending: true });
    }

    const todasLeituras = listarTodasLeituras();

    return createJsonResponse({
      sucesso: true,
      mensagem: 'Leitura cadastrada com sucesso!',
      dados: todasLeituras,
      leituraAdicionada: {
        dataHora: isoString,
        leitura: numLeitura,
      },
    });
  } catch (error) {
    return createJsonResponse({
      sucesso: false,
      mensagem: 'Erro interno ao salvar leitura: ' + error.message,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lê todas as leituras da planilha e retorna em ordem cronológica crescente.
 */
function listarTodasLeituras() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const leituras = [];

  for (let i = 0; i < rows.length; i++) {
    const rawDate = rows[i][0];
    const rawVal = rows[i][1];

    if (!rawDate && (rawVal === '' || rawVal === null)) continue;

    const parsedDate = new Date(rawDate);
    const numVal = parseInt(rawVal, 10);

    if (!isNaN(parsedDate.getTime()) && !isNaN(numVal)) {
      leituras.push({
        dataHora: parsedDate.toISOString(),
        leitura: numVal,
      });
    }
  }

  // Garante ordenação cronológica crescente
  leituras.sort(function (a, b) {
    return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
  });

  return leituras;
}

/**
 * Função utilitária no Apps Script para calcular intervalos de consumo
 */
function calcularConsumoIntervalos(leituras) {
  if (!leituras || leituras.length < 2) return [];

  const intervalos = [];
  for (let i = 1; i < leituras.length; i++) {
    const atual = leituras[i];
    const anterior = leituras[i - 1];

    const tAtual = new Date(atual.dataHora).getTime();
    const tAnterior = new Date(anterior.dataHora).getTime();
    const duracaoHoras = (tAtual - tAnterior) / (1000 * 60 * 60);
    const consumoLitros = atual.leitura - anterior.leitura;

    intervalos.push({
      indice: i,
      dataHoraInicio: anterior.dataHora,
      dataHoraFim: atual.dataHora,
      duracaoHoras: duracaoHoras,
      consumoLitros: consumoLitros,
      taxaLitrosPorHora: duracaoHoras > 0 ? consumoLitros / duracaoHoras : null,
      valido: duracaoHoras > 0 && consumoLitros >= 0,
    });
  }

  return intervalos;
}
`;
