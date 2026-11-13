export type PostBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'list'; items: string[] };

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  author: string;
  image: string;
  imageCard: string;
  imageThumb: string;
  excerpt: string;
  tags: string[];
  views: number;
  commentsCount: number;
  blocks: PostBlock[];
}

const postImg = (n: number) => `/assets/blog/post-${n}.jpg`;
const postCard = (n: number) => `/assets/blog/post-${n}-card.jpg`;
const postThumb = (n: number) => `/assets/blog/post-${n}-thumb.jpg`;

export const POSTS: Post[] = [
  {
    slug: 'xbox-game-pass-novidades',
    title: 'Xbox Game Pass: os títulos que chegam este mês',
    date: '2026-11-10',
    category: 'Notícias',
    author: 'Equipa GameAO',
    image: postImg(1),
    imageCard: postCard(1),
    imageThumb: postThumb(1),
    excerpt:
      'Novos shooters, aventuras cooperativas e clássicos de corrida entram no catálogo do Game Pass. Veja o que vale a pena instalar primeiro.',
    tags: ['Xbox', 'Game Pass', 'Notícias'],
    views: 491,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'O catálogo do Xbox Game Pass volta a crescer este mês, com propostas para todos os gostos: shooters competitivos, aventuras para jogar a dois e alguns clássicos que merecem uma segunda oportunidade. A seleção abaixo tem em conta o tempo médio de instalação e a duração da campanha.',
      },
      {
        type: 'p',
        text: 'Para quem joga em sessões curtas, os títulos de corrida e os roguelikes são a melhor porta de entrada. Já quem procura uma história longa deve começar pelos RPGs, que ocupam mais espaço no disco mas compensam com dezenas de horas de conteúdo.',
      },
      { type: 'h2', text: 'O que instalar primeiro' },
      {
        type: 'list',
        items: [
          'Um shooter cooperativo para jogar com amigos ao fim do dia.',
          'Um jogo de corrida arcade, ideal para partidas de quinze minutos.',
          'Uma aventura narrativa para os fins de semana mais calmos.',
        ],
      },
      {
        type: 'image',
        src: postImg(1),
        alt: 'Soldado em combate num jogo de ação',
        caption: 'Os shooters continuam a ser a categoria mais procurada no serviço.',
      },
      {
        type: 'quote',
        text: 'A vantagem do Game Pass não está em ter tudo, mas em permitir experimentar sem compromisso. Um jogo que não agarra pode ser desinstalado sem culpa.',
      },
      {
        type: 'p',
        text: 'Antes de instalar, confirme a versão disponível para a sua consola. Alguns títulos oferecem melhorias exclusivas na Xbox Series X|S, como maior taxa de fotogramas ou tempos de carregamento reduzidos.',
      },
      {
        type: 'p',
        text: 'A GameAO acompanha as novidades do serviço e atualiza regularmente a secção Xbox da loja. Se procura uma cópia permanente, os jogos listados na loja continuam disponíveis para compra.',
      },
    ],
  },
  {
    slug: 'playstation-proximos-lancamentos',
    title: 'PlayStation: o que esperar dos próximos lançamentos',
    date: '2026-11-08',
    category: 'Notícias',
    author: 'Equipa GameAO',
    image: postImg(2),
    imageCard: postCard(2),
    imageThumb: postThumb(2),
    excerpt:
      'Exclusivos de aventura, regressos de franquias conhecidas e versões para PC. Organizamos o calendário do que já tem data marcada.',
    tags: ['PlayStation', 'Lançamentos', 'Notícias'],
    views: 377,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'A PlayStation mantém uma agenda forte para os próximos meses, alternando grandes aventuras narrativas com experiências mais experimentais. Alguns títulos chegam primeiro à consola e só mais tarde ao PC, como tem acontecido com os exclusivos recentes.',
      },
      {
        type: 'p',
        text: 'Para quem está a pensar comprar uma PS5, este é um bom momento para acompanhar os bundles. As promoções costumam surgir perto dos lançamentos maiores e incluem, muitas vezes, um segundo comando ou um jogo digital.',
      },
      { type: 'h2', text: 'Três apostas seguras' },
      {
        type: 'list',
        items: [
          'Aventuras em mundo aberto com forte componente narrativa.',
          'Remakes de clássicos com combate modernizado.',
          'Experiências cooperativas pensadas para dois jogadores.',
        ],
      },
      {
        type: 'image',
        src: postImg(2),
        alt: 'Personagens numa paisagem desértica',
        caption: 'Os mundos abertos continuam a dominar os lançamentos de maior orçamento.',
      },
      {
        type: 'p',
        text: 'Vale a pena reservar apenas quando existe uma data concreta e um período de pré-carregamento confirmado. As pré-reservas antecipadas demais deixam o comprador sem margem para mudar de ideias.',
      },
      {
        type: 'quote',
        text: 'Um bom lançamento não se mede pelo tamanho do mapa, mas pela vontade que temos de voltar a ele na semana seguinte.',
      },
    ],
  },
  {
    slug: 'escolher-jogo-para-jogar-com-amigos',
    title: 'Como escolher o jogo certo para jogar com amigos',
    date: '2026-11-05',
    category: 'Guias',
    author: 'Equipa GameAO',
    image: postImg(3),
    imageCard: postCard(3),
    imageThumb: postThumb(3),
    excerpt:
      'Cooperação local, online ou competitivo? Um guia rápido para evitar noites frustradas e encontrar o título que todos vão querer repetir.',
    tags: ['Coop', 'Guias', 'Multijogador'],
    views: 289,
    commentsCount: 1,
    blocks: [
      {
        type: 'p',
        text: 'Escolher um jogo para jogar com amigos é mais difícil do que parece. O grupo pode ter níveis de experiência muito diferentes, horários desencontrados e expectativas distintas sobre o que é divertido. Antes de comprar, vale a pena responder a três perguntas.',
      },
      { type: 'h2', text: 'Perguntas antes de decidir' },
      {
        type: 'list',
        items: [
          'Quantos jogadores vão jogar ao mesmo tempo?',
          'O grupo prefere cooperar ou competir?',
          'Todos têm o mesmo jogo e a mesma plataforma?',
        ],
      },
      {
        type: 'p',
        text: 'Se o grupo é grande e irregular, os jogos com matchmaking rápido e partidas curtas são a melhor aposta. Se são sempre os mesmos dois ou três, uma campanha cooperativa rende mais e cria memórias partilhadas.',
      },
      {
        type: 'image',
        src: postImg(3),
        alt: 'Guerreiro num cenário de fantasia',
        caption: 'Aventuras cooperativas funcionam melhor quando todos participam na história.',
      },
      {
        type: 'quote',
        text: 'O melhor jogo para um grupo é aquele em que ninguém fica de fora a olhar para o ecrã.',
      },
      {
        type: 'p',
        text: 'Na GameAO, os jogos cooperativos estão identificados com a etiqueta Coop. Use os filtros da loja para encontrar rapidamente as opções disponíveis para PC, Xbox e PlayStation.',
      },
    ],
  },
  {
    slug: 'mundos-abertos-nova-geracao',
    title: 'Os mundos abertos que marcaram a nova geração',
    date: '2026-11-02',
    category: 'Análises',
    author: 'Equipa GameAO',
    image: postImg(4),
    imageCard: postCard(4),
    imageThumb: postThumb(4),
    excerpt:
      'Dos céus do México às ruas de Midgar, revisitamos os cenários que definiram a forma como exploramos os jogos hoje.',
    tags: ['Análises', 'Mundo Aberto', 'Gráficos'],
    views: 352,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'A nova geração de consolas trouxe mapas maiores, mas também uma preocupação crescente com a densidade. Um mundo aberto só funciona quando cada ponto de interesse tem uma razão para existir e quando o percurso até ele é interessante.',
      },
      {
        type: 'p',
        text: 'Jogos de condução como Forza Horizon 5 mostram como a paisagem pode ser o próprio conteúdo: não é preciso um objetivo em cada esquina, basta querer ver o que está do outro lado da colina. Já os RPGs apostam em cidades densas e histórias paralelas.',
      },
      { type: 'h2', text: 'O que separa um bom mapa de um mapa vazio' },
      {
        type: 'list',
        items: [
          'Pontos de interesse com contexto narrativo.',
          'Viagem rápida desbloqueada de forma progressiva.',
          'Atividades opcionais que ensinam mecânicas novas.',
        ],
      },
      {
        type: 'image',
        src: postImg(4),
        alt: 'Personagem diante de uma vitrine iluminada',
        caption: 'A densidade urbana é um dos grandes desafios técnicos da geração.',
      },
      {
        type: 'p',
        text: 'A tendência para os próximos anos parece ser a de mapas mais pequenos, mas mais reativos. Em vez de mais ícones no mapa, os estúdios prometem sistemas que reagem às escolhas do jogador.',
      },
    ],
  },
  {
    slug: 'dicas-desempenho-shooters',
    title: 'Dicas para melhorar o seu desempenho nos shooters',
    date: '2026-10-29',
    category: 'Guias',
    author: 'Equipa GameAO',
    image: postImg(5),
    imageCard: postCard(5),
    imageThumb: postThumb(5),
    excerpt:
      'Sensibilidade, posicionamento e comunicação: pequenos ajustes que fazem uma diferença real nas partidas online.',
    tags: ['Shooter', 'Guias', 'E-sports'],
    views: 410,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'Melhorar num shooter não passa apenas por treinar a pontaria. A maior parte dos jogadores perde duelos por má posição, por falta de informação ou por decisões precipitadas, não por falta de reflexos.',
      },
      { type: 'h2', text: 'Começa pela configuração' },
      {
        type: 'p',
        text: 'Encontra uma sensibilidade confortável e mantém-na durante algumas semanas. Mudar de configuração a cada partida impede o corpo de criar memória muscular. Se joga em PC, verifica também a taxa de atualização do monitor e o modo de baixa latência.',
      },
      {
        type: 'image',
        src: postImg(5),
        alt: 'Jogador em combate num shooter',
        caption: 'A consistência da sensibilidade vale mais do que qualquer truque.',
      },
      {
        type: 'list',
        items: [
          'Joga sempre com os mesmos periféricos durante o período de treino.',
          'Revê uma partida por semana para identificar erros repetidos.',
          'Comunica informação curta e útil, em vez de comentar cada morte.',
        ],
      },
      {
        type: 'quote',
        text: 'Um bom posicionamento transforma um duelo difícil numa vantagem confortável.',
      },
      {
        type: 'p',
        text: 'Por fim, descansa. Sessões longas sem pausas aumentam os erros e reduzem a capacidade de reagir. Trinta minutos de pausa a cada duas horas fazem mais pela sua classificação do que uma noite inteira de jogo.',
      },
    ],
  },
  {
    slug: 'corridas-arcade-dirt-5',
    title: 'Corridas arcade: a adrenalina de Dirt 5',
    date: '2026-10-26',
    category: 'Análises',
    author: 'Equipa GameAO',
    image: postImg(6),
    imageCard: postCard(6),
    imageThumb: postThumb(6),
    excerpt:
      'Nem só de simulação vive o automobilismo. Dirt 5 mostra porque é que a diversão imediata continua a ter lugar.',
    tags: ['Corridas', 'Análises', 'Rally'],
    views: 198,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'Os simuladores de condução têm o seu público, mas há dias em que apetece apenas pegar no comando e derrapar sem pensar em pressão de pneus. É aí que entram os jogos arcade como Dirt 5.',
      },
      {
        type: 'p',
        text: 'A proposta é simples: pistas variadas, adversários agressivos e um modelo de condução permissivo o suficiente para perdoar erros. O resultado é uma experiência que se aprende em minutos e se domina ao longo de várias provas.',
      },
      {
        type: 'image',
        src: postImg(6),
        alt: 'Carro de corrida em alta velocidade',
        caption: 'Dirt 5 privilegia o espetáculo e a diversão imediata.',
      },
      {
        type: 'h2', text: 'Onde Dirt 5 brilha' },
      {
        type: 'list',
        items: [
          'Variedade de superfícies e condições meteorológicas.',
          'Campanha com progressão clara e desafios opcionais.',
          'Ecrã dividido para jogar com alguém na mesma sala.',
        ],
      },
      {
        type: 'p',
        text: 'Para quem joga em PC, vale a pena experimentar com comando. A versão para consolas recentes beneficia de 120 Hz em modo de desempenho, o que torna a condução mais fluida.',
      },
    ],
  },
  {
    slug: 'consolas-o-que-esperar',
    title: 'Xbox, PlayStation e PC: o que esperar do próximo ano',
    date: '2026-10-22',
    category: 'Notícias',
    author: 'Equipa GameAO',
    image: postImg(7),
    imageCard: postCard(7),
    imageThumb: postThumb(7),
    excerpt:
      'As três plataformas preparam estratégias diferentes para 2027. Analisamos as pistas deixadas pelos anúncios mais recentes.',
    tags: ['Xbox', 'PlayStation', 'PC'],
    views: 265,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'O mercado de videojogos prepara um ano de transição. As consolas atuais continuam a receber jogos, mas os estúdios começam a mostrar projetos pensados para hardware mais recente e para serviços de subscrição.',
      },
      {
        type: 'p',
        text: 'A Xbox aposta na integração entre consola, PC e nuvem. A PlayStation mantém o foco em exclusivos narrativos e na expansão para PC. O PC, por sua vez, ganha espaço com portáteis e com a normalização de versões bem otimizadas.',
      },
      {
        type: 'image',
        src: postImg(7),
        alt: 'Cenário de jogo com iluminação noturna',
        caption: 'A fronteira entre plataformas está cada vez menos definida.',
      },
      {
        type: 'quote',
        text: 'O próximo ano não será sobre ter a consola mais potente, mas sobre ter acesso aos jogos que realmente queremos jogar.',
      },
      {
        type: 'p',
        text: 'Para quem está a pensar comprar, a recomendação é olhar para o catálogo disponível hoje e não para promessas de lançamentos distantes. Uma biblioteca que já gostas vale mais do que um anúncio de 2028.',
      },
    ],
  },
  {
    slug: 'evolucao-dos-graficos',
    title: 'A evolução dos gráficos nos videojogos',
    date: '2026-10-18',
    category: 'Análises',
    author: 'Equipa GameAO',
    image: postImg(8),
    imageCard: postCard(8),
    imageThumb: postThumb(8),
    excerpt:
      'Iluminação em tempo real, texturas mais ricas e animação facial: como chegámos até aqui e o que falta melhorar.',
    tags: ['Gráficos', 'Análises', 'Tecnologia'],
    views: 312,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'A evolução gráfica dos videojogos não foi linear. Houve saltos de geração que mudaram a forma como percebemos os mundos virtuais, e outros períodos em que a indústria preferiu estabilizar e melhorar o desempenho.',
      },
      {
        type: 'p',
        text: 'Hoje, a iluminação em tempo real e as técnicas de reconstrução de imagem permitem resultados impressionantes sem perda de fluidez. A grande diferença está na consistência: um jogo que mantém 60 fotogramas por segundo é mais agradável do que um que atinge picos altos e depois cai.',
      },
      {
        type: 'image',
        src: postImg(8),
        alt: 'Personagem num cenário de fantasia',
        caption: 'A iluminação dinâmica é um dos avanços mais visíveis da geração.',
      },
      { type: 'h2', text: 'O que ainda pode melhorar' },
      {
        type: 'list',
        items: [
          'Animação facial em personagens secundárias.',
          'Interação com o ambiente fora de scripts.',
          'Acessibilidade visual sem sacrificar o estilo artístico.',
        ],
      },
      {
        type: 'p',
        text: 'A tecnologia só faz sentido quando serve a experiência. Um jogo com direção artística forte continua a envelhecer melhor do que outro com todos os efeitos ligados e nenhuma identidade.',
      },
    ],
  },
  {
    slug: 'esports-angola-futuro',
    title: 'E-sports em Angola: o futuro está a começar',
    date: '2026-10-14',
    category: 'Notícias',
    author: 'Equipa GameAO',
    image: postImg(9),
    imageCard: postCard(9),
    imageThumb: postThumb(9),
    excerpt:
      'Torneios locais, comunidades online e novas oportunidades para jogadores angolanos. O setor dá os primeiros passos.',
    tags: ['E-sports', 'Angola', 'Comunidade'],
    views: 223,
    commentsCount: 0,
    blocks: [
      {
        type: 'p',
        text: 'Os e-sports em Angola estão a crescer de forma orgânica. Começaram em pequenos torneios entre amigos e hoje já existem comunidades organizadas em torno de shooters, jogos de luta e futebol virtual.',
      },
      {
        type: 'p',
        text: 'O principal desafio continua a ser a infraestrutura: ligações estáveis, equipamentos acessíveis e espaços para treinar. Ainda assim, a paixão dos jogadores tem compensado muitas destas limitações.',
      },
      {
        type: 'image',
        src: postImg(9),
        alt: 'Jogador concentrado diante do ecrã',
        caption: 'As comunidades locais são a base do crescimento competitivo.',
      },
      {
        type: 'quote',
        text: 'Não precisamos de esperar pelas grandes arenas. Podemos começar pelas salas de casa e pelos torneios de bairro.',
      },
      { type: 'h2', text: 'Como participar' },
      {
        type: 'list',
        items: [
          'Junta-te a comunidades locais e participa em torneios amigáveis.',
          'Treine com regularidade e reveja as suas partidas.',
          'Procura equipas que valorizem comunicação e fair play.',
        ],
      },
      {
        type: 'p',
        text: 'A GameAO apoia a comunidade angolana de videojogos e pretende, em fases futuras, criar espaços de divulgação de torneios e resultados. Por agora, acompanha as notícias na nossa secção de Notícias.',
      },
    ],
  },
];

export const getPostBySlug = (slug: string): Post | undefined =>
  POSTS.find((post) => post.slug === slug);

export const NEWS_POSTS = POSTS.filter((post) => post.category === 'Notícias');
