import * as d3 from "d3";

export function createStripPlot(container, data, {
  xKey = "score",
  groupKey = "region",
  labelKey = "country",
  threshold = 50,
  tooltip,
} = {}) {
  container.innerHTML = "";
  const wrapOuter = d3.select(container);

  const groups = [...new Set(data.map((d) => d[groupKey]))].sort((a, b) => {
    const avg = (reg) => d3.mean(data.filter((d) => d[groupKey] === reg), (d) => d[xKey]);
    return avg(b) - avg(a);
  });

  const rowH = 68;
  const margin = { top: 16, right: 30, bottom: 36, left: 160 };
  const width = 720;
  const height = groups.length * rowH + margin.top + margin.bottom;
  const innerW = width - margin.left - margin.right;

  const svg = wrapOuter
    .append("svg")
    .attr("class", "chart-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 100]).range([0, innerW]);
  const y = d3.scaleBand().domain(groups).range([0, groups.length * rowH]).paddingInner(0.2);

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisTop(x).ticks(5))
    .call((sel) => sel.selectAll("line").attr("stroke", "var(--color-border)").attr("stroke-dasharray", "2,2").attr("y2", groups.length * rowH))
    .call((sel) => sel.select(".domain").remove())
    .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 11));

  g.selectAll("rect.band")
    .data(groups)
    .join("rect")
    .attr("class", "band")
    .attr("x", 0)
    .attr("y", (d) => y(d))
    .attr("width", innerW)
    .attr("height", y.bandwidth())
    .attr("fill", (d, i) => (i % 2 === 0 ? "rgba(0, 0, 0, 0.02)" : "transparent"))
    .attr("rx", 4);

  g.selectAll("text.group")
    .data(groups)
    .join("text")
    .attr("class", "group")
    .attr("x", -12)
    .attr("y", (d) => y(d) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .attr("fill", "var(--color-text)")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .text((d) => d);

  if (threshold != null) {
    g.append("line")
      .attr("x1", x(threshold))
      .attr("x2", x(threshold))
      .attr("y1", 0)
      .attr("y2", groups.length * rowH)
      .attr("stroke", "var(--color-text)")
      .attr("stroke-dasharray", "5,4")
      .attr("stroke-width", 1.5);

    g.append("text")
      .attr("x", x(threshold))
      .attr("y", groups.length * rowH + 18)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--color-text-muted)")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .text(`Corte editorial: ${threshold} pontos`);
  }

  const belowColor = "#2a78d6";
  const aboveColor = "#e34948";

  const rnd = d3.randomLcg(42);
  const jitter = d3.randomUniform.source(rnd)(-1, 1);

  g.selectAll("circle.point")
    .data(data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", (d) => x(d[xKey]))
    .attr("cy", (d) => y(d[groupKey]) + y.bandwidth() / 2 + jitter() * (y.bandwidth() / 2 - 9))
    .attr("r", 5)
    .attr("fill", (d) => (d[xKey] < threshold ? belowColor : aboveColor))
    .attr("fill-opacity", 0.72)
    .attr("stroke", (d) => (d[xKey] < threshold ? "#1d5bb3" : "#bd2d2c"))
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      tooltip?.show(
        event,
        `<strong>${d[labelKey]}</strong><br/>` +
        `Região: ${d[groupKey]}<br/>` +
        `Pontuação CPI 2024: <strong>${d[xKey]}</strong>/100<br/>` +
        `<small>${d[xKey] >= threshold ? "Acima/no corte de 50" : "Abaixo do corte de 50"}</small>`
      );
    })
    .on("mouseleave", () => tooltip?.hide());

  const legendWrap = wrapOuter.append("div").attr("class", "legend");
  legendWrap.html(`
    <div class="legend-item"><span class="swatch" style="background:${belowColor}"></span> Abaixo de ${threshold} pontos</div>
    <div class="legend-item"><span class="swatch" style="background:${aboveColor}"></span> ${threshold} pontos ou mais</div>
  `);
}
