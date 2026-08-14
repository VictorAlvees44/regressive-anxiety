# Guia de Deploy — Regressive Anxiety

Este guia assume que você **não** tem experiência prévia com Firebase, GitHub Actions ou linha de comando avançada. Siga na ordem, sem pular etapas. No final, você terá:

- O código no seu GitHub.
- Um projeto Firebase real (login com Google + banco de dados + notificações).
- O site publicado e acessível de qualquer dispositivo (celular, tablet, computador), instalável como app (PWA).

Tempo estimado: 45–90 minutos na primeira vez.

---

## Sumário

0. [O que você vai precisar](#0-o-que-você-vai-precisar)
1. [Extrair o projeto e instalar as ferramentas](#1-extrair-o-projeto-e-instalar-as-ferramentas)
2. [Criar o projeto no Firebase](#2-criar-o-projeto-no-firebase)
3. [Ativar o login com Google](#3-ativar-o-login-com-google)
4. [Criar o banco de dados (Firestore)](#4-criar-o-banco-de-dados-firestore)
5. [Pegar as credenciais do Firebase e configurar o `.env.local`](#5-pegar-as-credenciais-do-firebase-e-configurar-o-envlocal)
6. [Rodar o projeto no seu computador (teste local)](#6-rodar-o-projeto-no-seu-computador-teste-local)
7. [Instalar o Firebase CLI e publicar as regras de segurança](#7-instalar-o-firebase-cli-e-publicar-as-regras-de-segurança)
8. [Ativar as notificações push (Cloud Messaging + Cloud Function)](#8-ativar-as-notificações-push-cloud-messaging--cloud-function)
9. [Conseguir as chaves das APIs de jogos/filmes/séries](#9-conseguir-as-chaves-das-apis-de-jogosfilmesséries)
10. [Criar o repositório no GitHub e enviar o código](#10-criar-o-repositório-no-github-e-enviar-o-código)
11. [Cadastrar os "secrets" no GitHub](#11-cadastrar-os-secrets-no-github)
12. [Ativar o GitHub Pages](#12-ativar-o-github-pages)
13. [Publicar (deploy) e conferir se está no ar](#13-publicar-deploy-e-conferir-se-está-no-ar)
14. [Instalar o app no celular (PWA)](#14-instalar-o-app-no-celular-pwa)
15. [Testar com as duas contas (você e sua parceira)](#15-testar-com-as-duas-contas-você-e-sua-parceira)
16. [Como atualizar o site depois (dia a dia)](#16-como-atualizar-o-site-depois-dia-a-dia)
17. [Solução de problemas comuns](#17-solução-de-problemas-comuns)
18. [Privacidade: o site fica público?](#18-privacidade-o-site-fica-público)

---

## 0. O que você vai precisar

- Uma conta Google (a sua, `chavosso16@gmail.com`, e a da Gabrielly, `gabrielly.gsena@gmail.com` — ambas já são contas Gmail, então o login com Google funciona diretamente, sem nenhuma etapa extra de configuração).
- Uma conta GitHub (grátis): [github.com/join](https://github.com/join).
- Um computador (Windows, Mac ou Linux) para rodar os comandos de configuração inicial.
- Cerca de 1 hora de tempo livre, sem pressa.

---

## 1. Extrair o projeto e instalar as ferramentas

### 1.1 Extrair o zip

Extraia `regressive-anxiety.zip` em uma pasta de fácil acesso, por exemplo:

- Windows: `C:\Users\SeuUsuario\Projetos\regressive-anxiety`
- Mac/Linux: `~/Projetos/regressive-anxiety`

### 1.2 Instalar o Node.js

O projeto precisa do Node.js versão 20 ou superior.

1. Acesse [nodejs.org](https://nodejs.org/).
2. Baixe a versão **LTS** (recomendada).
3. Instale normalmente (avançar, avançar, concluir).
4. Confirme a instalação abrindo um terminal:
   - Windows: pesquise por "Prompt de Comando" ou "PowerShell" no menu Iniciar.
   - Mac: abra o app "Terminal" (Spotlight → digite "Terminal").
   - Linux: você já sabe abrir um terminal 🙂
5. Digite:
   ```bash
   node -v
   ```
   Deve aparecer algo como `v20.x.x` ou superior. Se aparecer "comando não encontrado", reinstale o Node.js e reinicie o computador.

### 1.3 Instalar um editor de código (recomendado)

Baixe o [Visual Studio Code](https://code.visualstudio.com/) (gratuito). Ele facilita muito editar arquivos como o `.env.local` mais adiante.

### 1.4 Abrir a pasta do projeto no terminal

No terminal, navegue até a pasta onde você extraiu o zip. Exemplo (ajuste o caminho para o seu):

```bash
cd ~/Projetos/regressive-anxiety
```

Dica: no VS Code, você pode abrir a pasta do projeto (**Arquivo → Abrir Pasta...**) e depois usar o menu **Terminal → Novo Terminal**, o que já abre o terminal na pasta certa automaticamente.

### 1.5 Instalar as dependências do projeto

Ainda no terminal, dentro da pasta do projeto:

```bash
npm install
```

Isso vai baixar tudo que o projeto precisa para funcionar (pode levar 1–3 minutos). Ao final, você verá uma pasta nova chamada `node_modules` — é normal, não mexa nela.

---

## 2. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2. Faça login com sua conta Google.
3. Clique em **"Adicionar projeto"** (ou "Criar projeto").
4. Dê um nome, por exemplo: `regressive-anxiety`.
5. O Firebase vai sugerir um "ID do projeto" único (algo como `regressive-anxiety-a1b2c`). Anote esse ID — você vai precisar dele depois. Pode aceitar o sugerido.
6. Na etapa do Google Analytics, você pode **desativar** (não é necessário para este projeto). Clique em "Continuar" / "Criar projeto".
7. Aguarde a criação (uns 30 segundos) e clique em "Continuar" quando terminar.

Você está agora no **Painel do projeto** no Firebase.

---

## 3. Ativar o login com Google

1. No menu lateral esquerdo, clique em **Build → Authentication**.
2. Clique em **"Vamos começar"** (Get started).
3. Na lista de provedores, clique em **Google**.
4. Ative a chavinha ("Enable").
5. Selecione um "e-mail de suporte do projeto" (pode ser o seu mesmo).
6. Clique em **Salvar**.

Pronto — o login com Google está ativo para o seu projeto.

---

## 4. Criar o banco de dados (Firestore)

1. No menu lateral, clique em **Build → Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha a localização do servidor. Para usuários no Brasil, `southamerica-east1 (São Paulo)` é a melhor escolha para menor latência. **Atenção: essa escolha é definitiva, não dá para mudar depois** — mas para um app pessoal como este, qualquer região funciona bem, então não se preocupe demais.
4. Em "Regras de segurança iniciais", escolha **"Iniciar em modo de produção"** (produção = mais seguro por padrão; vamos substituir pelas regras do projeto no passo 7 de qualquer forma).
5. Clique em **Ativar**.

O banco de dados está criado (vazio por enquanto — as regras de segurança reais serão publicadas no passo 7).

---

## 5. Pegar as credenciais do Firebase e configurar o `.env.local`

1. No Firebase, clique no ícone de engrenagem ⚙️ ao lado de "Visão geral do projeto" (canto superior esquerdo) → **Configurações do projeto**.
2. Role até a seção **"Seus aplicativos"**.
3. Clique no ícone `</>` (Web) para criar um app da Web.
4. Dê um apelido, por exemplo `regressive-anxiety-web`. **Não** marque a opção de configurar Firebase Hosting (não vamos usar — o site fica no GitHub Pages).
5. Clique em **Registrar app**.
6. O Firebase vai mostrar um bloco de código parecido com este:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "regressive-anxiety-a1b2c.firebaseapp.com",
     projectId: "regressive-anxiety-a1b2c",
     storageBucket: "regressive-anxiety-a1b2c.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456",
   };
   ```

7. **Volte para a pasta do projeto** (no VS Code ou no explorador de arquivos) e localize o arquivo `.env.example` na raiz.
8. Faça uma cópia desse arquivo e renomeie a cópia para `.env.local` (mesma pasta).
9. Abra `.env.local` no editor de texto e preencha assim, usando os valores que o Firebase te deu:

   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=regressive-anxiety-a1b2c.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=regressive-anxiety-a1b2c
   VITE_FIREBASE_STORAGE_BUCKET=regressive-anxiety-a1b2c.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   VITE_FIREBASE_VAPID_KEY=
   ```

   Deixe `VITE_FIREBASE_VAPID_KEY` em branco por enquanto — vamos preencher no passo 8.

10. Salve o arquivo.

> **Importante:** o arquivo `.env.local` nunca deve ser enviado ao GitHub (ele já está protegido pelo `.gitignore` do projeto). As credenciais do Firebase Web SDK não são "secretas" no sentido de senha — mas mesmo assim mantemos esse arquivo fora do controle de versão como boa prática, e usaremos "Secrets" do GitHub para o ambiente de produção (passo 11).

---

## 6. Rodar o projeto no seu computador (teste local)

No terminal, dentro da pasta do projeto:

```bash
npm run dev
```

Você verá algo como:

```
  VITE ready
  ➜  Local:   http://localhost:5173/
```

Abra esse endereço no navegador. Você deve ver a tela inicial do Regressive Anxiety, com a saudação, frase do dia e eventos de exemplo.

Teste o login: vá em **Administração** (ícone de escudo no menu, ou acesse `http://localhost:5173/login`) e clique em **"Entrar com Google"**. Faça login com `chavosso16@gmail.com` ou `gabrielly.gsena@gmail.com` (os dois e-mails já configurados como administradores no código). Se tudo estiver certo, você entra no painel administrativo.

Para parar o servidor local, volte ao terminal e pressione `Ctrl + C`.

---

## 7. Instalar o Firebase CLI e publicar as regras de segurança

O "Firebase CLI" é uma ferramenta de linha de comando para gerenciar seu projeto Firebase (regras de segurança, funções, etc.) direto do terminal.

### 7.1 Instalar

```bash
npm install -g firebase-tools
```

(O `-g` instala globalmente no seu computador, não só neste projeto.)

Confirme:

```bash
firebase --version
```

### 7.2 Fazer login

```bash
firebase login
```

Isso abre o navegador para você autorizar com sua conta Google. Autorize.

### 7.3 Conectar o projeto local ao projeto Firebase

Ainda na pasta do projeto, abra o arquivo `.firebaserc` e substitua `SEU_PROJETO_FIREBASE_AQUI` pelo **ID do projeto** que você anotou no passo 2 (ex.: `regressive-anxiety-a1b2c`):

```json
{
  "projects": {
    "default": "regressive-anxiety-a1b2c"
  }
}
```

Salve o arquivo.

### 7.4 Publicar as regras de segurança do Firestore

```bash
firebase deploy --only firestore:rules
```

Isso envia o conteúdo de `firestore.rules` para o seu projeto Firebase. A partir de agora, só os dois e-mails administradores conseguem criar/editar/excluir dados — qualquer outra pessoa só consegue visualizar.

---

## 8. Ativar as notificações push (Cloud Messaging + Cloud Function)

Esta etapa é **opcional** — o app funciona perfeitamente sem ela, só não enviará avisos automáticos antes dos eventos. Se quiser pular por agora, vá direto para o [passo 9](#9-conseguir-as-chaves-das-apis-de-jogosfilmesséries) e volte aqui depois.

### 8.1 Ativar o plano Blaze (pay-as-you-go)

Cloud Functions exige o plano **Blaze** do Firebase (o Firestore e a Authentication continuam de graça no plano Spark, mas Functions precisa do Blaze). O Blaze tem uma cota gratuita generosa por mês — para um app de uso pessoal como este, é extremamente improvável que você pague algo.

1. No Console do Firebase, clique no nome do plano (canto inferior esquerdo, algo como "Spark") → **Fazer upgrade**.
2. Escolha **Blaze** e siga as instruções (é necessário cadastrar um cartão, mas você só paga se ultrapassar a cota gratuita mensal, o que não deve acontecer aqui).

### 8.2 Pegar a chave VAPID (necessária para notificações web)

1. No Console do Firebase: **Configurações do projeto** ⚙️ → aba **Cloud Messaging**.
2. Role até **"Certificados push da Web"**.
3. Clique em **"Gerar par de chaves"**.
4. Copie a chave gerada.
5. Cole no seu `.env.local`, na linha `VITE_FIREBASE_VAPID_KEY=`.

### 8.3 Instalar as dependências da Cloud Function e publicar

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Esse comando pode levar alguns minutos na primeira vez. Ao final, o terminal mostra os endereços das funções publicadas, algo como:

```
✔  functions[verificarNotificacoesDiarias(us-central1)] Successful create operation.
✔  functions[testarNotificacoes(us-central1)] Successful create operation.
Function URL (testarNotificacoes): https://us-central1-regressive-anxiety-a1b2c.cloudfunctions.net/testarNotificacoes
```

A função `verificarNotificacoesDiarias` roda sozinha, todo dia às 9h (horário de Brasília). A `testarNotificacoes` é um endereço que você pode abrir no navegador a qualquer momento para forçar uma verificação manual (útil para testar).

### 8.4 Ativar as notificações no app

Depois que o site estiver publicado (veja os próximos passos) e você estiver logado como administrador:

1. Vá em **Administração**.
2. No cartão "Notificações push", clique em **Ativar**.
3. Aceite a permissão de notificações que o navegador pedir.

Repita esse passo em cada dispositivo/navegador onde você quiser receber os avisos (ex.: celular e computador contam como dispositivos separados).

---

## 9. Conseguir as chaves das APIs de jogos/filmes/séries

Essas chaves alimentam a tela de **Sugestões**. Você pode pular qualquer uma delas — o app funciona com o que estiver disponível.

### 9.1 TMDB (filmes e séries) — recomendado, fácil de obter

1. Crie uma conta em [themoviedb.org](https://www.themoviedb.org/signup).
2. Confirme seu e-mail.
3. Acesse [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
4. Clique em **"Solicitar uma chave de API"**, escolha "Uso pessoal/desenvolvedor" e preencha o formulário simples (pode usar "aplicativo pessoal, sem fins comerciais" como descrição).
5. Copie a **"Chave de API (v3 auth)"**.

### 9.2 IGDB (jogos) — recomendado pela especificação, requer conta Twitch

A IGDB usa autenticação via Twitch Developer:

1. Crie/entre com uma conta em [twitch.tv](https://www.twitch.tv/).
2. Acesse [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps) e faça login.
3. Clique em **"Registrar seu aplicativo"**.
4. Nome: `regressive-anxiety-sync` (ou outro nome único). URL de redirecionamento OAuth: `https://localhost` (não será usada de fato, mas é obrigatória). Categoria: "Application Integration".
5. Após criar, copie o **Client ID**.
6. Clique em **"Nova Chave Secreta"** (New Secret) e copie o **Client Secret**.

### 9.3 RAWG (alternativa/fallback para jogos) — mais simples que a IGDB

1. Crie uma conta em [rawg.io/login](https://rawg.io/login).
2. Acesse [rawg.io/apidocs](https://rawg.io/apidocs) e clique em **"GET API KEY"**.
3. Copie a chave gerada.

Guarde as quatro chaves (TMDB, IGDB Client ID, IGDB Client Secret, RAWG) — você vai colá-las no GitHub daqui a pouco.

---

## 10. Criar o repositório no GitHub e enviar o código

### 10.1 Criar o repositório

1. Acesse [github.com/new](https://github.com/new).
2. Nome do repositório: `regressive-anxiety` (pode ser outro nome, mas lembre-se dele).
3. Visibilidade: veja a nota sobre privacidade no [passo 18](#18-privacidade-o-site-fica-público) antes de decidir entre Público ou Privado.
4. **Não** marque nenhuma opção de inicialização (sem README, sem .gitignore, sem license) — o projeto já vem com tudo isso.
5. Clique em **"Create repository"**.

O GitHub vai mostrar uma tela com comandos. Vamos usar a opção "…or push an existing repository from the command line".

### 10.2 Enviar o código

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Primeiro commit: Regressive Anxiety"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/regressive-anxiety.git
git push -u origin main
```

Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub. Se for a primeira vez usando Git nesse computador, ele pode pedir para configurar seu nome/e-mail antes do `commit`:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Depois disso, repita o `git commit` acima.

Ao rodar `git push`, o GitHub pode abrir uma janela do navegador pedindo para você autorizar o acesso — autorize com sua conta GitHub.

---

## 11. Cadastrar os "secrets" no GitHub

"Secrets" são variáveis sigilosas que o GitHub Actions usa durante o build, sem expô-las publicamente no código.

1. No seu repositório no GitHub, vá em **Settings** (aba do repositório, não da conta) → **Secrets and variables → Actions**.
2. Clique em **"New repository secret"** para cada um dos itens abaixo, um de cada vez (nome exatamente como escrito, valor conforme você anotou nos passos anteriores):

| Nome do secret | Valor (de onde vem) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `.env.local` (passo 5) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env.local` (passo 5) |
| `VITE_FIREBASE_PROJECT_ID` | `.env.local` (passo 5) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env.local` (passo 5) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env.local` (passo 5) |
| `VITE_FIREBASE_APP_ID` | `.env.local` (passo 5) |
| `IGDB_CLIENT_ID` | Twitch Developer Console (passo 9.2) |
| `IGDB_CLIENT_SECRET` | Twitch Developer Console (passo 9.2) |
| `RAWG_API_KEY` | RAWG (passo 9.3) |
| `TMDB_API_KEY` | TMDB (passo 9.1) |

> Repare que `VITE_FIREBASE_VAPID_KEY` também deve ser cadastrada se você configurou o passo 8, para o build de produção sair com as notificações push habilitadas:

| Nome do secret | Valor |
|---|---|
| `VITE_FIREBASE_VAPID_KEY` | Cloud Messaging (passo 8.2) |

Se alguma chave de API você optou por pular (ex.: não criou conta na IGDB), simplesmente não cadastre o secret correspondente — o workflow de sincronização lida bem com chaves ausentes (usa o que estiver disponível).

---

## 12. Ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **"Build and deployment" → "Source"**, selecione **"GitHub Actions"**.
3. Não é necessário fazer mais nada aqui — o workflow `.github/workflows/publicar.yml` já está configurado para cuidar do resto.

---

## 13. Publicar (deploy) e conferir se está no ar

Se você já fez o `git push` no passo 10, o deploy provavelmente **já rodou automaticamente** (o workflow dispara em todo push na branch `main`).

1. No repositório, clique na aba **Actions**.
2. Você verá uma execução chamada **"Publicar no GitHub Pages"**. Clique nela para acompanhar o progresso.
3. Quando os dois jobs (`build` e `deploy`) ficarem com ✅ verde, seu site está no ar.
4. O endereço será:

   ```
   https://SEU_USUARIO.github.io/regressive-anxiety/
   ```

   (ajuste `SEU_USUARIO` e `regressive-anxiety` conforme seu usuário/nome do repositório).

Se a Action falhar (❌ vermelho), clique nela para ver o log de erro — a causa mais comum é um secret com nome digitado errado. Veja também a seção de [solução de problemas](#17-solução-de-problemas-comuns).

> Dica: rode manualmente a sincronização de sugestões pela primeira vez para não esperar o horário agendado: aba **Actions → Sincronizar dados públicos → Run workflow**.

---

## 14. Instalar o app no celular (PWA)

### iPhone (Safari)

1. Abra o link do site no Safari (precisa ser o Safari, não Chrome).
2. Toque no ícone de compartilhamento (quadrado com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. Confirme o nome e toque em **"Adicionar"**.

### Android (Chrome)

1. Abra o link do site no Chrome.
2. Toque no menu (três pontinhos, canto superior direito).
3. Toque em **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. Confirme.

### Computador (Chrome/Edge)

1. Abra o site.
2. Na barra de endereço, clique no ícone de instalação (um monitor com uma seta, geralmente à direita da URL).
3. Clique em **"Instalar"**.

O app passa a abrir como um aplicativo próprio, sem as barras do navegador, e funciona offline para o que já foi carregado antes.

---

## 15. Testar com as duas contas (você e sua parceira)

1. Envie o link do site (`https://SEU_USUARIO.github.io/regressive-anxiety/`) para a Gabrielly.
2. Cada um deve acessar **Administração → Entrar com Google**, usando o e-mail correspondente (`chavosso16@gmail.com` ou `gabrielly.gsena@gmail.com`).
3. Qualquer evento criado, editado ou favoritado por um dos dois aparece instantaneamente para o outro (dados compartilhados no Firestore) — pode levar alguns segundos para o outro dispositivo atualizar se ele não recarregar a página.
4. Qualquer outra pessoa que acessar o link consegue **ver** os eventos, mas não editar nada (perfil "visitante").

---

## 16. Como atualizar o site depois (dia a dia)

Sempre que você (ou eu, em uma próxima sessão) alterar o código:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O GitHub Actions builda e publica automaticamente em 1–3 minutos. Nenhum passo manual adicional é necessário.

Se você alterou `firestore.rules`, publique manualmente também:

```bash
firebase deploy --only firestore:rules
```

Se você alterou algo em `functions/`, publique manualmente:

```bash
firebase deploy --only functions
```

(Esses dois últimos comandos não são automatizados pelo GitHub Actions neste projeto — são publicados via Firebase CLI, no seu computador, quando você decidir que estão prontos.)

---

## 17. Solução de problemas comuns

**"A Action de build falhou logo no início, com erro relacionado a secrets."**
Confira se todos os nomes dos secrets em **Settings → Secrets and variables → Actions** estão exatamente iguais aos da tabela do passo 11 (maiúsculas/minúsculas importam).

**"O site abre, mas o login com Google não funciona (erro auth/unauthorized-domain)."**
No Console do Firebase → Authentication → Settings → "Domínios autorizados", adicione `SEU_USUARIO.github.io`.

**"Criei um evento como admin, mas ele não aparece para o outro admin."**
Confira se as regras do Firestore foram publicadas (`firebase deploy --only firestore:rules`) e se ambos estão logados com os e-mails corretos. Tente atualizar a página (F5) no outro dispositivo.

**"As notificações não chegam."**
Confirme: (1) plano Blaze ativado, (2) `VITE_FIREBASE_VAPID_KEY` preenchida antes do build, (3) a função foi publicada (`firebase deploy --only functions`), (4) você clicou em "Ativar" no cartão de notificações **depois** do site publicado com a chave VAPID correta, (5) teste manualmente abrindo a URL da função `testarNotificacoes` no navegador.

**"Mudei o `.env.local` mas o site publicado não refletiu a mudança."**
`.env.local` só afeta o `npm run dev` local. Para produção, os valores vêm dos **Secrets do GitHub** (passo 11) — atualize-os lá e faça um novo commit/push (ou re-rode a Action manualmente em **Actions → Publicar no GitHub Pages → Run workflow**).

**"Esqueci de anotar o ID do projeto Firebase."**
Ele aparece em Configurações do projeto ⚙️ → "ID do projeto", no Console do Firebase.

---

## 18. Privacidade: o site fica público?

Sim — assim como qualquer site no GitHub Pages, a **URL** (`https://seu-usuario.github.io/regressive-anxiety/`) é acessível por qualquer pessoa que a conheça, mesmo que o repositório de código seja privado. O código-fonte fica privado se você marcar o repositório como privado, mas o **site publicado** (o resultado do build) é sempre uma URL pública por padrão do GitHub Pages no plano gratuito.

Isso é mitigado por dois fatores já no projeto:

1. **Ninguém consegue adivinhar a URL** a menos que você a compartilhe — não há indexação especial nem link público em nenhum lugar.
2. **Somente os dois e-mails administradores conseguem criar, editar ou excluir qualquer dado** — qualquer outra pessoa que abrir o link só consegue visualizar (modo "visitante"), e nem isso é muito útil sem saber a URL.

Se isso não for suficiente para o seu caso de uso (por exemplo, se dados como datas de viagem forem muito sensíveis), as opções são: (a) usar uma URL difícil de adivinhar e nunca divulgá-la, ou (b) migrar a hospedagem para um provedor com autenticação de acesso ao próprio site (fora do escopo deste guia, pois contraria o requisito original do projeto de usar GitHub Pages).
