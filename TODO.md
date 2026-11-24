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
- [x] Ao confirmar, é criada uma encomenda persistente no MySQL com número único `GA` + ID auto-incremental (por exemplo `GA769`), o carrinho é limpo e surge a confirmação; a fatura fica disponível em dois modelos PDF.
- [x] A API `/api/orders` valida cliente e produtos ativos, guarda itens, preços em AOA, taxa aplicada, estado pendente e histórico inicial; a restrição UNIQUE da base impede repetição do número.
- [x] A confirmação e `/acompanhar-pedido` permitem descarregar a fatura clássica ou moderna com dados da GameAO, cliente, produtos, imagens, preços, descontos, total, taxa e estado.

## 6. Favoritos, comparação e conta

- [x] `/wishlist` permite adicionar/remover produtos, ver a lista guardada e adicionar ao carrinho; o indicador do cabeçalho atualiza.
- [x] `/compare` permite comparar pelo menos dois produtos (até 4) numa tabela com imagem, nome, preço, avaliação, disponibilidade, categorias, etiquetas e ações.
- [x] `/my-account` permite entrar, criar conta, recuperar palavra-passe, editar dados pessoais, consultar indicadores da conta e terminar sessão; `/my-account/orders` mostra o histórico e os detalhes das encomendas.

## 7. Notícias, blog e páginas institucionais

- [x] `/category/news` lista os 9 artigos com imagem, título, autor, data, categoria, excerto, Ler Mais e paginação; a barra lateral (artigos recentes e etiquetas) está presente.
- [x] `/blog/:slug` apresenta título, meta, imagem, conteúdo em português, etiquetas, partilha, comentários (lista e formulário) e artigos relacionados.
- [x] `/about-us` apresenta o logo real da GameAO, texto de apresentação, 3 vantagens, apenas o fundador Delvis de Morais com a sua fotografia e dados, e 3 blocos finais; `/contact-us` tem os contactos oficiais GameAO e formulário validado com mensagem de sucesso; `/faqs` tem perguntas em duas colunas e acordeão expansível.

## 8. Localização integral em português de Angola

- [x] Todos os menus, botões, títulos, descrições, categorias, mensagens de sucesso/erro, estados vazios, formulários, carrinho, checkout, favoritos, comparação, blog, rodapé e filtros estão em português natural; não resta texto em inglês nem Lorem Ipsum.
- [x] Nomes comerciais de jogos, marcas e consolas permanecem na designação oficial (God of War, Forza Horizon 5, PlayStation, Xbox, etc.).
- [x] Contactos oficiais apresentados: 973 929 712 e geral@gameao.shop.

## 9. Responsividade e qualidade

- [x] Desktop 1920×1080, 1440×900, 1366×768; tablet 768×1024; mobile 390×844 e 375×812 sem scroll horizontal, textos cortados ou imagens distorcidas.
- [x] Em mobile o cabeçalho, menu, pesquisa, barra inferior, cartões (2 colunas), banners, carrosséis com toque, botões e filtros funcionam; a versão mobile não é uma simplificação excessiva.
- [x] Não há erros críticos na consola, imagens em falta ou links quebrados; todas as rotas abrem e o manifesto `/ambiente de execução-routes.json` corresponde ao código.
- [x] Validação final por agente independente contra este TODO e o plano, com correção dos problemas confirmados (imagem principal do Dirt 5, texto "FAQs" e sincronização dos dados de perfil após novo login).


## 10. Evidência de validação

- [x] `test_flow.py`: 46/46 verificações passaram (taxa configurável, preços Kz, filtros, pesquisa, carrinho, checkout, encomenda, conta, rotas, ausência de `$` e erros JS).
- [x] `test_extra.py`: 20/20 verificações passaram (registo/login/logout/recuperação, contacto, FAQ, comentários, pesquisa por categoria, adicionar do cartão, validação do checkout, atualização do carrinho com nova taxa, menu/pesquisa/carrinho mobile).
- [x] Auditoria de recursos: 23 rotas sem falhas HTTP, 69 links internos sem quebras, 0 imagens em falta, 0 overflow horizontal entre 375 e 1920 px.
- [x] Build de produção (`pnpm build`) concluído; fallback de rotas profundas e `ambiente de execução-routes.json` verificados no `vite preview`.
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

