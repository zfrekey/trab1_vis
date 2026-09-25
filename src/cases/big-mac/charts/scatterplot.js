// Scatterplot bruto x ajustado: cada país é um ponto, posição é o único
// canal que carrega dado (sem tamanho variável). Eixos e domínio são fixos
// (definidos uma vez via setDomain), só a posição dos pontos muda por data.
import * as d3 from "d3";
import { formatPercent } from "../../../shared/utils/format.js";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 590;
const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 };
const INNER_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;
const POINT_RADIUS = 5;
const POINT_RADIUS_HOVER = 7;

export function createScatterplot(container, { onHover, onLeave, onClick } = {}) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "scatter-svg")
    .attr("viewBox", `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`)
    .attr("role", "img")
    .attr("aria-label", "Dispersão do índice bruto contra o índice ajustado do Big Mac Index");

  svg
    .append("rect")
    .attr("class", "scatter-background")
    .attr("width", VIEW_WIDTH)
    .attr("height", VIEW_HEIGHT)
    .attr("fill", "transparent")
    .on("click", () => onClick?.(null));

  const plot = svg.append("g").attr("class", "scatter-plot").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  // Eixos lineares com o MESMO domínio simétrico (definido em setDomain),
  // para que a diagonal raw = adjusted seja lida de forma consistente.
  const xScale = d3.scaleLinear().range([0, INNER_WIDTH]);
  const yScale = d3.scaleLinear().range([INNER_HEIGHT, 0]);

  const xAxisGroup = plot.append("g").attr("class", "scatter-axis scatter-axis--x").attr("transform", `translate(0,${INNER_HEIGHT})`);
  const yAxisGroup = plot.append("g").attr("class", "scatter-axis scatter-axis--y");

  plot
    .append("text")
    .attr("class", "scatter-axis-label")
    .attr("x", INNER_WIDTH / 2)
    .attr("y", INNER_HEIGHT + 40)
    .attr("text-anchor", "middle")
    .text("Índice bruto (USD_raw)");

  plot
    .append("text")
    .attr("class", "scatter-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -INNER_HEIGHT / 2)
    .attr("y", -44)
    .attr("text-anchor", "middle")
    .text("Índice ajustado (USD_adjusted)");

  const referenceLayer = plot.append("g").attr("class", "scatter-reference");
  const trajectoryLayer = plot.append("g").attr("class", "scatter-trajectory");
  const pointsLayer = plot.append("g").attr("class", "scatter-points");

  function setDomain(maxAbs) {
    xScale.domain([-maxAbs, maxAbs]);
    yScale.domain([-maxAbs, maxAbs]);
    xAxisGroup.call(d3.axisBottom(xScale).ticks(6).tickFormat(formatPercent));
    yAxisGroup.call(d3.axisLeft(yScale).ticks(6).tickFormat(formatPercent));

    // x=0 e y=0 dividem o plano nos quatro quadrantes analíticos.
    referenceLayer
      .append("line")
      .attr("class", "scatter-zero-line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", INNER_HEIGHT);

    referenceLayer
      .append("line")
      .attr("class", "scatter-zero-line")
      .attr("x1", 0)
      .attr("x2", INNER_WIDTH)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0));

    // Diagonal raw = adjusted: pontos sobre ela não mudam de leitura após o
    // ajuste. Tracejada e discreta, distinta das linhas zero (sólidas).
    referenceLayer
      .append("line")
      .attr("class", "scatter-diagonal")
      .attr("x1", xScale(-maxAbs))
      .attr("y1", yScale(-maxAbs))
      .attr("x2", xScale(maxAbs))
      .attr("y2", yScale(maxAbs));

    referenceLayer
      .append("text")
      .attr("class", "scatter-diagonal-label")
      .attr("x", xScale(maxAbs) - 6)
      .attr("y", yScale(maxAbs) + 14)
      .attr("text-anchor", "end")
      .text("raw = adjusted");

    const labelPad = 10;
    const quadrants = [
      { text: "I", x: INNER_WIDTH - labelPad, y: labelPad + 8, anchor: "end" },
      { text: "II", x: labelPad, y: labelPad + 8, anchor: "start" },
      { text: "III", x: labelPad, y: INNER_HEIGHT - labelPad, anchor: "start" },
      { text: "IV", x: INNER_WIDTH - labelPad, y: INNER_HEIGHT - labelPad, anchor: "end" },
    ];
    referenceLayer
      .selectAll("text.scatter-quadrant-label")
      .data(quadrants)
      .join("text")
      .attr("class", "scatter-quadrant-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", (d) => d.anchor)
      .text((d) => d.text);
  }

  let signFilterActive = false;

  function setSignFilter(active) {
    signFilterActive = active;
    pointsLayer.classed("filter-changed-sign", signFilterActive);
  }

  // Data join por iso_a3: a cada troca de data os círculos se movem para a
  // nova posição (transition), nunca são recriados.
  function update(rows, { duration = 0 } = {}) {
    const selection = pointsLayer
      .selectAll("circle.point")
      .data(rows, (d) => d.iso_a3)
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", "point")
          .attr("r", POINT_RADIUS)
          .attr("cx", (d) => xScale(d.USD_raw))
          .attr("cy", (d) => yScale(d.USD_adjusted)),
      )
      .classed("changed-sign", (d) => d.changed_sign)
      .on("mousemove", (event, d) => onHover?.(event, d))
      .on("mouseleave", (event, d) => onLeave?.(event, d))
      .on("click", (event, d) => {
        event.stopPropagation();
        onClick?.(d);
      });

    (duration > 0 ? selection.transition().duration(duration) : selection)
      .attr("cx", (d) => xScale(d.USD_raw))
      .attr("cy", (d) => yScale(d.USD_adjusted));
  }

  // "has-focus" dimming os demais pontos quando há hover OU seleção — o
  // ponto em foco fica destacado, o resto perde opacidade (não muda de cor).
  function applyHighlight(hoveredIso, selectedIso) {
    pointsLayer.classed("has-focus", Boolean(hoveredIso || selectedIso));
    pointsLayer
      .selectAll("circle.point")
      .classed("is-hovered", (d) => d.iso_a3 === hoveredIso)
      .classed("is-selected", (d) => d.iso_a3 === selectedIso)
      .attr("r", (d) => (d.iso_a3 === hoveredIso || d.iso_a3 === selectedIso ? POINT_RADIUS_HOVER : POINT_RADIUS))
      .filter((d) => d.iso_a3 === hoveredIso || d.iso_a3 === selectedIso)
      .raise();
  }

  return { setDomain, update, applyHighlight, setSignFilter, xScale, yScale, trajectoryLayer };
}
