# INSTRUÇÃO COMPLEMENTAR — GAMEAO
## ADAPTAÇÃO DA ARQUITETURA ADMINISTRATIVA, CHECKOUT E SISTEMA DE PAGAMENTOS DA MD RECARGAS

### 1. OBJETIVO

Quero que analises profundamente o meu projeto MD Recargas e utilizes a sua organização administrativa, arquitetura de gestão de encomendas e experiência de checkout como referência para melhorar e implementar os mesmos conceitos no GameAO.

**PROJETO DE REFERÊNCIA: MD RECARGAS**

Repositório:
https://github.com/delvis1205/morasiorja é o mesmo arquivo em zip enviado


**PROJETO DE DESTINO: GAMEAO**

Website:
https://gameao.onrender.com
https://github.com/delvismorais/GameAO

O repositório do GameAO já está disponibilizado neste ambiente de trabalho.

A MD Recargas já possui uma organização administrativa e vários fluxos de negócio que quero aproveitar.

Não quero começar do zero quando já existe uma referência funcional que pode acelerar o desenvolvimento.

### 2. REGRA ABSOLUTA: DOIS PROJETOS INDEPENDENTES

O repositório da MD Recargas deve ser utilizado exclusivamente como referência.

Podes analisar, consultar e compreender toda a sua estrutura, componentes, funcionalidades e código para implementar no gameao.

Entretanto:

- NÃO alterar a MD Recargas.
- NÃO fazer commits na MD Recargas.
- NÃO modificar a sua base de dados.
- NÃO executar migrações na MD Recargas.
- NÃO alterar configurações.
- NÃO eliminar ficheiros.
- NÃO transportar a identidade visual da MD Recargas.
- NÃO misturar os dados comerciais dos dois negócios.

Todo o desenvolvimento deve ser realizado exclusivamente no GameAO.

O objetivo é aproveitar a experiência técnica da MD Recargas, criando uma implementação própria para o GameAO.

### 3. REFERÊNCIAS ESPECÍFICAS PARA ANALISAR

Não te limites a analisar a página inicial do projeto MD Recargas.

Inspeciona principalmente os seguintes ficheiros:

**Painel administrativo:**

- client/src/pages/admin/AdminLayout.tsx
- client/src/pages/admin/Dashboard.tsx
- client/src/pages/admin/Orders.tsx
- client/src/pages/admin/Products.tsx
- client/src/pages/admin/ApiSettings.tsx
- client/src/pages/admin/AdminSettings.tsx
- client/src/pages/admin/AdminBanners.tsx

**Checkout e encomendas:**

- client/src/pages/Checkout.tsx
- client/src/pages/OrderTracking.tsx
- client/src/pages/OrderSuccess.tsx
- client/src/pages/admin/Orders.tsx

**Backend e dados:**

- server/routers.ts
- server/db.ts
- drizzle/schema.ts
- const.ts
- server/_core/notification.ts
- server/_core/email.ts
- server/storage.ts

Observa especialmente como são tratados:

- Criação de encomendas.
- Cálculo de preços.
- Referências de pagamento.
- Dados do cliente.
- Seleção do método de pagamento.
- Instruções de pagamento.
- Upload de comprovativos.
- Verificação de pagamentos.
- Atualização dos estados.
- Acompanhamento de encomendas.
- Notificações.
- Gestão administrativa.
- Geração de faturas.

Não copies código cegamente. Compreende a lógica, identifica dependências e adapta a implementação à arquitetura tecnológica do GameAO.

### 4. REORGANIZAR O PAINEL ADMINISTRATIVO DO GAMEAO

Quero que o painel administrativo do GameAO adote uma organização semelhante à da MD Recargas.

A estrutura lateral de navegação da MD é uma referência importante.

Reproduz os seguintes padrões de organização e interação:

- Navegação lateral.
- Grupos de funcionalidades.
- Menus expansíveis.
- Indicador da página ativa.
- Pesquisa de opções do menu.
- Navegação responsiva.
- Menu lateral em formato drawer no telemóvel.
- Identificação do administrador.
- Botão para regressar ao website.
- Botão para terminar sessão.

Mantém a identidade visual da marca GameAO.

Não copies o logótipo, cores, tipografia ou identidade gráfica da MD Recargas.

### 4.1. Estrutura proposta para o menu administrativo

Organiza o painel da seguinte maneira:

**A. VISÃO GERAL**
- Dashboard.
- Estatísticas de vendas.
- Relatórios.
- Atividade recente.

**B. VENDAS E ENCOMENDAS**
- Todas as encomendas.
- Encomendas pendentes.
- Encomendas pagas.
- Em processamento.
- Concluídas.
- Canceladas.
- Faturas.
- Acompanhamento de entregas.

**C. PAGAMENTOS E FINANÇAS**
- Métodos de pagamento.
- Dados de recebimento.
- Transações.
- Comprovativos.
- Pagamentos pendentes.
- Pagamentos confirmados.
- Reembolsos.
- Relatórios financeiros.

**D. CATÁLOGO**
- Produtos.
- Adicionar produto.
- Categorias.
- Plataformas.
- Stock.
- Produtos em destaque.
- Produtos promocionais.

**E. WEBSITE E CONTEÚDOS**
- Gestão da homepage.
- Banners.
- Carrosséis.
- Imagens.
- Blog.
- Categorias do blog.
- Páginas institucionais.
- Perguntas frequentes.

**F. CLIENTES E UTILIZADORES**
- Clientes.
- Contas registadas.
- Administradores.
- Funções e permissões.

**G. MARKETING**
- Promoções.
- Cupões.
- Campanhas.
- Notificações.
- Emails.
- Redes sociais.

**H. INTEGRAÇÕES**
- WhatsApp.
- Serviços de email.
- Gateways de pagamento.
- Webhooks.
- APIs externas.
- Armazenamento de ficheiros.

**I. CONFIGURAÇÕES**
- Configurações gerais.
- Identidade da GameAO.
- Moeda.
- Informações comerciais.
- Configurações do checkout.
- Configurações de entrega.
- SEO.

**J. SEGURANÇA E SISTEMA**
- Registos de atividades.
- Histórico administrativo.
- Permissões.
- Sessões.
- Estado das integrações.
- Backups.

