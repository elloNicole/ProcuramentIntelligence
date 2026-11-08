# Imports Intelligence

Sistema para automatizar a gestão de cotações, importações e seleção de fornecedores com inteligência artificial, voltado a pequenas e médias empresas importadoras. Complementa o ERP: lê as cotações, padroniza os dados, calcula o custo total por fornecedor e entrega o resultado depois da validação humana.

**Projeto Interdisciplinar 1** · Curso de Gestão da Tecnologia da Informação · IFPR Câmpus Pinhais · 4º período · 2026.02

**Equipe:** Nicole Ribeiro de Mello e João Paulo Carvalho Lima

> Versão beta. O repositório contém hoje a página do projeto e um simulador de demonstração com **dados fictícios**. O sistema de automação ainda está em planejamento.

## Problema

Em PMEs importadoras, a cotação internacional costuma ser manual: propostas chegam por e-mail em formatos diferentes e são digitadas em planilhas. Isso consome tempo, gera erros de transcrição e dificulta comparar fornecedores pelo **custo total**, e não só pelo preço de tabela.

## Estado das funcionalidades

| Funcionalidade | Estado |
|---|---|
| Simulador de custo total (demonstração, dados fictícios) | Implementada |
| Recebimento de cotações por e-mail | Planejada |
| Extração de PDF e planilha (IDP) | Planejada |
| Triagem por regras e IA nas exceções | Planejada |
| Cálculo da carga tributária e do custo total | Planejada |
| Escore comparativo de fornecedores | Planejada |
| Validação humana antes do registro | Planejada |
| Entrega ao ERP, alertas via WhatsApp e dashboards | Planejada |
| API da Receita Federal e simulação de impostos | Planejada |

## Estrutura do repositório

```
.
├── index.html          página do projeto (GitHub Pages)
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── imagens/
├── docs/
│   ├── requisitos.md
│   ├── arquitetura.md
│   ├── instalacao.md
│   └── cronograma.md
├── README.md
└── LICENSE
```

## Como ver o site

Abra o `index.html` no navegador ou rode `python3 -m http.server` na pasta e acesse `http://localhost:8000`. Detalhes em [docs/instalacao.md](docs/instalacao.md).

## Documentação

- [Requisitos](docs/requisitos.md)
- [Arquitetura](docs/arquitetura.md)
- [Instalação e execução](docs/instalacao.md)
- [Gestão e evolução](docs/cronograma.md)

## Referências

1. Ali, Nipu e Khan (2023). A decision support system for classifying supplier selection criteria using machine learning and random forest approach. *Decision Analytics Journal*, v. 7. https://doi.org/10.1016/j.dajour.2023.100238
2. Jeong et al. (2025). E2E process automation leveraging generative AI and IDP-based automation agent. https://arxiv.org/abs/2505.20733
3. Pumpe e Vallée (2017). A typology for selecting an appropriate Total Landed Cost method in international supplier selection decisions. *Transportation Research Procedia*, v. 25. https://doi.org/10.1016/j.trpro.2017.05.462

## Créditos e licença

Fontes Instrument Serif, Geist e Geist Mono (SIL Open Font License), carregadas pelo Google Fonts. Ícones e ilustrações próprios. Código sob licença MIT (ver [LICENSE](LICENSE)).
