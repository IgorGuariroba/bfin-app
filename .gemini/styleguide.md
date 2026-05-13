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

## Forma do comentário

- Direto e curto. Sem preâmbulo (`"Olá, notei que..."`).
- Aponte arquivo e linha.
- Explique **o risco concreto**, não a teoria.
- Sugira a correção mínima quando óbvia.
- Se não houver problema crítico, **não comente**.
