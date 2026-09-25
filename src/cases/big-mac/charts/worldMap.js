import * as d3 from "d3";

export const NEGATIVE_COLOR = "#b5502e"; // subvalorizada
export const ZERO_COLOR = "#f3efe3"; // neutro
export const POSITIVE_COLOR = "#1f6f6b"; // sobrevalorizada
export const NO_DATA_COLOR = "#d7d2c6";
const NO_DATA_STROKE = "#b9b3a4";

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 420;

// Domínio simétrico [-maxAbs, 0, maxAbs]: mesma magnitude gera mesma
// saturação dos dois lados, e o 0 cai exatamente na cor neutra central.
export function createDivergentColorScale(maxAbs) {
  return d3
    .scaleDiverging(d3.interpolateRgbBasis([NEGATIVE_COLOR, ZERO_COLOR, POSITIVE_COLOR]))
    .domain([-maxAbs, 0, maxAbs])
    .clamp(true);
}

export function createWorldMap(container, { onHover, onLeave, onClick } = {}) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "world-map")
    .attr("viewBox", `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`)
    .attr("role", "img")
    .attr("aria-label", "Mapa mundial colorido pelo índice Big Mac");

  // País sem observação recebe hachura diagonal em vez de cor sólida, para
  // não ser confundido visualmente com "valor perto de zero".
  const defs = svg.append("defs");
  const pattern = defs
    .append("pattern")
    .attr("id", "no-data-pattern")
    .attr("width", 6)
    .attr("height", 6)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)");
  pattern.append("rect").attr("width", 6).attr("height", 6).attr("fill", NO_DATA_COLOR);
  pattern
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 6)
    .attr("stroke", NO_DATA_STROKE)
    .attr("stroke-width", 2);

  // Natural Earth: projeção pensada para mapas temáticos do mundo todo,
  // ao contrário da Mercator, que distorce muito a área em altas latitudes.
  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);

  // Clique no oceano/fundo limpa a seleção fixada.
  svg
    .append("rect")
    .attr("class", "map-background")
    .attr("width", VIEW_WIDTH)
    .attr("height", VIEW_HEIGHT)
    .attr("fill", "transparent")
    .on("click", () => onClick?.(null));

  const countriesLayer = svg.append("g").attr("class", "countries");
  let fitted = false;

  // Data join com chave iso_a3; a geometria não muda entre datas, então só
  // a cor é atualizada (com transição quando duration > 0).
  function update(features, colorScale, { duration = 0 } = {}) {
    if (!fitted) {
      projection.fitSize([VIEW_WIDTH, VIEW_HEIGHT], { type: "FeatureCollection", features });
      fitted = true;
    }

    const fillOf = (d) => (d.properties.record ? colorScale(d.properties.record.USD_raw) : "url(#no-data-pattern)");

    const selection = countriesLayer
      .selectAll("path.country")
      .data(features, (d) => d.properties.iso_a3)
      .join((enter) =>
        enter
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", fillOf),
      )
      .on("mousemove", function (event, d) {
        onHover?.(event, d);
      })
      .on("mouseleave", function (event, d) {
        onLeave?.(event, d);
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        onClick?.(d);
      });

    (duration > 0 ? selection.transition().duration(duration) : selection).attr("fill", fillOf);
  }

  function applyHighlight(hoveredIso, selectedIso) {
    countriesLayer
      .selectAll("path.country")
      .classed("is-hovered", (d) => d.properties.iso_a3 === hoveredIso)
      .classed("is-selected", (d) => d.properties.iso_a3 === selectedIso)
      .filter((d) => d.properties.iso_a3 === hoveredIso || d.properties.iso_a3 === selectedIso)
      .raise();
  }

  return { update, applyHighlight };
}
