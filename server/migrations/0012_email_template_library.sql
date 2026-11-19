-- GameAO: biblioteca de 17 modelos de email reutilizáveis em notificações automáticas e envios manuais.
-- Os textos são originais; imagens reutilizam ativos já presentes em public/assets.
INSERT INTO notification_templates (event_key, channel, name, subject, body) VALUES
($event0$email.template.agradecimento$event0$, 'email', $name0$Agradecimento$name0$, $subject0$Obrigado por escolher a GameAO$subject0$, $body0$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Agradecemos por fazer parte da comunidade GameAO.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Agradecimento · GameAO</p>
<img src="{{site_url}}/assets/home1/slide-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Valeu por escolher a GameAO!</h1>
<p style="margin:0 0 14px;">{{customer_name}}, agradecemos por confiar na GameAO para acompanhar sua jornada no universo dos games.</p>
<p style="margin:0 0 14px;">Esperamos que sua experiência com a {{site_name}} seja prática e agradável.</p>
<p style="margin:0 0 22px;">Conte conosco para encontrar seus próximos jogos e produtos digitais.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Visitar a loja</a>
</div>$body0$),
($event1$email.template.aniversario$event1$, 'email', $name1$Aniversário$name1$, $subject1$Um feliz aniversário da GameAO!$subject1$, $body1$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Hoje é dia de celebrar — receba nossos melhores votos.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Aniversário · GameAO</p>
<img src="{{site_url}}/assets/home1/slide-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Feliz aniversário!</h1>
<p style="margin:0 0 14px;">A equipe da {{site_name}} deseja a você um dia especial, cheio de bons momentos.</p>
<p style="margin:0 0 14px;">Que não faltem diversão, alegria e motivos para comemorar.</p>
<p style="margin:0 0 22px;">Quando quiser, passe pela loja e explore o universo dos jogos e produtos digitais.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body1$),
($event2$email.template.anuncio$event2$, 'email', $name2$Anúncio$name2$, $subject2$Novidades para explorar na GameAO$subject2$, $body2$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Confira opções de jogos e produtos digitais na GameAO.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Anúncio · GameAO</p>
<img src="{{site_url}}/assets/home1/slide-3.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Encontre sua próxima experiência</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}, descubra jogos e produtos digitais para curtir no seu ritmo.</p>
<p style="margin:0 0 14px;">Explore o catálogo da {{site_name}} e encontre opções que combinam com você.</p>
<p style="margin:0 0 22px;">Acesse a página para conhecer os destaques disponíveis no momento.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Ver novidades</a>
</div>$body2$),
($event3$email.template.boas-vindas$event3$, 'email', $name3$Boas-vindas$name3$, $subject3$Bem-vindo à GameAO$subject3$, $body3$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore jogos e produtos digitais em um só lugar.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Boas-vindas · GameAO</p>
<img src="{{site_url}}/assets/home1/promo-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Que bom ter você por aqui!</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! A {{site_name}} dá as boas-vindas a você ao universo GameAO.</p>
<p style="margin:0 0 14px;">Explore nossa seleção de videojogos e produtos digitais com praticidade.</p>
<p style="margin:0 0 22px;">Quando quiser, visite a loja e encontre algo para sua próxima aventura.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body3$),
($event4$email.template.confirmacao$event4$, 'email', $name4$Confirmação$name4$, $subject4$Confirmação da sua solicitação$subject4$, $body4$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Recebemos sua solicitação na {{site_name}}.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Confirmação · GameAO</p>
<img src="{{site_url}}/assets/home1/promo-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Tudo certo, recebemos sua solicitação</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! Confirmamos o recebimento da sua solicitação e agradecemos por escolher a GameAO.</p>
<p style="margin:0 0 14px;">Nossa equipe vai verificar as informações enviadas.</p>
<p style="margin:0 0 22px;">Se precisar, entre em contato pelos canais oficiais da loja.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Acessar a loja</a>
</div>$body4$),
($event5$email.template.feedback$event5$, 'email', $name5$Feedback$name5$, $subject5$Conte para nós o que achou$subject5$, $body5$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Sua opinião ajuda a GameAO a melhorar sua experiência.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Feedback · GameAO</p>
<img src="{{site_url}}/assets/home1/preorder.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Queremos ouvir você</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}, gostaríamos de saber como foi sua experiência com a {{site_name}}.</p>
<p style="margin:0 0 14px;">Responda a este email e conte o que funcionou bem para você.</p>
<p style="margin:0 0 22px;">Se algo poderia ser melhor, sua sugestão também será bem-vinda, sem compromisso.</p>
<a href="{{site_url}}/contact-us" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Enviar feedback</a>
</div>$body5$),
($event6$email.template.lancamento$event6$, 'email', $name6$Lançamento$name6$, $subject6$Novidades GameAO para descobrir$subject6$, $body6$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore os lançamentos e encontre sua próxima experiência de jogo.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Lançamento · GameAO</p>
<img src="{{site_url}}/assets/home2/slide-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Novidades para jogar do seu jeito</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! Confira os lançamentos em destaque na {{site_name}} e descubra novas experiências para aproveitar.</p>
<p style="margin:0 0 14px;">Explore jogos e produtos digitais que chegaram recentemente à nossa seleção.</p>
<p style="margin:0 0 22px;">Veja os detalhes de cada opção e escolha o que combina com você.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Ver lançamentos</a>
</div>$body6$),
($event7$email.template.lembrete$event7$, 'email', $name7$Lembrete$name7$, $subject7$Seu próximo jogo pode estar por aqui$subject7$, $body7$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore a GameAO e encontre produtos digitais para curtir no seu ritmo.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Lembrete · GameAO</p>
<img src="{{site_url}}/assets/home2/slide-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Ainda pensando no que jogar?</h1>
<p style="margin:0 0 14px;">{{customer_name}}, explore a seleção da {{site_name}} e veja o que combina com você.</p>
<p style="margin:0 0 14px;">Descubra jogos e produtos digitais em poucos cliques.</p>
<p style="margin:0 0 22px;">Confira os detalhes de cada opção antes de escolher.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar agora</a>
</div>$body7$),
($event8$email.template.notificacao$event8$, 'email', $name8$Notificação$name8$, $subject8$Uma mensagem da GameAO$subject8$, $body8$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Acompanhe novidades e informações da sua experiência GameAO.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Notificação · GameAO</p>
<img src="{{site_url}}/assets/home2/slide-3.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Fique por dentro da GameAO</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! A GameAO reúne conteúdos para você acompanhar o universo dos jogos e produtos digitais.</p>
<p style="margin:0 0 14px;">Explore a loja e conheça as opções disponíveis no site.</p>
<p style="margin:0 0 22px;">Acesse quando quiser para conferir as informações da GameAO.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Acessar GameAO</a>
</div>$body8$),
($event9$email.template.novo-produto$event9$, 'email', $name9$Novo produto$name9$, $subject9$Conheça as novidades da GameAO$subject9$, $body9$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore novos produtos digitais e escolha o que combina com você.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Novo produto · GameAO</p>
<img src="{{site_url}}/assets/home1/slide-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Tem novidade na GameAO</h1>
<p style="margin:0 0 14px;">{{customer_name}}, descubra novos produtos digitais para explorar no seu ritmo.</p>
<p style="margin:0 0 14px;">Veja opções para diferentes estilos de jogo e interesses.</p>
<p style="margin:0 0 22px;">Acesse a GameAO e confira os detalhes de cada produto.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar novidades</a>
</div>$body9$),
($event10$email.template.oferta-especial$event10$, 'email', $name10$Oferta especial$name10$, $subject10$Uma oferta especial da GameAO$subject10$, $body10$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Confira a seleção especial e veja o que combina com você.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Oferta especial · GameAO</p>
<img src="{{site_url}}/assets/home2/promo-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Uma oferta especial para sua próxima jogada</h1>
<p style="margin:0 0 14px;">{{customer_name}}, a GameAO preparou uma seleção especial de jogos e produtos digitais para você explorar.</p>
<p style="margin:0 0 14px;">Confira as opções disponíveis e escolha o que mais combina com seu estilo.</p>
<p style="margin:0 0 22px;">Acesse a loja para conhecer os detalhes desta seleção especial.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Ver oferta especial</a>
</div>$body10$),
($event11$email.template.onboarding$event11$, 'email', $name11$Onboarding$name11$, $subject11$Boas-vindas à GameAO$subject11$, $body11$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore jogos e produtos digitais em {{site_name}}.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Onboarding · GameAO</p>
<img src="{{site_url}}/assets/home1/slide-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Sua próxima experiência começa aqui</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! Seja bem-vindo à GameAO, sua loja online de videojogos e produtos digitais.</p>
<p style="margin:0 0 14px;">Explore o catálogo e encontre opções para acompanhar seu estilo de jogo.</p>
<p style="margin:0 0 22px;">Quando precisar, nossa equipe está à disposição para ajudar.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body11$),
($event12$email.template.post-de-blog$event12$, 'email', $name12$Post de blog$name12$, $subject12$Novidades e dicas para quem joga$subject12$, $body12$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Confira o conteúdo da GameAO e descubra novas ideias para sua próxima sessão.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Post de blog · GameAO</p>
<img src="{{site_url}}/assets/blog/post-1.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Mais conteúdo para sua paixão por games</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}, reunimos um novo conteúdo para você explorar o universo dos games com a GameAO.</p>
<p style="margin:0 0 14px;">Leia dicas, curiosidades e assuntos que ajudam a aproveitar melhor cada jogo.</p>
<p style="margin:0 0 22px;">Acesse o blog da {{site_name}} e escolha o tema que mais combina com você.</p>
<a href="{{site_url}}/category/news" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Ler o artigo</a>
</div>$body12$),
($event13$email.template.progresso$event13$, 'email', $name13$Progresso$name13$, $subject13$Acompanhe sua jornada na GameAO$subject13$, $body13$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Veja as novidades e continue explorando seu universo gamer.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Progresso · GameAO</p>
<img src="{{site_url}}/assets/home2/slide-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Sua jornada continua</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}, siga descobrindo novas possibilidades para curtir seus jogos favoritos.</p>
<p style="margin:0 0 14px;">Explore a loja {{site_name}} e encontre produtos digitais que combinam com seu estilo.</p>
<p style="margin:0 0 22px;">Confira as informações de cada produto antes de escolher o próximo passo.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body13$),
($event14$email.template.reengajamento$event14$, 'email', $name14$Reengajamento$name14$, $subject14$Que tal voltar à GameAO?$subject14$, $body14$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore novamente jogos e produtos digitais que combinam com você.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Reengajamento · GameAO</p>
<img src="{{site_url}}/assets/home2/promo-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Sua próxima aventura pode começar aqui</h1>
<p style="margin:0 0 14px;">{{customer_name}}, venha explorar novamente o universo de jogos e produtos digitais da {{site_name}}.</p>
<p style="margin:0 0 14px;">Confira opções para diferentes estilos de jogo e momentos de diversão.</p>
<p style="margin:0 0 22px;">Quando quiser, visite a loja e descubra o que chama sua atenção.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body14$),
($event15$email.template.saudacao$event15$, 'email', $name15$Saudação$name15$, $subject15$Uma saudação da GameAO$subject15$, $body15$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Que bom ter você por aqui. Explore o universo dos games com a GameAO.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Saudação · GameAO</p>
<img src="{{site_url}}/assets/home2/preorder.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Boas-vindas à GameAO!</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}, é um prazer ter você por aqui e fazer parte da comunidade de games da GameAO.</p>
<p style="margin:0 0 14px;">Encontre jogos e produtos digitais para acompanhar sua próxima aventura.</p>
<p style="margin:0 0 22px;">Quando quiser, visite a {{site_name}} e descubra o que combina com você.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body15$),
($event16$email.template.venda$event16$, 'email', $name16$Venda$name16$, $subject16$Encontre seu próximo jogo na GameAO$subject16$, $body16$<div style="max-width:544px;margin:0 auto;color:#3c4852;font-family:Arial,Helvetica,sans-serif;line-height:1.65;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Explore jogos e produtos digitais para sua próxima partida.</div>
<p style="margin:0 0 10px;color:#cd3d0f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Venda · GameAO</p>
<img src="{{site_url}}/assets/home1/promo-2.jpg" alt="Imagem do universo de jogos GameAO" width="544" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px;margin:0 0 24px;">
<h1 style="margin:0 0 14px;color:#00080f;font-size:27px;line-height:1.25;font-weight:700;">Sua próxima aventura começa aqui</h1>
<p style="margin:0 0 14px;">Olá, {{customer_name}}! Explore a seleção de jogos e produtos digitais da GameAO.</p>
<p style="margin:0 0 14px;">Descubra opções para diferentes estilos de jogo e plataformas.</p>
<p style="margin:0 0 22px;">Acesse a loja e encontre o que combina com você.</p>
<a href="{{site_url}}/shop" style="display:inline-block;background:#cd3d0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:5px;">Explorar a loja</a>
</div>$body16$)
ON CONFLICT (event_key, channel) DO NOTHING;
