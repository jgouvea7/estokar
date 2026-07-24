# SPECS — Analytics & Movimentação de Estoque

> Documento de especificação de bugs, melhorias de performance e guia de testes para o projeto Estokar.
> Atualizado em: 2026-07-23 (v2)

---

## Estado Atual (após correções anteriores)

### ✅ Corrigidos (v1)

| Item | Arquivo | Status |
|---|---|---|
| BUG-001 · Label semanal usava dia do item, não domingo | `aggregate-by-period.ts` | ✅ Corrigido |
| BUG-002 · Toggle deseleciona e estado inicial null | `page.tsx`, `filter-toggle.tsx` | ✅ Parcialmente corrigido (ver BUG-A abaixo) |
| BUG-003 · Timeline não reagrupa por período | `page.tsx`, `timeline-chart.tsx` | ✅ Corrigido |
| BUG-004 · Histórico agrupa sempre por dia | `history/page.tsx` | ✅ Corrigido |
| PERF-001 · `getCategoryStock` fora do `Promise.all` | `analytics.service.ts` | ✅ Corrigido |
| PERF-002 · `buildTimeline` em memória | `analytics.service.ts` | ✅ Corrigido |
| PERF-003 · `getTopSelling` e `getLowestSelling` separados | `analytics.service.ts` | ✅ Corrigido (`getTopAndLowestSelling`) |

---

## 1. Novos Bugs Identificados (v2)

### BUG-A · Restaurar toggle null para exibir dados gerais (todos os períodos)

**Arquivos:**
- `web/src/lib/types.ts`
- `web/src/lib/api/analytics.ts`
- `web/src/app/(app)/analytics/page.tsx`
- `web/src/components/analytics/analytics-filter-toggle.tsx`
- `web/src/lib/aggregate-by-period.ts`

**Severidade:** Alta

#### Descrição

No estado atual, `AnalyticsFilter` foi alterado para ser apenas `AnalyticsPeriod` (sem `null`):

```ts
// ATUAL — sem null
export type AnalyticsFilter = AnalyticsPeriod;

// NECESSÁRIO — null representa "todos os dados / sem filtro"
export type AnalyticsFilter = AnalyticsPeriod | null;
```

O toggle também foi alterado para **não deselecionar** (`onClick={() => onChange(opt.value)}`), mas o requisito é que o usuário possa **desselecionar** um filtro ativo para voltar a ver os dados gerais (sem corte de período).

O estado `null` no frontend deve sinalizar para a API que não há filtro → o backend usa `resolvePeriod(null)` → retorna `'monthly'` como padrão, mas o objetivo é ter um **endpoint sem filtro** que retorne todos os dados históricos do usuário.

#### Análise da Causa Raiz

Existem duas camadas de problema:

1. **Tipo:** `AnalyticsFilter` não aceita `null` → TypeScript bloqueia o `useState<AnalyticsFilter>(null)`.

2. **API:** `getAnalytics` sempre envia `?period=X` — não há forma de pedir "sem período". O backend `resolvePeriod(undefined)` retorna `'monthly'`, então mesmo sem `?period`, o filtro padrão é mensal. Para exibir dados gerais, o backend deve aceitar `period=all` ou omitir o parâmetro e retornar sem o filtro de `startDate`.

3. **`aggregateByPeriod`:** Já trata `filter === null` → retorna dados sem agrupamento. Isso está correto.

4. **`analytics-filter-toggle.tsx`:** O toggle precisa de um comportamento de deselecionar (clicar no ativo → `null`) para permitir voltar ao estado "Geral".

#### Correção

**`web/src/lib/types.ts`:**
```diff
- export type AnalyticsFilter = AnalyticsPeriod;
+ export type AnalyticsFilter = AnalyticsPeriod | null;
```

**`web/src/lib/api/analytics.ts`:**
```diff
 export async function getAnalytics(
   accessToken: string,
-  period: AnalyticsPeriod,
+  period: AnalyticsPeriod | null,
 ): Promise<AnalyticsData> {
-  return apiRequest<AnalyticsData>(`/analytics?period=${period}`, {
+  const qs = period ? `?period=${period}` : '';
+  return apiRequest<AnalyticsData>(`/analytics${qs}`, {
     method: 'GET',
     accessToken,
   });
 }
```

**`web/src/app/(app)/analytics/page.tsx`:**
```diff
- const [filter, setFilter] = useState<AnalyticsFilter>('monthly');
+ const [filter, setFilter] = useState<AnalyticsFilter>(null);

  const { data, isLoading, error } = useQuery({
-   queryKey: ['analytics', session?.user.id, filter],
-   queryFn: async () => getAnalytics(session!.accessToken, filter),
+   queryKey: ['analytics', session?.user.id, filter ?? 'all'],
+   queryFn: async () => getAnalytics(session!.accessToken, filter),
```

