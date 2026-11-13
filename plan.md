# Plano de Implementação — GameAO (reconstrução do GameShop)

## 1. Objetivo e âmbito

Reconstruir com fidelidade visual, estrutural e funcional o template WordPress/WooCommerce **GameShop (TemplateMonster #365728)**, usando como referência a demonstração oficial `https://hex-wp.com/gameshop/` e, com prioridade, a **Homepage 2** (`/homepage-2-visual-builder/`). A única localização obrigatória nesta fase é: interface integralmente em português de Angola, preços em kwanzas (AOA/Kz) e conteúdos descritivos em português. Não há pagamentos reais, integrações com fornecedores nem funcionalidades comerciais adicionais.

A análise da referência foi feita página a página (Homepage 1 e 2, Loja, categorias, produto, carrinho, checkout, wishlist, comparação, conta, notícias, artigo, Sobre, Contactos, FAQs), em desktop (1440×900) e mobile (390×844), com extração do HTML, das folhas de estilo do tema e de todos os recursos visuais.

## 2. Identidade visual (reaproveitada da referência)

- **Design Movement**: gaming commerce escuro da Hex WP, com superfícies pretas/azul-noite e acento laranja incandescente.
- **Core Principles**: fidelidade ao template original; hierarquia tipográfica forte; cartões de produto como protagonistas; contraste escuro/claro alternado entre Homepage 1 (clara) e Homepage 2 (escura).
- **Color Philosophy**: fundo `#081018`, cabeçalho/rodapé `#00080f`, cartões `#182028`, bordas `#20282f`, texto `#b0b8bf`, títulos `#ffffff`, primário `#cd3d0f` (laranja-vermelho), hover do primário `hsl(14.53 86% 33%)`, selo "Popular" `#e0232d`, estrelas `#febf00`, superfície clara das páginas internas `#eff2fa`.
- **Layout Paradigm**: grelha de 12 colunas com contentor de 1600px e margens laterais de 20px; hero full-width 2:1; faixas de 4 vantagens; carrosséis de 5 cartões; grelha de 10 jogos (2×5); rodapé de 5 colunas.
- **Signature Elements**: selos circulares de desconto/Hot sobre as capas; botões-pílula laranja; capas 2:3 com efeito de elevação e zoom no hover.
- **Interaction Philosophy**: interações discretas e rápidas; menus suspensos; botões de carrinho/favoritos/comparação revelados no hover do cartão; feedback imediato no cabeçalho e em toast.
- **Animation**: slider hero em fade com 2000ms de transição e 10000ms entre slides; entrada com fade/scale; hover com elevação de 4px e zoom de 1.05 na imagem; setas de carrossel com fade; respeitar `prefers-reduced-motion`.
- **Typography System**: Rubik (400/500/700/900), títulos a 700/900; H1 45–55px, títulos de secção 24px, títulos de cartão 16–18px, corpo 15–16px, meta 13px.
- **Brand Essence**: loja de videojogos angolana com a energia visual do GameShop — rápida, intensa, fiável.
- **Brand Voice**: direto e entusiasta, em português de Angola. Exemplos: "Os seus próximos mundos estão aqui." / "Adicione ao carrinho e entre em jogo."
- **Wordmark & Logo**: logótipo original GAMESHOP (GAME laranja + SHOP branco), preservado como imagem.
- **Signature Brand Color**: `#cd3d0f`.

## 3. Stack e arquitetura

- **React 19 + TypeScript + Vite 7 + React Router 7**, SPA estática (sem backend nesta fase). O carrinho, favoritos, comparação, conta de demonstração, avaliações e encomendas persistem em `localStorage`.
- **Sem Tailwind**: CSS próprio organizado por camadas (`base`, `layout`, `components`, `pages`), com as variáveis exatas do tema original. Regras específicas do WooCommerce (formulários, tabelas, separadores, estrelas, avisos) são recriadas com os mesmos valores visuais da folha `woocommerce.css` do tema.
- **Dados separados da apresentação**: `src/data/products.ts` (15 produtos com preço-base em USD), `src/data/posts.ts` (9 artigos), `src/data/site.ts` (menus, vantagens, slides, banners, pré-reservas, contactos de demonstração, FAQs, equipa).
- **Gestão centralizada de preços**: `src/config/store.ts` contém a configuração por omissão (taxa USD/AOA 913,000, fonte BNA, data 13/11/2026, nota de demonstração). `SettingsContext` lê/guarda a taxa em `localStorage` e propaga-a a toda a árvore. `src/lib/pricing.ts` expõe `usdToAoa`, `formatAoa` e `formatUsdAsAoa`; **nenhum preço de produto em AOA é escrito à mão**. O componente `Price` é a única via de apresentação monetária. Alterar a taxa na página `/configuracoes` recalcula imediatamente loja, cartões, carrinho, descontos, comparação e checkout.
- **Estado da loja**: `StoreContext` gere carrinho, wishlist, comparação, utilizador e encomendas; os totais são derivados em tempo de render, pelo que reagem automaticamente à taxa.
- **Rotas**: `/`, `/homepage-2`, `/shop`, `/product-category/:slug` (game, xbox, playstation, pc, featured), `/product/:slug`, `/cart`, `/checkout`, `/checkout/confirmacao`, `/wishlist`, `/compare`, `/my-account`, `/my-account/orders`, `/category/news`, `/blog/:slug`, `/about-us`, `/contact-us`, `/faqs`, `/configuracoes`, 404.
- **Componentes partilhados**: Header (desktop/mobile, pesquisa, conta, favoritos, carrinho), CartDrawer, Footer, Breadcrumbs, Price, Rating, Quantity, Tabs, Accordion, Pagination, ProductCard, ProductGrid, ProductCarousel, DealCard, HeroSlider, PromoGlider, FeatureBoxes, PreorderBanner, BlogCard/BlogSection, Toast.
- **Imagens**: recursos originais da demonstração descarregados para `public/assets/` (capas, banners, fotografias, ícones, logótipo, fonte de ícones `fontsite` e Rubik). A limitação de licenciamento das capas/banners de terceiros é registada no relatório final, sem substituições silenciosas.

## 4. Estrutura de pastas

```
src/
  config/store.ts            Configuração central (taxa, fonte, data, chaves de persistência)
  lib/pricing.ts             Conversão e formatação AOA (única fonte monetária)
  lib/storage.ts             Persistência local tipada
  context/                   SettingsContext, StoreContext, ToastContext
  data/                      products, posts, site, reviews
  components/layout/         Header, MobileNav, Footer, Layout, CartDrawer, SearchOverlay
  components/ui/             Price, Rating, Quantity, Breadcrumbs, Tabs, Accordion, Pagination...
  components/shop/           ProductCard, ProductGrid, ProductCarousel, DealCard
  components/home/           HeroSlider, PromoGlider, FeatureBoxes, PreorderBanner, BlogCarousel
  pages/                     Home1, Home2, Shop, Category, Product, Cart, Checkout, ...
  styles/                    base.css, layout.css, components.css, pages.css
public/
  assets/                    Imagens e fontes originais
  manus-routes.json          Manifesto de rotas
```

## 5. Comportamento por página

- **Homepage 1**: hero Batman/Forza/Titanfall; 4 vantagens brancas sobrepostas (-150px); Jogos em Destaque com abas; Ofertas da Semana com contagem decrescente; banners Mortal Kombat/Overwatch 2; pré-reserva Assassin's Creed; Jogos Recentes (10); Notícias Recentes (4); rodapé.
- **Homepage 2**: hero Xbox Game Pass/League of Legends/The Witcher 3; vantagens em cartões escuros; restantes secções equivalentes com banners Doom Eternal/Assassin's Creed 3 e pré-reserva Uncharted 4; área de conteúdo escura.
- **Loja/categorias**: título, migalhas, filtros (categorias, preço, avaliação, etiquetas), ordenação, 12 por página, paginação, vista em grelha; filtros móveis em gaveta.
- **Produto**: galeria, título, avaliação, preço AOA, descrição curta, quantidade, adicionar ao carrinho, favoritos, comparação, categorias/etiquetas, separadores Descrição/Avaliações com formulário, produtos relacionados.
- **Carrinho/Checkout**: tabela editável, subtotais/total, cupão informativo, checkout validado em duas colunas, método "Pagamento na entrega (demonstração)", confirmação de encomenda com número.
- **Wishlist/Comparação**: tabelas funcionais, remoção, adição ao carrinho, atualização dos indicadores.
- **Conta**: entrar/criar conta/recuperar palavra-passe em modo demonstração, dados pessoais, histórico de encomendas.
- **Blog/Institucionais**: listagem paginada, artigo com comentários e relacionados, Sobre, Contactos com validação, FAQs expansíveis.
- **Configurações**: taxa USD/AOA, fonte e data no formato DD/MM/AAAA, pré-visualização de conversão, reposição da taxa BNA por omissão.

## 6. Responsividade e acessibilidade

Breakpoints: 1600, 1440, 1200, 1024, 768, 480. Em ≤1024: menu hambúrguer, barra inferior fixa (Categorias, Pesquisar, Desejos, Carrinho), grelha de 2 cartões em mobile, sidebar da loja em gaveta, hero 480:300. Sem scroll horizontal; foco visível; `aria-label` em ícones; navegação por teclado nos menus; `prefers-reduced-motion` desativa autoplay e transições longas.
