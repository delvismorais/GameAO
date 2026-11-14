# GameAO

Plataforma de comércio de videojogos para Angola, construída sobre a identidade visual do GameShop e adaptada para a marca GameAO.

## Visão geral

O projeto inclui uma loja responsiva em português de Angola, catálogo de videojogos, carrinho, lista de desejos, comparação de produtos, checkout, acompanhamento de encomendas, geração de faturas, autenticação própria e um painel administrativo ligado à mesma base de dados da loja.

A aparência preserva a linguagem do GameShop: tipografia Rubik, cabeçalho escuro, cor de destaque laranja, cartões de produto, carrosséis, banners e navegação responsiva.

## Funcionalidades

- Catálogo com produtos, categorias, pesquisa, ordenação e filtros.
- Preços-base em USD convertidos para AOA/Kz através de uma taxa gerida no painel administrativo.
- Carrinho persistente, lista de desejos e comparação de produtos.
- Registo, login, logout e gestão de perfil com autenticação própria.
- Checkout com criação de encomendas persistentes no MySQL.
- Números de encomenda únicos no formato `GA` + identificador, por exemplo `GA769`.
- Acompanhamento público da encomenda mediante número e email.
- Faturas PDF em dois modelos: clássica e moderna.
- Alteração de estado de encomendas com histórico, auditoria e tentativas de notificação.
- Painel administrativo com visão geral, pedidos, faturas, produtos e configuração da taxa.
- Gestão de produtos com criação e ativação/desativação sem editar código.
- SEO básico, manifesto público de rotas e endpoint de health check.

## Stack

- React 19
- Vite 7
- TypeScript
- Express
- MySQL gerido
- `mysql2`
- `bcryptjs`
- `pdfkit`
- `nodemailer`
- Playwright para validações de fluxo

## Estrutura

```text
src/                    Aplicação React, páginas, componentes e estilos
server/                 API Express, autenticação, migrações e serviços
server/migrations/      Migrações SQL versionadas
public/                 Assets públicos e manifesto de rotas
docs/                   Notas técnicas e documentação de referência
Dockerfile              Contrato de execução para produção
```

## Desenvolvimento local

Requisitos: Node.js 20 ou superior, pnpm e uma base de dados MySQL acessível.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

A aplicação de desenvolvimento fica disponível em `http://localhost:3000`.

## Variáveis de ambiente

Nunca coloque credenciais diretamente no código ou no frontend. Consulte `.env.example` para as variáveis suportadas, incluindo a ligação MySQL, sessão, SMTP e WhatsApp.

As credenciais de produção devem ser configuradas no ambiente de execução ou no gestor de segredos. O ficheiro `.env` local não deve ser commitado.

## Base de dados

As migrações são aplicadas pelo bootstrap do servidor. O modelo de dados cobre utilizadores, sessões, produtos, categorias, conteúdo, banners, encomendas, itens, estados, faturas, notificações e auditoria.

O catálogo público e o painel administrativo usam a mesma base de dados. Operações de teste que criem ou alterem registos devem ser executadas com cuidado, porque a base gerida é partilhada entre os ambientes definidos pelo projeto.

## Administração

A área administrativa está disponível em `/admin` e exige uma sessão com função administrativa. O menu inclui:

- Visão geral operacional;
- Pedidos e faturas;
- Produtos;
- Configuração interna da taxa de câmbio.

O primeiro administrador deve ser criado pelo comando de inicialização usando variáveis de ambiente, sem guardar a palavra-passe no repositório:

```bash
GAMEAO_ADMIN_EMAIL="admin@exemplo.ao" \
GAMEAO_ADMIN_PASSWORD="uma-palavra-passe-segura" \
GAMEAO_ADMIN_NAME="Administrador" \
pnpm admin:init
```

## Contactos da loja

- Email: geral@gameao.shop
- Telefone: 973 929 712
- Localização: Luanda, Angola

## Build e produção

```bash
pnpm build
pnpm start
```

O servidor respeita a variável `PORT` e usa `3000` como valor padrão. O endpoint `/_app/health` devolve o estado do serviço e da base de dados.

## Publicação

A produção corre num contentor Docker gerido pela Manus, com base de dados MySQL gerida na mesma plataforma:

- `Dockerfile` — instala dependências, compila o frontend e o servidor, e arranca a aplicação com `pnpm start`.
- MySQL gerido — a plataforma injeta `DATABASE_URL`; as migrações e o catálogo inicial são aplicados no arranque.
- `/_app/health` — verificação de saúde usada pela plataforma antes de encaminhar tráfego.

O repositório do projeto na Manus é a fonte usada para publicar. O repositório `delvismorais/GameAO` no GitHub mantém o mesmo histórico de código.

## Notas de operação

A integração de pagamentos por cartão ou por fornecedor externo não é ativada sem fornecedor escolhido, credenciais protegidas e validação do fluxo. O sistema atual regista encomendas e mantém a arquitetura preparada para uma futura integração, sem armazenar dados de cartão.

As notificações por email e WhatsApp dependem das credenciais correspondentes. Quando não estiverem configuradas, a alteração do pedido fica registada com o estado `not_configured` em vez de ser apresentada como enviada.

## Licença e conteúdos

Este repositório contém a implementação GameAO e os assets utilizados pelo projeto. Nomes, capas, marcas e imagens de jogos pertencem aos respetivos titulares. Verifique os direitos de utilização antes de distribuir os assets fora do ambiente autorizado.
