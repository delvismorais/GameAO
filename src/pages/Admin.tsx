import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminOrders, AdminDeliveries, AdminInvoices } from '../components/admin/AdminOrders';
import { AdminPayments } from '../components/admin/AdminPayments';
import { AdminProductsSection } from '../components/admin/AdminCatalog';
import { AdminContent } from '../components/admin/AdminContent';
import { AdminCustomers } from '../components/admin/AdminCustomers';
import { AdminMarketing } from '../components/admin/AdminMarketing';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminIntegrations, AdminSystem } from '../components/admin/AdminSystem';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminMedia } from '../components/admin/AdminMedia';
import { AdminStats } from '../components/admin/AdminStats';
import { useJson } from '../components/admin/ui';
import { SECTION_LABELS, type AdminSectionId } from '../components/admin/adminNav';

const VALID_SECTIONS = new Set(Object.keys(SECTION_LABELS));

function sectionFromParam(value: string | null): AdminSectionId {
  return value && VALID_SECTIONS.has(value) ? value as AdminSectionId : 'dashboard';
}

function SectionContent({ section, onNavigate }: { section: AdminSectionId; onNavigate: (section: AdminSectionId) => void }) {
  if (section === 'dashboard') return <AdminDashboard onNavigate={onNavigate} />;
  if (section === 'stats' || section === 'reports') return <AdminStats section={section} />;
  if (section === 'activity' || section === 'audit' || section === 'admin-history' || section === 'permissions' || section === 'sessions' || section === 'integration-status' || section === 'backups') return <AdminSystem section={section} />;
  if (['orders', 'orders-pending', 'orders-paid', 'orders-processing', 'orders-completed', 'orders-cancelled'].includes(section)) return <AdminOrders section={section} />;
  if (section === 'deliveries') return <AdminDeliveries />;
  if (section === 'invoices') return <AdminInvoices />;
  if (['payments', 'receiving', 'transactions', 'proofs', 'payments-pending', 'payments-confirmed', 'refunds', 'finance-reports'].includes(section)) return <AdminPayments section={section} />;
  if (['products', 'product-new', 'categories', 'platforms', 'stock', 'featured', 'promos'].includes(section)) return <AdminProductsSection section={section} />;
  if (['homepage', 'banners', 'carousels', 'popups', 'blog', 'blog-categories', 'comments', 'contact', 'pages', 'faq'].includes(section)) return <AdminContent section={section} />;
  if (section === 'media' || section === 'images') return <AdminMedia />;
  if (['customers', 'accounts', 'admins', 'roles'].includes(section)) return <AdminCustomers section={section} />;
  if (section === 'notifications') return <AdminNotifications />;
  if (['promotions', 'coupons', 'campaigns', 'emails', 'social', 'affiliates'].includes(section)) return <AdminMarketing section={section} />;
  if (['whatsapp', 'email-integration', 'gateways', 'webhooks', 'apis', 'storage'].includes(section)) return <AdminIntegrations section={section} />;
  if (section.startsWith('settings-')) return <AdminSettings section={section} />;
  return <AdminDashboard onNavigate={onNavigate} />;
}

export function Admin() {
  const [params, setParams] = useSearchParams();
  const [section, setSection] = useState<AdminSectionId>(() => sectionFromParam(params.get('secao')));
  const [forbidden, setForbidden] = useState(false);
  const overview = useJson<{ orders: { pending: number } }>('/api/admin/overview');
  const proofs = useJson<{ proofs: Array<{ status: string }> }>('/api/admin/payment-proofs');

  useEffect(() => {
    const fromUrl = sectionFromParam(params.get('secao'));
    setSection(fromUrl);
  }, [params]);

  useEffect(() => {
    if (overview.error && /sess|autoriz|unauthorized|403/i.test(overview.error)) setForbidden(true);
  }, [overview.error]);

  const navigate = (next: AdminSectionId) => {
    setSection(next);
    setParams(next === 'dashboard' ? {} : { secao: next }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (forbidden) return <PageShell crumbs={[{ label: 'Administração' }]}><div className="admin-empty"><h1 className="page-title">Administração</h1><p>Esta área requer uma conta administrativa autorizada.</p><Link to="/my-account" className="btn btn--primary">Iniciar sessão</Link></div></PageShell>;

  return <PageShell crumbs={[{ label: 'Administração' }]}>
    <AdminShell section={section} onNavigate={navigate} pendingOrders={Number(overview.data?.orders.pending ?? 0)} pendingProofs={(proofs.data?.proofs ?? []).filter((proof) => proof.status === 'submitted').length}>
      <SectionContent section={section} onNavigate={navigate} />
    </AdminShell>
  </PageShell>;
}
