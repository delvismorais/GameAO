export interface Slide {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  image: string;
  align: 'left' | 'center';
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  image: string;
}

export interface Preorder {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  image: string;
  position?: string;
}

export interface Feature {
  icon: string;
  title: string;
  text: string;
}

export const HOME1_SLIDES: Slide[] = [
  {
    id: 'batman',
    title: 'Batman Arkham Knight',
    description:
      'A noite de Gotham nunca foi tão intensa. Assume o controlo do Batmóvel, domina o combate e enfrenta os vilões mais perigosos da cidade.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home1/slide-1.jpg',
    align: 'left',
  },
  {
    id: 'forza',
    title: 'Forza Horizon 5',
    description:
      'Explora as estradas abertas do México, coleciona carros lendários e participa no maior festival de condução do mundo.',
    buttonLabel: 'Comprar Agora',
    href: '/product/forza-horizon-5',
    image: '/assets/home1/slide-2.jpg',
    align: 'left',
  },
  {
    id: 'titanfall',
    title: 'Titanfall 2',
    description:
      'Pilota titãs, salta entre paredes e combina mobilidade com estratégia numa campanha e num multijogador que ficaram para a história.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home1/slide-3.jpg',
    align: 'left',
  },
];

export const HOME2_SLIDES: Slide[] = [
  {
    id: 'gamepass',
    title: 'Xbox Game Pass',
    description:
      'Centenas de jogos à sua espera, de shooters a aventuras. Descubra o catálogo e escolha por onde começar.',
    buttonLabel: 'Comprar Agora',
    href: '/product-category/xbox',
    image: '/assets/home2/slide-1.jpg',
    align: 'center',
  },
  {
    id: 'lol',
    title: 'League of Legends',
    description:
      'Junte a sua equipa, escolha o seu campeão e domine a arena nos combates mais táticos do multijogador.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home2/slide-2.jpg',
    align: 'left',
  },
  {
    id: 'witcher',
    title: 'The Witcher 3: Wild Hunt',
    description:
      'Viaja por um continente devastado pela guerra, caça monstros e toma decisões que mudam o rumo da história.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home2/slide-3.jpg',
    align: 'left',
  },
];

export const HOME1_PROMOS: Promo[] = [
  {
    id: 'mortal-kombat',
    title: 'Mortal Kombat',
    description: 'Combates brutais, personagens icónicas e um modo história para jogar sem parar.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home1/promo-1.jpg',
  },
  {
    id: 'overwatch-2',
    title: 'Overwatch 2',
    description: 'Heróis com habilidades únicas e partidas por equipas em arenas de todo o mundo.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home1/promo-2.jpg',
  },
];

export const HOME2_PROMOS: Promo[] = [
  {
    id: 'doom-eternal',
    title: 'Doom Eternal',
    description: 'Ritmo alucinante, demonios por todo o lado e um arsenal feito para não parar.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home2/promo-1.jpg',
  },
  {
    id: 'assassins-creed-3',
    title: "Assassin's Creed 3",
    description: 'A Revolução Americana vista por um assassino. História, liberdade e conflito.',
    buttonLabel: 'Comprar Agora',
    href: '/shop',
    image: '/assets/home2/promo-2.jpg',
  },
];

export const HOME1_PREORDER: Preorder = {
  title: "Pré-reserva Assassin's Creed",
  description:
    'Garanta já a sua cópia e receba acesso antecipado aos conteúdos especiais da nova aventura da série.',
  buttonLabel: 'Reservar Agora',
  href: '/product/assassins-creed-valhalla',
  image: '/assets/home1/preorder.jpg',
  position: 'center center',
};

export const HOME2_PREORDER: Preorder = {
  title: "Pré-reserva Uncharted 4: A Thief's End",
  description:
    'Acompanhe Nathan Drake na sua última grande caçada ao tesouro. Reserve agora e prepare-se para a aventura.',
  buttonLabel: 'Reservar Agora',
  href: '/shop',
  image: '/assets/home2/preorder.jpg',
  position: 'center right',
};

