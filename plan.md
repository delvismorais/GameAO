# Plano de Implementação — GameAO (reconstrução do GameShop)

## 1. Objetivo e âmbito

Reconstruir e evoluir com fidelidade visual, estrutural e funcional o template WordPress/WooCommerce **GameShop (TemplateMonster #365728)**, usando como referência a demonstração oficial `https://hex-wp.com/gameshop/` e, com prioridade, a **Homepage 2** (`/homepage-2-visual-builder/`). A interface permanece em português de Angola, os preços em kwanzas (AOA/Kz) e os produtos mantêm o preço-base em USD com taxa configurável. A nova fase transforma a base visual numa plataforma operacional: servidor, base de dados persistente, autenticação própria, painel administrativo ligado aos mesmos dados da loja, encomendas, acompanhamento, SEO e infraestrutura. Pagamentos ficam desacoplados e pendentes de fornecedor e credenciais sandbox; nenhuma confirmação de pagamento será simulada.

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

### 3.1. Fase do painel administrativo e comunicação

Esta fase mantém o shell administrativo próprio do GameAO e usa a demonstração DashboardPack fornecida pelo utilizador apenas como referência de organização: sidebar persistente, topbar compacta, cartões de resumo, tabelas filtráveis e adaptação mobile. Não são copiados ativos, HTML ou identidade da referência.

- **Pesquisa de encomenda para comunicação**: a rota protegida `/api/admin/notification-orders/lookup` procura pelo número da encomenda e devolve apenas a ficha necessária ao operador, itens e histórico recente de entregas.
- **Envio manual associado à encomenda**: `/api/admin/notifications/manual` recebe canal, destinatário, assunto e corpo editáveis, renderiza variáveis no servidor e chama o adaptador real de email, SMS, WhatsApp ou in-app. Cada tentativa fica ligada a `shop_orders` e `notification_deliveries`.
- **Modelos**: o centro de notificações passa a criar, editar, ativar/desativar e eliminar modelos por evento/canal, com variáveis documentadas e pré-visualização.
- **Campanhas em massa**: o fluxo de campanhas de email continua baseado em leads subscritos, ganha variáveis por destinatário, confirmação explícita antes do envio e o mesmo registo de entrega usado pelas mensagens transacionais.
- **Segurança operacional**: todas as rotas exigem administrador, usam queries parametrizadas, limitam o tamanho dos payloads e não expõem credenciais. Falhas de provedor não interrompem a encomenda nem são apresentadas como sucesso.

### Biblioteca de emails e envio manual — implementação atual

- A biblioteca contém 17 categorias: Agradecimento, Aniversário, Anúncio, Boas-vindas, Confirmação, Feedback, Lançamento, Lembrete, Notificação, Novo produto, Oferta especial, Onboarding, Post de blog, Progresso, Reengajamento, Saudação e Venda. Os textos originais ficam uma só vez em `notification_templates`; o compositor manual seleciona esses mesmos registros e o editor permite associar qualquer modelo de email a um evento automático existente.
- `automatic_event_key` é opcional. Quando atribuído, o motor de notificações prioriza o modelo ativo associado a esse evento e mantém intacto o modelo legado específico do evento como alternativa; o modelo Boas-vindas fica associado por omissão a `user.welcome`.
- Os modelos de email serão responsivos e incluirão o logo, uma imagem existente do catálogo GameAO, preheader, CTA, slogan, contactos e assinatura. `emailLayout()` será o wrapper comum para conservar a identidade da marca.
- O envio manual permitirá escolher um modelo e personalizar assunto/conteúdo, com destinatário individual ou envio em massa para contatos subscritos. O envio em massa manterá a restrição de consentimento, o limite de 5.000 destinatários, a confirmação explícita e o registo de entregas já usados pelas campanhas. O acesso está disponível em Notificações e em Marketing → Campanhas, com atalhos para email manual e SMS.
- O envio SMS manual terá número de destino, mensagem, validação angolana e envio pelo adaptador TelcoSMS existente, sem expor credenciais.
- A referência Brevo servirá apenas para padrões genéricos de responsividade, campos dinâmicos, pré-visualização e CTA claro. A página antiga Morásio servirá apenas para inspirar organização em secções/cartões; não serão copiados código, modelos proprietários nem listas de contatos.

## 3. Stack e arquitetura

- **React 19 + TypeScript + Vite 7 + React Router 7**, mantendo os componentes e CSS existentes. O backend será servido pelo mesmo projeto através do servidor Webdev; a base de dados MySQL gerida será a fonte de verdade para utilizadores, produtos, conteúdos, carrinho, encomendas, pagamentos, notificações e auditoria. O `localStorage` fica apenas como apoio transitório/offline e não substitui os dados comerciais persistentes.
- **Sem Tailwind**: CSS próprio organizado por camadas (`base`, `layout`, `components`, `pages`), com as variáveis exatas do tema original. Regras específicas do WooCommerce (formulários, tabelas, separadores, estrelas, avisos) são recriadas com os mesmos valores visuais da folha `woocommerce.css` do tema.
- **Dados separados da apresentação na migração**: os dados atuais de `src/data/products.ts`, `src/data/posts.ts` e `src/data/site.ts` serão preservados como seed/import inicial; depois, os componentes passam a ler os registos da base de dados e mantêm fallback controlado apenas durante a migração.
- **Gestão centralizada de preços**: `src/config/store.ts` contém a configuração por omissão (taxa USD/AOA 913,000, fonte BNA, data 13/11/2026, nota de demonstração). `SettingsContext` lê/guarda a taxa em `localStorage` e propaga-a a toda a árvore. `src/lib/pricing.ts` expõe `usdToAoa`, `formatAoa` e `formatUsdAsAoa`; **nenhum preço de produto em AOA é escrito à mão**. O componente `Price` é a única via de apresentação monetária. Alterar a taxa na página `/configuracoes` recalcula imediatamente loja, cartões, carrinho, descontos, comparação e checkout.
- **Estado da loja**: `StoreContext` será adaptado para consultar e mutar dados via API/tRPC do servidor. Carrinho, wishlist, conta e encomendas passam a ter persistência por utilizador/sessão; os totais continuam derivados em tempo de render e reagem à taxa configurável guardada no backend.
- **Rotas**: `/`, `/homepage-2`, `/shop`, `/product-category/:slug` (game, xbox, playstation, pc, featured), `/product/:slug`, `/cart`, `/checkout`, `/checkout/confirmacao`, `/wishlist`, `/compare`, `/my-account`, `/my-account/orders`, `/category/news`, `/blog/:slug`, `/about-us`, `/contact-us`, `/faqs`, `/configuracoes`, 404.
- **Componentes partilhados**: Header (desktop/mobile, pesquisa, conta, favoritos, carrinho), CartDrawer, Footer, Breadcrumbs, Price, Rating, Quantity, Tabs, Accordion, Pagination, ProductCard, ProductGrid, ProductCarousel, DealCard, HeroSlider, PromoGlider, FeatureBoxes, PreorderBanner, BlogCard/BlogSection, Toast.
- **Imagens**: recursos originais da demonstração descarregados para `public/assets/` (capas, banners, fotografias, ícones, logótipo, fonte de ícones `fontsite` e Rubik). A limitação de licenciamento das capas/banners de terceiros é registada no relatório final, sem substituições silenciosas.

## 4.1. Evolução operacional aprovada

- **Servidor e base de dados**: ativar `features.server` e `features.database` da Manus. Usar migrações determinísticas, aditivas e versionadas; preservar os produtos, conteúdos e imagens atuais durante a importação.
- **Autenticação própria**: contas com email, palavra-passe com hashing seguro, recuperação de palavra-passe, sessões protegidas, validação de campos, proteção contra tentativas abusivas e separação rigorosa entre clientes e administradores. Não transportar credenciais do repositório MD Recargas.
- **Modelo de negócio**: manter o catálogo atual de videojogos do GameAO na primeira migração. O modelo deverá suportar stock, disponibilidade, categorias, plataformas, etiquetas, galerias, produtos relacionados, destaque e variantes futuras sem trocar a aparência dos cartões.
- **Painel administrativo**: dashboard e CRUD real para produtos, categorias, imagens, banners, homepage, artigos, páginas institucionais, encomendas, clientes, avaliações, cupões, configurações e administradores/permissões. Cada alteração deve refletir-se na loja através da mesma base de dados.
- **Encomendas**: checkout ligado ao backend, estados distintos de encomenda e pagamento, histórico cronológico, notas internas, acompanhamento público protegido por número não previsível mais email/dado de verificação, e área de cliente.
- **Pagamentos**: criar uma interface de adaptadores e registos de transação, mas não ativar um fornecedor até o utilizador o indicar e as credenciais sandbox existirem. Webhooks deverão validar assinatura, ser idempotentes e nunca confiar apenas na página de retorno.
- **SEO e infraestrutura**: sitemap dinâmico, robots, títulos/descrições/canónicas/Open Graph por rota pública, segurança de endpoints, logs sem dados sensíveis, exportação/backup operacional e otimização sem redesenhar a interface.

## 4.2. Ordem de implementação

1. Fundação do servidor, base de dados, migrações, seed preservador e camada de API.
2. Autenticação própria, sessão, perfis, permissões e primeiro administrador através de inicialização segura.
3. Produtos, categorias, media, configurações e painel ligado à homepage/loja.
4. Clientes, carrinho persistente, encomendas, checkout e acompanhamento.
5. Adaptadores de pagamento e integração do fornecedor escolhido em sandbox.
6. Blog, páginas, notificações, SEO, auditoria, backup/exportação, desempenho e testes de regressão visual.

## 5. Estrutura de pastas

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

## 6. Comportamento por página

- **Homepage 1**: hero Batman/Forza/Titanfall; 4 vantagens brancas sobrepostas (-150px); Jogos em Destaque com abas; Ofertas da Semana com contagem decrescente; banners Mortal Kombat/Overwatch 2; pré-reserva Assassin's Creed; Jogos Recentes (10); Notícias Recentes (4); rodapé.
- **Homepage 2**: hero Xbox Game Pass/League of Legends/The Witcher 3; vantagens em cartões escuros; restantes secções equivalentes com banners Doom Eternal/Assassin's Creed 3 e pré-reserva Uncharted 4; área de conteúdo escura.
- **Loja/categorias**: título, migalhas, filtros (categorias, preço, avaliação, etiquetas), ordenação, 12 por página, paginação, vista em grelha; filtros móveis em gaveta.
- **Produto**: galeria, título, avaliação, preço AOA, descrição curta, quantidade, adicionar ao carrinho, favoritos, comparação, categorias/etiquetas, separadores Descrição/Avaliações com formulário, produtos relacionados.
- **Carrinho/Checkout**: tabela editável, subtotais/total, cupão informativo, checkout validado em duas colunas, método "Pagamento na entrega (demonstração)", confirmação de encomenda com número.
- **Wishlist/Comparação**: tabelas funcionais, remoção, adição ao carrinho, atualização dos indicadores.
- **Conta**: entrar/criar conta/recuperar palavra-passe em modo demonstração, dados pessoais, histórico de encomendas.
- **Blog/Institucionais**: listagem paginada, artigo com comentários e relacionados, Sobre, Contactos com validação, FAQs expansíveis.
- **Configurações**: taxa USD/AOA, fonte e data no formato DD/MM/AAAA, pré-visualização de conversão, reposição da taxa BNA por omissão.

## 7. Responsividade e acessibilidade

Breakpoints: 1600, 1440, 1200, 1024, 768, 480. Em ≤1024: menu hambúrguer, barra inferior fixa (Categorias, Pesquisar, Desejos, Carrinho), grelha de 2 cartões em mobile, sidebar da loja em gaveta, hero 480:300. Sem scroll horizontal; foco visível; `aria-label` em ícones; navegação por teclado nos menus; `prefers-reduced-motion` desativa autoplay e transições longas.
