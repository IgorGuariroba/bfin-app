# 4. Contrato operacional do agente: escrita direta com trilha, dedup defensivo e apply_previsao fora da escrita

Data: 2026-06-18
Status: Aceito

## Contexto

O agente (via MCP) opera o **núcleo financeiro do dia-a-dia** de um `User` `pro` (Transactions CRUD, Previsão, Tags, leituras agregadas). Três riscos concretos: (1) um LLM alucinando ID/valor corrompe o livro financeiro; (2) o mesmo gasto relatado ao agente **e** importado pelo Pluggy duplica a contagem; (3) `apply_previsao` é destrutivo em massa (`deleteMany` de `diario` manual numa janela de 12 meses + ~365 placeholders) e não combina com delegação por linguagem natural.

## Decisão

1. **Escritas executam direto**, sem elicitation nem soft-delete: `create`/`update`/`delete` vão ao banco na hora. Em compensação, mantemos **trilha**: `Transaction.source = "agent"`, log estruturado (`pino`: `apiKeyId`, `userId`, `action`, `entityId`) e `ApiKey.lastUsedAt` a cada chamada.
2. **Dedup defensivo no `create_transaction`**: busca candidata exata (mesmo `amount` + mesma data ±2 dias + mesmo `type`); se acha, **não cria**, retorna a existente sinalizando "possível duplicata". Para forçar, segunda chamada com `force: true`. Cruza qualquer origem (agent × pluggy × manual).
3. **`apply_previsao` não é exposto** ao agente — só `get_previsao` (leitura). É regeneração de projeção, não registro de gasto; o usuário configura a meta na UI.
4. **`diario` é reservado à projeção** gerada por `apply_previsao`. Gasto real relatado pelo usuário (uber, mercado) é criado como `type = "saida"` (consistente com Pluggy e com o quick-add).
5. **Rate limit in-memory por `ApiKey`** (escritas/leitura por janela, HTTP 429).

## Consequências

**Positivas:**
- Velocidade do assistente preservada (1 turno para registrar) sem abrir mão de auditoria.
- O usuário distingue o que veio do agente (`source`); duplicação Pluggy × agente eliminada na origem.
- Nenhum `deleteMany` em massa disparável por interpretação de linguagem natural.

**Negativas:**
- Delete é físico e irreversível (sem undo) — aceito como trade-off pela velocidade; a trilha (`source` + log) é a rede de segurança.
- `create` ocasionalmente vira duas chamadas (só quando há candidata duplicata).

## Alternativas descartadas

- **Elicitation / soft-delete em toda escrita**: máximo de segurança, mas "registra uber R$20" vira dois turnos e mata o benefício do assistente (o gasto "diário" é de alto volume).
- **`diario` como gasto variável real** (sem proteção contra `apply_previsao`): fiel a um entendimento anterior do conceito, mas `apply_previsao` deletaria os gastos reais — contradição latente no produto. `diario` é projeção (confirmado pelo dono em 2026-06-18).
- **Expor `apply_previsao`**: daria ao agente a regeneração da projeção, mas o custo de um `deleteMany` disparado por LLM supera o benefício de uma operação rara e destrutiva.
