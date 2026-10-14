// Mantém o caminho antigo enquanto direciona as consultas ao DuckDB compartilhado.
export {
  getDb,
  getConnection,
  query,
  registerLocalFile,
} from "../../../shared/data/duckdb.js";