Cada opção deve conduzir a uma página funcional.

Não quero menus que apenas existem visualmente.

### 5. MELHORAR O DASHBOARD

Utiliza a organização da MD Recargas como referência para desenvolver um dashboard mais completo para o GameAO.

Apresenta dados reais, provenientes do banco de dados.

Criar indicadores:

- Faturação total.
- Vendas do dia.
- Vendas do mês.
- Número total de encomendas.
- Encomendas pendentes.
- Pagamentos por confirmar.
- Pagamentos confirmados.
- Encomendas em processamento.
- Encomendas concluídas.
- Número de clientes.
- Produtos mais vendidos.

Adicionar:

- Gráficos de vendas.
- Evolução da faturação.
- Distribuição dos métodos de pagamento.
- Produtos mais vendidos.
- Últimas encomendas.
- Atividade recente.

Permitir filtrar os dados por período.

### 6. IMPLEMENTAR O FLUXO DE CHECKOUT DA MD RECARGAS NO GAMEAO

Analisa profundamente a página Checkout.tsx da MD Recargas.

Quero aproveitar a organização e a lógica operacional do seu processo de compra.

O GameAO deve possuir um checkout que funcione de ponta a ponta.

### 6.1. Dados do cliente

Implementar:

- Nome completo.
- Email.
- Telefone/WhatsApp.
- Dados específicos exigidos por determinados produtos.
- Endereço de entrega, apenas quando necessário.
- Observações.

Quando o cliente tiver sessão iniciada, preencher automaticamente os dados disponíveis.

Permitir compra como convidado, caso essa opção seja compatível com a estratégia da loja.

### 6.2. Resumo da compra

Apresentar:

- Produtos.
- Imagens.
- Quantidades.
- Preços unitários.
- Subtotal.
- Descontos.
- Cupões.
- Custos adicionais, quando aplicáveis.
- Total final.

Todos os cálculos devem ser validados no servidor.

Não confiar nos valores enviados pelo navegador.

### 6.3. Métodos de pagamento

Analisa os métodos e a estrutura atualmente utilizados na MD Recargas.

A referência inclui:

1. Express.
2. PayPay AO.
3. Unitel Money.
4. Transferência bancária BAI.
5. Transferência bancária BFA.
6. Pagamento presencial.
7. Atendimento e pagamento assistido por WhatsApp.

Estuda cada método e prepara uma estrutura equivalente para o GameAO.

**Importante:** a disponibilidade definitiva de cada método deve ser configurada para o GameAO.

Não assumir que todos estão automaticamente autorizados, ativos ou associados às mesmas contas da MD Recargas.

### 7. SISTEMA CENTRALIZADO DE MÉTODOS DE PAGAMENTO

Quero uma área administrativa específica:

**Administração → Pagamentos → Métodos de Pagamento**

Deve permitir gerir todos os métodos de pagamento sem alterar código.

Para cada método, disponibilizar:

- Nome do método.
- Descrição.
- Logótipo.
- Identificador interno.
- Dados de recebimento.
- Instruções de pagamento.
- Estado ativo/inativo.
- Ordem de apresentação no checkout.
- Necessidade de comprovativo.
- Prazo de pagamento.
- Mensagem apresentada ao cliente.

### 7.1. Dados por modalidade

Para pagamentos móveis:

- Nome do serviço.
- Número de telefone.
- Nome do titular, quando aplicável.
- Instruções.
- Referência da encomenda.

Para transferências bancárias:

- Nome do banco.
- Nome do beneficiário.
- IBAN.
- Número de conta, quando aplicável.
- Instruções de transferência.

Para pagamentos presenciais:

- Descrição.
- Local ou instruções de atendimento.
- Condições de utilização.

Para integrações automáticas:

- Identificação do fornecedor.
- Chaves públicas.
- Chaves secretas.
- Webhook.
- Modo de testes.
- Modo de produção.
- Estado da ligação.
- Teste de integração.

As credenciais privadas devem ser armazenadas exclusivamente no servidor ou num sistema seguro de gestão de segredos.

Nunca expor chaves privadas no frontend.

### 7.2. Dados financeiros da MD Recargas

O repositório de referência possui dados bancários e números de recebimento próprios da MD Recargas.

**Não copiar automaticamente esses dados para o GameAO.**

Os métodos e a estrutura podem ser reaproveitados, mas os dados financeiros devem ser configurados como dados próprios da GameAO.

Não transportar:

- IBANs.
- Números de recebimento.
- Titulares de contas.
- Credenciais de APIs.
- Tokens.
- Segredos.
- Webhooks.
- Endereços privados de integração.

Não utilizar informações financeiras da MD Recargas como se pertencessem ao GameAO.

Criar os campos administrativos necessários para configurar os dados definitivos da GameAO.

Enquanto não forem configurados, os métodos devem permanecer desativados ou devidamente identificados como não configurados.

### 8. EXPERIÊNCIA DO CLIENTE APÓS SELECIONAR O PAGAMENTO

Reproduz a lógica de apresentação da MD Recargas.

Quando o cliente confirmar uma encomenda com pagamento manual, o sistema deve:

1. Criar a encomenda.
2. Gerar um número único.
3. Gerar uma referência de pagamento única, quando aplicável.
4. Guardar todos os dados da encomenda.
5. Associar o método selecionado.
6. Apresentar as instruções correspondentes.
7. Apresentar os dados de recebimento do GameAO.
8. Apresentar o valor exato.
9. Disponibilizar botão para copiar os dados.
10. Permitir anexar comprovativo, quando exigido.
11. Disponibilizar acesso ao acompanhamento do pedido.

O cliente deve perceber claramente o que precisa de fazer para concluir o pagamento.

Criar uma experiência semelhante à que existe na MD, mas adaptada aos produtos e à identidade do GameAO.

### 9. COMPROVATIVOS DE PAGAMENTO

Reutilizar o conceito existente no sistema MD Recargas.

Implementar upload de comprovativos, permitindo formatos seguros como:

- JPG.
- JPEG.
- PNG.
- WEBP.
- PDF.

Validar:

- Tipo de ficheiro.
- Tamanho.
- Extensão.
- Conteúdo real do ficheiro.
- Nome seguro.
- Associação à encomenda.

