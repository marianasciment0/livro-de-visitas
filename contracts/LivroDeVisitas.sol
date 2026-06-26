// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Livro de Visitas — Museus
/// @notice Museus cadastram seus livros de visitas. Visitantes deixam mensagens imutáveis.
contract LivroDeVisitas {

    // ── Configuração ──────────────────────────────────────────
    uint256 public constant MENSAGENS_POR_PAGINA = 5; // alterável em nova versão do contrato

    // ── Estruturas ────────────────────────────────────────────
    struct Mensagem {
        string  nome;
        string  texto;
        string  dataVisita;   // digitada pelo visitante
        uint256 timestamp;    // automático pelo bloco
        uint256 pagina;
    }

    struct Museu {
        address dono;
        string  nome;
        string  descricao;
        string  cidade;
        uint256 totalPaginas;
        bool    ativo;
        uint256 totalMensagens;
    }

    // ── Armazenamento ─────────────────────────────────────────
    uint256 public totalMuseus;

    mapping(uint256 => Museu)                          public museus;
    mapping(uint256 => Mensagem[])                     private mensagensPorMuseu;
    mapping(address => uint256)                        public museuDoEndereco; // endereço => id do museu (0 = não cadastrado)
    mapping(address => bool)                           public ehMuseu;

    // ── Eventos ───────────────────────────────────────────────
    event MuseuCadastrado(uint256 indexed id, address dono, string nome);
    event PaginasAdicionadas(uint256 indexed museuId, uint256 novoTotal);
    event MensagemRegistrada(uint256 indexed museuId, uint256 pagina, string nome);

    // ── Modificadores ─────────────────────────────────────────
    modifier apenasDonoMuseu(uint256 _museuId) {
        require(museus[_museuId].dono == msg.sender, "Apenas o dono pode fazer isso.");
        _;
    }

    // ─────────────────────────────────────────────────────────
    //  MUSEU
    // ─────────────────────────────────────────────────────────

    /// @notice Cadastra um novo museu. Cada carteira pode ter apenas um museu.
    function cadastrarMuseu(
        string calldata _nome,
        string calldata _descricao,
        string calldata _cidade,
        uint256 _paginasIniciais
    ) external {
        require(!ehMuseu[msg.sender], "Voce ja tem um museu cadastrado.");
        require(bytes(_nome).length > 0, "Nome obrigatorio.");
        require(_paginasIniciais > 0, "Minimo 1 pagina.");
        require(_paginasIniciais <= 100, "Maximo 100 paginas iniciais.");

        totalMuseus++;
        uint256 id = totalMuseus;

        museus[id] = Museu({
            dono:           msg.sender,
            nome:           _nome,
            descricao:      _descricao,
            cidade:         _cidade,
            totalPaginas:   _paginasIniciais,
            ativo:          true,
            totalMensagens: 0
        });

        museuDoEndereco[msg.sender] = id;
        ehMuseu[msg.sender] = true;

        emit MuseuCadastrado(id, msg.sender, _nome);
    }

    /// @notice Adiciona mais páginas ao livro do museu.
    function adicionarPaginas(uint256 _museuId, uint256 _quantidade)
        external
        apenasDonoMuseu(_museuId)
    {
        require(_quantidade > 0, "Quantidade deve ser maior que zero.");
        museus[_museuId].totalPaginas += _quantidade;
        emit PaginasAdicionadas(_museuId, museus[_museuId].totalPaginas);
    }

    // ─────────────────────────────────────────────────────────
    //  VISITANTE
    // ─────────────────────────────────────────────────────────

    /// @notice Registra uma mensagem no livro de visitas do museu.
    function registrarMensagem(
        uint256 _museuId,
        string calldata _nome,
        string calldata _texto,
        string calldata _dataVisita
    ) external {
        Museu storage museu = museus[_museuId];
        require(museu.ativo, "Museu nao encontrado.");
        require(bytes(_nome).length > 0 && bytes(_nome).length <= 60, "Nome invalido.");
        require(bytes(_texto).length > 0 && bytes(_texto).length <= 280, "Mensagem invalida.");
        require(bytes(_dataVisita).length > 0, "Data obrigatoria.");

        // Verifica se há espaço disponível
        uint256 capacidadeTotal = museu.totalPaginas * MENSAGENS_POR_PAGINA;
        require(museu.totalMensagens < capacidadeTotal, "Livro lotado. O museu precisa adicionar mais paginas.");

        // Calcula a página atual (base 1)
        uint256 paginaAtual = (museu.totalMensagens / MENSAGENS_POR_PAGINA) + 1;

        mensagensPorMuseu[_museuId].push(Mensagem({
            nome:       _nome,
            texto:      _texto,
            dataVisita: _dataVisita,
            timestamp:  block.timestamp,
            pagina:     paginaAtual
        }));

        museu.totalMensagens++;

        emit MensagemRegistrada(_museuId, paginaAtual, _nome);
    }

    // ─────────────────────────────────────────────────────────
    //  LEITURA
    // ─────────────────────────────────────────────────────────

    /// @notice Lista todos os museus ativos.
    function listarMuseus() external view returns (Museu[] memory) {
        Museu[] memory lista = new Museu[](totalMuseus);
        for (uint256 i = 1; i <= totalMuseus; i++) {
            lista[i - 1] = museus[i];
        }
        return lista;
    }

    /// @notice Retorna todas as mensagens de um museu.
    function listarMensagens(uint256 _museuId) external view returns (Mensagem[] memory) {
        return mensagensPorMuseu[_museuId];
    }

    /// @notice Retorna mensagens de uma página específica.
    function listarMensagensPorPagina(uint256 _museuId, uint256 _pagina)
        external view returns (Mensagem[] memory)
    {
        Mensagem[] memory todas = mensagensPorMuseu[_museuId];
        uint256 inicio = (_pagina - 1) * MENSAGENS_POR_PAGINA;
        uint256 fim = inicio + MENSAGENS_POR_PAGINA;
        if (fim > todas.length) fim = todas.length;

        Mensagem[] memory pagina = new Mensagem[](fim - inicio);
        for (uint256 i = inicio; i < fim; i++) {
            pagina[i - inicio] = todas[i];
        }
        return pagina;
    }

    /// @notice Retorna o ID do museu de um endereço.
    function meuMuseu() external view returns (uint256) {
        return museuDoEndereco[msg.sender];
    }

    /// @notice Retorna capacidade e ocupação de um museu.
    function statusLivro(uint256 _museuId) external view returns (
        uint256 totalMensagens,
        uint256 capacidade,
        uint256 paginaAtual,
        uint256 totalPaginas
    ) {
        Museu storage m = museus[_museuId];
        totalMensagens = m.totalMensagens;
        capacidade     = m.totalPaginas * MENSAGENS_POR_PAGINA;
        paginaAtual    = totalMensagens == 0 ? 1 : (totalMensagens / MENSAGENS_POR_PAGINA) + 1;
        totalPaginas   = m.totalPaginas;
    }
}
