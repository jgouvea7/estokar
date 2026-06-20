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
    version: "v1.14.0",
    date: "20 de Junho, 2026",
    build: "20260620",
    changes: [
      {
        type: "feature",
        text: "Implementado novo design da interface e modo escuro",
      },
      {
        type: "feature",
        text: "Adicionada exportação de produtos em formato CSV",
      }      
    ],
  },
];

const latest = changelog[0];
const CURRENT_VERSION = latest.version.replace(/^v/, "");
const BUILD_STRING = `${latest.version} (Build ${latest.build})`;

export { type VersionEntry, changelog, CURRENT_VERSION, BUILD_STRING };
