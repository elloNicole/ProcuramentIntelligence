/* Protótipo navegável: painel, pedidos, fornecedores, materiais e revisão humana.
   Estado só em memória: ao atualizar a página, tudo volta ao início. */
(function () {
  var F = PI.f, esc = F.esc, S;
  var view = document.getElementById('view'), toastEl = document.getElementById('toast'), tt;

  function init() { S = { d: PI.clone(), cfg: { regime: 'real', icms: 18 }, rev: {}, fil: 'todos', qf: '', qm: '', um: 'todas', po: 188 }; }
  init();

  var mat = function (id) { return S.d.mats.filter(function (m) { return m.id === id; })[0]; };
  var forn = function (id) { return S.d.forns.filter(function (f) { return f.id === id; })[0]; };
  var req = function (id) { return S.d.reqs.filter(function (r) { return r.id === id; })[0]; };

  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 3200); }

  /* ---------- rótulos ---------- */
  var ST_REQ = { aguardando_cotacao: ['Aguardando cotação', 'wait'], em_revisao: ['Em revisão humana', 'med'], fechado: ['Pedido fechado', 'ok'], cancelado: ['Cancelado', 'nd'] };
  var ST_CONV = { recebida: ['Respondeu', 'ok'], incompleta: ['Resposta incompleta', 'part'], aguardando: ['Aguardando', 'wait'], sem_resposta: ['Sem resposta', 'bad'] };
  var chip = function (map, k) { return '<span class="ch ' + map[k][1] + '">' + map[k][0] + '</span>'; };
  var urgChip = function (n) { return '<span class="ch ' + n + '">' + PI.URG_L[n] + '</span>'; };

  /* ---------- cálculos ---------- */
  function stats(r) {
    var c = r.conv, s = { env: c.length, resp: 0, parc: 0, aguard: 0, sem: 0 };
    c.forEach(function (x) { if (x.st === 'recebida') s.resp++; else if (x.st === 'incompleta') s.parc++; else if (x.st === 'aguardando') s.aguard++; else s.sem++; });
    s.got = s.resp + s.parc;
    return s;
  }
  function maxUrg(r) { var best = 3; r.itens.forEach(function (i) { var u = PI.urg(mat(i.mat)); if (u.rank < best) best = u.rank; }); return ['crit', 'alta', 'med', 'baixa'][best]; }

  function rank(r, it) {
    var m = mat(it.mat), L = [];
    r.conv.forEach(function (c) {
      var qt = c.q[it.id]; if (!qt) return;
      var res = PI.quoteCalc(r, m, qt, S.cfg), f = forn(c.f);
      L.push({ c: c, f: f, q: qt, res: res, perT: res.efetivo / qt.q });
    });
    if (!L.length) return L;
    var minP = Math.min.apply(null, L.map(function (x) { return x.perT; })), minL = Math.min.apply(null, L.map(function (x) { return x.q.lt; }));
    L.forEach(function (x) {
      x.sc = { custo: minP / x.perT * 100, lt: minL / x.q.lt * 100, hist: x.f.score, esg: x.f.esg ? 100 : 0 };
      x.score = 0.4 * x.sc.custo + 0.2 * x.sc.lt + 0.2 * x.sc.hist + 0.2 * x.sc.esg;
    });
    L.sort(function (a, b) { return b.score - a.score; });
    return L;
  }

  /* ---------- painel ---------- */
  function vPainel() {
    var rs = S.d.reqs, abertos = rs.filter(function (r) { return r.status !== 'fechado' && r.status !== 'cancelado'; });
    var env = 0, got = 0, sem = 0;
    abertos.forEach(function (r) { var s = stats(r); env += s.env; got += s.got; sem += s.sem; });
    var rev = rs.filter(function (r) { return r.status === 'em_revisao'; }).length;
    var crit = S.d.mats.filter(function (m) { return PI.urg(m).n === 'crit'; }).length;
    var h = '<div class="ph"><div><h1>Painel de compras</h1><p>Pedidos, cotações enviadas, fornecedores e urgência dos materiais.</p></div></div>';
    h += '<div class="kpis">' +
      kp('Pedidos abertos', abertos.length, abertos.length + ' de ' + rs.length + ' no total') +
      kp('Aguardando revisão', rev, 'decisão humana pendente', rev ? 'hi' : '') +
      kp('Cotações respondidas', got + '/' + env, env ? Math.round(got / env * 100) + '% dos convites' : '') +
      kp('Sem resposta', sem, 'após lembretes', sem ? 'al' : '') +
      kp('Materiais críticos', crit, 'estoque não cobre o lead time', crit ? 'al' : '') + '</div>';

    h += '<section class="pn"><div class="hd"><h2>Pedidos de compra</h2><a class="lk" href="#/pedidos">Ver todos</a></div><div class="tw">' + tabelaPedidos(rs.slice().sort(ordPed)) + '</div></section>';

    /* matriz fornecedor x pedido */
    var cols = abertos, fs = {};
    cols.forEach(function (r) { r.conv.forEach(function (c) { fs[c.f] = 1; }); });
    h += '<section class="pn"><div class="hd"><h2>Cotações enviadas: quem respondeu</h2><span>Pedidos abertos</span></div><div class="tw"><table class="t mx"><thead><tr><th scope="col">Fornecedor</th>';
    cols.forEach(function (r) { h += '<th scope="col"><a class="lk" href="#/pedido/' + r.id + '">' + r.id.replace('REQ-2026-', 'REQ ') + '</a></th>'; });
    h += '</tr></thead><tbody>';
    Object.keys(fs).sort().forEach(function (fid) {
      var f = forn(fid);
      h += '<tr><td><b>' + esc(f.nome) + '</b><span class="sub">' + PI.PAISES[f.pais] + '</span></td>';
      cols.forEach(function (r) {
        var c = r.conv.filter(function (x) { return x.f === fid; })[0];
        h += '<td>' + (c ? chip(ST_CONV, c.st) + (c.lemb ? '<span class="sub">' + c.lemb + ' lembrete' + (c.lemb > 1 ? 's' : '') + '</span>' : '') : '<span class="ch nd">Não enviado</span>') + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div></section>';

    h += '<section class="pn"><div class="hd"><h2>Urgência dos materiais</h2><a class="lk" href="#/materiais">Base de materiais</a></div><div class="tw">' + tabelaMateriais(S.d.mats, 7) + '</div>' + legCov() + '</section>';
    return h;
  }
  function kp(l, v, s, cls) { return '<div class="kp ' + (cls || '') + '"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div></div>'; }
  function ordPed(a, b) {
    var o = { em_revisao: 0, aguardando_cotacao: 1, fechado: 2, cancelado: 3 };
    return o[a.status] - o[b.status] || a.prazo - b.prazo;
  }
  function tabelaPedidos(list) {
    var h = '<table class="t"><thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Itens</th><th scope="col">Porto</th><th scope="col">Cotações</th><th scope="col">Prazo limite</th><th scope="col">Urgência</th><th scope="col">Status</th><th scope="col"><span class="sr">Ação</span></th></tr></thead><tbody>';
    if (!list.length) h += '<tr><td colspan="9">Nenhum pedido neste filtro.</td></tr>';
    list.forEach(function (r) {
      var s = stats(r), fechado = r.status === 'fechado';
      var itens = r.itens.map(function (i) { return esc(mat(i.mat).produto) + ' · ' + i.qtd + ' t'; }).join('<br>');
      h += '<tr><td class="nw"><a class="lk" href="#/pedido/' + r.id + '">' + r.id + '</a></td><td>' + esc(r.cliente) + '</td><td class="it">' + itens + '</td><td>' + r.porto + '</td>' +
        '<td class="nw num">' + s.got + ' de ' + s.env + ' responderam' + (s.sem ? '<span class="sub">' + s.sem + ' sem resposta</span>' : '') + '</td>' +
        '<td class="nw">' + (fechado ? '<span class="sub">encerrado</span>' : F.rest(r.prazo)) + '</td>' +
        '<td>' + (fechado ? '<span class="ch nd">—</span>' : urgChip(maxUrg(r))) + '</td><td>' + chip(ST_REQ, r.status) + '</td>' +
        '<td class="nw"><a class="btn sm' + (r.status === 'em_revisao' ? ' main' : '') + '" href="#/pedido/' + r.id + '">' + (r.status === 'em_revisao' ? 'Revisar' : 'Abrir') + '</a></td></tr>';
    });
    return h + '</tbody></table>';
  }
  function legCov() { return '<div class="leg"><span><i style="background:var(--ink)"></i>Cobertura de estoque (dias)</span><span><i style="background:var(--warn)"></i>Lead time de importação</span><span>Urgência = cobertura − lead time (crítica ≤ 0 · alta ≤ 10 · média ≤ 30 dias)</span></div>'; }

  function reqAbertaDe(mid) {
    return S.d.reqs.filter(function (r) { return r.status !== 'fechado' && r.status !== 'cancelado' && r.itens.some(function (i) { return i.mat === mid; }); })[0];
  }
  function tabelaMateriais(list, limit) {
    var arr = list.slice().sort(function (a, b) { return PI.urg(a).rank - PI.urg(b).rank || PI.urg(a).margem - PI.urg(b).margem; });
    if (limit) arr = arr.slice(0, limit);
    var h = '<table class="t"><thead><tr><th scope="col">Material</th><th scope="col">NCM</th><th scope="col" class="r">Estoque</th><th scope="col" class="r">Consumo/mês</th><th scope="col">Cobertura × lead time</th><th scope="col" class="r">Margem</th><th scope="col">Urgência</th><th scope="col">Pedido aberto</th></tr></thead><tbody>';
    if (!arr.length) h += '<tr><td colspan="8">Nenhum material neste filtro.</td></tr>';
    arr.forEach(function (m) {
      var u = PI.urg(m), sc = 140, r = reqAbertaDe(m.id);
      h += '<tr><td><b>' + esc(m.produto) + '</b><span class="sub">' + esc(m.esp) + '</span></td><td class="nw num">' + m.ncm + '</td><td class="r num">' + m.estoque + ' t</td><td class="r num">' + m.consumo + ' t</td>' +
        '<td style="min-width:190px"><div class="cov' + (u.n === 'crit' ? ' cr' : '') + '" role="img" aria-label="Cobertura ' + F.n0.format(u.cob) + ' dias, lead time ' + m.lt + ' dias"><i style="width:' + Math.min(100, u.cob / sc * 100) + '%"></i><b style="left:' + Math.min(99, m.lt / sc * 100) + '%"></b></div><span class="sub num">' + F.n0.format(u.cob) + ' d de estoque · lead time ' + m.lt + ' d</span></td>' +
        '<td class="r num nw">' + (u.margem > 0 ? '+' : '') + F.n0.format(u.margem) + ' d</td><td>' + urgChip(u.n) + '</td>' +
        '<td class="nw">' + (r ? '<a class="lk" href="#/pedido/' + r.id + '">' + r.id.replace('REQ-2026-', 'REQ ') + '</a>' : (u.n === 'crit' || u.n === 'alta' ? '<span class="ch bad">Sem pedido</span>' : '<span class="sub">—</span>')) + '</td></tr>';
    });
    return h + '</tbody></table>';
  }

  /* ---------- listas ---------- */
  function vPedidos() {
    var fl = [['todos', 'Todos'], ['em_revisao', 'Em revisão'], ['aguardando_cotacao', 'Aguardando cotação'], ['fechado', 'Fechados']];
    var list = S.d.reqs.filter(function (r) { return S.fil === 'todos' || r.status === S.fil; }).sort(ordPed);
    var h = '<div class="ph"><div><h1>Pedidos de compra</h1><p>Requisições dos clientes e o andamento das cotações.</p></div></div><div class="tabs" role="group" aria-label="Filtrar por status" style="margin-bottom:16px">';
    fl.forEach(function (f) { h += '<button type="button" data-act="fil" data-v="' + f[0] + '" aria-pressed="' + (S.fil === f[0]) + '">' + f[1] + '</button>'; });
    return h + '</div><section class="pn"><div class="tw">' + tabelaPedidos(list) + '</div></section>';
  }

  function tabelaForn() {
    var q = S.qf.toLowerCase();
    var list = S.d.forns.filter(function (f) { return !q || (f.nome + ' ' + PI.PAISES[f.pais]).toLowerCase().indexOf(q) > -1; });
    var h = '<table class="t"><thead><tr><th scope="col">Fornecedor</th><th scope="col">País</th><th scope="col">Score histórico</th><th scope="col">Selo ESG</th><th scope="col" class="r">Resp. média</th><th scope="col" class="r">Taxa de resposta</th><th scope="col">Convites abertos</th><th scope="col">Contato</th></tr></thead><tbody>';
    if (!list.length) h += '<tr><td colspan="8">Nenhum fornecedor encontrado.</td></tr>';
    list.forEach(function (f) {
      var ab = 0; S.d.reqs.forEach(function (r) { if (r.status !== 'fechado') r.conv.forEach(function (c) { if (c.f === f.id && (c.st === 'aguardando' || c.st === 'sem_resposta' || c.st === 'incompleta')) ab++; }); });
      h += '<tr><td><b>' + esc(f.nome) + '</b></td><td>' + PI.PAISES[f.pais] + '</td><td style="min-width:150px"><div class="mini"><div class="cov"><i style="width:' + f.score + '%"></i></div><b class="num">' + f.score + '</b></div></td>' +
        '<td>' + (f.esg ? '<span class="ch ok">Sim</span>' : '<span class="ch nd">Não</span>') + '</td><td class="r num">' + f.resp + ' h</td><td class="r num">' + Math.round(f.rec / f.env * 100) + '% <span class="sub">' + f.rec + ' de ' + f.env + '</span></td>' +
        '<td>' + (ab ? '<span class="ch wait">' + ab + ' sem retorno</span>' : '<span class="sub">—</span>') + '</td><td class="nw">' + esc(f.mail) + '</td></tr>';
    });
    return h + '</tbody></table>';
  }
  function vForn() {
    return '<div class="ph"><div><h1>Fornecedores</h1><p>Cadastro e histórico de desempenho. O score alimenta o ranking de cada pedido.</p></div></div>' +
      '<section class="pn"><div class="toolbar"><div class="fld"><label for="qf">Buscar fornecedor ou país</label><input id="qf" type="search" value="' + esc(S.qf) + '" data-in="qf"></div></div><div class="tw" id="tf">' + tabelaForn() + '</div></section>';
  }
  function tabelaMat() {
    var q = S.qm.toLowerCase();
    var list = S.d.mats.filter(function (m) { return (S.um === 'todas' || PI.urg(m).n === S.um) && (!q || (m.produto + ' ' + m.ncm + ' ' + m.esp).toLowerCase().indexOf(q) > -1); });
    return tabelaMateriais(list);
  }
  function vMat() {
    var opts = [['todas', 'Todas'], ['crit', 'Crítica'], ['alta', 'Alta'], ['med', 'Média'], ['baixa', 'Baixa']].map(function (o) { return '<option value="' + o[0] + '"' + (S.um === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
    return '<div class="ph"><div><h1>Materiais e NCM</h1><p>Base de materiais com classificação fiscal, estoque e urgência de reposição.</p></div></div>' +
      '<section class="pn"><div class="toolbar"><div class="fld"><label for="qm">Buscar material ou NCM</label><input id="qm" type="search" value="' + esc(S.qm) + '" data-in="qm"></div><div class="fld"><label for="um">Urgência</label><select id="um" data-chg="um">' + opts + '</select></div></div><div class="tw" id="tm">' + tabelaMat() + '</div>' + legCov() + '</section>' +
      '<p class="hint">NCM e alíquotas são ilustrativas. A classificação fiscal deve ser confirmada com o despachante.</p>';
  }

  /* ---------- pedido ---------- */
  function rv(r) { return S.rev[r.id]; }
  function suggested(r) { var p = {}; r.itens.forEach(function (i) { var L = rank(r, i); if (L.length) p[i.id] = L[0].f.id; }); return p; }

  function vPedido(id) {
    var r = req(id); if (!r) return '<div class="ph"><h1>Pedido não encontrado</h1></div><a class="btn" href="#/painel">Voltar ao painel</a>';
    var s = stats(r), R = rv(r), rev = r.status === 'em_revisao';
    var h = '<div class="crumb"><a href="#/painel">Painel</a> / <a href="#/pedidos">Pedidos</a> / ' + r.id + '</div>';
    h += '<div class="ph"><div><h1>' + r.id + '</h1><p>' + esc(r.cliente) + ' · destino ' + r.porto + ' · criado ' + F.ago(r.criada) + ' · ' + (r.status === 'fechado' ? 'encerrado' : 'prazo limite ' + F.dt(r.prazo) + ' (' + F.rest(r.prazo) + ')') + '</p></div><div class="act" style="display:flex;gap:8px;flex-wrap:wrap">' + chip(ST_REQ, r.status) +
      (rev && !R ? '<button class="btn main" type="button" data-act="rev" data-id="' + r.id + '">Revisar pedido</button>' : '') + '</div></div>';

    /* etapas */
    var cur = r.status === 'fechado' ? 4 : rev ? 3 : s.got ? 2 : 1;
    var lab = ['Requisição criada', 'RFQ enviado', 'Cotações recebidas', 'Revisão humana', 'Pedido fechado'];
    h += '<ol class="steps">';
    lab.forEach(function (l, i) { h += '<li class="' + (i < cur ? 'done' : i === cur ? (cur === 4 ? 'fin' : 'cur') : '') + '"><span class="n">0' + (i + 1) + '</span><b>' + l + '</b></li>'; });
    h += '</ol>';

    if (r.status === 'fechado') {
      var pk = r.fechado.picks, resumo = r.itens.map(function (i) { var f = forn(pk[i.id]); return esc(mat(i.mat).produto) + ': ' + esc(f.nome); }).join(' · ');
      h += '<div class="banner"><div><b>Pedido fechado · ' + r.fechado.po + '</b><br><span class="hint" style="color:var(--ink)">' + resumo + ' · ' + F.dt(r.fechado.em) + '</span></div><button class="btn" type="button" disabled title="Planejado para a fase 2">Gerar PO em PDF · fase 2</button></div>';
    }

    if (R) h += painelRevisao(r, R);

    /* fornecedores consultados */
    h += '<section class="pn"><div class="hd"><h2>Fornecedores consultados</h2><span>' + s.got + ' de ' + s.env + ' responderam</span></div><div class="tw"><table class="t"><thead><tr><th scope="col">Fornecedor</th><th scope="col">Situação</th><th scope="col">Enviado</th><th scope="col" class="r">Lembretes</th><th scope="col"><span class="sr">Ação</span></th></tr></thead><tbody>';
    r.conv.forEach(function (c) {
      var f = forn(c.f), pend = c.st !== 'recebida' && r.status !== 'fechado';
      h += '<tr><td><b>' + esc(f.nome) + '</b><span class="sub">' + PI.PAISES[f.pais] + ' · ' + esc(f.mail) + '</span></td><td>' + chip(ST_CONV, c.st) + '</td><td class="nw">' + F.ago(c.env) + '</td><td class="r num">' + c.lemb + '</td>' +
        '<td class="nw">' + (pend ? '<button class="btn sm ghost" type="button" data-act="lemb" data-id="' + r.id + '" data-f="' + c.f + '">' + (c.st === 'incompleta' ? 'Pedir dados faltantes' : 'Enviar lembrete') + '</button>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div></section>';

    /* itens e cotações */
    r.itens.forEach(function (it) {
      var m = mat(it.mat), u = PI.urg(m), L = rank(r, it), pick = R && R.picks[it.id], fin = r.fechado && r.fechado.picks[it.id];
      h += '<section class="ibox"><div class="hd"><div><h3>' + esc(m.produto) + ' · ' + it.qtd + ' t</h3><span class="m">' + esc(m.esp) + ' · NCM ' + m.ncm + '</span></div><div>' + urgChip(u.n) + ' <span class="m">cobertura ' + F.n0.format(u.cob) + ' d × lead time ' + m.lt + ' d</span></div></div>';
      if (!L.length) { h += '<div class="bd" style="padding:18px"><span class="hint">Nenhuma cotação recebida ainda para este item.</span></div></section>'; return; }
      h += '<div class="tw"><table class="t"><thead><tr>' + (R ? '<th scope="col"><span class="sr">Escolha</span></th>' : '') + '<th scope="col">Fornecedor</th><th scope="col" class="r">Preço unit.</th><th scope="col">Incoterm</th><th scope="col" class="r">Qtd ofertada</th><th scope="col">Validade</th><th scope="col" class="r">Lead time</th><th scope="col" class="r">Custo efetivo/t</th><th scope="col" class="r">Score</th></tr></thead><tbody>';
      L.forEach(function (x, ix) {
        var cls = fin ? (fin === x.f.id ? 'win' : '') : (R ? (pick === x.f.id ? 'pick' : '') : (ix === 0 ? 'win' : ''));
        h += '<tr class="' + cls + '">' + (R ? '<td><input type="radio" name="pk-' + it.id + '" aria-label="Escolher ' + esc(x.f.nome) + '" data-pick="' + it.id + '" value="' + x.f.id + '"' + (pick === x.f.id ? ' checked' : '') + '></td>' : '') +
          '<td><b>' + esc(x.f.nome) + '</b>' + (ix === 0 && !fin ? ' <span class="ch med">Sugerido</span>' : '') + (fin === x.f.id ? ' <span class="ch ok">Escolhido</span>' : '') + '<span class="sub">' + PI.PAISES[x.q.o] + '</span>' + (x.q.exc ? '<span class="exc">⚠ ' + esc(x.q.exc) + '</span>' : '') + '</td>' +
          '<td class="r num nw">' + x.q.m + ' ' + F.n2.format(x.q.p) + '</td><td>' + x.q.inc + '</td><td class="r num">' + x.q.q + ' t</td><td class="nw">' + (x.q.v ? x.q.v + ' dias' : '<span class="ch bad">Não informada</span>') + '</td><td class="r num">' + x.q.lt + ' d</td>' +
          '<td class="r num nw"><b>' + F.brl.format(x.perT) + '</b><span class="sub">total ' + F.brl.format(x.res.efetivo) + '</span></td><td class="r num"><b>' + F.n0.format(x.score) + '</b></td></tr>';
      });
      h += '</tbody></table></div><div class="leg"><span>Custo efetivo = custo nacionalizado − créditos do regime (' + regLabel() + ') · Score: custo 40% · lead time 20% · histórico 20% · ESG 20%</span></div></section>';
    });

    /* linha do tempo */
    h += '<section class="pn"><div class="hd"><h2>Histórico</h2></div><div class="bd"><ul class="tl">';
    var ev = [[r.criada, 'Requisição criada com ' + r.itens.length + ' item(ns).']];
    var minEnv = Math.min.apply(null, r.conv.map(function (c) { return c.env; }));
    ev.push([minEnv, 'RFQ enviado a ' + r.conv.length + ' fornecedores.']);
    if (stats(r).got) ev.push([minEnv + 14 * PI.H, stats(r).got + ' resposta(s) lida(s) e padronizada(s) pela IA.']);
    if (r.status !== 'aguardando_cotacao') ev.push([PI.NOW - 2 * PI.H, 'Ranking calculado e pedido enviado para revisão humana.']);
    if (r.fechado) ev.push([r.fechado.em, 'Pedido aprovado e fechado (' + r.fechado.po + ').']);
    ev.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (e) { h += '<li><time>' + F.dt(e[0]) + '</time><span>' + e[1] + '</span></li>'; });
    return h + '</ul></div></section>';
  }
  function regLabel() { return { real: 'lucro real', presumido: 'lucro presumido', simples: 'Simples Nacional' }[S.cfg.regime]; }

  function painelRevisao(r, R) {
    var sug = suggested(r), tot = 0, pend = [], ok = true, h = '';
    r.itens.forEach(function (i) {
      var f = R.picks[i.id], L = rank(r, i), x = L.filter(function (y) { return y.f.id === f; })[0];
      if (!x) { ok = false; return; }
      tot += x.res.efetivo;
      if (x.q.exc) pend.push({ k: i.id + ':' + f, t: mat(i.mat).produto + ' · ' + x.f.nome + ': ' + x.q.exc });
      if (!x.q.v) pend.push({ k: i.id + ':' + f + ':v', t: mat(i.mat).produto + ' · ' + x.f.nome + ': validade da proposta não informada.' });
      if (f !== sug[i.id] && (R.just[i.id] || '').trim().length < 8) ok = false;
    });
    pend.forEach(function (p) { if (!R.acks[p.k]) ok = false; });
    h += '<section class="rv" id="rev"><div class="hd"><h2>Revisão humana</h2><span>Escolha o fornecedor de cada item e confirme as exceções sinalizadas pela IA</span></div><div class="bd">';
    h += '<div class="f2" style="max-width:760px;grid-template-columns:2fr 1fr"><div class="fld"><label for="reg">Regime tributário da empresa</label><select id="reg" data-chg="reg"><option value="real"' + (S.cfg.regime === 'real' ? ' selected' : '') + '>Lucro real (aproveita IPI, PIS, COFINS e ICMS)</option><option value="presumido"' + (S.cfg.regime === 'presumido' ? ' selected' : '') + '>Lucro presumido (aproveita ICMS)</option><option value="simples"' + (S.cfg.regime === 'simples' ? ' selected' : '') + '>Simples Nacional (sem créditos)</option></select></div><div class="fld"><label for="icms">ICMS na importação (%)</label><input id="icms" type="number" min="0" max="30" step="0.5" value="' + S.cfg.icms + '" data-in="icms"></div></div>';
    r.itens.forEach(function (i) {
      var f = R.picks[i.id];
      if (f && f !== sug[i.id]) h += '<div class="fld"><label for="j-' + i.id + '">Justificativa para escolher outro fornecedor: ' + esc(mat(i.mat).produto) + ' (obrigatória)</label><input id="j-' + i.id + '" type="text" maxlength="160" value="' + esc(R.just[i.id] || '') + '" data-just="' + i.id + '" placeholder="Ex.: prazo de entrega exigido pela produção"></div>';
    });
    if (pend.length) { h += '<div><b style="font-size:.84rem">Exceções para confirmar</b>'; pend.forEach(function (p) { h += '<label class="ck" style="margin-top:8px"><input type="checkbox" data-ack="' + esc(p.k) + '"' + (R.acks[p.k] ? ' checked' : '') + '><span>' + esc(p.t) + '</span></label>'; }); h += '</div>'; }
    else h += '<span class="hint">Nenhuma exceção nos fornecedores escolhidos.</span>';
    h += '<div class="sum"><div><div class="l">Itens</div><div class="v">' + r.itens.length + '</div></div><div><div class="l">Custo efetivo total</div><div class="v num">' + F.brl.format(tot) + '</div></div><div><div class="l">Situação</div><div class="v" style="font-size:1.05rem">' + (ok ? 'Pronto para aprovar' : 'Faltam confirmações') + '</div></div></div>';
    h += '<div class="act"><button class="btn main" type="button" data-act="aprovar" data-id="' + r.id + '"' + (ok ? '' : ' disabled') + '>Aprovar e fechar pedido</button><button class="btn" type="button" data-act="cancelrev" data-id="' + r.id + '">Cancelar revisão</button></div>';
    return h + '</div></section>';
  }

  /* ---------- rotas ---------- */
  var routes = { painel: ['painel', vPainel, 'Painel'], pedidos: ['pedidos', vPedidos, 'Pedidos'], fornecedores: ['fornecedores', vForn, 'Fornecedores'], materiais: ['materiais', vMat, 'Materiais e NCM'] };
  function render(keepScroll) {
    var hs = (location.hash || '#/painel').replace(/^#\/?/, '').split('/'), name = hs[0] || 'painel', html, act = name;
    if (name === 'pedido') { html = vPedido(hs[1]); act = 'pedidos'; document.title = (hs[1] || 'Pedido') + ' | Imports Intelligence'; }
    else { var rt = routes[name] || routes.painel; html = rt[1](); act = rt[0]; document.title = rt[2] + ' | Protótipo | Imports Intelligence'; }
    document.getElementById('side').innerHTML = PI.sidebar(act, true);
    var y = window.scrollY; view.innerHTML = html;
    if (keepScroll) window.scrollTo(0, y); else { window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { render(false); });

  /* ---------- eventos ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act'), id = b.getAttribute('data-id'), r = id && req(id);
    if (a === 'fil') { S.fil = b.getAttribute('data-v'); render(true); }
    else if (a === 'rev') { S.rev[id] = { picks: suggested(r), acks: {}, just: {} }; render(true); var el = document.getElementById('rev'); if (el) { el.scrollIntoView({ block: 'start' }); } }
    else if (a === 'cancelrev') { delete S.rev[id]; render(true); }
    else if (a === 'lemb') {
      var c = r.conv.filter(function (x) { return x.f === b.getAttribute('data-f'); })[0]; c.lemb++; c.env = c.env;
      toast((c.st === 'incompleta' ? 'Pedido de dados faltantes enviado a ' : 'Lembrete enviado a ') + forn(c.f).nome + ' (simulado).'); render(true);
    }
    else if (a === 'aprovar') {
      var R = rv(r); if (!R) return;
      var po = 'PO-2026-0' + (S.po++);
      r.status = 'fechado'; r.fechado = { po: po, em: Date.now(), picks: R.picks, just: R.just }; delete S.rev[id];
      toast('Pedido ' + r.id + ' fechado. ' + po + ' registrado (protótipo).'); render(false);
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, id = location.hash.split('/')[2], r = id && req(id), R = r && rv(r);
    if (t.hasAttribute('data-pick') && R) { R.picks[t.getAttribute('data-pick')] = t.value; render(true); }
    else if (t.hasAttribute('data-ack') && R) { R.acks[t.getAttribute('data-ack')] = t.checked; render(true); }
    else if (t.getAttribute('data-chg') === 'reg') { S.cfg.regime = t.value; render(true); }
    else if (t.getAttribute('data-chg') === 'um') { S.um = t.value; document.getElementById('tm').innerHTML = tabelaMat(); }
  });
  document.addEventListener('input', function (e) {
    var t = e.target, k = t.getAttribute('data-in');
    if (k === 'qf') { S.qf = t.value; document.getElementById('tf').innerHTML = tabelaForn(); }
    else if (k === 'qm') { S.qm = t.value; document.getElementById('tm').innerHTML = tabelaMat(); }
    else if (k === 'icms') { var v = parseFloat(t.value); if (isFinite(v) && v >= 0 && v < 100) { S.cfg.icms = v; var pos = t.selectionStart; render(true); var n = document.getElementById('icms'); if (n) { n.focus(); } } }
    else if (t.hasAttribute('data-just')) {
      var id = location.hash.split('/')[2], R = rv(req(id)); R.just[t.getAttribute('data-just')] = t.value;
      var ap = document.querySelector('[data-act="aprovar"]'); if (ap) { render(true); var n2 = document.getElementById(t.id); if (n2) { n2.focus(); n2.setSelectionRange(n2.value.length, n2.value.length); } }
    }
  });
  document.getElementById('reset').addEventListener('click', function () { init(); location.hash = '#/painel'; render(false); toast('Protótipo reiniciado.'); });

  if (!location.hash) location.hash = '#/painel'; else render(false);
  if (!location.hash.length) render(false);
})();
