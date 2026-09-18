# Regressive Anxiety

Um PWA para não deixar jogo, filme, série ou aquela viagem tão esperada passar batido. É uma agenda de entretenimento com uma pitada saudável de “faltam quantos dias mesmo?”.

O projeto está pronto para uso em <https://victoralvees44.github.io/regressive-anxiety/>.

## O que ele faz

- Abre em **Filmes**, com espaços próprios para **Séries** e **Jogos**.
- Filtra jogos por Steam, PC, Xbox e PlayStation. Steam exige loja confirmada; PC não implica Steam.
- Separa jogos de notícias oficiais das plataformas.
- Oferece uma biblioteca com “Quero ver/jogar”, “Em andamento”, “Finalizado” e notas de 1 a 5.
- Usa as avaliações para refinar as recomendações e oculta finalizados por padrão (com opção de reexibir).
- Abre detalhes com sinopse, elenco, gêneros, links, notícias e trailer quando informado pela fonte.
- Mostra versão instalada e avisa quando há uma nova versão pronta para atualizar.
- Organiza contagens regressivas de jogos, filmes, séries e eventos pessoais.
- Mostra sugestões atualizadas de jogos e entretenimento.
- Mantém jogos relevantes visíveis mesmo depois do lançamento.
- Prioriza escolhas pessoais de plataformas e serviços, salvas no próprio aparelho.
- Exibe a saúde da última sincronização e permite recarregar o catálogo sem reinstalar o PWA.
- Mostra 24 sugestões por vez, com botão para continuar explorando quando quiser.
- Pesquisa por título, ator, gênero ou plataforma.
- Oferece uma curadoria inteligente e explicável, ajustada por preferências, eventos acompanhados, favoritos e feedback.
- Mantém todo o histórico de recomendação no próprio aparelho, sem enviar hábitos pessoais para serviços externos.
- Filtra filmes recentes disponíveis no Brasil e acompanha estreias e relançamentos confirmados, mesmo quando as APIs ainda não os destacam.
- Mantém séries recentes disponíveis nos serviços brasileiros escolhidos.
- Dá prioridade a jogos relevantes de PlayStation, Xbox e PC, sem encher a estante com conteúdo adulto ou promoções aleatórias.
- Permite acompanhar uma sugestão e transformá-la em evento.
- Funciona como aplicativo instalado no celular, inclusive em iPhone.

## Como rodar no computador

Você precisa do Node.js 24 ou mais recente.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abra o endereço informado no terminal. Sem as credenciais do Firebase, a navegação continua disponível em modo local — o app não faz drama por isso.

## Verificação de manutenção

Confira estes comandos:

```bash
npm test
npm run build
npm run lint
```

Os testes cobrem filtros, biblioteca, avaliações, ranking, links seguros, datas Steam, navegação direta no GitHub Pages e renderização de componentes (sem navegador). O workflow de publicação exige testes e lint antes do build.

## Biblioteca e privacidade

A biblioteca não muda a agenda compartilhada: “Finalizado” significa que você assistiu/jogou, não apenas que passou a data do lançamento. Um snapshot de cada título mantém o histórico mesmo depois que ele sai do catálogo diário.

Nesta versão, o uso local exige a escolha explícita **Usar neste aparelho**. Os dados são salvos somente neste navegador, não entre dispositivos. Limpar os dados do site apaga o histórico; **Exportar backup** salva um JSON. A interface não sobrescreve silenciosamente um histórico local corrompido e informa falhas de gravação.

A integração opcional com a conta Google está preparada, mas **desativada por padrão** (`VITE_BIBLIOTECA_NUVEM=false`). Para habilitá-la, publique primeiro `firestore.rules` no projeto Firebase, valide acesso por proprietário e negação entre usuários e então configure a variável de repositório `VITE_BIBLIOTECA_NUVEM=true` no GitHub Actions. A publicação no Pages não publica regras do Firebase. Os dados de conta ficam em `bibliotecas/{uid}/itens/{id}`. Biblioteca local e biblioteca de conta não são migradas nem misturadas automaticamente.

Não habilite essa variável antes de validar as regras. Os testes locais desta entrega não incluem o Firebase em produção.

## Catálogo de sugestões

O navegador não conversa diretamente com serviços externos. Uma Action do GitHub monta `public/data/sugestoes.json` uma vez por dia.

