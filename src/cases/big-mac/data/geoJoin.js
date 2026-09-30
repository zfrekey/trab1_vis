export function buildRecordsByIso(rows) {
  return new Map(rows.map((row) => [row.iso_a3, row]));
}

export function joinFeaturesWithRecords(features, recordsByIso) {
  return features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      record: recordsByIso.get(feature.properties.iso_a3) ?? null,
    },
  }));
}