Armazenar os documentos num serviço de ficheiros persistente.

O cliente deve conseguir consultar o estado do seu comprovativo.

### 9.1. Gestão administrativa dos comprovativos

No painel, permitir:

- Ver comprovativos recebidos.
- Abrir imagens.
- Abrir documentos PDF.
- Consultar a encomenda associada.
- Consultar o método de pagamento.
- Consultar o valor esperado.
- Consultar data e hora de envio.
- Aprovar pagamento.
- Rejeitar comprovativo.
- Solicitar novo comprovativo.
- Adicionar observações internas.

**Uma regra de segurança importante:** o simples envio de um comprovativo não significa que o pagamento esteja confirmado.

A aprovação deve ocorrer após verificação real pelo administrador ou validação confirmada por um fornecedor de pagamento.

### 10. SISTEMA DE GESTÃO DE ENCOMENDAS

Adapta a organização administrativa da página Orders.tsx da MD Recargas.

Quero uma área completa, com:

- Pesquisa por número da encomenda.
- Pesquisa por nome.
- Pesquisa por telefone.
- Pesquisa por email.
- Filtro por estado.
- Filtro por método de pagamento.
- Filtro por data.
- Filtro por comprovativo.
- Visualização de detalhes.
- Histórico de alterações.
- Notas internas.
- Atualização de estados.
- Exportação de dados.

Cada encomenda deve ter uma ficha completa.

### Estados das encomendas

- Aguardando pagamento.
- Comprovativo enviado.
- Pagamento em verificação.
- Pagamento confirmado.
- Em processamento.
- Pronta para entrega.
- Concluída.
- Cancelada.
- Reembolsada.

Separar corretamente o estado da encomenda do estado financeiro do pagamento.

Não marcar automaticamente como paga uma encomenda apenas porque um cliente enviou um comprovativo.

Todas as atualizações importantes devem ser registadas com data, hora e administrador responsável.

### 11. ACOMPANHAMENTO DE PEDIDOS

Analisa a implementação da página OrderTracking.tsx da MD Recargas.

Quero aproveitar a experiência visual e funcional de:

- Pesquisa da encomenda.
- Identificação do pedido.
- Estado atual.
- Linha temporal.
- Dados dos produtos.
- Informações de pagamento.
- Comprovativos.
- Notificações.
- Download de fatura em PDF.

O GameAO deve apresentar os seus próprios dados e utilizar as suas próprias configurações comerciais.

Melhorar a segurança da consulta, usando identificadores não previsíveis e uma validação adicional do cliente.

Não permitir que terceiros consultem encomendas apenas por números sequenciais.

### 12. GERAÇÃO DE FATURAS

Analisar o mecanismo de geração de faturas PDF da MD Recargas.

Implementar uma funcionalidade equivalente no GameAO.

Permitir gerar faturas contendo:

- Logótipo GameAO.
- Nome comercial.
- Dados fiscais, se configurados.
- Contactos.
- Número da fatura.
- Número da encomenda.
- Data.
- Dados do cliente.
- Produtos.
- Quantidades.
- Preços.
- Subtotal.
- Descontos.
- Total.
- Estado do pagamento.

Criar configurações administrativas para os dados comerciais da GameAO.

Não copiar NIF, endereço, nome do titular ou contactos da MD Recargas.

### 13. NOTIFICAÇÕES E AUTOMAÇÕES

Utilizar a arquitetura da MD como referência para estruturar as notificações.

Criar notificações para:

**Cliente:**
- Encomenda criada.
- Instruções de pagamento.
- Comprovativo recebido.
- Pagamento confirmado.
- Pagamento recusado.
- Encomenda em processamento.
- Encomenda pronta para entrega.
- Encomenda concluída.
- Cancelamento.

**Administrador:**
- Nova encomenda.
- Novo comprovativo.
- Pagamento confirmado.
- Pagamento falhado.
- Nova conta.
- Produto esgotado.

Implementar email e deixar preparada uma integração WhatsApp.

Os webhooks da MD Recargas e as suas URLs externas não devem ser reutilizados.

Criar integrações independentes para GameAO, configuráveis através de variáveis de ambiente ou do painel, conforme o nível de sensibilidade.

### 14. FUNCIONALIDADES QUE DEVEM SER REAPROVEITADAS COM CRITÉRIO

A MD Recargas possui outras funcionalidades, mas nem todas devem ser transportadas automaticamente.

Antes de implementar, verifica a relevância de cada uma para uma loja de videojogos.

Por exemplo:

- Histórico de compras: aplicável.
- Gestão de clientes: aplicável.
- Notificações: aplicável.
- Faturas: aplicável.
- Benefícios e descontos: potencialmente aplicável.
- Sistema de afiliados: opcional.
- Identificadores de jogadores: somente para produtos que realmente necessitem deles.
- Validações específicas de Free Fire: não transportar automaticamente.
- Pontos de fidelização: implementar apenas se fizerem sentido para a estratégia GameAO.

A arquitetura deve ser extensível para futuras funcionalidades.

### 15. PRESERVAÇÃO DA APARÊNCIA DO GAMEAO

Esta é uma prioridade absoluta.

O website público GameAO deve permanecer como está.

Não alterar:

- Homepage.
- Layout.
- Imagens.
- Cores.
- Logótipo.
- Banners.
- Animações.
- Efeitos.
- Cabeçalho.
- Rodapé.
- Produtos apresentados.
- Estrutura visual.
- Navegação pública.

O trabalho é de evolução funcional e administrativa.

Novas páginas como checkout, login, acompanhamento de encomendas e outras devem seguir a identidade visual atual.

O painel administrativo deve usar uma organização inspirada na MD Recargas, mas com identidade GameAO.

Não quero ver elementos visuais da MD Recargas misturados no GameAO.

### 16. IMPLEMENTAÇÃO TÉCNICA

Inspeciona as tecnologias dos dois projetos e decide como adaptar as funcionalidades.

A MD Recargas utiliza uma arquitetura com React, Vite, TypeScript, Express, tRPC, Drizzle ORM e MySQL.

O GameAO pode utilizar uma arquitetura diferente.

