export type AdminSectionId =
  | 'dashboard' | 'stats' | 'reports' | 'activity'
  | 'orders' | 'orders-pending' | 'orders-paid' | 'orders-processing' | 'orders-completed' | 'orders-cancelled' | 'invoices' | 'deliveries'
  | 'payments' | 'receiving' | 'transactions' | 'proofs' | 'payments-pending' | 'payments-confirmed' | 'refunds' | 'finance-reports'
  | 'products' | 'product-new' | 'categories' | 'platforms' | 'stock' | 'featured' | 'promos'
  | 'homepage' | 'banners' | 'carousels' | 'popups' | 'images' | 'blog' | 'blog-categories' | 'comments' | 'contact' | 'pages' | 'faq'
  | 'customers' | 'accounts' | 'admins' | 'roles'
  | 'promotions' | 'coupons' | 'campaigns' | 'notifications' | 'emails' | 'social' | 'affiliates'
  | 'whatsapp' | 'email-integration' | 'gateways' | 'webhooks' | 'apis' | 'storage' | 'media'
  | 'settings-general' | 'settings-identity' | 'settings-currency' | 'settings-business' | 'settings-checkout' | 'settings-delivery' | 'settings-seo'
  | 'audit' | 'admin-history' | 'permissions' | 'sessions' | 'integration-status' | 'backups';

export interface AdminNavItem { id: AdminSectionId; label: string; icon: string; badge?: number }
export interface AdminNavGroup { id: string; label: string; icon: string; items: AdminNavItem[] }

