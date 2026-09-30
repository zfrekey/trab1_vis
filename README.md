# Redesign Crítico de Visualizações de Dados

Trabalho 1 da disciplina de Visualização de Dados — Professor Marcos Lage (UFF).

**Integrantes:** Filype Abreu, Felipe Gomes e Lucas Paixão.

---

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Para gerar build de produção:
```bash
npm run build
npm run preview
```

---

## Casos do Trabalho

### Caso 1 — Big Mac Index (The Economist)
Compara a teoria de Paridade do Poder de Compra (PPC) com dados históricos de mais de duas décadas.
- **Design A (Global Currency Atlas):** mapa mundial coroplético integrado a um ranking divergente e linha do tempo dinâmica com highlight bidirecional.
- **Design B (Raw vs Adjusted Explorer):** scatterplot bivariado com linha de identidade, filtro interativo de mudança de sinal e trajetória histórica desenhada sob demanda.

### Caso 2 — Índice de Percepção da Corrupção (Transparency International / MakeoverMonday)
Crítica à visualização oficial que utiliza cor de "semáforo" contínua e esconde a linha de corte substantiva.
- **Design A (Diferença vs. Linha de Corte):** barras divergentes ancoradas no limiar editorial de 50 pontos com busca textual em tempo real.
- **Design B (Distribuição Regional - Strip Plot):** dispersão unidimensional dos países agrupados por regiões continentais do OWID, com jitter controlado e linha de corte de 50 pontos.

### Caso 3 — Produção Mundial de Carne por Espécie (OWID / FAO / MakeoverMonday)
Crítica ao uso de gráficos de área empilhada que dificultam a avaliação de taxas de crescimento devido à linha de base ondulada e esmagam espécies de menor porte.
- **Design A (Séries Indexadas):** todas as 7 categorias indexadas ao ano-base (1961 = 100), revelando diretamente a taxa de crescimento relativo através da inclinação (com crosshair interativo e tooltip).
- **Design B (Pequenos Múltiplos):** grade com 7 painéis individuais, cada um com escala Y própria dimensionada ao seu pico, evidenciando padrões históricos e estagnações antes invisíveis (ex.: carne de cavalo).

---

## Estrutura do Projeto

```
src/
├── main.js                 # Ponto de entrada, orquestração e navegação entre os 3 casos
├── shared/
│   ├── data/
│   │   └── duckdb.js       # Instância singleton global do DuckDB-Wasm e execução de SQL
│   ├── styles/
│   │   └── style.css       # Tokens de design, cabeçalho, navegação e estilos compartilhados
│   ├── components/
│   │   └── tooltip.js      # Tooltip flutuante com bounding box inteligente
│   └── utils/
│       └── format.js       # Formatadores numéricos e de datas
└── cases/
    ├── big-mac/            # Caso 1: Big Mac Index
    │   ├── index.js        # Redesign 1 (Global Currency Atlas)
    │   ├── redesign2.js    # Redesign 2 (Raw vs Adjusted Explorer)
    │   ├── data/           # Queries SQL do Big Mac e join geoespacial
    │   ├── charts/         # Mapa mundi, ranking divergente, timeline, scatterplot, trajetórias
    │   └── components/     # Legendas e painéis de detalhes
    ├── cpi/             # Caso 2: Índice de Corrupção (CPI)
    │   ├── index.js        # Montagem do Caso 2 e alternância de abas
    │   ├── case.css        # Estilos específicos do Caso 2
    │   ├── data/           # Queries SQL do CPI no DuckDB
    │   └── charts/         # Barras divergentes com busca, strip plot e réplica semáforo
    └── meat/             # Caso 3: Produção Mundial de Carne
        ├── index.js        # Montagem do Caso 3 e alternância de abas
        ├── case.css        # Estilos específicos dos pequenos múltiplos
        ├── data/           # Queries SQL de indexação e séries temporais no DuckDB
        └── charts/         # Séries indexadas, pequenos múltiplos e réplica área empilhada

public/
├── big-mac/data/           # big-mac-full-index.csv e world-atlas-50m.json
├── cpi/data/            # corruption-perceptions-index.csv
└── meat/data/            # meat-by-type.csv
```
