# Quiz IA Builder — Completo (GPT-4 + Vercel KV)

## Ambiente
Crie `.env` com:
```
OPENAI_API_KEY=sk-COLE_AQUI
KV_REST_API_URL=https://api.kv.vercel-storage.com
KV_REST_API_TOKEN=COLE_AQUI
```

## Rodar
```
npm i
npm run dev
# http://localhost:3000
```

## Fluxo
- Preencha o gabarito (campos em branco).
- Clique **Gerar quiz e ver preview** → o app chama GPT-4, aplica templates e salva no KV (TTL 7 dias).
- Abra o link `/preview/{id}` (público, apenas visualização, com marca d'água).
- Clique **Baixar ZIP completo (teste)** para baixar o projeto final (na produção você bloqueará via checkout).

## Deploy Vercel
- Importar este repo
- Em Settings → Env vars, adicione: `OPENAI_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- Deploy

## Observações
- A lógica/estrutura do quiz final vêm do template Mustache (IDs/classes intactos).
- O preview serve HTML/CSS/JS combinados diretamente do KV (sem expor arquivos brutos).
- Expiração automática: 7 dias. Após expirar, a rota mostra uma tela de expiração com CTA.
