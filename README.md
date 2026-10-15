# Calculadora Financeira

Calculadora financeira web para simular **juros simples e compostos**, **investimentos com aportes**, **empréstimos e financiamentos (Price e SAC)**, **comparar cenários** e **converter taxas** — com tabelas de evolução, gráficos e fórmulas documentadas.

- **Aplicação publicada:** https://theusiiin.github.io/calculadora-financeira/
- **Repositório:** https://github.com/Theusiiin/calculadora-financeira

![Captura de tela da simulação de investimentos](docs/screenshot.jpg)

> Os resultados são **simulações educativas** e não constituem aconselhamento financeiro.

## Funcionalidades

| Módulo | O que faz |
| --- | --- |
| Investimentos | Capital inicial + aportes mensais (no início **ou** no fim do mês), taxa mensal ou anual (efetiva ou nominal), prazo em meses ou anos. Mostra total investido, juros e montante. |
| Financiamento | Valor financiado, taxa, prazo e sistema **Price** (parcelas fixas) ou **SAC** (amortização constante). Mostra parcelas, juros totais, total pago e a tabela de amortização. |
| Juros compostos | `M = P·(1+i)ⁿ`, com evolução mês a mês. |
| Juros simples | `J = P·i·n`, com evolução mês a mês. |
| Comparar cenários | Até 3 investimentos lado a lado, com o mesmo prazo, gráfico e diferença para o melhor cenário. |
| Conversão de taxas | Mensal ↔ anual, mostrando **equivalente** (compostos) e **proporcional** (simples/nominal), e nominal → efetiva. |
| Fórmulas | Página com todas as fórmulas, premissas e regras de arredondamento. |

Também incluídos:

- tabelas de evolução **mensais e anuais**, com cabeçalho fixo;
- gráficos (Recharts) carregados sob demanda;
- botão **Limpar e reiniciar** em cada simulação;
- validação com mensagens claras (ex.: “O prazo em anos precisa corresponder a meses inteiros”), com foco no primeiro campo inválido;
- entrada numérica no formato brasileiro (`1.500,75`) e seleção de moeda de exibição (BRL, USD, EUR);
- acessibilidade: rótulos, `aria-invalid`, navegação por teclado nas abas, tema claro/escuro automático e respeito a “reduzir movimento”.

## Premissas dos cálculos

- **Período-base mensal.** Prazos em anos são convertidos para meses e taxas anuais para mensais **antes** de calcular — taxa mensal nunca é combinada com prazo anual.
- **Taxa anual:** nos juros compostos e investimentos você escolhe se ela é **efetiva** (`iₘ = (1+iₐ)^(1/12) − 1`, padrão) ou **nominal** com capitalização mensal (`iₘ = iₐ/12`). Nos juros simples, a conversão é sempre proporcional. No financiamento, a taxa é tratada como efetiva.
- **Aportes:** “fim do mês” = série postecipada (o aporte rende a partir do mês seguinte); “início do mês” = série antecipada.
- **Financiamento:** primeira parcela um mês após a contratação, sem carência; não inclui seguros, tarifas, IOF nem correção monetária (TR/IPCA), portanto o CET real é maior.
- **Arredondamento:** cálculos em precisão total; valores são arredondados ao centavo apenas na exibição. A última parcela de um financiamento amortiza exatamente o saldo restante.

As fórmulas completas estão na aba **Fórmulas** e em [`src/lib/finance.ts`](src/lib/finance.ts).

## Tecnologias

React 19 · TypeScript · Vite · Recharts · Vitest · oxlint · GitHub Actions/Pages

## Estrutura

```
src/
├── lib/            # regras de negócio (sem React)
│   ├── finance.ts      # juros, investimentos, Price/SAC, conversão de taxas
│   ├── parse.ts        # leitura de números no formato brasileiro e validação
│   ├── inputs.ts       # validação de valores, taxas e prazos
│   ├── format.ts       # formatação monetária e de porcentagens
│   └── *.test.ts       # testes automatizados
├── components/     # campos, tabela de evolução, gráfico, layout
├── features/       # uma tela por calculadora
├── settings.tsx    # moeda de exibição
└── App.tsx         # abas e layout geral
```

## Pré-requisitos

- Node.js 20 ou superior (testado com Node 24 LTS) e npm.

## Instalação e execução

```bash
npm install
npm run dev       # http://localhost:5173
```

## Testes e qualidade

```bash
npm test          # 45 testes: fórmulas, casos extremos, validação e parsing
npm run lint
npm run build     # build de produção em dist/
npm run preview   # serve o build localmente
```

Os testes conferem, entre outros: valores de referência de juros compostos, equivalência de taxas (ida e volta), simulação mês a mês × fórmula fechada do valor futuro, taxa zero, Price (parcela de R$ 8.884,88 para R$ 100 mil a 1% a.m. em 12 meses), SAC (amortização constante e quitação exata), comparação Price × SAC e validação de prazos.

## Variáveis de ambiente e APIs

Nenhuma. A calculadora funciona inteiramente no navegador e não envia dados para servidores.

## Deploy

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) roda testes, gera o build e publica no **GitHub Pages** a cada push na branch `main`. No repositório, a origem do Pages deve estar em **Settings → Pages → Source: GitHub Actions**.

Como `base: './'` está configurado no Vite, o mesmo build funciona em qualquer subpasta ou hospedagem estática (Netlify, Vercel, Cloudflare Pages).

## Limitações conhecidas

- Não calcula impostos (IR, IOF), inflação, CET, carência, amortizações extraordinárias nem correção monetária.
- Taxas são consideradas constantes durante todo o prazo.
- A moeda selecionada altera apenas a formatação; não há conversão cambial.
- O prazo máximo é de 1.200 meses (100 anos).

## Autor

Matheus Bonfatti — [LinkedIn](https://www.linkedin.com/in/matheus-bonfatti-lara-73a78a235/) · [GitHub](https://github.com/Theusiiin)
