# 📦 Estokar - Sistema de Gerenciamento de Estoque

O **Estokar** é uma solução completa para controle de inventário, desenvolvida como projeto acadêmico. O sistema oferece uma interface administrativa via web e um aplicativo mobile focado em mobilidade e operações de campo, ambos integrados a um backend robusto com suporte a sincronização offline.

---

## 🚀 Tecnologias

O projeto utiliza uma arquitetura moderna e escalável:

### **Backend**
- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL
- **ORM:** TypeORM
- **Autenticação:** JWT (JSON Web Token) e Google OAuth2
- **Documentação:** Swagger (disponível em `/api/docs`)

### **Frontend (Web)**
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Estilização:** Tailwind CSS
- **Gerenciamento de Estado:** TanStack Query (React Query)
- **UI Components:** Componentes customizados com foco em UX premium.

### **Mobile**
- **Plataforma:** [Expo](https://expo.dev/) / React Native
- **Banco Local:** SQLite (via `expo-sqlite`)
- **Sincronização:** Sistema de Outbox para operações offline.
- **Navegação:** Expo Router (File-based routing)

---

## ✨ Funcionalidades

- **Autenticação Segura:**
  - Login tradicional (e-mail/senha).
  - Login social com Google.
  - Recuperação de senha.
- **Gestão de Inventário:**
  - CRUD completo de Produtos e Categorias.
  - Controle de quantidade mínima (alerta de estoque baixo).
  - Upload de imagens para produtos.
- **Movimentações:**
  - Registro de Entradas e Saídas.
  - Histórico detalhado de movimentações.
- **Dashboard (Visão Operacional):**
  - Insights rápidos sobre itens com maior e menor estoque.
  - Gráficos e indicadores de saúde do inventário.
- **Mobilidade:**
  - Aplicativo mobile com funcionamento offline.
  - Sincronização automática quando há conexão.

---

## 📂 Estrutura do Projeto

```text
/
├── backend/       # API RESTful (NestJS)
├── web/           # Painel Administrativo (Next.js)
├── mobile/        # Aplicativo Móvel (Expo)
├── docs/          # Documentação Técnica e Diagramas (C4 Model)
└── docker-compose.yml
```

---

## 🛠️ Como Executar

### **Pré-requisitos**
- Docker e Docker Compose
- Node.js (v20+) e npm
- Expo Go (para testar o mobile em dispositivo real)

### **1. Configuração Rápida (Docker)**
Para subir o banco de dados, backend e frontend web simultaneamente:

```bash
docker-compose up --build
```

- **Web:** http://localhost:3001
- **API:** http://localhost:3000/api

### **2. Execução Manual**

#### **Backend**
```bash
cd backend
npm install
npm run start:dev
```

#### **Web**
```bash
cd web
npm install
npm run dev
```

#### **Mobile**
```bash
cd mobile
npm install
npx expo start
```

---

## 📄 Documentação Adicional

Para detalhes sobre a arquitetura do sistema, consulte a pasta [docs](./docs/diagrams/architecture.md), onde você encontrará diagramas C4 detalhando o contexto, contêineres e componentes do Estokar.

---

## ⚖️ Licença

Este projeto é para fins acadêmicos. Consulte os [Termos de Uso](./web/src/app/dashboard/settings/terms/page.tsx) e [Política de Privacidade](./web/src/app/dashboard/settings/privacy/page.tsx) dentro da aplicação para mais informações.