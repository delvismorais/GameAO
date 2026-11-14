import { Link } from 'react-router-dom';

type LegalKind = 'privacy' | 'terms';

export function Legal({ kind }: { kind: LegalKind }) {
  const privacy = kind === 'privacy';
  return (
    <main className="page-section legal-page">
      <div className="container legal-page__inner">
        <p className="page-kicker">GameAO</p>
        <h1>{privacy ? 'Política de privacidade' : 'Termos e condições'}</h1>
        <p className="legal-page__updated">Última atualização: novembro de 2026</p>
        {privacy ? (
          <>
            <h2>Dados que recolhemos</h2>
            <p>Recolhemos apenas os dados necessários para processar encomendas, prestar apoio ao cliente, confirmar pagamentos e acompanhar pedidos: nome, contacto, email, morada quando aplicável e dados do pedido.</p>
            <h2>Utilização dos dados</h2>
            <p>Os dados são usados para criar e acompanhar a encomenda, validar comprovativos, entregar produtos e responder às solicitações do cliente. Não vendemos os seus dados.</p>
            <h2>Conservação e segurança</h2>
            <p>Aplicamos medidas técnicas e administrativas para proteger as informações. Os dados são conservados pelo período necessário às finalidades comerciais, fiscais e de apoio ao cliente.</p>
            <h2>Contacto</h2>
            <p>Para questões sobre privacidade, contacte a GameAO através do email geral@gameao.shop ou WhatsApp 973 929 712.</p>
          </>
        ) : (
          <>
            <h2>Encomendas</h2>
            <p>O cliente deve confirmar que os dados fornecidos estão corretos. A encomenda fica sujeita à disponibilidade do produto e à validação do pagamento.</p>
            <h2>Pagamentos</h2>
            <p>A GameAO disponibiliza Express, PayPay AO, Unitel Money, transferência bancária e pagamento presencial mediante combinação. A confirmação de pagamentos digitais depende da análise do comprovativo.</p>
            <h2>Entrega</h2>
            <p>Produtos digitais são entregues instantaneamente após a confirmação do pagamento. Produtos físicos têm prazo mínimo de 24 horas, podendo variar conforme o destino e a disponibilidade.</p>
            <h2>Atendimento</h2>
            <p>Em caso de dúvida ou divergência, contacte a equipa GameAO antes de concluir a compra para receber orientação adequada.</p>
          </>
        )}
        <p className="legal-page__back"><Link to="/">Voltar à loja</Link></p>
      </div>
    </main>
  );
}
