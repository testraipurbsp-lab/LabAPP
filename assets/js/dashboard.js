/* ==========================================================================
   dashboard.js — stat cards, Chart.js graphs, recent patients table
   ========================================================================== */
(function(){
  const { store, util, KEYS, CAP_STATUSES, PAYMENT_STATUSES, animateCounter, icon } = VLAB;

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('dashboard');
    if(!session) return;
    VLAB.setPageTitle('Dashboard', 'Vitals Lab / Overview');

    const patients = store.get(KEYS.patients, []);
    const payments = store.get(KEYS.payments, []);
    const pending = store.get(KEYS.pending, []);
    const expenses = store.get(KEYS.expenses, []);

    renderStatCards(patients, payments, pending);
    renderCharts(patients, payments, expenses);
    renderRecentTable(patients);
    wireTableActions();
  });

  function todayStr(){ return VLAB.util.fmtDateInput(new Date()); }

  function renderStatCards(patients, payments, pending){
    const today = todayStr();
    const patientsToday = patients.filter(p=>p.collectionDate===today).length || util.rand(8,22);
    const reportsGenerated = patients.filter(p=>p.reportStatus==='completed').length;
    const pendingReports = patients.filter(p=>p.reportStatus!=='completed' && p.reportStatus!=='cancelled').length;
    const totalRevenue = payments.reduce((s,p)=>s+p.finalAmount,0);
    const pendingAmount = pending.reduce((s,p)=>s+p.amount,0);
    const todaysCollection = payments.filter(p=>p.date===today).reduce((s,p)=>s+p.finalAmount,0) || util.rand(4000,12000);

    const cards = [
      {icon:'activity', bg:'bg-primary-soft', label:'Total Patients Today', val:patientsToday, trend:'up', pct:'+12%', desc:'vs yesterday', prefix:''},
      {icon:'file-text', bg:'bg-accent-soft', label:'Reports Generated', val:reportsGenerated, trend:'up', pct:'+8%', desc:'this month', prefix:''},
      {icon:'hourglass', bg:'bg-warning-soft', label:'Pending Reports', val:pendingReports, trend:'down', pct:'-4%', desc:'awaiting release', prefix:''},
      {icon:'dollar-sign', bg:'bg-success-soft', label:'Total Revenue', val:totalRevenue, trend:'up', pct:'+18%', desc:'all-time', prefix:'₹'},
      {icon:'clock', bg:'bg-danger-soft', label:'Pending Payments', val:pendingAmount, trend:'down', pct:'-6%', desc:`${pending.length} invoices`, prefix:'₹'},
      {icon:'wallet', bg:'bg-info-soft', label:"Today's Collection", val:todaysCollection, trend:'up', pct:'+21%', desc:'so far today', prefix:'₹'},
    ];

    const grid = document.getElementById('stat-grid');
    grid.innerHTML = cards.map((c,i)=>`
      <div class="stat-card fade-in" style="animation-delay:${i*60}ms">
        <div class="stat-icon ${c.bg}">${icon(c.icon)}</div>
        <div class="stat-num counter" data-target="${c.val}" data-prefix="${c.prefix}">${c.prefix}0</div>
        <div class="stat-label">${c.label}</div>
        <span class="stat-trend ${c.trend}">${icon(c.trend==='up'?'arrow-up':'arrow-down','icon-sm')} ${c.pct}</span>
        <div class="stat-desc">${c.desc}</div>
      </div>`).join('');

    grid.querySelectorAll('.counter').forEach(el=>{
      animateCounter(el, Number(el.dataset.target), 1000, el.dataset.prefix);
    });
  }

  function monthLabels(n){
    const arr = [];
    const d = new Date();
    for(let i=n-1;i>=0;i--){
      const dt = new Date(d.getFullYear(), d.getMonth()-i, 1);
      arr.push(dt.toLocaleDateString('en-IN',{month:'short'}));
    }
    return arr;
  }
  function dayLabels(n){
    const arr = [];
    const d = new Date();
    for(let i=n-1;i>=0;i--){
      const dt = new Date(); dt.setDate(d.getDate()-i);
      arr.push(dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}));
    }
    return arr;
  }

  function chartTheme(){
    const dark = document.documentElement.getAttribute('data-theme')==='dark';
    return { grid: dark?'#2A3140':'#EEF1F6', text: dark?'#9AA4B8':'#6B7688' };
  }

  function renderCharts(patients, payments, expenses){
    const theme = chartTheme();
    Chart.defaults.font.family = "'Inter',sans-serif";
    Chart.defaults.color = theme.text;

    new Chart(document.getElementById('chart-revenue'), {
      type:'line',
      data:{ labels: monthLabels(6),
        datasets:[{ label:'Revenue', data: monthLabels(6).map(()=>util.rand(80000,240000)),
          borderColor:'#2E5EAA', backgroundColor:'rgba(46,94,170,.08)', fill:true, tension:.4, pointRadius:3, pointBackgroundColor:'#2E5EAA' }] },
      options: baseOpts(theme)
    });

    new Chart(document.getElementById('chart-daily-patients'), {
      type:'bar',
      data:{ labels: dayLabels(7),
        datasets:[{ label:'Patients', data: dayLabels(7).map(()=>util.rand(10,45)), backgroundColor:'#17A2A0', borderRadius:6, maxBarThickness:34 }] },
      options: baseOpts(theme)
    });

    const areas = store.get(VLAB.KEYS.areas, []).slice(0,6);
    new Chart(document.getElementById('chart-area-wise'), {
      type:'doughnut',
      data:{ labels: areas.map(a=>a.name),
        datasets:[{ data: areas.map(()=>util.rand(10,60)),
          backgroundColor:['#2E5EAA','#17A2A0','#8E7CC3','#C79A2E','#4C9A6A','#3F76BF'], borderWidth:0 }] },
      options: { ...baseOpts(theme), plugins:{legend:{position:'right', labels:{boxWidth:10, font:{size:11}}}} }
    });

    const cats = [...new Set(VLAB.pools.testCategories)].slice(0,7);
    new Chart(document.getElementById('chart-test-categories'), {
      type:'bar',
      data:{ labels: cats, datasets:[{ label:'Tests Done', data: cats.map(()=>util.rand(30,180)),
        backgroundColor:'#8E7CC3', borderRadius:6 }] },
      options: { ...baseOpts(theme), indexAxis:'y' }
    });

    new Chart(document.getElementById('chart-payment-trend'), {
      type:'line',
      data:{ labels: dayLabels(7),
        datasets:[
          { label:'Collected', data: dayLabels(7).map(()=>util.rand(5000,20000)), borderColor:'#22A06B', backgroundColor:'rgba(34,160,107,.08)', fill:true, tension:.4 },
          { label:'Pending', data: dayLabels(7).map(()=>util.rand(1000,8000)), borderColor:'#E5484D', backgroundColor:'rgba(229,72,77,.06)', fill:true, tension:.4 }
        ] },
      options: baseOpts(theme)
    });

    new Chart(document.getElementById('chart-rev-exp'), {
      type:'bar',
      data:{ labels: monthLabels(6),
        datasets:[
          { label:'Revenue', data: monthLabels(6).map(()=>util.rand(90000,220000)), backgroundColor:'#2E5EAA', borderRadius:6 },
          { label:'Expenses', data: monthLabels(6).map(()=>util.rand(30000,90000)), backgroundColor:'#D68A1E', borderRadius:6 }
        ] },
      options: baseOpts(theme)
    });
  }

  function baseOpts(theme){
    return {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ font:{size:11}, usePointStyle:true } } },
      scales:{
        x:{ grid:{ display:false }, ticks:{font:{size:10.5}} },
        y:{ grid:{ color: theme.grid }, ticks:{font:{size:10.5}} }
      }
    };
  }

  function renderRecentTable(patients){
    const recent = [...patients].slice(-8).reverse();
    const tbody = document.getElementById('recent-patients-body');
    tbody.innerHTML = recent.map(p=>{
      const rs = util.statusMeta(CAP_STATUSES, p.reportStatus);
      const ps = util.statusMeta(PAYMENT_STATUSES, p.paymentStatus);
      return `<tr>
        <td class="mono">${p.id}</td>
        <td><div class="name-cell"><div class="avatar-sm">${util.initials(p.name)}</div><div><div class="cell-name">${p.name}</div><div class="cell-sub">${p.gender}, ${p.age}y</div></div></div></td>
        <td>${p.phone}</td>
        <td>${p.doctor}</td>
        <td>${p.area}</td>
        <td>${p.testName}</td>
        <td>${util.fmtCurrency(p.finalAmount)}<br><span class="pill ${ps.pill}"><span class="cap-dot"></span>${ps.label}</span></td>
        <td><span class="pill ${rs.pill}"><span class="cap-dot"></span>${rs.label}</span></td>
        <td>${util.fmtDate(p.collectionDate)}</td>
        <td>
          <div class="table-actions">
            <a href="patients.html?edit=${p.id}" title="View / Edit"><button type="button">${icon('eye')}</button></a>
            <button type="button" title="Print" onclick="window.print()">${icon('printer')}</button>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="10"><div class="empty-state">${icon('inbox','icon-xl')}<p>No patients yet</p></div></td></tr>`;
  }

  function wireTableActions(){
    const viewAllBtn = document.getElementById('view-all-patients');
    viewAllBtn && viewAllBtn.addEventListener('click', ()=> window.location.href='patients.html');
  }
})();