Não forces a utilização das mesmas tecnologias.

Reaproveita os conceitos, regras de negócio e padrões de organização compatíveis com o projeto de destino.

Implementa:

- Persistência real.
- Transações seguras.
- Validação no servidor.
- Gestão de sessões.
- Permissões.
- Armazenamento persistente.
- Integrações independentes.
- Webhooks seguros.
- Logs.
- Auditoria.
- Proteção contra duplicação de pagamentos.
- Proteção contra falsificação de estados.
- Recuperação de erros.

Não deixar configurações comerciais importantes espalhadas pelo frontend.

### 17. IMPORTANTE: SEGURANÇA FINANCEIRA

Todo o sistema deve respeitar os seguintes princípios:

1. Nunca confiar nos valores calculados no navegador.
2. Recalcular os preços no backend.
3. Verificar disponibilidade dos produtos.
4. Gerar referências únicas.
5. Não aceitar comprovativos de tipos não autorizados.
6. Não confirmar pagamentos apenas por upload.
7. Validar webhooks.
8. Proteger credenciais.
9. Evitar pagamentos duplicados.
10. Registar todas as transações.
11. Manter um histórico das operações.
12. Proteger os dados dos clientes.
13. Não permitir que clientes alterem estados financeiros.
14. Não permitir que um administrador sem permissão aprove pagamentos.
15. Nunca expor dados financeiros privados de outros clientes.

### 18. TESTES OBRIGATÓRIOS

Executa testes reais antes de concluir.

**Painel:**
- Navegação entre grupos.
- Pesquisa.
- Responsividade.
- Permissões.
- Criação e edição de produtos.
- Gestão de encomendas.
- Gestão de pagamentos.
- Gestão de comprovativos.
- Configurações.

**Checkout:**
- Comprar como convidado.
- Comprar com conta.
- Selecionar diferentes métodos.
- Verificar cálculos.
- Criar encomenda.
- Gerar referência.
- Visualizar instruções.
- Enviar comprovativo.
- Testar erros.
- Testar pagamentos em ambiente sandbox, quando aplicável.

**Administração financeira:**
- Consultar transações.
- Verificar comprovativos.
- Aprovar pagamentos.
- Rejeitar pagamentos.
- Alterar estados.
- Consultar histórico.
- Gerar faturas.

**Acompanhamento:**
- Consultar encomenda existente.
- Consultar encomenda inexistente.
- Validar dados do cliente.
- Verificar atualização do estado.
- Testar privacidade.

**Regressão visual:**
Comparar o GameAO antes e depois da implementação.

Não permitir alterações indesejadas na identidade visual do website público.

### 19. ENTREGA FINAL

Quero receber:

1. Painel administrativo reorganizado e funcional.
2. Dashboard com dados reais.
3. Gestão completa de encomendas.
4. Gestão de pagamentos.
5. Checkout integrado.
6. Gestão de comprovativos.
7. Acompanhamento de pedidos.
8. Geração de faturas.
9. Gestão de notificações.
10. Configuração independente dos métodos de pagamento.
11. Documentação técnica.
12. Lista de credenciais e configurações que precisam de ser fornecidas.
13. Testes executados e respetivos resultados.

Não quero apenas uma interface visual.

Quero todas as funcionalidades ligadas ao backend e à base de dados.

---

## INSTRUÇÃO FINAL

Utiliza a MD Recargas como referência de organização e experiência administrativa.

Estuda o funcionamento real antes de implementar.

O GameAO deve aproveitar o que a MD tem de melhor, com uma arquitetura adaptada ao negócio de videojogos.

**Quero um painel administrativo organizado, intuitivo e poderoso, semelhante na organização ao da MD Recargas, mas integrado na identidade GameAO.**

Quero também que o checkout tenha um processo de compra claro, profissional e funcional, com métodos de pagamento configuráveis, comprovativos, referências, notificações e acompanhamento.

Não alteres o website público que já foi desenvolvido.

Não alteres o repositório da MD Recargas.

Não simules pagamentos, integrações ou funcionalidades.

Implementa, integra, testa e documenta.

O objetivo é ter um GameAO completamente operacional, administrável de ponta a ponta e preparado para crescer.



# 20. INFRAESTRUTURA COMPLETA — SUPABASE + CLOUDFLARE

## OBJETIVO

Quero que utilizes as minhas contas existentes do Supabase e Cloudflare para preparar toda a infraestrutura necessária ao funcionamento profissional do GameAO.

Não quero apenas que cries código preparado para uma futura integração.

Quero que acedas às contas autorizadas, analises os recursos existentes, cries os projetos, bases de dados, buckets, configurações, políticas, chaves e integrações realmente necessários e ligues tudo ao GameAO.

**Contas e serviços a utilizar:**
Ambas conectadas e autorizadas.
- Supabase: https://supabase.com/
- Cloudflare: https://dash.cloudflare.com/

cria as dbs e gerencia e cria também o env adequado no render com os dados necessários.
sistema de logins e cadastro integrado com as db também.

O GameAO deve ficar com uma infraestrutura própria, organizada, segura e independente da MD Recargas.

### 20.1. ACESSO ÀS MINHAS CONTAS

Primeiro, verifica se tens acesso autorizado às minhas contas Supabase e Cloudflare através das integrações disponíveis ou dos processos de autorização das respetivas plataformas.

A autorização para configurar estes serviços inclui:

- Consultar projetos existentes.
- Criar projetos destinados ao GameAO.
- Criar e configurar bases de dados.
- Criar buckets R2.
- Criar tokens com permissões limitadas.
- Configurar políticas de segurança.
- Configurar armazenamento.
- Configurar serviços de autenticação.
- Configurar domínios de distribuição de ficheiros, quando disponíveis.
- Criar as variáveis de ambiente necessárias.
- Integrar os serviços no código do GameAO.

Não peças as minhas palavras-passe por mensagem.

Utiliza os processos oficiais de autenticação e autorização das plataformas.

Se alguma conta ainda não estiver conectada, solicita apenas a autorização necessária através do respetivo processo de conexão.

Não finjas ter acesso a recursos que não consegues efetivamente administrar.

### 20.2. REGRAS DE PROTEÇÃO DAS CONTAS

