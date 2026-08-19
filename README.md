# Regressive Anxiety

Um PWA para não deixar jogo, filme, série ou aquela viagem tão esperada passar batido. É uma agenda de entretenimento com uma pitada saudável de “faltam quantos dias mesmo?”.

## O que ele faz

- Organiza contagens regressivas de jogos, filmes, séries e eventos pessoais.
- Mostra sugestões atualizadas de jogos e entretenimento.
- Mantém jogos relevantes visíveis mesmo depois do lançamento.
- Filtra filmes disponíveis no Brasil em Netflix, Prime Video, Disney+, Max e salas de cinema.
- Permite acompanhar uma sugestão e transformá-la em evento.
- Funciona como aplicativo instalado no celular, inclusive em iPhone.
- Envia notificações quando configurado com Firebase.

## Como rodar no computador

Você precisa do Node.js 24 ou mais recente.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abra o endereço informado no terminal. Sem as credenciais do Firebase, a navegação continua disponível em modo local — o app não faz drama por isso.

## Antes de publicar

Confira estes comandos:

```bash
npm run build
npm run lint
```

Se ambos terminarem sem erro, a mala está pronta para viajar ao GitHub.

## Catálogo de sugestões

O navegador não conversa diretamente com serviços externos. Uma Action do GitHub monta `public/data/sugestoes.json` uma vez por dia.

| Tipo | Fontes |
| --- | --- |
| Jogos | RAWG, IGDB, Steam, Epic, PlayStation e Xbox |
| Filmes | TMDB, limitado à disponibilidade brasileira e cinema |
| Séries | TMDB e TVmaze como reserva |
| Notícias | Google News em português do Brasil |

Os segredos abaixo ficam em **Settings → Secrets and variables → Actions** no GitHub:

| Secret | Para quê |
| --- | --- |
| `RAWG_API_KEY` | jogos populares e capas |
| `TMDB_API_KEY` | filmes, séries, capas e disponibilidade no Brasil |
| `IGDB_CLIENT_ID` | catálogo de jogos da IGDB |
| `IGDB_CLIENT_SECRET` | autenticação da IGDB |

Sem `TMDB_API_KEY`, filmes e a maior parte das séries não conseguem aparecer. Sem `RAWG_API_KEY`, o catálogo ainda funciona, só perde uma ótima fonte de jogos e imagens.

Para atualizar agora, abra **Actions → Sincronizar dados públicos → Run workflow**. A Action cria um commit com o catálogo renovado. Em seguida, o GitHub Pages publica o resultado.

## Publicação

O deploy é automático: envie alterações para a branch `main` e aguarde a Action **Publicar no GitHub Pages** ficar verde.

O endereço do projeto é:

<https://victoralvees44.github.io/regressive-anxiety/>

Para o passo a passo sem mistério, veja [GUIA-DEPLOY.md](./GUIA-DEPLOY.md).

## Estrutura do projeto

```text
src/
  components/    interface e componentes reutilizáveis
  contexts/      autenticação, tema e eventos
  data/          categorias, frases e dados locais de reserva
  hooks/         lógica reutilizável da interface
  lib/           Firebase, repositórios e utilitários
  pages/         telas do app
  styles/        cores e estilos globais
  sw.ts          cache offline e notificações em segundo plano
scripts/
  sincronizar-dados.mjs   monta o catálogo público diário
functions/
  index.js                envia notificações agendadas
.github/workflows/
  publicar.yml            publica o site
  sincronizar-dados.yml   atualiza as sugestões
```

## Notificações

As notificações dependem do Firebase Cloud Messaging e da Cloud Function em `functions/`. Elas checam os eventos diariamente às 9h, no horário de Brasília. Para ativá-las, configure o Firebase seguindo o guia de deploy e habilite o cartão de notificações no painel de administração.

## Limitações honestas

- A disponibilidade de um filme em cinema varia por cidade e sessão. O app indica que ele está em cartaz no Brasil, não promete a poltrona exata do shopping da esquina.
- Capas dependem dos provedores. Se uma imagem sair do ar, o app mostra a capa padrão em vez de deixar um buraco feio no catálogo.
- O PWA pode manter arquivos antigos em cache. Depois de uma publicação grande, feche e abra o app; no iPhone, se necessário, remova o atalho e adicione novamente.

## Contribuindo sem estragar a festa

- Use `npm run build` e `npm run lint` antes de enviar alterações.
- Não coloque chaves de API no código ou no Git.
- Atualize este README quando a arquitetura mudar.
- Prefira fontes oficiais e conteúdos em português do Brasil.
