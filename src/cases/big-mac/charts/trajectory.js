// Trajetória histórica do país selecionado, desenhada no mesmo plano
// raw x adjusted do scatterplot (reaproveita o grupo/escalas que ele expõe
// em vez de criar um SVG novo).
import * as d3 from "d3";

const REVEAL_DURATION = 900;

// Segmentos retos (curva linear), de propósito: uma curva suave como
// Catmull-Rom sugeriria valores entre observações que não existem no
// dataset — aqui a clareza analítica importa mais que a estética.
const line = d3.line();

export function createTrajectory(layer, xScale, yScale) {
  const path = layer.append("path").attr("class", "trajectory-path");
  const pointsGroup = layer.append("g").attr("class", "trajectory-points");

  line.x((d) => xScale(d.USD_raw)).y((d) => yScale(d.USD_adjusted));

  function show(historyRows, { onPointHover, onPointLeave } = {}) {
    path.interrupt();

    if (historyRows.length === 0) {
      hide();
      return;
    }

    path.attr("d", line(historyRows));
    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(REVEAL_DURATION)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

    pointsGroup
      .selectAll("circle.trajectory-point")
      .data(historyRows, (d) => d.date_key)
      .join("circle")
      .attr("class", "trajectory-point")
      .attr("r", 3)
      .attr("cx", (d) => xScale(d.USD_raw))
      .attr("cy", (d) => yScale(d.USD_adjusted))
      .on("mousemove", (event, d) => onPointHover?.(event, d))
      .on("mouseleave", (event, d) => onPointLeave?.(event, d));

    // Rótulo de data só nas pontas (primeira/última observação), senão
    // fica poluído com 40+ pontos.
    const endpoints = historyRows.length > 1 ? [historyRows[0], historyRows[historyRows.length - 1]] : historyRows;
    pointsGroup
      .selectAll("text.trajectory-date-label")
      .data(endpoints, (d) => d.date_key)
      .join("text")
      .attr("class", "trajectory-date-label")
      .attr("x", (d) => xScale(d.USD_raw) + 6)
      .attr("y", (d) => yScale(d.USD_adjusted) - 6)
      .text((d) => new Date(`${d.date_key}T00:00:00`).getFullYear());
  }

  function hide() {
    path.interrupt().attr("d", null);
    pointsGroup.selectAll("*").remove();
  }

  return { show, hide };
}