**`web/src/components/analytics/analytics-filter-toggle.tsx`:**
```diff
- onClick={() => onChange(opt.value)}
+ onClick={() => onChange(selected === opt.value ? null : opt.value)}
```

**`web/src/lib/aggregate-by-period.ts`:** Linha 13 já trata `null` corretamente:
```ts
if (!filter || filter === 'daily') return data; // null → sem agrupamento ✓
```

**`backend/src/common/utils/period.util.ts`:** O backend já lida com `period=undefined` → retorna `'monthly'`. Para "todos os dados", deve-se **não passar** `startDate` ao backend:

```ts
// Quando period=undefined (sem parâmetro), o backend pode retornar todos os dados
// Ajuste em getAnalytics: só aplicar startDate se period foi fornecido
export function getStartDate(period: Period): Date | undefined {
  // se quisermos suportar "all", deixar retornar undefined
}
```

**Impacto:** O `AnalyticsFilter` como `null` no frontend sinaliza "todos os dados". A API deve enviar sem `?period` → backend usa dados sem corte de data (ou com um range muito longo como 5 anos).

---

### BUG-B · `getDailyBalance` retorna data como timestamp ISO completo em vez de `YYYY-MM-DD`

**Arquivo:** `backend/src/analytics/analytics.service.ts`, método `getDailyBalance` (linha 244)
**Severidade:** Crítica

#### Descrição

A query usa `m."createdAt"::date` para extrair a data:

```ts
.select(`m."createdAt"::date`, 'date')
```

O PostgreSQL ao retornar um valor `::date` via driver Node.js (`pg`) pode serializar como:
- `"2026-07-23"` (string YYYY-MM-DD) — esperado
- `"2026-07-23T00:00:00.000Z"` (timestamp ISO 8601) — o que está acontecendo

Quando o frontend recebe `"2026-07-23T00:00:00.000Z"` como `date`, o `aggregateByPeriod` faz:

```ts
const d = new Date(rawDate + 'T00:00:00');
// Resultado: new Date("2026-07-23T00:00:00.000ZT00:00:00") → Invalid Date!
if (isNaN(d.getTime())) continue; // ← item é ignorado
```

Isso faz com que **todos os itens sejam descartados** e o gráfico mostre "Nenhuma movimentação no período".

O mesmo problema ocorre no `analytics-daily-balance-chart.tsx`:
```ts
const date = new Date(d.date + 'T00:00:00');
// "2026-07-23T00:00:00.000ZT00:00:00" → Invalid Date
label: isNaN(date.getTime()) ? d.date : date.toLocaleDateString(...)
// Mostra a string ISO bruta como label
```

#### Causa Raiz

O driver `pg` para Node.js tem comportamento de serialização de datas dependente da configuração. Um `::date` retorna um objeto `Date` JavaScript (não uma string), e ao serializar via JSON para a API ele vira o formato ISO completo com timezone.

**No `getTimelineMovements`** (linha 227) o mesmo acontece: `DATE_TRUNC('day', m."createdAt")::date` pode retornar timestamp ISO em vez de string de data.

#### Correção

**Backend** — forçar a serialização como string `YYYY-MM-DD` explicitamente com `TO_CHAR`:

```diff
// getDailyBalance (linha 247)
- .select(`m."createdAt"::date`, 'date')
+ .select(`TO_CHAR(m."createdAt"::date, 'YYYY-MM-DD')`, 'date')

// groupBy e orderBy também:
- .groupBy('m."createdAt"::date')
- .orderBy('m."createdAt"::date', 'ASC')
+ .groupBy(`m."createdAt"::date`)
+ .orderBy(`m."createdAt"::date`, 'ASC')
```

```diff
// getTimelineMovements (linha 227)
- .select(`DATE_TRUNC('day', m."createdAt")::date`, 'date')
+ .select(`TO_CHAR(DATE_TRUNC('day', m."createdAt"), 'YYYY-MM-DD')`, 'date')
- .groupBy(`DATE_TRUNC('day', m."createdAt")::date`)
- .orderBy(`DATE_TRUNC('day', m."createdAt")::date`, 'ASC')
+ .groupBy(`DATE_TRUNC('day', m."createdAt")`)
+ .orderBy(`DATE_TRUNC('day', m."createdAt")`, 'ASC')
```

**Frontend** — como defesa adicional, o `aggregateByPeriod` e os componentes de gráfico devem normalizar a data antes de parsear:

