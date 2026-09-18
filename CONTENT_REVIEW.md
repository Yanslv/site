# Checklist de aprovação — Ioná Victório / Bendita Micro

Este site (landing page + agendamento + painel de gestão) é um
**protótipo comercial com dados de demonstração**. Nada abaixo deve ser
publicado, nem o painel usado para operação real, sem a confirmação por
escrito da profissional. O banner fixo no topo da página pública, o aviso
na página de agendamento e o badge `DEMO` no painel já avisam disso.

## 1. Marca e posicionamento

- [ ] Confirmar o nome oficial: **Bendita Micro**, **Studio Bendita Micro**
      ou outro.
- [ ] Aprovar a frase de posicionamento usada no hero: *"Sobrancelhas e
      lábios pensados para valorizar a sua beleza."*
- [ ] Aprovar a paleta de cores sugerida (fundo `#FAF6F3`, rosa suave
      `#F0D9D8`, rosa queimado `#B86F78`, vinho `#7E3948`, texto escuro
      `#2B2022`, dourado `#B59668`) — extraída de referências visuais
      públicas, não do arquivo de logo oficial (ainda não recebido).
- [ ] Enviar logo oficial em PNG/SVG (versões clara e escura). O favicon
      atual é um monograma tipográfico provisório ("B"), não a logo final.

## 2. Procedimentos e preços

- [ ] Nano Fios e nanopigmentação de sobrancelhas são o mesmo serviço?
- [ ] Micropigmentação labial e neutralização labial são serviços
      separados? O card de **Neutralização labial** está marcado no site
      como "nomenclatura a confirmar" (nome do serviço em
      `/admin/servicos`).
- [ ] Confirmar a lista final de procedimentos — hoje há 5 serviços demo
      (Nano Fios, Micropigmentação labial, Neutralização labial, Design
      personalizado, Retoque de nanopigmentação), editáveis em
      `/admin/servicos` (nome, slug, descrição, categoria, duração, preço,
      ativo/inativo, imagem, cor, ordem).
- [ ] **Todos os preços e durações exibidos hoje são demonstrativos**
      (ex.: Nano Fios R$ 650,00 / 150 min) — vieram de `PROMPT_CLAUDE_CODE.md`
      e `site_config.json`, não foram confirmados pela clínica. Cada card
      exibe o aviso "Preço demonstrativo"; atualize os valores reais em
      `/admin/servicos` antes de publicar.

## 3. Contato, localização e agendamento

- [ ] Número direto do WhatsApp Business — hoje todo CTA (site e
      confirmação de agendamento) usa apenas o link público
      `https://api.whatsapp.com/message/FBEWS5N5NRM3J1...`. Preencher
      `whatsapp.directNumber` em `src/config/site.ts` assim que confirmado.
- [ ] Endereço completo e bairro.
- [ ] Horários reais de atendimento — o painel (`/admin/configuracoes`)
      está com horário demo (segunda a sexta 09:00–18:00, sábado
      09:00–13:00, domingo fechado). Ajustar para a rotina real da Ioná.
- [ ] Confirmar se "Cuiabá" deve continuar sendo a única localização
      exibida.
- [ ] Decidir se agendamentos públicos devem continuar entrando como
      "pendente" (aguardando confirmação manual) ou se a clínica quer
      ativar confirmação automática (`autoConfirmAppointments` em
      `/admin/configuracoes` — hoje desligado de propósito).

## 4. Textos que precisam de validação da profissional

- [ ] Seção "Sobre Ioná" (`about.text` em `src/config/site.ts`) — texto
      provisório, marcado no site com aviso de revisão.
- [ ] Respostas do FAQ marcadas como provisórias (`faqItems`, campo
      `provisional: true`): avaliação, diferença entre procedimentos,
      micropigmentação labial, cicatrização, cuidados, localização do
      studio.
- [ ] Seção "Especialização" está vazia por padrão, aguardando: nome da
      formação, instituição, ano, certificado e descrição curta.

## 5. Imagens usadas no protótipo

Todas as imagens abaixo vêm de `assets/manifest.csv` (raiz do repositório),
coletadas do perfil público do Instagram e dos destaques, com
`usage_status: reference_only_pending_authorization`. Nenhuma foi
autorizada para publicação comercial.

