import { registerLocalFile, query } from "../../../shared/data/duckdb.js";

const CSV_VIRTUAL_NAME = "corruption_perceptions_index.csv";
const CSV_URL = `${import.meta.env.BASE_URL}cpi/data/corruption-perceptions-index.csv`;

export const CPI_THRESHOLD = 50;

let initPromise = null;

export function initCpiData() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerLocalFile(CSV_VIRTUAL_NAME, CSV_URL);
      await query(`
        CREATE TABLE IF NOT EXISTS cpi AS
        SELECT *
        FROM read_csv_auto('${CSV_VIRTUAL_NAME}', ALL_VARCHAR=FALSE);
      `);
    })();
  }
  return initPromise;
}

export const CASE2_DESIGN_A_SQL = `
SELECT Entity AS country,
       CAST("Corruption Perceptions Index" AS DOUBLE) AS score,
       CAST("Corruption Perceptions Index" AS DOUBLE) - ${CPI_THRESHOLD}.0 AS diff_vs_threshold
FROM cpi
WHERE Year = 2024 AND Code IS NOT NULL
ORDER BY diff_vs_threshold DESC;
`.trim();

export async function case2DesignAData() {
  await initCpiData();
  return query(CASE2_DESIGN_A_SQL);
}

export const CASE2_DESIGN_B_SQL = `
SELECT Entity AS country,
       CAST("Corruption Perceptions Index" AS DOUBLE) AS score,
       "World region according to OWID" AS region
FROM cpi
WHERE Year = 2024 AND Code IS NOT NULL
ORDER BY region, score;
`.trim();

export async function case2DesignBData() {
  await initCpiData();
  return query(CASE2_DESIGN_B_SQL);
}