- [x] Criar dashboard administrativo com dados reais do banco: encomendas totais, pendentes, pagas, clientes, produtos ativos e artigos publicados, últimas encomendas e atalhos para as áreas operacionais.
- [x] Organizar o painel administrativo numa navegação própria com abas de Visão geral, Pedidos e faturas, Produtos e Configuração; limitar o acesso a contas administrativas autorizadas.
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

- [x] Criar Acompanhar Pedido no estilo GameAO com número `GA` e email de verificação; apresentar número, cliente, produtos, total, estado do pedido e pagamento, sem expor dados de outra encomenda.
- [x] Ao alterar o estado no painel administrativo, guardar o histórico, auditar a operação e criar tentativas de notificação por email e WhatsApp para o cliente; cada canal fica explicitamente como enviado, falhado ou não configurado.
- [ ] Criar linha temporal com os estados reais registados no banco e manter a mesma informação disponível na área do cliente.
- [ ] Modelar entrega para produtos digitais, códigos/licenças, entrega manual e futura entrega automática; registar disponibilidade, associação à encomenda, entrega única e histórico; não inventar códigos ou licenças.
- [ ] Implementar notificações para registo, recuperação, confirmação de encomenda, pagamento confirmado/recusado, processamento, conclusão, cancelamento e reembolso; notificações administrativas para nova encomenda/cliente, pagamentos, cancelamento, stock baixo e esgotado.
- [ ] Criar modelos de email editáveis no painel, identidade GameAO, registo de envio e erros; não declarar email enviado sem serviço configurado.

## 16. SEO, segurança e infraestrutura

- [ ] Criar `/sitemap.xml` dinâmico para produtos, categorias, artigos e páginas públicas, excluindo administração, login, registo, carrinho, checkout e áreas privadas; criar `/robots.txt` coerente.
- [ ] Implementar títulos, descrições, URLs amigáveis, canónicas, Open Graph, imagens de partilha, dados estruturados e SEO editável para produtos, categorias e artigos; usar a origem pública `https://gameao.shop/` até existir domínio definitivo.
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

## 18. Centro de comunicação e painel responsivo — fase atual

- [ ] O painel administrativo deve manter a vibe GameAO e usar a referência DashboardPack apenas para organização: sidebar persistente, topbar, cartões de resumo, tabelas filtráveis, estados claros e layout responsivo sem alterar o website público.
- [ ] O centro de notificações deve permitir pesquisar uma encomenda pelo número, apresentar cliente, email, telefone, total, estado e itens, e carregar essa ficha automaticamente para o envio manual.
- [ ] O envio manual deve permitir escolher email, SMS, WhatsApp ou notificação interna, aceitar destinatário/assunto/corpo personalizados, inserir variáveis do pedido, usar modelos por evento e registar a tentativa com estado enviado, falhou, não configurado ou ignorado.
- [ ] Os modelos devem poder ser criados, editados, ativados/desativados e eliminados, com pré-visualização e indicação das variáveis suportadas; nenhuma credencial de provedor pode chegar ao frontend.
- [ ] As entregas devem poder ser filtradas por canal, estado e número da encomenda e mostrar o erro devolvido pelo provedor quando existir.
- [ ] As campanhas devem permitir guardar rascunhos, personalizar assunto/HTML/texto, escolher audiência de leads subscritos, pré-visualizar e pedir confirmação antes de enviar em massa; cada destinatário deve usar o seu nome e ficar registado no histórico.
- [ ] A interface mobile deve manter todas as funções num drawer/tabs roláveis, converter filtros e formulários para uma coluna, manter tabelas em scroll contido e evitar overflow horizontal do viewport em 375px, 390px, 768px e desktop.

## 19. Correções de regressão — novembro de 2026

- [x] O catálogo de produtos do admin ocupa uma única coluna disponível no desktop/tablet, usa colunas estáveis e não força largura mínima de 980px.
- [x] A listagem de produtos do admin transforma-se em cartões no mobile, com ações e metadados legíveis sem overflow horizontal.
- [x] O filtro de stock passou a usar `&&` entre as condições, evitando incluir produtos fora do controlo de stock previsto.
- [x] As páginas de Política de Privacidade e Termos e Condições foram reescritas com contactos GameAO, data de atualização, secções completas e sem placeholders.
- [x] A página Sobre Nós deixou de apresentar equipa genérica: usa o logo real GameAO e apresenta apenas Delvis de Morais como CEO & Fundador, com a fotografia e biografia fornecidas.
- [x] Typecheck, build de produção, rotas profundas HTTP e inspeção visual das páginas públicas e do painel foram validados sem erros de runtime.

