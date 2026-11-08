# Arquitetura

Estado: **proposta de arquitetura**. Os componentes abaixo estão planejados e ainda não foram implementados; apenas a página e o simulador existem.

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

```mermaid
erDiagram
  FORNECEDOR ||--o{ COTACAO : envia
  COTACAO ||--|{ ITEM_COTACAO : contem
  COTACAO ||--o| CUSTO_TOTAL : gera
  COTACAO ||--o{ REVISAO : passa_por
  FORNECEDOR {
    int id
    string nome
    string pais
  }
  COTACAO {
    int id
    date recebida_em
    date validade
    string incoterm
    string status
  }
  ITEM_COTACAO {
    int id
    string descricao
    decimal preco_fob
    int quantidade
  }
  CUSTO_TOTAL {
    int id
    decimal cif
    decimal tributos
    decimal despesas
    decimal total
  }
  REVISAO {
    int id
    string responsavel
    string decisao
  }
```

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
