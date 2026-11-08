# Requisitos

Estado: **planejamento**. Apenas o simulador de demonstração (RF09) está implementado.

## Visão geral e escopo

Automatizar, para uma linha de produtos piloto de uma PME importadora parceira, o ciclo de cotação: receber propostas, padronizar, calcular o custo total por fornecedor, comparar e entregar o resultado após validação humana.

**Fora do escopo desta fase:** emissão de documentos fiscais, desembaraço aduaneiro, pagamento e substituição do ERP ou do despachante.

## Requisitos funcionais

| ID | Requisito | Estado |
|---|---|---|
| RF01 | Monitorar uma caixa de e-mail e registrar cada cotação recebida, evitando processamento duplicado | Planejada |
| RF02 | Extrair itens, preços, prazos e condições de anexos em PDF e planilha | Planejada |
| RF03 | Aplicar regras de negócio a itens já parametrizados | Planejada |
| RF04 | Tratar com modelo de linguagem os casos fora das regras (nomenclatura divergente, incoterm ausente) e encaminhá-los à revisão | Planejada |
| RF05 | Calcular a carga tributária de importação e o custo total por fornecedor | Planejada |
| RF06 | Calcular um escore ponderado de fornecedores (preço, prazo, qualidade, pontualidade e critérios opcionais) | Planejada |
| RF07 | Exigir validação de um responsável antes do registro definitivo | Planejada |
| RF08 | Entregar os dados validados ao ERP e emitir alertas (inclusive via WhatsApp) | Planejada |
| RF09 | Simular o custo total de três propostas com dados informados pelo usuário | Implementada (demonstração) |
| RF10 | Consultar a API da Receita Federal e simular impostos por cenário | Planejada |
| RF11 | Exibir dashboards de custos e desempenho de fornecedores | Planejada |

## Requisitos não funcionais

- **Rastreabilidade:** toda cotação e toda decisão devem ficar registradas, com a origem do dado.
- **Supervisão humana:** nenhum registro definitivo sem validação.
- **Privacidade:** dados de fornecedores e da empresa parceira não são publicados no repositório.
- **Disponibilidade:** o sistema roda em servidor próprio (VPS Linux) com serviços em contêineres.
- **Usabilidade:** interface legível em computador e celular.

## Histórias de usuário

1. Como comprador, quero receber as cotações já padronizadas para não digitar planilhas.
2. Como comprador, quero ver o custo total de cada fornecedor para não decidir só pelo preço.
3. Como gestor, quero revisar apenas os casos ambíguos para ganhar tempo sem perder controle.
4. Como gestor, quero receber alertas de cotações perto do vencimento.

## Critérios de aceitação (exemplos)

- RF02: dado um PDF de cotação do piloto, os campos obrigatórios são extraídos ou o caso é marcado para revisão.
- RF05: o custo total calculado é conferido por despachante ou contador em uma amostra de cotações.
- RF07: nenhum registro é gravado sem aprovação explícita.
- RF09: ao alterar frete, seguro ou tributos, os totais e a recomendação atualizam na hora.
