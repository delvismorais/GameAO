# 🎮 GameAO

### A tua loja digital de gaming em Angola.

A **GameAO** é uma plataforma digital dedicada ao universo dos videojogos, criada para aproximar os jogadores angolanos dos produtos, serviços e experiências que mais gostam.

Mais do que uma loja online, a GameAO procura oferecer uma experiência de compra simples, intuitiva e acessível, reunindo produtos digitais e físicos, assinaturas, conteúdos e serviços para jogadores numa única plataforma.

Desenvolvida com foco no mercado angolano, a aplicação apresenta uma experiência adaptada à realidade local, com preços em kwanzas (AOA/Kz), navegação em português e uma estrutura preparada para facilitar tanto a experiência dos clientes como a gestão da loja.

---

## ✨ Funcionalidades

A GameAO reúne ferramentas de compra, gestão e relacionamento com os clientes.

### 🛒 Experiência de compra
- Catálogo de produtos digitais e físicos.
- Categorias, pesquisa, filtros e ordenação de produtos.
- Gestão de variantes e opções de produtos.
- Carrinho de compras persistente.
- Lista de desejos e comparação de produtos.
- Checkout e criação de encomendas.
- Acompanhamento do estado das encomendas.
- Envio de comprovativos de pagamento.
- Geração de faturas em PDF.

### 👤 Área do cliente
- Registo e autenticação de utilizadores.
- Perfil e gestão da conta.
- Histórico de compras e encomendas.
- Produtos favoritos.
- Programa de afiliados.
- Acompanhamento das compras realizadas.

### ⚙️ Painel administrativo
- Gestão de produtos e variantes.
- Gestão de categorias e stock.
- Gestão e acompanhamento de encomendas.
- Administração de conteúdos e notificações.
- Configurações gerais da loja.
- Gestão operacional centralizada.

### 🚀 Recursos adicionais
- Otimização para mecanismos de pesquisa (SEO).
- Dados estruturados.
- Blog e conteúdos informativos.
- Perguntas frequentes (FAQs).
- Assistência ao cliente.
- Endpoint de monitorização da aplicação e da base de dados.

---

## 🧩 Tecnologias e arquitetura

A GameAO utiliza uma arquitetura web moderna, organizada entre frontend, backend e base de dados.

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 |
| Ferramenta de desenvolvimento | Vite 7 |
| Linguagem | TypeScript |
| Navegação | React Router |
| Backend | Node.js e Express 5 |
| Base de dados | PostgreSQL |
| Acesso à base de dados | `pg` |
| Geração de documentos | PDFKit |
| Gestor de pacotes | pnpm |

### Estrutura do projeto

```text
GameAO/
│
├── src/                    # Frontend React, páginas, contexto e componentes
│
├── server/                 # API Express, autenticação e serviços
│   └── migrations/         # Migrações SQL versionadas
│
├── public/
│   └── assets/             # Logótipos, imagens e recursos visuais
│
├── docs/                   # Documentação técnica
│
├── .env.example            # Modelo das variáveis de ambiente
├── package.json            # Dependências e scripts
└── README.md               # Documentação principal
```

O backend disponibiliza a API e comunica com a base de dados PostgreSQL através de `pg`. Existe também um adaptador responsável por traduzir parte do SQL legado, mantendo a compatibilidade com o esquema existente.

Os documentos PDF são gerados com PDFKit. As notificações podem utilizar SMTP e WhatsApp, desde que as respetivas credenciais e integrações estejam configuradas.

---

## 💰 Sistema de preços — AOA/Kz

A GameAO utiliza o **kwanza angolano (AOA/Kz)** como moeda principal do catálogo.

O sistema foi preparado para trabalhar com preços nativos em kwanzas, ou seja, o valor introduzido no painel administrativo corresponde diretamente ao valor apresentado ao cliente.

Por exemplo:

```text
Valor introduzido no painel: 1340

Valor apresentado na loja: 1 340,00 Kz
```

Esta regra aplica-se aos produtos, variantes, carrinho, checkout e faturas.

As colunas históricas `base_price_usd`, `sale_price_usd`, `price_usd` e `original_price_usd` permanecem na estrutura da base de dados por motivos de compatibilidade, mas o seu significado atual é AOA/Kz.

Não existe conversão cambial no catálogo. A migração `0016_native_aoa_prices.sql` documenta esta alteração e a taxa cambial histórica não altera os preços dos produtos, variantes, carrinhos ou novas encomendas.

---

## 🛠️ Instalação e desenvolvimento local

Para executar o projeto localmente, são necessários:

