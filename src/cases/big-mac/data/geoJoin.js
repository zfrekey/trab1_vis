// Associa geometria do mapa aos registros do Big Mac por ISO 3166-1 alpha-3
// (iso_a3), não pelo nome: o CSV usa nomes editoriais ("Britain", "UAE")
// que não batem com os do Natural Earth ("United Kingdom", "United Arab
// Emirates"), mas ambos concordam no código ISO.
//
// Exceção conhecida: "Euro area" (iso_a3 "EUZ") é um agregado sem polígono
// próprio — não encontra par aqui (esperado, não é erro) e mesmo assim
// aparece no ranking, que lista entidades e não desenha geometria.
export function buildRecordsByIso(rows) {
  return new Map(rows.map((row) => [row.iso_a3, row]));
}

// Cada feature recebe uma propriedade `record`: a linha correspondente do
// Big Mac, ou `null` quando o país não tem dado na data selecionada
// (renderizado com a hachura neutra de "sem dados" em vez de ser removido).
export function joinFeaturesWithRecords(features, recordsByIso) {
  return features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      record: recordsByIso.get(feature.properties.iso_a3) ?? null,
    },
  }));
}
