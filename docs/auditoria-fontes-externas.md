# Fontes externas consultadas — auditoria GameAO

- Site oficial TelcoSMS Angola: https://telcosms.co.ao/
- Documentação pública da integração TelcoSMS consultada: https://pt.scribd.com/document/659990447/Integracao-TelcoSMS
- Referência Postman pública comparativa: https://documenter.getpostman.com/view/7705958/Uyr7Hydn
- Produção GameAO: https://gameao.onrender.com/
- Serviço Render: https://dashboard.render.com/web/srv-dbs29ibbc2fs73acfhpg/events

## Integração TelcoSMS

A rota validada para produção é `POST https://telcosms.co.ao/send_message`, com corpo JSON no formato `{ "message": { "api_key_app": "...", "phone_number": "244...", "message_body": "..." } }`.

A chave PRD permanece apenas como segredo de ambiente no Render. O teste real para o número autorizado respondeu HTTP 200 com `Mensagem enviada com sucesso`. O código mantém a URL configurável por `TELCOSMS_API_URL`, com a rota oficial como fallback, e regista apenas respostas limitadas/sanitizadas na base de dados.