export const ADMIN_NAV: AdminNavGroup[] = [
  { id: 'overview', label: 'Visão geral', icon: 'grid', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'stats', label: 'Estatísticas de vendas', icon: 'chart' },
    { id: 'reports', label: 'Relatórios', icon: 'file' },
    { id: 'activity', label: 'Atividade recente', icon: 'activity' },
  ] },
  { id: 'sales', label: 'Vendas e encomendas', icon: 'bag', items: [
    { id: 'orders', label: 'Todas as encomendas', icon: 'bag' },
    { id: 'orders-pending', label: 'Encomendas pendentes', icon: 'clock' },
    { id: 'orders-paid', label: 'Encomendas pagas', icon: 'check' },
    { id: 'orders-processing', label: 'Em processamento', icon: 'refresh' },
    { id: 'orders-completed', label: 'Concluídas', icon: 'check' },
    { id: 'orders-cancelled', label: 'Canceladas', icon: 'close' },
    { id: 'invoices', label: 'Faturas', icon: 'file' },
    { id: 'deliveries', label: 'Acompanhamento de entregas', icon: 'truck' },
  ] },
  { id: 'finance', label: 'Pagamentos e finanças', icon: 'card', items: [
    { id: 'payments', label: 'Métodos de pagamento', icon: 'card' },
    { id: 'receiving', label: 'Dados de recebimento', icon: 'key' },
    { id: 'transactions', label: 'Transações', icon: 'activity' },
    { id: 'proofs', label: 'Comprovativos', icon: 'file' },
    { id: 'payments-pending', label: 'Pagamentos pendentes', icon: 'clock' },
    { id: 'payments-confirmed', label: 'Pagamentos confirmados', icon: 'check' },
    { id: 'refunds', label: 'Reembolsos', icon: 'refresh' },
    { id: 'finance-reports', label: 'Relatórios financeiros', icon: 'chart' },
  ] },
  { id: 'catalog', label: 'Catálogo', icon: 'box', items: [
    { id: 'products', label: 'Produtos', icon: 'box' },
    { id: 'product-new', label: 'Adicionar produto', icon: 'plus' },
    { id: 'categories', label: 'Categorias', icon: 'tag' },
    { id: 'platforms', label: 'Plataformas', icon: 'grid' },
    { id: 'stock', label: 'Stock', icon: 'database' },
    { id: 'featured', label: 'Produtos em destaque', icon: 'star' },
    { id: 'promos', label: 'Produtos promocionais', icon: 'tag' },
  ] },
  { id: 'content', label: 'Website e conteúdos', icon: 'home', items: [
    { id: 'homepage', label: 'Gestão da homepage', icon: 'home' },
    { id: 'banners', label: 'Banners', icon: 'image' },
    { id: 'carousels', label: 'Carrosséis', icon: 'image' },
    { id: 'popups', label: 'Popups e anúncios', icon: 'bell' },
    { id: 'images', label: 'Imagens', icon: 'image' },
    { id: 'media', label: 'Biblioteca de multimédia', icon: 'image' },
    { id: 'blog', label: 'Blog', icon: 'file' },
    { id: 'blog-categories', label: 'Categorias do blog', icon: 'tag' },
    { id: 'comments', label: 'Comentários', icon: 'mail' },
    { id: 'contact', label: 'Mensagens de contacto', icon: 'mail' },
    { id: 'pages', label: 'Páginas institucionais', icon: 'file' },
    { id: 'faq', label: 'Perguntas frequentes', icon: 'file' },
  ] },
  { id: 'customers', label: 'Clientes e utilizadores', icon: 'users', items: [
    { id: 'customers', label: 'Clientes', icon: 'users' },
    { id: 'accounts', label: 'Contas registadas', icon: 'user' },
    { id: 'admins', label: 'Administradores', icon: 'shield' },
    { id: 'roles', label: 'Funções e permissões', icon: 'key' },
  ] },
  { id: 'marketing', label: 'Marketing', icon: 'tag', items: [
    { id: 'promotions', label: 'Promoções', icon: 'tag' },
    { id: 'coupons', label: 'Cupões', icon: 'tag' },
    { id: 'campaigns', label: 'Campanhas', icon: 'mail' },
    { id: 'notifications', label: 'Notificações', icon: 'bell' },
    { id: 'emails', label: 'Emails', icon: 'mail' },
    { id: 'social', label: 'Redes sociais', icon: 'heart' },
    { id: 'affiliates', label: 'Afiliados', icon: 'users' },
  ] },
  { id: 'integrations', label: 'Integrações', icon: 'plug', items: [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'mail' },
    { id: 'email-integration', label: 'Serviços de email', icon: 'mail' },
    { id: 'gateways', label: 'Gateways de pagamento', icon: 'card' },
    { id: 'webhooks', label: 'Webhooks', icon: 'activity' },
    { id: 'apis', label: 'APIs externas', icon: 'plug' },
    { id: 'storage', label: 'Armazenamento de ficheiros', icon: 'database' },
  ] },
  { id: 'settings', label: 'Configurações', icon: 'settings', items: [
    { id: 'settings-general', label: 'Configurações gerais', icon: 'settings' },
    { id: 'settings-identity', label: 'Identidade da GameAO', icon: 'heart' },
    { id: 'settings-currency', label: 'Moeda', icon: 'tag' },
    { id: 'settings-business', label: 'Informações comerciais', icon: 'file' },
    { id: 'settings-checkout', label: 'Configurações do checkout', icon: 'card' },
    { id: 'settings-delivery', label: 'Configurações de entrega', icon: 'truck' },
    { id: 'settings-seo', label: 'SEO', icon: 'search' },
  ] },
  { id: 'security', label: 'Segurança e sistema', icon: 'shield', items: [
    { id: 'audit', label: 'Registos de atividades', icon: 'file' },
    { id: 'admin-history', label: 'Histórico administrativo', icon: 'clock' },
    { id: 'permissions', label: 'Permissões', icon: 'key' },
    { id: 'sessions', label: 'Sessões', icon: 'users' },
    { id: 'integration-status', label: 'Estado das integrações', icon: 'plug' },
    { id: 'backups', label: 'Backups e exportações', icon: 'database' },
  ] },
];

export const GROUP_LABELS: Record<string, string> = Object.fromEntries(ADMIN_NAV.map((group) => [group.id, group.label]));
export const SECTION_LABELS: Record<string, string> = Object.fromEntries(ADMIN_NAV.flatMap((group) => group.items.map((item) => [item.id, item.label])));
