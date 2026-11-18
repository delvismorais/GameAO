import { Link } from 'react-router-dom';

type LegalKind = 'privacy' | 'terms';
type LegalSection = { title: string; paragraphs?: string[]; bullets?: string[] };

const LAST_UPDATED = '18 de novembro de 2026';
const SITE_URL = 'https://gameao.onrender.com';
const CONTACT_EMAIL = 'geral@gameao.shop';
const CONTACT_PHONE = '973 929 712';

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Responsável pelo tratamento',
    paragraphs: [
      'A GameAO respeita a privacidade dos seus clientes, utilizadores e visitantes. O responsável pelo tratamento das informações recolhidas através da plataforma é Delvis de Morais, titular e fundador da GameAO, no âmbito da Morário Digital.',
      `A GameAO tem sede de atendimento em Luanda, Angola. Para questões sobre privacidade, pode contactar ${CONTACT_EMAIL} ou ${CONTACT_PHONE}.`,
    ],
  },
  {
    title: '2. Informações que recolhemos',
    paragraphs: ['Recolhemos apenas as informações necessárias para disponibilizar a loja, processar encomendas, prestar apoio e proteger as operações. Dependendo da utilização da plataforma, estas informações podem incluir:'],
    bullets: [
      'Nome completo, email, telefone, nome de utilizador e dados de perfil.',
      'Número da encomenda, produtos adquiridos, quantidades, valores, data, estado e método de pagamento.',
      'Morada, cidade, província e instruções de entrega quando forem necessários para produtos físicos.',
      'Referências de pagamento, identificadores de transação, estado do pagamento e comprovativos enviados pelo cliente.',
      'Endereço IP, tipo de dispositivo, navegador, sistema operativo, data e hora de acesso, cookies e registos técnicos.',
    ],
  },
  {
    title: '3. Como utilizamos os dados pessoais',
    paragraphs: ['As informações podem ser utilizadas para:'],
    bullets: [
      'Criar e administrar contas de utilizador.',
      'Processar encomendas, validar os dados fornecidos e acompanhar pedidos.',
      'Gerir pagamentos, comprovativos, entregas e comunicações relacionadas com a compra.',
      'Prestar apoio ao cliente e responder a pedidos enviados pelos canais oficiais.',
      'Prevenir fraude, abuso, acessos não autorizados e outras utilizações ilícitas.',
      'Melhorar a segurança, o funcionamento e a experiência de utilização da plataforma.',
      'Cumprir obrigações legais e regulamentares aplicáveis.',
    ],
  },
  {
    title: '4. Fundamento do tratamento',
    paragraphs: [
      'O tratamento pode ser necessário para executar uma encomenda ou diligências solicitadas pelo utilizador, cumprir obrigações legais, proteger a segurança da plataforma ou prosseguir interesses legítimos compatíveis com os direitos dos titulares.',
      'Quando o tratamento depender de consentimento, o utilizador poderá retirar esse consentimento nos termos legalmente aplicáveis. A retirada não afeta os tratamentos realizados antes desse momento.',
    ],
  },
  {
    title: '5. Partilha de informações com terceiros',
    paragraphs: [
      'A GameAO não vende dados pessoais. Poderá partilhar informações estritamente necessárias com prestadores que apoiem o funcionamento da plataforma, como alojamento e infraestrutura tecnológica, base de dados, autenticação, armazenamento de ficheiros, processamento de pagamentos, email e comunicação, ou com autoridades públicas quando existir uma obrigação legal.',
      'O acesso desses prestadores deve limitar-se ao necessário para o serviço contratado. Os fornecedores efetivamente utilizados podem mudar à medida que a infraestrutura da GameAO evolui.',
    ],
  },
  {
    title: '6. Conservação e segurança',
    paragraphs: [
      'Conservamos os dados apenas durante o período necessário às finalidades que justificaram a recolha, sem prejuízo dos prazos exigidos por lei. Os dados de encomendas e transações podem ser mantidos pelo período necessário à gestão comercial, resolução de reclamações e cumprimento de obrigações fiscais ou legais.',
      'Aplicamos medidas técnicas e organizativas razoáveis, incluindo controlo de acessos, proteção de contas e gestão de permissões. Nenhum sistema pode garantir segurança absoluta, pelo que também pedimos ao utilizador que proteja as suas credenciais e não partilhe palavras-passe ou códigos privados.',
    ],
  },
  {
    title: '7. Transferências internacionais',
    paragraphs: ['A utilização de serviços tecnológicos pode implicar que determinados dados sejam tratados ou armazenados fora de Angola. Quando isso acontecer, a GameAO procurará observar as condições legais aplicáveis e utilizar garantias adequadas ao serviço e à natureza das informações tratadas.'],
  },
  {
    title: '8. Cookies e tecnologias semelhantes',
    paragraphs: ['A plataforma pode utilizar cookies estritamente necessários para manter sessões, guardar preferências, proteger a conta e facilitar o funcionamento do carrinho. Cookies de análise, publicidade ou outras finalidades não essenciais deverão respeitar os mecanismos de consentimento aplicáveis e as configurações disponibilizadas no website ou no navegador.'],
  },
  {
    title: '9. Direitos dos titulares',
    paragraphs: ['Nos termos da legislação aplicável, o utilizador pode solicitar informação sobre os seus dados e, quando aplicável, exercer os direitos de acesso, rectificação, actualização, eliminação, oposição ou retirada de consentimento. Para apresentar um pedido, contacte:'],
    bullets: [CONTACT_EMAIL, 'GameAO — Privacidade e Protecção de Dados', 'Telefone/WhatsApp: ' + CONTACT_PHONE],
  },
  {
    title: '10. Menores e ligações externas',
    paragraphs: [
      'A plataforma não deve ser utilizada por menores para realizar compras sem a autorização e supervisão do representante legal quando forem legalmente exigidas. Se forem identificados dados recolhidos indevidamente, a GameAO poderá adotar medidas adequadas para os corrigir ou eliminar.',
      'A plataforma pode conter ligações para serviços de terceiros. A GameAO não controla as respetivas políticas de privacidade, segurança ou conteúdos; recomendamos a leitura dessas políticas antes de fornecer dados fora da plataforma.',
    ],
  },
  {
    title: '11. Alterações e contactos',
    paragraphs: [`Esta política pode ser atualizada para refletir alterações nos serviços, na infraestrutura ou na legislação aplicável. A versão em vigor será disponibilizada nesta página com a respetiva data de atualização. Para dúvidas ou reclamações, escreva para ${CONTACT_EMAIL} ou utilize o WhatsApp ${CONTACT_PHONE}.`],
  },
];

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Identificação da plataforma',
    paragraphs: [
      'A GameAO é uma loja online dedicada a produtos e conteúdos relacionados com videojogos e entretenimento digital.',
      'Nome comercial: GameAO. Titular e fundador: Delvis de Morais, no âmbito da Morário Digital. Localização de atendimento: Luanda, Angola. Email: ' + CONTACT_EMAIL + '. Telefone/WhatsApp: ' + CONTACT_PHONE + `. Website: ${SITE_URL}.`,
      'A plataforma disponibiliza as funcionalidades efetivamente ativadas, que podem incluir consulta de produtos, conta de utilizador, encomendas, pagamentos e acompanhamento de pedidos.',
    ],
  },
  {
    title: '2. Aceitação dos termos',
    paragraphs: ['Ao navegar, criar uma conta ou realizar uma encomenda, o utilizador declara que leu e compreendeu estes Termos e Condições, a Política de Privacidade e as condições apresentadas durante a compra. Caso não concorde, deverá deixar de utilizar as funcionalidades de compra da plataforma.'],
  },
  {
    title: '3. Produtos e informações',
    paragraphs: ['Os produtos podem ter características, formatos, plataformas, regiões, requisitos e condições de utilização diferentes. Antes de comprar, o cliente deve consultar o nome, descrição, imagem, preço, plataforma compatível, região, formato de entrega, requisitos, condições particulares e disponibilidade apresentados na página do produto.', 'As imagens têm finalidade ilustrativa, sem prejuízo da obrigação de disponibilizar um produto correspondente à descrição anunciada. Em caso de dúvida sobre compatibilidade, região ou plataforma, recomendamos o contacto com o suporte antes da encomenda.'],
  },
  {
    title: '4. Preços e moeda',
    paragraphs: ['Os preços apresentados são expressos em kwanzas angolanos (AOA), com a designação Kz, salvo indicação clara em contrário. O valor mostrado no momento da finalização é o valor considerado para a encomenda, incluindo promoções válidas e custos adicionais apresentados antes da confirmação.', 'A GameAO pode atualizar preços e condições comerciais sem afetar encomendas já confirmadas. Em caso de erro manifesto de preço ou informação, contactaremos o cliente para esclarecer e regularizar a situação respeitando os direitos legalmente aplicáveis.'],
  },
  {
    title: '5. Conta de utilizador',
    paragraphs: ['Quando uma funcionalidade exigir conta, o utilizador deve fornecer informações verdadeiras e atualizadas, manter as credenciais confidenciais, comunicar utilizações não autorizadas e não utilizar a plataforma para fraude ou atividades ilícitas. A GameAO poderá suspender acessos quando existirem indícios fundamentados de abuso, fraude ou violação destes termos.'],
  },
  {
    title: '6. Processo de compra e encomendas',
    paragraphs: ['O processo pode incluir escolha do produto, adição ao carrinho, revisão dos itens, preenchimento de dados, escolha do método de pagamento, confirmação da encomenda, apresentação das instruções de pagamento e validação do pagamento quando aplicável.', 'Antes de concluir, o cliente deve verificar produtos, quantidades, preços e dados fornecidos. A receção da encomenda não significa, por si só, que o pagamento tenha sido confirmado ou que a entrega tenha sido concluída. O processamento depende da disponibilidade, do estado do pagamento e das condições apresentadas durante a compra.'],
  },
  {
    title: '7. Métodos de pagamento',
    paragraphs: ['A GameAO disponibiliza apenas os métodos efetivamente configurados e apresentados no checkout. Cada método pode ter instruções próprias, referências e dados de recebimento. Quando a confirmação for manual, a encomenda permanecerá pendente até à validação efetiva do recebimento.', 'O envio de um comprovativo não constitui confirmação automática de pagamento. O cliente deve utilizar exclusivamente os dados e instruções apresentados nos canais oficiais e nunca enviar palavras-passe bancárias, PIN ou credenciais privadas de contas de jogos.'],
  },
  {
    title: '8. Processamento e entrega',
    paragraphs: ['Após a criação da encomenda, o cliente poderá acompanhar as informações disponibilizadas na área de pedidos ou na sua conta. O processamento varia conforme o produto e o método de entrega.', 'Produtos digitais podem ser entregues por código, chave, instruções, créditos ou outro conteúdo digital através do canal indicado no produto, checkout ou confirmação, após a validação do pagamento. Produtos físicos dependem da disponibilidade, localização, custos e prazos logísticos indicados. Quando aplicável, os prazos e condições serão apresentados antes da confirmação.'],
  },
  {
    title: '9. Acompanhamento de encomendas',
    paragraphs: ['A GameAO pode disponibilizar uma funcionalidade de acompanhamento para consulta do estado dos pedidos. O cliente deve utilizar o número da encomenda e os dados de verificação solicitados. As informações de encomendas são confidenciais e não devem ser partilhadas com terceiros sem autorização ou fundamento legal.'],
  },
  {
    title: '10. Cancelamentos, devoluções e reembolsos',
    paragraphs: ['Os pedidos de cancelamento, devolução e reembolso serão analisados considerando a natureza do produto, o estado da encomenda, o pagamento realizado e a legislação aplicável. Quando a encomenda ainda não tiver sido processada ou entregue, o cliente deve contactar o suporte o mais rapidamente possível.', 'Nos produtos digitais, a ativação, utilização, disponibilização ou exposição de códigos e conteúdos pode influenciar a possibilidade de cancelamento ou reembolso, sem eliminar direitos legalmente reconhecidos. Produtos inválidos, não entregues ou diferentes das características anunciadas podem ser reclamados para análise e resolução adequada. Quando um reembolso for devido, será processado através de um método adequado, considerando as limitações do pagamento original.'],
  },
  {
    title: '11. Responsabilidades do cliente',
    paragraphs: ['O cliente compromete-se a utilizar corretamente a plataforma, fornecer dados verdadeiros, verificar os produtos antes da compra, utilizar métodos de pagamento legítimos, não manipular preços ou sistemas, não praticar fraude, não realizar atividades ilegais e respeitar a propriedade intelectual de terceiros.'],
  },
  {
    title: '12. Terceiros e propriedade intelectual',
    paragraphs: ['Alguns produtos podem depender de plataformas, fabricantes ou serviços de terceiros e ficar sujeitos às respetivas condições de ativação, compatibilidade e região. Salvo indicação expressa, a GameAO não declara associação, patrocínio ou representação oficial de fabricantes ou titulares de marcas de videojogos.', 'Os conteúdos originais da GameAO, incluindo textos, elementos gráficos, logótipo, organização visual e materiais próprios, estão protegidos pela legislação aplicável. Marcas e conteúdos de terceiros pertencem aos respetivos titulares e não podem ser copiados ou explorados sem autorização.'],
  },
  {
    title: '13. Disponibilidade e segurança',
    paragraphs: ['A GameAO procura manter o website disponível e funcional, mas podem ocorrer interrupções temporárias por manutenção, falhas técnicas, conectividade ou circunstâncias externas. Serão adotadas medidas razoáveis para reduzir o impacto e restabelecer o serviço.', 'Podem ser realizadas verificações adicionais para proteger clientes, encomendas e operações contra fraude ou utilização não autorizada. Nenhuma disposição destes termos pretende afastar responsabilidades que não possam ser legalmente excluídas.'],
  },
  {
    title: '14. Alterações, privacidade e legislação',
    paragraphs: ['Estes Termos podem ser atualizados para refletir alterações nos serviços, no funcionamento da plataforma ou na legislação. A versão em vigor estará disponível nesta página com a data da última atualização. A utilização da plataforma e o tratamento de dados pessoais também são regulados pela Política de Privacidade da GameAO.', 'Os Termos devem ser interpretados de acordo com a legislação aplicável, incluindo as disposições angolanas relativas à defesa do consumidor, contratação eletrónica e proteção de dados pessoais, sem prejuízo de normas imperativas. Procuraremos resolver qualquer conflito inicialmente através dos canais oficiais, sem prejuízo do recurso às autoridades ou tribunais competentes.'],
  },
  {
    title: '15. Contactos',
    paragraphs: [`Para dúvidas sobre produtos, pagamentos, encomendas, cancelamentos ou utilização da plataforma, contacte a GameAO através de ${CONTACT_EMAIL}, WhatsApp ${CONTACT_PHONE} ou ${SITE_URL}.`],
  },
];

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <section className="legal-section">
      <h2>{section.title}</h2>
      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
    </section>
  );
}

export function Legal({ kind }: { kind: LegalKind }) {
  const privacy = kind === 'privacy';
  const sections = privacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  return (
    <main className="page-section legal-page">
      <div className="container legal-page__inner">
        <p className="page-kicker">GameAO · Informação institucional</p>
        <h1>{privacy ? 'Política de Privacidade' : 'Termos e Condições'}</h1>
        <p className="legal-page__updated">Última atualização: {LAST_UPDATED}</p>
        <p className="legal-page__lead">
          {privacy
            ? 'Esta política explica como a GameAO recolhe, utiliza, protege e conserva informações pessoais durante a utilização da plataforma.'
            : 'Estes termos regulam o acesso à plataforma GameAO, a navegação no website e as compras e encomendas realizadas através da loja.'}
        </p>
        <div className="legal-page__content">
          {sections.map((section) => <LegalSectionView key={section.title} section={section} />)}
        </div>
        <p className="legal-page__back"><Link to="/">Voltar à loja</Link></p>
      </div>
    </main>
  );
}
