# Auditoria — painel administrativo e centro de notificações GameAO

Data: 2026-11-17

## Referência visual

A referência fornecida foi `https://dashboardpack.com/live-demo-preview/?livedemo=391333`. O que deve ser reaproveitado é a direção de produto: navegação administrativa persistente, hierarquia clara, cartões de resumo, tabelas densas com filtros e uma área de trabalho responsiva. O painel não deve copiar HTML, CSS, imagens ou identidade da demonstração; deve manter a marca, paleta escura/orange, Rubik, logo e linguagem do GameAO.

## Lacunas verificadas

- O shell já tinha drawer mobile, pesquisa de menu, breadcrumbs, KPIs, tabelas e modais, mas o centro de notificações só permitia um teste isolado e não encontrava uma encomenda pelo número para compor uma mensagem.
- Os modelos por evento já existiam no banco e podiam ser editados, mas faltavam criação e remoção no painel, escolha de modelo no envio manual e personalização com pré-visualização.
- As entregas podiam ser filtradas por canal/estado, mas faltava filtrar por encomenda e ligar o histórico ao fluxo manual.
- As campanhas de email já existiam, porém o envio era um fluxo separado, sem renderização das variáveis por destinatário e sem registo uniforme no histórico de entregas.
- O SMS já estava implementado como canal transacional opcional via TelcoSMS; a interface precisava expor o estado real e permitir envio manual com o telefone da encomenda.

## Decisão funcional desta fase

1. Criar pesquisa protegida de encomendas em `/api/admin/notification-orders/lookup`.
2. Criar envio manual protegido em `/api/admin/notifications/manual` para email, SMS, WhatsApp e notificação interna, sempre associado à encomenda e registado em `notification_deliveries`.
3. Completar CRUD de `notification_templates` no centro de comunicação.
4. Completar campanhas de email em massa para leads subscritos, com confirmação no painel, variáveis renderizadas por destinatário e registo de cada tentativa no histórico.
5. Melhorar os espaços, estados, filtros e layouts mobile sem alterar o website público.

Os canais externos continuam dependentes das configurações reais do ambiente. O painel deve mostrar `não configurado`, `falhou`, `enviado` ou `ignorado`; nunca simular um envio.
