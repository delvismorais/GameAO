export type CategorySlug = 'game' | 'xbox' | 'playstation' | 'pc' | 'featured' | 'free-fire' | 'roblox' | 'premium' | 'accessories';

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'game', name: 'Jogos', description: 'Todo o catálogo de videojogos da GameAO.' },
  { slug: 'xbox', name: 'Xbox', description: 'Jogos para Xbox One, Xbox Series X|S e Game Pass.' },
  { slug: 'playstation', name: 'PlayStation', description: 'Jogos para PlayStation 4 e PlayStation 5.' },
  { slug: 'pc', name: 'PC', description: 'Jogos para PC — Steam, Epic Games e outras lojas.' },
  { slug: 'featured', name: 'Destaques', description: 'Os títulos em destaque escolhidos pela equipa GameAO.' },
  { slug: 'free-fire', name: 'Free Fire', description: 'Diamantes, assinaturas, passes e produtos Free Fire.' },
  { slug: 'roblox', name: 'Roblox', description: 'Robux e cartões presente para Roblox.' },
  { slug: 'premium', name: 'Assinaturas Premium', description: 'Serviços e subscrições digitais.' },
  { slug: 'accessories', name: 'Acessórios', description: 'Acessórios gamer e produtos físicos.' },
];

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Preço-base em dólares americanos. É a única fonte do preço. */
  basePriceUsd: number;
  /** Preço promocional em dólares americanos, quando existe. */
  salePriceUsd?: number;
  rating: number;
  reviewCount: number;
  categories: CategorySlug[];
  tags: string[];
  image: string;
  imageCard: string;
  hot?: boolean;
  /** Ordem original da loja (por omissão). */
  shopOrder: number;
  /** Ordem no carrossel "Jogos em Destaque". */
  featuredOrder?: number;
  /** Ordem na grelha "Jogos Recentes". */
  recentOrder?: number;
  /** Ordem nas Ofertas da Semana. */
  dealOrder?: number;
  shortDescription: string;
  description: string[];
  releaseYear: number;
  developer: string;
  platform: string;
  isActive?: boolean;
  categoryType?: 'digital' | 'physical';
  productSubtype?: 'physical' | 'digital_game' | 'digital_other';
  requiresPlayerId?: boolean;
  subCategory?: string;
  shippingCostAoa?: number;
  additionalImages?: string[];
  videoUrl?: string;
  isDynamic?: boolean;
  variants?: Array<{ id: number; name: string; sku?: string; priceUsd: number; originalPriceUsd?: number; description?: string }>;
}

const img = (n: number) => `/assets/products/game-${n}.jpg`;
const card = (n: number) => `/assets/products/game-${n}-card.jpg`;

