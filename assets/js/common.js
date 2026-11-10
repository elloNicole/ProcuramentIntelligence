/* Imports Intelligence · núcleo compartilhado do protótipo
   Dados FICTÍCIOS. Alíquotas, fretes e taxas são ilustrativos e editáveis. */
var PI = (function () {
  var DAY = 864e5, H = 36e5, NOW = Date.now();

  var FX = { USD: 5.40, EUR: 5.85 };
  var LANE = { CN: 58, IN: 72, AE: 66, US: 60, DE: 64, SG: 74, TR: 68 }; /* frete US$/t até Paranaguá */
  var PAISES = { CN: 'China', IN: 'Índia', AE: 'Emirados Árabes', US: 'Estados Unidos', DE: 'Alemanha', SG: 'Singapura', TR: 'Turquia' };
  var PORTOS = {
    'Paranaguá': { uf: 'PR', mult: 1.00, thc: 95, icms: 18 },
    'Santos':    { uf: 'SP', mult: 0.95, thc: 110, icms: 18 },
    'Suape':     { uf: 'PE', mult: 1.10, thc: 85, icms: 18 }
  };

  var MATERIAIS = [
    { id: 'M1', produto: 'Soda cáustica em escamas', esp: 'NaOH 99%, saco 25 kg', ncm: '2815.11.00', estoque: 38,  consumo: 60,  lt: 38, al: { ii: 4,  ipi: 5, pis: 2.1, cofins: 9.65 } },
    { id: 'M2', produto: 'Barrilha densa',           esp: 'Na2CO3 99,2%, big bag', ncm: '2836.20.10', estoque: 140, consumo: 90,  lt: 32, al: { ii: 6,  ipi: 0, pis: 2.1, cofins: 9.65 } },
    { id: 'M3', produto: 'Ácido cítrico anidro',     esp: 'Grau alimentício, saco 25 kg', ncm: '2918.14.00', estoque: 30,  consumo: 18,  lt: 40, al: { ii: 10, ipi: 5, pis: 2.1, cofins: 9.65 } },
    { id: 'M4', produto: 'Dióxido de titânio rutilo', esp: 'TiO2 ≥ 92%, saco 25 kg', ncm: '3206.11.10', estoque: 22,  consumo: 14,  lt: 45, al: { ii: 12, ipi: 5, pis: 2.1, cofins: 9.65 } },
    { id: 'M5', produto: 'Ureia granulada',          esp: 'N 46%, big bag', ncm: '3102.10.10', estoque: 310, consumo: 100, lt: 35, al: { ii: 0,  ipi: 0, pis: 2.1, cofins: 9.65 } },
    { id: 'M6', produto: 'Ácido sulfúrico',          esp: 'H2SO4 98%, granel', ncm: '2807.00.10', estoque: 500, consumo: 120, lt: 30, al: { ii: 2,  ipi: 0, pis: 2.1, cofins: 9.65 } },
    { id: 'M7', produto: 'Peróxido de hidrogênio',   esp: 'H2O2 50%, tambor 200 kg', ncm: '2847.00.00', estoque: 20,  consumo: 25,  lt: 28, al: { ii: 8,  ipi: 0, pis: 2.1, cofins: 9.65 } }
  ];

  var FORNECEDORES = [
    { id: 'F1', nome: 'Hengrui Alkali Co.',        pais: 'CN', score: 86, esg: true,  resp: 14, env: 21, rec: 18, mail: 'compras@hengrui.example' },
    { id: 'F2', nome: 'Meridian Chemicals Pvt.',   pais: 'IN', score: 79, esg: false, resp: 22, env: 15, rec: 12, mail: 'export@meridian.example' },
    { id: 'F3', nome: 'Gulfstream Alkali FZE',     pais: 'AE', score: 72, esg: false, resp: 30, env: 14, rec: 9,  mail: 'sales@gulfstream.example' },
    { id: 'F4', nome: 'Nordwerk Chemie GmbH',      pais: 'DE', score: 91, esg: true,  resp: 9,  env: 8,  rec: 7,  mail: 'vertrieb@nordwerk.example' },
    { id: 'F5', nome: 'Lone Star Chemicals Inc.',  pais: 'US', score: 68, esg: false, resp: 26, env: 16, rec: 10, mail: 'quotes@lonestar.example' },
    { id: 'F6', nome: 'Linhai Fine Chem Ltd.',     pais: 'CN', score: 74, esg: true,  resp: 18, env: 9,  rec: 6,  mail: 'info@linhai.example' },
    { id: 'F7', nome: 'Straits Trading Pte.',      pais: 'SG', score: 82, esg: false, resp: 20, env: 10, rec: 8,  mail: 'trade@straits.example' },
    { id: 'F8', nome: 'Anatolia Kimya A.Ş.',       pais: 'TR', score: 65, esg: false, resp: 40, env: 9,  rec: 4,  mail: 'export@anatolia.example' }
  ];

  function q(p, q, inc, o, v, lt, exc, m) { return { p: p, m: m || 'USD', q: q, inc: inc, o: o, v: v, lt: lt, exc: exc || '' }; }

  var REQS = [
    { id: 'REQ-2026-041', cliente: 'Indústria Alfa · Suprimentos', porto: 'Paranaguá', criada: NOW - 3 * DAY, prazo: NOW + 1 * DAY + 4 * H, status: 'em_revisao',
      itens: [{ id: 'I-041-1', mat: 'M1', qtd: 80 }, { id: 'I-041-2', mat: 'M2', qtd: 120 }],
      conv: [
        { f: 'F1', st: 'recebida', env: NOW - 60 * H, lemb: 0, q: { 'I-041-1': q(462, 80, 'FOB', 'CN', 6, 38), 'I-041-2': q(268, 120, 'FOB', 'CN', 6, 36) } },
        { f: 'F2', st: 'recebida', env: NOW - 60 * H, lemb: 0, q: { 'I-041-1': q(489, 80, 'CFR', 'IN', 5, 42), 'I-041-2': q(281, 120, 'CFR', 'IN', 5, 40) } },
        { f: 'F3', st: 'incompleta', env: NOW - 60 * H, lemb: 1, q: { 'I-041-1': q(478, 80, 'FOB', 'AE', 3, 30, 'Sem cotação para a barrilha. A IA pediu os dados faltantes por e-mail.') } },
        { f: 'F5', st: 'recebida', env: NOW - 60 * H, lemb: 0, q: { 'I-041-1': q(505, 60, 'FOB', 'US', 4, 34, 'Entrega parcial: 60 de 80 t.'), 'I-041-2': q(255, 120, 'FOB', 'US', null, 28, 'Validade da proposta não informada.') } },
        { f: 'F4', st: 'sem_resposta', env: NOW - 50 * H, lemb: 2, q: {} }
      ], fechado: null },
    { id: 'REQ-2026-045', cliente: 'Agro Beta · Compras', porto: 'Suape', criada: NOW - 4 * DAY, prazo: NOW + 8 * H, status: 'em_revisao',
      itens: [{ id: 'I-045-1', mat: 'M5', qtd: 150 }],
      conv: [
        { f: 'F2', st: 'recebida', env: NOW - 80 * H, lemb: 0, q: { 'I-045-1': q(318, 150, 'CFR', 'IN', 5, 36) } },
        { f: 'F7', st: 'recebida', env: NOW - 80 * H, lemb: 0, q: { 'I-045-1': q(305, 150, 'FOB', 'SG', 4, 32) } },
        { f: 'F8', st: 'recebida', env: NOW - 80 * H, lemb: 0, q: { 'I-045-1': q(299, 150, 'FOB', 'TR', 2, 34, 'Cotou descarga em Santos, não em Suape. Validar rota.') } }
      ], fechado: null },
    { id: 'REQ-2026-042', cliente: 'Indústria Alfa · Suprimentos', porto: 'Santos', criada: NOW - 2 * DAY, prazo: NOW + 3 * DAY, status: 'aguardando_cotacao',
      itens: [{ id: 'I-042-1', mat: 'M3', qtd: 25 }],
      conv: [
        { f: 'F1', st: 'recebida', env: NOW - 48 * H, lemb: 0, q: { 'I-042-1': q(1010, 25, 'FOB', 'CN', 5, 40) } },
        { f: 'F6', st: 'recebida', env: NOW - 48 * H, lemb: 0, q: { 'I-042-1': q(1045, 25, 'CFR', 'CN', 7, 42) } },
        { f: 'F7', st: 'aguardando', env: NOW - 30 * H, lemb: 0, q: {} },
        { f: 'F2', st: 'aguardando', env: NOW - 26 * H, lemb: 0, q: {} },
        { f: 'F8', st: 'sem_resposta', env: NOW - 52 * H, lemb: 1, q: {} }
      ], fechado: null },
    { id: 'REQ-2026-043', cliente: 'Tintas Gama · Suprimentos', porto: 'Paranaguá', criada: NOW - 12 * H, prazo: NOW + 6 * DAY, status: 'aguardando_cotacao',
      itens: [{ id: 'I-043-1', mat: 'M4', qtd: 40 }],
      conv: [
        { f: 'F1', st: 'aguardando', env: NOW - 12 * H, lemb: 0, q: {} },
        { f: 'F4', st: 'aguardando', env: NOW - 12 * H, lemb: 0, q: {} },
        { f: 'F5', st: 'aguardando', env: NOW - 6 * H, lemb: 0, q: {} },
        { f: 'F6', st: 'aguardando', env: NOW - 6 * H, lemb: 0, q: {} }
      ], fechado: null },
    { id: 'REQ-2026-044', cliente: 'Agro Beta · Compras', porto: 'Santos', criada: NOW - 14 * DAY, prazo: NOW - 9 * DAY, status: 'fechado',
      itens: [{ id: 'I-044-1', mat: 'M5', qtd: 200 }],
      conv: [
        { f: 'F2', st: 'recebida', env: NOW - 14 * DAY, lemb: 0, q: { 'I-044-1': q(326, 200, 'CFR', 'IN', 5, 36) } },
        { f: 'F7', st: 'recebida', env: NOW - 14 * DAY, lemb: 0, q: { 'I-044-1': q(311, 200, 'FOB', 'SG', 5, 32) } }
      ], fechado: { po: 'PO-2026-0187', em: NOW - 9 * DAY, picks: { 'I-044-1': 'F7' }, just: {} } }
  ];

  function clone() { return JSON.parse(JSON.stringify({ reqs: REQS, forns: FORNECEDORES, mats: MATERIAIS })); }

  /* ---------- motor de custos ---------- */
  function compute(p) {
    var qty = p.qty, base = p.price * qty, lane = p.freightPerT * qty, ins = (p.insPct / 100) * base, freight, cif;
    if (p.inc === 'FOB')      { freight = lane; cif = base + lane + ins; }
    else if (p.inc === 'CFR') { freight = lane; cif = base + ins; }
    else                      { freight = lane; cif = base; }          /* CIF: frete e seguro já no preço */
    var va = cif * p.fx;
    var ii = va * p.ii / 100, ipi = 0, pis = 0, cof = 0, cbs = 0;
    if (p.modo === '2027') { cbs = (va + ii) * p.cbs / 100; }
    else { ipi = (va + ii) * p.ipi / 100; pis = va * p.pis / 100; cof = va * p.cofins / 100; }
    var afrmm = p.isentoAfrmm ? 0 : freight * p.fx * p.afrmm / 100;
    var desp = p.thcPerT * qty;
    var icmsBase = (va + ii + ipi + pis + cof + cbs + afrmm + desp) / (1 - p.icms / 100);
    var icms = icmsBase * p.icms / 100;
    var tributos = ii + ipi + pis + cof + cbs + icms + afrmm;
    var total = va + tributos + desp;
    var cred = 0;
    if (p.regime === 'real') cred = ipi + pis + cof + cbs + icms;
    else if (p.regime === 'presumido') cred = icms;
    return {
      base: base * p.fx, freight: freight * p.fx, ins: ins * p.fx, va: va, ii: ii, ipi: ipi, pis: pis, cof: cof, cbs: cbs,
      afrmm: afrmm, desp: desp, icmsBase: icmsBase, icms: icms, tributos: tributos, total: total, cred: cred,
      efetivo: total - cred, desembolso: total - (p.diferido ? icms : 0), perT: (total - cred) / qty, cargaPct: tributos / va * 100
    };
  }

  function paramsFor(req, mat, qt, cfg) {
    var port = PORTOS[req.porto];
    return {
      price: qt.p, qty: qt.q, inc: qt.inc, fx: FX[qt.m] || FX.USD, freightPerT: (LANE[qt.o] || 65) * port.mult, insPct: 0.25, thcPerT: port.thc,
      ii: mat.al.ii, ipi: mat.al.ipi, pis: mat.al.pis, cofins: mat.al.cofins, icms: cfg.icms, afrmm: 25, isentoAfrmm: false,
      regime: cfg.regime, modo: 'atual', cbs: 8.8, diferido: false
    };
  }
  function quoteCalc(req, mat, qt, cfg) { return compute(paramsFor(req, mat, qt, cfg)); }

  /* ---------- formatação ---------- */
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var n1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  var n2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rest(ms) {
    var d = ms - Date.now(), a = Math.abs(d), dd = Math.floor(a / DAY), hh = Math.floor((a % DAY) / H);
    var t = dd > 0 ? dd + 'd ' + hh + 'h' : hh + 'h';
    return d < 0 ? 'vencido há ' + t : 'vence em ' + t;
  }
  function ago(ms) { var h = Math.round((Date.now() - ms) / H); return h < 24 ? 'há ' + h + ' h' : 'há ' + Math.round(h / 24) + ' d'; }
  function dt(ms) { return new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }

  /* ---------- urgência ---------- */
  function urg(m) {
    var cob = m.estoque / m.consumo * 30, margem = cob - m.lt, n;
    if (margem <= 0) n = 'crit'; else if (margem <= 10) n = 'alta'; else if (margem <= 30) n = 'med'; else n = 'baixa';
    return { cob: cob, margem: margem, n: n, rank: { crit: 0, alta: 1, med: 2, baixa: 3 }[n] };
  }
  var URG_L = { crit: 'Crítica', alta: 'Alta', med: 'Média', baixa: 'Baixa' };

  /* ---------- barra lateral ---------- */
  function sidebar(active, inApp) {
    var p = inApp ? '' : 'prototipo.html';
    var items = [
      ['painel', 'Painel', p + '#/painel', '#i-grid'],
      ['pedidos', 'Pedidos', p + '#/pedidos', '#i-doc'],
      ['fornecedores', 'Fornecedores', p + '#/fornecedores', '#i-users'],
      ['materiais', 'Materiais e NCM', p + '#/materiais', '#i-box'],
      ['simulador', 'Simulador de custos', 'simulador.html', '#i-calc']
    ];
    var h = '<a class="sb-brand" href="index.html">Imports Intelligence</a><div class="sb-env">Protótipo</div><nav aria-label="Principal"><ul>';
    items.forEach(function (i) {
      h += '<li><a href="' + i[2] + '"' + (active === i[0] ? ' class="on" aria-current="page"' : '') + '><svg class="ic" aria-hidden="true"><use href="' + i[3] + '"/></svg><span>' + i[1] + '</span></a></li>';
    });
    h += '</ul></nav><a class="sb-back" href="index.html">← Voltar ao site</a>';
    return h;
  }

  return {
    NOW: NOW, DAY: DAY, H: H, FX: FX, LANE: LANE, PAISES: PAISES, PORTOS: PORTOS, MATERIAIS: MATERIAIS, FORNECEDORES: FORNECEDORES,
    clone: clone, compute: compute, paramsFor: paramsFor, quoteCalc: quoteCalc, urg: urg, URG_L: URG_L, sidebar: sidebar,
    f: { brl: brl, n0: n0, n1: n1, n2: n2, esc: esc, rest: rest, ago: ago, dt: dt }
  };
})();