Antes de criar recursos:

1. Analisa os projetos Supabase já existentes.
2. Analisa as zonas, domínios e buckets disponíveis na Cloudflare.
3. Identifica recursos que já pertençam ao GameAO.
4. Evita criar recursos duplicados.
5. Não alteres projetos de outros negócios.
6. Não elimines recursos existentes.
7. Não reutilizes recursos privados da MD Recargas.
8. Mantém os ambientes do GameAO separados dos restantes projetos.

Se já existir um projeto dedicado ao GameAO, avalia a possibilidade de o utilizar, em vez de criar outro desnecessariamente.

Não alteres o plano de subscrição nem atives serviços pagos, funcionalidades premium ou compromissos financeiros adicionais sem apresentar previamente os custos e obter a minha autorização.

Sempre que possível, utiliza os recursos disponíveis nos planos atuais.

---

# 21. SUPABASE — CRIAÇÃO E CONFIGURAÇÃO COMPLETA

Quero utilizar o Supabase como infraestrutura principal de dados e autenticação do GameAO.

Documentação oficial:
https://supabase.com/docs

### 21.1. Criar projeto dedicado

Caso não exista um projeto apropriado, cria um projeto exclusivo para o GameAO.

Nome recomendado:

gameao-production

Quando as condições da conta permitirem, cria também um ambiente separado:

gameao-staging

Utiliza o ambiente de staging para testar migrações, novas funcionalidades e alterações antes de as aplicar em produção.

Escolhe uma região disponível com boa latência para os principais clientes da GameAO. Testa a conectividade antes de definir a região definitiva.

Não mistures os dados de produção com os dados de teste.

### 21.2. Banco de dados PostgreSQL

Configura o PostgreSQL do Supabase como banco de dados central do GameAO.

Prepara uma estrutura organizada para:

- Utilizadores.
- Perfis.
- Administradores.
- Funções e permissões.
- Produtos.
- Categorias.
- Plataformas.
- Imagens.
- Banners.
- Página inicial.
- Artigos.
- Comentários.
- Avaliações.
- Encomendas.
- Itens das encomendas.
- Pagamentos.
- Transações.
- Comprovativos.
- Métodos de pagamento.
- Dados de recebimento.
- Cupões.
- Promoções.
- Clientes.
- Entregas.
- Notificações.
- Configurações.
- Faturas.
- Registos de auditoria.
- Biblioteca de multimédia.

Desenha as relações corretamente.

Adiciona índices adequados para pesquisas, filtros e consultas administrativas.

Utiliza transações de banco de dados nas operações financeiras e nas operações que envolvem várias tabelas.

Evita guardar dados importantes apenas no navegador.

### 21.3. Migrações

Cria um sistema de migrações versionadas dentro do repositório GameAO.

Todas as alterações estruturais devem ser documentadas.

Antes de qualquer migração de produção:

- Fazer backup.
- Verificar compatibilidade.
- Testar em staging.
- Validar as relações.
- Verificar os dados existentes.
- Confirmar a possibilidade de recuperação.

Não elimines tabelas ou dados existentes sem uma estratégia de migração validada.

Se o GameAO já possuir produtos, utilizadores ou encomendas, preserva-os e migra-os de forma controlada.

### 21.4. Supabase Auth

Utiliza o Supabase Auth para implementar a autenticação do GameAO, desde que seja compatível com a arquitetura existente.

Implementa:

- Registo com email e palavra-passe.
- Login.
- Logout.
- Recuperação de palavra-passe.
- Confirmação de email.
- Gestão de sessões.
- Renovação de sessões.
- Proteção das rotas.
- Gestão de utilizadores.
- Contas administrativas.

Configura corretamente os URLs de redirecionamento para o domínio atual da aplicação e para o domínio definitivo quando estiver disponível.

Não cries sistemas paralelos de autenticação sem necessidade.

### 21.5. Administradores

Prepara a integração entre os perfis do Supabase e os papéis do GameAO.

Funções:

- Super Administrador.
- Administrador.
- Gestor de produtos.
- Gestor de encomendas.
- Gestor de conteúdos.
- Suporte.

As permissões devem ser verificadas no servidor e, quando aplicável, também por políticas RLS.

Nunca permitir que um cliente altere o seu próprio papel para administrador.

O primeiro Super Administrador deve ser inicializado de maneira segura, utilizando uma conta autorizada do proprietário.

Se faltar o email de administração necessário, solicita-o. Não inventes credenciais nem cries contas administrativas públicas com palavras-passe predefinidas.

### 21.6. Row Level Security (RLS)

Esta parte é obrigatória.

Ativa e configura políticas RLS para todas as tabelas expostas através das APIs do Supabase.

Exemplos:

- Um cliente só pode consultar as suas próprias encomendas.
- Um cliente só pode alterar os dados autorizados do seu perfil.
- Um cliente não pode alterar estados de pagamentos.
- Um cliente não pode alterar preços ou stock.
- Os administradores só podem executar operações permitidas pela sua função.
- Produtos e categorias publicados podem ter leitura pública.
- Dados privados não podem ser expostos a utilizadores não autorizados.

Aplica as permissões SQL (GRANT/REVOKE) adequadas juntamente com as políticas RLS.

Não confies apenas nas verificações do frontend.

A chave secreta do Supabase, incluindo chaves com privilégios elevados ou equivalentes à service role, deve permanecer exclusivamente no servidor.

A chave publicável pode ser utilizada no frontend, respeitando as políticas RLS.

### 21.7. Configuração de email do Supabase

Analisa as configurações de autenticação por email.

Prepara:

- Confirmação de conta.
- Recuperação de palavra-passe.
- Emails de autenticação.
- URLs de redirecionamento.
- Templates de mensagens, quando suportados.

Se for necessário configurar SMTP personalizado, utiliza uma conta própria do GameAO.

Não reutilizes a conta de email ou credenciais da MD Recargas.

---

# 22. CLOUDFLARE — CONFIGURAÇÃO COMPLETA

Quero utilizar a Cloudflare como infraestrutura de armazenamento de ficheiros e distribuição dos recursos multimédia do GameAO.

Documentação oficial:
https://developers.cloudflare.com/

### 22.1. Cloudflare R2

