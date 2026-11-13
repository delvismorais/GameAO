import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Accordion } from '../components/ui/Accordion';
import { FAQ_ACCORDION, FAQ_QUICK } from '../data/site';

export function Faq() {
  return (
    <div className="static-page faq-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Perguntas Frequentes' }]} />
        <header className="static-head static-head--center">
          <h1>Perguntas Frequentes</h1>
          <p>As respostas às dúvidas mais comuns sobre a loja, as encomendas e as entregas.</p>
        </header>

        <div className="faq-quick">
          {FAQ_QUICK.map((item) => (
            <article key={item.q} className="faq-quick__item">
              <h2>{item.q}</h2>
              <p>{item.a}</p>
            </article>
          ))}
        </div>

        <section className="faq-accordion">
          <h2 className="section-heading__title">Segunda versão das Perguntas Frequentes</h2>
          <p className="faq-accordion__intro">
            Clique numa pergunta para ver a resposta. As informações são geridas pela equipa
            GameAO e podem ser atualizadas nas configurações de conteúdo.
          </p>
          <Accordion items={FAQ_ACCORDION} />
        </section>

        <div className="faq-note">
          <strong>Nota:</strong> os prazos, métodos de entrega e contactos apresentados são
          configuráveis pela equipa GameAO e devem ser confirmados antes de qualquer operação comercial.
        </div>
      </div>
    </div>
  );
}
