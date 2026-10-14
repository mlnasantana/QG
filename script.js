// Dados iniciais ou recuperados do localStorage
let alunos = JSON.parse(localStorage.getItem('tatame_alunos')) || [
    { id: '1', nome: 'Carlos Silva', faixa: 'Azul' },
    { id: '2', nome: 'Mariana Souza', faixa: 'Roxa' },
    { id: '3', nome: 'Pedro Henrique', faixa: 'Branca' }
];

let chamadas = JSON.parse(localStorage.getItem('tatame_chamadas')) || {};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataChamada').value = hoje;
    
    carregarChamada();
    renderizarAlunos();
    renderizarRelatorios();
    atualizarEstatisticas();
});

// Controle de Abas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'relatorios') {
        renderizarRelatorios();
    }
}

// Salvar dados no navegador
function salvarDados() {
    localStorage.setItem('tatame_alunos', JSON.stringify(alunos));
    localStorage.setItem('tatame_chamadas', JSON.stringify(chamadas));
    atualizarEstatisticas();
}

// Gerenciamento de Alunos
function salvarAluno(event) {
    event.preventDefault();
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('nomeAluno').value.trim();
    const faixa = document.getElementById('faixaAluno').value;

    if (!nome) return;

    if (id) {
        // Editar
        const aluno = alunos.find(a => a.id === id);
        if (aluno) {
            aluno.nome = nome;
            aluno.faixa = faixa;
        }
    } else {
        // Novo
        const novoAluno = {
            id: Date.now().toString(),
            nome,
            faixa
        };
        alunos.push(novoAluno);
    }

    salvarDados();
    cancelarEdicao();
    renderizarAlunos();
    carregarChamada();
}

function renderizarAlunos(filtro = '') {
    const tbody = document.getElementById('tabelaAlunos');
    tbody.innerHTML = '';

    const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(filtro.toLowerCase()));

    if (alunosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    alunosFiltrados.forEach(aluno => {
        const totalPresencas = calcularTotalPresencas(aluno.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${aluno.nome}</td>
            <td><span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span></td>
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
    const termo = document.getElementById('buscaAluno').value;
    renderizarAlunos(termo);
}

function editarAluno(id) {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;

    document.getElementById('alunoId').value = aluno.id;
    document.getElementById('nomeAluno').value = aluno.nome;
    document.getElementById('faixaAluno').value = aluno.faixa;
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

// Chamada do Dia
function carregarChamada() {
    const data = document.getElementById('dataChamada').value;
    const tbody = document.getElementById('listaChamada');
    tbody.innerHTML = '';

    if (!chamadas[data]) {
        chamadas[data] = {};
    }

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">Cadastre alunos na aba "Gerenciar Alunos" primeiro.</td></tr>`;
        return;
    }

    alunos.forEach(aluno => {
        const status = chamadas[data][aluno.id] || 'Ausente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${aluno.nome}</td>
            <td><span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span></td>
            <td>
                <div class="status-buttons" id="status-group-${aluno.id}">
                    <button type="button" class="status-btn ${status === 'Presente' ? 'active-presente' : ''}" onclick="mudarStatus('${aluno.id}', 'Presente')">Presente</button>
                    <button type="button" class="status-btn ${status === 'Ausente' ? 'active-ausente' : ''}" onclick="mudarStatus('${aluno.id}', 'Ausente')">Ausente</button>
                    <button type="button" class="status-btn ${status === 'Justificado' ? 'active-justificado' : ''}" onclick="mudarStatus('${aluno.id}', 'Justificado')">Just. korban</button>
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

    // Atualiza classes visuais dos botões
    const group = document.getElementById(`status-group-${alunoId}`);
    group.querySelectorAll('.status-btn').forEach(btn => {
        btn.className = 'status-btn';
    });

    if (status === 'Presente') group.children[0].classList.add('active-presente');
    if (status === 'Ausente') group.children[1].classList.add('active-ausente');
    if (status === 'Justificado') group.children[2].classList.add('active-justificado');

    salvarDados();
}

function marcarTodos(status) {
    const data = document.getElementById('dataChamada').value;
    if (!chamadas[data]) chamadas[data] = {};

    alunos.forEach(aluno => {
        chamadas[data][aluno.id] = status;
    });

    salvarDados();
    carregarChamada();
}

function salvarChamada() {
    salvarDados();
    alert('Chamada salva com sucesso!');
}

// Relatórios e Estatísticas
function calcularTotalPresencas(alunoId) {
    let total = 0;
    Object.values(chamadas).forEach(dia => {
        if (dia[alunoId] === 'Presente') total++;
    });
    return total;
}

function atualizarEstatisticas() {
    const data = document.getElementById('dataChamada').value;
    document.getElementById('totalAlunos').innerText = alunos.length;

    let presentes = 0;
    if (chamadas[data]) {
        Object.values(chamadas[data]).forEach(status => {
            if (status === 'Presente') presentes++;
        });
    }
    document.getElementById('presentesHoje').innerText = presentes;
}

function renderizarRelatorios() {
    const tbody = document.getElementById('tabelaRelatorio');
    tbody.innerHTML = '';

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Nenhum dado para exibir.</td></tr>`;
        return;
    }

    alunos.forEach(aluno => {
        const total = calcularTotalPresencas(aluno.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${aluno.nome}</td>
            <td><span class="badge badge-${aluno.faixa.toLowerCase()}">${aluno.faixa}</span></td>
            <td><strong>${total}</strong></td>
            <td><button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="abrirHistorico('${aluno.id}')"><i class="fa-solid fa-calendar-days"></i> Ver Datas</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal de Histórico
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

    // Ordenar da mais recente para a mais antiga
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