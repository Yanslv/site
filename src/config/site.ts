// Fonte única de verdade para textos, links e mídia do site.
// Baseado em PRD.md, site_config.json e research/analise_bendita_achados_parciais.txt.
// Nenhum dado marcado como "pendente" abaixo deve ser tratado como fato confirmado.

export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type AuthorizationStatus =
  | "reference_only_pending_authorization";

export const IMAGE_USAGE_STATUS: AuthorizationStatus =
  "reference_only_pending_authorization";

export const brand = {
  name: "Bendita Micro",
  professional: "Ioná Victório",
  displayName: "Bendita Micro | por Ioná Victório",
  city: "Cuiabá",
  instagramUrl: "https://www.instagram.com/benditamicrobyionavictorio/",
  instagramHandle: "@benditamicrobyionavictorio",
  bioSiteUrl: "https://bio.site/IonaVictorio",
};

// Paleta sugerida em site_config.json (status: suggested_from_public_visual_references).
// Deve ser confirmada com a profissional antes da publicação final.
export const theme = {
  background: "#FAF6F3",
  softPink: "#F0D9D8",
  burntRose: "#B86F78",
  wine: "#7E3948",
  ink: "#2B2022",
  gold: "#B59668",
};

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------
// O único canal confirmado é o link público de "Dúvidas e Agendamentos" do
// Bio Site. O número direto do WhatsApp Business ainda não foi confirmado.
// Quando ele for informado pela clínica, preencha `directNumber` abaixo
// (formato internacional, ex: "5565999999999") para que os CTAs passem a
// abrir automaticamente uma conversa com mensagem contextual pré-preenchida
// via wa.me. Até lá, todos os CTAs usam o link público confirmado e exibem a
// mensagem sugerida como texto de apoio, para a visitante copiar se o
// preenchimento automático não funcionar nesse link.
export const whatsapp = {
  publicLink:
    "https://api.whatsapp.com/message/FBEWS5N5NRM3J1?autoload=1&app_absent=0",
  directNumber: null as string | null,
  messages: {
    general:
      "Olá! Vi o site da Bendita Micro e gostaria de saber mais sobre os procedimentos e o agendamento.",
    nanoFios:
      "Olá! Vi as informações sobre Nano Fios e gostaria de entender como funciona a avaliação.",
    labial:
      "Olá! Gostaria de saber mais sobre micropigmentação labial e como funciona a avaliação.",
    neutralizacao:
      "Olá! Gostaria de saber mais sobre neutralização labial e como funciona a avaliação.",
    design:
      "Olá! Gostaria de saber mais sobre design personalizado de sobrancelhas.",
  },
};

export type WhatsappMessageKey = keyof typeof whatsapp.messages;

export function getWhatsappUrl(messageKey: WhatsappMessageKey = "general"): string {
  return getWhatsappUrlWithMessage(whatsapp.messages[messageKey]);
}

/**
 * Igual a `getWhatsappUrl`, mas com uma mensagem dinâmica (ex.: já preenchida
 * com procedimento/data/protocolo de um agendamento). Enquanto não houver um
 * número direto do WhatsApp Business configurado, cai para o link público —
 * que não prefixa a mensagem, mas mantém o CTA funcionando.
 */
export function getWhatsappUrlWithMessage(message: string): string {
  if (whatsapp.directNumber) {
    const digits = whatsapp.directNumber.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }
  return whatsapp.publicLink;
}

// ---------------------------------------------------------------------------
// Imagens verificadas (descritas manualmente em research/analise_bendita_achados_parciais.txt)
// ---------------------------------------------------------------------------
export const images = {
  portraitAtelier: {
    src: "/assets/asset_010_7a01c215ccc5d581.jpg",
    alt: "Retrato profissional de Ioná Victório em ambiente de atendimento — imagem de referência, sujeita à autorização.",
    width: 1608,
    height: 2144,
  },
  lipsClose: {
    src: "/assets/asset_011_b13b5a6a6ca17106.jpg",
    alt: "Close de lábios com acabamento de pigmentação — imagem de referência, sujeita à autorização.",
    width: 1937,
    height: 1937,
  },
  professionalEnvironment: {
    src: "/assets/asset_013_908c2b520eb77db1.jpg",
    alt: "Ioná Victório no espaço de atendimento do Studio Bendita Micro — imagem de referência, sujeita à autorização.",
    width: 1760,
    height: 2347,
  },
  precisionMaterial: {
    src: "/assets/asset_014_40f1b6f072c38c57.jpg",
    alt: "Material e instrumentos de precisão utilizados no atendimento — imagem de referência de ambiente, não é selo de certificação.",
    width: 1086,
    height: 1086,
  },
} satisfies Record<string, ImageAsset>;

