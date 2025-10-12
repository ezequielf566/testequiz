# Quiz IA Builder – GPT Preview (seguro)
- Backend seguro `/api/generate` (usa OPENAI_API_KEY). Se vazio, usa modo gratuito local.
- Preview direto no navegador + botão **Baixar ZIP**.

## Rodar
```
npm i
npm run dev
# http://localhost:3000
```
Crie `.env` (ou use `.env.example`):
```
OPENAI_API_KEY=sk-COLOQUE_AQUI  # opcional
OPENAI_MODEL=gpt-4o-mini
```
