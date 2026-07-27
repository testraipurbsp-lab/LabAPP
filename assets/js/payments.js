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
    populatePatientList();
    applyFilters();
    wire();
  });

  function populatePatientList(){
    const patients = store.get(KEYS.patients, []);
    const list = document.getElementById('pay-patient-list');
    list.innerHTML = patients.map(p=>`<option value="${util.escapeHtml(p.name)}">`).join('');
  }

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

    document.getElementById('add-payment-btn').addEventListener('click', ()=>{
      document.getElementById('payment-form').reset();
      document.getElementById('pay-id').value='';
      document.getElementById('pay-final').value='';
      document.getElementById('pay-date').value = util.fmtDateInput(new Date());
      document.getElementById('payment-modal-title').textContent = 'Record Payment';
      VLAB.openModal('payment-modal');
    });
    document.getElementById('pay-amount').addEventListener('input', recalcPayFinal);
    document.getElementById('pay-discount').addEventListener('input', recalcPayFinal);
    document.getElementById('payment-save-btn').addEventListener('click', savePayment);
  }

  function recalcPayFinal(){
    const amount = Number(document.getElementById('pay-amount').value)||0;
    const discount = Number(document.getElementById('pay-discount').value)||0;
    document.getElementById('pay-final').value = Math.max(0, amount-discount);
  }

  function savePayment(){
    const patient = document.getElementById('pay-patient').value.trim();
    const amount = Number(document.getElementById('pay-amount').value)||0;
    if(!patient || !amount){ VLAB.toast('Patient name and amount are required.', 'error'); return; }
    const id = document.getElementById('pay-id').value;
    const discount = Number(document.getElementById('pay-discount').value)||0;
    const existing = id ? all.find(p=>p.id===id) : null;
    const record = {
      id: id || util.uid('RC', all.length+1+Math.floor(Math.random()*900)),
      patientId: existing ? existing.patientId : null,
      patient, doctor: document.getElementById('pay-doctor').value,
      area: document.getElementById('pay-area').value,
      amount, discount, finalAmount: Math.max(0, amount-discount),
      method: document.getElementById('pay-method').value,
      status: document.getElementById('pay-status').value,
      date: document.getElementById('pay-date').value || util.fmtDateInput(new Date())
    };
    if(id){ all[all.findIndex(x=>x.id===id)] = record; VLAB.toast('Payment updated.', 'success'); }
    else{ all.push(record); VLAB.toast('Payment recorded.', 'success'); }
    store.set(KEYS.payments, all);
    VLAB.closeModal('payment-modal');
    renderStats();
    applyFilters();
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
          <button type="button" title="Edit" onclick="PaymentsModule.edit('${p.id}')">${icon('edit')}</button>
          <button type="button" title="Download PDF" onclick="PaymentsModule.pdf('${p.id}')">${icon('download')}</button>
          <button type="button" title="Print" onclick="window.print()">${icon('printer')}</button>
          <button type="button" title="Delete" class="danger" onclick="PaymentsModule.remove('${p.id}')">${icon('trash')}</button>
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
    },
    edit(id){
      const p = all.find(x=>x.id===id); if(!p) return;
      document.getElementById('payment-modal-title').textContent = `Edit Payment — ${p.id}`;
      document.getElementById('pay-id').value = p.id;
      document.getElementById('pay-patient').value = p.patient;
      document.getElementById('pay-doctor').value = p.doctor||'';
      document.getElementById('pay-area').value = p.area||'';
      document.getElementById('pay-amount').value = p.amount;
      document.getElementById('pay-discount').value = p.discount;
      document.getElementById('pay-final').value = p.finalAmount;
      document.getElementById('pay-method').value = p.method;
      document.getElementById('pay-status').value = p.status;
      document.getElementById('pay-date').value = p.date;
      VLAB.openModal('payment-modal');
      if(p.patientId){
        VLAB.toast('This receipt is linked to a patient record — editing it here will not update the Patients module.', 'warning');
      }
    },
    remove(id){
      const p = all.find(x=>x.id===id);
      const msg = p && p.patientId
        ? 'This receipt is linked to a patient record. Deleting it here only removes the receipt, not the patient. Continue?'
        : 'Delete this payment record?';
      VLAB.confirmDelete(msg, ()=>{
        all = all.filter(x=>x.id!==id);
        store.set(KEYS.payments, all);
        VLAB.toast('Payment deleted.', 'success');
        renderStats();
        applyFilters();
      });
    }
  };
})();
