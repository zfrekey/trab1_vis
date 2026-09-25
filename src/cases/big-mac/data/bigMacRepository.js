// Todo o SQL do Big Mac Index fica aqui, separado do código de desenho.
import { registerLocalFile, query } from "./duckdb.js";

const CSV_VIRTUAL_NAME = "big_mac.csv";
const CSV_URL = `${import.meta.env.BASE_URL}big-mac/data/big-mac-full-index.csv`;

// Datas como string 'YYYY-MM-DD' (via strftime) em vez de DATE bruto, para
// ter uma chave estável e evitar ambiguidade na conversão Arrow -> JS.
const DATE_KEY_SQL = "strftime(date, '%Y-%m-%d')";

let initPromise = null;

// Idempotente: o CSV só é buscado e parseado uma vez, mesmo chamado por
// vários gráficos.
export function initBigMacData() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerLocalFile(CSV_VIRTUAL_NAME, CSV_URL);
      await query(`
        CREATE TABLE bigmac AS
        SELECT *
        FROM read_csv_auto('${CSV_VIRTUAL_NAME}')
        -- remove linhas sem índice ou código de país (não entram no
        -- ranking nem no join com o mapa)
        WHERE USD_raw IS NOT NULL AND iso_a3 IS NOT NULL;
      `);
    })();
  }
  return initPromise;
}

export async function getAvailableDates() {
  const rows = await query(`
    SELECT DISTINCT ${DATE_KEY_SQL} AS date_key
    FROM bigmac
    ORDER BY date;
  `);
  return rows.map((row) => row.date_key);
}

export async function getLatestDate() {
  const rows = await query(`
    SELECT ${DATE_KEY_SQL} AS date_key
    FROM bigmac
    ORDER BY date DESC
    LIMIT 1;
  `);
  return rows[0].date_key;
}

// RANK() calculado em SQL: mapa e ranking compartilham a mesma fonte de
// verdade para "quem é o #1".
export async function getSnapshot(dateKey) {
  return query(
    `
    SELECT
      iso_a3,
      currency_code,
      name,
      local_price,
      dollar_ex,
      dollar_price,
      USD_raw,
      USD_adjusted,
      RANK() OVER (ORDER BY USD_raw DESC) AS rank
    FROM bigmac
    WHERE ${DATE_KEY_SQL} = ?
    ORDER BY USD_raw DESC;
    `,
    [dateKey],
  );
}

// Top/bottom N a partir do snapshot já buscado (sem nova consulta): o
// RANK() de getSnapshot() já fez o trabalho pesado, aqui só fatiamos.
export function selectRanking(snapshot, n = 8) {
  return {
    overvalued: snapshot.slice(0, n),
    undervalued: snapshot.slice(-n).reverse(),
  };
}

// Maior magnitude entre USD_raw e USD_adjusted em TODO o histórico (não só
// a data atual), usada como domínio fixo do scatterplot do Redesign 2 —
// assim os eixos não precisam ser recalculados a cada troca de data.
export async function getRawAdjustedExtent() {
  const rows = await query(`
    SELECT
      MIN(LEAST(USD_raw, USD_adjusted)) AS min_value,
      MAX(GREATEST(USD_raw, USD_adjusted)) AS max_value
    FROM bigmac
    WHERE USD_raw IS NOT NULL AND USD_adjusted IS NOT NULL;
  `);
  const { min_value, max_value } = rows[0];
  return Math.max(Math.abs(min_value), Math.abs(max_value));
}

// Snapshot para o scatterplot bruto x ajustado: só países com os dois
// índices disponíveis, com o efeito do ajuste e a mudança de sinal já
// calculados em SQL (derivação de dados evidenciada no DuckDB).
export async function getRawAdjustedSnapshot(dateKey) {
  return query(
    `
    SELECT
      iso_a3,
      name,
      currency_code,
      dollar_price,
      USD_raw,
      USD_adjusted,
      USD_adjusted - USD_raw AS adjustment_effect,
      (USD_raw * USD_adjusted < 0) AS changed_sign
    FROM bigmac
    WHERE ${DATE_KEY_SQL} = ?
      AND USD_raw IS NOT NULL
      AND USD_adjusted IS NOT NULL
    ORDER BY iso_a3;
    `,
    [dateKey],
  );
}

// Histórico completo de um país, para desenhar a trajetória no espaço
// raw x adjusted.
export async function getCountryHistory(isoA3) {
  return query(
    `
    SELECT
      ${DATE_KEY_SQL} AS date_key,
      USD_raw,
      USD_adjusted
    FROM bigmac
    WHERE iso_a3 = ?
      AND USD_raw IS NOT NULL
      AND USD_adjusted IS NOT NULL
    ORDER BY date;
    `,
    [isoA3],
  );
}
