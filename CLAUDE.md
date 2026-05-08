@AGENTS.md

## MCPs disponíveis

### context7
Documentação atualizada de qualquer lib/framework.
**Usar quando:** dúvida de API Next.js, Prisma, React, Tailwind, ou qualquer dependência do projeto — training data pode estar desatualizado.
**Fluxo:** `resolve-library-id` → `query-docs`.

### next-devtools
Ferramentas específicas para o servidor Next.js em execução.
**Usar quando:** inspecionar cache de componentes, chamar rotas internas, buscar docs do Next.js local, upgrade de versão.

### playwright
Automação de browser completa (navigate, click, fill, screenshot, snapshot, network).
**Usar quando:** testar UI após mudanças visuais, verificar golden path de feature, depurar comportamento de página, inspecionar requests de rede no browser.

### shadcn
Gerenciamento de componentes shadcn/ui.
**Usar quando:** adicionar novo componente UI (`get_add_command`), checar exemplos de uso (`get_item_examples`), auditar acessibilidade (`get_audit_checklist`), pesquisar componente disponível (`search_items`).

### Gmail / Google Calendar / Google Drive
Integração com serviços Google (requer autenticação OAuth).
**Usar quando:** explicitamente solicitado pelo usuário para ler e-mails, eventos ou arquivos do Drive.
