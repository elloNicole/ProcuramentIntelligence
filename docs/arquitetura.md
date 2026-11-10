# Arquitetura

Estado: **proposta de arquitetura**. O recebimento de cotações por e-mail já está implementado, assim como o simulador de demonstração; os demais componentes estão planejados.

## Fluxo

```mermaid
flowchart LR
  A[E-mail / PDF / Planilha] --> B[Extração de dados - IDP]
  B --> C{Regras de negócio}
  C -- parametrizado --> E[Custo total e escore]
  C -- exceção --> D[Modelo de linguagem]
  D --> F[Revisão humana]
  E --> F
  F --> G[(PostgreSQL)]
  G --> H[ERP / Alertas / Dashboards]
```

## Componentes planejados

| Componente | Função |
|---|---|
| Servidor Linux (VPS) | Hospedagem auto-hospedada |
| Docker e Docker Compose | Execução dos serviços em contêineres |
| n8n | Orquestração dos fluxos (gatilho de e-mail, etapas e notificações) |
| PostgreSQL | Persistência de cotações, fornecedores e decisões |
| Modelo de linguagem | Tratamento das exceções da triagem |

## Modelo de dados (proposta)

Banco relacional (PostgreSQL, administrado pelo NocoDB). Os tipos abaixo são os planejados; valores monetários usam `numeric(14,2)`, alíquotas `numeric(6,3)` e quantidades `numeric(14,3)`.

```mermaid
erDiagram
  CLIENTE ||--o{ USUARIO : possui
  CLIENTE ||--o{ REQUISICAO_CLIENTE : solicita
  PORTO ||--o{ REQUISICAO_CLIENTE : destino
  REQUISICAO_CLIENTE ||--|{ ITEM_SOLICITADO : contem
  MATERIAL ||--o{ ITEM_SOLICITADO : referencia
  NCM ||--o{ MATERIAL : classifica
  NCM ||--o{ ALIQUOTA_NCM : tem_vigencias
  REQUISICAO_CLIENTE ||--o{ CONVITE_RFQ : envia
  FORNECEDOR ||--o{ CONVITE_RFQ : recebe
  CONVITE_RFQ ||--o{ COTACAO_RECEBIDA : responde
  ITEM_SOLICITADO ||--o{ COTACAO_RECEBIDA : cotado_em
  COTACAO_RECEBIDA ||--o| CALCULO_CUSTO : gera
  REQUISICAO_CLIENTE ||--o{ REVISAO_HUMANA : passa_por
  USUARIO ||--o{ REVISAO_HUMANA : decide
  REVISAO_HUMANA ||--o{ PEDIDO_COMPRA : aprova
  FORNECEDOR ||--o{ PEDIDO_COMPRA : recebe_pedido
  PEDIDO_COMPRA ||--|{ ITEM_PEDIDO : contem
  COTACAO_RECEBIDA ||--o| ITEM_PEDIDO : escolhida_em
  USUARIO ||--o{ EVENTO_AUDITORIA : realiza

  CLIENTE {
    uuid id PK
    varchar razao_social
    varchar cnpj UK
    enum regime_tributario "real, presumido, simples"
    char uf
    timestamptz criado_em
  }
  USUARIO {
    uuid id PK
    uuid cliente_id FK
    varchar nome
    varchar email UK
    enum papel "comprador, gestor, admin"
    boolean ativo
  }
  PORTO {
    varchar codigo PK
    varchar nome
    char uf
    numeric thc_por_tonelada
    numeric icms_padrao
    numeric fator_frete
  }
  NCM {
    varchar codigo PK
    text descricao
    varchar unidade_estatistica
  }
  ALIQUOTA_NCM {
    uuid id PK
    varchar ncm FK
    numeric ii
    numeric ipi
    numeric pis
    numeric cofins
    boolean ex_tarifario
    date vigencia_inicio
    date vigencia_fim
    varchar fonte
  }
  MATERIAL {
    uuid id PK
    varchar produto
    text especificacao
    varchar ncm FK
    varchar unidade
    numeric estoque_atual
    numeric consumo_mensal
    int lead_time_dias
    boolean ativo
  }
  REQUISICAO_CLIENTE {
    uuid id PK
    varchar codigo UK
    uuid cliente_id FK
    uuid criado_por FK
    varchar porto_destino FK
    enum status "aguardando_cotacao, em_revisao, fechado, cancelado"
    date prazo_limite
    timestamptz data_criacao
    timestamptz fechado_em
    text observacao
  }
  ITEM_SOLICITADO {
    uuid id PK
    uuid requisicao_id FK
    uuid material_id FK
    numeric quantidade
    date necessidade_em
    enum urgencia "critica, alta, media, baixa"
  }
  FORNECEDOR {
    uuid id PK
    varchar nome
    char pais
    varchar email_contato
    numeric score_historico
    boolean certificacao_esg
    int tempo_resposta_horas
    numeric taxa_resposta
    boolean ativo
  }
  CONVITE_RFQ {
    uuid id PK
    uuid requisicao_id FK
    uuid fornecedor_id FK
    enum status "aguardando, recebida, incompleta, sem_resposta"
    timestamptz enviado_em
    int lembretes
    timestamptz ultimo_lembrete
    varchar mensagem_id UK
  }
  COTACAO_RECEBIDA {
    uuid id PK
    uuid item_id FK
    uuid convite_id FK
    varchar email_id UK
    numeric preco_unitario
    char moeda
    numeric quantidade_ofertada
    numeric total_calculado
    enum incoterm "FOB, CFR, CIF"
    char origem_pais
    date validade_proposta
    int lead_time_dias
    jsonb dados_extraidos
    text tratamento_excecao
    numeric score_rodada
    int posicao_ranking
    timestamptz recebida_em
  }
  CALCULO_CUSTO {
    uuid id PK
    uuid cotacao_id FK
    numeric cambio
    numeric valor_aduaneiro
    numeric ii
    numeric ipi
    numeric pis_cofins
    numeric icms
    numeric afrmm
    numeric despesas
    numeric custo_nacionalizado
    numeric creditos
    numeric custo_efetivo
    jsonb parametros
    timestamptz calculado_em
  }
  REVISAO_HUMANA {
    uuid id PK
    uuid requisicao_id FK
    uuid usuario_id FK
    enum decisao "aprovada, devolvida, cancelada"
    text justificativa
    timestamptz decidido_em
  }
  PEDIDO_COMPRA {
    uuid id PK
    varchar numero UK
    uuid requisicao_id FK
    uuid fornecedor_id FK
    uuid revisao_id FK
    enum status "emitido, enviado, confirmado"
    numeric valor_total
    varchar pdf_url
    timestamptz emitido_em
  }
  ITEM_PEDIDO {
    uuid id PK
    uuid pedido_id FK
    uuid cotacao_id FK
    numeric quantidade
    numeric preco_unitario
    numeric custo_efetivo
  }
  EVENTO_AUDITORIA {
    bigint id PK
    varchar entidade
    uuid entidade_id
    varchar acao
    jsonb antes
    jsonb depois
    uuid usuario_id FK
    timestamptz ocorrido_em
  }
```

