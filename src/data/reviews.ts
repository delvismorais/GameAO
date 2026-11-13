export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export const SEED_REVIEWS: Review[] = [
  {
    id: 'r-1',
    productId: 'game-1',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Jogo muito bonito e com uma condução acessível. A paisagem é o grande destaque e as corridas são variadas. Recomendo para quem gosta de explorar sem pressa.',
  },
  {
    id: 'r-2',
    productId: 'game-2',
    author: 'Administrador',
    rating: 5,
    date: '2026-04-28',
    text: 'Campanha intensa e multijogador sólido. A progressão das armas mantém o interesse durante muitas horas. Uma das melhores compras para quem gosta de shooters.',
  },
  {
    id: 'r-3',
    productId: 'game-3',
    author: 'Administrador',
    rating: 3,
    date: '2026-04-28',
    text: 'Bom para partidas rápidas com amigos. A apresentação é excelente, mas o modo carreira podia ser mais variado. Cumpre o que promete.',
  },
  {
    id: 'r-4',
    productId: 'game-4',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Um dos melhores jogos cooperativos que já experimentei. Cada fase tem uma ideia nova e é impossível não rir com as situações. Ideal para jogar a dois.',
  },
  {
    id: 'r-5',
    productId: 'game-5',
    author: 'Administrador',
    rating: 3,
    date: '2026-04-28',
    text: 'Movimento muito fluido e personagens interessantes. As partidas podem ser exigentes para quem começa agora, mas o sistema de ping ajuda bastante.',
  },
  {
    id: 'r-6',
    productId: 'game-6',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Campanha divertida e visualmente forte. O combate de cobertura continua a funcionar muito bem e a cooperação é fluida. Vale a pena para fãs da série.',
  },
  {
    id: 'r-7',
    productId: 'game-7',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Muitas armas, humor constante e exploração recompensadora. O ritmo é excelente e há sempre algo novo para experimentar.',
  },
  {
    id: 'r-8',
    productId: 'game-8',
    author: 'Administrador',
    rating: 3,
    date: '2026-04-28',
    text: 'História muito bem contada e combate com peso. Alguns puzzles tornam o ritmo mais lento, mas a experiência geral é marcante.',
  },
  {
    id: 'r-9',
    productId: 'game-8',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Um dos grandes exclusivos da PlayStation. A relação entre Kratos e Atreus é o centro do jogo e funciona muito bem. Recomendo.',
  },
  {
    id: 'r-10',
    productId: 'game-9',
    author: 'Administrador',
    rating: 2,
    date: '2026-04-28',
    text: 'A física de destruição é divertida, mas o controlo é difícil com teclado. Com comando melhora bastante. É um jogo para descomprimir.',
  },
  {
    id: 'r-11',
    productId: 'game-10',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Mundo enorme e cheio de coisas para fazer. A ambientação viking é muito conseguida e as raids são o ponto alto.',
  },
  {
    id: 'r-12',
    productId: 'game-11',
    author: 'Administrador',
    rating: 5,
    date: '2026-04-28',
    text: 'Remake impressionante. Midgar está cheia de detalhes e o combate equilibra ação e estratégia. Um clássico que continua a emocionar.',
  },
  {
    id: 'r-13',
    productId: 'game-12',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Simples e divertido. As pistas são variadas e o controlo responde bem. Bom para sessões curtas.',
  },
  {
    id: 'r-14',
    productId: 'game-13',
    author: 'Administrador',
    rating: 5,
    date: '2026-04-28',
    text: 'Corridas muito espetaculares e uma campanha bem construída. O ecrã dividido é uma excelente surpresa.',
  },
  {
    id: 'r-15',
    productId: 'game-14',
    author: 'Administrador',
    rating: 3,
    date: '2026-04-28',
    text: 'Exigente e viciante. Cada sala exige várias tentativas, mas quando tudo encaixa a sensação é ótima. Não é para todos.',
  },
  {
    id: 'r-16',
    productId: 'game-15',
    author: 'Administrador',
    rating: 4,
    date: '2026-04-28',
    text: 'Sombrio, desafiante e com um sistema de cascos interessante. Para quem gosta de souls-like é uma boa escolha.',
  },
];
