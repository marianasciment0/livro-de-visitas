
const CONTRACT_ADDRESS = "0x554bC35f58aB124C28bd46AAb64db8b9F78277Fc";
const ALCHEMY_URL = "https://eth-sepolia.g.alchemy.com/v2/1X1QLASdRzq6TxMH6B3LF";

const CONTRACT_ABI = [
  "function cadastrarMuseu(string _nome, string _descricao, string _cidade, uint256 _paginasIniciais) external",
  "function adicionarPaginas(uint256 _museuId, uint256 _quantidade) external",
  "function registrarMensagem(uint256 _museuId, string _nome, string _texto, string _dataVisita) external",
  "function listarMuseus() external view returns (tuple(address dono, string nome, string descricao, string cidade, uint256 totalPaginas, bool ativo, uint256 totalMensagens)[])",
  "function listarMensagens(uint256 _museuId) external view returns (tuple(string nome, string texto, string dataVisita, uint256 timestamp, uint256 pagina)[])",
  "function statusLivro(uint256 _museuId) external view returns (uint256 totalMensagens, uint256 capacidade, uint256 paginaAtual, uint256 totalPaginas)",
  "function museuDoEndereco(address) external view returns (uint256)",
  "function ehMuseu(address) external view returns (bool)",
  "function museus(uint256) external view returns (address dono, string nome, string descricao, string cidade, uint256 totalPaginas, bool ativo, uint256 totalMensagens)"
];

let provider       = null;
let signer         = null;
let contract       = null;
let enderecoAtual  = null;
let perfilAtual    = null; 

let museuAtualId    = null;
let museuAtualDados = null;
let paginaAtualLivro = 1;
let todasMensagens  = [];
const MSGS_POR_PAGINA = 5;

function getRC() {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI,
    new ethers.JsonRpcProvider(ALCHEMY_URL));
}

const telas = ["telaEntrada","telaMuseus","telaLivro","telaPainel"];
function mostrarTela(id) {
  telas.forEach(t => document.getElementById(t).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo(0, 0);
}

function renderNav(perfil) {
  const nr = document.getElementById("navRight");
  if (perfil === "visitante") {
    nr.innerHTML = `<button class="btn-nav-voltar" id="navBtnVoltar">← Início</button>`;
    document.getElementById("navBtnVoltar").onclick = irParaInicio;
  } else if (perfil === "museu") {
    const addr = enderecoAtual ? enderecoAtual.slice(0,6)+"..."+enderecoAtual.slice(-4) : "";
    nr.innerHTML = `
      <span style="font-size:0.78rem;color:var(--cinza)">${addr}</span>
      <button class="btn-nav-museu" id="navBtnPainel">Meu Painel</button>
      <button class="btn-nav-voltar" id="navBtnVoltar">← Início</button>
    `;
    document.getElementById("navBtnPainel").onclick = abrirPainel;
    document.getElementById("navBtnVoltar").onclick = irParaInicio;
  } else {
    nr.innerHTML = "";
  }
}

function irParaInicio() {
  perfilAtual = null;
  renderNav(null);
  mostrarTela("telaEntrada");
}

async function conectarCarteira() {
  if (!window.ethereum) {
    alert("MetaMask não encontrado! Instale em metamask.io");
    return false;
  }
  try {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }]
      });
    } catch(e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId:"0xaa36a7", chainName:"Sepolia", nativeCurrency:{name:"ETH",symbol:"ETH",decimals:18}, rpcUrls:[ALCHEMY_URL], blockExplorerUrls:["https://sepolia.etherscan.io"] }]
        });
      }
    }
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    enderecoAtual = await signer.getAddress();
    return true;
  } catch (err) {
    console.error(err);
    alert("Não foi possível conectar a carteira.");
    return false;
  }
}

document.getElementById("btnSouVisitante").onclick = () => {
  perfilAtual = "visitante";
  renderNav("visitante");
  mostrarTela("telaMuseus");
  carregarMuseus();
};

