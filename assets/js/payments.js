/* ========================================================================
   payments.js — Payments / Billing module
   ======================================================================== */
(function(){
  const { store, util, KEYS, PAYMENT_STATUSES, icon } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 12;

  document.addEventListener('DOMContentLoaded', ()=>{
    const session = VLAB.renderShell('payments');
    if(!session) return;
    VLAB.setPageTitle('Payments & Billing', 'Vitals Lab / Payments');
    all = store.get(KEYS.payments, []);
    renderStats();
    populateStatusFilter();
    applyFilters();
    wire();
  });

  function renderStats(){
    const today = util.fmtDateInput(new Date());
    const todayCollection = all.filter(p=>p.date===today).reduce((s,p)=>s+p.finalAmount,0);
    const now = new Date();
    const monthCollection = all.filter(p=>{ const d=new Date(p.date); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).reduce((s,p)=>s+p.finalAmount,0);
    const pendingTotal = store.get(KEYS.pending, []).reduce((s,p)=>s+p.amount,0);
    const totalRevenue = all.reduce((s,p)=>s+p.finalAmount,0);

    const cards = [
      {icon:'wallet', bg:'bg-info-soft', label:"Today's Collection", val:todayCollection},
      {icon:'calendar', bg:'bg-primary-soft', label:'Monthly Collection', val:monthCollection},
      {icon:'clock', bg:'bg-warning-soft', label:'Pending Payments', val:pendingTotal},
      {icon:'dollar-sign', bg:'bg-success-soft', label:'Total Revenue', val:totalRevenue},
    ];
    document.getElementById('payment-stat-grid').innerHTML = cards.map(c=>`
      <div class="stat-card">
        <div class="stat-icon ${c.bg}">${icon(c.icon)}</div>
        <div class="stat-num">${util.fmtCurrency(c.val)}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join('');
  }

  function populateStatusFilter(){
    const sel = document.getElementById('filter-status');
    PAYMENT_STATUSES.forEach(s=> sel.insertAdjacentHTML('beforeend', `<option value="${s.key}">${s.label}</option>`));
  }

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('filter-status').addEventListener('change', applyFilters);
    document.getElementById('filter-method').addEventListener('change', applyFilters);
    document.getElementById('export-btn').addEventListener('click', ()=>{
      const headers=['Receipt No','Patient','Doctor','Area','Amount','Discount','Final Amount','Method','Status','Date'];
      const rows = filtered.map(p=>[p.id,p.patient,p.doctor,p.area,p.amount,p.discount,p.finalAmount,p.method,p.status,p.date]);
      VLAB.exportCSV('payments.csv', headers, rows);
    });
    document.getElementById('print-btn').addEventListener('click', ()=>window.print());
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    const method = document.getElementById('filter-method').value;
    filtered = all.filter(p=>{
      const matchesQ = !q || [p.patient,p.doctor,p.id].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ && (!status || p.status===status) && (!method || p.method===method);
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('payments-table-body').innerHTML = items.map(p=>{
      const st = util.statusMeta(PAYMENT_STATUSES, p.status);
      return `<tr>
        <td class="mono">${p.id}</td>
        <td class="cell-name">${util.escapeHtml(p.patient)}</td>
        <td>${util.escapeHtml(p.doctor)}</td>
        <td>${util.escapeHtml(p.area)}</td>
        <td>${util.fmtCurrency(p.amount)}</td>
        <td>${util.fmtCurrency(p.discount)}</td>
        <td class="cell-name">${util.fmtCurrency(p.finalAmount)}</td>
        <td>${p.method}</td>
        <td><span class="pill ${st.pill}"><span class="cap-dot"></span>${st.label}</span></td>
        <td>${util.fmtDate(p.date)}</td>
        <td><div class="table-actions">
          <button type="button" title="Generate Receipt" onclick="PaymentsModule.receipt('${p.id}')">${icon('receipt')}</button>
          <button type="button" title="Download PDF" onclick="PaymentsModule.pdf('${p.id}')">${icon('download')}</button>
          <button type="button" title="Print" onclick="window.print()">${icon('printer')}</button>
        </div></td>
      </tr>`;
    }).join('') || `<tr><td colspan="11"><div class="empty-state">${icon('receipt','icon-xl')}<p>No payments found</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('payments-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  window.PaymentsModule = {
    receipt(id){
      const p = all.find(x=>x.id===id);
      VLAB.toast(`Receipt ${p.id} for ${p.patient} generated.`, 'success', 'Receipt Ready');
    },
    pdf(id){
      VLAB.toast('PDF export is a demo action — connect a backend to enable real downloads.', 'info');
    }
  };
})();
