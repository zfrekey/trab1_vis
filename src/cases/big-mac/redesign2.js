import "./case.css";

import {
  initBigMacData,
  getAvailableDates,
  getLatestDate,
  getRawAdjustedExtent,
  getRawAdjustedSnapshot,
  getCountryHistory,
  selectRanking,
} from "./data/bigMacRepository.js";
import { buildRecordsByIso } from "./data/geoJoin.js";
import { createScatterplot } from "./charts/scatterplot.js";
import { createTrajectory } from "./charts/trajectory.js";
import { createTimeline } from "./charts/timeline.js";
import { createRanking } from "./charts/ranking.js";
import { createDivergentColorScale } from "./charts/worldMap.js";
import { createTooltip } from "../../shared/components/tooltip.js";
import { createAppState } from "./appState.js";
import { formatDate } from "../../shared/utils/format.js";
import { renderRawAdjustedInfoHtml, renderHistoryPointHtml } from "./components/rawAdjustedDetails.js";

const TRANSITION_DURATION = 650;
const RANK_TOP_N = 8;

const PAGE_MARKUP = `
  <div class="raw-adjusted">
    <div class="atlas-grid">
      <div class="atlas-map-pane" data-role="scatter-pane"></div>
      <aside class="atlas-ranking-pane">
        <div class="scatter-filter">
          <button class="button is-active" data-filter="all">Todos</button>
          <button class="button" data-filter="changed">Mudança de sinal</button>
        </div>
        <p class="scatter-legend-note" style="margin-bottom: 12px;">Contorno destacado = o ajuste muda o sinal do índice.</p>
        <div data-role="ranking-pane"></div>
        <div class="country-details" data-role="details-pane"></div>
      </aside>
    </div>
    <div class="atlas-timeline-pane" data-role="timeline-pane"></div>
  </div>
`;

export async function mountRawAdjustedExplorer(root) {
  root.innerHTML = PAGE_MARKUP;

  const { getState, setState, subscribe } = createAppState();

  const scatterPane = root.querySelector('[data-role="scatter-pane"]');
  const detailsPane = root.querySelector('[data-role="details-pane"]');
  const timelinePane = root.querySelector('[data-role="timeline-pane"]');
  const rankingPane = root.querySelector('[data-role="ranking-pane"]');
  const currentDateEl = document.getElementById("c1-date-badge-b");
  const filterButtons = root.querySelectorAll(".scatter-filter .button");

  const tooltip = createTooltip(document.body);

  function toggleSelection(iso) {
    const current = getState().selectedCountry;
    setState({ selectedCountry: iso && iso !== current ? iso : null });
  }

  const scatterplot = createScatterplot(scatterPane, {
    onHover: (event, record) => {
      tooltip.show(event, renderRawAdjustedInfoHtml(record));
      setState({ hoveredCountry: record.iso_a3 });
    },
    onLeave: () => {
      tooltip.hide();
      setState({ hoveredCountry: null });
    },
    onClick: (record) => toggleSelection(record?.iso_a3 ?? null),
  });

  const ranking = createRanking(rankingPane, {
    valueKey: "USD_adjusted",
    onHover: (event, record) => {
      tooltip.show(event, renderRawAdjustedInfoHtml(record));
      setState({ hoveredCountry: record.iso_a3 });
    },
    onLeave: () => {
      tooltip.hide();
      setState({ hoveredCountry: null });
    },
    onClick: (record) => toggleSelection(record?.iso_a3 ?? null),
  });

  let colorScale;

  const trajectory = createTrajectory(scatterplot.trajectoryLayer, scatterplot.xScale, scatterplot.yScale);

  const timeline = createTimeline(timelinePane, {
    onSelect: (dateKey) => {
      setState({ selectedDate: dateKey });
      loadDate(dateKey, { animate: true });
    },
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      scatterplot.setSignFilter(btn.dataset.filter === "changed");
    });
  });

  let recordsByIso = new Map();
  let lastHistoryIso = null;
  let globalMaxAbs = 1.0;

  function applyState(state) {
    scatterplot.applyHighlight(state.hoveredCountry, state.selectedCountry);
    ranking.applyHighlight(state.hoveredCountry, state.selectedCountry);

    if (!state.selectedCountry) {
      lastHistoryIso = null;
      detailsPane.classList.remove("is-visible");
      detailsPane.innerHTML = "";
      trajectory.hide();
      return;
    }

    const record = recordsByIso.get(state.selectedCountry) ?? null;
    if (record) {
      detailsPane.innerHTML = renderRawAdjustedInfoHtml(record);
      detailsPane.classList.add("is-visible");
    }

    if (state.selectedCountry !== lastHistoryIso) {
      lastHistoryIso = state.selectedCountry;
      loadHistory(state.selectedCountry, record?.name ?? state.selectedCountry);
    }
  }
  subscribe(applyState);

  async function loadHistory(isoA3, displayName) {
    const history = await getCountryHistory(isoA3);
    if (getState().selectedCountry !== isoA3) return;
    trajectory.show(history, {
      onPointHover: (event, point) => {
        const dateLabel = formatDate(new Date(`${point.date_key}T00:00:00`));
        tooltip.show(event, renderHistoryPointHtml(displayName, dateLabel, point.USD_raw, point.USD_adjusted));
      },
      onPointLeave: () => tooltip.hide(),
    });
  }

  async function loadDate(dateKey, { animate }) {
    const rows = await getRawAdjustedSnapshot(dateKey);
    recordsByIso = buildRecordsByIso(rows);

    const duration = animate ? TRANSITION_DURATION : 0;
    scatterplot.update(rows, { duration });

    const sorted = [...rows].sort((a, b) => b.USD_adjusted - a.USD_adjusted);
    const { overvalued, undervalued } = selectRanking(sorted, RANK_TOP_N);
    ranking.update(overvalued, undervalued, colorScale, globalMaxAbs, { duration });

    currentDateEl.textContent = formatDate(new Date(`${dateKey}T00:00:00`));

    applyState(getState());
  }

  await initBigMacData();

  const [dates, latestDate, maxAbs] = await Promise.all([
    getAvailableDates(),
    getLatestDate(),
    getRawAdjustedExtent(),
  ]);

  globalMaxAbs = maxAbs;
  colorScale = createDivergentColorScale(maxAbs);

  scatterplot.setDomain(maxAbs);

  setState({ selectedDate: latestDate });
  timeline.render(dates, latestDate);
  await loadDate(latestDate, { animate: false });
}
