// Conteúdo complementar das páginas individuais do dicionário.
// Cada verbete precisa explicar o efeito prático do termo e indicar o que o
// leitor encontra nos documentos da venda. O gerador só libera para indexação
// páginas que cumprem o mínimo editorial validado em test/dictionary.test.js.

const GLOSSARY_ENRICHMENT = {
  leiloes: {
    detail: [
      'Num leilão, o preço final nasce da disputa entre participantes. Isso diferencia a modalidade da venda direta, em que o imóvel já tem um preço anunciado e não há competição de lances.',
      'As datas, o valor mínimo, a forma de pagamento e as consequências de uma desistência aparecem no edital. O resultado da disputa não elimina os demais custos até a entrega das chaves.',
    ],
    checks: ['Datas de abertura e encerramento', 'Valor mínimo e regra para novos lances', 'Formas de pagamento e despesas adicionais'],
  },
  leilao_sfi: {
    detail: [
      'SFI significa Sistema de Financiamento Imobiliário. Nessa modalidade, o imóvel dado em alienação fiduciária pode ir a leilão depois que a propriedade é consolidada em nome do credor.',
      'A primeira e a segunda rodada podem ter valores mínimos diferentes. A ficha do imóvel e o edital identificam a rodada atual, as datas e as condições de pagamento aceitas.',
    ],
    checks: ['Rodada em que o imóvel se encontra', 'Data e valor inicial de cada rodada', 'Responsabilidade por ocupação e despesas'],
  },
  licitacao_aberta: {
    detail: [
      'A licitação aberta reúne propostas em um período definido e normalmente acontece pela internet. Os participantes acompanham a disputa conforme as regras publicadas para aquela venda.',
      'Como existe uma única rodada, não há uma segunda data com outro valor mínimo. Horário de encerramento, incremento de lance e critérios de desempate ficam no edital.',
    ],
    checks: ['Horário de início e encerramento', 'Incremento mínimo entre ofertas', 'Critério de desempate e confirmação do resultado'],
  },
  venda_direta: {
    detail: [
      'Na venda direta, o imóvel fica disponível pelo preço informado pela Caixa. Não há disputa: a proposta válida que cumprir primeiro as condições da venda pode ser aceita.',
      'A ausência de leilão não elimina custos como ITBI, registro, eventual reforma ou desocupação. A página do imóvel informa se aceita financiamento, FGTS ou somente recursos próprios.',
    ],
    checks: ['Preço anunciado e prazo da proposta', 'Formas de pagamento aceitas', 'Ocupação e despesas atribuídas ao comprador'],
  },
  modalidade: {
    detail: [
      'A modalidade organiza a forma como o imóvel será vendido. Ela define se haverá disputa, quantas rodadas podem ocorrer e como uma proposta passa a ser considerada vencedora.',
      'Dois imóveis parecidos podem ter cronogramas e obrigações diferentes porque pertencem a modalidades distintas. O nome da modalidade aparece na ficha do imóvel e no edital.',
    ],
    checks: ['Nome da modalidade na ficha', 'Quantidade de rodadas ou período de propostas', 'Regra de pagamento e comissão'],
  },
  leiloeiro: {
    detail: [
      'O leiloeiro oficial organiza a sessão, recebe os lances e registra o resultado. Seu nome, matrícula na Junta Comercial e canal oficial devem aparecer no edital ou na página da disputa.',
      'Quando há comissão, o edital informa o percentual, o prazo e a forma de pagamento. Esse valor costuma ser separado do lance e entra na conta total da compra.',
    ],
    checks: ['Nome e matrícula na Junta Comercial', 'Endereço oficial da plataforma de lances', 'Percentual e instruções da comissão'],
  },
  imovel_retomado: {
    detail: [
      'O imóvel retomado passou para o credor depois do descumprimento do financiamento anterior. Isso explica por que ele aparece em leilão ou venda direta, mas não informa sozinho seu estado de conservação.',
      'Retomado também não significa desocupado. A situação de ocupação, a possibilidade de visita e a responsabilidade por despesas precisam ser lidas separadamente na ficha e no edital.',
    ],
    checks: ['Situação de ocupação informada', 'Possibilidade de visita e estado de conservação', 'Débitos e despesas atribuídos a cada parte'],
  },
  alienacao_fiduciaria: {
    detail: [
      'Na alienação fiduciária, o imóvel funciona como garantia do financiamento. O comprador usa o bem, mas a propriedade fiduciária permanece com o credor até a quitação da dívida.',
      'Se o contrato não é pago, a propriedade pode ser consolidada em nome do credor e o imóvel pode seguir para leilão. A matrícula registra os atos que formalizam esse caminho.',
    ],
    checks: ['Registro da garantia na matrícula', 'Averbação da consolidação da propriedade', 'Datas e regras dos leilões posteriores'],
  },

  valor_inicial: {
    detail: [
      'O valor inicial é o piso da disputa naquela rodada. Ele não representa automaticamente o custo final, porque outros participantes podem elevar o lance e existem despesas pagas fora da plataforma.',
      'O mesmo imóvel pode apresentar outro valor inicial em uma rodada posterior. A página da venda precisa ser conferida perto da data do evento para evitar usar um valor de etapa anterior.',
    ],
    checks: ['Rodada correspondente ao valor', 'Data de validade da informação', 'Comissão, impostos e demais valores fora do lance'],
  },
  valor_avaliacao: {
    detail: [
      'O valor de avaliação é uma estimativa técnica usada como referência pela instituição. Ele pode ter sido calculado antes da venda e não acompanha necessariamente o preço pedido em anúncios atuais da região.',
      'O desconto divulgado costuma comparar o valor inicial com essa avaliação. Para entender a conta inteira, ainda entram conservação, ocupação, impostos, registro e outros custos do imóvel.',
    ],
    checks: ['Data da avaliação', 'Diferença entre avaliação e valor inicial', 'Condição atual do imóvel e preços comparáveis'],
  },
  desconto: {
    detail: [
      'O desconto exibido é uma relação matemática entre o valor de avaliação e o valor inicial. Ele não mede sozinho a economia real da compra nem incorpora as despesas posteriores ao lance.',
      'Um percentual alto pode coexistir com reforma, desocupação ou pagamento somente à vista. A comparação mais útil considera o total até a chave e imóveis semelhantes na mesma região.',
    ],
    checks: ['Base usada para calcular o percentual', 'Total estimado até a chave', 'Preço e condição de imóveis semelhantes'],
  },
  imoveis_parecidos: {
    detail: [
      'Imóveis parecidos ajudam a criar uma referência de mercado. A comparação fica mais consistente quando localização, metragem, quantidade de quartos, conservação e características do condomínio são próximas.',
      'Preço de anúncio não é o mesmo que preço de venda concluída. Por isso, a amostra serve como estimativa e precisa deixar claro quantos imóveis foram encontrados e quão semelhantes eles são.',
    ],
    checks: ['Distância e características dos comparáveis', 'Quantidade e data dos anúncios', 'Diferenças de conservação, vaga e condomínio'],
  },
  confianca_estimativa: {
    detail: [
      'A confiança mostra a qualidade da amostra usada para estimar o preço de mercado. Muitos anúncios próximos e semelhantes formam uma base melhor do que poucos imóveis com características diferentes.',
      'Uma confiança baixa não transforma a estimativa em erro; ela sinaliza maior incerteza. Nesse caso, a faixa de valores é mais informativa do que um único número apresentado como exato.',
    ],
    checks: ['Quantidade de imóveis comparados', 'Semelhança de metragem e características', 'Dispersão dos preços encontrados'],
  },
  rodada: {
    detail: [
      'Cada rodada corresponde a uma oportunidade de venda com data e valor mínimo próprios. Quando a primeira termina sem comprador, o edital pode prever uma segunda rodada para o mesmo imóvel.',
      'Mudar de rodada não altera apenas a data. O piso da disputa e algumas condições podem ser diferentes, por isso a informação precisa ser lida no contexto da etapa atual.',
    ],
    checks: ['Número da rodada atual', 'Data e horário da disputa', 'Valor mínimo e condições específicas da etapa'],
  },
  primeira_rodada: {
    detail: [
      'A primeira rodada abre o cronograma do Leilão SFI. O valor mínimo costuma estar relacionado ao valor de avaliação indicado nos documentos da venda.',
      'Se não houver lance aceito, o imóvel pode seguir para a segunda rodada na data prevista. Participação, pagamento e despesas continuam sujeitos ao edital daquele imóvel.',
    ],
    checks: ['Data da primeira disputa', 'Valor mínimo publicado', 'Previsão e data de uma eventual segunda rodada'],
  },
  segunda_rodada: {
    detail: [
      'A segunda rodada ocorre quando a etapa anterior termina sem venda. Seu valor mínimo segue a composição prevista para a dívida e as despesas do contrato, por isso não é uma redução fixa.',
      'O preço pode ficar abaixo da avaliação, mas a conta ainda inclui comissão quando houver, tributos, registro, ocupação e conservação. Esses itens permanecem fora do percentual de desconto.',
    ],
    checks: ['Confirmação de que a primeira rodada não vendeu', 'Valor mínimo específico da segunda rodada', 'Direito de preferência e custos adicionais'],
  },
  rodada_unica: {
    detail: [
      'Rodada única significa que a disputa tem apenas uma etapa prevista. Encerrado o período sem proposta aceita, não existe uma segunda rodada automática com outro valor mínimo.',
      'O imóvel pode aparecer novamente em uma venda futura, mas isso será um novo evento. Datas, valores e condições válidos são os que constam no edital atual.',
    ],
    checks: ['Data e horário da única disputa', 'Valor inicial e incremento de lance', 'Regra para o encerramento sem vencedor'],
  },
  lance: {
    detail: [
      'O lance é uma oferta vinculada às regras da disputa. Quando aceito como vencedor, ele inicia obrigações de pagamento nos prazos definidos pelo edital.',
      'O valor digitado não costuma incluir comissão, ITBI, cartório ou outras despesas. Por isso, o limite financeiro da compra considera mais do que o número enviado na plataforma.',
    ],
    checks: ['Valor mínimo e incremento permitido', 'Prazo de pagamento após o resultado', 'Custos cobrados além do lance'],
  },
  encerrado: {
    detail: [
      'Encerrado informa que o período de propostas ou lances terminou. O status, sozinho, não confirma se houve comprador, porque o resultado ainda pode passar por validação ou homologação.',
      'Um imóvel não vendido pode reaparecer em outra modalidade ou data. A consulta pelo número do imóvel ajuda a distinguir a venda encerrada de uma oferta posterior.',
    ],
    checks: ['Resultado ou ata da disputa', 'Situação da homologação', 'Nova oferta vinculada ao mesmo número de imóvel'],
  },
  leiloes_anteriores: {
    detail: [
      'O histórico mostra quantas tentativas de venda terminaram sem arrematação. Ele ajuda a entender a trajetória do imóvel, mas não explica sozinho o motivo de cada evento ter ficado sem comprador.',
      'Preço, ocupação, formas de pagamento e divulgação podem mudar entre eventos. A comparação precisa usar os documentos e valores de cada venda, não apenas a contagem acumulada.',
    ],
    checks: ['Datas e modalidades dos eventos anteriores', 'Valores mínimos usados em cada tentativa', 'Mudanças na ocupação e nas formas de pagamento'],
  },

  ocupado: {
    detail: [
      'O status ocupado indica que há informação de alguém no imóvel. A entrega das chaves pode exigir acordo com o ocupante ou medida judicial, o que acrescenta prazo e custo à compra.',
      'A ficha não identifica necessariamente quem ocupa o bem nem permite visita interna. O edital informa como a responsabilidade pela desocupação é distribuída entre vendedor e comprador.',
    ],
    checks: ['Responsável pela desocupação', 'Possibilidade de visita ao imóvel', 'Reserva de prazo e custo até a posse'],
  },
  desocupado: {
    detail: [
      'Desocupado é a situação informada pelo vendedor na data do anúncio. Ela reduz uma incerteza importante, mas não substitui a verificação do estado físico nem garante entrega imediata das chaves.',
      'Pagamento, contrato e registro ainda seguem seus próprios prazos. A posse efetiva acontece dentro do fluxo previsto nos documentos da venda.',
    ],
    checks: ['Data da informação de desocupação', 'Possibilidade de visita ou vistoria', 'Prazo previsto para documento e entrega das chaves'],
  },
  ocupacao_nao_informada: {
    detail: [
      'Quando a ocupação não é informada, a ficha não oferece base para afirmar se o imóvel está livre. Essa incerteza precisa entrar na estimativa de prazo e custo até a posse.',
      'Também pode não haver visita interna. Fotos externas, matrícula, edital e informações do condomínio ajudam a organizar o que é conhecido e o que continua sem confirmação.',
    ],
    checks: ['Trecho do edital sobre responsabilidade pela posse', 'Disponibilidade de visita', 'Margem financeira para possível desocupação'],
  },
  estado_em_que_se_encontra: {
    detail: [
      'A expressão informa que o vendedor não promete entregar o imóvel reformado. Acabamentos, instalações e conservação podem exigir gastos depois da compra.',
      'Quando não há visita interna, a estimativa de reforma fica mais incerta. Fotos, idade do prédio, informações do condomínio e comparação com unidades semelhantes ajudam a construir uma faixa de custo.',
    ],
    checks: ['Existência de visita ou fotos internas', 'Condições descritas no edital', 'Reserva para reparos e itens não visíveis'],
  },
  imissao_na_posse: {
    detail: [
      'A imissão na posse é usada para que o novo proprietário obtenha a posse de um imóvel quando ela não é entregue espontaneamente. O pedido é feito ao Judiciário e tem rito próprio.',
      'Prazo e custo não são iguais em todos os casos. Situação do ocupante, documentos disponíveis e andamento do processo influenciam o caminho até a entrada no imóvel.',
    ],
    checks: ['Documento que comprova a aquisição', 'Informações disponíveis sobre a ocupação', 'Custos e tempo reservados para obtenção da posse'],
  },
  direito_preferencia: {
    detail: [
      'O direito de preferência permite ao antigo devedor adquirir o imóvel nas condições previstas em lei antes de determinado marco do procedimento. No Leilão SFI, esse prazo se relaciona à segunda rodada.',
      'O exercício exige o pagamento dos valores indicados para dívida e despesas. O edital e a legislação aplicável mostram o momento limite e os efeitos sobre a venda.',
    ],
    checks: ['Modalidade e cronologia do leilão', 'Prazo indicado para exercer a preferência', 'Valores exigidos para a aquisição preferencial'],
  },

  fgts: {
    detail: [
      'O uso do FGTS exige que a venda aceite essa forma de pagamento e que comprador e imóvel atendam às regras do fundo. A indicação na ficha é necessária, mas a operação ainda passa por validação.',
      'O saldo utilizado compõe o pagamento do imóvel e não cobre automaticamente comissão, tributos ou cartório. Esses valores precisam de recursos separados quando forem cobrados.',
    ],
    checks: ['Indicação de FGTS na ficha do imóvel', 'Enquadramento do comprador e do imóvel', 'Recursos para despesas que o fundo não cobre'],
  },
  sem_fgts: {
    detail: [
      'Quando a ficha informa que não aceita FGTS, o saldo do fundo não pode ser usado naquela venda. Isso altera a composição dos recursos necessários para pagar o imóvel.',
      'A restrição ao FGTS não responde se há financiamento. As formas disponíveis aparecem separadamente e podem limitar a compra a crédito imobiliário, recursos próprios ou ambos.',
    ],
    checks: ['Formas de pagamento marcadas na ficha', 'Valor disponível em recursos próprios', 'Existência ou não de financiamento'],
  },
  financiamento: {
    detail: [
      'Aceitar financiamento significa permitir que parte do preço venha de crédito imobiliário. A aprovação do crédito, a renda e a documentação continuam sendo avaliadas pela instituição financeira.',
      'O prazo do leilão pode ser mais curto que o fluxo de uma compra tradicional. A ficha e o edital indicam a parcela à vista, o prazo e a linha de crédito admitida.',
    ],
    checks: ['Indicação expressa de financiamento', 'Parcela e prazo para recursos próprios', 'Condições de aprovação do crédito'],
  },
  sbpe: {
    detail: [
      'O SBPE reúne linhas de financiamento imobiliário abastecidas principalmente pela poupança. Quando aparece na ficha, identifica o tipo de crédito que pode compor o pagamento.',
      'A menção ao SBPE não equivale a crédito aprovado. Valor financiável, prazo, juros e capacidade de pagamento são definidos na avaliação bancária do comprador.',
    ],
    checks: ['Linha de crédito indicada na venda', 'Valor máximo que pode ser financiado', 'Aprovação cadastral e de renda'],
  },
  so_a_vista: {
    detail: [
      'Só à vista significa que o preço precisa ser pago com recursos próprios no prazo da venda. Financiamento e FGTS não entram na composição daquele imóvel.',
      'O dinheiro necessário inclui mais do que o lance ou preço anunciado. Comissão quando houver, ITBI, registro e outros custos seguem os prazos próprios de cada etapa.',
    ],
    checks: ['Prazo exato para pagamento', 'Origem dos recursos disponíveis', 'Reserva para despesas além do preço'],
  },
  recursos_proprios: {
    detail: [
      'Recursos próprios são valores disponíveis fora de financiamento e FGTS. Eles podem pagar todo o imóvel ou apenas a parcela que a venda exige à vista.',
      'A mesma reserva também pode precisar cobrir comissão, impostos, cartório, reforma e desocupação. Separar cada item evita tratar todo o dinheiro disponível como lance.',
    ],
    checks: ['Parcela do preço que precisa ser paga à vista', 'Datas de vencimento de cada despesa', 'Reserva que permanece depois da compra'],
  },
  prazo_a_vista: {
    detail: [
      'Esse prazo define quando a parte não financiada precisa chegar ao vendedor. A contagem pode começar na homologação ou em outro marco indicado nos documentos da venda.',
      'Perder o prazo pode gerar consequências previstas no edital. Data inicial, forma de pagamento e comprovação precisam ser lidas junto com a regra da modalidade.',
    ],
    checks: ['Evento que inicia a contagem', 'Quantidade de dias e data final', 'Canal oficial para pagamento e comprovação'],
  },

  total_ate_a_chave: {
    detail: [
      'O total até a chave soma o preço do imóvel aos gastos necessários para registrar a compra e obter a posse. Ele transforma custos espalhados em uma única visão financeira.',
      'A composição pode incluir comissão, ITBI, cartório, débitos atribuídos ao comprador, reforma e desocupação. Valores incertos aparecem como estimativas separadas, não como cobranças confirmadas.',
    ],
    checks: ['Preço ou lance vencedor', 'Tributos, comissão e cartório', 'Estimativas de reforma, ocupação e prazo'],
  },
  itbi: {
    detail: [
      'O ITBI é municipal e incide na transmissão do imóvel entre pessoas vivas. Alíquota, base de cálculo, guia e vencimento seguem as regras da prefeitura onde o bem está localizado.',
      'O imposto normalmente é necessário para levar o título ao registro de imóveis. Como as regras variam por município, uma porcentagem genérica serve apenas como aproximação inicial.',
    ],
    checks: ['Alíquota e base de cálculo do município', 'Prazo e canal para emitir a guia', 'Valor considerado pelo cartório para registrar a compra'],
  },
  comissao_leiloeiro: {
    detail: [
      'A comissão remunera o leiloeiro pela condução da disputa. Quando prevista, é cobrada além do lance e não costuma integrar o valor usado para financiamento.',
      'Percentual, prazo, favorecido e conta de pagamento precisam coincidir com o edital e os canais oficiais. Venda direta não utiliza comissão de leiloeiro.',
    ],
    checks: ['Percentual aplicado ao lance', 'Prazo depois do resultado', 'Favorecido e instruções oficiais de pagamento'],
  },
  registro_cartorio: {
    detail: [
      'O registro é o ato que coloca a aquisição na matrícula do imóvel. Assinar ou pagar o contrato não substitui essa etapa para formalizar a mudança de proprietário.',
      'O custo segue a tabela de emolumentos do estado e pode variar conforme o valor do negócio. O cartório competente é o da circunscrição onde o imóvel está situado.',
    ],
    checks: ['Cartório responsável pela matrícula', 'Título entregue para registro', 'Tabela estadual e documentos exigidos'],
  },
  emolumentos: {
    detail: [
      'Emolumentos são os valores cobrados pelos atos praticados no cartório, como certidões e registro da compra. Eles seguem tabelas estaduais e não são definidos livremente pelo atendente.',
      'O orçamento muda conforme os atos necessários e o valor declarado no título. ITBI e emolumentos são despesas diferentes, ainda que apareçam na mesma etapa da transferência.',
    ],
    checks: ['Tabela vigente no estado', 'Atos incluídos no orçamento', 'Separação entre cartório e imposto municipal'],
  },
  desocupacao: {
    detail: [
      'Desocupação é o caminho até o imóvel ficar livre para quem comprou. Pode ocorrer por entrega espontânea, acordo ou processo judicial, conforme a situação encontrada.',
      'Como prazo e custo não são fixos, a conta usa uma reserva identificada como estimativa. O edital mostra se essa responsabilidade fica com o comprador ou com o vendedor.',
    ],
    checks: ['Responsável indicado no edital', 'Informações conhecidas sobre o ocupante', 'Reserva estimada de tempo e dinheiro'],
  },
  reforma: {
    detail: [
      'A reforma reúne os gastos para deixar o imóvel nas condições desejadas de uso. Pode envolver reparos, instalações, acabamento e itens que não aparecem nas fotos do anúncio.',
      'Sem visita interna, o orçamento tem maior incerteza. A estimativa pode usar metragem, idade, padrão do prédio e estado de unidades semelhantes, sempre com uma margem identificada.',
    ],
    checks: ['Condições visíveis e possibilidade de visita', 'Metragem e padrão construtivo', 'Margem para problemas não aparentes'],
  },
  iptu: {
    detail: [
      'O IPTU é cobrado anualmente pelo município e acompanha o cadastro fiscal do imóvel. Depois da compra, as parcelas futuras passam a fazer parte do custo regular de propriedade.',
      'Débitos anteriores exigem leitura das regras da venda e consulta ao município. A inscrição imobiliária permite localizar lançamentos, vencimentos e situação cadastral.',
    ],
    checks: ['Inscrição do imóvel na prefeitura', 'Débitos e parcelas do ano corrente', 'Regra do edital sobre valores anteriores'],
  },
  condominio: {
    detail: [
      'Condomínio é a contribuição para despesas comuns do edifício ou loteamento. Além da cota mensal, podem existir chamadas extras aprovadas pelos moradores.',
      'Valores antigos e responsabilidade pelo pagamento precisam ser conferidos no edital e, quando possível, com a administração. A dívida condominial pode interferir na conta até a chave.',
    ],
    checks: ['Valor da cota mensal', 'Existência de débitos ou rateios extras', 'Responsável pelas parcelas anteriores à compra'],
  },
  quem_paga_despesas: {
    detail: [
      'Essa regra distribui custos entre vendedor e comprador. Ela pode tratar de condomínio, impostos, taxas e despesas relacionadas à ocupação do imóvel.',
      'A divisão não é idêntica em todas as vendas. O texto do edital prevalece sobre resumos, anúncios e explicações gerais quando houver diferença entre as informações.',
    ],
    checks: ['Cláusula do edital para impostos', 'Cláusula para condomínio e ocupação', 'Data usada para separar despesas antigas e futuras'],
  },

  edital: {
    detail: [
      'O edital reúne as condições oficiais da venda. Ele identifica o imóvel, a modalidade, as datas, o pagamento, as penalidades e a distribuição de despesas.',
      'A ficha do portal funciona como resumo, mas o edital contém a regra completa. Guardar a versão usada na participação também ajuda a registrar quais condições estavam publicadas.',
    ],
    checks: ['Identificação exata do imóvel e da venda', 'Datas, pagamentos e penalidades', 'Ocupação, débitos e responsabilidades'],
  },
  matricula: {
    detail: [
      'A matrícula concentra o histórico registral do imóvel. Nela aparecem proprietários, descrição, alienações, penhoras, indisponibilidades e outros atos levados ao cartório.',
      'Uma cópia antiga pode não mostrar registros recentes. A data de emissão e as averbações posteriores importam para entender a situação documentada antes da compra.',
    ],
    checks: ['Número e cartório da matrícula', 'Data de emissão da certidão', 'Proprietário e atos registrados mais recentes'],
  },
  cartorio_oficio: {
    detail: [
      'O cartório de registro de imóveis mantém a matrícula e formaliza mudanças na propriedade. Cidades maiores podem ser divididas em circunscrições, chamadas também de ofícios.',
      'O imóvel só pode ser registrado no cartório competente para sua localização. Nome, número do ofício e matrícula aparecem nos documentos da venda.',
    ],
    checks: ['Nome e número do ofício', 'Circunscrição correspondente ao endereço', 'Número correto da matrícula'],
  },
  inscricao_iptu: {
    detail: [
      'A inscrição do IPTU identifica o imóvel no sistema da prefeitura. Ela pode ter nomes como inscrição imobiliária, indicação fiscal ou cadastro municipal.',
      'Com esse número, é possível localizar carnês, valores lançados e eventuais débitos conforme o serviço oferecido pelo município. Ele não substitui o número da matrícula no cartório.',
    ],
    checks: ['Número completo no cadastro municipal', 'Endereço vinculado à inscrição', 'Situação de parcelas e débitos na prefeitura'],
  },
  numero_imovel: {
    detail: [
      'O número do imóvel é o identificador usado pela Caixa para organizar o anúncio. Ele ajuda a localizar novamente a ficha mesmo quando endereço ou modalidade mudam de apresentação.',
      'Esse código não é matrícula, inscrição do IPTU nem número da licitação. Cada identificador pertence a uma fonte diferente e cumpre uma função própria.',
    ],
    checks: ['Código completo informado pela Caixa', 'Correspondência com endereço e fotos', 'Vinculação com o edital da venda atual'],
  },
  numero_licitacao: {
    detail: [
      'O número da licitação identifica o evento de venda, que pode reunir vários imóveis. Ele conecta edital, datas, comunicados e resultado publicados para aquela disputa.',
      'Um mesmo imóvel pode aparecer em outra licitação no futuro. Por isso, o número do imóvel e o número da licitação precisam ser usados juntos ao conferir os documentos.',
    ],
    checks: ['Número e ano da licitação', 'Item ou lote do imóvel', 'Edital e comunicados vinculados ao evento'],
  },
  item_lote: {
    detail: [
      'Item ou lote aponta a posição do imóvel dentro de uma venda com várias ofertas. Ele evita confundir bens que compartilham o mesmo edital e as mesmas datas.',
      'O número precisa coincidir na ficha, no edital e na plataforma de lances. Endereço e número do imóvel completam a identificação.',
    ],
    checks: ['Número do item ou lote', 'Endereço e número do imóvel associados', 'Correspondência na plataforma de disputa'],
  },
  processo: {
    detail: [
      'O número do processo permite localizar um procedimento judicial relacionado ao imóvel quando essa informação é pública. Ele identifica tribunal, unidade e sequência do caso.',
      'A existência de processo não explica sozinha seu conteúdo ou efeito sobre a venda. Documentos, movimentações e decisões disponíveis fornecem o contexto registrado.',
    ],
    checks: ['Número completo e tribunal competente', 'Partes e assunto cadastrados', 'Movimentações e decisões mais recentes disponíveis'],
  },
  credor: {
    detail: [
      'Credor é quem possui o direito de receber a dívida garantida pelo imóvel. Em operações da Caixa, a instituição pode ocupar essa posição e conduzir a retomada prevista no contrato.',
      'O credor não é necessariamente o ocupante nem o antigo dono. A matrícula e os documentos da venda mostram os papéis registrados no procedimento.',
    ],
    checks: ['Credor identificado no contrato ou matrícula', 'Garantia vinculada à dívida', 'Relação com o vendedor indicado no edital'],
  },
  antigo_dono: {
    detail: [
      'Antigo dono é a pessoa que figurava como proprietária ou devedora antes da retomada. A expressão não informa se ela ainda ocupa o imóvel.',
      'Propriedade anterior, ocupação atual e direito de preferência são assuntos distintos. Matrícula, ficha e cronologia da venda ajudam a separar cada situação.',
    ],
    checks: ['Titular anterior indicado na matrícula', 'Situação de ocupação informada', 'Prazos de preferência previstos para a modalidade'],
  },

  arrematar: {
    detail: [
      'Arrematar é ter o lance aceito como vencedor em uma disputa. A partir do resultado, começam os prazos de comissão, pagamento e demais atos definidos no edital.',
      'A arrematação não significa receber a chave no mesmo momento. Homologação, contrato, registro e posse ainda formam etapas próprias do caminho.',
    ],
    checks: ['Confirmação oficial do lance vencedor', 'Prazos imediatos de comissão e pagamento', 'Etapas posteriores até registro e posse'],
  },
  homologacao: {
    detail: [
      'Homologação é a confirmação do resultado pela entidade responsável pela venda. Ela formaliza o vencedor depois das verificações previstas para a modalidade.',
      'Alguns prazos começam a partir dessa confirmação, não do momento do último lance. O comunicado ou sistema oficial informa a data usada na contagem.',
    ],
    checks: ['Data da confirmação do resultado', 'Prazos que começam na homologação', 'Documento ou comunicado que registra o ato'],
  },
  contrato_caixa: {
    detail: [
      'O contrato formaliza a compra entre a Caixa e o adquirente depois do cumprimento das condições da venda. Ele descreve imóvel, preço, partes e forma de pagamento.',
      'Para alterar a propriedade na matrícula, o título precisa seguir ao cartório competente. Assinatura, pagamento e registro são marcos diferentes do processo.',
    ],
    checks: ['Dados do imóvel e das partes', 'Preço e forma de pagamento registrados', 'Procedimento para envio ao cartório'],
  },
  prazo_documento_registrado: {
    detail: [
      'Esse prazo acompanha o período entre a apresentação do título e a conclusão do registro. Exigências documentais do cartório podem interromper ou ampliar o tempo inicialmente estimado.',
      'O documento registrado comprova a mudança lançada na matrícula. Ele é diferente do contrato apenas assinado e do protocolo entregue ao cartório.',
    ],
    checks: ['Data do protocolo no cartório', 'Existência de exigências pendentes', 'Previsão para retirada do título e matrícula atualizada'],
  },
  pagamento_comissao: {
    detail: [
      'O pagamento da comissão costuma ocorrer logo após o resultado do leilão e em canal separado do preço do imóvel. As instruções precisam vir do edital ou do leiloeiro oficial identificado.',
      'Comprovante, favorecido e prazo fazem parte dos documentos da compra. A comissão não se aplica quando a modalidade é venda direta.',
    ],
    checks: ['Percentual e valor calculado', 'Prazo contado a partir do resultado', 'Favorecido e dados publicados em canal oficial'],
  },
};

module.exports = { GLOSSARY_ENRICHMENT };
