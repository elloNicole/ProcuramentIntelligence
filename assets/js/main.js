(function(){
  var b=document.getElementById('burger'),m=document.getElementById('menu');
  b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o)});
  m.addEventListener('click',function(e){if(e.target.tagName==='A'){m.classList.remove('open');b.setAttribute('aria-expanded','false')}});

  var els=[].slice.call(document.querySelectorAll('.rv'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.06,rootMargin:'0px 0px -24px 0px'});
    els.forEach(function(el){io.observe(el)});
  }else{els.forEach(function(el){el.classList.add('in')})}

  var D={A:{fob:6190,fr:1900,sg:60},B:{fob:6450,fr:820,sg:65},C:{fob:6170,fr:2300,sg:62}};
  var K=['A','B','C'],nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}),pf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
  var usd=function(n){return 'US$ '+nf.format(Math.round(n))};
  var $=function(id){return document.getElementById(id)};
  var tb=$('tb');
  K.forEach(function(k){
    tb.insertAdjacentHTML('beforeend',
      '<tr id="rc-'+k+'"><td>Fornecedor '+k+'</td>'+
      '<td><input id="'+k+'-fob" type="number" inputmode="decimal" min="0" step="10" aria-label="Preço FOB do fornecedor '+k+'"></td>'+
      '<td><input id="'+k+'-fr" type="number" inputmode="decimal" min="0" step="10" aria-label="Frete do fornecedor '+k+'"></td>'+
      '<td><input id="'+k+'-sg" type="number" inputmode="decimal" min="0" step="5" aria-label="Seguro do fornecedor '+k+'"></td>'+
      '<td id="'+k+'-cif"></td><td id="'+k+'-trb"></td><td class="tot" id="'+k+'-tot"></td><td class="dl" id="'+k+'-dl"></td>'+
      '<td class="l"><div class="cbar2" aria-hidden="true"><b class="cp" id="'+k+'-bp"></b><b class="cf" id="'+k+'-bf"></b><b class="ct" id="'+k+'-bt"></b></div></td>'+
      '<td class="l" id="'+k+'-st"></td></tr>');
  });
  var val=function(id){var v=parseFloat($(id).value);return isFinite(v)&&v>0?v:0};
  function fill(){K.forEach(function(k){$(k+'-fob').value=D[k].fob;$(k+'-fr').value=D[k].fr;$(k+'-sg').value=D[k].sg});$('g-rate').value=38;$('g-fixed').value=520}
  function calc(){
    var rate=val('g-rate')/100,fx=val('g-fixed'),r={};
    K.forEach(function(k){var fob=val(k+'-fob'),fs=val(k+'-fr')+val(k+'-sg'),cif=fob+fs,tr=cif*rate+fx;r[k]={fob:fob,fs:fs,cif:cif,tr:tr,tot:cif+tr}});
    var best=K[0],minFob=K[0];
    K.forEach(function(k){if(r[k].tot<r[best].tot)best=k;if(r[k].fob<r[minFob].fob)minFob=k});
    K.forEach(function(k){
      var x=r[k],t=x.tot||1;
      $(k+'-cif').textContent=nf.format(Math.round(x.cif));
      $(k+'-trb').textContent=nf.format(Math.round(x.tr));
      $(k+'-tot').textContent=usd(x.tot);
      $(k+'-bp').style.width=(x.fob/t*100)+'%';$(k+'-bf').style.width=(x.fs/t*100)+'%';$(k+'-bt').style.width=(x.tr/t*100)+'%';
      $('rc-'+k).classList.toggle('win',k===best);
      $(k+'-st').innerHTML=k===best?'<span class="chip g" style="color:var(--ink)">Melhor</span>':(k===minFob?'<span class="chip w">Menor FOB</span>':'<span class="chip" style="color:var(--mut)">Alt.</span>');
      var d=x.tot-r[best].tot;
      $(k+'-dl').textContent=k===best?'—':'+'+usd(d)+' (+'+pf.format(r[best].tot?d/r[best].tot*100:0)+'%)';
    });
    var sv=r[minFob].tot-r[best].tot;
    $('k-best').textContent=usd(r[best].tot);$('k-best-s').textContent='Fornecedor '+best;
    $('k-save').textContent=usd(sv);$('k-save-s').textContent=sv>0?'por embarque':'sem diferença neste cenário';
    $('k-fob').textContent=usd(r[minFob].fob);$('k-fob-s').textContent='Fornecedor '+minFob;
    $('verdict-txt').textContent=best!==minFob
      ?'Menor preço FOB: Fornecedor '+minFob+'. Menor custo total: Fornecedor '+best+'. Escolher pelo preço custaria '+usd(sv)+' a mais por embarque.'
      :'Aqui o menor preço FOB também é o menor custo total. Altere frete, seguro ou tributos e veja a ordem mudar.';
  }
  fill();calc();
  document.querySelector('.sim').addEventListener('input',calc);
  $('reset').addEventListener('click',function(){fill();calc()});

  var CONTACT_EMAIL='';  /* defina o e-mail que receberá os contatos, ex.: contato@suaempresa.com.br */
  $('form').addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target,st=$('f-status');
    if(!f.nome.value.trim()||!f.empresa.value.trim()||!/^\S+@\S+\.\S+$/.test(f.email.value)){st.textContent='Preencha nome, empresa e um e-mail válido.';return}
    if(!CONTACT_EMAIL){st.textContent='Formulário sem e-mail de destino. Defina CONTACT_EMAIL no código da página.';return}
    var body='Nome: '+f.nome.value+'\nEmpresa: '+f.empresa.value+'\nE-mail: '+f.email.value+'\nCotações por mês: '+f.volume.value+'\n\n'+f.mensagem.value;
    location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent('Acesso beta - Imports Intelligence')+'&body='+encodeURIComponent(body);
    st.textContent='Abrimos seu aplicativo de e-mail com a mensagem pronta.';
  });
})();
