# Memória Viva

> Projeto Integrador da FATEC Jales para organizar e preservar fotografias, vídeos, áudios e histórias pessoais e familiares.

O **Memória Viva** é uma aplicação em **React Native + Expo** (interface web e mobile), com **API REST em Node.js/Express** e **PostgreSQL**. O sistema permite que pessoas autenticadas organizem lembranças em grupos privados e álbuns temáticos, com linha do tempo baseada na **data da lembrança**.

**Repositório de trabalho e integração:** [GuhNery/MemoriaViva](https://github.com/GuhNery/MemoriaViva). O desenvolvimento começou no [repositório de KauanMPL](https://github.com/KauanMPL/MemoriaViva); os commits originais e sua autoria são preservados no histórico do Git.

## Situação do projeto

Esta é uma **versão acadêmica em desenvolvimento**, não um serviço publicado para uso geral. Os fluxos são testados principalmente em ambiente local. A integração do banco de dados utiliza uma instância PostgreSQL no Neon, quando configurada pela equipe.

### Funcionalidades implementadas na versão de desenvolvimento

- Cadastro, login e edição de perfil do usuário (incluindo foto e idade).
- Criação e gerenciamento de **grupos privados** e suas capas.
- Convites para grupos: o administrador registra o convite por e-mail; o convidado o aceita ou recusa dentro do próprio aplicativo. **Não há envio automático de e-mail**.
- Criação, edição, capa e exclusão de álbuns pelo administrador do grupo.
- Envio de foto, vídeo ou áudio para uma lembrança com título, data, local e história.
- Data informada ao usuário no padrão brasileiro **DD/MM/AAAA**, convertida internamente para **AAAA-MM-DD** na API.
- Linha do tempo em ordem da data da lembrança, com opção de inverter a ordenação.
- Detalhes de cada mídia, edição/exclusão autorizada e comentários individuais.
- Remoção de integrante pelo administrador, com escolha de manter ou excluir as mídias dele no grupo.
- Confirmação por nome exato antes de excluir grupos ou álbuns.

Algumas funcionalidades têm limites conhecidos: **recuperação de senha por e-mail**, **links públicos de compartilhamento de mídias** e **armazenamento permanente compartilhado de arquivos na nuvem** ainda não foram concluídos. As telas web podem ser utilizadas no desenvolvimento, mas isso não substitui testes completos em dispositivos móveis.

## Tecnologias e organização

| Camada | Tecnologias | Responsabilidade |
| --- | --- | --- |
| Interface | React Native, Expo, JavaScript | Telas e interação com usuário |
| API | Node.js, Express, JWT, Multer | Autenticação, permissões, regras e uploads |
| Banco de dados | PostgreSQL, biblioteca `pg` | Usuários, grupos, álbuns, mídias e comentários |
| Banco remoto de desenvolvimento | Neon (quando configurado) | Hospedagem do PostgreSQL |
| Armazenamento dos arquivos | `backend/uploads/` no computador/servidor da API | Bytes das fotos, vídeos, áudios e capas |

Pastas principais:

```text
MemoriaViva/
  backend/
    db/migrations/          # SQL de estrutura e evolução do banco
    src/                    # Servidor, rotas, autenticação e conexão
    uploads/                # Arquivos recebidos: local e não versionado
    .env.example            # Modelo de variáveis; nunca publique .env
  frontend/
    App.js                  # Navegação e estado principal
    src/screens/            # Telas do aplicativo
    src/components/         # Componentes reutilizáveis
    src/services/api.js     # Comunicação HTTP com a API
    src/utils/memoryDate.js # Máscara de datas brasileiras
    tests/                  # Testes automatizados de datas
    .env.example            # Configuração de URL da API
  .github/workflows/        # Verificações automáticas
```

## Como executar localmente

### Requisitos

- [Git](https://git-scm.com/) e [Node.js](https://nodejs.org/) (recomendada a versão 22, usada na integração contínua).
- Banco PostgreSQL com o esquema do projeto; nos testes da equipe foi utilizado um banco de desenvolvimento no Neon.
- Acesso autorizado à string de conexão do banco e uma chave privada JWT.

### 1. Clonar o repositório

```bash
git clone https://github.com/GuhNery/MemoriaViva.git
cd MemoriaViva
```

Para testar alterações ainda não integradas à `main`, selecione a branch correspondente antes de instalar as dependências:

```bash
git switch feat/alinhamento-prototipo-etapa-1
```

### 2. Configurar e iniciar a API (terminal 1)

No **Windows (CMD)**:

```cmd
cd backend
copy .env.example .env
notepad .env
npm install
npm run check
npm run dev
```

Em **Linux/macOS**, substitua `copy .env.example .env` por `cp .env.example .env` e edite o arquivo em seu editor de preferência.

Defina no `backend/.env`: `DATABASE_URL` (conexão PostgreSQL autorizada), `JWT_SECRET` (segredo aleatório com pelo menos 32 caracteres), `PORT` (padrão `3001`) e `CORS_ORIGIN` (origens web autorizadas). **Nunca envie o `.env` para o GitHub, conversas públicas ou prints.** A variável `DATABASE_URL` inclui credenciais privadas.

Em um banco **novo e vazio**, o esquema de desenvolvimento está em `backend/db/migrations/001_baseline.sql` e as alterações complementares em `002_prototipo_campos.sql`, nessa ordem. **Não reaplique os scripts diretamente a um banco com dados sem conferir antes o esquema e fazer backup.**

Com a API em execução, abra [`http://localhost:3001/health`](http://localhost:3001/health). O retorno esperado quando o PostgreSQL está acessível contém `status: ok` e `database: connected`. O servidor iniciado, sozinho, não garante que o banco esteja conectado.

### 3. Iniciar o aplicativo (terminal 2)

Abra outro terminal na raiz do projeto:

```bash
cd frontend
npm install
npm run web -- --clear
```

Abra o endereço indicado pelo Expo; normalmente [`http://localhost:8081`](http://localhost:8081). Para usar outro host da API, configure `EXPO_PUBLIC_API_URL` no ambiente do front-end a partir de `frontend/.env.example`.

**Uso em celular:** `localhost` no celular aponta para o próprio aparelho, não para o computador. Configure a URL da API acessível pela rede e a origem permitida conforme o ambiente; verifique conectividade e permissões antes de testar. Não exponha uma API de desenvolvimento com credenciais reais na internet.

### 4. Testes disponíveis

```bash
cd backend
npm run check
```

```bash
cd frontend
npm run test:dates
npx expo export --platform web
```

O GitHub Actions executa as verificações automatizadas de sintaxe do back-end, a máscara/conversão de datas e a compilação web. **Isso não equivale a testes completos de integração, permissões, upload ou publicação em produção.**

## Por que as fotos de um computador não aparecem em outro?

**Os metadados das memórias ficam no PostgreSQL, mas os arquivos enviados são armazenados em `backend/uploads/` do computador que executou a API.**

Por exemplo, se uma foto foi enviada usando a API no PC de casa, acessar o mesmo banco de dados por uma API no notebook da escola mostrará o registro da memória, mas **não o arquivo da foto**. O GitHub não contém os arquivos privados enviados pelos usuários.

**Não apague nem recadastre registros para tentar resolver esse problema.** Preserve os arquivos originais e faça uma cópia de segurança antes de qualquer migração. A solução definitiva planejada é armazenar as mídias em um serviço persistente compartilhado, com controle de acesso e migração cuidadosa dos arquivos existentes.

Os arquivos são disponibilizados pela API mediante URLs temporárias assinadas e verificação de participação no grupo. Isso não substitui um armazenamento compartilhado ou uma revisão de segurança para publicação.

## Limitações e próximos passos

- Definir e implementar armazenamento de mídias persistente na nuvem, com migração dos arquivos locais existentes.
- Implementar efetivamente recuperação de senha por e-mail e envio de convites por e-mail, se aprovados pela equipe.
- Implementar links externos individuais de compartilhamento, respeitando permissões e privacidade.
- Ampliar os testes funcionais de permissões, exclusão, recuperação de erros, integração e uso mobile.
- Revisar dependências, backup, implantação e segurança antes de disponibilizar para terceiros.

## Histórico e colaboração

O projeto foi iniciado no repositório de [KauanMPL](https://github.com/KauanMPL/MemoriaViva) e continuou com contribuições no repositório de [GuhNery](https://github.com/GuhNery/MemoriaViva). O histórico de commits registra os autores e datas originais. Novas alterações devem ser desenvolvidas em branches e integradas por Pull Requests, evitando commits diretos na `main`.
