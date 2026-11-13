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

## 11. Fundação do backend e da base de dados

- [ ] Ativar o servidor e a base de dados MySQL gerida do GameAO; a base de dados deve ser persistente e partilhada entre desenvolvimento e publicação.
- [ ] Criar migrações determinísticas, aditivas e seguras para utilizadores, papéis/permissões, produtos, categorias, media, banners, conteúdos da homepage, artigos, comentários, avaliações, carrinho, wishlists, encomendas, itens de encomenda, pagamentos/transações, cupões, entregas, configurações, notificações e auditoria.
- [ ] Importar os 15 produtos, os artigos, os conteúdos da homepage e as configurações atuais sem perder nomes, imagens, preços-base, descontos ou informação apresentada; preservar as imagens atuais e o preço-base USD/AOA configurável.
- [ ] A loja, o painel e o checkout devem consultar a mesma fonte de dados; não usar `localStorage` como substituto dos dados comerciais persistentes.
- [ ] Criar API no servidor com validação, autorização, tratamento seguro de erros e consultas parametrizadas; nenhum segredo privado pode chegar ao frontend.

## 12. Contas, autenticação e permissões

- [ ] Implementar autenticação própria por email e palavra-passe, com hashing seguro, sessões protegidas, terminar sessão, manter sessão iniciada, recuperação de palavra-passe, validações, mensagens claras e proteção contra tentativas abusivas.
- [ ] Impedir registos duplicados; aceitar nome completo, email, telefone quando necessário, palavra-passe, confirmação de palavra-passe e aceitação dos termos/política de privacidade.
- [ ] A área do cliente deve permitir editar dados pessoais, alterar palavra-passe, consultar histórico e detalhes de encomendas, estados, endereços quando aplicável e wishlist.
- [ ] Criar papéis Super Administrador, Administrador, Gestor de Produtos, Gestor de Encomendas, Gestor de Conteúdos e Suporte, com permissões específicas; clientes nunca podem elevar privilégios através do navegador.
- [ ] Criar o primeiro Super Administrador através de inicialização segura, sem credenciais públicas predefinidas; nunca guardar ou mostrar palavras-passe em texto simples.

## 13. Painel administrativo ligado à loja

- [ ] Criar dashboard com dados reais do banco: encomendas totais, hoje, pendentes, pagas, em processamento, concluídas e canceladas; clientes, produtos ativos/esgotados, faturação, receita por período, mais vendidos, últimas encomendas e atividade recente; suportar hoje, 7 dias, 30 dias, mês atual, mês anterior e período personalizado.
- [ ] Permitir criar, editar, ativar/desativar e eliminar com confirmação produtos; gerir preços, promoções, stock, disponibilidade, imagens, galerias, descrições, categorias, plataformas, etiquetas, destaque, recomendados, classificações, relacionados e visibilidade.
- [ ] Criar biblioteca de media com upload persistente, visualização, substituição, eliminação de não utilizados, pesquisa, organização, associação a produtos/banners/artigos, validação de formato, dimensões e tamanho.
- [ ] Criar Gestão da Página Inicial para editar/adicionar/remover/ordenar/ativar banners, imagens, títulos, descrições, botões, links, secções, produtos destacados, promoções, carrosséis e datas de campanha sem alterar o layout atual.
- [ ] Permitir gerir categorias, subcategorias, imagens, descrições, ordem, estado e categoria principal.
- [ ] Permitir gerir artigos, rascunhos, publicação/agendamento, capas, categorias, etiquetas, autores, SEO, pré-visualização, páginas institucionais, FAQ, termos, privacidade e devoluções sem alterar os layouts públicos.
- [ ] Permitir gerir avaliações, cupões percentuais/fixos, validade, limites de uso, clientes/produtos/categorias elegíveis, configurações gerais e administradores/permissões.
- [ ] Cada alteração de conteúdo feita no painel deve aparecer realmente na loja, homepage ou checkout sem editar código; operações administrativas importantes devem ficar auditadas.

## 14. Encomendas, checkout e pagamentos preparados

