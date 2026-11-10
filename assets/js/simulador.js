/* Simulador de custos e impostos de importação (protótipo).
   Alíquotas, fretes e taxas são ilustrativos e editáveis. O cálculo oficial é do despachante e do contador. */
(function () {
  var F = PI.f, esc = F.esc, view = document.getElementById('view');
  document.getElementById('side').innerHTML = PI.sidebar('simulador', false);
  document.title = 'Simulador de custos | Imports Intelligence';

  var D = PI.clone();
  var opt = function (arr, sel) { return arr.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); };

  /* cotações disponíveis como ponto de partida */
  var presets = [['manual', 'Preencher manualmente']];
  D.reqs.forEach(function (r) {
    r.itens.forEach(function (i) {
      var m = D.mats.filter(function (x) { return x.id === i.mat; })[0];
      r.conv.forEach(function (c) {
        var qt = c.q[i.id]; if (!qt) return;
        var f = D.forns.filter(function (x) { return x.id === c.f; })[0];
        presets.push([r.id + '|' + i.id + '|' + c.f, r.id.replace('REQ-2026-', 'REQ ') + ' · ' + m.produto + ' · ' + f.nome + ' (' + qt.m + ' ' + qt.p + ')']);
      });
    });
  });

  var fld = function (id, label, input) { return '<div class="fld"><label for="' + id + '">' + label + '</label>' + input + '</div>'; };
  var numI = function (id, v, step, min) { return '<input id="' + id + '" type="number" inputmode="decimal" step="' + (step || 'any') + '" min="' + (min === undefined ? 0 : min) + '" value="' + v + '">'; };

  view.innerHTML =
    '<div class="ph"><div><h1>Simulador de custos e impostos</h1><p>Do preço FOB ao custo nacionalizado, com créditos, benefícios e cenário da reforma tributária.</p></div></div>' +
    '<div class="sg"><form class="pn form" id="frm" onsubmit="return false" aria-label="Parâmetros da simulação">' +
    '<fieldset><legend>Ponto de partida</legend>' + fld('preset', 'Cotação do protótipo', '<select id="preset">' + opt(presets, 'manual') + '</select>') + '</fieldset>' +
    '<fieldset><legend>Mercadoria</legend>' + fld('mat', 'Material', '<select id="mat">' + opt(D.mats.map(function (m) { return [m.id, m.produto + ' · NCM ' + m.ncm]; }), 'M1') + '</select>') +
    '<div class="f3">' + fld('price', 'Preço unitário', numI('price', 462, 1)) + fld('moeda', 'Moeda', '<select id="moeda">' + opt([['USD', 'USD'], ['EUR', 'EUR']], 'USD') + '</select>') + fld('fx', 'Câmbio (R$)', numI('fx', 5.40, 0.01)) + '</div>' +
    '<div class="f3">' + fld('qty', 'Quantidade (t)', numI('qty', 80, 1)) + fld('inc', 'Incoterm', '<select id="inc">' + opt([['FOB', 'FOB'], ['CFR', 'CFR'], ['CIF', 'CIF']], 'FOB') + '</select>') + fld('ins', 'Seguro (% do valor)', numI('ins', 0.25, 0.05)) + '</div></fieldset>' +
    '<fieldset><legend>Logística</legend><div class="f2">' + fld('orig', 'Origem', '<select id="orig">' + opt(Object.keys(PI.PAISES).map(function (k) { return [k, PI.PAISES[k]]; }), 'CN') + '</select>') + fld('porto', 'Porto de destino', '<select id="porto">' + opt(Object.keys(PI.PORTOS).map(function (k) { return [k, k + ' (' + PI.PORTOS[k].uf + ')']; }), 'Paranaguá') + '</select>') + '</div>' +
    '<div class="f2">' + fld('frete', 'Frete internacional (US$/t)', numI('frete', 58, 1)) + fld('thc', 'Despesas portuárias e aduaneiras (R$/t)', numI('thc', 95, 1)) + '</div></fieldset>' +
    '<fieldset><legend>Alíquotas (%)</legend><div class="f3">' + fld('ii', 'II', numI('ii', 4, 0.5)) + fld('ipi', 'IPI', numI('ipi', 5, 0.5)) + fld('icms', 'ICMS', numI('icms', 18, 0.5)) + '</div><div class="f3">' + fld('pis', 'PIS-Importação', numI('pis', 2.1, 0.05)) + fld('cofins', 'COFINS-Importação', numI('cofins', 9.65, 0.05)) + fld('afrmm', 'AFRMM (sobre o frete)', numI('afrmm', 25, 1)) + '</div></fieldset>' +
    '<fieldset><legend>Benefícios, regime e cenário</legend>' +
    '<label class="ck2"><input type="checkbox" id="extar"><span>Ex-tarifário aplicável (II reduzido)</span></label>' + fld('exii', 'II com ex-tarifário (%)', numI('exii', 0, 0.5)) +
    '<label class="ck2"><input type="checkbox" id="isafr"><span>Isenção de AFRMM obtida junto à Receita</span></label>' +
    '<label class="ck2"><input type="checkbox" id="dif"><span>ICMS diferido (regime estadual, sujeito a porto e programa)</span></label>' +
    '<div class="f2">' + fld('regime', 'Regime tributário', '<select id="regime">' + opt([['real', 'Lucro real'], ['presumido', 'Lucro presumido'], ['simples', 'Simples Nacional']], 'real') + '</select>') + fld('modo', 'Cenário', '<select id="modo">' + opt([['atual', 'Regime atual (2026)'], ['2027', '2027: CBS no lugar de PIS/COFINS, IPI zerado']], 'atual') + '</select>') + '</div>' +
    fld('cbs', 'Alíquota CBS (%): ilustrativa, editável', numI('cbs', 8.8, 0.1)) + '</fieldset></form>' +
    '<div class="sticky" id="out"></div></div>' +
    '<p class="hint" style="margin-top:8px">Simplificações: ICMS calculado “por dentro” sobre valor aduaneiro, tributos federais, AFRMM e despesas; créditos por regime em regra geral; CBS sobre valor aduaneiro mais II. Alíquotas por NCM, fretes e taxas portuárias são valores ilustrativos. Confirme classificação e enquadramento com o despachante e o contador.</p>';

  var $ = function (id) { return document.getElementById(id); };
  var n = function (id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
  var on = function (id) { return $(id).checked; };

  function params() {
    return {
      price: n('price'), qty: Math.max(n('qty'), 0.0001), inc: $('inc').value, fx: n('fx'), freightPerT: n('frete'), insPct: n('ins'), thcPerT: n('thc'),
      ii: on('extar') ? n('exii') : n('ii'), ipi: n('ipi'), pis: n('pis'), cofins: n('cofins'), icms: Math.min(n('icms'), 95), afrmm: n('afrmm'),
      isentoAfrmm: on('isafr'), regime: $('regime').value, modo: $('modo').value, cbs: n('cbs'), diferido: on('dif')
    };
  }
  function copy(p, o) { var c = {}; for (var k in p) c[k] = p[k]; for (var j in o) c[j] = o[j]; return c; }

  function fillMat() { var m = D.mats.filter(function (x) { return x.id === $('mat').value; })[0]; $('ii').value = m.al.ii; $('ipi').value = m.al.ipi; $('pis').value = m.al.pis; $('cofins').value = m.al.cofins; }
  function fillLog() { var pt = PI.PORTOS[$('porto').value]; $('frete').value = Math.round((PI.LANE[$('orig').value] || 65) * pt.mult); $('thc').value = pt.thc; }

  function render() {
    var p = params(), r = PI.compute(p), h = '';
    var tf = r.ii + r.ipi + r.pis + r.cof + r.cbs;
    h += '<div class="kpis two">' +
      '<div class="kp hi"><div class="l">Custo efetivo (após créditos)</div><div class="v num">' + F.brl.format(r.efetivo) + '</div><div class="s">' + F.brl.format(r.perT) + ' por tonelada</div></div>' +
      '<div class="kp"><div class="l">Custo nacionalizado</div><div class="v num">' + F.brl.format(r.total) + '</div><div class="s">carga tributária ' + F.n1.format(r.cargaPct) + '% do valor aduaneiro</div></div></div>';

    var fi = p.inc === 'FOB' ? r.freight + r.ins : (p.inc === 'CFR' ? r.ins : 0);
    var seg = [['s1', 'Mercadoria', r.base], ['s2', 'Frete e seguro', fi], ['s3', 'Tributos federais', tf], ['s4', 'ICMS e AFRMM', r.icms + r.afrmm], ['s5', 'Despesas', r.desp]];
    var base = seg.reduce(function (a, s) { return a + s[2]; }, 0) || 1;
    h += '<div class="pn"><div class="hd"><h2>Composição do custo</h2><span>' + p.inc + ' · ' + $('porto').value + '</span></div><div class="bd"><div class="stack" role="img" aria-label="Composição do custo nacionalizado">';
    seg.forEach(function (s) { h += '<b class="' + s[0] + '" style="width:' + (s[2] / base * 100) + '%"></b>'; });
    h += '</div><div class="sl">'; seg.forEach(function (s) { h += '<span><i class="' + s[0] + '"></i>' + s[1] + ' ' + F.n1.format(s[2] / base * 100) + '%</span>'; }); h += '</div></div></div>';

    /* memória de cálculo */
    var row = function (l, b, a, v, cls) { return '<tr class="' + (cls || '') + '"><td>' + l + '</td><td class="r num">' + (b !== null ? F.brl.format(b) : '') + '</td><td class="r num">' + (a !== null ? F.n2.format(a) + '%' : '') + '</td><td class="r num">' + F.brl.format(v) + '</td></tr>'; };
    h += '<div class="pn"><div class="hd"><h2>Memória de cálculo</h2><span>Valores em R$</span></div><div class="tw"><table class="t"><thead><tr><th scope="col">Componente</th><th scope="col" class="r">Base</th><th scope="col" class="r">Alíquota</th><th scope="col" class="r">Valor</th></tr></thead><tbody>';
    h += row('Mercadoria (' + p.inc + ')', null, null, r.base);
    if (p.inc === 'FOB') h += row('Frete internacional', null, null, r.freight);
    if (p.inc !== 'CIF') h += row('Seguro', null, null, r.ins);
    h += row('Valor aduaneiro', null, null, r.va, 'tot');
    h += row('Imposto de Importação (II)', r.va, p.ii, r.ii);
    if (p.modo === '2027') h += row('CBS (substitui PIS/COFINS)', r.va + r.ii, p.cbs, r.cbs);
    else { h += row('IPI', r.va + r.ii, p.ipi, r.ipi) + row('PIS-Importação', r.va, p.pis, r.pis) + row('COFINS-Importação', r.va, p.cofins, r.cof); }
    h += row('AFRMM' + (p.isentoAfrmm ? ' (isento)' : ''), r.freight, p.isentoAfrmm ? 0 : p.afrmm, r.afrmm);
    h += row('Despesas portuárias e aduaneiras', null, null, r.desp);
    h += row('ICMS' + (p.diferido ? ' (diferido: não desembolsado no desembaraço)' : ''), r.icmsBase, p.icms, r.icms);
    h += row('Custo nacionalizado', null, null, r.total, 'tot');
    h += row('(−) Créditos recuperáveis (' + { real: 'lucro real', presumido: 'lucro presumido', simples: 'Simples Nacional' }[p.regime] + ')', null, null, -r.cred);
    h += row('Custo efetivo', null, null, r.efetivo, 'tot');
    h += row('Desembolso no desembaraço', null, null, r.desembolso);
    h += '</tbody></table></div></div>';

    /* cenários */
    var sc = [['Como informado', p], ['Com ex-tarifário (II = ' + F.n1.format(n('exii')) + '%)', copy(p, { ii: n('exii') })], ['Com isenção de AFRMM', copy(p, { isentoAfrmm: true })], ['Com ICMS diferido', copy(p, { diferido: true })], ['Cenário 2027 (CBS, IPI zerado)', copy(p, { modo: '2027' })]];
    h += '<div class="pn"><div class="hd"><h2>Comparativo de cenários</h2><span>Mesmos dados, uma variável por vez</span></div><div class="tw"><table class="t"><thead><tr><th scope="col">Cenário</th><th scope="col" class="r">Nacionalizado</th><th scope="col" class="r">Efetivo</th><th scope="col" class="r">Desembolso</th><th scope="col" class="r">Δ efetivo</th></tr></thead><tbody>';
    sc.forEach(function (s, i) {
      var x = PI.compute(s[1]), d = x.efetivo - r.efetivo;
      h += '<tr><td style="min-width:200px">' + esc(s[0]) + '</td><td class="r num">' + F.brl.format(x.total) + '</td><td class="r num"><b>' + F.brl.format(x.efetivo) + '</b></td><td class="r num">' + F.brl.format(x.desembolso) + '</td><td class="r num">' + (i === 0 || Math.abs(d) < 1 ? '—' : (d > 0 ? '+' : '') + F.brl.format(d)) + '</td></tr>';
    });
    h += '</tbody></table></div><div class="leg"><span>Desembolso = o que sai do caixa no desembaraço. No lucro real, os tributos recuperáveis alteram o desembolso mais do que o custo efetivo.</span></div></div>';

    /* portos */
    h += '<div class="pn"><div class="hd"><h2>Comparativo de portos</h2><span>Frete e despesas portuárias ilustrativos</span></div><div class="tw"><table class="t"><thead><tr><th scope="col">Porto</th><th scope="col" class="r">Frete (US$/t)</th><th scope="col" class="r">Despesas (R$/t)</th><th scope="col" class="r">Custo efetivo</th><th scope="col" class="r">Δ vs. selecionado</th></tr></thead><tbody>';
    Object.keys(PI.PORTOS).forEach(function (k) {
      var pt = PI.PORTOS[k], fr = Math.round((PI.LANE[$('orig').value] || 65) * pt.mult), x = PI.compute(copy(p, { freightPerT: fr, thcPerT: pt.thc })), d = x.efetivo - r.efetivo;
      h += '<tr><td><b>' + k + '</b> <span class="sub">' + pt.uf + '</span></td><td class="r num">' + fr + '</td><td class="r num">' + pt.thc + '</td><td class="r num"><b>' + F.brl.format(x.efetivo) + '</b></td><td class="r num">' + (Math.abs(d) < 1 ? '—' : (d > 0 ? '+' : '') + F.brl.format(d)) + '</td></tr>';
    });
    h += '</tbody></table></div></div>';
    $('out').innerHTML = h;
  }

  var frm = $('frm');
  frm.addEventListener('change', function (e) {
    var id = e.target.id;
    if (id === 'preset') {
      var v = e.target.value; if (v === 'manual') { render(); return; }
      var a = v.split('|'), r = D.reqs.filter(function (x) { return x.id === a[0]; })[0], it = r.itens.filter(function (x) { return x.id === a[1]; })[0], q = r.conv.filter(function (x) { return x.f === a[2]; })[0].q[a[1]];
      $('mat').value = it.mat; fillMat(); $('price').value = q.p; $('moeda').value = q.m; $('fx').value = PI.FX[q.m]; $('qty').value = q.q; $('inc').value = q.inc; $('orig').value = q.o; $('porto').value = r.porto; fillLog();
    } else if (id === 'mat') fillMat();
    else if (id === 'orig' || id === 'porto') fillLog();
    else if (id === 'moeda') $('fx').value = PI.FX[e.target.value];
    if (['mat', 'orig', 'porto', 'moeda', 'inc'].indexOf(id) > -1) $('preset').value = 'manual';
    render();
  });
  frm.addEventListener('input', function (e) { if (e.target.type === 'number') render(); });
  fillMat(); fillLog(); $('preset').value = presets[1][0]; $('preset').dispatchEvent(new Event('change', { bubbles: true }));
})();
