"use client";

interface VersionChange {
  type: "feature" | "fix" | "improvement";
  text: string;
}

interface VersionEntry {
  version: string;
  date: string;
  build: string;
  changes: VersionChange[];
}

const changelog: VersionEntry[] = [
  {
    version: "v1.15.0",
    date: "24 de Julho, 2026",
    build: "20260724",
    changes: [
      {
        type: "feature",
        text: "Suporte a data de validade nos produtos",
      },
      {
        type: "feature",
        text: "Paginação e ordenação na lista de produtos",
      },
      {
        type: "feature",
        text: "Busca, filtro por tipo e paginação no histórico",
      },
      {
        type: "feature",
        text: "Edição rápida de categorias",
      },
      {
        type: "improvement",
        text: "Botão 'CSV' substituído por 'Exportar' com menu dropdown",
      },
      {
        type: "improvement",
        text: "Novo layout do histórico com abas de período e barra de busca",
      },
      {
        type: "improvement",
        text: "Descrição do produto tornada opcional",
      },
    ],
  },
];

const latest = changelog[0];
const CURRENT_VERSION = latest.version.replace(/^v/, "");
const BUILD_STRING = `${latest.version} (Build ${latest.build})`;

export { type VersionEntry, changelog, CURRENT_VERSION, BUILD_STRING };