export const HOME1_FEATURES: Feature[] = [
  {
    icon: '/assets/icons/h1-free.png',
    title: 'Envio Gratuito',
    text: 'Entregas gratuitas em Luanda em encomendas elegíveis.',
  },
  {
    icon: '/assets/icons/h1-support.png',
    title: 'Suporte Online 24/7',
    text: 'A nossa equipa está disponível para ajudar a qualquer hora do dia.',
  },
  {
    icon: '/assets/icons/h1-return.png',
    title: 'Devolução do Dinheiro',
    text: 'Devoluções simples e reembolso garantido em até 14 dias.',
  },
  {
    icon: '/assets/icons/h1-payout.png',
    title: 'Pagamento Seguro',
    text: 'Os seus dados e compras são protegidos em todas as etapas.',
  },
];

export const HOME2_FEATURES: Feature[] = [
  {
    icon: '/assets/icons/h2-free.png',
    title: 'Envio Gratuito',
    text: 'Entregas gratuitas em Luanda em encomendas elegíveis.',
  },
  {
    icon: '/assets/icons/h2-support.png',
    title: 'Suporte Online 24/7',
    text: 'A nossa equipa está disponível para ajudar a qualquer hora do dia.',
  },
  {
    icon: '/assets/icons/h2-return.png',
    title: 'Devolução do Dinheiro',
    text: 'Devoluções simples e reembolso garantido em até 14 dias.',
  },
  {
    icon: '/assets/icons/h2-payout.png',
    title: 'Pagamento Seguro',
    text: 'Os seus dados e compras são protegidos em todas as etapas.',
  },
];

export const TEAM = [
  { name: 'Julius L. Hopson', role: 'Programador', image: '/assets/team/member-1.jpg' },
  { name: 'Harold R. Speciale', role: 'Experiência do Cliente', image: '/assets/team/member-2.jpg' },
  { name: 'Jason K. Johnson', role: 'Marketing', image: '/assets/team/member-3.jpg' },
  { name: 'Orlando A. Steward', role: 'Programador', image: '/assets/team/member-4.jpg' },
  { name: 'David M. Beverly', role: 'Experiência do Cliente', image: '/assets/team/member-5.jpg' },
  { name: 'Gerald C. Foster', role: 'Marketing', image: '/assets/team/member-6.jpg' },
  { name: 'Laurence B. Grant', role: 'Vendas', image: '/assets/team/member-7.jpg' },
  { name: 'Darrell D. Killian', role: 'Vendas', image: '/assets/team/member-8.jpg' },
];

export const ABOUT_BLOCKS = [
  {
    title: 'O que fazemos',
    text: 'Selecionamos videojogos para PC, Xbox e PlayStation, com apoio em português. Cada título é escolhido pela qualidade e pela procura da comunidade angolana.',
    image: '/assets/about/block-1.jpg',
  },
  {
    title: 'A nossa missão',
    text: 'Tornar o acesso aos videojogos mais simples em Angola: informação clara, preços transparentes e uma experiência de compra que respeita o tempo de cada jogador.',
    image: '/assets/about/block-2.jpg',
  },
  {
    title: 'A nossa história',
    text: 'A GameAO nasce de uma paixão partilhada pelos jogos e da vontade de criar uma loja local com identidade própria. A plataforma nasce para aproximar jogadores angolanos dos seus jogos favoritos.',
    image: '/assets/about/block-3.jpg',
  },
];

export const ABOUT_FEATURES = [
  {
    icon: '/assets/about/icon-1.png',
    title: 'Devolução do Dinheiro',
    text: 'Política de devolução clara, com reembolso em até 14 dias.',
  },
  {
    icon: '/assets/about/icon-2.png',
    title: 'Suporte Online 24/7',
    text: 'Apoio por email e telefone para dúvidas sobre produtos e encomendas.',
  },
  {
    icon: '/assets/about/icon-3.png',
    title: 'Design Criativo',
    text: 'Uma loja pensada para mostrar os jogos com a energia que eles merecem.',
  },
];

