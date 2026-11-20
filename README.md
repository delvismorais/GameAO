# GameAO

A GameAO é uma loja digital de videojogos e produtos para jogadores em Angola. O projeto combina catálogo, compras, atendimento, conteúdos e operação administrativa numa aplicação web responsiva em português de Angola.

**Autoria:** Delvis de Morais — CEO & Fundador e programador.

## Destaques

- Catálogo com categorias, pesquisa, filtros, ordenação, produtos digitais e físicos.
- Preços nativos em kwanzas: o valor digitado no painel é o valor exibido e cobrado. Por exemplo, `1340` resulta em `1 340,00 Kz`, tanto no produto como nas variantes, carrinho, checkout e fatura.
- Carrinho persistente, variantes, lista de desejos, comparação e checkout.
- Criação e acompanhamento de encomendas, comprovativos de pagamento e faturas PDF.
- Contas de clientes, histórico de compras, favoritos e programa de afiliados.
- Painel administrativo para catálogo, categorias, stock, encomendas, conteúdo, notificações e configurações da loja.
- SEO, dados estruturados, blog, FAQs, assistência ao cliente e endpoint de saúde.

## Arquitetura

O frontend usa **React 19**, **Vite 7**, **TypeScript** e React Router. A API é servida por **Express 5** e acede à base de dados PostgreSQL através de `pg`; o adaptador traduz parte do SQL legado para manter compatibilidade com o esquema existente. Os documentos PDF são gerados com `pdfkit` e as notificações podem usar SMTP e WhatsApp quando as respetivas credenciais estão configuradas.

```text
src/                    Frontend React, páginas, contexto e componentes
server/                 API Express, autenticação e serviços
server/migrations/      Migrações SQL versionadas
public/assets/          Logótipo, imagens e foto do fundador
docs/                   Documentação técnica
```

## Preços em AOA/Kz

As colunas históricas `base_price_usd`, `sale_price_usd`, `price_usd` e `original_price_usd` permanecem no esquema apenas por compatibilidade, mas o seu significado atual é **AOA/Kz**. Não existe conversão cambial no catálogo. A migração `0016_native_aoa_prices.sql` documenta esta regra. A taxa cambial histórica não altera produtos, variantes, carrinho nem pedidos novos.

## Desenvolvimento local

Requisitos: Node.js 20+, pnpm e uma base de dados PostgreSQL acessível.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

A aplicação fica disponível, por defeito, em `http://localhost:3000`. Para validar o projeto: 

```bash
pnpm typecheck
pnpm build
```

O servidor também pode ser iniciado com `pnpm start`. O endpoint `/_app/health` informa o estado da aplicação e da base de dados.

## Configuração

Nunca coloque palavras-passe, tokens ou chaves no código. Configure no ambiente de execução as variáveis presentes em `.env.example`, incluindo `DATABASE_URL`, sessão, SMTP e integrações opcionais. O ficheiro `.env` não deve ser versionado.

Para criar o primeiro administrador, use credenciais apenas no terminal ou no gestor de segredos:

```bash
GAMEAO_ADMIN_EMAIL="admin@exemplo.ao" \
GAMEAO_ADMIN_PASSWORD="uma-palavra-passe-segura" \
GAMEAO_ADMIN_NAME="Administrador" \
pnpm admin:init
```

Depois, aceda a `/admin` com uma conta administrativa.

## Operação e dados

As migrações são aplicadas pelo bootstrap do servidor. O catálogo público e o painel usam a mesma base de dados, por isso operações manuais devem ser feitas com cautela. Pagamentos por cartão não são ativados sem fornecedor, credenciais e validação do fluxo; o sistema atual regista encomendas e comprovativos sem guardar dados de cartão.

## Contactos

- Email: geral@gameao.shop
- Telefone/WhatsApp: 973 929 712
- Localização: Luanda, Angola

## Licença e conteúdos

Este repositório contém a implementação da GameAO e os seus assets. Nomes, capas, marcas e imagens de jogos pertencem aos respetivos titulares; confirme os direitos de utilização antes de redistribuir qualquer conteúdo.
