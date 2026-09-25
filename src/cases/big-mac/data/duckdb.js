// Instância única do DuckDB-WASM: toda a app reaproveita UMA AsyncDuckDB +
// UMA conexão em vez de recriar a cada consulta.
import * as duckdb from "@duckdb/duckdb-wasm";

// `?url` faz o Vite copiar wasm/worker para o build e devolver uma URL local
// (bundles "self-hosted", sem depender de CDN em runtime).
import duckdbWasmMvp from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerMvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbWasmEh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbWorkerEh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const MANUAL_BUNDLES = {
  mvp: { mainModule: duckdbWasmMvp, mainWorker: duckdbWorkerMvp },
  eh: { mainModule: duckdbWasmEh, mainWorker: duckdbWorkerEh },
};

let dbPromise = null;
let connectionPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      return db;
    })();
  }
  return dbPromise;
}

export function getConnection() {
  if (!connectionPromise) {
    connectionPromise = getDb().then((db) => db.connect());
  }
  return connectionPromise;
}

// O resultado vem como tabela Arrow; toArray()+toJSON() converte cada
// linha em objeto simples para o resto do código não lidar com Arrow.
export async function query(sql, params = []) {
  const conn = await getConnection();
  const result =
    params.length > 0
      ? await (await conn.prepare(sql)).query(...params)
      : await conn.query(sql);
  return result.toArray().map((row) => row.toJSON());
}

// Registra um arquivo no filesystem virtual do DuckDB-WASM para ser lido
// via SQL com read_csv_auto(nome, ...).
export async function registerLocalFile(virtualName, url) {
  const db = await getDb();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  await db.registerFileBuffer(virtualName, buffer);
}
