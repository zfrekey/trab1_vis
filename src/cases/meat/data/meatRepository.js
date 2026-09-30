import { registerLocalFile, query } from "../../../shared/data/duckdb.js";

const CSV_VIRTUAL_NAME = "meat_by_type.csv";
const CSV_URL = `${import.meta.env.BASE_URL}meat/data/meat-by-type.csv`;

export const MEAT_TYPES = [
  "Poultry",
  "Pig",
  "Beef and Buffalo",
  "Sheep and Goat",
  "Camel",
  "Horse",
  "Wild game",
];

export const MEAT_LABELS = {
  Poultry: "Aves",
  Pig: "Suína",
  "Beef and Buffalo": "Bovina e Bubalina",
  "Sheep and Goat": "Ovina e Caprina",
  Camel: "Camelo",
  Horse: "Cavalo",
  "Wild game": "Caça selvagem",
};

let initPromise = null;

export function initMeatData() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerLocalFile(CSV_VIRTUAL_NAME, CSV_URL);
      await query(`
        CREATE TABLE IF NOT EXISTS meat AS
        SELECT *
        FROM read_csv_auto('${CSV_VIRTUAL_NAME}', ALL_VARCHAR=FALSE);
      `);
    })();
  }
  return initPromise;
}

export const CASE3_BASE_SQL = `
SELECT CAST(Year AS INTEGER) AS year,
       CAST("Wild game" AS DOUBLE) AS "Wild game",
       CAST("Horse" AS DOUBLE) AS "Horse",
       CAST("Camel" AS DOUBLE) AS "Camel",
       CAST("Sheep and Goat" AS DOUBLE) AS "Sheep and Goat",
       CAST("Beef and Buffalo" AS DOUBLE) AS "Beef and Buffalo",
       CAST("Pig" AS DOUBLE) AS "Pig",
       CAST("Poultry" AS DOUBLE) AS "Poultry"
FROM meat
WHERE Entity = 'World'
ORDER BY Year;
`.trim();

export async function case3BaseData() {
  await initMeatData();
  return query(CASE3_BASE_SQL);
}

export async function case3DesignAData() {
  const rows = await case3BaseData();
  const base = rows[0];
  return rows.map((r) => {
    const out = { year: r.year };
    for (const type of MEAT_TYPES) {
      out[type] = base[type] ? (r[type] / base[type]) * 100 : null;
    }
    return out;
  });
}

export async function case3DesignBData() {
  return case3BaseData();
}
