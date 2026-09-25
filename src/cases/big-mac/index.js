import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./case.css";

import {
  initBigMacData,
  getAvailableDates,
  getLatestDate,
  getSnapshot,
  selectRanking,
} from "./data/bigMacRepository.js";
import { buildRecordsByIso, joinFeaturesWithRecords } from "./data/geoJoin.js";
import { createWorldMap, createDivergentColorScale } from "./charts/worldMap.js";
import { createRanking } from "./charts/ranking.js";
import { createTimeline } from "./charts/timeline.js";
import { createLegend } from "./components/legend.js";
import { createCountryDetailsPanel, renderCountryInfoHtml } from "./components/countryDetails.js";
import { createTooltip } from "../../shared/components/tooltip.js";
import { createAppState } from "./appState.js";
import { formatDate } from "../../shared/utils/format.js";

const WORLD_ATLAS_URL = `${import.meta.env.BASE_URL}big-mac/data/world-atlas-50m.json`;
const RANK_TOP_N = 8;
const TRANSITION_DURATION = 550;

const PAGE_MARKUP = `
  <div class="atlas">
    <header class="atlas-header">
      <p class="atlas-eyebrow">Global Currency Atlas</p>
      <h1 class="atlas-title">Onde o Big Mac sugere moedas mais sobrevalorizadas e subvalorizadas?</h1>
      <p class="atlas-intro">
        O Big Mac Index compara o preço de um mesmo produto entre países como
        uma forma simples de observar diferenças de poder de compra e
        valorização cambial.
      </p>
      <div class="atlas-date-badge">
        <span class="atlas-date-label">Data atual</span>
        <span class="atlas-date-value" data-role="current-date"></span>
      </div>
    </header>

    <div class="atlas-grid">
      <div class="atlas-map-pane" data-role="map-pane"></div>
      <aside class="atlas-ranking-pane">
        <div data-role="ranking-pane"></div>
        <div class="country-details" data-role="details-pane"></div>
      </aside>
    </div>

    <div class="atlas-legend-row" data-role="legend-pane"></div>
    <div class="atlas-timeline-pane" data-role="timeline-pane"></div>

    <footer class="atlas-footer">Fonte: The Economist — Big Mac Index.</footer>
  </div>
`;

export async function mountBigMacCase(root) {
  root.innerHTML = PAGE_MARKUP;

  const { getState, setState, subscribe } = createAppState();

  const mapPane = root.querySelector('[data-role="map-pane"]');
  const rankingPane = root.querySelector('[data-role="ranking-pane"]');
  const detailsPane = root.querySelector('[data-role="details-pane"]');
  const legendPane = root.querySelector('[data-role="legend-pane"]');
  const timelinePane = root.querySelector('[data-role="timeline-pane"]');
  const currentDateEl = root.querySelector('[data-role="current-date"]');

  const tooltip = createTooltip(document.body);
  const detailsPanel = createCountryDetailsPanel(detailsPane);
  const legend = createLegend(legendPane);

  // Clicar no país já selecionado (no mapa ou no ranking) desmarca a seleção.
  function toggleSelection(iso) {
    const current = getState().selectedCountry;
    setState({ selectedCountry: iso && iso !== current ? iso : null });
  }

  const worldMap = createWorldMap(mapPane, {
    onHover: (event, feature) => {
      const record = feature.properties.record;
      const displayName = record?.name ?? feature.properties.name;
      tooltip.show(event, renderCountryInfoHtml(displayName, record));
      setState({ hoveredCountry: feature.properties.iso_a3 });
    },
    onLeave: () => {
      tooltip.hide();
      setState({ hoveredCountry: null });
    },
    onClick: (feature) => toggleSelection(feature?.properties?.iso_a3 ?? null),
  });

  const ranking = createRanking(rankingPane, {
    onHover: (event, record) => {
      tooltip.show(event, renderCountryInfoHtml(record.name, record));
      setState({ hoveredCountry: record.iso_a3 });
    },
    onLeave: () => {
      tooltip.hide();
      setState({ hoveredCountry: null });
    },
    onClick: (record) => toggleSelection(record.iso_a3),
  });

  const timeline = createTimeline(timelinePane, {
    onSelect: (dateKey) => {
      setState({ selectedDate: dateKey });
      loadDate(dateKey, { animate: true });
    },
  });

  let recordsByIso = new Map();
  let features = [];

  function applyState(state) {
    worldMap.applyHighlight(state.hoveredCountry, state.selectedCountry);
    ranking.applyHighlight(state.hoveredCountry, state.selectedCountry);

    if (state.selectedCountry) {
      const record = recordsByIso.get(state.selectedCountry) ?? null;
      detailsPanel.show(record?.name ?? state.selectedCountry, record);
    } else {
      detailsPanel.clear();
    }
  }
  subscribe(applyState);

  async function loadDate(dateKey, { animate }) {
    const snapshot = await getSnapshot(dateKey);
    recordsByIso = buildRecordsByIso(snapshot);

    const maxAbs = d3.max(snapshot, (d) => Math.abs(d.USD_raw)) ?? 1;
    const colorScale = createDivergentColorScale(maxAbs);
    const joinedFeatures = joinFeaturesWithRecords(features, recordsByIso);
    const { overvalued, undervalued } = selectRanking(snapshot, RANK_TOP_N);

    const duration = animate ? TRANSITION_DURATION : 0;
    worldMap.update(joinedFeatures, colorScale, { duration });
    ranking.update(overvalued, undervalued, colorScale, maxAbs, { duration });
    legend.update(colorScale, maxAbs);
    currentDateEl.textContent = formatDate(new Date(`${dateKey}T00:00:00`));

    // Reaplica destaque/painel: os números do país selecionado mudaram de data.
    applyState(getState());
  }

  await initBigMacData();

  const [dates, latestDate, worldTopology] = await Promise.all([
    getAvailableDates(),
    getLatestDate(),
    d3.json(WORLD_ATLAS_URL),
  ]);

  // Topologia -> features GeoJSON; associação com os dados econômicos por
  // ISO alpha-3 acontece em data/geoJoin.js (inclui as exceções documentadas lá).
  features = topojson.feature(worldTopology, worldTopology.objects.countries).features;

  setState({ selectedDate: latestDate });
  timeline.render(dates, latestDate);
  await loadDate(latestDate, { animate: false });
}
