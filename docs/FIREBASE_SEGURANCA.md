# Publicação segura do Firebase

As regras usam documentos vazios em `administradores/{uid}` como lista de
acesso. Os UIDs não ficam no bundle nem no repositório público e o cliente não
pode ler, listar ou alterar essa coleção.

## Migração inicial

1. No Firebase Console, abra **Authentication → Users** e copie o UID de cada
   administrador autorizado.
2. Em **Firestore Database**, crie a coleção `administradores` e um documento
   vazio para cada UID. O ID do documento deve ser exatamente o UID.
3. Ainda antes do deploy, confirme que todos os administradores esperados têm
   documento cadastrado.
4. Autentique a CLI e publique as regras:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project regressive-anxiety-85edc
   ```

5. Entre no app com uma conta administradora e com uma conta visitante. A
   administradora deve acessar agenda e lista de desejos; a visitante deve ser
   bloqueada.

## Remoção definitiva das notificações antigas

Depois de autenticar a CLI, confira as funções implantadas e remova a antiga
rotina agendada, se ela ainda existir:

```bash
npx firebase-tools functions:list --project regressive-anxiety-85edc
npx firebase-tools functions:delete verificarNotificacoesDiarias --region us-central1 --project regressive-anxiety-85edc
```

O frontend não registra tokens nem solicita permissão de notificações. O
segredo `VITE_FIREBASE_VAPID_KEY` também não é mais necessário no GitHub.
