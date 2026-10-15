export function Formulas() {
  return (
    <article className="panel prose">
      <h2>Fórmulas e premissas</h2>
      <p>
        Todas as simulações usam o <strong>mês</strong> como período de capitalização. Prazos em anos são multiplicados por 12 e taxas anuais
        são convertidas para mensais antes do cálculo — taxa mensal nunca é combinada diretamente com prazo anual.
      </p>

      <h3>Notação</h3>
      <ul>
        <li><code>P</code> — capital inicial / valor presente</li>
        <li><code>i</code> — taxa mensal em forma decimal (1% = 0,01)</li>
        <li><code>n</code> — número de meses</li>
        <li><code>A</code> — aporte mensal</li>
      </ul>

      <h3>Juros simples</h3>
      <p><code>J = P · i · n</code> e <code>M = P + J</code>. Taxas anuais são convertidas proporcionalmente (<code>i = iₐ ÷ 12</code>), pois no regime simples taxas proporcionais são equivalentes.</p>

      <h3>Juros compostos</h3>
      <p><code>M = P · (1 + i)ⁿ</code> e <code>J = M − P</code>.</p>

      <h3>Investimento com aportes</h3>
      <p>
        <code>VF = P·(1 + i)ⁿ + A · [((1 + i)ⁿ − 1) / i] · (1 + i)ᵗ</code>, com <code>t = 0</code> para aportes no <strong>fim</strong> do mês
        (série postecipada) e <code>t = 1</code> para aportes no <strong>início</strong> (série antecipada). A tabela é gerada mês a mês e
        conferida contra essa fórmula nos testes automatizados.
      </p>

      <h3>Taxas: nominal, efetiva, proporcional e equivalente</h3>
      <ul>
        <li><strong>Efetiva</strong>: a taxa realmente aplicada no período de capitalização.</li>
        <li><strong>Nominal</strong>: taxa anual “de contrato” com capitalização em outro período (ex.: 12% a.a. capitalizados mensalmente = 1% a.m. efetivo).</li>
        <li><strong>Equivalente</strong>: <code>iₐ = (1 + iₘ)¹² − 1</code> e <code>iₘ = (1 + iₐ)^(1/12) − 1</code>. Gera o mesmo montante no mesmo prazo.</li>
        <li><strong>Proporcional</strong>: <code>iₐ = iₘ × 12</code> e <code>iₘ = iₐ ÷ 12</code>. Só equivale em juros simples.</li>
      </ul>
      <p>Nos formulários de juros compostos e investimentos você escolhe se a taxa anual informada é efetiva (padrão) ou nominal.</p>

      <h3>Financiamentos</h3>
      <ul>
        <li>
          <strong>Tabela Price</strong> (sistema francês): parcela fixa <code>PMT = P · i / (1 − (1 + i)⁻ⁿ)</code>. Em cada mês, juros ={' '}
          <code>saldo · i</code> e amortização = <code>PMT − juros</code>.
        </li>
        <li>
          <strong>SAC</strong>: amortização constante <code>P ÷ n</code>; parcela = amortização + <code>saldo · i</code>, decrescente.
        </li>
        <li>Primeira parcela um mês após a contratação, sem carência, sem entrada (informe o valor já financiado).</li>
        <li>A taxa informada é tratada como <strong>efetiva</strong>; taxa anual é convertida pela equivalência.</li>
        <li>Não inclui seguros (MIP/DFI), tarifas, IOF, nem correção por TR/IPCA. O CET real é maior que a taxa de juros.</li>
      </ul>

      <h3>Arredondamento</h3>
      <p>
        Todos os cálculos — inclusive as tabelas de financiamento — usam precisão total de ponto flutuante e são arredondados ao
        centavo somente na exibição (meio para longe do zero). Por isso, somar à mão os valores exibidos de uma coluna pode diferir do
        total em alguns centavos. Na última parcela de um financiamento, a amortização é exatamente o saldo restante, zerando a dívida.
      </p>

      <p className="disclaimer">
        Os resultados são <strong>simulações educativas</strong> e não constituem aconselhamento financeiro, oferta ou recomendação de
        investimento. Consulte as condições reais com a instituição financeira.
      </p>
    </article>
  )
}
