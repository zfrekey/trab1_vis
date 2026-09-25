# Redesign Crítico de Visualizações de Dados

Trabalho 1 da disciplina de Visualização de Dados, professor Marcos Lage.

**Integrantes:** Filype Abreu, Felipe Gomes e Lucas Paixão.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Visualizações redesenhadas

Os dois redesigns usam o mesmo dataset (Big Mac Index) e ficam na mesma
página, um abaixo do outro, cada um com seu próprio mapa/gráfico, painel e
timeline independentes.

**Redesign 1 — Global Currency Atlas**: três visões coordenadas.

- **Mapa mundial** coroplético (projeção Natural Earth), colorido por
  `USD_raw` numa escala divergente (subvalorizado ↔ sobrevalorizado).
- **Ranking divergente** com os países mais sobre/subvalorizados, barras
  saindo de um eixo central em zero.
- **Timeline** com as datas reais do dataset, para navegar entre snapshots.

Mapa, ranking e timeline são *linked views*: passar o mouse ou clicar em um
país destaca ele nas outras visões e abre um painel de detalhes.

**Redesign 2 — Raw vs Adjusted Explorer**: um scatterplot `USD_raw` ×
`USD_adjusted`, com linha `y = x` e quadrantes, para ver quanto o ajuste
pelo PIB per capita muda a leitura de sobre/subvalorização de cada país.

- Clicar num país desenha sua **trajetória histórica** no mesmo plano.
- Filtro para destacar só os países onde o ajuste **muda o sinal** do índice.
- Reaproveita a timeline do Redesign 1, mas com seleção/hover independentes.

## Estrutura

```
src/
├── main.js                 # ponto de entrada, monta os dois redesigns
├── shared/                 # estilos/utilitários reaproveitáveis entre casos
└── cases/
    ├── big-mac/
    │   ├── index.js         # Redesign 1 (Global Currency Atlas)
    │   ├── redesign2.js      # Redesign 2 (Raw vs Adjusted Explorer)
    │   ├── data/             # DuckDB + SQL + join geográfico
    │   ├── charts/           # mapa, ranking, timeline, scatterplot, trajetória
    │   └── components/       # legenda, painéis de detalhes
    ├── case-2/               # reservado
    └── case-3/               # reservado
```
