# Arquitetura do Projeto Estokar

Este documento descreve a arquitetura do sistema Estokar utilizando o modelo C4 para visualização.

## 1. Diagrama de Contexto de Sistema
O diagrama de contexto mostra como o sistema Estokar interage com os usuários.

```mermaid
C4Context
    title Diagrama de Contexto - Sistema Estokar

    Person(user, "Usuário/Gerente", "Gerencia o estoque, produtos e categorias.")
    System(estokar, "Estokar", "Sistema de gerenciamento de estoque.")

    Rel(user, estokar, "Gerencia estoque via Web ou Mobile")
```

## 2. Diagrama de Contêiner
O diagrama de contêiner mostra as tecnologias e como elas se comunicam.

```mermaid
C4Container
    title Diagrama de Contêiner - Sistema Estokar

    Person(user, "Usuário", "Gerente de Estoque")
    
    Container(web, "Web App", "Next.js, React", "Interface administrativa web.")
    Container(mobile, "Mobile App", "Expo, React Native", "Interface mobile para consulta e movimentação.")
    
    Container(api, "Backend API", "NestJS, TypeScript", "API RESTful para lógica de negócio.")
    ContainerDb(db, "Database", "PostgreSQL", "Armazena dados de produtos, categorias, usuários e movimentações.")

    Rel(user, web, "Acessa via browser", "HTTPS")
    Rel(user, mobile, "Acessa via smartphone", "HTTPS")
    
    Rel(web, api, "Consome API", "JSON/HTTPS")
    Rel(mobile, api, "Consome API", "JSON/HTTPS")
    
    Rel(api, db, "Lê/Escreve", "TypeORM/PostgreSQL")
```

## 3. Diagrama de Componentes (Backend)
Detalhamento dos componentes internos do Backend.

```mermaid
C4Component
    title Diagrama de Componentes - Backend API

    Container(web, "Web/Mobile", "Frontend")
    
    Boundary(api, "Backend API") {
        Component(auth, "Auth Module", "NestJS Module", "Gerencia autenticação JWT e OAuth.")
        Component(products, "Products Module", "NestJS Module", "Lógica de gerenciamento de produtos.")
        Component(categories, "Categories Module", "NestJS Module", "Gerenciamento de categorias.")
        Component(stock, "Stock Module", "NestJS Module", "Gerencia movimentações de entrada e saída.")
        Component(users, "Users Module", "NestJS Module", "Gerencia perfis de usuários.")
    }
    
    ContainerDb(db, "Database", "PostgreSQL")

    Rel(web, auth, "Autentica", "JSON/HTTPS")
    Rel(web, products, "Gerencia produtos", "JSON/HTTPS")
    Rel(web, stock, "Registra movimentos", "JSON/HTTPS")
    
    Rel(products, categories, "Usa")
    Rel(products, stock, "Usa")
    
    Rel(products, db, "Persiste", "TypeORM")
    Rel(categories, db, "Persiste", "TypeORM")
    Rel(stock, db, "Persiste", "TypeORM")
    Rel(users, db, "Persiste", "TypeORM")
    Rel(auth, db, "Verifica credenciais", "TypeORM")
```
