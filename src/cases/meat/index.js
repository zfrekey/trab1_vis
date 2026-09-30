import "./case.css";
import "../cpi/case.css";
import {
  initMeatData,
  case3DesignAData,
  case3DesignBData,
  CASE3_BASE_SQL,
  MEAT_TYPES,
} from "./data/meatRepository.js";
import { createMultiLineIndexed } from "./charts/multiLineIndexed.js";
import { createSmallMultiples } from "./charts/smallMultiples.js";
import { createTooltip } from "../../shared/components/tooltip.js";

const MARKUP = `
  <div class="case-container">
    <header class="case-header">
      <p class="case-eyebrow">Caso 3 · Agricultura e Meio Ambiente</p>
      <h1 class="case-title">O que o mundo comeu: 63 anos de evolução na produção de carne</h1>
    </header>

    <div class="case-intro-card">
      <div class="meta">
        <strong>Original:</strong> <a href="https://ourworldindata.org/grapher/global-meat-production-by-livestock-type" target="_blank" rel="noopener">"Global Meat Production by Livestock Type"</a>, Our World in Data / FAO.
      </div>
      <p><strong>Pergunta central:</strong> como a produção mundial de carne evoluiu nas últimas seis décadas e quais espécies impulsionaram ou desaceleraram nessa trajetória?</p>
      <p><strong>Problemas fundamentais do original:</strong></p>
      <ul>
        <li><strong>Linha de base ondulada (área empilhada):</strong> apenas a camada inferior (aves) tem base plana; todas as séries intermediárias e superiores compartilham contornos ondulados, tornando a avaliação visual de taxas de crescimento quase impossível.</li>
        <li><strong>Categorias menores são esmagadas:</strong> espécies de menor volume (cavalo, camelo, caça selvagem) somam pouca fatia no volume total e tornam-se faixas de 1 a 2 pixels, escondendo tendências cruciais (como o declínio no consumo de carne de cavalo).</li>
        <li><strong>Cores empilhadas disputando espaço:</strong> ligar 7 cores distintas da legenda a faixas microscópicas gera sobrecarga cognitiva sem ganho analítico.</li>
      </ul>
    </div>

    <nav class="tabs-nav" role="tablist">
      <button class="tab-btn is-active" data-tab="design-a">Design A - Séries Indexadas (1961 = 100)</button>
      <button class="tab-btn" data-tab="design-b">Design B - Pequenos Múltiplos por Tipo</button>
    </nav>

    <!-- Painel Design A -->
    <div id="c3-panel-design-a" class="tab-pane is-active">
      <div class="chart-card">
        <h3>Design A - Séries indexadas ao ano-base (1961 = 100)</h3>
        <p class="caption">Todas as séries iniciam em 100 em 1961. A inclinação de cada linha reflete diretamente o ritmo de crescimento percentual acumulado, eliminando o viés do tamanho absoluto. Passe o mouse para inspecionar ano a ano.</p>
        <div id="c3-chart-a"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Indexar as séries remove a disparidade de escala física (aves em centenas de milhões de toneladas vs. camelo em centenas de milhares) e responde à questão analítica de interesse: <i>quem cresceu em maior proporção</i>. Revela imediatamente que a carne de aves disparou mais de 16x (índice > 1.600), enquanto a carne de cavalo estagnou/caiu.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c3-sql-a"></pre>
      </div>
    </div>

    <!-- Painel Design B -->
    <div id="c3-panel-design-b" class="tab-pane">
      <div class="chart-card">
        <h3>Design B - Pequenos múltiplos por tipo de animal (escalas individuais)</h3>
        <p class="caption">Cada espécie ganha seu próprio painel com eixo vertical ajustado à sua magnitude real. Padrões específicos de séries antes negligenciadas ganham total visibilidade e clareza.</p>
        <div id="c3-chart-b"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Pequenos múltiplos favorecem a tarefa de análise isolada de cada categoria sem a distorção das séries gigantescas. É possível notar com precisão as oscilações históricas, declínios e momentos de inflexão específicos de cada tipo de produção animal.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c3-sql-b"></pre>
      </div>
    </div>
  </div>
`;

export async function mountMeatCase(root) {
  root.innerHTML = MARKUP;

  const tooltip = createTooltip(document.body);

  const tabs = root.querySelectorAll(".tabs-nav .tab-btn");
  const panes = {
    "design-a": root.querySelector("#c3-panel-design-a"),
    "design-b": root.querySelector("#c3-panel-design-b"),
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

  root.querySelectorAll(".sql-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const pre = toggle.nextElementSibling;
      pre.classList.toggle("open");
      toggle.textContent = pre.classList.contains("open")
        ? "▲ ocultar consulta SQL"
        : "▼ ver consulta SQL usada no DuckDB";
    });
  });

  await initMeatData();

  const [indexedData, rawData] = await Promise.all([
    case3DesignAData(),
    case3DesignBData(),
  ]);

  createMultiLineIndexed(root.querySelector("#c3-chart-a"), indexedData, {
    xKey: "year",
    seriesKeys: MEAT_TYPES,
    tooltip,
  });
  root.querySelector("#c3-sql-a").textContent = CASE3_BASE_SQL;

  createSmallMultiples(root.querySelector("#c3-chart-b"), rawData, {
    xKey: "year",
    seriesKeys: MEAT_TYPES,
    tooltip,
  });
  root.querySelector("#c3-sql-b").textContent = CASE3_BASE_SQL;
}
