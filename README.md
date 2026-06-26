# 📝 Livro de Visitas Digital

> Aplicação descentralizada para registro permanente de visitas em museus, utilizando contratos inteligentes na blockchain Ethereum.

---

## Sobre o Projeto

O **Livro de Visitas Digital** é uma aplicação web3 que permite a museus oferecerem um livro de visitas digital cujas mensagens são armazenadas de forma imutável na blockchain Ethereum. Uma vez registrada, nenhuma mensagem pode ser alterada ou removida — nem pelo administrador do sistema.

A aplicação é dividida em dois perfis de acesso: o **museu**, que gerencia seu livro de visitas por meio de uma carteira digital, e o **visitante**, que registra sua mensagem de forma simples e acessível.

---

## Disciplina

Projeto desenvolvido como parte da avaliação da disciplina de Blockchain e Web 3.0 — período **2026.1**.

**Universidade Federal de Alagoas (UFAL)**

---

## Autoras

| Nome | E-mail |
|---|---|
| Maria Aparecida da Silva Nascimento | masn@ic.ufal.br |
| Tatiane Monteiro Araújo | tma@ic.ufal.br |

---

## Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Contrato inteligente | Solidity 0.8.19 |
| Ambiente de desenvolvimento | Hardhat |
| Biblioteca de conexão | Ethers.js v6 |
| Carteira digital | MetaMask |
| Rede de testes | Ethereum Sepolia |
| Provedor RPC | Alchemy |
| Frontend | HTML, CSS e JavaScript puro |

---

## Arquitetura

```
livro-visitas-v2/
├── contracts/
│   └── LivroDeVisitas.sol     # Contrato inteligente
├── scripts/
│   └── deploy.js              # Script de deploy
├── frontend/
│   ├── index.html             # Interface web
│   ├── style.css              # Estilos
│   └── app.js                 # Lógica de conexão com a blockchain
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## Funcionalidades

**Museus**
- Cadastro do museu via carteira digital (MetaMask)
- Definição de número de páginas iniciais do livro
- Adição de páginas conforme necessidade
- Painel com estatísticas de ocupação do livro

**Visitantes**
- Acesso à lista de museus cadastrados
- Registro de nome, data da visita e mensagem
- Navegação pelas páginas do livro
- Confirmação de transação via MetaMask

**Contrato Inteligente**
- Armazenamento imutável das mensagens na blockchain
- Paginação automática (5 mensagens por página, configurável)
- Controle de capacidade por museu
- Histórico público e verificável

---

## Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [MetaMask](https://metamask.io/) instalado no navegador
- Conta na [Alchemy](https://alchemy.com/) para acesso à RPC da Sepolia
- ETH de teste na rede Sepolia (disponível em [faucets gratuitos](#faucets))

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/livro-de-visitas.git
cd livro-de-visitas

# Instale as dependências
npm install
```

### Configuração

```bash
# Copie o arquivo de variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/SUA_CHAVE
PRIVATE_KEY=sua_chave_privada_sem_0x
```

> ⚠️ Nunca compartilhe sua chave privada nem a envie para o repositório.

### Deploy do Contrato

```bash
# Compilar
npm run compile

# Publicar na rede Sepolia
npm run deploy:sepolia
```

Após o deploy, copie o endereço do contrato exibido no terminal e cole em `frontend/app.js`:

```javascript
const CONTRACT_ADDRESS = "0xSEU_ENDERECO_AQUI";
```

### Executando o Frontend

Abra o arquivo `frontend/index.html` diretamente no navegador, ou utilize um servidor local como o [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) do VS Code.

---

## Faucets

Para obter ETH de teste na rede Sepolia:

- [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) — 0,05 ETH por dia
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de) — sem limite diário, requer mineração no navegador

---

## Contrato Inteligente

O contrato `LivroDeVisitas.sol` implementa as seguintes funções principais:

| Função | Descrição |
|---|---|
| `cadastrarMuseu()` | Registra um novo museu associado à carteira |
| `registrarMensagem()` | Grava uma mensagem de visitante na blockchain |
| `adicionarPaginas()` | Expande a capacidade do livro |
| `listarMuseus()` | Retorna todos os museus cadastrados |
| `listarMensagens()` | Retorna todas as mensagens de um museu |
| `statusLivro()` | Retorna estatísticas de ocupação |

A constante `MENSAGENS_POR_PAGINA = 5` está definida no contrato e pode ser ajustada em versões futuras.

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos.