document.getElementById("btnSouMuseu").onclick = () => {
  perfilAtual = "museu";
  renderNav("museu");
  mostrarTela("telaPainel");
  abrirPainel();
};

document.getElementById("navLogo").onclick = irParaInicio;

async function carregarMuseus() {
  const grid = document.getElementById("museusGrid");
  grid.innerHTML = `<div class="loading-wrap"><div class="loading-dots"><span></span><span></span><span></span></div><p>Carregando museus...</p></div>`;
  try {
    const lista = await getRC().listarMuseus();
    const ativos = lista.filter(m => m.ativo);
    if (ativos.length === 0) {
      grid.innerHTML = "";
      document.getElementById("semMuseus").classList.remove("hidden");
      return;
    }
    grid.innerHTML = "";
    ativos.forEach((museu, idx) => {
      const id = idx + 1;
      const card = document.createElement("div");
      card.className = "museu-card";
      card.innerHTML = `
        <p class="museu-card-cidade">${esc(museu.cidade)}</p>
        <h3 class="museu-card-nome">${esc(museu.nome)}</h3>
        <p class="museu-card-desc">${esc(museu.descricao)}</p>
        <div class="museu-card-footer">
          <span class="museu-card-msgs"><strong>${museu.totalMensagens.toString()}</strong> mensagens · ${museu.totalPaginas.toString()} páginas</span>
          <span class="museu-card-btn">Ver livro →</span>
        </div>`;
      card.onclick = () => abrirLivro(id, museu);
      grid.appendChild(card);
    });
  } catch(err) {
    console.error(err);
    grid.innerHTML = `<div class="loading-wrap"><p>Erro ao carregar museus.</p></div>`;
  }
}

async function abrirLivro(id, museu) {
  museuAtualId = id;
  museuAtualDados = museu;
  paginaAtualLivro = 1;
  document.getElementById("livroNomeMuseu").textContent = museu.nome;
  document.getElementById("livroCidadeMuseu").textContent = museu.cidade;
  mostrarTela("telaLivro");
  await carregarMensagensLivro();
  atualizarStatusLivro();
}

async function carregarMensagensLivro() {
  const conteudo = document.getElementById("paginasConteudo");
  conteudo.innerHTML = `<div class="loading-wrap"><div class="loading-dots"><span></span><span></span><span></span></div><p>Carregando mensagens...</p></div>`;
  try {
    todasMensagens = await getRC().listarMensagens(museuAtualId);
    renderizarPaginasNav();
    renderizarMensagensPagina(paginaAtualLivro);
  } catch(err) {
    conteudo.innerHTML = `<div class="pagina-vazia"><p>Erro ao carregar mensagens.</p></div>`;
  }
}

function renderizarPaginasNav() {
  const nav = document.getElementById("paginasNav");
  nav.innerHTML = "";
  const totalPags = Number(museuAtualDados.totalPaginas);
  for (let i = 1; i <= totalPags; i++) {
    const btn = document.createElement("button");
    btn.className = "pag-btn" + (i === paginaAtualLivro ? " ativa" : "");
    btn.textContent = `Página ${i}`;
    btn.onclick = () => { paginaAtualLivro = i; renderizarPaginasNav(); renderizarMensagensPagina(i); };
    nav.appendChild(btn);
  }
}

function renderizarMensagensPagina(pagina) {
  const conteudo = document.getElementById("paginasConteudo");
  const inicio = (pagina - 1) * MSGS_POR_PAGINA;
  const msgs = todasMensagens.slice(inicio, inicio + MSGS_POR_PAGINA);
  if (msgs.length === 0) {
    conteudo.innerHTML = `<div class="pagina-vazia"><p>Nenhuma mensagem nesta página ainda.</p></div>`;
    return;
  }
  conteudo.innerHTML = "";
  const lista = document.createElement("div");
  lista.className = "mensagens-lista";
  msgs.forEach(msg => {
    const card = document.createElement("div");
    card.className = "msg-card";
    card.innerHTML = `
      <p class="msg-texto">${esc(msg.texto)}</p>
      <div class="msg-meta">
        <div>
          <p class="msg-nome">${esc(msg.nome)}</p>
          <p class="msg-pagina">Página ${msg.pagina.toString()}</p>
        </div>
        <p class="msg-data">${esc(msg.dataVisita)}</p>
      </div>`;
    lista.appendChild(card);
  });
  conteudo.appendChild(lista);
}

