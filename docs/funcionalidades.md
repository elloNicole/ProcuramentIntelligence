# Funcionalidades

Detalhamento dos processos do sistema (fluxos no n8n, banco no PostgreSQL/NocoDB). Legenda de estado: **Implementada**, **Protótipo** (existe como tela navegável com dados fictícios, em `prototipo.html` e `simulador.html`) e **Planejada**.

## Visão por módulo

| # | Módulo | Estado |
|---|---|---|
| 1 | Intake e disparo de RFQ | Planejada |
| 2 | Ingestão e leitura das respostas | Recebimento por e-mail: Implementada. Extração e IA: Planejada |
| 3 | Roteamento e registro no banco | Planejada |
| 4 | Motor de custos e tributos | Protótipo (simulador) |
| 5 | Ranking de fornecedores | Protótipo (tela do pedido) |
| 6 | Follow-up e cobrança automática | Protótipo (envio simulado). Agendamento diário: Planejada |
| 7 | Revisão humana e fechamento do pedido | Protótipo |
| 8 | Painel, urgência de materiais e bases de cadastro | Protótipo |
| 9 | Alertas via WhatsApp e dashboards avançados | Planejada |
| 10 | Fase 2: geração de PO, Siscomex e ERP (TOTVS) | Planejada |

## 1. Intake e disparo de RFQ

- **Gatilho:** uma requisição (lote) com itens é cadastrada.
- **Entradas:** cliente, porto de destino, prazo limite, itens (material, quantidade, necessidade).
- **Regras:** seleciona fornecedores aptos pelo cadastro e pelo histórico; monta um e-mail estruturado em inglês pedindo preço, incoterm, validade, origem e lead time.
- **Saídas:** um `CONVITE_RFQ` por fornecedor, com `mensagem_id` para vincular as respostas.

## 2. Ingestão e leitura das respostas

- **Gatilho:** chegada de e-mail de resposta, com anexo PDF ou Excel.
- **Trava de segurança:** se o `email_id` já existe, o e-mail é ignorado.
- **Extração:** planilha lida por nó de extração binária; corpo do e-mail e texto do PDF enviados a um modelo de linguagem, que devolve campos estruturados em JSON.
- **Exceções que a IA deve sinalizar:** validade ausente, incoterm ausente, quantidade parcial, porto de embarque ou descarga diferente do solicitado, moeda divergente, item não cotado, nomenclatura divergente.
- **Saídas:** `dados_extraidos` (jsonb), `tratamento_excecao` (texto) e status do convite (`recebida` ou `incompleta`).

## 3. Roteamento e registro no banco

- Localiza ou cria fornecedor e vínculo com a requisição.
- Calcula `total_calculado = preco_unitario x quantidade_ofertada` em código.
- Grava a linha consolidada em `COTACAO_RECEBIDA` e atualiza o status do convite.

## 4. Motor de custos e tributos

Entradas: NCM, porto, incoterm, câmbio, frete, seguro, regime tributário e cenário. Cálculo (versão do protótipo):

```
Valor aduaneiro = mercadoria + frete + seguro (conforme incoterm)
II      = valor aduaneiro x alíquota
IPI     = (valor aduaneiro + II) x alíquota
PIS/COFINS-Importação = valor aduaneiro x alíquotas
AFRMM   = frete x alíquota (ou zero, com isenção)
ICMS    = por dentro, sobre a soma dos itens acima e das despesas
Custo nacionalizado = valor aduaneiro + tributos + despesas
Custo efetivo       = custo nacionalizado - créditos do regime
```

- **Benefícios tratados como enquadramentos separados:** ex-tarifário, isenção de AFRMM e diferimento de ICMS. Cada um altera o cálculo ou o desembolso e depende de enquadramento validado.
- **Cenário 2027:** CBS no lugar de PIS/COFINS e IPI zerado, com alíquota editável.
- **Saídas:** `CALCULO_CUSTO` com os parâmetros congelados (jsonb).
- **Limite:** alíquotas por NCM do protótipo são ilustrativas. Na versão real, vêm de tabela com vigência (`ALIQUOTA_NCM`) e, na fase 2, do Siscomex.
- **Critério ambiental:** entra como peso opcional no escore do fornecedor (selo ESG). Não é tratado como benefício fiscal.

## 5. Ranking de fornecedores

- Reúne as propostas concorrentes do mesmo item.
- Score (0 a 100): custo efetivo por tonelada 40%, lead time 20%, histórico do fornecedor 20%, selo ESG 20%. Os pesos partem do exemplo do projeto e são configuráveis por cliente.
- O ranking é uma sugestão. Cotações com exceção continuam elegíveis, mas exigem confirmação na revisão.

## 6. Follow-up e cobrança automática

- Rotina diária olha os convites sem resposta e envia lembrete após 12 h ou 24 h.
- Se a cotação veio incompleta, responde ao e-mail pedindo só os dados faltantes.
- Após o limite de lembretes, o convite passa a `sem_resposta` e aparece no painel.

## 7. Revisão humana e fechamento do pedido

- O pedido entra em revisão quando há cotações suficientes ou o prazo limite se aproxima.
- O comprador vê as cotações lado a lado, com custo efetivo, score e exceções.
- Pode manter o fornecedor sugerido ou escolher outro; neste caso, a **justificativa é obrigatória**.
- Cada exceção do fornecedor escolhido precisa ser confirmada antes da aprovação.
- Ao aprovar, o pedido passa para "fechado", a decisão é registrada em `REVISAO_HUMANA` e o evento vai para a auditoria.

## 8. Painel, urgência e cadastros

- **Painel:** pedidos abertos, cotações enviadas e respondidas, fornecedores sem resposta e materiais críticos.
- **Matriz fornecedor x pedido:** mostra quem respondeu, quem respondeu parcialmente, quem não respondeu e quem não foi convidado.
- **Urgência do material:** margem = cobertura de estoque − lead time (crítica ≤ 0 dia, alta ≤ 10, média ≤ 30). Materiais críticos sem pedido aberto são destacados.
- **Cadastros:** fornecedores (score, selo ESG, tempo e taxa de resposta) e materiais (NCM, estoque, consumo, lead time).

## 9. Alertas e dashboards

- Alertas via WhatsApp: cotação perto do vencimento, pedido aguardando revisão, material crítico sem pedido.
- Dashboards avançados: redução de custo por pedido, desempenho de fornecedores e histórico de preços.

## 10. Fase 2

- **PO Engine:** gerar o pedido de compra em PDF e enviar ao fornecedor escolhido.
- **Siscomex e Receita Federal:** buscar alíquotas e dados oficiais por API.
- **ERP:** enviar o fornecedor escolhido ao TOTVS por requisição POST, para o financeiro.

## Fora do escopo

Desembaraço aduaneiro, emissão de documentos fiscais, pagamento e decisão automática de compra sem validação humana.