// Imagens adicionais do perfil público, cujo conteúdo específico não foi
// descrito/confirmado. Usadas apenas como referência visual genérica na
// galeria de resultados, nunca associadas a uma alegação de procedimento,
// antes/depois ou cicatrização específica.
export const galleryImages: (ImageAsset & { caption: string })[] = [
  {
    src: "/assets/asset_017_c033f5bfe6d5d666.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1003,
    height: 1003,
    caption: "Resultado visual de referência",
  },
  {
    src: "/assets/asset_020_29dcbf7ac90b69f3.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1003,
    height: 1254,
    caption: "Cicatrização — confirmar contexto",
  },
  {
    src: "/assets/asset_021_ca2f4270aeb78eb6.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1980,
    height: 1980,
    caption: "Imagem sujeita à autorização",
  },
  {
    src: "/assets/asset_048_ec290dba35952b5c.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1760,
    height: 2347,
    caption: "Resultado visual de referência",
  },
  {
    src: "/assets/asset_052_b3369b65620048a4.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1440,
    height: 1920,
    caption: "Cicatrização — confirmar contexto",
  },
  {
    src: "/assets/asset_056_ecf60c647bfe7def.jpg",
    alt: "Imagem de referência do perfil público da Bendita Micro — conteúdo não verificado.",
    width: 1682,
    height: 2142,
    caption: "Imagem sujeita à autorização",
  },
];

// ---------------------------------------------------------------------------
// Navegação
// ---------------------------------------------------------------------------
export const navLinks = [
  { label: "Procedimentos", href: "#procedimentos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Resultados", href: "#resultados" },
  { label: "Especialização", href: "#especializacao" },
  { label: "Dúvidas", href: "#faq" },
];

// ---------------------------------------------------------------------------
// Aviso de demonstração (obrigatório enquanto o conteúdo não for aprovado)
// ---------------------------------------------------------------------------
export const demoNotice =
  "Demonstração visual — imagens e conteúdos dependem de validação e autorização antes da publicação.";

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
export const hero = {
  eyebrow: "Nanopigmentação personalizada em Cuiabá",
  headline: "Sobrancelhas e lábios pensados para valorizar a sua beleza.",
  description:
    "Conheça os procedimentos da Bendita Micro e tire suas dúvidas com a Ioná antes de agendar.",
  primaryCta: "Tirar dúvidas e agendar",
  secondaryCta: "Conhecer os procedimentos",
  image: images.portraitAtelier,
};

// ---------------------------------------------------------------------------
// Autoridade
// ---------------------------------------------------------------------------
export const authority = {
  name: brand.professional,
  role: "Especialista em nanopigmentação personalizada de sobrancelhas",
  focus: "Foco em sobrancelhas e lábios",
  location: `Atendimento em ${brand.city}`,
  note:
    "Formação e certificações completas serão publicadas nesta seção após validação dos documentos oficiais pela profissional.",
};

// ---------------------------------------------------------------------------
// Procedimento principal — Nano Fios
// ---------------------------------------------------------------------------
export const nanoFiosFeature = {
  title: "Nano Fios para sobrancelhas mais definidas e personalizadas",
  description:
    "Uma técnica personalizada para valorizar o desenho e a expressão das sobrancelhas, respeitando as características de cada pessoa.",
  cta: "Quero entender o Nano Fios",
  image: images.professionalEnvironment,
  precisionImage: images.precisionMaterial,
  precisionNote:
    "Referência visual de material e precisão utilizados no atendimento. Não representa uma certificação da Bendita Micro.",
};

// A listagem de procedimentos (nome, descrição, preço, duração, imagem) agora
// vem do banco de dados (tabela `services`, editável em /admin/servicos) em
// vez deste arquivo estático — veja `src/server/services.ts` e
// `src/components/ProcedureGrid.tsx`.

// ---------------------------------------------------------------------------
// Como funciona
// ---------------------------------------------------------------------------
export const howItWorksSteps = [
  {
    title: "Você chama pelo WhatsApp",
    description: "Conte o que deseja melhorar e envie suas dúvidas.",
  },
  {
    title: "A Ioná entende seu objetivo",
    description: "A avaliação profissional define as possibilidades para o seu caso.",
  },
  {
    title: "Você recebe as orientações",
    description:
      "Horário, preparo e cuidados são combinados diretamente com a profissional.",
  },
  {
    title: "O atendimento é agendado",
    description: "Vocês confirmam juntas os detalhes finais do agendamento.",
  },
];

export const howItWorksDisclaimer =
  "A avaliação profissional orienta o procedimento indicado para cada pessoa. Este site não realiza diagnóstico.";

