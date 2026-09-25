import * as d3 from "d3";
import { formatPercent } from "../../../shared/utils/format.js";

const ROW_HEIGHT = 22;
const DIVIDER_HEIGHT = 30;
const MARGIN = { top: 12, right: 8, bottom: 12, left: 8 };
const VIEW_WIDTH = 380;
const DIVIDER_KEY = "__divider__";

export function createRanking(container, { onHover, onLeave, onClick } = {}) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "ranking-svg")
    .attr("role", "img")
    .attr("aria-label", "Ranking divergente de países pelo índice Big Mac");

  const zeroAxis = svg.append("line").attr("class", "zero-axis");
  const zeroLabel = svg.append("text").attr("class", "zero-axis-label").text("0");
  const rowsLayer = svg.append("g").attr("class", "ranking-rows");

  const xScale = d3.scaleLinear();

  // undervalued chega do mais negativo pro menos negativo; invertido aqui
  // para a lista ler de cima a baixo: mais valorizada -> zero -> menos valorizada.
  function update(overvalued, undervalued, colorScale, maxAbs, { duration = 0 } = {}) {
    const bottomRows = [...undervalued].reverse();
    const rows = [...overvalued, { [DIVIDER_KEY]: true }, ...bottomRows];

    const innerWidth = VIEW_WIDTH - MARGIN.left - MARGIN.right;
    xScale.domain([-maxAbs, maxAbs]).range([0, innerWidth]).clamp(true);
    const zeroX = MARGIN.left + xScale(0);

    const dividerIndex = overvalued.length;
    let cursor = MARGIN.top;
    const positioned = rows.map((row, i) => {
      const rowHeight = i === dividerIndex ? DIVIDER_HEIGHT : ROW_HEIGHT;
      const y = cursor + rowHeight / 2;
      cursor += rowHeight;
      return { row, y, isDivider: Boolean(row[DIVIDER_KEY]) };
    });
    const totalHeight = cursor + MARGIN.bottom;

    svg.attr("viewBox", `0 0 ${VIEW_WIDTH} ${totalHeight}`);
    zeroAxis
      .attr("x1", zeroX)
      .attr("x2", zeroX)
      .attr("y1", MARGIN.top - 4)
      .attr("y2", totalHeight - MARGIN.bottom + 4);
    zeroLabel.attr("x", zeroX).attr("y", MARGIN.top - 6);

    const groups = rowsLayer
      .selectAll("g.rank-row")
      .data(positioned, (d) => d.row.iso_a3 ?? DIVIDER_KEY)
      .join(
        (enter) => {
          const g = enter.append("g").attr("class", "rank-row");
          g.append("rect").attr("class", "rank-bar");
          g.append("text").attr("class", "rank-name");
          g.append("text").attr("class", "rank-value");
          return g;
        },
      )
      .classed("is-divider", (d) => d.isDivider)
      .on("mousemove", (event, d) => !d.isDivider && onHover?.(event, d.row))
      .on("mouseleave", (event, d) => !d.isDivider && onLeave?.(event, d.row))
      .on("click", (event, d) => {
        if (d.isDivider) return;
        event.stopPropagation();
        onClick?.(d.row);
      });

    const groupsT = duration > 0 ? groups.transition().duration(duration) : groups;
    groupsT.attr("transform", (d) => `translate(0, ${d.y})`);

    groups.each(function (d) {
      if (d.isDivider) {
        d3.select(this).selectAll("rect, text.rank-name, text.rank-value").attr("opacity", 0);
        return;
      }
      const record = d.row;
      const isPositive = record.USD_raw >= 0;
      const barX0 = zeroX;
      const barX1 = MARGIN.left + xScale(record.USD_raw);
      const x = Math.min(barX0, barX1);
      const w = Math.abs(barX1 - barX0);

      const sel = d3.select(this);
      const rect = sel.select("rect.rank-bar").attr("opacity", 1);
      const rectT = duration > 0 ? rect.transition().duration(duration) : rect;
      rectT
        .attr("x", x)
        .attr("width", Math.max(w, 1))
        .attr("height", ROW_HEIGHT * 0.55)
        .attr("y", -ROW_HEIGHT * 0.275)
        .attr("fill", colorScale(record.USD_raw));

      sel
        .select("text.rank-name")
        .attr("opacity", 1)
        .attr("text-anchor", isPositive ? "start" : "end")
        .attr("x", isPositive ? barX1 + 6 : barX1 - 6)
        .text(record.name);

      sel
        .select("text.rank-value")
        .attr("opacity", 1)
        .attr("text-anchor", isPositive ? "end" : "start")
        .attr("x", isPositive ? barX0 - 6 : barX0 + 6)
        .text(formatPercent(record.USD_raw));
    });
  }

  function applyHighlight(hoveredIso, selectedIso) {
    rowsLayer
      .selectAll("g.rank-row")
      .classed("is-hovered", (d) => !d.isDivider && d.row.iso_a3 === hoveredIso)
      .classed("is-selected", (d) => !d.isDivider && d.row.iso_a3 === selectedIso);
  }

  return { update, applyHighlight };
}
