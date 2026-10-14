let alunos = JSON.parse(localStorage.getItem('tatame_alunos')) || [
    { id: '1', nome: 'Carlos Silva', turma: 'Adultos', faixa: 'Azul', graus: '2', foto: '' },
    { id: '2', nome: 'Mariana Souza', turma: 'Kids 1', faixa: 'Amarela', graus: '1', foto: '' }
];

let chamadas = JSON.parse(localStorage.getItem('tatame_chamadas')) || {};

document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataChamada').value = hoje;
    
    carregarChamada();
    renderizarAlunos();
    renderizarRelatorios();
    atualizarEstatisticas();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'relatorios') {
        renderizarRelatorios();
    }
}

function salvarDados() {
    localStorage.setItem('tatame_alunos', JSON.stringify(alunos));
    localStorage.setItem('tatame_chamadas', JSON.stringify(chamadas));
    atualizarEstatisticas();
}

function salvarAluno(event) {
    event.preventDefault();
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('nomeAluno').value.trim();
    const turma = document.getElementById('turmaAluno').value;
    const faixa = document.getElementById('faixaAluno').value;
    const graus = document.getElementById('grausAluno').value;
    const foto = document.getElementById('fotoAluno').value.trim();

    if (!nome) return;

    if (id) {
        const aluno = alunos.find(a => a.id === id);
        if (aluno) {
            aluno.nome = nome;
            aluno.turma = turma;
            aluno.faixa = faixa;
            aluno.graus = graus;
            aluno.foto = foto;
        }
    } else {
        const novoAluno = {
            id: Date.now().toString(),
            nome,
            turma,
            faixa,
            graus,
            foto
        };
        alunos.push(novoAluno);
    }

    salvarDados();
    cancelarEdicao();
    renderizarAlunos();
    carregarChamada();
}