Cria os buckets R2 necessários para o GameAO.

Sugestão de organização:

**Bucket público:**

gameao-public-media

Destinado a:

- Capas dos jogos.
- Imagens dos produtos.
- Galerias de produtos.
- Banners.
- Imagens da homepage.
- Capas de artigos.
- Imagens públicas.
- Recursos multimédia públicos.

**Bucket privado:**

gameao-private-files

Destinado a:

- Comprovativos de pagamento.
- Documentos privados.
- Faturas privadas, quando necessário.
- Relatórios administrativos.
- Exportações.
- Documentos associados a encomendas.

Não colocar comprovativos e documentos pessoais num bucket público.

Se for melhor utilizar um único bucket por limitações de plano ou simplicidade operacional, implementa separação rigorosa por políticas e visibilidade, justificando a decisão.

### 22.2. Organização dos ficheiros

Utiliza uma organização de objetos clara e consistente.

Exemplo:

gameao-public-media/
    products/
        produto-id/
            main.webp
            gallery/
    banners/
        homepage/
        campaigns/
    blog/
        artigo-id/
    categories/
    site/
        logo/
        icons/
    avatars/

gameao-private-files/
    payment-proofs/
        order-id/
    invoices/
        order-id/
    reports/
    exports/

Não utilizar nomes aleatórios sem organização.

Utiliza nomes seguros, identificadores únicos e pastas adequadas.

Evita sobrescrever acidentalmente imagens existentes.

### 22.3. Cloudflare API Tokens

Cria as credenciais necessárias para utilização do R2.

Aplica o princípio do menor privilégio.

As credenciais devem ter apenas as permissões necessárias e, sempre que possível, limitar o acesso aos buckets específicos do GameAO.

Não utilizar Global API Key.

Não utilizar credenciais administrativas gerais quando um token limitado for suficiente.

Guarda as credenciais exclusivamente nas variáveis de ambiente do servidor ou no sistema seguro de gestão de segredos da plataforma.

Nunca disponibilizar:

- Access Key Secret.
- Tokens privados.
- Chaves secretas.
- Credenciais de administração.

No navegador ou no repositório GitHub.

### 22.4. Endpoint S3 compatível

Configura a ligação S3-compatible do Cloudflare R2.

Prepara as variáveis:

CLOUDFLARE_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_PUBLIC_BUCKET
R2_PRIVATE_BUCKET
R2_PUBLIC_BASE_URL

Estes são nomes indicativos para o ambiente de configuração. Adapta-os à implementação definitiva.

Configura corretamente o endpoint, as credenciais, os nomes dos buckets e as políticas de acesso.

### 22.5. Domínio de imagens

Caso exista um domínio próprio do GameAO gerido na Cloudflare, configura um subdomínio exclusivo para os recursos multimédia.

Exemplo ilustrativo:

media.DOMINIO-DO-GAMEAO

Não inventes o domínio definitivo.

Verifica primeiro quais os domínios efetivamente disponíveis e autorizados.

Liga o subdomínio ao bucket público através da funcionalidade oficial de Custom Domain do R2.

Configura HTTPS, caching e distribuição dos recursos.

Não modifiques os registos DNS principais do website nem interrompas a ligação atual ao ambiente de execução.

Qualquer alteração que possa afetar o domínio principal ou a hospedagem atual deve ser apresentada antes de executada.

Não utilizes o endereço r2.dev como solução permanente de produção.

### 22.6. CORS

Configura CORS corretamente nos buckets R2.

Permite apenas os domínios efetivamente utilizados pelo GameAO.

Autoriza os métodos estritamente necessários, como:

- PUT.
- GET.
- HEAD.

Adiciona os cabeçalhos necessários para os uploads assinados.

Inclui os domínios de desenvolvimento e produção, sem abrir o bucket indiscriminadamente a qualquer origem.

---

# 23. SISTEMA DE UPLOADS — APROVEITAR A EXPERIÊNCIA DA MD RECARGAS

Esta parte merece atenção especial.

Quero que analises o funcionamento atual da MD Recargas e reproduzas a experiência de gestão de uploads no GameAO.

### 23.1. Referências do código da MD

Analisa particularmente:

- server/storage.ts
- server/storage.cloudinary.ts
- client/src/components/DragDropUpload.tsx
- client/src/components/admin/ProductForm.tsx
- client/src/pages/admin/AdminBanners.tsx
- client/src/pages/admin/AdminApproveComments.tsx
- client/src/pages/OrderTracking.tsx

Na MD Recargas existe uma camada de armazenamento centralizada, com a operação de upload, e componentes que permitem selecionar, pré-visualizar e substituir imagens.

O componente DragDropUpload também contém:

- Seleção de ficheiros.
- Arrastar e largar.
- Pré-visualização.
- Remoção.
- Substituição.
- Verificação do tamanho.
- Compressão de imagens.

Existe ainda uma lógica utilizada nos formulários de produtos e banners para enviar os ficheiros através do backend e guardar as URLs devolvidas no registo correspondente.

Quero aproveitar esse padrão operacional.

### 23.2. Melhorias para o GameAO

Não quero simplesmente copiar o método antigo de envio de ficheiros em Base64.

Implementa uma arquitetura mais eficiente com Cloudflare R2.

Cria uma camada de abstração centralizada de armazenamento, com operações equivalentes a:

- storageUpload.
- storageGet.
- storageDelete.
- createSignedUploadUrl.
- createSignedDownloadUrl.
- storageExists.

O frontend deve falar com o backend para obter uma autorização de upload.

O backend deve validar a identidade, as permissões e as características do ficheiro antes de autorizar o upload.

Utiliza URLs pré-assinados com validade limitada quando apropriado.

Assim, os ficheiros podem ser enviados diretamente para o R2 sem expor as credenciais da Cloudflare.

### 23.3. Fluxo de upload obrigatório

Implementa o seguinte fluxo:

