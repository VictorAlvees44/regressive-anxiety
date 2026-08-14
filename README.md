# Regressive Anxiety

PWA pessoal e privado para acompanhar estreias de **jogos, filmes e séries** — e, opcionalmente, viagens, datas pessoais, finanças e mais. Feito para um casal, com visual de catálogo e sem deixar aquela estreia enorme passar despercebida.

> Este projeto **não** é uma rede social, agenda ou app de produtividade. É a sua programação de entretenimento, com um pouquinho de ansiedade saudável.
>
> Procurando o passo a passo prático de "extrair o zip até funcionar no celular"? Veja **[GUIA-DEPLOY.md](./GUIA-DEPLOY.md)**. Este README é a referência técnica/arquitetural do projeto.

---

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [Como rodar os testes](#como-rodar-os-testes)
- [Como publicar no GitHub Pages](#como-publicar-no-github-pages)
- [Como funciona a sincronização automática](#como-funciona-a-sincronização-automática)
- [Como atualizar as APIs](#como-atualizar-as-apis)
- [Autenticação e segurança](#autenticação-e-segurança)
- [Notificações push](#notificações-push)
- [Pré-venda de ingressos (filmes)](#pré-venda-de-ingressos-filmes)
- [Como adicionar uma nova categoria](#como-adicionar-uma-nova-categoria)
- [Como adicionar novas frases do dia](#como-adicionar-novas-frases-do-dia)
- [Como adicionar novos templates de notificação](#como-adicionar-novos-templates-de-notificação)
- [Como adicionar um novo provedor de dados](#como-adicionar-um-novo-provedor-de-dados)
- [Como alterar temas](#como-alterar-temas)
- [Limitações conhecidas](#limitações-conhecidas)
- [Como contribuir futuramente](#como-contribuir-futuramente)
- [Histórico de mudanças](#histórico-de-mudanças)

---

## Stack

- **React 19 + TypeScript + Vite** — build rápido, tipagem forte.
- **Tailwind CSS v4** — tokens de design centralizados em `src/styles/globals.css` (`@theme`).
- **Framer Motion** — todas as transições e animações.
- **React Router** — roteamento client-side com lazy loading por página.
- **Firebase Authentication (Google) + Firestore** — login e dados compartilhados do casal.
- **Firebase Cloud Messaging + Cloud Functions** — notificações push reais.
- **vite-plugin-pwa (estratégia `injectManifest`)** — manifesto + service worker próprio (offline + push).
- **Vitest + Testing Library** — testes automatizados.
- Hospedagem: **GitHub Pages** (site 100% estático).

O único "backend" de fato é uma única Cloud Function agendada (`functions/`), usada exclusivamente para disparar as notificações push — algo que não é possível fazer de forma confiável só no cliente. Todo o resto (autenticação, dados, hospedagem) continua serverless/estático como no desenho original.

## Arquitetura

O projeto combina três fontes de dados:

```
APIs externas e feeds oficiais (IGDB/Steam/Epic/Nintendo/PlayStation/Xbox/TMDB/Wikidata/TVmaze)  Firestore (Auth + dados do casal)  Cloud Function agendada
        |  1x/dia via Actions                |  tempo real, leitura p/ visitantes    |  1x/dia, 09h
        v                                     v  escrita só p/ os 2 admins            v
public/data/sugestoes.json          coleções `eventos` e `listaDesejos`     lê `eventos` + tokens FCM
(lançamentos sugeridos)              (compartilhadas entre os 2 admins)      envia push via FCM
        \                                     |                                     |
         \____________________  App React (PWA)  _______________________/
                          consome as três fontes conforme a tela
```

- **Dados públicos** (sugestões de lançamentos e notícias): nunca buscados em tempo real pelo navegador. O workflow `sincronizar-dados.yml` roda uma vez por dia, consulta IGDB, Steam/Valve, Epic Games Store, os feeds oficiais da Nintendo, PlayStation e Xbox, TMDB, Wikidata, TVmaze e o feed do Google News e grava `public/data/sugestoes.json`. O app só lê esse arquivo (`src/lib/sugestoesRepositorio.ts`).
- **Dados do casal** (eventos, favoritos, lista de desejos): vivem em coleções Firestore de nível raiz — **compartilhadas entre os dois administradores**, já que é o painel de um casal, não dados isolados por conta. Protegidas por `firestore.rules`: leitura para qualquer autenticado, escrita só para os dois e-mails admin.
- **Notificações**: os tokens de dispositivo (FCM) ficam em `tokensNotificacao/{uid}/dispositivos/{token}` (privados por admin). Uma Cloud Function agendada (`functions/index.js`) roda 1x/dia, cruza os eventos com a data de hoje e envia os pushes correspondentes.

### Modo de demonstração (sem Firebase configurado)

`src/lib/eventosRepositorio.ts` e `src/lib/listaDesejosRepositorio.ts` tentam o Firestore primeiro; se a chamada falhar (Firebase não configurado, offline, etc.), caem automaticamente para um `localStorage` local semeado com os dados mock do repositório. Isso permite rodar `npm run dev` e navegar o app inteiro sem nenhum projeto Firebase real — útil para desenvolvimento e para review de código.

## Estrutura de pastas

```
src/
  components/
    ui/           componentes de interface genéricos (Button, GlassCard, Badge, ThemeToggle)
    layout/       casca da aplicação (AppShell, Sidebar, TabBar, Header, RotaProtegida, NotificacoesCard)
    events/       componentes de domínio (EventCard, EventList, EventForm, CountdownTimer)
  contexts/       React Contexts globais (Theme, Auth, Eventos)
  data/           catálogos e bancos estáticos (categorias, frases, templates) + mocks de dev
  hooks/          hooks reutilizáveis (useCountdown, useSaudacao, useFraseDoDia, filtros, calendário)
  lib/            camada de dados e utilitários (firebase.ts, *Repositorio.ts, notificacoesPush.ts, utils.ts)
  pages/          uma página por rota
  styles/         globals.css (tokens de design Tailwind v4)
  types/          tipos centrais do domínio (fonte única de verdade)
  sw.ts           service worker customizado (cache offline + push em segundo plano)
  test/           setup dos testes automatizados
scripts/
  sincronizar-dados.mjs   script executado pela GitHub Action diária
functions/                Cloud Function que envia as notificações push agendadas
  index.js                função agendada + endpoint HTTP de teste manual
  notificacoes.js         motor de templates (espelha src/data/notificacoes.ts)
.github/workflows/
  sincronizar-dados.yml   sincronização diária das sugestões
  publicar.yml            build + deploy no GitHub Pages
firestore.rules           regras de segurança do Firestore
firebase.json             config do Firebase CLI (rules + functions)
GUIA-DEPLOY.md            passo a passo detalhado de configuração e publicação
```

## Como executar

Pré-requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu projeto Firebase
npm run dev
```

O app abre em `http://localhost:5173`. Sem um `.env.local` preenchido, a tela de login não autentica de fato, mas o restante do app funciona no [modo de demonstração](#modo-de-demonstração-sem-firebase-configurado).

## Como rodar os testes

```bash
npm run test          # roda a suíte uma vez (CI-friendly)
npm run test:watch    # modo watch, para desenvolvimento
```

Os testes cobrem principalmente lógica pura (a parte mais valiosa de testar e menos frágil a mudanças visuais):

- `src/lib/utils.test.ts` — `cn`, `formatarData`, `gerarId`.
- `src/data/notificacoes.test.ts` — motor de geração de mensagens de notificação.
- `src/hooks/useEventosFiltrados.test.ts` — filtros, ordenação e `useProximosEventos`.
- `src/hooks/useCountdown.test.ts` — cálculo da contagem regressiva e o hook (com timers falsos).
- `functions/notificacoes.test.js` — motor de templates do lado da Cloud Function.

## Como publicar no GitHub Pages

Veja o passo a passo completo em **[GUIA-DEPLOY.md](./GUIA-DEPLOY.md)**. Resumo:

1. Habilite o GitHub Pages: **Settings → Pages → Source: GitHub Actions**.
2. Cadastre os secrets do repositório (Firebase + APIs de sincronização + `VITE_FIREBASE_VAPID_KEY`).
3. Push na branch `main` → `.github/workflows/publicar.yml` builda e publica automaticamente.

## Como funciona a sincronização automática

O workflow `.github/workflows/sincronizar-dados.yml` roda todos os dias às 05:00 UTC (ou manualmente em **Actions → Run workflow**). Executa `scripts/sincronizar-dados.mjs`, que busca jogos no IGDB, Steam/Valve e Epic Games Store — com destaque na tela para Steam, PlayStation 5 e Xbox Series — e inclui atualizações publicadas pela Nintendo, PlayStation e Xbox. Filmes vêm do TMDB e Wikidata, séries do TMDB e TVmaze, e as notícias do feed do Google News. Comunicados das fabricantes aparecem identificados como “Atualização oficial”, sem fingir que a data da notícia é uma estreia. Em seguida, grava `public/data/sugestoes.json` e comita o resultado. O app nunca chama essas fontes diretamente.

## Como atualizar as APIs

Edite os secrets do repositório (não há chaves no código). Para mudar a frequência, ajuste o `cron` em `sincronizar-dados.yml`.

## Autenticação e segurança

- Login exclusivamente via **Google** (Firebase Authentication) — `src/lib/firebase.ts`.
- Apenas dois e-mails têm permissão de administrador (`EMAILS_ADMINISTRADORES` em `firebase.ts`, replicado em `firestore.rules`). Qualquer outra conta autenticada é **visitante** (somente leitura).
- `/admin` é protegida no cliente por `RotaProtegida`, mas a segurança real vive nas **Firestore Security Rules**: nenhuma escrita de e-mail não autorizado é aceita pelo backend.
- Publique `firestore.rules` via Firebase CLI: `firebase deploy --only firestore:rules`.

## Notificações push

Fluxo completo, do dispositivo até o envio:

1. **Ativação** (`src/lib/notificacoesPush.ts`, botão no painel Admin via `NotificacoesCard`): o admin autoriza notificações no navegador, o app obtém um token do Firebase Cloud Messaging e salva em `tokensNotificacao/{uid}/dispositivos/{token}`.
2. **Recebimento em segundo plano** (`src/sw.ts`): o service worker escuta `onBackgroundMessage` e exibe a notificação do sistema, mesmo com o app fechado.
3. **Envio** (`functions/index.js`): uma Cloud Function agendada roda 1x/dia (09h, horário de Brasília), verifica quais eventos estão a 7, 3 ou 1 dia de distância (ou são hoje), monta a mensagem com `functions/notificacoes.js` (mesmos templates de `src/data/notificacoes.ts`) e envia via `admin.messaging().sendEachForMulticast`. Toda segunda-feira também envia um resumo semanal consolidado. A mesma execução também verifica `dataPreVendaISO` (veja [Pré-venda de ingressos](#pré-venda-de-ingressos-filmes)). Tokens inválidos são removidos automaticamente do Firestore.

Deploy da função: `firebase deploy --only functions` (detalhado no GUIA-DEPLOY.md). Para testar sem esperar o agendamento, use o endpoint HTTP `testarNotificacoes` com um Firebase ID token de uma conta administradora; ele não aceita mais chamadas anônimas.

> Nota de arquitetura: notificações push exigem um disparo do lado do servidor em algum ponto — não é possível agendar de forma confiável com o app fechado usando apenas JavaScript no navegador. Por isso esta é a única peça do projeto que roda fora do GitHub Pages (uma Cloud Function do Firebase, plano gratuito Spark/Blaze conforme volume).

## Pré-venda de ingressos (filmes)

Não existe API pública/oficial que informe quando abre a pré-venda de ingressos de um filme (Ingresso.com, Cinemark e demais redes não expõem isso para desenvolvedores, e o projeto tem a regra explícita de nunca fazer scraping). Como essa informação normalmente é anunciada nas redes sociais/imprensa antes de aparecer em qualquer lugar automatizável, a solução adotada foi torná-la um **campo manual**:

- No painel Admin, ao criar/editar um evento da categoria **Filmes**, aparece o campo opcional **"Data de pré-venda dos ingressos"** (`EventForm.tsx`).
- Quando preenchido, o `EventCard` exibe um selo (`SeloPreVenda`) indicando "Pré-venda em X dias", "Pré-venda começa hoje" ou "Pré-venda já está aberta", calculado a partir de `dataPreVendaISO`.
- A Cloud Function agendada (`functions/index.js`) verifica esse campo todo dia e, quando a data chega, dispara uma notificação push dedicada (gatilho `pre-venda-hoje`, com templates próprios em `src/data/notificacoes.ts` e `functions/notificacoes.js` — mantidos em espelho, como os demais).

Se um dia surgir uma API oficial para isso, a substituição é isolada: trocar a etapa manual do `EventForm` por uma consulta automática em `scripts/sincronizar-dados.mjs`, preenchendo `dataPreVendaISO` já na sugestão antes mesmo de virar evento.

## Como adicionar uma nova categoria

1. Adicione o novo `id` em `CategoriaId` (`src/types/index.ts`).
2. Registre nome, ícone (lucide-react) e cor em `CATALOGO_CATEGORIAS` (`src/data/categorias.ts`).
3. Se a cor for nova, adicione o token `--color-cat-<nome>` em `src/styles/globals.css` e importe o ícone em `CategoriaBadge.tsx`.
4. Se opcional, inclua o id em `CATEGORIAS_OPCIONAIS`.
5. Se a categoria deve gerar notificações com personalidade própria, adicione um template em `src/data/notificacoes.ts` **e** em `functions/notificacoes.js` (mapeamento `categoriaParaTipoTemplate`).

## Como adicionar novas frases do dia

Edite `src/data/frases.ts` e adicione novas strings no array da categoria desejada. `useFraseDoDia` já cuida da seleção determinística e evita repetir a frase do dia anterior.

## Como adicionar novos templates de notificação

Edite **os dois** arquivos (mantidos em espelho por serem executados em ambientes diferentes — navegador vs. Cloud Function):

- `src/data/notificacoes.ts` (usado apenas como referência/testes no frontend hoje)
- `functions/notificacoes.js` (usado de fato no envio)

Adicione strings com os placeholders `{titulo}` e `{dias}` no array do tipo desejado.

## Como adicionar um novo provedor de dados

1. Em `scripts/sincronizar-dados.mjs`, crie `buscarDoNovoProvedor()` retornando objetos no formato `SugestaoLancamento`.
2. Chame-a em `main()` e concatene ao array final.
3. Adicione as variáveis de ambiente no `.env.example` e como secret no workflow.

## Como alterar temas

Tokens de design em `src/styles/globals.css` (`@theme`, Tailwind v4). Tema claro/escuro via `ThemeContext` (classe `.dark` + `localStorage`).

## Limitações conhecidas

- **Bundle de ícones**: `lucide-react` não faz tree-shaking perfeito com o bundler atual, gerando um chunk maior que o ideal (~530 KB antes da compressão). Não afeta funcionalidade; é uma otimização futura (ex.: importar SVGs individualmente ou trocar por outra lib de ícones).
- **Duplicação dos templates de notificação**: por rodarem em ambientes diferentes (browser vs. Node/Cloud Functions) sem um pacote compartilhado configurado, `src/data/notificacoes.ts` e `functions/notificacoes.js` precisam ser atualizados juntos.
- **Cloud Function é a única peça fora do GitHub Pages**: veja a nota em [Notificações push](#notificações-push).

## Como contribuir futuramente

- Mantenha `src/types/index.ts` como fonte única de verdade do domínio.
- UI genérica em `components/ui`; UI de domínio em `components/events`.
- Toda fonte de dados nova passa por `src/lib/*Repositorio.ts` — nunca acesse `fetch`/Firestore direto em componentes.
- Rode `npm run test` e `npm run build` antes de abrir um PR.
- **Atualize este README a cada mudança relevante de arquitetura** — ele deve sempre refletir o estado real do código.

## Histórico de mudanças

- **v0.3** — Pré-venda de ingressos para filmes: campo manual `dataPreVendaISO` (não existe API pública para isso — Ingresso.com/Cinemark não expõem essa informação), selo/contagem no `EventCard`, campo condicional no `EventForm` (só aparece para categoria "Filmes"), notificação push própria no dia em que a pré-venda abre (`functions/index.js` + templates dedicados em `src/data/notificacoes.ts` e `functions/notificacoes.js`).
- **v0.2** — Migração de `localStorage` para Firestore (coleções compartilhadas `eventos`/`listaDesejos`), notificações push reais (FCM + Cloud Function agendada + service worker customizado via `injectManifest`), suíte de testes automatizados (Vitest), guia de deploy passo a passo (`GUIA-DEPLOY.md`).
- **v0.1** — Scaffold inicial: React + TypeScript + Vite + Tailwind v4 + Framer Motion, todas as páginas e componentes, autenticação Google, Firestore Security Rules, sincronização diária via GitHub Actions, PWA básico, deploy automático no GitHub Pages.
