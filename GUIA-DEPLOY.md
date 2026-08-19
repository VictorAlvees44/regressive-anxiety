# Guia de publicação

Este é o caminho do “tenho os arquivos” até “está no celular”. Faça com calma: são várias telas, mas nenhuma exige capa, espada ou café às três da manhã.

## 1. Instale o necessário

- Node.js 24 ou mais recente.
- Git.
- Uma conta no GitHub.
- Um projeto Firebase, se quiser login, dados compartilhados e notificações.

No PowerShell, dentro da pasta do projeto:

```powershell
npm install
npm run build
npm run lint
```

Se os dois últimos comandos terminarem sem erro, siga em frente.

## 2. Crie o repositório no GitHub

1. Entre em <https://github.com/new>.
2. Crie um repositório chamado `regressive-anxiety`.
3. Não marque a opção para adicionar README, `.gitignore` ou licença: o projeto já trouxe os próprios móveis.
4. Copie a URL do repositório.

Se o projeto ainda não estiver conectado ao GitHub:

```powershell
git init
git branch -M main
git add -A
git commit -m "Primeira publicação"
git remote add origin https://github.com/SEU_USUARIO/regressive-anxiety.git
git push -u origin main
```

Para enviar alterações futuras:

```powershell
git add -A
git commit -m "Descreva aqui a mudança"
git pull --rebase origin main
git push origin main
```

## 3. Ligue o GitHub Pages

1. Abra o repositório e vá em **Settings → Pages**.
2. Em **Build and deployment**, escolha **GitHub Actions**.
3. Abra a aba **Actions**.
4. Espere a Action **Publicar no GitHub Pages** ficar verde.

O site ficará em:

```text
https://SEU_USUARIO.github.io/regressive-anxiety/
```

## 4. Configure as chaves do catálogo

Abra **Settings → Secrets and variables → Actions → New repository secret**. Cadastre:

| Nome | Onde obter | Necessário para |
| --- | --- | --- |
| `TMDB_API_KEY` | [TMDB](https://www.themoviedb.org/settings/api) | filmes, séries, capas e disponibilidade no Brasil |
| `RAWG_API_KEY` | [RAWG](https://rawg.io/apidocs) | jogos populares e capas |
| `IGDB_CLIENT_ID` | [Twitch Developer Console](https://dev.twitch.tv/console/apps) | catálogo IGDB |
| `IGDB_CLIENT_SECRET` | Twitch Developer Console | autenticação IGDB |

O segredo do TMDB é o mais importante para a área de filmes. Sem ele, o catálogo de filmes fica sem combustível.

Depois de salvar as chaves:

1. Abra **Actions**.
2. Clique em **Sincronizar dados públicos**.
3. Clique em **Run workflow**.
4. Selecione `main` e confirme em **Run workflow**.
5. Aguarde o ✓ verde.

A Action atualiza `public/data/sugestoes.json`, cria um commit automático e o Pages publica a nova vitrine.

## 5. Firebase: login, dados e notificações

Se você quer apenas a vitrine de sugestões, pode pular esta parte.

1. Crie um projeto em <https://console.firebase.google.com/>.
2. Adicione um aplicativo Web e copie a configuração.
3. Em **Authentication → Sign-in method**, ative Google.
4. Em **Firestore Database**, crie o banco em modo de produção.
5. Em **Project settings → Cloud Messaging**, gere a chave VAPID.

Cadastre no GitHub os secrets abaixo:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
```

Também adicione `SEU_USUARIO.github.io` em **Authentication → Settings → Authorized domains**.

Para publicar regras e funções, com o Firebase CLI já conectado ao seu projeto:

```powershell
npx firebase-tools deploy --only firestore:rules
npx firebase-tools deploy --only functions
```

As funções exigem faturamento habilitado no Firebase quando o projeto ultrapassa o que o plano gratuito cobre. O console explica isso sem muito carinho, mas explica.

## 6. Instale no iPhone

1. Abra o site no Safari.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Abra pelo novo ícone de ampulheta.

Depois de uma atualização grande, feche o app no seletor de aplicativos e abra novamente. Se ainda estiver vendo a versão antiga, remova o atalho e adicione-o de novo.

## 7. Se algo der errado

| Sintoma | O que verificar |
| --- | --- |
| Página 404 | Use o endereço com `/regressive-anxiety/` no final. |
| Filmes vazios | Confirme `TMDB_API_KEY` e rode **Sincronizar dados públicos**. |
| Jogos sem capas | Confirme `RAWG_API_KEY` e execute a sincronização. |
| Login Google falha | Adicione o domínio do GitHub Pages aos domínios autorizados do Firebase. |
| Notificações não chegam | Confira VAPID, publicação das funções e permissão do navegador. |
| Ícone antigo no iPhone | Feche o PWA; se persistir, remova e adicione o atalho novamente. |

Pronto. Agora o catálogo pode trabalhar sozinho enquanto você decide o que assistir ou jogar primeiro — a parte realmente difícil.
