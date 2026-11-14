# Auditoria de conexões e painel administrativo — GameAO

Data: 2026-11-14

## Resultado executivo

O painel administrativo está acessível com uma conta `super_admin`, o backend responde e o build de produção passa. A base local está ligada e devolve o catálogo GameAO. O que ainda impede o sistema de ficar operacional em produção são principalmente configurações próprias da GameAO que não podem ser inventadas: métodos de recebimento, R2, SMTP, WhatsApp, dados comerciais, URLs sociais reais e, opcionalmente, um fornecedor de verificação Free Fire.

## Confirmado como ligado

- Autenticação, sessão e proteção de rotas administrativas.
- Perfil `super_admin` e verificação server-side de permissões.
- Base de dados PostgreSQL/Supabase através de `DATABASE_URL`.
- Catálogo de produtos e categorias.
- Dashboard administrativo e estatísticas base.
- Gestão de encomendas, estados, histórico e notas.
- Faturas clássica e moderna.
- Upload e revisão manual de comprovativos.
- Cupões validados no servidor.
- Afiliados, comissões, referrals e pedidos de levantamento.
- Notificações internas e modelos de notificação.
- Comentários do blog com moderação.
- Mensagens de contacto e gestão administrativa.
- Banners, popups, posts e definições do website.
- Exportações CSV e registos de auditoria.
- Sessões administrativas e revogação de sessão.
- Endpoint público de configuração do site, popups, catálogo e métodos de pagamento.
- Build frontend e bundle de servidor.

## Configurado no ambiente auditado

- `DATABASE_URL`: configurado e funcional.
- Conta administrativa GameAO: configurada e funcional.
- `OPENAI_API_KEY`: disponível para o gerador de emails.

## Em falta no ambiente auditado

Estas variáveis não devem ser simuladas:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `FREEFIRE_VERIFY_URL` e `FREEFIRE_API_KEY` — recurso opcional.

O painel mostra estes estados como pendentes. A ausência de R2 bloqueia uploads de comprovativos e biblioteca de media; a ausência de SMTP bloqueia emails; a ausência de WhatsApp bloqueia notificações WhatsApp.

## Situação dos métodos de pagamento

A base possui métodos pré-criados, mas todos estão inativos e sem dados de recebimento próprios da GameAO. Foram encontrados métodos como Express, PayPay AO e Unitel Money, porém nenhum deve ser ativado sem preencher:

- nome público;
- instruções passo a passo;
- número/IBAN/entidade de recebimento;
- mensagem para o cliente;
- prazo para pagamento;
- exigência de comprovativo;
- ordem de apresentação.

## Painel administrativo: cobertura

### Totalmente operacional

- Dashboard.
- Estatísticas e relatórios base.
- Encomendas e filtros por estado.
- Faturas.
- Comprovativos e revisão manual.
- Métodos de pagamento e dados de recebimento.
- Produtos, categorias, stock, destaques e promoções.
- Banners, carrosséis e popups.
- Blog, posts pendentes e moderação de comentários.
- Mensagens de contacto.
- Clientes e contas.
- Administradores.
- Cupões.
- Afiliados.
- Notificações.
- Media, quando R2 estiver configurado.
- Auditoria, sessões e exportações.
- Configurações gerais, identidade, moeda, checkout, entrega e SEO.

### Parcial / leitura ou resumo

- **Plataformas:** neste momento funciona como filtro/consulta derivada dos produtos; não existe um CRUD independente de plataformas.
- **Categorias do blog:** são calculadas a partir dos posts; ainda não existe gestão independente de categorias com slug, descrição e estado.
- **Funções e permissões:** apresenta o modelo de funções, mas não possui editor granular de permissões por função.
- **Reembolsos:** apresenta encomendas/referências relacionadas, mas não existe integração automática com gateway nem execução financeira de reembolso.
- **Gateways de pagamento:** mostra métodos e estado; as credenciais de gateways não são guardadas nem executadas no frontend, por segurança.
- **Integrações:** mostra estado real e instruções, mas SMTP, WhatsApp, R2 e Free Fire dependem de variáveis no Render.
- **Backups:** permite exportações operacionais; backups completos ficam sob a infraestrutura Supabase/Render e não são fabricados pela aplicação.
- **Homepage e SEO:** existem definições administrativas, mas precisam ser preenchidas com conteúdo real da GameAO para produzir efeito editorial completo.

## Dados/configurações que podem ser enviados aqui

Podem ser enviados diretamente na conversa, por serem dados de configuração da própria GameAO:

1. Dados públicos/comerciais: nome legal, NIF, email, telefones, WhatsApp, endereço, horário e políticas.
2. Métodos de pagamento: nomes, instruções, números/IBANs/entidades, mensagens, prazos e quais devem ficar ativos.
3. URLs reais de Facebook, Instagram, TikTok, X, Telegram, WhatsApp e outras redes.
4. Textos de homepage, banners, popups, FAQ, políticas, entrega, pagamento, privacidade e termos.
5. Título SEO, descrição SEO, imagem social e palavras-chave.
6. Dados de produtos: categorias, plataformas, variantes, IDs de jogador, stock, preços, promoções e imagens.
7. Logos, banners, imagens de produtos, PDFs e outros ficheiros através de upload.
8. Regras do programa de afiliados: percentagem, mínimo de levantamento, métodos de pagamento e texto legal.
9. Modelos de emails e mensagens que devem usar a identidade GameAO.

## O que não deve ser enviado em texto normal

Não é necessário nem recomendado enviar aqui:

- palavras-passe;
- tokens Cloudflare/R2;
- chaves SMTP;
- tokens WhatsApp;
- chaves de API;
- connection strings completas;
- cookies ou sessões.

Esses valores devem ser colocados nas variáveis seguras do Render/Cloudflare/Supabase ou através do conector correspondente. O sistema já foi preparado para não os expor no painel.

## Testes realizados

- `pnpm typecheck`: passou.
- `pnpm build`: passou.
- `/_app/health`: HTTP 200.
- `/api/site/config`: HTTP 200.
- `/api/site/popups`: HTTP 200.
- `/api/payment-methods`: HTTP 200.
- `/api/catalog/products`: HTTP 200.
- Login administrativo: HTTP 200.
- `/api/admin/overview`: HTTP 200.
- `/api/admin/status`: HTTP 200.
- `/api/admin/integrations`: HTTP 200.
- `/api/admin/site-settings`: HTTP 200.
- `/api/admin/payment-methods`: HTTP 200.
- `/api/admin/products`: HTTP 200.
- `/api/admin/customers`: HTTP 200.
- `/api/admin/media`: HTTP 200, com R2 indicado como não configurado.

## Prioridade recomendada

1. Enviar/preencher os dados públicos e financeiros próprios da GameAO.
2. Configurar R2 no Render para desbloquear media e comprovativos.
3. Configurar SMTP e WhatsApp para notificações reais.
4. Preencher e ativar os métodos de pagamento.
5. Completar conteúdos SEO, homepage, FAQ e políticas.
6. Depois validar produção com uma encomenda de teste, comprovativo de teste e revisão manual.
7. Como melhoria posterior: CRUD independente de plataformas/blog categories e editor granular de permissões.