- [ ] Ligar carrinho e checkout ao servidor e banco: criar encomenda após validação, guardar itens/preços/taxa aplicada, limpar o carrinho apenas após criação válida e apresentar confirmação baseada no registo persistente.
- [ ] Criar estados distintos de pagamento: pendente, em processamento, pago, falhado, expirado, cancelado e reembolsado; e estados de encomenda: aguardando pagamento, pagamento confirmado, em processamento, pronta para entrega, concluída, cancelada e reembolsada.
- [ ] Criar módulo administrativo de encomendas com pesquisa por número/cliente, filtros por estado/método/período, itens, cliente, pagamentos, alteração de estado, notas internas, observações, histórico cronológico, cancelamento, reembolso quando suportado e exportação.
- [ ] Preparar arquitetura modular de pagamentos com nome, descrição, logótipo, estado, configuração, validação, processamento, confirmação, transações e idempotência por método.
- [ ] Não ativar fornecedor ou declarar pagamento operacional enquanto não houver fornecedor escolhido, documentação, credenciais protegidas, ambiente sandbox e teste real confirmado; não armazenar cartões, CVV ou chaves no banco/frontend.
- [ ] Nunca considerar uma encomenda paga pelo simples retorno à página de sucesso; a confirmação deve vir do fornecedor/webhook validado ou de ação administrativa autorizada.

## 15. Acompanhamento, entrega e notificações

- [ ] Criar Acompanhar Pedido no estilo GameAO com número não previsível e email/dado de verificação; apresentar número, data, estado, produtos, total, método, estado do pagamento, histórico e última atualização sem expor dados de outras encomendas.
- [ ] Criar linha temporal com os estados reais registados no banco e manter a mesma informação disponível na área do cliente.
- [ ] Modelar entrega para produtos digitais, códigos/licenças, entrega manual e futura entrega automática; registar disponibilidade, associação à encomenda, entrega única e histórico; não inventar códigos ou licenças.
- [ ] Implementar notificações para registo, recuperação, confirmação de encomenda, pagamento confirmado/recusado, processamento, conclusão, cancelamento e reembolso; notificações administrativas para nova encomenda/cliente, pagamentos, cancelamento, stock baixo e esgotado.
- [ ] Criar modelos de email editáveis no painel, identidade GameAO, registo de envio e erros; não declarar email enviado sem serviço configurado.

## 16. SEO, segurança e infraestrutura

- [ ] Criar `/sitemap.xml` dinâmico para produtos, categorias, artigos e páginas públicas, excluindo administração, login, registo, carrinho, checkout e áreas privadas; criar `/robots.txt` coerente.
- [ ] Implementar títulos, descrições, URLs amigáveis, canónicas, Open Graph, imagens de partilha, dados estruturados e SEO editável para produtos, categorias e artigos; usar a origem pública `https://gameao-qjqpj4sf.manus.space/` até existir domínio definitivo.
- [ ] Aplicar validação no servidor, proteção de rotas e permissões, proteção contra SQL injection/XSS/CSRF quando aplicável, rate limiting, validação de uploads, cookies/sessões seguras, gestão de segredos, logs sem dados sensíveis e tratamento seguro de erros.
- [ ] Implementar backup/exportação e recuperação operacional sem apagar dados existentes; otimizar imagens, lazy loading, fontes, cache, índices, consultas, assets, disponibilidade e logs técnicos.
- [ ] Preservar a aparência, cores, tipografia, logótipo, estrutura, imagens, cabeçalho, rodapé, animações, efeitos e responsividade do GameAO; nenhuma nova funcionalidade deve introduzir um redesenho.

## 17. Testes, migração e entrega operacional

- [ ] Testar criação de conta, login, logout, recuperação, bloqueio de acesso indevido e separação cliente/admin.
- [ ] Testar criação/edição de produto, imagem, preço, stock, ativação/desativação e atualização real na loja.
- [ ] Testar banners, imagens, homepage, categorias, artigos, cupões, configurações e permissões no painel, verificando a reflexão na interface pública.
- [ ] Testar carrinho, quantidades, remoção, cupões, totais, criação de encomenda, registo no banco, estados de pagamento e fornecedor em sandbox quando escolhido.
- [ ] Testar acompanhamento válido/inexistente, verificação incorreta, privacidade, alteração no painel e atualização pública.
- [ ] Testar sitemap, robots, canónicas, metadados, dados estruturados, indexação pública, desktop/tablet/mobile e regressão visual contra o checkpoint `1ac1bd5`.
- [ ] Antes de cada deploy, criar ponto de recuperação, verificar variáveis, migrações, autenticação, checkout, integrações, media, permissões e testes; não publicar como concluído enquanto existirem erros críticos.