## 20. Biblioteca de templates GameAO e envios manuais — tarefa atual

- [x] Disponibilizar 17 modelos de email com conteúdo original nas categorias **Agradecimento, Aniversário, Anúncio, Boas-vindas, Confirmação, Feedback, Lançamento, Lembrete, Notificação, Novo produto, Oferta especial, Onboarding, Post de blog, Progresso, Reengajamento, Saudação e Venda**. Os mesmos registros são selecionáveis no envio manual e podem ser associados a eventos no motor automático; por omissão, Boas-vindas está associado a `user.welcome`, sem substituir nem apagar o modelo legado.
- [x] Cada modelo usa identidade GameAO e conteúdo apropriado à categoria, com imagem, logo, slogan, contactos, assinatura, assunto e variáveis dinâmicas. A referência Brevo e o painel antigo Morásio orientaram apenas padrões de apresentação e organização; os textos são originais e não copiam literalmente layouts, texto ou ativos proprietários.
- [x] Criar envio manual de email para selecionar um modelo, personalizar o conteúdo, definir assunto, escolher um destinatário individual ou envio em massa e pré-visualizar antes do envio. Está acessível em **Notificações** e em **Marketing → Campanhas**. O envio em massa é restrito a contatos com subscrição ativa, limitado a 5.000 destinatários e exige confirmação antes de enviar.
- [x] Criar envio manual de SMS com campo de número de destino, campo de mensagem, ação de envio, validação de número e registo do estado da entrega, sem expor a chave TelcoSMS. Acesso disponível em Notificações e por atalho em Marketing → Campanhas.
- [x] O painel permanece responsivo, mostra estados claros e separa composição, pré-visualização e confirmação de envio. Nenhum email ou SMS foi enviado durante a implementação; não houve escrita no banco compartilhado.


## 21. Fiabilidade de notificações, comprovativos e faturas — novembro de 2026

- [x] Emails manuais e automáticos para compra, contacto, submissão de comprovativo e atualização/revisão de encomenda devem ser enfileirados de forma persistente, devolver resposta rápida ao navegador e ter estado final consultável, sem ficar indefinidamente em “A enviar…”. Campos personalizados como nome, email, telefone e dados do pedido devem ser interpolados corretamente.
- [x] A entrega automática e manual de SMS deve usar modelos editáveis por evento, com seleção/pré-visualização no compositor manual e personalização de variáveis; o SMS deve ser processado independentemente de SMTP lento e o resultado precisa distinguir fila, sucesso e falha.
- [x] Ao enviar comprovativo, depois de arquivo e estado serem persistidos, a interface deve mostrar confirmação sem aguardar SMS/email nem atualização secundária, e falhas de notificação não podem transformar uma submissão já guardada em erro aparente que incentive reenvio.
- [x] As duas faturas PDF devem mostrar cabeçalho e contactos atuais da GameAO, dados do cliente, itens e valores legíveis, totais corretos, quebras de página sem sobreposições/cortes e rodapé dentro da página; nenhuma imagem remota ou caminho arbitrário deve ser embutido no PDF.
- [x] Validar com testes locais/fixtures sem mensagem real, sem encomenda/comprovativo real e sem operações de escrita na base de produção; executar typecheck/build e inspecionar os PDFs gerados localmente.


## 22. Email responsivo, filtros de categorias, assistente virtual e faturas — novembro de 2026

