/* ========================================================================
   analytics.js — Revenue/Doctor/Area/Growth/Tests/Income-vs-Expense analytics
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;

  document.addEventListener('DOMContentLoaded', ()=>{
    const session = VLAB.renderShell('analytics');
    if(!session) return;
    VLAB.setPageTitle('Analytics', 'Vitals Lab / Analytics');

    if(session.role !== 'admin'){
      document.getElementById('income-expense-card').innerHTML = `
        <div class="card-header"><h3>Income vs Expenses</h3></div>
        <div class="locked-banner" style="border:none;padding:40px 20px;">
          ${icon('lock','icon-xl')}<p>Financial analytics are visible to administrators only.</p>
        </div>`;
    }

    renderCharts(session);
  });

  function months(n){
    const arr=[]; const d=new Date();
    for(let i=n-1;i>=0;i--){ const dt=new Date(d.getFullYear(),d.getMonth()-i,1); arr.push(dt.toLocaleDateString('en-IN',{month:'short'})); }
    return arr;
  }

  function renderCharts(session){
    const dark = document.documentElement.getAttribute('data-theme')==='dark';
    Chart.defaults.font.family = "'Inter',sans-serif";
    Chart.defaults.color = dark?'#9AA4B8':'#6B7688';
    const gridColor = dark?'#2A3140':'#EEF1F6';
    const opts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{font:{size:11},usePointStyle:true}}}, scales:{x:{grid:{display:false}},y:{grid:{color:gridColor}}} };

    new Chart(document.getElementById('chart-revenue-analytics'), {
      type:'line',
      data:{ labels: months(6), datasets:[{ label:'Revenue', data: months(6).map(()=>util.rand(90000,260000)), borderColor:'#2E5EAA', backgroundColor:'rgba(46,94,170,.08)', fill:true, tension:.4 }] },
      options: opts
    });

    new Chart(document.getElementById('chart-patient-growth'), {
      type:'bar',
      data:{ labels: months(6), datasets:[{ label:'New Patients', data: months(6).map(()=>util.rand(60,220)), backgroundColor:'#17A2A0', borderRadius:6 }] },
      options: opts
    });

    const doctors = store.get(KEYS.doctors, []).slice(0,8);
    new Chart(document.getElementById('chart-doctor-perf'), {
      type:'bar',
      data:{ labels: doctors.map(d=>d.name.replace('Dr. ','')), datasets:[{ label:'Referrals', data: doctors.map(()=>util.rand(5,60)), backgroundColor:'#8E7CC3', borderRadius:6 }] },
      options: { ...opts, indexAxis:'y' }
    });

    const areas = store.get(KEYS.areas, []).slice(0,8);
    new Chart(document.getElementById('chart-area-collection'), {
      type:'bar',
      data:{ labels: areas.map(a=>a.name), datasets:[{ label:'Collection ₹', data: areas.map(()=>util.rand(8000,60000)), backgroundColor:'#3F76BF', borderRadius:6 }] },
      options: { ...opts, indexAxis:'y' }
    });

    const tests = [...new Set(VLAB.pools.testNames)].slice(0,7);
    new Chart(document.getElementById('chart-popular-tests'), {
      type:'doughnut',
      data:{ labels: tests, datasets:[{ data: tests.map(()=>util.rand(20,150)), backgroundColor:['#2E5EAA','#17A2A0','#8E7CC3','#C79A2E','#4C9A6A','#3F76BF','#D68A1E'], borderWidth:0 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right', labels:{boxWidth:9,font:{size:10}}}} }
    });

    if(session.role === 'admin'){
      new Chart(document.getElementById('chart-income-expense'), {
        type:'bar',
        data:{ labels: months(6), datasets:[
          { label:'Income', data: months(6).map(()=>util.rand(90000,260000)), backgroundColor:'#22A06B', borderRadius:6 },
          { label:'Expenses', data: months(6).map(()=>util.rand(20000,80000)), backgroundColor:'#E5484D', borderRadius:6 }
        ]},
        options: opts
      });
    }
  }
})();