| Arquivo | Onde é usada no site | Observação |
|---|---|---|
| `asset_010_7a01c215ccc5d581.jpg` | Hero, Sobre Ioná | Retrato profissional da Ioná em ambiente de atendimento |
| `asset_011_b13b5a6a6ca17106.jpg` | Card de micropigmentação labial | Close de lábios pigmentados |
| `asset_013_908c2b520eb77db1.jpg` | Autoridade, seção Nano Fios, card Nano Fios | Ioná e colaboradora no espaço de atendimento; há quadros ao fundo — não identificar terceiros |
| `asset_014_40f1b6f072c38c57.jpg` | Inset "material e precisão" na seção Nano Fios | Contém embalagem da marca "Concept Premium Blade"; usada apenas como referência de ambiente/precisão, **não** como certificação da Bendita Micro |
| `asset_017_c033f5bfe6d5d666.jpg` | Card de neutralização labial, galeria de resultados | Conteúdo específico não verificado — usada apenas como referência visual genérica |
| `asset_020_29dcbf7ac90b69f3.jpg` | Galeria de resultados | Conteúdo específico não verificado |
| `asset_021_ca2f4270aeb78eb6.jpg` | Galeria de resultados | Conteúdo específico não verificado |
| `asset_048_ec290dba35952b5c.jpg` | Galeria de resultados | Conteúdo específico não verificado |
| `asset_052_b3369b65620048a4.jpg` | Galeria de resultados | Conteúdo específico não verificado |
| `asset_056_ecf60c647bfe7def.jpg` | Galeria de resultados | Conteúdo específico não verificado |

Ação necessária antes da publicação, para cada imagem que a clínica quiser
manter:

1. Enviar o arquivo original em alta resolução.
2. Confirmar por escrito a autorização de uso no site.
3. Para imagens de clientes/resultados: confirmar autorização específica da
   cliente retratada e o contexto (é realmente "antes/depois"? de qual
   procedimento? quanto tempo depois?).
4. Substituir a legenda genérica da galeria ("Resultado visual de
   referência" / "Cicatrização — confirmar contexto" / "Imagem sujeita à
   autorização") por uma legenda real e aprovada.

## 6. Painel de gestão — antes de usar com dados reais

- [ ] Trocar a senha de acesso do painel (`ADMIN_PASSWORD` no `.env`, depois
      rodar `npm run db:seed` novamente — ele atualiza a senha do usuário
      existente em vez de duplicar).
- [ ] Todos os agendamentos, clientes e lançamentos financeiros marcados
      com o badge **Demo** no painel foram criados pelo script de seed para
      demonstração — devem ser removidos/ignorados antes do uso real (não
      há uma tela de "limpar dados demo" nesta versão; isso deve ser feito
      diretamente no banco ou tratado como uma melhoria futura).
- [ ] Decidir onde o banco de produção vai rodar (Turso Cloud) e criar as
      credenciais — veja `site/README.md` para o passo a passo. Sem isso, o
      painel não deve ir para produção apontando para o banco local de
      desenvolvimento.
- [ ] Revisar as categorias de entrada/saída do financeiro (serviço, sinal,
      retoque, outro / materiais, aluguel, marketing, taxas, transporte,
      salários-comissões, manutenção, impostos, outro) e confirmar se
      cobrem a realidade do negócio.

## 7. O que **não** foi feito de propósito

- Não foram inventados endereço, bairro, horários, preços, número de
  WhatsApp direto, formação, certificações, avaliações ou depoimentos.
- Nenhuma imagem foi tratada como "antes e depois" oficial.
- A marca do fornecedor "Concept Premium Blade" não foi apresentada como
  certificação da Bendita Micro.
- Não há formulário coletando dados sensíveis ou clínicos — o agendamento
  pede apenas nome, WhatsApp e e-mail opcional.
- Nenhum cliente demo tem nome ou telefone realista — são rotulados
  explicitamente como "Cliente Demonstração N" com números fictícios,
  justamente para não parecerem depoimentos ou pessoas reais.
- "Concluir agendamento" nunca lança receita sozinho — registrar um
  pagamento é sempre uma ação explícita, separada, no painel.
