# TODO — GameAO

## 1. Configuração central da taxa USD/AOA e preços em kwanzas

- [x] A taxa de conversão USD/AOA é configurável e centralizada, nunca escrita diretamente no código dos componentes; existe uma única configuração por omissão com taxa, fonte (Banco Nacional de Angola) e data de atualização (13/11/2026).
- [x] Ao alterar a taxa em `/configuracoes`, todos os preços da loja, categorias, cartões, carrinho, descontos, comparação, checkout e confirmação são recalculados automaticamente, sem recarregar a página.
- [x] Todos os preços visíveis usam uma única função de conversão/formatação no formato `79.000,00 Kz`; não existe qualquer símbolo `$`, preço em USD ou valor AOA escrito à mão na interface.
- [x] Os preços-base dos produtos permanecem em USD nos dados; preços promocionais e anteriores derivam do mesmo preço-base e da mesma taxa.
- [x] A configuração persiste após atualizar a página e pode ser reposta para a taxa BNA por omissão.

## 2. Identidade visual e estrutura global (cabeçalho, navegação, rodapé)

- [x] Cabeçalho preto `#00080f` de 90px com logótipo GAMESHOP original, menu (Início com submenu das duas homepages, Loja com submenu de categorias, Notícias, Jogos, Xbox, PlayStation, PC), pesquisa com categorias, conta, favoritos e carrinho com indicadores.
- [x] Menus suspensos, pesquisa, indicadores de quantidade e carrinho lateral funcionam; o cabeçalho é fixo e encolhe ao rolar; em mobile há menu hambúrguer, cabeçalho de 60px e barra inferior fixa.
- [x] Rodapé completo `#00080f` com apresentação da loja, blog (2 artigos), etiquetas de produtos, categorias, informações, copyright e ícones sociais; todos os links internos funcionam.
- [x] Paleta, tipografia Rubik, tamanhos, espaçamentos, ícones e botões-pílula laranja `#cd3d0f` correspondem à referência; nenhuma secção ou identidade visual nova é introduzida.

## 3. Homepage 1 e Homepage 2

- [x] Homepage 1 (`/`) reproduz hero Batman Arkham Knight/Forza Horizon 5/Titanfall 2 em fade (2s de transição, 10s de intervalo, autoplay), vantagens sobrepostas ao hero, Jogos em Destaque, Ofertas da Semana, banners Mortal Kombat/Overwatch 2, pré-reserva Assassin's Creed, Jogos Recentes (10 cartões) e Notícias Recentes (4).
- [x] Homepage 2 (`/homepage-2`) reproduz hero Xbox Game Pass/League of Legends/The Witcher 3, vantagens em cartões escuros, Jogos em Destaque, Ofertas da Semana, banners Doom Eternal/Assassin's Creed 3, pré-reserva Uncharted 4, Jogos Recentes (10 cartões) e Notícias Recentes (4).
- [x] As abas Todos/Xbox/PlayStation/PC filtram efetivamente os produtos; os carrosséis têm setas funcionais; os contadores decrescentes das ofertas estão ativos; os banners mantêm imagens, proporções, sobreposições e botões.
- [x] Animações de entrada, hover de cartões (elevação/zoom), transições de menus e efeitos de scroll reproduzem a referência e respeitam `prefers-reduced-motion`.

## 4. Loja, categorias e páginas de produto

- [x] `/shop` apresenta título, migalhas, filtros de categorias com contagens, filtro de preço, avaliação e etiquetas, ordenação, seletor de resultados, grelha de 4 colunas e paginação real (15 produtos, 12 por página).
- [x] As rotas `/product-category/game`, `/xbox`, `/playstation`, `/pc` e `/featured` existem, apresentam apenas os produtos da categoria e mantêm filtros, ordenação e paginação funcionais.
- [x] Cada um dos 15 produtos tem rota `/product/:slug` com galeria, título, avaliação e número de avaliações, preço em Kz, descrição curta, quantidade (+/−), adicionar ao carrinho, favoritos, comparação, categorias, etiquetas, separadores Descrição/Avaliações, formulário de avaliação funcional e produtos relacionados.
- [x] A pesquisa (cabeçalho e loja) procura por nome, categoria e etiquetas e apresenta resultados corretos; não existem links internos quebrados.

## 5. Carrinho, checkout e encomendas