function renderizarAlunos() {
    const tbody = document.getElementById('tabelaAlunos');
    tbody.innerHTML = '';

    const termo = document.getElementById('buscaAluno').value.toLowerCase();
    const turmaFiltro = document.getElementById('filtroTurmaGerenciar').value;

    const alunosFiltrados = alunos.filter(a => {
        const matchNome = a.nome.toLowerCase().includes(termo);
        const matchTurma = turmaFiltro ? a.turma === turmaFiltro : true;
        return matchNome && matchTurma;
    });

    if (alunosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    alunosFiltrados.forEach(aluno => {
        const totalPresencas = calcularTotalPresencas(aluno.id);
        const avatarUrl = aluno.foto ? aluno.foto : 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
        const turmaBadge = aluno.turma || 'Adultos';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="aluno-info">
                    <img src="${avatarUrl}" class="aluno-avatar" alt="Foto">
                    <span>${aluno.nome}</span>
                </div>
            </td>
            <td><span class="badge-turma">${turmaBadge}</span></td>
            <td>
                <span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span>
                <span class="graus-texto">${aluno.graus} ${aluno.graus == '1' ? 'Grau' : 'Graus'}</span>
            </td>
            <td><strong>${totalPresencas}</strong> aulas</td>
            <td>
                <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editarAluno('${aluno.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="excluirAluno('${aluno.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarAlunos() {
    renderizarAlunos();
}

function editarAluno(id) {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;

    document.getElementById('alunoId').value = aluno.id;
    document.getElementById('nomeAluno').value = aluno.nome;
    document.getElementById('turmaAluno').value = aluno.turma || 'Adultos';
    document.getElementById('faixaAluno').value = aluno.faixa;
    document.getElementById('grausAluno').value = aluno.graus || '0';
    document.getElementById('fotoAluno').value = aluno.foto || '';
    document.getElementById('btnSalvarAluno').innerHTML = `<i class="fa-solid fa-check"></i> Salvar Alterações`;
    document.getElementById('btnCancelarEdicao').style.display = 'inline-flex';
}

function cancelarEdicao() {
    document.getElementById('formAluno').reset();
    document.getElementById('alunoId').value = '';
    document.getElementById('btnSalvarAluno').innerHTML = `<i class="fa-solid fa-plus"></i> Cadastrar Aluno`;
    document.getElementById('btnCancelarEdicao').style.display = 'none';
}

function excluirAluno(id) {
    if (confirm('Deseja realmente excluir este aluno?')) {
        alunos = alunos.filter(a => a.id !== id);
        salvarDados();
        renderizarAlunos();
        carregarChamada();
    }
}

function carregarChamada() {
    const data = document.getElementById('dataChamada').value;
    const turmaSelecionada = document.getElementById('filtroTurmaChamada').value;
    const tbody = document.getElementById('listaChamada');
    tbody.innerHTML = '';

    if (!chamadas[data]) {
        chamadas[data] = {};
    }

    const alunosDaTurma = alunos.filter(a => (a.turma || 'Adultos') === turmaSelecionada);

    if (alunosDaTurma.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">Nenhum aluno cadastrado na turma "${turmaSelecionada}".</td></tr>`;
        atualizarEstatisticas();
        return;
    }

    alunosDaTurma.forEach(aluno => {
        const status = chamadas[data][aluno.id] || 'Ausente';
        const avatarUrl = aluno.foto ? aluno.foto : 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="aluno-info">
                    <img src="${avatarUrl}" class="aluno-avatar" alt="Foto">
                    <span>${aluno.nome}</span>
                </div>
            </td>
            <td>
                <span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span>
                <span class="graus-texto">${aluno.graus} ${aluno.graus == '1' ? 'Grau' : 'Graus'}</span>
            </td>
            <td>
                <div class="status-buttons" id="status-group-${aluno.id}">
                    <button type="button" class="status-btn ${status === 'Presente' ? 'active-presente' : ''}" onclick="mudarStatus('${aluno.id}', 'Presente')">Presente</button>
                    <button type="button" class="status-btn ${status === 'Ausente' ? 'active-ausente' : ''}" onclick="mudarStatus('${aluno.id}', 'Ausente')">Ausente</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    atualizarEstatisticas();
}

function mudarStatus(alunoId, status) {
    const data = document.getElementById('dataChamada').value;
    if (!chamadas[data]) chamadas[data] = {};
    
    chamadas[data][alunoId] = status;

    const group = document.getElementById(`status-group-${alunoId}`);
    if (group) {
        group.querySelectorAll('.status-btn').forEach(btn => {
            btn.className = 'status-btn';
        });

        if (status === 'Presente') group.children[0].classList.add('active-presente');
        if (status === 'Ausente') group.children[1].classList.add('active-ausente');
    }

    salvarDados();
}

function marcarTodos(status) {
    const data = document.getElementById('dataChamada').value;
    const turmaSelecionada = document.getElementById('filtroTurmaChamada').value;
    if (!chamadas[data]) chamadas[data] = {};

    const alunosDaTurma = alunos.filter(a => (a.turma || 'Adultos') === turmaSelecionada);
    alunosDaTurma.forEach(aluno => {
        chamadas[data][aluno.id] = status;
    });

    salvarDados();
    carregarChamada();
}

function salvarChamada() {
    salvarDados();
    alert('Chamada salva com sucesso!');
}

function calcularTotalPresencas(alunoId) {
    let total = 0;
    Object.values(chamadas).forEach(dia => {
        if (dia[alunoId] === 'Presente') total++;
    });
    return total;
}

function atualizarEstatisticas() {
    document.getElementById('totalAlunos').innerText = alunos.length;

    const data = document.getElementById('dataChamada').value;
    const turmaSelecionada = document.getElementById('filtroTurmaChamada').value;
    const alunosDaTurma = alunos.filter(a => (a.turma || 'Adultos') === turmaSelecionada);

    let presentes = 0;
    if (chamadas[data]) {
        alunosDaTurma.forEach(aluno => {
            if (chamadas[data][aluno.id] === 'Presente') presentes++;
        });
    }
    document.getElementById('presentesHoje').innerText = presentes;
}

function renderizarRelatorios() {
    const tbody = document.getElementById('tabelaRelatorio');
    tbody.innerHTML = '';

    const turmaFiltro = document.getElementById('filtroTurmaRelatorio').value;
    const alunosFiltrados = turmaFiltro ? alunos.filter(a => a.turma === turmaFiltro) : alunos;

    if (alunosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum dado para exibir.</td></tr>`;
        return;
    }

    alunosFiltrados.forEach(aluno => {
        const total = calcularTotalPresencas(aluno.id);
        const avatarUrl = aluno.foto ? aluno.foto : 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
        const turmaBadge = aluno.turma || 'Adultos';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="aluno-info">
                    <img src="${avatarUrl}" class="aluno-avatar" alt="Foto">
                    <span>${aluno.nome}</span>
                </div>
            </td>
            <td><span class="badge-turma">${turmaBadge}</span></td>
            <td>
                <span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span>
                <span class="graus-texto">${aluno.graus} ${aluno.graus == '1' ? 'Grau' : 'Graus'}</span>
            </td>
            <td><strong>${total}</strong></td>
            <td><button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="abrirHistorico('${aluno.id}')"><i class="fa-solid fa-calendar-days"></i> Ver Datas</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirHistorico(alunoId) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    document.getElementById('modalNomeAluno').innerText = `Histórico: ${aluno.nome}`;
    const listaDatas = document.getElementById('listaHistoricoDatas');
    listaDatas.innerHTML = '';

    let datasPresente = [];
    Object.keys(chamadas).forEach(data => {
        if (chamadas[data][alunoId] === 'Presente') {
            datasPresente.push(data);
        }
    });

    datasPresente.sort().reverse();

    if (datasPresente.length === 0) {
        listaDatas.innerHTML = `<li style="text-align: center; color: var(--text-secondary);">Nenhuma presença registrada.</li>`;
    } else {
        datasPresente.forEach(dataStr => {
            const [ano, mes, dia] = dataStr.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            const li = document.createElement('li');
            li.innerHTML = `<span><i class="fa-regular fa-calendar-check" style="color: var(--success);"></i> Aula realizada</span> <strong>${dataFormatada}</strong>`;
            listaDatas.appendChild(li);
        });
    }

    document.getElementById('modalHistorico').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modalHistorico').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalHistorico');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}