- Node.js 20 ou superior.
- pnpm.
- Uma base de dados PostgreSQL acessível.

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
```

### 2. Instalar as dependências

```bash
pnpm install
```

### 3. Configurar as variáveis de ambiente

Crie o ficheiro `.env` a partir do modelo disponibilizado:

```bash
cp .env.example .env
```

Configure as variáveis necessárias, incluindo a ligação à base de dados, sessão e integrações opcionais.

### 4. Iniciar a aplicação

```bash
pnpm dev
```

Por defeito, a aplicação fica disponível em:

```text
http://localhost:3000
```

### 5. Validar o projeto

Para verificar os tipos e gerar a versão de produção:

```bash
pnpm typecheck
pnpm build
```

O servidor também pode ser iniciado em modo de execução com:

```bash
pnpm start
```

---

## 🔐 Configuração e segurança

As credenciais e informações sensíveis devem ser configuradas através de variáveis de ambiente.

**Nunca coloque palavras-passe, tokens, chaves de API ou outros segredos diretamente no código-fonte.**

O ficheiro `.env` não deve ser enviado para o repositório.

### Criar o primeiro administrador

A inicialização da primeira conta administrativa pode ser realizada através do seguinte comando:

```bash
GAMEAO_ADMIN_EMAIL="admin@exemplo.ao" \
GAMEAO_ADMIN_PASSWORD="uma-palavra-passe-segura" \
GAMEAO_ADMIN_NAME="Administrador" \
pnpm admin:init
```

Depois da criação da conta, o painel administrativo pode ser acedido em:

```text
/admin
```

Utilize as credenciais configuradas durante a inicialização.

---

## 🗄️ Operação e base de dados

As migrações SQL são aplicadas durante o processo de inicialização do servidor.

O catálogo público e o painel administrativo utilizam a mesma base de dados. Por esse motivo, alterações manuais devem ser realizadas com cuidado e, preferencialmente, acompanhadas de cópias de segurança.

O endpoint de monitorização da aplicação está disponível em:

```text
/_app/health
```

Este endpoint permite consultar o estado da aplicação e da ligação à base de dados.

### Pagamentos

O sistema permite registar encomendas e respetivos comprovativos de pagamento.

A utilização de pagamentos por cartão depende da integração de um fornecedor, da configuração das credenciais necessárias e da validação completa do fluxo de pagamento.

Atualmente, a aplicação não guarda dados de cartões bancários.

---

## 👨‍💻 Autor e fundador

A GameAO foi idealizada e desenvolvida por **Delvis de Morais**, responsável pela sua fundação, direção e desenvolvimento de software.

<table>
  <tr>
    <td width="140" align="center" valign="middle">
      <img src="https://1.gravatar.com/avatar/3284dd19b9b7cb34c553f0f99bb732ca4a0a2a80f966c1b19e9aeaa77b75f724?size=256&d=initials" alt="Delvis de Morais" width="110" />
    </td>
    <td valign="middle">
      <strong>Delvis de Morais</strong><br/>
      CEO &amp; Fundador · Programador<br/><br/>
      Criador e principal responsável pelo desenvolvimento da GameAO, desde a conceção da ideia até à implementação tecnológica da plataforma.<br/><br/>
      <a href="https://delvisdemorais.link/">Portfólio pessoal</a>
    </td>
  </tr>
</table>

### Contactos do autor

- **Email:** [delvisdemorais@proton.me](mailto:delvisdemorais@proton.me)
- **Angola:** [+244 973 929 712](tel:+244973929712)
- **Brasil:** [+554799737493](tel:+554799737493)
- **Website:** [delvisdemorais.link](https://delvisdemorais.link/)

---

## ❤️ Apoie a GameAO

A GameAO é um projeto em evolução. O apoio da comunidade ajuda a manter a plataforma, desenvolver novas funcionalidades, melhorar os serviços e proporcionar uma experiência cada vez melhor aos jogadores angolanos.

Caso pretenda contribuir voluntariamente para o desenvolvimento do projeto, pode utilizar o seguinte meio:

**Express — Angola**

```text
Número: 973929712
```

Todo o apoio é bem-vindo e contribui para o crescimento da GameAO. Obrigado por fazer parte desta iniciativa!

---

## 📌 Contribuições

A GameAO é um projeto em desenvolvimento contínuo.

Sugestões, identificação de problemas e propostas de melhoria são importantes para a evolução da plataforma.

Caso pretenda contribuir com o projeto, pode apresentar uma sugestão ou reportar um problema através das ferramentas de Issues e Pull Requests do GitHub, respeitando a organização e as orientações do repositório.

**Autor principal e mantenedor:** Delvis de Morais.

---

## © Direitos e conteúdos

Este repositório contém a implementação da plataforma GameAO e os respetivos recursos de desenvolvimento.

Os nomes, marcas, logótipos, capas, imagens e outros conteúdos relacionados com videojogos pertencem aos seus respetivos titulares.

A presença desses elementos na plataforma não representa necessariamente uma parceria, associação ou afiliação oficial com as respetivas empresas ou editoras.

Antes de redistribuir qualquer conteúdo, confirme que possui os direitos ou as autorizações necessárias.

---

<p align="center">
  <strong>GameAO — O universo gaming mais perto de ti. 🎮</strong><br/>
  Website: https://gameao.shop
  Desenvolvido com dedicação em Angola 🇦🇴
</p>