| Tipo | Fontes |
| --- | --- |
| Jogos | RAWG, IGDB, GOG, PlayStation e Xbox; Steam e Epic entram apenas como apoio |
| Filmes | TMDB (streaming brasileiro, cinemas e próximas estreias) e destaques confirmados por fontes oficiais |
| Séries | TMDB, com lançamentos recentes disponíveis no Brasil pelos catálogos selecionados |
| Notícias | Google News em português do Brasil |

Os segredos abaixo ficam em **Settings → Secrets and variables → Actions** no GitHub:

| Secret | Para quê |
| --- | --- |
| `RAWG_API_KEY` | jogos populares e capas |
| `TMDB_API_KEY` | filmes, séries, capas e disponibilidade no Brasil |
| `IGDB_CLIENT_ID` | catálogo de jogos da IGDB |
| `IGDB_CLIENT_SECRET` | autenticação da IGDB |

Sem `TMDB_API_KEY`, filmes e a maior parte das séries não conseguem aparecer. Sem `RAWG_API_KEY`, o catálogo ainda funciona, só perde uma ótima fonte de jogos e imagens.

Estreias e relançamentos oficiais que escapam dos filtros automáticos ficam em `scripts/destaques-filmes.mjs`, com data e fonte verificadas. A sincronização rejeita uma queda acentuada de itens por categoria para não publicar um catálogo incompleto durante falhas temporárias das APIs.

O catálogo se atualiza diariamente às 2h da manhã (horário de Brasília). O botão **Atualizar** apenas recarrega a versão mais recente já publicada — ele não expõe chaves nem dispara uma coleta no seu celular, porque o app é curioso, mas não inconsequente.

## Curadoria inteligente

A aba **Para você** usa um recomendador baseado em conteúdo. Ele cruza gênero, elenco, plataforma, categoria, proximidade do lançamento e relevância do catálogo com as preferências e os títulos que já foram acompanhados ou favoritados. Cada card explica os principais motivos da posição no ranking.

O botão **Não é para mim** reduz a prioridade de itens parecidos e oculta aquela sugestão. Preferências e feedback ficam no `localStorage` do aparelho, e os itens dispensados podem ser reexibidos no radar de preferências. O recurso não depende de uma chave de IA, não aumenta o custo da hospedagem e continua funcionando offline.

Notas 4–5 reforçam afinidades; notas 1–2 reduzem sugestões semelhantes. O mesmo título não é contabilizado três vezes por aparecer na biblioteca, agenda e histórico. Não há geração de texto por uma API de IA: os motivos são explicáveis e baseados nos sinais disponíveis.

### Jogos de PC

A coleta Steam consulta os detalhes de cada jogo porque o feed de destaques não informa uma data de lançamento confiável. Ignora DLCs, wallpapers, datas vagas e conteúdo inadequado, e usa avaliações/relevância para selecionar títulos. As chamadas são limitadas a 24 candidatos e possuem timeout. Não há chamada direta à Steam pelo navegador.

Para atualizar **somente a Steam**, preservando as demais fontes e sua data de sincronização:

```bash
node scripts/sincronizar-dados.mjs --somente-steam
```

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
  sw.ts          cache offline do PWA
scripts/
  sincronizar-dados.mjs   monta o catálogo público diário
  destaques-filmes.mjs    estreias e relançamentos confirmados
.github/workflows/
  publicar.yml            publica o site
  sincronizar-dados.yml   atualiza as sugestões
```

## Limitações honestas

- A disponibilidade de um filme em cinema varia por cidade e sessão. O app indica que ele está em cartaz no Brasil, não promete a poltrona exata do shopping da esquina.
- Capas dependem dos provedores. Se uma imagem sair do ar, o app mostra a capa padrão em vez de deixar um buraco feio no catálogo.
- Uma atualização do PWA aparece no aviso **Nova versão disponível**. Use **Mais → Verificar atualização** para procurar uma nova versão e conferir a versão instalada. Não é necessário apagar dados nem reinstalar o aplicativo para atualizar.
- Trailers dependem da fonte e da próxima sincronização do catálogo. Não são inventados quando ausentes.
- O GitHub Pages continua estático: `404.html` restaura links diretos de detalhes. Os metadados de títulos mudam no navegador, mas prévias de redes sociais que não executam JavaScript usam a imagem geral do app.

## Manutenção sem estragar a festa

- Use `npm test`, `npm run build` e `npm run lint` antes de enviar alterações.
- Não coloque chaves de API no código ou no Git.
- Atualize este README quando a arquitetura mudar.
- Prefira fontes oficiais e conteúdos em português do Brasil.
