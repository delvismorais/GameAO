# Referência externa — MD Recargas / Morasio Digital

Inspecionado em 13/11/2026.

- **Repositório:** https://github.com/delvis1205/morasiorja.git
- **Branch:** `meu-site-de-streaming`
- **Último commit observado:** `65f6090` — “Update APP_LOGO_DARK URL for new image”
- **Cópia local de trabalho:** `/home/ubuntu/ref/morasiorja` (fora do projeto GameAO; não publicar)

## O que é

A **MD Recargas** (marca **Morasio Digital**) é uma plataforma angolana de recargas digitais, jogos, gift cards e serviços online. O site oficial é `recargas.morasio.shop` e a comunicação dirige-se a jogadores em Angola. O lema é “Carregue. Jogue. Domine.”.

## Stack e arquitetura

- React 19 + Vite + TypeScript, com `wouter` para rotas.
- Tailwind CSS + componentes shadcn/Radix.
- Express + tRPC no servidor; Drizzle ORM com MySQL.
- React Query, Framer Motion, Embla Carousel.
- PDF com jsPDF; e-mail com Nodemailer/Zoho SMTP; armazenamento Cloudinary/S3.
- Assistente de IA com OpenAI/Gemini.

## Funcionalidades observadas

- Homepage editorial com hero, jogos em destaque, produtos, banners, categorias e CTA.
- Catálogo por categorias, produtos com variantes e produtos dinâmicos.
- Pesquisa, página de produto, carrinho e checkout guiado.
- Pedido criado antes do pagamento, com referência, comprovativo e acompanhamento.
- Fatura, conta de utilizador, área de afiliados, blog, newsletter e suporte por WhatsApp.
- Painel administrativo extenso: produtos, pedidos, faturas, banners, blog, afiliados, marketing, notificações e configurações.
- Rotas principais: `/`, `/produtos`, `/produto/:slug`, `/carrinho`, `/checkout`, `/sucesso`, `/acompanhar-pedido`, `/perfil`, `/afiliados`, `/blog`, `/sobre`, `/contato`, `/suporte`, `/privacidade`, `/termos`.

## Catálogo de referência

O ficheiro `seed-data.ts` contém três categorias e os respetivos pacotes:

| Categoria | Exemplos de produtos |
|---|---|
| Free Fire | 100, 310, 520, 1060 e 2180 diamantes |
| Delta Force | 500, 1200 e 3000 moedas |
| Black Clover M | 500, 1200 e 3200 cristais |

No modelo de dados, os preços são guardados em **centavos de kwanza** (`price`, `originalPrice`). O produto inclui nome, slug, descrição, descrição curta, imagem, bónus, tipo digital/físico, subtipo, `requiresPlayerId`, subcategoria, custo de envio, imagens adicionais, vídeo, variantes, estado ativo e destaque.

## Identidade visual

Linguagem gaming/editorial de alto contraste:

- Superfícies escuras: `#111216`, `#171717`, `#08090b`.
- Dourado: `#f5b721`.
- Vermelho: `#ee3c2d`.
- Fundo papel claro em secções editoriais.
- Tipografia display pesada, maiúsculas, tracking apertado; kickers e números em dourado; bordas retas.
- Tokens CSS: primário vermelho `oklch(0.6 0.25 25)`, acento roxo `oklch(0.6 0.2 280)`, fundo escuro `oklch(0.141 0.005 285.823)`, raio `0.65rem`.

Componentes potencialmente úteis como referência conceptual: Header, Footer, HomeHero, ProductCard, ProductSearch, BannerCarousel, VariantSelector, AnnouncementPopup, SalesCounter, ShareButtons, WhatsAppRedirectModal e AIChatAssistant.

## Como usar esta referência no GameAO

- Usar como **fonte de inspiração de conteúdo, catálogo, UX e ideias para a loja definitiva**, não como código a copiar diretamente.
- A stack é diferente: o GameAO é React/Vite estático com estado local; a referência é Express/tRPC/Drizzle/MySQL.
- **Manter a estrutura e a aparência GameShop do GameAO.** Adaptar apenas o que for explicitamente pedido.
- Não copiar backend, autenticação, pagamentos, e-mails, afiliados ou painel administrativo sem pedido explícito.
- Não reutilizar dados pessoais, IBANs, credenciais, dumps de clientes ou configurações SMTP encontrados no repositório. Existem ficheiros sensíveis como `.env.example`, guias de e-mail e dumps em `.manus/db`; não os copiar para o GameAO.
- Confirmar licença e permissão antes de reutilizar textos, imagens ou código de terceiros.
- O GameAO continua sem pagamentos reais, integrações com fornecedores ou funcionalidades comerciais adicionais até o utilizador pedir.

## Relação com o pedido atual

O utilizador quer iniciar pequenas alterações no GameAO mantendo a estrutura e a aparência, usando este repositório como apoio. As próximas alterações devem ser tratadas como evoluções incrementais da réplica GameShop, não como uma migração para a arquitetura MD Recargas.


## Observação adicional — painel admin em 15/11/2026

Após autenticação autorizada em `https://recargas.morasio.shop/admin/`, as rotas administrativas corretas observadas foram:

- Pedidos: `https://recargas.morasio.shop/admin/pedidos`
- Produtos: `https://recargas.morasio.shop/admin/produtos`

A página de pedidos apresenta navegação lateral agrupada, pesquisa por pedido/cliente/telefone, filtros de estado e tipo de pedido, cartões individuais com número, data, cliente, contacto, itens, total, badges de estado/comprovativo, ação de ver detalhes e eliminação.

A página de produtos apresenta navegação lateral agrupada, botão Novo Produto e uma tabela com produto, categoria, tipo digital/físico, preço atual e anterior, estado, destaque e ações rápidas de visualizar, editar, ativar/desativar e eliminar. A GameAO adapta estes padrões com dados e identidade próprios, sem copiar logótipo, cores ou dados comerciais da referência.
