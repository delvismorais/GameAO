# Auditoria da referência ZIP — GameAO

## Escopo

O ZIP `morasiorja-meu-site-de-streaming(3).zip` foi extraído e auditado isoladamente. Nenhum código, credencial, webhook, dado comercial ou identidade visual da referência será executado ou copiado para o GameAO. A implementação permanece exclusivamente em `/home/ubuntu/work/GameAO`.

## Estrutura funcional encontrada

A referência organiza a operação em catálogo dinâmico, variantes, checkout por lote, produtos digitais e físicos, validação de IDs de jogos, IDs guardados para utilizadores autenticados, upload de imagens, encomendas administrativas, comprovativos, faturas, notificações, marketing e conteúdo editorial. O checkout recalcula preços, variantes, frete e benefícios no servidor, e trata unidades individuais quando um produto Free Fire tem quantidade maior que um.

## Comparação com o GameAO atual

### Já existente e preservado

- Identidade pública GameAO, layout, cores, tipografia, banners, imagens, navegação e páginas públicas.
- Catálogo persistente em PostgreSQL/Supabase, seed do catálogo atual e endpoint `/api/catalog/products`.
- Login, registo, sessões e autorização administrativa.
- Carrinho, wishlist, comparação e checkout.
- Encomendas persistentes, referência única, histórico de estados e acompanhamento.
- Métodos de pagamento próprios, inicialmente inativos, com instruções e dados de recebimento configuráveis.
- Upload e revisão segura de comprovativos de pagamento.
- Faturas PDF clássica/moderna.
- Dashboard administrativo, produtos, pedidos, pagamentos, comprovativos e taxa cambial.
- Upload administrativo de media através do adapter R2.
- RLS no Supabase, sem leitura pública de encomendas, pagamentos ou credenciais.

### Lacunas adaptadas nesta fase

- Metadados de produto para digital/físico, subtipo, ID de jogador, subcategoria, frete, imagens adicionais, vídeo e produto dinâmico.
- Variantes persistentes com CRUD administrativo e preço recalculado no servidor.
- Dados de entrega física e frete persistentes na encomenda.
- Campos de jogador por item de encomenda.
- IDs Free Fire guardados por utilizador autenticado.
- Endpoint de verificação Free Fire com estado honesto `not_configured` quando não houver provider real configurado; nunca será simulada uma validação.
- Catálogo público sincronizado com os produtos persistidos, mantendo fallback para o catálogo visual atual.
- Formulário administrativo ampliado sem copiar componentes, cores ou navegação da referência.

### Deliberadamente excluído

- tRPC, Drizzle, MySQL e toda a arquitetura da referência.
- Webhook `mdrecargas.app.n8n.cloud` e qualquer integração externa da referência.
- IBANs, números de telefone, titulares, tokens, API keys e dados comerciais da referência.
- Afiliados, pontos, marketing, blog administrativo e outras áreas sem requisito operacional atual no GameAO.
- Qualquer redesenho público ou substituição das imagens e dados atuais da GameAO.

## Migrações GameAO

As alterações serão incrementais, idempotentes e PostgreSQL-native. O bootstrap aplica apenas os ficheiros desta pasta; nenhum SQL do ZIP é executado diretamente.

## R2

A conta Cloudflare autorizada confirmou o bucket existente `gameao`. O adapter já suporta endpoint S3, bucket, chaves privadas e URL pública opcional. O bucket permanece privado até existir uma URL pública/domínio autorizado; comprovativos continuam sempre privados e assinados. As variáveis serão configuradas apenas no Render, nunca no repositório.

## Critério de segurança

Preços, disponibilidade, variantes, frete, categoria do produto e exigência de ID serão sempre recalculados/validados no backend. A UI apenas recolhe dados e não é fonte de verdade.