```ts
// web/src/lib/aggregate-by-period.ts, linha 19
- const d = new Date(rawDate + 'T00:00:00');
+ // Normaliza: extrai apenas YYYY-MM-DD se vier como ISO completo
+ const dateStr = rawDate.length > 10 ? rawDate.slice(0, 10) : rawDate;
+ const d = new Date(dateStr + 'T00:00:00');
```

```ts
// analytics-daily-balance-chart.tsx, linha 38
- const date = new Date(d.date + 'T00:00:00');
+ const dateStr = d.date.length > 10 ? d.date.slice(0, 10) : d.date;
+ const date = new Date(dateStr + 'T00:00:00');
```

```ts
// analytics-timeline-chart.tsx, linha 32 (getLabelByFilter)
- const date = new Date(dateStr + 'T00:00:00');
+ const normalized = dateStr.length > 10 ? dateStr.slice(0, 10) : dateStr;
+ const date = new Date(normalized + 'T00:00:00');
```

---

### BUG-C · `aggregateByPeriod` ignora todos os itens quando `date` é timestamp ISO

**Arquivo:** `web/src/lib/aggregate-by-period.ts`, linha 19
**Severidade:** Crítica (consequência direta do BUG-B)

#### Descrição

Relacionado ao BUG-B: quando `rawDate = "2026-07-23T00:00:00.000Z"`, o código:

```ts
const d = new Date(rawDate + 'T00:00:00');
// new Date("2026-07-23T00:00:00.000ZT00:00:00") → Invalid Date
if (isNaN(d.getTime())) continue; // ← pula o item
```

Resulta em `groups` vazio → `aggregatedDailyBalance = []` → **o gráfico Entradas vs Saídas mostra empty state** para todos os filtros não-diários (weekly, monthly, yearly).

Para o filtro `daily` (e `null`), `aggregateByPeriod` retorna os dados sem processar (`return data`), então o bug **não** é visível — por isso só aparece com filtros semanais, mensais e anuais.

#### Correção

A correção do backend (BUG-B) resolve a causa raiz. Como salvaguarda no frontend:

```ts
// web/src/lib/aggregate-by-period.ts
for (const item of data) {
  const rawDate = (item as { date: string }).date;
  if (!rawDate) continue;
  // Normaliza data: aceita "YYYY-MM-DD" e "YYYY-MM-DDTHH:mm:ss.sssZ"
  const dateStr = rawDate.length > 10 ? rawDate.slice(0, 10) : rawDate;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) continue;
  // ...resto igual
```

---

## 2. Performance — Status Atual

### ✅ Resolvidas

| Item | Solução aplicada |
|---|---|
| PERF-001 · `getCategoryStock` waterfall | Movido para dentro do `Promise.all` |
| PERF-002 · `buildTimeline` em memória | Agrupamento via `DATE_TRUNC` + `SUM` no banco |
| PERF-003 · Duas queries top/lowest selling | Unificado em `getTopAndLowestSelling` |

### 🟡 Ainda pendentes

#### PERF-004 · Double-filtering e paginação limitada no histórico

**Arquivos:** `web/src/app/(app)/history/page.tsx`, `web/src/lib/api/stock-movements.ts`
**Severidade:** Média

O `useMemo filteredItems` filtra no cliente dados que o backend já filtrou por período. Para `yearly` com muitas movimentações, o `limit=100` do backend trunca os dados antes do filtro frontend. Impacto: histórico anual mostra no máximo 100 movimentações mesmo que existam mais.

---

## 3. Estrutura de Testes

### Backend

```bash
cd backend

# Lint (auto-fix)
npm run lint

# Todos os testes unitários
npm test

# Com coverage
npm run test:cov
```

**Testes existentes — verificar que passam após correções:**
| Arquivo | Cobertura atual |
|---|---|
| `analytics.service.spec.ts` | `getAnalytics` com monthly, weekly, yearly, empty, invalid, forecast |
| `analytics.controller.spec.ts` | Chamadas ao service com period |
| `stock-movements.service.spec.ts` | findAll com/sem period |
| `stock-movements.controller.spec.ts` | GET endpoint |
| `dashboard.service.spec.ts` | Dados do dashboard |
| `app.controller.spec.ts` | Smoke test |

**Testes a criar:**

- `period.util.spec.ts` — `resolvePeriod` e `getStartDate` para todos os períodos
- `forecast.util.spec.ts` — edge cases de estoque zero, vendas zero, janelas de 7/14/30 dias
- `analytics.service.spec.ts` (novos casos):
  - `getDailyBalance` retorna `date` no formato `YYYY-MM-DD` (não ISO timestamp)
  - `getTimelineMovements` retorna `date` no formato `YYYY-MM-DD`
  - `buildTimeline` com movimentos em múltiplos dias calcula cumulativo corretamente