1. Administrador seleciona ou arrasta um ficheiro.
2. O frontend apresenta uma pré-visualização.
3. O sistema valida formato e tamanho.
4. O frontend solicita autorização de upload ao backend.
5. O backend verifica se o administrador possui permissão.
6. O backend gera uma URL pré-assinada.
7. O browser envia o ficheiro diretamente para o R2.
8. O backend confirma a existência do ficheiro e os seus metadados.
9. O sistema regista o ficheiro na biblioteca multimédia.
10. O ficheiro fica disponível no formulário onde foi solicitado.
11. Ao guardar o formulário, o identificador do ficheiro fica associado ao produto, banner, artigo ou outro conteúdo.

Não enviar chaves privadas ao frontend.

Não guardar o conteúdo Base64 inteiro na base de dados.

Guardar apenas os metadados, referências e chaves de armazenamento necessários.

### 23.4. Interface de upload

Cria componentes reutilizáveis semelhantes aos existentes na MD Recargas.

Todos devem integrar a identidade visual GameAO.

Funcionalidades:

- Arrastar e largar.
- Selecionar ficheiros.
- Pré-visualizar.
- Barra de progresso.
- Estado de carregamento.
- Mensagens de sucesso.
- Mensagens de erro.
- Cancelar operações, quando suportado.
- Substituir ficheiros.
- Remover ficheiros.
- Selecionar ficheiros já existentes na biblioteca.
- Upload múltiplo.
- Reordenar galerias.

O administrador deve conseguir fazer upload sem lidar com configurações técnicas.

### 23.5. Compressão de imagens

Utiliza como referência o comportamento da MD Recargas.

O sistema atual tem um limite padrão de 5 MB e reduz imagens maiores que 1920 pixels, utilizando compressão JPEG de qualidade aproximada de 80%.

Implementa um sistema melhorado, com regras configuráveis por finalidade.

Regras sugeridas:

- Redimensionar imagens excessivamente grandes.
- Comprimir quando a compressão for apropriada.
- Preservar transparência de PNG e WebP quando necessária.
- Não alterar desnecessariamente imagens já otimizadas.
- Não destruir animações GIF.
- Não converter PDF ou vídeos em imagens.
- Preservar a qualidade de capas e banners.
- Validar as dimensões.
- Utilizar formatos modernos quando apropriado.

Os limites de tamanho devem ser configuráveis conforme o tipo de ficheiro.

Não aplicar uma compressão destrutiva indiscriminadamente a todas as imagens.

### 23.6. Finalidades dos uploads

Implementa uploads específicos para:

**Produtos:**
- Imagem principal.
- Galeria.
- Imagens adicionais.

**Homepage:**
- Banners principais.
- Imagens secundárias.
- Campanhas.
- Carrosséis.

**Blog:**
- Imagem de capa.
- Imagens internas.

**Website:**
- Logótipo.
- Favicon.
- Outros recursos.

**Clientes:**
- Fotografias de perfil, caso suportadas.

**Encomendas:**
- Comprovativos de pagamento.
- Documentos associados.
- Faturas privadas, quando necessário.

**Administração:**
- Relatórios.
- Exportações.
- Documentos internos.

Cada finalidade deve ter permissões e limites próprios.

### 23.7. Proteção de comprovativos

Os comprovativos de pagamento devem utilizar armazenamento privado.

O administrador deve conseguir visualizá-los apenas depois de autenticação e autorização.

O cliente deve conseguir consultar exclusivamente comprovativos associados à sua encomenda.

Utiliza URLs assinados e temporários para os downloads privados.

Não apresentar links públicos permanentes para comprovativos.

Não disponibilizar a listagem dos documentos privados.

---

# 24. BIBLIOTECA MULTIMÉDIA DO GAMEAO

Cria uma área no painel administrativo chamada:

**Biblioteca de Multimédia**

Quero conseguir gerir centralmente todos os ficheiros utilizados no website.

Funcionalidades:

- Ver todos os ficheiros.
- Pesquisar.
- Filtrar por tipo.
- Filtrar por finalidade.
- Ordenar por data.
- Pré-visualizar.
- Ver tamanho.
- Ver dimensões.
- Ver data de upload.
- Ver administrador responsável.
- Copiar URL pública, quando aplicável.
- Copiar referência do ficheiro.
- Substituir ficheiro.
- Remover ficheiro.
- Ver onde o ficheiro está a ser utilizado.
- Selecionar ficheiros existentes em vez de fazer upload repetidamente.

Cada ficheiro deve possuir um registo de metadados no Supabase.

Campos sugeridos:

- ID.
- Nome original.
- Nome armazenado.
- Bucket.
- Object key.
- URL pública, se aplicável.
- Tipo MIME.
- Tamanho.
- Dimensões.
- Categoria.
- Finalidade.
- Visibilidade.
- Administrador responsável.
- Data de criação.

Não permitir a eliminação de ficheiros que ainda estejam associados a produtos, banners, artigos ou outros conteúdos, sem um processo de confirmação e substituição.

Implementa mecanismos de identificação de ficheiros órfãos e limpeza segura.

---

# 25. INTEGRAÇÃO DOS UPLOADS COM O PAINEL ADMINISTRATIVO

Quero que todas as secções administrativas utilizem o mesmo sistema centralizado de armazenamento.

Exemplos:

**Gestão de Produtos:**
Selecionar, carregar, visualizar e substituir imagens diretamente no formulário.

**Gestão de Banners:**
Carregar banner, visualizar, alterar imagem e gerir link.

**Gestão de Artigos:**
Carregar capa, selecionar imagens existentes e gerir imagens do conteúdo.

**Gestão da Homepage:**
Alterar as imagens dos componentes existentes.

**Gestão de Clientes:**
Permitir gerir fotografias de perfil, caso implementadas.

O upload deve funcionar de maneira uniforme em todo o painel.

Não criar um sistema de uploads diferente para cada página.

Todas as operações devem utilizar o mesmo serviço e as mesmas regras de segurança.

---

# 26. AUTOMAÇÕES E INTEGRAÇÕES

Analisa como a MD Recargas organiza as suas integrações e notificações.

Não transportes os webhooks nem os serviços privados da MD Recargas.

Cria configurações próprias do GameAO.

Prepara:

- Emails transacionais.
- Recuperação de conta.
- Notificações de encomendas.
- Notificações administrativas.
- Webhooks próprios.
- Integrações de pagamentos.
- Integrações futuras com WhatsApp.
- Registos de falhas de integração.

