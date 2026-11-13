import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ABOUT_BLOCKS, ABOUT_FEATURES, TEAM } from '../data/site';

export function About() {
  return (
    <div className="static-page about-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Sobre Nós' }]} />
        <section className="about-intro">
          <img src="/assets/about/store.jpg" alt="Interior de uma loja de videojogos" />
          <div>
            <h1>Sobre a nossa loja</h1>
            <p>
              A GameAO é uma loja de videojogos pensada para jogadores em Angola. Reunimos num só
              lugar títulos para PC, Xbox e PlayStation, com preços em kwanzas e informação clara
              sobre cada jogo.
            </p>
            <p>
              Esta versão é uma reconstrução de demonstração do template GameShop. O objetivo é
              preservar a experiência visual e funcional da referência e, ao mesmo tempo, preparar
              a base para a loja definitiva. A taxa USD/AOA é configurável e todos os preços se
              atualizam automaticamente.
            </p>
            <p className="about-intro__note">
              Os nomes comerciais, capas e marcas apresentados pertencem aos respetivos titulares.
              Esta página não representa uma loja oficial.
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
          <h2 className="section-heading__title">Conheça a nossa equipa</h2>
          <div className="team-grid">
            {TEAM.map((member) => (
              <article key={member.name} className="team-member">
                <img src={member.image} alt={`Retrato de ${member.name}`} loading="lazy" />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </article>
            ))}
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