- [x] Os emails automáticos e manuais devem usar o mesmo layout responsivo, manter o logo, slogan, contactos e assinatura, apresentar imagens com URL HTTPS absoluta, texto alternativo e links funcionais para a loja/conteúdo; o texto e o CTA devem continuar utilizáveis se o cliente bloquear imagens remotas. Não afirmar que o remetente pode obrigar Gmail/Outlook ou outro cliente a mostrar imagens externas bloqueadas.
- [x] As páginas e filtros de categoria devem aceitar slugs dinâmicos do catálogo, incluindo `/product-category/free-fire`, e apresentar os produtos associados sem redirecionar indevidamente para `/shop`.
- [x] O acompanhamento de pedidos permanece protegido: o utilizador confirmou manter a verificação pelo email da compra ou token seguro; não implementar consulta somente pelo número nem ampliar a resposta pública.
- [x] Criar assistente virtual global, visível nas páginas do site e minimizado por omissão no canto inferior direito; a caixa de diálogo deve ser acessível, adaptável a desktop e mobile, caber no viewport e não impedir o uso da página.
- [x] O assistente deve responder em português com informação pública atual do catálogo, categorias, FAQ, artigos publicados e configurações da loja; o contexto é lido no servidor a cada pedido, sem usar dados pessoais, encomendas, comprovativos ou instruções de conteúdo publicado como comandos confiáveis.
- [x] A integração Gemini ocorre somente no backend através da variável privada no Render, com limites de entrada/saída, timeout e rate limit; nenhuma chave é enviada ao navegador, incluída em `VITE_*`, commitada ou exibida em logs. O utilizador confirmou a configuração e o único pedido público alcançou o Gemini, que respondeu 503 por alta procura; nenhuma chave foi consultada, alterada ou exposta.
- [x] As duas faturas devem manter a marca GameAO e incluir o nome empresarial **MORÁSIO DIGITAL**, NIF **5002678500** e o domínio **gameao.shop**, sem remover nem ocultar a GameAO.
- [x] O número do pedido deve ser mostrado no cabeçalho da fatura no mesmo tamanho tipográfico de **FATURA**, mantendo alinhamento e sem colisões nos templates clássico e moderno.
- [x] Validar por build, testes de renderização e fixture PDF local, sem criar encomendas, sem submeter comprovativos reais e sem enviar emails/SMS de teste.

## 23. Variantes dinâmicas, checkout, faturas e latência Gemini — novembro de 2026
- [x] A página do produto apresenta variantes ativas com nome, preço e descrição, atualiza o preço ao selecionar uma opção e bloqueia a compra de produtos dinâmicos sem opções válidas; a seleção usa controlos responsivos. Botões rápidos de cartões, comparação e favoritos não escolhem uma variante silenciosamente e encaminham o utilizador para a escolha.
- [x] A rota direta de um produto dinâmico aguarda a resposta inicial do catálogo antes de decidir que o produto não existe; a inspeção no site publicado confirmou que `/product/jogos-digital-ps4ps5` abre diretamente, mostra as 92 variantes ativas e atualiza o preço ao selecionar outra opção.
- [x] O carrinho identifica linhas pelo par produto+variante, migra linhas antigas para uma variante ativa quando disponível, mostra preço/quantidade/subtotal e mantém edição/remoção independentes mesmo para duas variantes do mesmo produto.
- [x] O checkout carrega a opção da linha, permite alterá-la por linha, apresenta nome/preço no resumo e envia o ID para validação autoritativa no servidor.
- [x] O POST `/api/orders` rejeita o pedido inteiro se qualquer produto, variante ou quantidade for inválido. As opções são verificadas por produto e atividade; as quantidades são inteiras entre 1 e 99; todas as linhas, cupão e endereço são validados antes da reserva agregada de stock. Falhas transacionais fazem rollback. Não foram criadas encomendas nem escritas na base de produção.
- [x] Os dois templates de fatura incluem o nome da variante e medem “Dados da loja”/“Faturado a” antes do desenho, usando a mesma altura máxima calculada. Fixtures locais com conteúdo longo e 48 linhas em ambos os templates confirmaram texto de variante e paginação em 5 páginas, sem escritas na base partilhada.
- [ ] A rota do assistente paraleliza quatro consultas de contexto e aplica deadline global. Para 408/429/5xx e timeout/falha de transporte há espera curta com jitter e fallback documentado `gemini-3.6-flash`; falhas devolvem mensagens seguras. A eficácia deste fallback permanece por confirmar em produção: o único teste autorizado, feito antes destas alterações, respondeu 502 em 1.227 ms e os logs do Render registaram sobrecarga do `gemini-3.8-flash`.
- [x] Mensagens internas falhadas são excluídas do histórico enviado em turnos seguintes. Erros mostrados ao utilizador são genéricos; a chave e os detalhes técnicos não são enviados ao frontend nem incluídos nos logs da rota.
- [x] Foi feita exatamente uma consulta pública benigna autorizada, sem dados pessoais: resposta HTTP 502 após 1.227 ms. Nenhuma chave foi consultada ou alterada. Não foram criados pedidos, enviados emails/SMS ou submetidos comprovativos.
- [x] `git diff --check`, `pnpm typecheck` e `pnpm build` passaram; verificações sintéticas confirmaram regras estáticas de produto/variante/quantidade/stock e fixtures locais dos PDFs. Após o deploy final `038fad0`, a rota do produto foi inspecionada em desktop (1440×900) e mobile (390×844); o seletor e preço renderizaram em ambos, a troca para outra variante alterou o preço em desktop, e não foram iniciados carrinho, checkout ou pedido.


