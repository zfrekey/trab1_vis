import * as d3 from "d3";
import { formatPercent, formatPrice, formatUsd, formatOrdinal } from "../../../shared/utils/format.js";

export function renderCountryInfoHtml(displayName, record) {
  if (!record) {
    return `
      <div class="info-title">${displayName}</div>
      <div class="info-empty">Sem dados do Big Mac Index nesta data.</div>
    `;
  }

  const { currency_code, local_price, dollar_price, USD_raw, USD_adjusted, rank } = record;

  return `
    <div class="info-title">${displayName}</div>
    <div class="info-subtitle">${currency_code}</div>
    <dl class="info-grid">
      <dt>Preço local</dt><dd>${formatPrice(local_price, currency_code)}</dd>
      <dt>Preço em dólar</dt><dd>${formatUsd(dollar_price)}</dd>
      <dt>Índice bruto</dt><dd class="${indexClass(USD_raw)}">${formatPercent(USD_raw)}</dd>
      <dt>Índice ajustado (PIB)</dt><dd class="${indexClass(USD_adjusted)}">${formatPercent(USD_adjusted)}</dd>
      <dt>Posição no ranking</dt><dd>${formatOrdinal(rank)}</dd>
    </dl>
  `;
}

function indexClass(value) {
  if (value === null || value === undefined) return "";
  return value >= 0 ? "value-positive" : "value-negative";
}

export function createCountryDetailsPanel(container) {
  const el = d3.select(container);

  function show(displayName, record) {
    el.html(renderCountryInfoHtml(displayName, record)).classed("is-visible", true);
  }

  function clear() {
    el.classed("is-visible", false);
  }

  return { show, clear };
}
