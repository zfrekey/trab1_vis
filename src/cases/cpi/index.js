import "./case.css";
import {
  initCpiData,
  case2DesignAData,
  case2DesignBData,
  CASE2_DESIGN_A_SQL,
  CASE2_DESIGN_B_SQL,
  CPI_THRESHOLD,
} from "./data/cpiRepository.js";
import { createDivergingBarChart } from "./charts/divergingBarChart.js";
import { createStripPlot } from "./charts/stripPlot.js";
import { createTooltip } from "../../shared/components/tooltip.js";

const MARKUP = `
  <div class="case-container">
    <header class="case-header">
      <p class="case-eyebrow">Caso 2 · Governança e Transparência</p>
      <h1 class="case-title">Índice de Percepção da Corrupção: quem está abaixo da linha de integridade?</h1>
    </header>

    <div class="case-intro-card">
      <div class="meta">
        <strong>Original:</strong> <a href="https://www.transparency.org/en/cpi/2024" target="_blank" rel="noopener">"Corruption Perceptions Index 2024"</a>, Transparency International.
      </div>
      <p><strong>Pergunta central:</strong> quão íntegro é percebido o setor público de cada país (0 = extremamente corrupto, 100 = muito íntegro) e quantos países permanecem abaixo da linha de corte aceitável (50 pontos)?</p>
      <p><strong>Problemas fundamentais do original:</strong></p>
      <ul>
        <li><strong>Gradiente de "semáforo" (vermelho→amarelo→verde):</strong> cria fronteiras visuais arbitrárias em uma escala contínua (ex.: 49 e 51 parecem categorias opostas).</li>
        <li><strong>Falta de linha de corte de referência:</strong> o fato mais enfatizado pela própria organização (dois terços dos países estão abaixo de 50 pontos) não é destacado visualmente.</li>
        <li><strong>Lista longa sem agregação regional:</strong> esconde a enorme disparidade e a concentração geográfica de notas elevadas (ex.: Europa Ocidental).</li>
      </ul>
    </div>

    <nav class="tabs-nav" role="tablist">
      <button class="tab-btn is-active" data-tab="design-a">Design A - Diferença vs. Linha de Corte</button>
      <button class="tab-btn" data-tab="design-b">Design B - Distribuição por Região</button>
    </nav>

    <!-- Painel Design A -->
    <div id="c2-panel-design-a" class="tab-pane is-active">
      <div class="chart-card">
        <h3>Design A - Barras divergentes em relação ao corte de 50 (com busca)</h3>
        <p class="caption">A linha central marca exatamente o corte editorial de 50 pontos: barras em vermelho para países íntegros (≥ 50) e azul para países abaixo do corte (&lt; 50). Use o campo de busca para localizar rapidamente qualquer nação.</p>
        <div id="c2-chart-a"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Em vez de um ranking bruto, a comparação é ancorada na referência substantiva adotada pela própria Transparency International. A cor divergente com neutro central é a codificação perceptualmente recomendada para desvios em torno de um limiar, e a busca dinâmica resolve o volume de 180 países sem ocultar dados.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c2-sql-a"></pre>
      </div>
    </div>

    <!-- Painel Design B -->
    <div id="c2-panel-design-b" class="tab-pane">
      <div class="chart-card">
        <h3>Design B - Distribuição de pontuações por região do mundo (Strip Plot)</h3>
        <p class="caption">Cada círculo representa um país, agrupado verticalmente pela região geográfica e posicionado horizontalmente pela nota CPI (com jitter controlado para reduzir oclusão). A linha tracejada demarca o corte de 50 pontos.</p>
        <div id="c2-chart-b"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Um gráfico de pontos por grupo mostra a distribuição e dispersão completas de cada continente - revelando que a Europa Ocidental concentra as notas mais altas mas não é inteiramente uniforme, enquanto a África Subsaariana e a América Latina têm a grande maioria de seus países abaixo da linha de corte.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c2-sql-b"></pre>
      </div>
    </div>
  </div>
`;

export async function mountCpiCase(root) {
  root.innerHTML = MARKUP;

  const tooltip = createTooltip(document.body);

  // Tab switching
  const tabs = root.querySelectorAll(".tabs-nav .tab-btn");
  const panes = {
    "design-a": root.querySelector("#c2-panel-design-a"),
    "design-b": root.querySelector("#c2-panel-design-b"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const target = tab.dataset.tab;
      Object.keys(panes).forEach((k) => {
        panes[k].classList.toggle("is-active", k === target);
      });
    });
  });

  // SQL Toggles
  root.querySelectorAll(".sql-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const pre = toggle.nextElementSibling;
      pre.classList.toggle("open");
      toggle.textContent = pre.classList.contains("open")
        ? "▲ ocultar consulta SQL"
        : "▼ ver consulta SQL usada no DuckDB";
    });
  });

  // Carrega os dados e monta os gráficos
  await initCpiData();

  const [diffRows, regionRows] = await Promise.all([
    case2DesignAData(),
    case2DesignBData(),
  ]);

  // Design A
  createDivergingBarChart(root.querySelector("#c2-chart-a"), diffRows, {
    tooltip,
    baselineLabel: `ao corte de ${CPI_THRESHOLD} pontos`,
  });
  root.querySelector("#c2-sql-a").textContent = CASE2_DESIGN_A_SQL;

  // Design B
  createStripPlot(root.querySelector("#c2-chart-b"), regionRows, {
    threshold: CPI_THRESHOLD,
    tooltip,
  });
  root.querySelector("#c2-sql-b").textContent = CASE2_DESIGN_B_SQL;
}