function atualizarStatusLivro() {
  const total = Number(museuAtualDados.totalMensagens);
  const pags  = Number(museuAtualDados.totalPaginas);
  const pagAtual = total === 0 ? 1 : Math.ceil(total / MSGS_POR_PAGINA);
  document.getElementById("livroStatusPagina").textContent = `Página ${pagAtual} de ${pags}`;
  document.getElementById("livroStatusTotal").textContent = `${total} mensagem${total !== 1 ? "s" : ""}`;
}

document.getElementById("livroForm").addEventListener("submit", async e => {
  e.preventDefault();
  const nome  = document.getElementById("visNome").value.trim();
  const data  = document.getElementById("visData").value;
  const texto = document.getElementById("visMensagem").value.trim();
  if (!nome || !data || !texto) { alert("Preencha todos os campos."); return; }

  if (!signer) {
    const ok = await conectarCarteira();
    if (!ok) return;
  }

  const btn = document.getElementById("btnRegistrar");
  const txt = document.getElementById("btnRegistrarTxt");
  const ldr = document.getElementById("btnRegistrarLoader");
  btn.disabled = true; txt.classList.add("hidden"); ldr.classList.remove("hidden");

  const [ano, mes, dia] = data.split("-");
  const dataFormatada = `${dia}/${mes}/${ano}`;

  try {
    const tx = await contract.registrarMensagem(museuAtualId, nome, texto, dataFormatada);
    await tx.wait();
    document.getElementById("livroForm").classList.add("hidden");
    document.getElementById("livroTxSuccess").classList.remove("hidden");
    document.getElementById("visNome").value = "";
    document.getElementById("visData").value = "";
    document.getElementById("visMensagem").value = "";
    document.getElementById("visNomeCount").textContent = "0/60";
    document.getElementById("visMsgCount").textContent = "0/280";
    await carregarMensagensLivro();
  } catch(err) {
    console.error(err);
    if (err.code === "ACTION_REJECTED") alert("Transação cancelada.");
    else if (err.message?.includes("Livro lotado")) alert("O livro está lotado. O museu precisa adicionar mais páginas.");
    else alert("Erro ao registrar mensagem.");
  } finally {
    btn.disabled = false; txt.classList.remove("hidden"); ldr.classList.add("hidden");
  }
});

document.getElementById("btnRegistrarOutra").onclick = () => {
  document.getElementById("livroTxSuccess").classList.add("hidden");
  document.getElementById("livroForm").classList.remove("hidden");
};

document.getElementById("btnVoltar").onclick = () => { mostrarTela("telaMuseus"); carregarMuseus(); };

async function abrirPainel() {
  mostrarTela("telaPainel");

  if (!enderecoAtual) {
    document.getElementById("painelConectar").classList.remove("hidden");
    document.getElementById("painelCadastro").classList.add("hidden");
    document.getElementById("painelExistente").classList.add("hidden");
    return;
  }

  try {
    const rc = getRC();
    const temMuseu = await rc.ehMuseu(enderecoAtual);
    document.getElementById("painelConectar").classList.add("hidden");
    if (!temMuseu) {
      document.getElementById("painelCadastro").classList.remove("hidden");
      document.getElementById("painelExistente").classList.add("hidden");
    } else {
      const museuId = await rc.museuDoEndereco(enderecoAtual);
      await carregarDadosPainel(Number(museuId));
    }
  } catch(err) { console.error(err); }
}

