import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ABOUT_BLOCKS, ABOUT_FEATURES, FOUNDER_PROFILE, GAMEAO_LOGO_URL } from '../data/site';

export function About() {
  return (
    <div className="static-page about-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Sobre Nós' }]} />
        <section className="about-intro">
          <img className="about-intro__logo" src={GAMEAO_LOGO_URL} alt="Logo da GameAO" />
          <div>
            <p className="page-kicker">Sobre a GameAO</p>
            <h1>O teu universo gamer, num só lugar</h1>
            <p>
              A GameAO é uma loja online dedicada ao universo dos videojogos e do entretenimento
              digital, criada para aproximar os jogadores de uma experiência de compra simples,
              acessível e confiável em Angola.
            </p>
            <p>
              A nossa plataforma ajuda-te a descobrir, consultar e adquirir produtos para as tuas
              plataformas preferidas, com informação clara sobre produtos, preços, disponibilidade,
              pagamento e acompanhamento de encomendas.
            </p>
            <p className="about-intro__note">
              Jogar é diversão, competição, criatividade, conexão e expressão. É essa energia que
              orienta cada melhoria da GameAO e a construção de uma comunidade gamer mais próxima.
            </p>
          </div>
        </section>

        <section className="about-features">
          {ABOUT_FEATURES.map((feature) => (
            <article key={feature.title} className="about-feature">
              <img src={feature.icon} alt="" />
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section className="team">
          <h2 className="section-heading__title">Quem está por trás da GameAO</h2>
          <div className="team-grid">
            <article className="team-member team-member--founder">
              <img src={FOUNDER_PROFILE.image} alt={`Fotografia de ${FOUNDER_PROFILE.name}`} loading="lazy" />
              <div>
                <p className="team-member__role">{FOUNDER_PROFILE.role}</p>
                <h3>{FOUNDER_PROFILE.name}</h3>
                <p>{FOUNDER_PROFILE.bio}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="about-blocks">
          {ABOUT_BLOCKS.map((block) => (
            <article key={block.title} className="about-block">
              <img src={block.image} alt="" loading="lazy" />
              <h2>{block.title}</h2>
              <p>{block.text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
