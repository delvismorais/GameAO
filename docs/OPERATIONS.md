# GameAO — configuração operacional

Este documento descreve as configurações necessárias para executar o GameAO no Render com PostgreSQL/Supabase e armazenamento persistente Cloudflare R2. A aparência pública do site não depende destas configurações e não é alterada por elas.

## Render

Configure no serviço `GameAO`:

- `PORT=3000` (o serviço deve respeitar a porta fornecida pelo Render)
- `NODE_ENV=production`
- `DATABASE_URL` com o host IPv4/pooler do Supabase
- `DB_PASSWORD` separado quando a palavra-passe não estiver incluída no DSN
- `DB_POOL_SIZE=8`
- `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `R2_BUCKET=gameao-assets`
- `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` como variáveis protegidas
- `R2_PUBLIC_BASE_URL` apenas se existir um domínio público R2 configurado

Nunca guardar os valores secretos no repositório, no frontend ou em issues/logs.

## Supabase

O schema deve ser aplicado através das migrações em `server/migrations`. O projeto de produção usa PostgreSQL; não utilizar credenciais administrativas no frontend. As tabelas privadas permanecem protegidas por RLS, e o backend é responsável pelas operações autenticadas e administrativas.

## Cloudflare R2

O bucket usado pelo GameAO é `gameao-assets`. Com o R2 ativo, o backend grava:

- `payment-proofs/<número-da-encomenda>/...` para comprovativos privados;
- `media/product/...` para imagens de produtos;
- `media/banner/...` e outros prefixos administrativos para media.

Os comprovativos nunca são expostos por URL pública: o admin recebe apenas uma URL assinada temporária. Imagens administrativas podem usar `R2_PUBLIC_BASE_URL`; sem esse domínio, o backend devolve uma URL assinada temporária.

A credencial S3/R2 deve ter somente leitura e escrita de objetos no bucket `gameao-assets`. A criação de tokens é feita no painel Cloudflare depois de o R2 estar ativado na conta. O endpoint S3 é `https://<account-id>.r2.cloudflarestorage.com` e a região do SDK é `auto`.

## Primeiro administrador

Defina `GAMEAO_ADMIN_EMAIL`, `GAMEAO_ADMIN_PASSWORD` e, opcionalmente, `GAMEAO_ADMIN_NAME` apenas no ambiente seguro. Execute `pnpm admin:init` uma vez no ambiente com acesso à base de dados. Depois remova ou limpe a palavra-passe das variáveis temporárias, mantendo somente a conta criada.

## Pagamentos e notificações

Os métodos de pagamento começam inativos até a GameAO definir os seus próprios dados de recebimento. Não reutilizar dados de outra loja. SMTP e WhatsApp são opcionais; quando não configurados, as notificações ficam registadas como `not_configured`, sem serem apresentadas como enviadas.

Um comprovativo submetido não confirma automaticamente o pagamento. O administrador deve rever o ficheiro e aprovar, rejeitar ou pedir um novo comprovativo. O estado financeiro e o estado da encomenda são mantidos separadamente.

## Verificações após deploy

Validar, sem publicar segredos:

- `/_app/health` deve indicar `database.configured=true` e `database.ready=true`;
- `/api/catalog/products` deve responder HTTP 200;
- `/api/payment-methods` deve responder HTTP 200;
- uploads sem R2 devem responder honestamente `storage_not_configured`;
- com R2 configurado, testar um upload administrativo e um comprovativo com ficheiro de teste não sensível;
- confirmar revisão administrativa do comprovativo e que a aprovação altera `payment_status`, sem confiar apenas no estado visual do frontend.
