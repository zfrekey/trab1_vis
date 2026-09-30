// Re-exporta a instância compartilhada do DuckDB para retrocompatibilidade
export {
  getDb,
  getConnection,
  query,
  registerLocalFile,
} from "../../../shared/data/duckdb.js";
