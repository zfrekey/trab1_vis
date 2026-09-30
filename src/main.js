import "./shared/styles/style.css";
import { mountBigMacWrapper } from "./cases/big-mac/index.js";
import { mountCpiCase } from "./cases/cpi/index.js";
import { mountMeatCase } from "./cases/meat/index.js";

const app = document.getElementById("app");
app.innerHTML = "";

// Header com título do trabalho, integrantes e navegação entre os 3 casos
const header = document.createElement("header");
header.className = "app-header-container";
header.innerHTML = `
  <div class="app-header-inner">
    <div class="app-top-row">
      <div class="app-brand">
        <h1>Redesign Crítico de Visualizações de Dados</h1>
        <p>Trabalho 1 da disciplina de Visualização de Dados · UFF · Integrantes: Filype Abreu, Felipe Gomes e Lucas Paixão</p>
      </div>
    </div>
    <nav class="case-main-nav" role="tablist" aria-label="Navegação entre casos do trabalho">
      <button class="case-nav-btn is-active" data-case="case-1">
        Caso 1 - Big Mac Index
      </button>
      <button class="case-nav-btn" data-case="cpi">
        Caso 2 - Índice de Corrupção (CPI)
      </button>
      <button class="case-nav-btn" data-case="meat">
        Caso 3 - Produção Mundial de Carne
      </button>
    </nav>
  </div>
`;
app.appendChild(header);

// Contêiner principal para os casos
const mainContent = document.createElement("main");
app.appendChild(mainContent);

// ==========================================
// CASO 1: Big Mac Index
// ==========================================
const case1Root = document.createElement("div");
case1Root.id = "case-1-section";
case1Root.className = "case-section is-active";
mainContent.appendChild(case1Root);

// Mount using wrapper
mountBigMacWrapper(case1Root);

// ==========================================
// CASO 2: Índice de Corrupção (CPI)
// ==========================================
const cpiRoot = document.createElement("div");
cpiRoot.id = "cpi-section";
cpiRoot.className = "case-section";
mainContent.appendChild(cpiRoot);

// ==========================================
// CASO 3: Produção Mundial de Carne
// ==========================================
const meatRoot = document.createElement("div");
meatRoot.id = "meat-section";
meatRoot.className = "case-section";
mainContent.appendChild(meatRoot);

// Lazy mounting dos casos 2 e 3
const mountedCases = {
  "case-1": true,
  "cpi": false,
  "meat": false,
};

async function activateCase(caseId) {
  // Atualiza botões da navegação
  header.querySelectorAll(".case-nav-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.case === caseId);
  });

  // Atualiza visibilidade dos contêineres
  case1Root.classList.toggle("is-active", caseId === "case-1");
  cpiRoot.classList.toggle("is-active", caseId === "cpi");
  meatRoot.classList.toggle("is-active", caseId === "meat");

  // Lazy mount se ainda não foi montado
  if (caseId === "cpi" && !mountedCases["cpi"]) {
    mountedCases["cpi"] = true;
    await mountCpiCase(cpiRoot);
  } else if (caseId === "meat" && !mountedCases["meat"]) {
    mountedCases["meat"] = true;
    await mountMeatCase(meatRoot);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Eventos de clique na navegação
header.querySelectorAll(".case-nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    activateCase(btn.dataset.case);
  });
});

