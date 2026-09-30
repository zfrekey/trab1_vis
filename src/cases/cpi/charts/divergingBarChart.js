import * as d3 from "d3";

export function createDivergingBarChart(container, data, {
  labelKey = "country",
  valueKey = "diff_vs_threshold",
  scoreKey = "score",
  formatValue = d3.format("+.0f"),
  baselineLabel = "ao corte de 50 pontos usado pela Transparency International",
  negLabel = "Abaixo do corte de 50",
  posLabel = "50 pontos ou mais",
  tooltip,
} = {}) {
  const rowH = 16;
  const margin = { top: 12, right: 46, bottom: 24, left: 130 };
  const width = 680;

  container.innerHTML = "";
  const wrapOuter = d3.select(container);

  const controls = wrapOuter.append("div").attr("class", "controls-row");
  controls.append("input")
    .attr("type", "search")
    .attr("class", "search-input")
    .attr("placeholder", "Filtrar país (ex.: Brazil, Denmark, Japan)...")
    .on("input", function () {
      render(this.value.trim().toLowerCase());
    });

  const countSpan = controls.append("span").attr("class", "hint");

  const scroll = wrapOuter
    .append("div")
    .attr("class", "chart-scroll-box")
    .style("max-height", "540px")
    .style("overflow-y", "auto")
    .style("border", "1px solid var(--color-border)")
    .style("border-radius", "8px")
    .style("background", "var(--color-surface)");

  const svg = scroll.append("svg").attr("class", "chart-svg");

  const ext = d3.extent(data, (d) => d[valueKey]);
  const maxAbs = Math.max(Math.abs(ext[0] || 0), Math.abs(ext[1] || 0), 10);
  const innerW = width - margin.left - margin.right;
  const x = d3.scaleLinear().domain([-maxAbs, maxAbs]).nice().range([0, innerW]);

  const negColor = "#2a78d6"; // azul - abaixo da linha de corte
  const posColor = "#e34948"; // vermelho/coral - íntegro (50+)
  const midColor = "#9e9d99";

  function render(filterText) {
    const rows = filterText
      ? data.filter((d) => d[labelKey].toLowerCase().includes(filterText))
      : data;

    countSpan.text(
      `${rows.length} de ${data.length} países • ordenado pela diferença em relação ${baselineLabel}`
    );

    const h = Math.max(rows.length * rowH, 30) + margin.top + margin.bottom;
    svg.attr("viewBox", `0 0 ${width} ${h}`).attr("width", "100%").attr("height", h);
    svg.selectAll("*").remove();

    if (rows.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-muted)")
        .text("Nenhum país encontrado com esse termo.");
      return;
    }

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const y = d3
      .scaleBand()
      .domain(rows.map((d) => d[labelKey]))
      .range([0, rows.length * rowH])
      .padding(0.18);

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisTop(x).ticks(5).tickSize(-rows.length * rowH).tickFormat(formatValue))
      .call((sel) => sel.selectAll("line").attr("stroke", "var(--color-border)").attr("stroke-dasharray", "2,2"))
      .call((sel) => sel.select(".domain").remove())
      .call((sel) => sel.selectAll("text").attr("fill", "var(--color-text-muted)").attr("font-size", 11));

    // Linha central do zero (corte 50)
    g.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 0)
      .attr("y2", rows.length * rowH)
      .attr("stroke", "var(--color-text)")
      .attr("stroke-width", 1.5);

    g.selectAll("rect.bar")
      .data(rows, (d) => d[labelKey])
      .join("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d[labelKey]))
      .attr("height", y.bandwidth())
      .attr("x", (d) => Math.min(x(0), x(d[valueKey])))
      .attr("width", (d) => Math.abs(x(d[valueKey]) - x(0)))
      .attr("rx", 2)
      .attr("fill", (d) => (d[valueKey] === 0 ? midColor : d[valueKey] > 0 ? posColor : negColor))
      .attr("opacity", 0.9)
      .on("mousemove", (event, d) => {
        const scoreVal = d[scoreKey] ?? (d[valueKey] + 50);
        tooltip?.show(
          event,
          `<strong>${d[labelKey]}</strong><br/>` +
          `Nota CPI: <strong>${scoreVal}</strong>/100<br/>` +
          `Diferença: <strong>${formatValue(d[valueKey])}</strong> pts em relação a 50`
        );
      })
      .on("mouseleave", () => tooltip?.hide());

    g.selectAll("text.label")
      .data(rows, (d) => d[labelKey])
      .join("text")
      .attr("class", "label")
      .attr("x", -6)
      .attr("y", (d) => y(d[labelKey]) + y.bandwidth() / 2)
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "var(--color-text)")
      .attr("font-size", 10.5)
      .text((d) => d[labelKey]);
  }

  render("");

  // Legenda
  const legendWrap = wrapOuter.append("div").attr("class", "legend");
  legendWrap.html(`
    <div class="legend-item"><span class="swatch" style="background:${negColor}"></span> ${negLabel}</div>
    <div class="legend-item"><span class="swatch" style="background:${posColor}"></span> ${posLabel}</div>
  `);
}
