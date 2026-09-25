import "./case.css";

import {
  initBigMacData,
  getAvailableDates,
  getLatestDate,
  getRawAdjustedExtent,
  getRawAdjustedSnapshot,
  getCountryHistory,
} from "./data/bigMacRepository.js";
import { buildRecordsByIso } from "./data/geoJoin.js";
import { createScatterplot } from "./charts/scatterplot.js";
import { createTrajectory } from "./charts/trajectory.js";
import { createTimeline } from "./charts/timeline.js";
import { createTooltip } from "../../shared/components/tooltip.js";
import { createAppState } from "./appState.js";
import { formatDate } from "../../shared/utils/format.js";
import { renderRawAdjustedInfoHtml, renderHistoryPointHtml } from "./components/rawAdjustedDetails.js";

const TRANSITION_DURATION = 650;

const PAGE_MARKUP = `
  <div class="raw-adjusted">
    <header class="atlas-header">
      <p class="atlas-eyebrow">Raw vs Adjusted Explorer</p>
      <h1 class="atlas-title">Quanto o ajuste econômico altera a leitura da sobre/subvalorização de cada país?</h1>
      <p class="atlas-intro">
        Cada ponto é um país: a posição horizontal é o índice bruto do Big Mac,
        a vertical é o índice ajustado pelo PIB per capita. Fora da diagonal,
        o ajuste muda a leitura da valorização cambial.
      </p>
      <div class="atlas-date-badge">
        <span class="atlas-date-label">Data atual</span>
        <span class="atlas-date-value" data-role="current-date"></span>
      </div>
    </header>

    <div class="atlas-grid">
      <div class="atlas-map-pane" data-role="scatter-pane"></div>
      <aside class="atlas-ranking-pane">
        <div class="scatter-filter">
          <button class="button is-active" data-filter="all">Todos</button>
          <button class="button" data-filter="changed">Mudança de sinal</button>
        </div>
        <p class="scatter-legend-note">Contorno destacado = o ajuste muda o sinal do índice.</p>
        <div class="country-details" data-role="details-pane"></div>
      </aside>
    </div>

    <div class="atlas-timeline-pane" data-role="timeline-pane"></div>

    <footer class="atlas-footer">Fonte: The Economist — Big Mac Index.</footer>
  </div>
`;

export async function mountRawAdjustedExplorer(root) {
  root.innerHTML = PAGE_MARKUP;

  const { getState, setState, subscribe } = createAppState();

  const scatterPane = root.querySelector('[data-role="scatter-pane"]');
  const detailsPane = root.querySelector('[data-role="details-pane"]');
  const timelinePane = root.querySelector('[data-role="timeline-pane"]');
  const currentDateEl = root.querySelector('[data-role="current-date"]');
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

  // Trajetória desenha no mesmo grupo/escalas do scatterplot (mesmo plano
  // raw x adjusted), em vez de um SVG próprio.
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

  function applyState(state) {
    scatterplot.applyHighlight(state.hoveredCountry, state.selectedCountry);

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

    // Histórico só é buscado quando a seleção MUDA, não a cada hover nem a
    // cada troca de data (a trajetória é contexto estável entre snapshots).
    if (state.selectedCountry !== lastHistoryIso) {
      lastHistoryIso = state.selectedCountry;
      loadHistory(state.selectedCountry, record?.name ?? state.selectedCountry);
    }
  }
  subscribe(applyState);

  async function loadHistory(isoA3, displayName) {
    const history = await getCountryHistory(isoA3);
    if (getState().selectedCountry !== isoA3) return; // seleção mudou enquanto a consulta rodava
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
    currentDateEl.textContent = formatDate(new Date(`${dateKey}T00:00:00`));

    applyState(getState());
  }

  await initBigMacData();

  const [dates, latestDate, maxAbs] = await Promise.all([
    getAvailableDates(),
    getLatestDate(),
    getRawAdjustedExtent(),
  ]);

  // Domínio fixo (histórico completo, não só a data atual): eixos não
  // precisam ser recalculados a cada troca de snapshot.
  scatterplot.setDomain(maxAbs);

  setState({ selectedDate: latestDate });
  timeline.render(dates, latestDate);
  await loadDate(latestDate, { animate: false });
}
