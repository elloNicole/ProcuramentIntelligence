# Instalação e execução

## Site e demonstração (disponível)

O site é estático (HTML, CSS e JavaScript), sem dependências a instalar.

**Opção 1:** abra o arquivo `index.html` no navegador.

**Opção 2:** sirva a pasta localmente:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

O protótipo (`prototipo.html`) e o simulador (`simulador.html`) abrem do mesmo jeito. O protótipo não grava nada: ao atualizar a página, o estado inicial volta.

As fontes vêm do Google Fonts e exigem internet; sem conexão, o navegador usa fontes padrão.

## Publicação no GitHub Pages

1. No repositório, abra **Settings > Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/ (root)`, e salve.
4. Aguarde a publicação e acesse o endereço indicado.

## Formulário de contato

No arquivo `assets/js/main.js`, preencha a constante `CONTACT_EMAIL` com o e-mail que receberá os pedidos de acesso. O formulário abre o aplicativo de e-mail do visitante com a mensagem pronta. Não grave senhas ou chaves no repositório.

## Sistema de automação (planejado)

O recebimento de cotações por e-mail já está implementado, mas as instruções de instalação do sistema ainda não foram documentadas. O ambiente previsto é:

- servidor Linux com Docker e Docker Compose;
- n8n e PostgreSQL em contêineres;
- variáveis de ambiente em arquivo `.env` **fora do repositório** (por exemplo `DB_PASSWORD`, `EMAIL_USER`, `LLM_API_KEY`), com um `.env.example` sem valores reais.

Esta página será atualizada com comandos de instalação e testes quando a documentação do sistema estiver completa.
