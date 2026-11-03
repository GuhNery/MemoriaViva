# 🧠 Memória Viva

> Uma plataforma mobile para registrar, organizar e preservar memórias, conectando pessoas e histórias em um único lugar.

O **Memória Viva** é uma aplicação mobile desenvolvida com **React Native e Expo**, com o objetivo de permitir o registro, a organização e o compartilhamento de memórias.

O projeto utiliza uma arquitetura cliente-servidor, integrando um aplicativo mobile, uma API REST hospedada na nuvem e um banco de dados PostgreSQL.

---

## 🚀 Tecnologias utilizadas

### 📱 Frontend
- React Native
- Expo
- JavaScript
- AsyncStorage

### ⚙️ Backend
- Node.js
- Express
- API REST
- JWT (JSON Web Token)

### 🗄️ Banco de dados e infraestrutura
- PostgreSQL
- [Neon](https://neon.tech/) — hospedagem do banco de dados.
- [Render](https://render.com/) — hospedagem do backend.

---

## 🏗️ Arquitetura do projeto

O sistema utiliza uma arquitetura cliente-servidor, dividida em três camadas:

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | React Native + Expo | Interface e interação com o usuário |
| Backend | Node.js + Express | API, autenticação e regras de negócio |
| Banco de dados | PostgreSQL + Neon | Armazenamento persistente das informações |

### Fluxo de comunicação

```text
┌──────────────────────────┐
│     Aplicativo Mobile    │
│     React Native / Expo  │
└────────────┬─────────────┘
             │ HTTP / HTTPS
             ▼
┌──────────────────────────┐
│       Backend API        │
│     Node.js / Express    │
│         Render           │
└────────────┬─────────────┘
             │ Conexão segura SSL
             ▼
┌──────────────────────────┐
│       PostgreSQL         │
│          Neon            │
└──────────────────────────┘
```

O aplicativo não acessa diretamente o banco de dados. Todas as operações são realizadas por meio da API REST.

---

## 📂 Estrutura do projeto

```text
MemoriaViva/
│
└── frontend/
    ├── App.js
    ├── src/
    │   ├── services/
    │   │   └── api.js
    │   ├── theme/
    │   │   └── styles.js
    │   ├── components/
    │   │   ├── ui.js
    │   │   └── AppLayout.js
    │   └── screens/
    │       ├── Onboarding.js
    │       ├── Memories.js
    │       └── Account.js
    └── package.json
```

### Organização dos componentes

| Arquivo | Descrição |
|---|---|
| `App.js` | Inicialização, gerenciamento de sessão e navegação principal. |
| `api.js` | Comunicação com a API, URL do backend e funções auxiliares. |
| `styles.js` | Estilos compartilhados da aplicação. |
| `ui.js` | Componentes reutilizáveis da interface. |
| `AppLayout.js` | Cabeçalho, abas e estrutura das telas autenticadas. |
| `Onboarding.js` | Boas-vindas, login, cadastro e recuperação de acesso. |
| `Memories.js` | Dashboard, timeline e gerenciamento de memórias. |
| `Account.js` | Gerenciamento de membros e configurações. |

---

## ☁️ Infraestrutura e hospedagem

O projeto possui sua infraestrutura hospedada em serviços externos, permitindo que o aplicativo funcione sem a necessidade de executar o backend ou o banco de dados localmente.

| Serviço | Plataforma |
|---|---|
| Backend API | [Render](https://render.com/) |
| Banco de dados PostgreSQL | [Neon](https://neon.tech/) |

### Backend — Render

A API REST está hospedada no Render e é responsável por:

- Autenticação e gerenciamento de usuários.
- Processamento das requisições do aplicativo.
- Aplicação das regras de negócio.
- Gerenciamento de grupos e memórias.
- Comunicação com o banco de dados.

### Banco de dados — Neon

O banco de dados PostgreSQL está hospedado no Neon, oferecendo armazenamento persistente das informações da aplicação.

A conexão é realizada exclusivamente pelo backend, utilizando credenciais protegidas e comunicação SSL.

---

## 💻 Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) — versão LTS.
- [Git](https://git-scm.com/).
- [Expo Go](https://expo.dev/go/) ou emulador Android.

### 1. Clone o repositório

```bash
git clone https://github.com/KauanMPL/MemoriaViva.git
```

### 2. Acesse a pasta do frontend

```bash
cd MemoriaViva/frontend
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o aplicativo

```bash
npx expo start
```

Após iniciar o Expo, utilize o QR Code para abrir o aplicativo no Expo Go ou execute-o em um emulador Android.

> **Importante:** a URL da API já está configurada no projeto. Não é necessário configurar um backend ou banco de dados local para executar o aplicativo.

---

## 🔐 Segurança

O projeto adota algumas práticas para proteger as informações:

- Autenticação utilizando JWT.
- Credenciais do banco de dados protegidas no backend.
- Comunicação entre frontend e backend por API REST.
- Conexão segura com o PostgreSQL utilizando SSL.
- Separação entre frontend, backend e infraestrutura de dados.

---

## 🎯 Objetivo do projeto

O Memória Viva busca oferecer uma solução tecnológica para registrar, organizar e preservar memórias, integrando desenvolvimento mobile, construção de APIs REST, autenticação de usuários e banco de dados relacional em uma infraestrutura hospedada na nuvem.