- [x] O carrinho persiste durante a navegação e após refresh; adicionar/remover/alteração de quantidade recalcula subtotais, total e o indicador do cabeçalho imediatamente.
- [x] `/cart` reproduz a tabela WooCommerce (produto, preço, quantidade, subtotal, remover), cupão informativo, totais e botões Continuar a Comprar / Finalizar Compra; o estado vazio é tratado.
- [x] `/checkout` tem formulário validado (nome, apelido, empresa, país Angola, endereço, cidade, província, telefone, email, notas), resumo da encomenda e método "Pagamento na entrega (demonstração)"; não processa pagamentos reais.
- [x] Ao confirmar, é criada uma encomenda com número, o carrinho é limpo e surge a confirmação; a encomenda fica no histórico de `/my-account/orders`.

## 6. Favoritos, comparação e conta

- [x] `/wishlist` permite adicionar/remover produtos, ver a lista guardada e adicionar ao carrinho; o indicador do cabeçalho atualiza.
- [x] `/compare` permite comparar pelo menos dois produtos (até 4) numa tabela com imagem, nome, preço, avaliação, disponibilidade, categorias, etiquetas e ações.
- [x] `/my-account` permite entrar, criar conta, recuperar palavra-passe, editar dados pessoais e terminar sessão em modo demonstração; `/my-account/orders` mostra o histórico e os detalhes das encomendas; fica claro o que depende de infraestrutura futura.

## 7. Notícias, blog e páginas institucionais

- [x] `/category/news` lista os 9 artigos com imagem, título, autor, data, categoria, excerto, Ler Mais e paginação; a barra lateral (artigos recentes e etiquetas) está presente.
- [x] `/blog/:slug` apresenta título, meta, imagem, conteúdo em português, etiquetas, partilha, comentários (lista e formulário) e artigos relacionados.
- [x] `/about-us` reproduz imagem e texto de apresentação, 3 vantagens, equipa com 8 membros e 3 blocos finais; `/contact-us` tem informações de demonstração e formulário validado com mensagem de sucesso; `/faqs` tem perguntas em duas colunas e acordeão expansível.

## 8. Localização integral em português de Angola

- [x] Todos os menus, botões, títulos, descrições, categorias, mensagens de sucesso/erro, estados vazios, formulários, carrinho, checkout, favoritos, comparação, blog, rodapé e filtros estão em português natural; não resta texto em inglês nem Lorem Ipsum.
- [x] Nomes comerciais de jogos, marcas e consolas permanecem na designação oficial (God of War, Forza Horizon 5, PlayStation, Xbox, etc.).
- [x] Contactos e dados da loja são identificados como demonstração/editáveis, sem inventar dados reais.

## 9. Responsividade e qualidade

- [x] Desktop 1920×1080, 1440×900, 1366×768; tablet 768×1024; mobile 390×844 e 375×812 sem scroll horizontal, textos cortados ou imagens distorcidas.
- [x] Em mobile o cabeçalho, menu, pesquisa, barra inferior, cartões (2 colunas), banners, carrosséis com toque, botões e filtros funcionam; a versão mobile não é uma simplificação excessiva.
- [x] Não há erros críticos na consola, imagens em falta ou links quebrados; todas as rotas abrem e o manifesto `/manus-routes.json` corresponde ao código.
- [x] Validação final por agente independente contra este TODO e o plano, com correção dos problemas confirmados (imagem principal do Dirt 5, texto "FAQs" e sincronização dos dados de perfil após novo login).


## 10. Evidência de validação

- [x] `test_flow.py`: 46/46 verificações passaram (taxa configurável, preços Kz, filtros, pesquisa, carrinho, checkout, encomenda, conta, rotas, ausência de `$` e erros JS).
- [x] `test_extra.py`: 20/20 verificações passaram (registo/login/logout/recuperação, contacto, FAQ, comentários, pesquisa por categoria, adicionar do cartão, validação do checkout, atualização do carrinho com nova taxa, menu/pesquisa/carrinho mobile).
- [x] Auditoria de recursos: 23 rotas sem falhas HTTP, 69 links internos sem quebras, 0 imagens em falta, 0 overflow horizontal entre 375 e 1920 px.
- [x] Build de produção (`pnpm build`) concluído; fallback de rotas profundas e `manus-routes.json` verificados no `vite preview`.
- [x] Validação independente executada com testes próprios do validador: 0 preços inválidos, 0 símbolos `$`, 0 Lorem Ipsum, 0 textos ingleses visíveis, 0 links quebrados e 0 imagens quebradas após correção. Defeitos encontrados: imagem em falta do Dirt 5, "FAQs" em inglês e perfil vazio após novo login — todos corrigidos.
