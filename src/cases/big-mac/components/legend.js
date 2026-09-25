// Legenda divergente do mapa: barra de gradiente + rótulos de texto, para
// a escala nunca depender só da cor.
import * as d3 from "d3";
import { formatPercent } from "../../../shared/utils/format.js";
import { NO_DATA_COLOR } from "../charts/worldMap.js";

const GRADIENT_STOPS = 12;

export function createLegend(container) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "legend-svg")
    .attr("viewBox", "0 0 320 54")
    .attr("preserveAspectRatio", "xMinYMid meet");

  const gradientId = "legend-gradient";
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  const barWidth = 220;
  const barX = 10;
  const barY = 8;

  svg
    .append("rect")
    .attr("x", barX)
    .attr("y", barY)
    .attr("width", barWidth)
    .attr("height", 12)
    .attr("rx", 3)
    .attr("fill", `url(#${gradientId})`)
    .attr("stroke", "var(--color-border)")
    .attr("stroke-width", 1);

  const tickGroup = svg.append("g").attr("class", "legend-ticks");

  const labelUnder = svg
    .append("text")
    .attr("class", "legend-caption legend-caption--sub")
    .attr("x", barX)
    .attr("y", barY + 34)
    .text("SUBVALORIZADA");

  svg
    .append("text")
    .attr("class", "legend-caption legend-caption--over")
    .attr("x", barX + barWidth)
    .attr("y", barY + 34)
    .attr("text-anchor", "end")
    .text("SOBREVALORIZADA");

  const noDataX = barX + barWidth + 26;
  svg
    .append("rect")
    .attr("x", noDataX)
    .attr("y", barY)
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 3)
    .attr("fill", NO_DATA_COLOR)
    .attr("stroke", "var(--color-border)")
    .attr("stroke-width", 1);

  svg
    .append("text")
    .attr("class", "legend-caption")
    .attr("x", noDataX + 18)
    .attr("y", barY + 11)
    .text("Sem dados");

  function update(colorScale, maxAbs) {
    gradient
      .selectAll("stop")
      .data(d3.range(GRADIENT_STOPS + 1).map((i) => {
        const t = i / GRADIENT_STOPS;
        return { offset: `${t * 100}%`, value: -maxAbs + t * 2 * maxAbs };
      }))
      .join("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => colorScale(d.value));

    const ticks = [-maxAbs, 0, maxAbs];
    tickGroup
      .selectAll("text")
      .data(ticks)
      .join("text")
      .attr("class", "legend-tick")
      .attr("x", (d, i) => barX + (i / (ticks.length - 1)) * barWidth)
      .attr("y", barY - 3)
      .attr("text-anchor", (d, i) => (i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"))
      .text((d) => formatPercent(d));
  }

  return { update };
}