As credenciais devem ser armazenadas em variáveis seguras.

O Supabase pode ser utilizado para os eventos e dados que necessitem de persistência ou atualização em tempo real.

Utiliza funcionalidades Realtime ou Edge Functions apenas quando realmente trouxerem vantagens.

Não criar serviços desnecessários nem duplicar processos que já são executados pelo backend do GameAO.

---

# 27. CONFIGURAÇÃO, BACKUPS E MONITORIZAÇÃO

Quero que deixes toda a infraestrutura organizada e documentada.

### Supabase

- Projeto identificado.
- Ambiente de produção.
- Ambiente de testes, quando possível.
- Banco de dados.
- Migrações.
- Autenticação.
- Políticas RLS.
- Permissões.
- Índices.
- Configuração de email.
- Backups, conforme o plano disponível.
- Monitorização de erros.

### Cloudflare

- R2.
- Buckets.
- Tokens limitados.
- Domínio de multimédia, se disponível.
- CORS.
- HTTPS.
- Caching.
- Políticas de acesso.
- Regras de retenção, quando adequadas.
- Limpeza de ficheiros temporários.

Configura também backups dos dados e metadados importantes.

Quando possível, prepara exportações periódicas da base de dados e armazenamento seguro de backups privados no R2.

Não guardes cópias de segredos dentro dos backups públicos.

Documenta como recuperar o projeto caso haja uma falha.

---

# 28. VARIÁVEIS DE AMBIENTE

Cria ou atualiza o ficheiro `.env.example` do GameAO com todas as configurações necessárias.

Exemplos de nomes:

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_PUBLIC_BUCKET=
R2_PRIVATE_BUCKET=
R2_PUBLIC_BASE_URL=

Inclui também todas as outras variáveis necessárias para autenticação, email, notificações, pagamentos e serviços externos.

Não colocar valores reais no `.env.example`.

Não guardar ficheiros `.env` com segredos no GitHub.

Configura as variáveis reais no ambiente seguro utilizado pela aplicação e nos respetivos ambientes de deploy.

Não imprimir credenciais completas nos logs.

Documenta o significado de cada variável e onde ela deve ser configurada.

---

# 29. TESTES DE INFRAESTRUTURA

Antes de concluir, executa testes reais.

### Supabase

- Confirmar conexão com o projeto.
- Criar e consultar registos.
- Testar autenticação.
- Testar permissões.
- Testar RLS.
- Testar proteção de dados dos clientes.
- Testar operações administrativas.
- Testar migrações.
- Confirmar persistência.

### Cloudflare R2

- Criar bucket.
- Fazer upload de imagem.
- Recuperar imagem.
- Confirmar URL pública.
- Fazer upload de documento privado.
- Confirmar que documento privado não é acessível anonimamente.
- Criar link temporário.
- Testar expiração de link.
- Testar CORS.
- Testar substituição.
- Testar eliminação autorizada.
- Confirmar que ficheiros continuam disponíveis após reiniciar ou atualizar a aplicação.

### Integração GameAO

Testar upload de:

1. Imagem principal de produto.
2. Galeria de produto.
3. Banner.
4. Imagem de artigo.
5. Comprovativo de pagamento.
6. Documento privado.

Confirmar que todos os ficheiros aparecem corretamente na biblioteca multimédia e nas respetivas páginas.

### Segurança

Testar que:

- Clientes não conseguem fazer uploads administrativos.
- Clientes não consultam documentos de outras encomendas.
- Credenciais privadas não aparecem no navegador.
- Buckets privados não são públicos.
- Links temporários expiram.
- Ficheiros perigosos são rejeitados.
- Ficheiros de tamanho excessivo são rejeitados.

---

# 30. RESULTADO FINAL OBRIGATÓRIO

Quero que, ao terminar, as minhas contas Supabase e Cloudflare estejam organizadas para suportar o GameAO.

O projeto deve possuir:

1. Projeto Supabase exclusivo.
2. Banco de dados configurado.
3. Autenticação funcional.
4. Políticas RLS.
5. Perfis e permissões.
6. Armazenamento Cloudflare R2.
7. Bucket público.
8. Bucket privado.
9. Uploads funcionais.
10. Pré-visualização de imagens.
11. Compressão apropriada.
12. Biblioteca multimédia.
13. Gestão de imagens no painel.
14. Upload de comprovativos.
15. URLs assinados para ficheiros privados.
16. Variáveis de ambiente organizadas.
17. Backups configurados conforme os recursos disponíveis.
18. Documentação técnica.
19. Testes de segurança.
20. Testes de integração.

No relatório final, apresenta:

- Nome do projeto Supabase.
- URL do projeto.
- Região.
- Estado da base de dados.
- Estado da autenticação.
- Estado das políticas RLS.
- Nome dos buckets R2.
- Estado dos uploads.
- Domínio de multimédia configurado.
- Estado das políticas de acesso.
- Lista de variáveis de ambiente necessárias, sem mostrar os respetivos segredos.
- Testes realizados.
- Recursos ainda pendentes.

Se alguma operação depender de autorização, credenciais que ainda não foram configuradas ou pagamento adicional, identifica precisamente o que falta.

Não declares a infraestrutura pronta enquanto os testes essenciais não forem aprovados.

---

# 31. INSTRUÇÃO FINAL

Quero uma infraestrutura verdadeira, não apenas uma simulação visual.

Usa a Supabase para gerir os dados e a autenticação.

Usa a Cloudflare para armazenar e distribuir os ficheiros do GameAO.

Aproveita a experiência operacional de uploads da MD Recargas, incluindo pré-visualizações, compressão, upload de produtos, banners, documentos e gestão centralizada.

Mas implementa uma arquitetura mais organizada, segura e apropriada ao GameAO.

**O GameAO deve ficar independente da MD Recargas, utilizando exclusivamente os seus próprios recursos, dados, credenciais e configurações.**

Preserva integralmente a aparência e a estrutura pública atual do GameAO.

Não modifiques a MD Recargas.

Não migres a hospedagem atual para outro fornecedor sem autorização específica.

Cria, configura, integra, testa e documenta tudo.

O objetivo é terminar com um GameAO preparado para operar, crescer e ser administrado através de uma infraestrutura profissional.



