# Guia de revisão de código — bfin

## Idioma

**Todos os comentários de review devem ser em português brasileiro.** Mensagens, sumários, sugestões e títulos — tudo em PT-BR. Termos técnicos podem permanecer em inglês (ex.: `useEffect`, `middleware`, `webhook`).

## Escopo do review

Comente **apenas** sobre problemas **críticos**. Ignore qualquer outra coisa.

Considere crítico:

- Vulnerabilidades de segurança (XSS, SQL injection, SSRF, path traversal, CSRF ausente, secrets vazados em código).
- Falhas de autenticação ou autorização (rota sensível sem checagem de sessão, bypass de admin, IDOR).
- Validação ausente em endpoint público que recebe input do usuário.
- Webhook sem verificação de assinatura HMAC quando o provedor exige.
- Bugs claros que vão estourar em produção (null deref garantido, race condition em código de pagamento, escrita em DB sem `await`).
- Risco de perda de dados (migration destrutiva, `DELETE` sem `WHERE`, drop de coluna usada).
- Performance que efetivamente quebra a aplicação (loop O(n²) em path quente com n grande, query N+1 sem limite, leak de memória óbvio).

**Não** comente sobre:

- Estilo, formatação, nomenclatura, ordem de imports.
- Refatorações cosméticas, extração de helpers, "poderia ser mais DRY".
- Ausência de testes ou cobertura.
- Performance especulativa em código frio.
- Documentação faltando, comentário ausente, JSDoc.
- Preferências de paradigma (functional vs imperativo, etc.).
- Sugestões de bibliotecas alternativas.

## Regras específicas do projeto bfin

As violações abaixo são **sempre críticas** neste repositório.

### Autenticação e autorização

- **Comparar `session.user.email` com string literal** para checar admin é proibido. Use `session.user.isAdmin` no client/server component, ou `isAdmin(email)` de `src/lib/admin.ts` em rotas API. Comparações tipo `email === "alguem@dominio.com"` em rota administrativa são bug de segurança.
- Toda rota em `src/app/api/admin/**` precisa chamar `auth()` e bloquear não-admin com `403`.
- Rotas que recebem `userId`/`accountMemberId` em path ou body devem validar que o caller é dono ou membro autorizado (risco de IDOR).

### Server-only e secrets

- Arquivos em `src/lib` que tocam DB, secrets de env (`process.env.*` sensível) ou chamam APIs autenticadas devem importar `'server-only'` no topo.
- Variável referenciada em client component (`"use client"`) precisa do prefixo `NEXT_PUBLIC_`. Referenciar `process.env.X` sem prefixo no client retorna `undefined` em runtime — é bug, não estilo.
- Nunca logar secret (token, password hash, refresh_token, app_secret).

### Prisma

- Não instanciar `new PrismaClient()` em código novo. Usar `prisma` exportado de `src/lib/prisma.ts` (singleton, evita esgotar pool de conexões em dev).
- Migration com `DROP COLUMN`, `DROP TABLE`, `ALTER ... DROP`, ou rename de coluna existente é crítica — exige plano de rollback e idealmente migration multi-passo (add → backfill → drop em release posterior).
- Query em loop sobre coleção (sintoma N+1) num path quente: usar `findMany({ where: { id: { in: [...] } } })` ou `include` em vez de iterar.

### WhatsApp (rotas `/api/whatsapp/*`)

- Endpoint `POST /api/whatsapp/webhook` **deve** validar `X-Hub-Signature-256` (HMAC SHA256 do body bruto com `WHATSAPP_APP_SECRET`) antes de processar. Falta ou bypass da verificação = crítico.
- Persistência de mensagem do webhook deve ser idempotente via `wamid @unique` (insert com handling de duplicata). Sem isso, retry do Meta gera mensagem duplicada na conversa.
- Resposta do handler do webhook deve ser `200` em até alguns segundos. Trabalho pesado precisa ser enfileirado ou disparado em fire-and-forget.

### LGPD / PII de Contact

- Telefone (`WhatsappContact.phone`, E.164) é PII. Não expor em endpoint público sem autenticação de admin. Não logar.
- Pedido de exclusão (intent `APAGAR`) deve apagar `WhatsappContact` em cascata (`onDelete: Cascade` no schema já garante).

### TypeScript

- `any` ou `as any` em código novo é crítico — escapa do typesystem inteiro e mascara bugs reais. Se o tipo é genuinamente desconhecido, use `unknown` e estreite com type guards.
- `// @ts-ignore` / `// @ts-expect-error` sem comentário explicando o motivo é crítico.

### Valores monetários

- Manter `Float` consistente com schema (`Transaction.amount`, `PlanConfig.monthlyAmount`). Não converter para `number` perdendo precisão em conta sensível.
- Formatação para usuário em `pt-BR`: `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Forma do comentário

- Direto e curto. Sem preâmbulo (`"Olá, notei que..."`).
- Aponte arquivo e linha.
- Explique **o risco concreto**, não a teoria.
- Sugira a correção mínima quando óbvia.
- Se não houver problema crítico, **não comente**.