export const FAQ_QUICK = [
  {
    q: 'Quais são os métodos de entrega disponíveis?',
    a: 'Em Luanda, entregamos em 24 a 48 horas úteis. Para as restantes províncias, a entrega é feita por transportadora em 3 a 7 dias úteis. Os prazos são indicados no checkout.',
  },
  {
    q: 'Como posso acompanhar a minha encomenda?',
    a: 'Depois de confirmar a encomenda, recebe um número de seguimento na página de confirmação e no histórico da sua conta. Esse número permite acompanhar o estado da entrega.',
  },
  {
    q: 'Preciso de uma conta para fazer uma encomenda?',
    a: 'Não é obrigatório. Pode finalizar a compra como convidado. Criar conta permite guardar favoritos, comparar produtos e consultar o histórico de encomendas.',
  },
  {
    q: 'Como faço para colocar uma encomenda?',
    a: 'Escolha os jogos na loja, adicione ao carrinho e siga para o checkout. Preencha os dados de faturação, escolha o método de pagamento disponível e confirme a encomenda.',
  },
];

export const FAQ_ACCORDION = [
  {
    q: 'Quanto tempo demora a entrega?',
    a: 'As entregas em Luanda demoram normalmente entre 24 e 48 horas úteis. Fora de Luanda, o prazo depende da transportadora e pode variar entre 3 e 7 dias úteis. Receberá uma notificação quando a encomenda for expedida.',
  },
  {
    q: 'Como acompanho a minha encomenda?',
    a: 'O número da encomenda é apresentado na confirmação e fica disponível em Minha Conta > Encomendas. Com esse número, pode contactar o apoio ao cliente para saber o estado atual da entrega.',
  },
  {
    q: 'Como faço uma encomenda?',
    a: 'Adicione os produtos ao carrinho, abra a página do carrinho e clique em Finalizar Compra. Preencha o formulário de faturação, reveja o resumo e confirme. O pagamento na entrega é confirmado pela equipa GameAO.',
  },
  {
    q: 'Posso devolver um jogo?',
    a: 'Sim, desde que o produto esteja selado e a devolução seja solicitada no prazo de 14 dias após a entrega. Entre em contacto com o apoio ao cliente para iniciar o processo.',
  },
  {
    q: 'Os pagamentos são seguros?',
    a: 'Os dados de cartão não são recolhidos. O pagamento na entrega é confirmado pela equipa GameAO; outros métodos serão disponibilizados quando forem ativados.',
  },
  {
    q: 'Como contacto o apoio ao cliente?',
    a: 'Pode utilizar o formulário da página Contacte-nos, enviar email para geral@gameao.shop ou ligar para 973 929 712. Respondemos normalmente no mesmo dia útil.',
  },
];

export const CONTACT_INFO = {
  hours: [
    { label: 'Segunda a sexta', value: '09:30 – 21:00' },
    { label: 'Sábado e domingo', value: '10:30 – 22:30' },
  ],
  phones: [
    { label: 'Telemóvel', value: '973 929 712' },
  ],
  email: 'geral@gameao.shop',
  addresses: ['Luanda, Angola', 'Luanda, Angola'],
};

export const FOOTER_TAGS = [
  'Ação',
  'Aventura',
  'Battle Royale',
  'Coop',
  'Luta',
  'Game Pass',
  'PC',
  'PS5',
  'Rally',
  'Remake',
  'RPG',
  'Shooter',
  'Desporto',
];

export const SOCIALS: {
  label: string;
  icon: 'facebook' | 'instagram' | 'twitter' | 'telegram';
  href: string;
}[] = [
  { label: 'Facebook', icon: 'facebook', href: '#' },
  { label: 'Instagram', icon: 'instagram', href: '#' },
  { label: 'Twitter', icon: 'twitter', href: '#' },
  { label: 'Telegram', icon: 'telegram', href: '#' },
];