document.getElementById("btnConectarMuseu").onclick = async () => {
  const ok = await conectarCarteira();
  if (ok) { renderNav("museu"); await abrirPainel(); }
};

async function carregarDadosPainel(museuId) {
  document.getElementById("painelCadastro").classList.add("hidden");
  document.getElementById("painelExistente").classList.remove("hidden");

  try {
    const rc = getRC();
    const museu  = await rc.museus(museuId);
    const status = await rc.statusLivro(museuId);

    document.getElementById("painelNome").textContent   = museu.nome;
    document.getElementById("painelCidade").textContent = museu.cidade;

    const total     = Number(status.totalMensagens);
    const capacidade= Number(status.capacidade);
    const paginas   = Number(status.totalPaginas);
    const livres    = capacidade - total;
    const pct       = capacidade === 0 ? 0 : Math.round((total / capacidade) * 100);

    document.getElementById("statMensagens").textContent  = total;
    document.getElementById("statPaginas").textContent    = paginas;
    document.getElementById("statCapacidade").textContent = capacidade;
    document.getElementById("statLivres").textContent     = livres;
    document.getElementById("progressoPct").textContent   = `${pct}%`;
    document.getElementById("progressoFill").style.width  = `${pct}%`;

    document.getElementById("btnVerLivro").onclick = () => {
      museuAtualId = museuId;
      museuAtualDados = museu;
      paginaAtualLivro = 1;
      document.getElementById("livroNomeMuseu").textContent = museu.nome;
      document.getElementById("livroCidadeMuseu").textContent = museu.cidade;
      mostrarTela("telaLivro");
      carregarMensagensLivro();
      atualizarStatusLivro();
    };

    document.getElementById("btnAddPaginas").onclick = async () => {
      const qtd = parseInt(document.getElementById("addQtd").value);
      if (!qtd || qtd < 1) return;
      const st = document.getElementById("addPaginasStatus");
      st.textContent = "Processando...";
      try {
        const tx = await contract.adicionarPaginas(museuId, qtd);
        await tx.wait();
        st.textContent = `✓ ${qtd} página(s) adicionada(s)!`;
        await carregarDadosPainel(museuId);
      } catch(err) { st.textContent = "Erro ao adicionar páginas."; }
    };
  } catch(err) { console.error(err); }
}


document.getElementById("cadastroForm").addEventListener("submit", async e => {
  e.preventDefault();
  const nome     = document.getElementById("cadNome").value.trim();
  const cidade   = document.getElementById("cadCidade").value.trim();
  const descricao= document.getElementById("cadDescricao").value.trim();
  const paginas  = parseInt(document.getElementById("cadPaginas").value);
  if (!nome || !cidade || !descricao || !paginas) { alert("Preencha todos os campos."); return; }

  const btn = document.getElementById("btnCadastrar");
  const txt = document.getElementById("btnCadastrarTxt");
  const ldr = document.getElementById("btnCadastrarLoader");
  btn.disabled = true; txt.classList.add("hidden"); ldr.classList.remove("hidden");

  try {
    const tx = await contract.cadastrarMuseu(nome, descricao, cidade, paginas);
    await tx.wait();
    const rc = getRC();
    const museuId = await rc.museuDoEndereco(enderecoAtual);
    renderNav("museu");
    await carregarDadosPainel(Number(museuId));
  } catch(err) {
    console.error(err);
    if (err.code === "ACTION_REJECTED") alert("Transação cancelada.");
    else alert("Erro ao cadastrar museu.");
  } finally {
    btn.disabled = false; txt.classList.remove("hidden"); ldr.classList.add("hidden");
  }
});

document.getElementById("btnVoltarPainel").onclick = irParaInicio;

// Contadores
document.getElementById("visNome").oninput = e => document.getElementById("visNomeCount").textContent = `${e.target.value.length}/60`;
document.getElementById("visMensagem").oninput = e => document.getElementById("visMsgCount").textContent = `${e.target.value.length}/280`;

// MetaMask
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged",    () => location.reload());
}

// Helper
function esc(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