export const PRODUCTS: Product[] = [
  {
    id: 'game-1',
    slug: 'forza-horizon-5',
    name: 'Forza Horizon 5',
    basePriceUsd: 25,
    rating: 4,
    reviewCount: 1,
    categories: ['game', 'pc', 'xbox'],
    tags: ['Ação', 'Aventura', 'RPG'],
    image: img(1),
    imageCard: card(1),
    shopOrder: 7,
    recentOrder: 1,
    shortDescription:
      'Corre pelas estradas abertas do México num dos mundos de condução mais vibrantes da atualidade.',
    description: [
      'Forza Horizon 5 leva-te a um México aberto e cheio de contrastes: desertos, selvas, vulcões e cidades costeiras ligadas por centenas de quilómetros de estrada. Escolhe o teu carro, ajusta-o ao teu estilo e participa em corridas de rua, eventos off-road e desafios de velocidade.',
      'O modo campanha acompanha a evolução do teu festival Horizon, com novas provas a desbloquear à medida que ganhas reputação. A condução é acessível para quem chega agora, mas mantém profundidade suficiente para quem gosta de afinar suspensões, pneus e transmissões.',
      'Com amigos ou sozinho, é um jogo pensado para sessões longas e para descobrir paisagens ao volante. Inclui suporte para mandos e teclado no PC, além de versões para Xbox One e Xbox Series X|S.',
    ],
    releaseYear: 2021,
    developer: 'Playground Games',
    platform: 'PC, Xbox One, Xbox Series X|S',
  },
  {
    id: 'game-2',
    slug: 'call-of-duty-black-ops',
    name: 'Call of Duty Black Ops',
    basePriceUsd: 59,
    salePriceUsd: 39,
    rating: 5,
    reviewCount: 1,
    categories: ['game', 'pc', 'playstation', 'xbox'],
    tags: ['Ação', 'Aventura', 'RPG', 'Shooter'],
    image: img(2),
    imageCard: card(2),
    shopOrder: 4,
    recentOrder: 2,
    dealOrder: 1,
    shortDescription:
      'Uma campanha intensa da Guerra Fria, com operações secretas, multijogador e modos cooperativos.',
    description: [
      'Call of Duty: Black Ops mergulha-te numa guerra secreta que atravessa décadas e continentes. A campanha alterna missões de infiltração, perseguições e combates abertos, sempre com ritmo de thriller e reviravoltas no melhor estilo da série.',
      'O multijogador aposta em mapas variados e progressão por níveis, com armas personalizáveis e modos clássicos como Domínio, Captura de Bandeira e Team Deathmatch. Para quem prefere jogar em grupo, há ainda experiências cooperativas contra vagas de inimigos.',
      'A versão para PC inclui suporte a rato e teclado, enquanto as versões PlayStation e Xbox foram pensadas para comando. É uma excelente escolha para quem procura um shooter completo, tanto para campanha como para partidas rápidas online.',
    ],
    releaseYear: 2020,
    developer: 'Treyarch / Raven Software',
    platform: 'PC, PlayStation 4/5, Xbox One/Series',
  },
  {
    id: 'game-3',
    slug: 'nba-2k21',
    name: 'NBA 2K21',
    basePriceUsd: 39,
    rating: 3,
    reviewCount: 1,
    categories: ['game', 'pc', 'playstation'],
    tags: ['Ação', 'Aventura', 'RPG', 'Desporto'],
    image: img(3),
    imageCard: card(3),
    shopOrder: 14,
    recentOrder: 3,
    shortDescription:
      'Vive o basquetebol profissional com equipas licenciadas, modos de carreira e partidas online.',
    description: [
      'NBA 2K21 traz o basquetebol norte-americano para a tua consola ou PC com equipas, arenas e jogadores licenciados. O controlo de bola, os lançamentos e as jogadas ensaiadas respondem às tuas decisões em tempo real.',
      'O modo carreira permite criar o teu jogador, treinar, assinar contratos e construir uma reputação na liga. Já o modo rápido é ideal para partidas entre amigos ou para simular confrontos entre as tuas equipas favoritas.',
      'A apresentação televisiva, os comentários e a atmosfera dos pavilhões fazem deste título uma experiência próxima do basquetebol real. Disponível para PC e PlayStation, com suporte para comando.',
    ],
    releaseYear: 2020,
    developer: 'Visual Concepts',
    platform: 'PC, PlayStation 4/5',
  },
  {
    id: 'game-4',
    slug: 'it-takes-two',
    name: 'It Takes Two',
    basePriceUsd: 49,
    rating: 4,
    reviewCount: 1,
    categories: ['game', 'pc'],
    tags: ['Ação', 'Aventura', 'Coop', 'RPG'],
    image: img(4),
    imageCard: card(4),
    shopOrder: 11,
    recentOrder: 4,
    shortDescription:
      'Uma aventura cooperativa obrigatória para dois jogadores, cheia de puzzles e mundos fantásticos.',
    description: [
      'It Takes Two foi desenhado de raiz para ser jogado a dois. Cody e May, um casal em crise, são transformados em bonecos e obrigados a colaborar para atravessar mundos absurdos e recuperar a forma humana.',
      'Cada capítulo apresenta mecânicas novas: um dos jogadores pode controlar o tempo, o outro manipula ímãs; há fases de plataformas, combates contra chefes e puzzles que só se resolvem com comunicação. A dificuldade está pensada para sessões em conjunto, não para solo.',
      'O jogo inclui a opção de convidar um amigo para jogar sem custos adicionais na versão de PC, através da lista de amigos da plataforma. É uma das melhores experiências cooperativas dos últimos anos.',
    ],
    releaseYear: 2021,
    developer: 'Hazelight Studios',
    platform: 'PC',
  },
  {
    id: 'game-5',
    slug: 'apex-legends',
    name: 'Apex Legends',
    basePriceUsd: 39,
    salePriceUsd: 29,
    rating: 3,
    reviewCount: 1,
    categories: ['game', 'pc', 'playstation', 'xbox'],
    tags: ['Ação', 'Aventura', 'Battle Royale', 'RPG'],
    image: img(5),
    imageCard: card(5),
    shopOrder: 1,
    recentOrder: 5,
    dealOrder: 2,
    shortDescription:
      'Battle royale por equipas com personagens únicas, movimento rápido e combate tático.',
    description: [
      'Apex Legends combina o formato battle royale com heróis com habilidades próprias. Escolha a sua lenda, junta-te a dois companheiros e sobrevive numa arena que encolhe, onde posicionamento e comunicação valem tanto como pontaria.',
      'O sistema de ping permite comunicar sem microfone, o que torna as partidas acessíveis a quem joga com estranhos. As personagens dividem-se entre atacantes, reconhecimento, suporte e defesa, incentivando composições equilibradas.',
      'Cada temporada acrescenta mapas, armas e modos, mantendo o jogo em evolução. É gratuito para jogar e está disponível para PC, PlayStation e Xbox.',
    ],
    releaseYear: 2019,
    developer: 'Respawn Entertainment',
    platform: 'PC, PlayStation 4/5, Xbox One/Series',
  },
  {
    id: 'game-6',
    slug: 'gears-of-war-5',
    name: 'Gears of War 5',
    basePriceUsd: 79,
    rating: 4,
    reviewCount: 1,
    categories: ['featured', 'game'],
    tags: ['Ação', 'Aventura', 'RPG'],
    image: img(6),
    imageCard: card(6),
    hot: true,
    shopOrder: 8,
    featuredOrder: 1,
    recentOrder: 6,
    shortDescription:
      'A guerra contra a Horda continua numa campanha épica, com cooperação e combate de cobertura.',
    description: [
      'Gears of War 5 acompanha Kait Diaz numa jornada para descobrir a origem da Horda e o seu próprio passado. A campanha pode ser jogada sozinho ou em cooperação, com combates de cobertura, armas pesadas e sequências de grande escala.',
      'O sistema de combate mantém a identidade da série: proteger, avançar, flanquear e usar o ambiente a teu favor. As personagens evoluem através de habilidades desbloqueáveis, permitindo abordagens diferentes em cada encontro.',
      'Além da campanha, inclui modos multijogador e uma componente cooperativa de ondas de inimigos. Versão Xbox e PC, com suporte a comando e teclado.',
    ],
    releaseYear: 2019,
    developer: 'The Coalition',
    platform: 'PC, Xbox One, Xbox Series X|S',
  },
  {
    id: 'game-7',
    slug: 'borderlands-3',
    name: 'Borderlands 3',
    basePriceUsd: 29,
    rating: 4,
    reviewCount: 1,
    categories: ['featured', 'game', 'playstation'],
    tags: ['Ação', 'Aventura', 'RPG'],
    image: img(7),
    imageCard: card(7),
    hot: true,
    shopOrder: 3,
    featuredOrder: 2,
    recentOrder: 7,
    shortDescription:
      'Loot em abundância, humor absurdo e combate frenético num shooter de mundo aberto.',
    description: [
      'Borderlands 3 é um looter-shooter em que cada inimigo pode largar a arma dos teus sonhos. Escolhe um dos caçadores de cofres, desenvolve a sua árvore de habilidades e parte à descoberta de planetas cheios de facções hostis.',
      'O humor da série está presente em cada diálogo e missão secundária, com personagens excêntricas e situações deliberadamente exageradas. O combate privilegia o movimento e a combinação de armas com elementos diferentes.',
      'Pode ser jogado sozinho ou em cooperação até quatro jogadores. Disponível para PC, PlayStation e Xbox, com progressão pensada para sessões longas de exploração e recolha de equipamento.',
    ],
    releaseYear: 2019,
    developer: 'Gearbox Software',
    platform: 'PC, PlayStation 4/5, Xbox One/Series',
  },
  {
    id: 'game-8',
    slug: 'god-of-war',
    name: 'God of War',
    basePriceUsd: 49,
    salePriceUsd: 39,
    rating: 3.5,
    reviewCount: 2,
    categories: ['featured', 'game', 'playstation'],
    tags: ['Ação', 'Aventura', 'PS5', 'RPG'],
    image: img(8),
    imageCard: card(8),
    hot: true,
    shopOrder: 10,
    featuredOrder: 3,
    recentOrder: 8,
    dealOrder: 3,
    shortDescription:
      'Kratos e Atreus atravessam os reinos nórdicos numa aventura de ação e descoberta.',
    description: [
      'God of War reinventa a saga de Kratos num mundo inspirado na mitologia nórdica. Desta vez, o guerreiro espartano viaja com o filho Atreus, numa relação que se constrói ao longo da campanha através de diálogos e decisões.',
      'O combate combina o machado Leviatã, os punhos e a ajuda de Atreus, com um sistema de câmara próxima que dá peso a cada golpe. Os reinos são semiabertos, com segredos, missões opcionais e inimigos poderosos.',
      'A versão para PlayStation 4 e 5 beneficia de tempos de carregamento curtos e de um modo de desempenho em consolas mais recentes. É um dos exclusivos mais aclamados da plataforma.',
    ],
    releaseYear: 2018,
    developer: 'Santa Monica Studio',
    platform: 'PlayStation 4/5',
  },
  {
    id: 'game-9',
    slug: 'wreckfest',
    name: 'Wreckfest',
    basePriceUsd: 89,
    rating: 2,
    reviewCount: 1,
    categories: ['featured', 'game', 'pc', 'xbox'],
    tags: ['Ação', 'Aventura', 'Game Pass', 'RPG'],
    image: img(9),
    imageCard: card(9),
    hot: true,
    shopOrder: 15,
    featuredOrder: 4,
    recentOrder: 9,
    shortDescription:
      'Corridas de demolição com física destrutiva, carros clássicos e muita colisão.',
    description: [
      'Wreckfest celebra a corrida como espetáculo destrutivo. Carros antigos, furgonetas e máquinas modificadas enfrentam-se em pistas de terra, asfalto e arenas de demolição onde sobreviver já é uma vitória.',
      'O modelo de danos é o grande destaque: para-choques voam, portas amolgam e o motor pode ceder a meio de uma prova. A física torna cada colisão imprevisível e obriga a adaptar a condução ao estado do carro.',
      'Inclui campeonato, eventos especiais e multijogador. Disponível para PC e Xbox, com suporte para comando e teclado.',
    ],
    releaseYear: 2018,
    developer: 'Bugbear Entertainment',
    platform: 'PC, Xbox One/Series',
  },
  {
    id: 'game-10',
    slug: 'assassins-creed-valhalla',
    name: "Assassin's Creed Valhalla",
    basePriceUsd: 19,
    rating: 4,
    reviewCount: 1,
    categories: ['featured', 'game', 'pc', 'playstation', 'xbox'],
    tags: ['Ação', 'Aventura', 'Luta', 'RPG'],
    image: img(10),
    imageCard: card(10),
    hot: true,
    shopOrder: 2,
    featuredOrder: 5,
    recentOrder: 10,
    shortDescription:
      'Lidera um clã viking na Inglaterra medieval, entre raids, política e exploração.',
    description: [
      "Assassin's Creed Valhalla coloca-te no papel de Eivor, um líder viking que deixa a Noruega em busca de uma nova terra. A campanha combina raids a povoações, construção do teu assentamento e alianças com os reinos ingleses.",
      'O combate é direto e brutal, com alternância entre machado, escudo e arco, além de habilidades desbloqueáveis. A exploração é livre e recompensa quem se desvia do caminho principal para descobrir segredos e artefactos.',
      'A versão inclui melhorias para consolas de nova geração e suporte para PC. É uma aventura longa, pensada para quem gosta de história, mitologia e mundos abertos.',
    ],
    releaseYear: 2020,
    developer: 'Ubisoft Montreal',
    platform: 'PC, PlayStation 4/5, Xbox One/Series',
  },
  {
    id: 'game-11',
    slug: 'final-fantasy-vii-remake',
    name: 'Final Fantasy VII Remake',
    basePriceUsd: 49,
    salePriceUsd: 39,
    rating: 5,
    reviewCount: 1,
    categories: ['featured', 'game', 'playstation'],
    tags: ['Ação', 'Aventura', 'Remake', 'RPG'],
    image: img(11),
    imageCard: card(11),
    hot: true,
    shopOrder: 6,
    featuredOrder: 6,
    shortDescription:
      'O clássico RPG regressa com combate em tempo real e uma Midgar recriada em detalhe.',
    description: [
      'Final Fantasy VII Remake reconstrói a primeira parte da aventura original com gráficos modernos e um sistema de combate híbrido. Cloud, Aerith, Tifa e Barret alternam entre ataques em tempo real e comandos táticos, num equilíbrio entre ação e estratégia.',
      'Midgar ganha vida em bairros, mercados e estações de metro, com personagens secundárias e missões que aprofundam o mundo. A banda sonora foi reorganizada e gravada de novo para acompanhar o tom mais cinematográfico.',
      'A versão para PlayStation 5 inclui melhorias gráficas e um capítulo adicional. É essencial para fãs de RPG e para quem quer conhecer um dos jogos mais influentes da história.',
    ],
    releaseYear: 2020,
    developer: 'Square Enix',
    platform: 'PlayStation 4/5',
  },
  {
    id: 'game-12',
    slug: 'motocross-2020',
    name: 'Motocross 2020',
    basePriceUsd: 15,
    rating: 4,
    reviewCount: 1,
    categories: ['featured', 'game', 'pc', 'xbox'],
    tags: ['Ação', 'Aventura', 'PC', 'RPG'],
    image: img(12),
    imageCard: card(12),
    hot: true,
    shopOrder: 13,
    shortDescription:
      'Salta, derrapa e domina pistas de motocross com controlo acessível e progressão.',
    description: [
      'Motocross 2020 é um jogo de corridas de mota em terra, com pistas técnicas e saltos que exigem timing. O controlo foi pensado para ser acessível, mas permite afinações de suspensão e potência para quem quer ganhar décimos.',
      'O modo carreira leva-te por diferentes campeonatos, com patrocinadores e motas a desbloquear. As quedas fazem parte da experiência: aprender a levantar e a recuperar a linha é tão importante como acelerar.',
      'Disponível para PC e Xbox, é uma opção leve para sessões curtas ou para competir com amigos no mesmo ecrã.',
    ],
    releaseYear: 2020,
    developer: 'Arcade Studio',
    platform: 'PC, Xbox One',
  },
  {
    id: 'game-13',
    slug: 'dirt-5',
    name: 'Dirt 5',
    basePriceUsd: 79,
    salePriceUsd: 49,
    rating: 5,
    reviewCount: 1,
    categories: ['game', 'pc', 'playstation', 'xbox'],
    tags: ['Ação', 'Aventura', 'Rally', 'RPG'],
    image: img(13),
    imageCard: card(13),
    shopOrder: 5,
    shortDescription:
      'Rally, gelo, terra e estádios: corridas arcade espetaculares com narrativa e multijogador.',
    description: [
      'Dirt 5 aposta numa condução arcade e espetacular, com pistas que vão do rally tradicional a circuitos em estádios e corridas no gelo. A câmara e os efeitos de partículas dão protagonismo ao espetáculo.',
      'A campanha é conduzida por uma narrativa com vozes conhecidas, alternando eventos e desafios. O sistema de dificuldade ajustável permite que tanto novatos como veteranos encontrem o equilíbrio certo.',
      'Inclui multijogador online e ecrã dividido para dois jogadores. Disponível para PC, PlayStation e Xbox, com versões otimizadas para as consolas mais recentes.',
    ],
    releaseYear: 2020,
    developer: 'Codemasters',
    platform: 'PC, PlayStation 4/5, Xbox One/Series',
  },
  {
    id: 'game-14',
    slug: 'ghostrunner',
    name: 'Ghostrunner',
    basePriceUsd: 25,
    rating: 3,
    reviewCount: 1,
    categories: ['featured', 'game', 'pc', 'playstation'],
    tags: ['Ação', 'Aventura', 'RPG'],
    image: img(14),
    imageCard: card(14),
    hot: true,
    shopOrder: 9,
    shortDescription:
      'Parkour e combate de um só golpe numa torre cyberpunk onde cada erro é fatal.',
    description: [
      'Ghostrunner é um jogo de ação em primeira pessoa que combina parkour com combate de um golpe. Num único tiro ou corte morres, mas os inimigos também caem depressa — o segredo está em planear cada sala antes de te lançares.',
      'A torre cyberpunk está dividida em níveis verticais, com paredes para escalar, ganchos e caminhos alternativos. A banda sonora eletrónica acompanha o ritmo acelerado das tentativas e reinícios.',
      'A versão para PC e PlayStation 5 corre a alta taxa de fotogramas, essencial para um jogo tão exigente. É recomendado para quem gosta de desafios de precisão.',
    ],
    releaseYear: 2020,
    developer: 'One More Level',
    platform: 'PC, PlayStation 4/5',
  },
  {
    id: 'game-15',
    slug: 'mortal-shell-enhanced',
    name: 'Mortal Shell Enhanced',
    basePriceUsd: 59,
    salePriceUsd: 49,
    rating: 4,
    reviewCount: 1,
    categories: ['game', 'playstation', 'xbox'],
    tags: ['Ação', 'Aventura', 'RPG'],
    image: img(15),
    imageCard: card(15),
    shopOrder: 12,
    shortDescription:
      'Um souls-like sombrio com corpos para habitar e combate deliberado.',
    description: [
      'Mortal Shell Enhanced é um RPG de ação sombrio em que o teu corpo é uma concha. Ao encontrar novos cascos, ganhas estilos de combate diferentes, com resistências e movimentos próprios.',
      'O combate privilegia a leitura dos inimigos e a gestão de stamina. A mecânica de endurecimento permite absorver um golpe no momento certo, recompensando quem arrisca com precisão.',
      'A versão Enhanced inclui melhorias gráficas e de desempenho para consolas mais recentes. Disponível para PlayStation e Xbox, é uma escolha sólida para fãs de desafios exigentes.',
    ],
    releaseYear: 2020,
    developer: 'Cold Symmetry',
    platform: 'PlayStation 4/5, Xbox One/Series',
  },
];

export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((product) => product.slug === slug);

export const getProductById = (id: string): Product | undefined =>
  PRODUCTS.find((product) => product.id === id);

export const getCategoryBySlug = (slug: string): Category | undefined =>
  CATEGORIES.find((category) => category.slug === slug);

export const productsInCategory = (slug: CategorySlug): Product[] =>
  PRODUCTS.filter((product) => product.categories.includes(slug));

export const getEffectivePriceUsd = (product: Product): number =>
  product.salePriceUsd ?? product.basePriceUsd;

export const FEATURED_PRODUCTS = [...PRODUCTS]
  .filter((product) => product.featuredOrder !== undefined)
  .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));

export const RECENT_PRODUCTS = [...PRODUCTS]
  .filter((product) => product.recentOrder !== undefined)
  .sort((a, b) => (a.recentOrder ?? 0) - (b.recentOrder ?? 0));

export const DEAL_PRODUCTS = [...PRODUCTS]
  .filter((product) => product.dealOrder !== undefined)
  .sort((a, b) => (a.dealOrder ?? 0) - (b.dealOrder ?? 0));

export const SHOP_PRODUCTS = [...PRODUCTS].sort((a, b) => a.shopOrder - b.shopOrder);
