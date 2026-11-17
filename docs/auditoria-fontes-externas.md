# Fontes externas consultadas — auditoria GameAO

- Site público do fornecedor: https://www.telcosms.net/
- Referência Postman pública encontrada: https://documenter.getpostman.com/view/7705958/Uyr7Hydn
- Produção GameAO: https://gameao.onrender.com/
- Serviço Render: https://dashboard.render.com/web/srv-dbs29ibbc2fs73acfhpg/events

## Nota de integração
A documentação pública consultada não confirmou, por si só, um contrato completo e inequívoco para as chaves QAS/PRD fornecidas pelo utilizador, nem autorizou a inferência de um endpoint diferente do que já estava no código. A implementação deve, portanto, manter endpoint, método, payload e headers configuráveis por variáveis de ambiente e registar respostas sanitizadas; não deve colocar chaves no repositório.
