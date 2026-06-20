# 6. Id de escrita no MCP: structuredContent tipado para encadear correções

Data: 2026-06-20
Status: Aceito

## Contexto

As tools de escrita do MCP (`create_transaction`, `update_transaction`, `create_tag`) retornavam **apenas texto** em linguagem natural (`"Movimentação criada: …"`), descartando o `id` da entidade que tinham em mãos. As tools de leitura (`list_transactions`, `list_tag`, …) devolvem JSON serializado dentro de um bloco de texto via `jsonContent`, sem `outputSchema`.

Isso quebra o **encadeamento de escrita**: para `update_transaction`/`delete_transaction` o agente precisa de um `id`, e a única forma de obtê-lo após um `create_transaction` era chamar `list_transactions` e adivinhar por heurística qual era a transação recém-criada. O mesmo vale para `create_tag` → aplicar a Tag num `update_transaction` (que aceita `tagIds`). O fluxo alvo é: criar → "ops, valor errado" → corrigir/apagar, sem round-trip nem adivinhação. Para isso o agente precisa do `id` de forma **confiável e legível por máquina**, não embutido numa frase que ele teria que parsear.

## Decisão

1. **`structuredContent` + `outputSchema` declarado** nas três tools de escrita. O retorno passa a ter, ao lado do texto humano (inalterado), um campo estruturado que o agente lê direto. Declaramos `outputSchema` (e não só `structuredContent` solto) porque ele **anuncia o contrato** na definição da tool — o agente sabe que vem `id` — e o SDK **valida** o objeto.

2. **Shape rico, não só `id`.** `create_transaction` infere o `type` (`suggestType`) e auto-sugere uma Tag (`suggestTag`); devolver isso deixa o agente confirmar o que foi de fato persistido sem re-listar.
   - `create_transaction` → `{ id, duplicated, type, amount, date, tagId | null }`
   - `update_transaction` → `{ id, type, amount, date, tagIds[] }` (estado resultante)
   - `create_tag` → `{ id, name, color }`

3. **`type` como `string`, não enum, no `outputSchema`.** A candidata duplicata do `create_transaction` pode ser de qualquer tipo; um enum estrito faria a validação de saída do SDK estourar por um tipo legítimo. O canal continua legível por máquina sem essa fragilidade.

4. **Caminho de duplicata também devolve `structuredContent`.** No `create_transaction` a duplicata retorna texto **sem** `isError` (é um sucesso do ponto de vista do protocolo). Como o SDK exige `structuredContent` em todo retorno de sucesso quando há `outputSchema` (`mcp.js:196`, estoura `"no structured content was provided"`), a duplicata devolve `{ duplicated: true, id: <id da existente>, … }` — o que, além de obrigatório, é útil: o agente pode **corrigir a duplicata existente** em vez de só receber um aviso em prosa.

5. **Datas formatadas como `YYYY-MM-DD`.** O `structuredContent` é validado como objeto JS **antes** de serializar, então `date` vai como string (helper `ymd`, componentes locais — as `Transaction` são gravadas ao meio-dia local), não como `Date` cru.

## Consequências

**Positivas:**
- O agente encadeia criar → corrigir/apagar sem `list_transactions` + heurística.
- O contrato fica anunciado e validado: regressões no shape de saída viram erro explícito, não silêncio.
- Sem mudança para o usuário final: o texto humano de cada tool é idêntico.

**Negativas / conhecidas:**
- **Assimetria leitura×escrita.** As escritas usam `structuredContent` tipado; as leituras seguem com JSON-dentro-de-texto via `jsonContent`, sem `outputSchema`. É intencional — as leituras não precisam de contrato de saída validado para o fluxo de encadeamento —, mas um leitor futuro deve saber que a divergência é deliberada, não esquecimento.
- O caminho de erro de validação (`isError: true`) **não** carrega `structuredContent`; é seguro porque o SDK pula a validação para `isError` (`mcp.js:193`).
- Acréscimo de campos ao `outputSchema` é retrocompatível, mas **remover** campos depois quebra agentes que passaram a depender deles.
