# 2. Blog usa Topic, não Tag

Data: 2026-05-14
Status: Aceito

## Contexto

O domínio bfin já define **Tag** como rótulo categorizador de `Transaction` (modelo Prisma com `userId`, `isSystem`, `color`, relação many-to-many com `Transaction`). Glossário em `CONTEXT.md` lista "categoria, label" como termos a evitar para Tag.

Ao introduzir o Blog (marketing/SEO público em `/blog/*`), surgiu a necessidade de rotular posts. Três caminhos foram considerados:

1. **Reusar `Tag` com campo `scope`** (`"transaction" | "post"`).
2. **Criar `PostTag`** — entidade separada, mesmo nome humano.
3. **Renomear conceito para `Topic`** — entidade separada, nome distinto.

## Decisão

Posts são rotulados por **Topic** (entidade `PostTopic` no Prisma, termo "Topic" no domínio). URLs públicas usam `/blog/topico/[slug]`.

## Consequências

**Positivas:**
- Glossário fica sem ambiguidade. "Tag" significa exatamente uma coisa.
- Sem acoplamento entre domínio financeiro e marketing — schemas independentes, podem evoluir sem coordenação.
- Conversa cotidiana ("a tag X") nunca exige desambiguação por contexto.

**Negativas:**
- Pequena fricção cognitiva no admin: usuário-Admin precisa lembrar que rotular Transaction é "tag" e rotular Post é "topic".
- Duplicação de mecânica (CRUD, slug, listagem por rótulo) em duas entidades parecidas.

## Alternativas descartadas

- **Reusar `Tag` com scope**: acopla blog ao schema financeiro. Migração de privacidade (compartilhamento via `AccountMember`) ficaria complicada — Tag tem `userId`, Post não tem dono no mesmo sentido.
- **`PostTag`**: resolve schema mas mantém ambiguidade verbal — discussões em português ainda diriam "tag" para os dois.
