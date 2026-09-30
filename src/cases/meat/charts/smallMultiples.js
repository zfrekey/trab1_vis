import * as d3 from "d3";
import { MEAT_LABELS } from "../data/meatRepository.js";

const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#7c4dff"];

export function createSmallMultiples(container, data, {
  xKey = "year",
  seriesKeys,
  tooltip,
} = {}) {
  container.innerHTML = "";
  const wrapOuter = d3.select(container);

  const grid = wrapOuter.append("div").attr("class", "small-multiples-grid");
  const colorScale = d3.scaleOrdinal().domain(seriesKeys).range(PALETTE);

  seriesKeys.forEach((key) => {
    const label = MEAT_LABELS[key] || key;
    const facet = grid.append("div").attr("class", "facet-card");
    const facetHeader = facet.append("div").attr("class", "facet-header");
    facetHeader.append("h4").text(label);

    const rows = data.filter((d) => d[key] != null);
    const maxVal = d3.max(rows, (d) => d[key]) || 1;
    facetHeader.append("span").attr("class", "facet-peak").text(`Pico: ${d3.format(".2s")(maxVal)}t`);

    const facetDiv = facet.append("div").attr("class", "facet-chart-container").node();

    const width = 250;
    const height = 135;
    const margin = { top: 8, right: 12, bottom: 22, left: 45 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(facetDiv)
      .append("svg")
      .attr("class", "chart-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(rows, (d) => d[xKey])).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, maxVal]).nice().range([innerH, 0]);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")))
      .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 9));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(3, "~s"))
      .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 9));

    const color = colorScale(key);
    const line = d3.line().x((d) => x(d[xKey])).y((d) => y(d[key]));

    g.append("path")
      .datum(rows)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.2)
      .attr("d", line);

    const overlay = g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const bisect = d3.bisector((d) => d[xKey]).left;
    overlay.on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const x0 = x.invert(mx);
      const i = bisect(rows, x0, 1);
      const d = rows[i] ?? rows[rows.length - 1];
      if (d) {
        tooltip?.show(
          event,
          `<strong>${label}</strong> (${d[xKey]})<br/>Produção: <strong>${d3.format(",.0f")(d[key])}</strong> toneladas`
        );
      }
    }).on("mouseleave", () => tooltip?.hide());
  });
}