// ---------------------------------------------------------------------------
// Resultados e cicatrização
// ---------------------------------------------------------------------------
export const resultsGalleryNotice =
  "As imagens desta galeria são referências públicas do perfil da Bendita Micro, ainda sem autorização confirmada de uso. Nenhuma é apresentada como \"antes e depois\" oficial.";

// ---------------------------------------------------------------------------
// Especialização
// ---------------------------------------------------------------------------
export const specialization = {
  title: "Técnica, atualização e cuidado em cada detalhe",
  pendingMessage:
    "A formação e as especializações da Ioná serão apresentadas aqui após validação dos certificados e informações oficiais.",
  // Estrutura pronta para receber os itens reais assim que forem confirmados.
  placeholderFields: ["Nome da formação", "Instituição", "Ano", "Certificado", "Descrição curta"],
};

// ---------------------------------------------------------------------------
// Sobre Ioná
// ---------------------------------------------------------------------------
// TEXTO PROVISÓRIO — deve ser validado pela Ioná Victório antes da publicação.
export const about = {
  title: "Sobre Ioná",
  text:
    "Eu sou Ioná Victório, especialista em nanopigmentação personalizada de sobrancelhas e apaixonada por realçar a beleza de cada pessoa com técnica e cuidado.",
  image: images.portraitAtelier,
  reviewNote:
    "Texto provisório — aguardando validação da profissional antes da publicação.",
};

// ---------------------------------------------------------------------------
// Localização e contato
// ---------------------------------------------------------------------------
export const location = {
  city: brand.city,
  notice: "Endereço e horários serão confirmados pela profissional.",
  instagramUrl: brand.instagramUrl,
  instagramHandle: brand.instagramHandle,
};

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
export type FaqItem = {
  question: string;
  answer: string;
  provisional?: boolean;
};

export const faqItems: FaqItem[] = [
  {
    question: "Como funciona a avaliação?",
    answer:
      "Você entra em contato pelo WhatsApp, conta o que deseja melhorar e a Ioná avalia as possibilidades para o seu caso antes de indicar um procedimento.",
  },
  {
    question: "Qual a diferença entre Nano Fios e design personalizado?",
    answer:
      "Os detalhes técnicos que diferenciam cada serviço ainda precisam ser confirmados pela profissional. Fale com a Ioná pelo WhatsApp para uma explicação específica para o seu caso.",
    provisional: true,
  },
  {
    question: "Como funciona a micropigmentação labial?",
    answer:
      "O procedimento é avaliado individualmente. Etapas, duração e cuidados oficiais serão detalhados aqui após confirmação da profissional.",
    provisional: true,
  },
  {
    question: "Como é o período de cicatrização?",
    answer:
      "O tempo e as características da cicatrização variam de pessoa para pessoa e serão explicados pela Ioná durante a avaliação. Essa informação ainda precisa ser confirmada para publicação.",
    provisional: true,
  },
  {
    question: "Quais cuidados são necessários?",
    answer:
      "As orientações de cuidados antes e depois do procedimento serão informadas diretamente pela profissional e publicadas aqui após validação.",
    provisional: true,
  },
  {
    question: "Onde fica o Studio Bendita Micro?",
    answer:
      `O atendimento acontece em ${brand.city}. O endereço completo ainda não foi confirmado e será publicado assim que a profissional validar essa informação.`,
    provisional: true,
  },
  {
    question: "Como faço para agendar?",
    answer:
      "Basta chamar no WhatsApp pelo botão \"Tirar dúvidas e agendar\". A Ioná responde com as orientações e confirma o agendamento com você.",
  },
];

// ---------------------------------------------------------------------------
// CTA final
// ---------------------------------------------------------------------------
export const finalCta = {
  title: "Quer saber qual procedimento faz mais sentido para você?",
  description: "Fale com a Ioná pelo WhatsApp e tire suas dúvidas antes de agendar.",
  buttonLabel: "Falar com a Bendita Micro",
};

// ---------------------------------------------------------------------------
// Metadata / SEO
// ---------------------------------------------------------------------------
export const seo = {
  title: "Bendita Micro | Nanopigmentação de Sobrancelhas e Lábios em Cuiabá",
  description:
    "Conheça os procedimentos da Bendita Micro com Ioná Victório e tire suas dúvidas sobre Nano Fios, sobrancelhas e micropigmentação labial.",
  // Canonical deve ser preenchido quando o domínio final for definido.
  canonicalUrl: null as string | null,
  ogImage: images.portraitAtelier,
};

// ---------------------------------------------------------------------------
// Rodapé
// ---------------------------------------------------------------------------
export const footer = {
  brandLine: `${brand.name} — ${brand.professional}`,
  city: brand.city,
  demoNotice,
};
