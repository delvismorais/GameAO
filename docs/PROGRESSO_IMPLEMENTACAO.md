# GameAO — Progresso da implementação (instruções complementares)

## Fonte das instruções
`docs/INSTRUCOES_COMPLEMENTARES.md` (copiado de https://github.com/delvismorais/GameAO/blob/main/intru%C3%A7%C3%B5es%20ambiente de execução)

## Objetivo
Adaptar a organização administrativa, checkout, pagamentos, notificações, uploads e infraestrutura da MD Recargas para o GameAO, preservando integralmente a aparência pública.

## Decisões de arquitetura
- Mantida a autenticação própria do GameAO (bcrypt + sessões em `app_sessions`), já integrada com papéis e RLS. Não foi criado um segundo sistema de autenticação.
- Supabase PostgreSQL (`gameao-production`, eu-central-1) é a base de dados de produção.
- Cloudflare R2 usado através do adapter S3 existente (`server/storage.ts`).
- Migrações versionadas em `server/migrations` (0009–0013 novas).

## Concluído nesta sessão
- Migrações: notificações internas, modelos por evento/canal, entregas, tokens de recuperação, popups, comentários, mensagens de contacto, afiliados, cupões, biblioteca multimédia, tracking token, stock, RLS.
- Motor de notificações: email com marca GameAO, WhatsApp, in-app cliente, in-app admin, registo de entregas, preferências, 54 modelos PT-AO.
- Eventos ligados: registo, encomenda criada, comprovativo enviado, revisão de comprovativo, mudança de estado, stock baixo, contacto, comentário, afiliados.
- Correção: comprovativo já não marca a encomenda como paga automaticamente.
- Rotas: site config/popups/contador, contacto, comentários, recuperação de palavra-passe, notificações cliente/admin, modelos, entregas, popups admin, comentários admin, mensagens, afiliados, admins, estatísticas, faturas, integrações, definições do site, categorias, detalhe de pedidos, submissão de artigos, gerador de emails.
- Cupões aplicados no servidor; token de acompanhamento por encomenda; fatura e consulta protegidas por token/email/dono/admin.

## Pendente / validação externa
- Configurar no ambiente Render os valores próprios do GameAO para SMTP, WhatsApp e R2, quando ainda não estiverem preenchidos.
- Executar testes E2E contra a base Supabase e o bucket R2 de produção.
- Fazer deploy Render e validar os fluxos com dados reais sem reutilizar credenciais ou dados da MD Recargas.

## Atualização — painel administrativo
- Novo AdminShell com grupos A–J, pesquisa de menu, drawer móvel, identidade, sino de alertas, ver website e terminar sessão.
- Secções funcionais: Dashboard (KPIs, gráfico, donut, top produtos, atividade), Estatísticas/Relatórios, Encomendas (filtros, ficha, histórico, notas, comprovativos, reenvio, faturas), Entregas, Faturas, Pagamentos (métodos + dados de recebimento + comprovativos + transações + reembolsos + relatórios), Catálogo (produtos, novo, categorias, plataformas, stock, destaques, promos), Conteúdos (homepage, banners, carrosséis, popups, media, blog, comentários, mensagens, páginas, FAQ), Clientes/Contas/Admins/Funções, Marketing (cupões, campanhas, notificações, emails, redes sociais, afiliados), Integrações, Configurações (gerais, identidade, moeda, comercial, checkout, entrega, SEO), Segurança (auditoria, histórico, permissões, sessões, estado, backups), Biblioteca de multimédia.
- Endpoints novos: customers, coupons, transactions, audit-logs, sessions (+revoke), webhooks, deliveries, finance, export CSV, media (list/presign/confirm/delete/download).
- CSS novo em `src/styles/admin.css`, importado em `src/main.tsx`.

## Auditoria do ZIP e instruções — 2026-11-14
- ZIP de referência extraído em `/home/ubuntu/work/reference_zip/morasiorja-meu-site-de-streaming`; utilizado apenas para leitura e comparação.
- Instruções completas guardadas em `docs/INSTRUCOES_COMPLETAS_GAMEAO.md` (31 secções, incluindo painel, checkout, pagamentos, comprovativos, faturas, notificações, Supabase, R2, uploads, RLS e testes).
- Confirmado: MD Recargas é apenas referência; não transportar identidade visual, dados financeiros, webhooks, credenciais ou configurações.
- Confirmado: comprovativo enviado não pode marcar pagamento como confirmado automaticamente.
- Integrações públicas adicionadas: `AnnouncementPopup` para popups ativos do backend, `NotificationBell` no header apenas para clientes autenticados e captura de código de afiliado por URL com expiração de 30 dias.
- CSS dos novos componentes preserva o layout público e só renderiza elementos quando há configuração/dados.
- Validação executada: `pnpm typecheck` passou (TypeScript cliente e servidor).
- Fluxos públicos ligados: comentários moderados no backend, formulário de contacto persistido, afiliados com adesão/link/vendas/levantamentos e redes sociais configuráveis no header.
- Validação executada: `pnpm build` passou (Vite + bundle do servidor).