### Frontend

```bash
cd web

# Lint
npm run lint

# Testes (atualmente sem casos efetivos — passWithNoTests)
npm test

# Build de validação TypeScript
npm run build
```

**Testes a criar:**

- `aggregateByPeriod.test.ts`:
  - `filter = null` retorna dados sem modificação
  - `filter = 'daily'` retorna dados sem modificação
  - `filter = 'weekly'` com date como ISO timestamp `"2026-07-23T00:00:00.000Z"` normaliza e processa corretamente
  - `filter = 'weekly'` label usa domingo como início
  - `filter = 'monthly'` agrupa por mês e retorna nome do mês
  - `filter = 'yearly'` agrupa por ano e retorna o ano
  - Dados em múltiplos meses diferentes ficam em grupos separados

- `analytics-filter-toggle.test.tsx`:
  - Clique em filtro inativo chama `onChange` com o valor do filtro
  - Clique no filtro ativo chama `onChange` com `null` (deselecionar)
  - Nenhum botão ativo quando `selected = null`

- `analytics-daily-balance-chart.test.tsx`:
  - Empty state quando `data = []`
  - Renderiza barras com dados válidos
  - Aceita `date` no formato ISO timestamp sem quebrar

- `analytics-timeline-chart.test.tsx`:
  - Empty state quando `data = []`
  - Renderiza linha com dados válidos

---

## 4. Checklist de Validação Pré-Deploy

```bash
# 1. Backend — lint
cd backend && npm run lint

# 2. Backend — testes (100% pass)
cd backend && npm test

# 3. Frontend — lint
cd web && npm run lint

# 4. Frontend — testes
cd web && npm test

# 5. Frontend — build (valida TypeScript)
cd web && npm run build
```

> **Todos os 5 comandos devem passar sem erros antes de qualquer merge para `main`.**

### Validação manual no browser

- [ ] Abrir `/analytics` sem filtro — deve mostrar dados gerais (sem período selecionado visualmente)
- [ ] Clicar em **Mensal** → dados mensais carregam com gráfico de Entradas vs Saídas mostrando barras
- [ ] Clicar em **Mensal** novamente → deseleciona, volta ao estado geral
- [ ] Clicar em **Semanal** → gráfico de Entradas vs Saídas mostra barras por semana (não empty state)
- [ ] Clicar em **Anual** → gráfico de Entradas vs Saídas mostra barras por ano (não empty state)
- [ ] Verificar no DevTools Network: para "Geral" a request é `/analytics` (sem `?period`)
- [ ] Verificar no DevTools: campo `date` das respostas é `"2026-07-23"` (não `"2026-07-23T00:00:00.000Z"`)

---

## 5. Mapa Completo de Arquivos

| Arquivo | Bug/Melhoria | Prioridade | Status |
|---|---|---|---|
| `web/src/lib/types.ts` | BUG-A (AnalyticsFilter nullable) | 🔴 Alta | ⏳ Pendente |
| `web/src/lib/api/analytics.ts` | BUG-A (period opcional na API) | 🔴 Alta | ⏳ Pendente |
| `web/src/app/(app)/analytics/page.tsx` | BUG-A (estado inicial null) | 🔴 Alta | ⏳ Pendente |
| `web/src/components/analytics/analytics-filter-toggle.tsx` | BUG-A (deselecionar) | 🔴 Alta | ⏳ Pendente |
| `backend/src/analytics/analytics.service.ts` | BUG-B (TO_CHAR nas datas) | 🔴 Crítica | ⏳ Pendente |
| `web/src/lib/aggregate-by-period.ts` | BUG-B+C (normalização ISO) | 🔴 Crítica | ⏳ Pendente |
| `web/src/components/analytics/analytics-daily-balance-chart.tsx` | BUG-B+C (normalização ISO) | 🔴 Crítica | ⏳ Pendente |
| `web/src/components/analytics/analytics-timeline-chart.tsx` | BUG-B+C (normalização ISO) | 🔴 Crítica | ⏳ Pendente |
| `web/src/app/(app)/history/page.tsx` | PERF-004 (double-filter) | 🟡 Média | ⏳ Pendente |
| `backend/src/common/utils/period.util.ts` | Testes faltando | 🟢 Baixa | ⏳ Pendente |
| `backend/src/common/utils/forecast.util.ts` | Testes faltando | 🟢 Baixa | ⏳ Pendente |