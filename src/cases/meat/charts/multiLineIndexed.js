import * as d3 from "d3";
import { MEAT_LABELS } from "../data/meatRepository.js";

const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#7c4dff"];

export function createMultiLineIndexed(container, data, {
  xKey = "year",
  seriesKeys,
  tooltip,
} = {}) {
  container.innerHTML = "";
  const wrapOuter = d3.select(container);

  const width = 740;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 36, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = wrapOuter
    .append("svg")
    .attr("class", "chart-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain(d3.extent(data, (d) => d[xKey])).range([0, innerW]);

  const allVals = data.flatMap((d) => seriesKeys.map((k) => d[k]).filter((v) => v != null));
  const y = d3.scaleLinear().domain([0, d3.max(allVals)]).nice().range([innerH, 0]);

  // Eixo X
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")))
    .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 11));

  // Eixo Y
  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW))
    .call((sel) => sel.selectAll("line").attr("stroke", "var(--color-border)").attr("stroke-dasharray", "2,2"))
    .call((sel) => sel.select(".domain").remove())
    .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 11));

  // Linha de base no índice 100
  g.append("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", y(100))
    .attr("y2", y(100))
    .attr("stroke", "var(--color-text)")
    .attr("stroke-dasharray", "4,3")
    .attr("stroke-width", 1.2);

  g.append("text")
    .attr("x", innerW - 6)
    .attr("y", y(100) - 6)
    .attr("text-anchor", "end")
    .attr("fill", "var(--color-text-muted)")
    .attr("font-size", 10.5)
    .attr("font-weight", 600)
    .text("Base 1961 = 100");

  const colorScale = d3.scaleOrdinal().domain(seriesKeys).range(PALETTE);
  const line = d3.line().defined((d) => d.v != null).x((d) => x(d[xKey])).y((d) => y(d.v));

  seriesKeys.forEach((key) => {
    const color = colorScale(key);
    const series = data.map((d) => ({ [xKey]: d[xKey], v: d[key] }));
    g.append("path")
      .datum(series)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", key === "Poultry" || key === "Horse" ? 2.8 : 2.0)
      .attr("d", line);
  });

  // Crosshair e overlay de interação
  const focusLine = g.append("line")
    .attr("stroke", "var(--color-text)")
    .attr("stroke-dasharray", "2,2")
    .attr("y1", 0)
    .attr("y2", innerH)
    .style("opacity", 0)
    .style("pointer-events", "none");

  const bisect = d3.bisector((d) => d[xKey]).left;
  const overlay = g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .style("cursor", "crosshair");

  overlay.on("mousemove", (event) => {
    const [mx] = d3.pointer(event);
    const x0 = x.invert(mx);
    const i = bisect(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];
    const d = !d0 ? d1 : !d1 ? d0 : x0 - d0[xKey] > d1[xKey] - x0 ? d1 : d0;

    focusLine.attr("x1", x(d[xKey])).attr("x2", x(d[xKey])).style("opacity", 1);

    const rowsHtml = seriesKeys
      .map((k) => {
        const val = d[k] != null ? d[k].toFixed(0) : "-";
        const label = MEAT_LABELS[k] || k;
        return `<span style="color:${colorScale(k)}">●</span> ${label}: <strong>${val}</strong>`;
      })
      .join("<br/>");

    tooltip?.show(event, `<strong>Ano: ${d[xKey]}</strong> (1961 = 100)<br/>${rowsHtml}`);
  }).on("mouseleave", () => {
    focusLine.style("opacity", 0);
    tooltip?.hide();
  });

  // Legenda
  const legendWrap = wrapOuter.append("div").attr("class", "legend");
  seriesKeys.forEach((key) => {
    const label = MEAT_LABELS[key] || key;
    const color = colorScale(key);
    legendWrap.append("div").attr("class", "legend-item").html(
      `<span class="swatch" style="background:${color}"></span> ${label}`
    );
  });
}
