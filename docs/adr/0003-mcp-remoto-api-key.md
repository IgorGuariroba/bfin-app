# 3. Assistente financeiro via MCP remoto + API key

Data: 2026-06-18
Status: Aceito

## Contexto

Usuários `pro` querem delegar o registro de gastos e a leitura das finanças a agentes externos (Claude Desktop, ChatGPT, Cursor). O bfin autentica apenas por sessão NextAuth (cookie de browser) — inutilizável para um client MCP, que não opera sobre cookie. Precisávamos de um principal programático e de um ponto de exposição para o protocolo MCP.

## Decisão

Expor um **servidor MCP remoto** em `/api/mcp` (streamable HTTP transport do `@modelcontextprotocol/sdk`, stateless) e autenticar o agente por **API key pessoal** (`Bearer` no header) — não por OAuth 2.1 e não por um pacote MCP local (stdio).

- Novo modelo `ApiKey` (token nomeado/rotativo, armazenado **hasheado**, com `prefix` visível e `lastUsedAt`). Emissão restrita a `pro`.
- O handler resolve o principal via `Bearer → ApiKey → userId` e age como o **dono** (não atravessa `AccountMember`).
- Arquitetura pensada para evoluir a OAuth: só a resolução do principal muda; tools, gates e trilha permanecem.

## Consequências

**Positivas:**
- Zero instalação para o usuário (cola URL + token no client); multi-client sem código extra.
- Revogação e atualizações centralizadas no servidor; alinhado ao rumo do ecossistema MCP (remote é o padrão 2025).

**Negativas:**
- bfin implementa o endpoint MCP + tabela `ApiKey` + UI de emissão (aba "Assistente" no `/perfil`).
- Token estático: se vazar, vale até revogação (mitigado por token único ativo, `lastUsedAt` e rate limit — ver ADR-0004).

## Alternativas descartadas

- **MCP local (stdio, npm package)**: reusaria as rotas `/api/*`, mas exige instalação + edição de JSON pelo usuário (fricção alta para o ICP não-dev) e atualizações não-centralizadas.
- **OAuth 2.1 completo**: é o padrão oficial do MCP para servidores remotos, mas exigiria virar OAuth provider (authorization/token endpoints, PKCE, refresh, consent) — over-engineering para Fase 0/1 com um único caso de uso (dono delegando ao próprio agente). Cabe quando houver marketplace de MCPs ou multi-tenant.
