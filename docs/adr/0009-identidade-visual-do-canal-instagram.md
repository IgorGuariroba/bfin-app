# 9. Identidade visual do canal Instagram = extensão do design system do app

Data: 2026-06-30
Status: Aceito

## Contexto

O canal Instagram foi escolhido como canal Fase 1 do bfin ([`docs/strategy/instagram-channel.md`](../strategy/instagram-channel.md)) e a conta é **faceless** — sem fundador nem rosto na câmera. Sem uma pessoa construindo trust, a **identidade visual e o conceito carregam tudo sozinhos**. A tentação natural num canal de Reels é adotar uma linguagem "viral" própria (fundos escuros, neon, tipografia bold) que costuma performar em alcance, ou recorrer a stock photography financeiro.

O app, porém, tem identidade visual **propositalmente não-fintech** (`DESIGN.md`, inspirada em marketplace consumer tipo Airbnb): canvas branco + ink near-black + **Rausch (`#ff385c`) como único accent de marca**, shapes soft sem quina dura, tipografia modesta (pesos 500/600), filosofia de whitespace sobre "typographic muscle". Essa identidade já carrega o posicionamento — visual quente/humano = não-culposo = a voz validadora definida para o canal.

## Decisão

A estética do Instagram **estende o design system do app**, não cria linguagem própria. Mesma paleta, shapes e tipografia do `DESIGN.md`. Como a conta é faceless, o **hero visual passa a ser tipográfico-numérico** (tipografia gigante + número concreto + gráfico mínimo sobre canvas branco) em vez de fotográfico — o "photography-led" do app vira "typography-and-number-led" no feed.

Convenção complementar: **Rausch é cor de marca, não semântica de dado**. Reservado para UI/CTA/traços; em gráficos e projeções, saldo usa ink/neutral e positivo usa verde contido — porque em finanças vermelho carrega semântica de negativo/dívida que não pode colidir com a cor da marca.

## Consequências

**Positivas:**
- Continuidade visual do funil: quem vê o Reel e clica no link cai num app que parece a mesma marca — curioso vira confiança.
- Honra a decisão de design de rejeitar estética fintech/enterprise; o bfin se diferencia dos concorrentes também por parecer humano e leve.
- Produção fica **template-driven** (paleta + shapes + tipografia fixos), o que viabiliza geração de arte automatizada a partir daqui.

**Negativas / trade-offs aceitos:**
- Abre mão do alcance potencial de uma estética viral/neon otimizada puramente para o algoritmo de Reels.
- Canvas branco + tipografia modesta exigem **disciplina de composição** para não ficar pobre no feed — a carga de "prender atenção" recai sobre o conceito e o número, não sobre efeito visual.

## Alternativas descartadas

- **Linguagem viral própria (fundos escuros/neon, tipografia bold):** ganharia atenção no Reel, mas trairia a identidade do produto e quebraria a continuidade visual com o app — o usuário cairia num produto que parece outro.
- **Stock photography financeiro estilo Airbnb:** honraria o "photography-led", mas cai no clichê saturado do stock de finanças e combate o princípio de se diferenciar dos concorrentes.
- **Rausch como cor de dado (saldo/dívida):** confundiria semântica financeira com marca; recusado em favor de cor semântica separada.
