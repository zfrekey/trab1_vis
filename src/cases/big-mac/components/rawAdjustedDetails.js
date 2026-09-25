// Conteúdo do tooltip/painel do Redesign 2 (raw x adjusted). Reaproveita
// as classes .info-* já definidas em case.css para o Redesign 1.
import { formatPercent, formatPercentagePoints, formatUsd } from "../../../shared/utils/format.js";

// Classificação derivada dos dados (nunca escrita à mão por país): compara
// o sinal de USD_raw com o de USD_adjusted.
export function classifyAdjustment(raw, adjusted) {
  const rawOvervalued = raw >= 0;
  const adjustedOvervalued = adjusted >= 0;
  if (rawOvervalued === adjustedOvervalued) {
    return rawOvervalued ? "Permanece sobrevalorizado" : "Permanece subvalorizado";
  }
  return adjustedOvervalued ? "Muda para sobrevalorizado após o ajuste" : "Muda para subvalorizado após o ajuste";
}

function indexClass(value) {
  if (value === null || value === undefined) return "";
  return value >= 0 ? "value-positive" : "value-negative";
}

export function renderRawAdjustedInfoHtml(record) {
  const { name, currency_code, dollar_price, USD_raw, USD_adjusted, adjustment_effect } = record;

  return `
    <div class="info-title">${name}</div>
    <div class="info-subtitle">${currency_code}</div>
    <dl class="info-grid">
      <dt>Índice bruto</dt><dd class="${indexClass(USD_raw)}">${formatPercent(USD_raw)}</dd>
      <dt>Índice ajustado</dt><dd class="${indexClass(USD_adjusted)}">${formatPercent(USD_adjusted)}</dd>
      <dt>Efeito do ajuste</dt><dd>${formatPercentagePoints(adjustment_effect)}</dd>
      <dt>Big Mac em dólar</dt><dd>${formatUsd(dollar_price)}</dd>
      <dt>Classificação</dt><dd>${classifyAdjustment(USD_raw, USD_adjusted)}</dd>
    </dl>
  `;
}

export function renderHistoryPointHtml(name, dateLabel, raw, adjusted) {
  return `
    <div class="info-title">${name}</div>
    <div class="info-subtitle">${dateLabel}</div>
    <dl class="info-grid">
      <dt>Bruto</dt><dd class="${indexClass(raw)}">${formatPercent(raw)}</dd>
      <dt>Ajustado</dt><dd class="${indexClass(adjusted)}">${formatPercent(adjusted)}</dd>
    </dl>
  `;
}
