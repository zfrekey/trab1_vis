import { mountBigMacCase as mountRedesign1 } from "./redesign1.js";
import { mountRawAdjustedExplorer as mountRedesign2 } from "./redesign2.js";
import { SNAPSHOT_SQL, RAW_ADJUSTED_SNAPSHOT_SQL } from "./data/bigMacRepository.js";

const MARKUP = `
  <div class="case-container">
    <header class="case-header">
      <p class="case-eyebrow">Caso 1 · Economia e Poder de Compra</p>
      <h1 class="case-title">Big Mac Index: Paridade do Poder de Compra na prática</h1>
    </header>

    <div class="case-intro-card">
      <div class="meta">
        <strong>Original:</strong> <a href="https://www.economist.com/big-mac-index" target="_blank" rel="noopener">"The Big Mac Index"</a>, The Economist.
      </div>
      <p><strong>Pergunta central:</strong> Como as moedas ao redor do mundo estão valorizadas ou subvalorizadas em relação ao Dólar americano, segundo a teoria da Paridade do Poder de Compra (PPC)?</p>
      <p><strong>Problemas fundamentais do original:</strong></p>
      <ul>
        <li><strong>Falta de contexto geoespacial e histórico:</strong> o índice é frequentemente publicado como um ranking em barras estático (ou interatividade limitada a uma única data), ocultando clusters regionais e tendências evolutivas ao longo de décadas.</li>
        <li><strong>Análise bidimensional ausente:</strong> embora a publicação calcule a diferença pelo PIB per capita, raramente se contrasta visualmente o índice bruto contra o ajustado no mesmo espaço, o que esconde o fato de que moedas "subvalorizadas" muitas vezes se tornam sobrevalorizadas quando o nível de renda é levado em conta.</li>
      </ul>
    </div>

    <nav class="tabs-nav" role="tablist">
      <button class="tab-btn is-active" data-tab="design-a">Design A - Global Currency Atlas</button>
      <button class="tab-btn" data-tab="design-b">Design B - Raw vs Adjusted Explorer</button>
    </nav>

    <!-- Painel Design A -->
    <div id="c1-panel-design-a" class="tab-pane is-active">
      <div class="chart-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
          <div>
            <h3 style="margin-bottom: 4px;">Design A - Global Currency Atlas</h3>
            <p class="caption" style="margin-top: 0;">Visão geoespacial sincronizada com ranking e linha do tempo navegável (últimas décadas).</p>
          </div>
          <div class="atlas-date-badge">
            <span class="atlas-date-label">Data atual</span>
            <span class="atlas-date-value" id="c1-date-badge-a"></span>
          </div>
        </div>
        <div id="c1-redesign1-root"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Uma abordagem interativa baseada em mapa permite visualizar imediatamente clusters regionais, enquanto o ranking e a linha do tempo conectada evidenciam as oscilações cambiais ao longo dos anos.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c1-sql-a"></pre>
      </div>
    </div>

    <!-- Painel Design B -->
    <div id="c1-panel-design-b" class="tab-pane">
      <div class="chart-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
          <div>
            <h3 style="margin-bottom: 4px;">Design B - Raw vs Adjusted Explorer</h3>
            <p class="caption" style="margin-top: 0;">Scatterplot interativo contrastando o índice bruto versus o ajustado pelo PIB per capita.</p>
          </div>
          <div class="atlas-date-badge">
            <span class="atlas-date-label">Data atual</span>
            <span class="atlas-date-value" id="c1-date-badge-b"></span>
          </div>
        </div>
        <div id="c1-redesign2-root"></div>
        <div class="why">
          <b>Por que esse desenho:</b> Isolar as duas variáveis (bruto x ajustado) num gráfico de dispersão com uma linha neutra (x=0, y=0) permite descobrir de imediato que muitas moedas consideradas "subvalorizadas" na versão clássica são, na verdade, sobrevalorizadas quando ajustadas pela renda local.
        </div>
        <div class="sql-toggle">▼ ver consulta SQL usada no DuckDB</div>
        <pre class="sql-code" id="c1-sql-b"></pre>
      </div>
    </div>
  </div>
`;

export async function mountBigMacWrapper(root) {
  root.innerHTML = MARKUP;

  const tabs = root.querySelectorAll(".tabs-nav .tab-btn");
  const panes = {
    "design-a": root.querySelector("#c1-panel-design-a"),
    "design-b": root.querySelector("#c1-panel-design-b"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const target = tab.dataset.tab;
      Object.keys(panes).forEach((k) => {
        panes[k].classList.toggle("is-active", k === target);
      });
      window.dispatchEvent(new Event("resize"));
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

  root.querySelector("#c1-sql-a").textContent = SNAPSHOT_SQL;
  root.querySelector("#c1-sql-b").textContent = RAW_ADJUSTED_SNAPSHOT_SQL;

  await Promise.all([
    mountRedesign1(panes["design-a"].querySelector("#c1-redesign1-root")),
    mountRedesign2(panes["design-b"].querySelector("#c1-redesign2-root"))
  ]);
}