### Restrições e índices

- **Trava de duplicidade:** `COTACAO_RECEBIDA.email_id` é único, e o n8n só processa um e-mail se o identificador ainda não existir.
- **Uma cotação por convite e item:** índice único em (`convite_id`, `item_id`).
- **Integridade:** chaves estrangeiras com `ON DELETE RESTRICT` nas tabelas de negócio. Nada que já foi cotado ou aprovado é apagado.
- **Vigência de alíquotas:** `ALIQUOTA_NCM` guarda histórico por período; o cálculo usa a vigência da data da cotação.
- **Rastreabilidade:** `CALCULO_CUSTO.parametros` (jsonb) congela câmbio, alíquotas, regime e cenário usados, para que o número possa ser reproduzido depois. Toda mudança de status gera um registro em `EVENTO_AUDITORIA`.
- **Índices de consulta:** `REQUISICAO_CLIENTE(status, prazo_limite)`, `CONVITE_RFQ(status, enviado_em)` para o follow-up e `MATERIAL(ncm)`.

### Campos derivados

| Campo | Regra |
|---|---|
| `MATERIAL` cobertura (dias) | `estoque_atual / consumo_mensal x 30` |
| `ITEM_SOLICITADO.urgencia` | margem = cobertura − `lead_time_dias`; crítica se margem ≤ 0, alta se ≤ 10, média se ≤ 30, baixa acima disso |
| `FORNECEDOR.taxa_resposta` | cotações respondidas / convites enviados |
| `COTACAO_RECEBIDA.score_rodada` | média ponderada: custo efetivo por tonelada 40%, lead time 20%, histórico 20%, ESG 20% (pesos configuráveis) |

## Decisões técnicas

- **Regras antes da IA:** o que já está parametrizado é resolvido por regra; o modelo de linguagem só trata exceções. Reduz custo e torna o comportamento previsível.
- **Humano no circuito:** a aprovação final fica com uma pessoa, seguindo o desenho de automação em quatro etapas descrito por Jeong et al. (2025).
- **Custo total, não preço:** a comparação usa o custo desembarcado, pois ele costuma ser subestimado (Pumpe e Vallée, 2017).
- **Escore multicritério:** os pesos partem dos critérios de maior importância em Ali, Nipu e Khan (2023) e são adaptados à empresa parceira.
- **Site estático:** a página e a demo rodam só no navegador, sem servidor, para publicação no GitHub Pages.

## Cálculo usado na demonstração

```
CIF      = FOB + frete + seguro
Tributos = CIF x alíquota + despesas por embarque
Total    = CIF + Tributos
```

Simplificação didática (alíquota única). O cálculo oficial depende de classificação fiscal, regime e legislação vigente.
