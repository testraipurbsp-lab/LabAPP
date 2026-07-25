/* ========================================================================
   reports.js — Daily/Weekly/Monthly/Revenue/Expense/Collection/Patient reports
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;
  let session;

  document.addEventListener('DOMContentLoaded', ()=>{
    session = VLAB.renderShell('reports');
    if(!session) return;
    VLAB.setPageTitle('Reports', 'Vitals Lab / Reports');

    if(session.role !== 'admin'){
      document.getElementById('expense-report-opt').remove();
    }

    document.getElementById('report-type').addEventListener('change', renderReport);
    document.getElementById('print-report-btn').addEventListener('click', ()=>window.print());
    document.getElementById('pdf-report-btn').addEventListener('click', ()=> VLAB.toast('PDF export is a demo action — connect a backend to enable real downloads.','info'));
    document.getElementById('export-report-btn').addEventListener('click', exportCurrent);

    renderReport();
  });

  function withinDays(dateStr, days){
    const d = new Date(dateStr);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days);
    return d >= cutoff;
  }
  function withinMonth(dateStr){
    const d = new Date(dateStr); const now = new Date();
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }

  let lastHeaders=[], lastRows=[];

  function renderReport(){
    const type = document.getElementById('report-type').value;
    if(type === 'expense' && session.role !== 'admin'){ document.getElementById('report-type').value='daily'; return renderReport(); }

    const patients = store.get(KEYS.patients, []);
    const payments = store.get(KEYS.payments, []);
    const expenses = store.get(KEYS.expenses, []);

    let title='', headers=[], rows=[], stats=[];

    if(type==='daily'){
      title='Daily Report — Today';
      const today = util.fmtDateInput(new Date());
      const todays = patients.filter(p=>p.collectionDate===today);
      headers = ['Patient ID','Name','Test','Doctor','Amount','Report Status'];
      rows = todays.map(p=>[p.id,p.name,p.testName,p.doctor,util.fmtCurrency(p.finalAmount),p.reportStatus]);
      stats = [
        {label:'Patients Today', val: todays.length, icon:'activity'},
        {label:'Revenue Today', val: util.fmtCurrency(todays.reduce((s,p)=>s+p.finalAmount,0)), icon:'dollar-sign'},
        {label:'Reports Ready', val: todays.filter(p=>p.reportStatus==='completed').length, icon:'check-circle'},
        {label:'Pending', val: todays.filter(p=>p.reportStatus!=='completed').length, icon:'hourglass'},
      ];
    }
    else if(type==='weekly'){
      title='Weekly Report — Last 7 Days';
      const week = patients.filter(p=>withinDays(p.collectionDate,7));
      headers = ['Patient ID','Name','Test','Doctor','Amount','Date'];
      rows = week.map(p=>[p.id,p.name,p.testName,p.doctor,util.fmtCurrency(p.finalAmount),util.fmtDate(p.collectionDate)]);
      stats = [
        {label:'Patients (7d)', val: week.length, icon:'activity'},
        {label:'Revenue (7d)', val: util.fmtCurrency(week.reduce((s,p)=>s+p.finalAmount,0)), icon:'dollar-sign'},
        {label:'Avg / Day', val: Math.round(week.length/7), icon:'trending-up'},
        {label:'Unique Doctors', val: new Set(week.map(p=>p.doctor)).size, icon:'stethoscope'},
      ];
    }
    else if(type==='monthly'){
      title='Monthly Report — This Month';
      const month = patients.filter(p=>withinMonth(p.collectionDate));
      headers = ['Patient ID','Name','Test','Doctor','Amount','Date'];
      rows = month.map(p=>[p.id,p.name,p.testName,p.doctor,util.fmtCurrency(p.finalAmount),util.fmtDate(p.collectionDate)]);
      stats = [
        {label:'Patients (Month)', val: month.length, icon:'activity'},
        {label:'Revenue (Month)', val: util.fmtCurrency(month.reduce((s,p)=>s+p.finalAmount,0)), icon:'dollar-sign'},
        {label:'Avg Bill', val: util.fmtCurrency(month.length? Math.round(month.reduce((s,p)=>s+p.finalAmount,0)/month.length):0), icon:'calculator'},
        {label:'Discounts Given', val: util.fmtCurrency(month.reduce((s,p)=>s+p.discount,0)), icon:'tag'},
      ];
    }
    else if(type==='revenue'){
      title='Revenue Report — All Receipts';
      headers = ['Receipt No','Patient','Doctor','Final Amount','Method','Date'];
      rows = payments.map(p=>[p.id,p.patient,p.doctor,util.fmtCurrency(p.finalAmount),p.method,util.fmtDate(p.date)]);
      const total = payments.reduce((s,p)=>s+p.finalAmount,0);
      stats = [
        {label:'Total Revenue', val: util.fmtCurrency(total), icon:'dollar-sign'},
        {label:'Total Receipts', val: payments.length, icon:'receipt'},
        {label:'Avg Receipt', val: util.fmtCurrency(payments.length?Math.round(total/payments.length):0), icon:'calculator'},
        {label:'This Month', val: util.fmtCurrency(payments.filter(p=>withinMonth(p.date)).reduce((s,p)=>s+p.finalAmount,0)), icon:'calendar'},
      ];
    }
    else if(type==='expense'){
      title='Expense Report — All Expenses';
      headers = ['Expense','Category','Vendor','Amount','Mode','Date'];
      rows = expenses.map(e=>[e.name,e.category,e.vendor,util.fmtCurrency(e.amount),e.paymentMode,util.fmtDate(e.date)]);
      const total = expenses.reduce((s,e)=>s+e.amount,0);
      stats = [
        {label:'Total Expenses', val: util.fmtCurrency(total), icon:'receipt'},
        {label:'Entries', val: expenses.length, icon:'list'},
        {label:'This Month', val: util.fmtCurrency(expenses.filter(e=>withinMonth(e.date)).reduce((s,e)=>s+e.amount,0)), icon:'calendar'},
        {label:'Top Category', val: topCategory(expenses), icon:'tag'},
      ];
    }
    else if(type==='collection'){
      title='Collection Report — Payment Methods';
      const byMethod = {};
      payments.forEach(p=>{ byMethod[p.method]=(byMethod[p.method]||0)+p.finalAmount; });
      headers = ['Payment Method','Total Collected','Transactions'];
      rows = Object.keys(byMethod).map(m=>[m, util.fmtCurrency(byMethod[m]), payments.filter(p=>p.method===m).length]);
      stats = [
        {label:'Total Collected', val: util.fmtCurrency(payments.reduce((s,p)=>s+p.finalAmount,0)), icon:'wallet'},
        {label:'Cash', val: util.fmtCurrency(byMethod['Cash']||0), icon:'dollar-sign'},
        {label:'UPI', val: util.fmtCurrency(byMethod['UPI']||0), icon:'smartphone'},
        {label:'Card', val: util.fmtCurrency(byMethod['Card']||0), icon:'credit-card'},
      ];
    }
    else if(type==='patient'){
      title='Patient Report — Demographics';
      headers = ['Patient ID','Name','Gender','Age','Area','Doctor'];
      rows = patients.map(p=>[p.id,p.name,p.gender,p.age,p.area,p.doctor]);
      stats = [
        {label:'Total Patients', val: patients.length, icon:'activity'},
        {label:'Male', val: patients.filter(p=>p.gender==='Male').length, icon:'user'},
        {label:'Female', val: patients.filter(p=>p.gender==='Female').length, icon:'user'},
        {label:'Avg Age', val: Math.round(patients.reduce((s,p)=>s+p.age,0)/patients.length), icon:'gift'},
      ];
    }

    document.getElementById('report-table-title').textContent = title;
    document.getElementById('report-stat-grid').innerHTML = stats.map(s=>`
      <div class="stat-card"><div class="stat-icon bg-primary-soft">${icon(s.icon)}</div>
      <div class="stat-num">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');

    document.getElementById('report-thead').innerHTML = '<tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr>';
    document.getElementById('report-tbody').innerHTML = rows.length
      ? rows.map(r=>'<tr>'+r.map(c=>`<td>${c}</td>`).join('')+'</tr>').join('')
      : `<tr><td colspan="${headers.length}"><div class="empty-state">${icon('file-text','icon-xl')}<p>No data for this report</p></div></td></tr>`;

    lastHeaders = headers; lastRows = rows;
  }

  function topCategory(expenses){
    const totals={};
    expenses.forEach(e=> totals[e.category]=(totals[e.category]||0)+e.amount);
    const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
    return sorted.length? sorted[0][0] : '—';
  }

  function exportCurrent(){
    VLAB.exportCSV('report.csv', lastHeaders, lastRows);
  }
})();