## 24. Estado real dos emails, Groq e avatar do assistente — novembro de 2026

- [x] O envio manual permanece numa fila persistente e só apresenta a mensagem como aceite depois de o provedor responder com sucesso e um identificador. A interface deve separar “aceite pelo serviço de email” de “entregue ao servidor do destinatário”; não pode afirmar que chegou à caixa de entrada nem que foi lido. Typecheck/build locais passaram.
- [ ] O serviço Resend deve poder reconciliar, por webhook autenticado, os eventos de email enviado/aceite, entregue, atrasado, falhado, bounce permanente, suprimido e reclamação de spam; eventos duplicados não podem duplicar alterações, e os registos das entregas ligadas a pedidos devem receber o mesmo estado atualizado. Código, segredo dedicado e endpoint com os sete eventos estão configurados/ativos em produção; ainda falta observar um evento real para confirmar receção ponta a ponta.
- [x] O histórico administrativo deve mostrar o estado correto e, quando disponível, o identificador do provedor para consulta; falhas devem permanecer consultáveis sem as apresentar como sucesso.
- [x] O assistente deixa Gemini e usa apenas `GROQ_API_KEY` e `GROQ_MODEL` no servidor, com `openai/gpt-oss-20b` como modelo solicitado/predefinido, mantendo contexto público atual, limites, timeout, mensagens seguras e sem expor credenciais ao navegador. A resposta/payload Groq foi validada com fetch simulado.
- [x] A imagem fornecida `/home/ubuntu/upload/MascoteIAGamerGAMEAO.png` foi copiada sem substituir o original e usada como avatar do assistente no botão minimizado e na conversa, com apresentação responsiva; SHA-256 da cópia confere com o original.
- [x] Não foram consultadas nem alteradas chaves do Render; não foram enviados emails ou SMS de teste; não foram criadas encomendas; não foram submetidos comprovativos reais; não foi repetida chamada pública ao assistente. Mapeamento Groq/Resend foi validado localmente com provedor simulado, e `pnpm typecheck`, `pnpm build` e `git diff --check` passaram.
- [x] O `RESEND_WEBHOOK_SECRET` dedicado foi configurado no Render sem consultar ou revelar o valor, e o endpoint publicado foi registado e ativado no Resend para os sete eventos suportados; não reutilizar a chave de envio como segredo de webhook. O deploy ficou `live` e `/api/health` retornou `ok=true`/`database_ready=true`. Nenhum evento consta no Resend porque nenhum email foi enviado; a receção real ainda não está comprovada.


## 25. Fiabilidade e formatação das respostas do assistente — novembro de 2026

- [x] As sugestões de produtos são apresentadas como lista estruturada e legível, com ênfase e links internos; o renderizador não interpreta HTML arbitrário nem ativa ligações com protocolos perigosos. Em tablets e telemóveis, o assistente fica elevado acima da navegação fixa e não cobre o botão Carrinho. Validado com fixtures locais.
- [x] A interface apresenta o erro seguro enviado pelo backend e oferece nova tentativa sem duplicar a pergunta no histórico.
- [x] Em HTTP 429 da Groq, a resposta explica a indisponibilidade e respeita o cabeçalho `Retry-After` quando fornecido; a chave e o modelo existentes não foram consultados nem alterados.
- [x] Fixtures sintéticas, typecheck, build e diff-check passaram; não foi feita chamada pública ao assistente.


## 26. Autenticação inspirada no Login Page V04 — novembro de 2026

- [x] Adaptar a composição visual do Colorlib Login Page V04 com fundo visual contínuo, conteúdo de marca sobreposto, cartão translúcido de formulário, abas Entrar/Criar conta, campos com foco claro e controlo acessível de palavra-passe; não copiar código, textos, marca ou ativos proprietários da referência.
- [x] Reutilizar `public/assets/auth-switch.jpg` como imagem de fundo gaming, com contraste suficiente para a leitura e sem substituir a imagem por um placeholder genérico.
- [x] Preservar login, registo, recuperação de palavra-passe, sessões, telefone e endpoints existentes, incluindo nome, email, telemóvel, palavra-passe e confirmação no registo.
- [x] Validar com `pnpm typecheck`, `pnpm build`, `git diff --check` e inspeção visual desktop/mobile antes do commit e publicação.
