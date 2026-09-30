// Um marcador por data que realmente existe no dataset (nunca uma grade
// mensal/anual assumida).
import * as d3 from "d3";
import { formatDate } from "../../../shared/utils/format.js";

const VIEW_WIDTH = 900;
const HEIGHT = 56;
const MARGIN = { left: 20, right: 20 };
const AXIS_Y = 22;
const TARGET_LABEL_COUNT = 10;

function toDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

export function createTimeline(container, { onSelect } = {}) {
  const wrapper = d3.select(container).attr("class", "timeline");

  const controls = wrapper.append("div").attr("class", "timeline-controls");
  const prevBtn = controls.append("button").attr("class", "timeline-btn").text("‹ Anterior").attr("aria-label", "Data anterior");
  const currentDateLabel = controls.append("span").attr("class", "timeline-current-date");
  const nextBtn = controls.append("button").attr("class", "timeline-btn").text("Próximo ›").attr("aria-label", "Próxima data");

  const svg = wrapper
    .append("svg")
    .attr("class", "timeline-svg")
    .attr("viewBox", `0 0 ${VIEW_WIDTH} ${HEIGHT}`)
    .attr("role", "slider")
    .attr("aria-label", "Linha do tempo de observações do Big Mac Index");

  const axisLine = svg
    .append("line")
    .attr("class", "timeline-axis")
    .attr("x1", MARGIN.left)
    .attr("x2", VIEW_WIDTH - MARGIN.right)
    .attr("y1", AXIS_Y)
    .attr("y2", AXIS_Y);

  const labelsLayer = svg.append("g").attr("class", "timeline-year-labels");
  const pointsLayer = svg.append("g").attr("class", "timeline-points");
  const selectionMarker = svg
    .append("circle")
    .attr("class", "timeline-selection-marker")
    .attr("r", 8)
    .attr("cy", AXIS_Y);

  const xScale = d3.scalePoint().range([MARGIN.left, VIEW_WIDTH - MARGIN.right]).padding(0.5);

  let dates = [];
  let selectedIndex = -1;

  function selectIndex(index) {
    if (index < 0 || index >= dates.length || index === selectedIndex) return;
    selectedIndex = index;
    updateSelectionVisuals();
    onSelect?.(dates[selectedIndex]);
  }

  prevBtn.on("click", () => selectIndex(selectedIndex - 1));
  nextBtn.on("click", () => selectIndex(selectedIndex + 1));

  function updateSelectionVisuals() {
    const dateKey = dates[selectedIndex];
    currentDateLabel.text(formatDate(toDate(dateKey)));
    prevBtn.property("disabled", selectedIndex <= 0);
    nextBtn.property("disabled", selectedIndex >= dates.length - 1);

    pointsLayer.selectAll("circle.timeline-point").classed("is-selected", (d, i) => i === selectedIndex);
    selectionMarker
      .transition()
      .duration(300)
      .attr("cx", xScale(dateKey));
  }

  function render(dateKeys, initialDateKey) {
    dates = dateKeys;
    xScale.domain(dateKeys);
    selectedIndex = Math.max(0, dateKeys.indexOf(initialDateKey));

    pointsLayer
      .selectAll("circle.timeline-point")
      .data(dateKeys)
      .join("circle")
      .attr("class", "timeline-point")
      .attr("cx", (d) => xScale(d))
      .attr("cy", AXIS_Y)
      .attr("r", 5)
      .append("title")
      .text((d) => formatDate(toDate(d)));

    pointsLayer.selectAll("circle.timeline-point").on("click", (event, d) => selectIndex(dateKeys.indexOf(d)));

    // Reduz os rótulos de ano para não sobrepor (~TARGET_LABEL_COUNT no total).
    const stride = Math.max(1, Math.round(dateKeys.length / TARGET_LABEL_COUNT));
    const labeled = dateKeys.filter((_, i) => i % stride === 0);

    labelsLayer
      .selectAll("text")
      .data(labeled)
      .join("text")
      .attr("class", "timeline-year-label")
      .attr("x", (d) => xScale(d))
      .attr("y", AXIS_Y + 20)
      .attr("text-anchor", "middle")
      .text((d) => toDate(d).getFullYear());

    updateSelectionVisuals();
  }

  return { render, selectIndex };
}
