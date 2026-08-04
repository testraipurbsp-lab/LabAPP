/* ========================================================================
   pending-payments.js
   Derived from the real Patients data (payment_status != paid) rather than
   a separate table — patients already carry phone, doctor, area, and the
   same payment_status used everywhere else, so this stays in sync with
   Patients and Payments automatically instead of needing its own entry.
   ======================================================================== */
(function(){
  const { util, icon, PAYMENT_STATUSES } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 12;

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('pending');
    if(!session) return;
    VLAB.setPageTitle('Pending Payments', 'Vitals Lab / Pending Payments');
    const rows = await SB.data.list('patients', { order:'created_at', ascending:false });
    all = rows.filter(p=>p.payment_status && p.payment_status!=='paid');
    applyFilters();
    wire();
  });

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('filter-status').addEventListener('change', applyFilters);
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    filtered = all.filter(p=>{
      const matchesQ = !q || [p.name,p.phone].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ && (!status || p.payment_status===status);
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate(filtered, currentPage, PER_PAGE);
    document.getElementById('pending-table-body').innerHTML = items.map(p=>{
      const st = PAYMENT_STATUSES.find(s=>s.key===p.payment_status) || {label:p.payment_status, pill:'pill-lavender'};
      return `
      <tr>
        <td class="cell-name">${util.escapeHtml(p.name)}</td>
        <td>${util.escapeHtml(p.doctor||'—')}</td>
        <td>${util.escapeHtml(p.phone||'—')}</td>
        <td>${util.escapeHtml(p.area||'—')}</td>
        <td>${util.fmtCurrency(p.final_amount||0)}</td>
        <td>${p.collection_date?util.fmtDate(p.collection_date):'—'}</td>
        <td><span class="pill ${st.pill}"><span class="cap-dot"></span>${st.label}</span></td>
        <td><div class="table-actions">
          <button type="button" title="Call" onclick="PendingModule.call('${p.id}')">${icon('phone')}</button>
          <button type="button" title="Reminder" onclick="PendingModule.remind('${p.id}')">${icon('bell')}</button>
          <button type="button" title="Mark Paid" onclick="PendingModule.markPaid('${p.id}')">${icon('check')}</button>
          <button type="button" title="Print" onclick="window.print()">${icon('printer')}</button>
        </div></td>
      </tr>`;}).join('') || `<tr><td colspan="8"><div class="empty-state">${icon('check-circle','icon-xl')}<p>No pending payments</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('pending-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  window.PendingModule = {
    call(id){ const p=all.find(x=>x.id===id); VLAB.toast(`Calling ${p.name} at ${p.phone}…`,'info'); },
    remind(id){ const p=all.find(x=>x.id===id); VLAB.toast(`Reminder sent to ${p.name}.`,'success'); },
    markPaid(id){
      const p = all.find(x=>x.id===id);
      VLAB.confirmDelete('Mark this payment as fully paid?', async ()=>{
        const ok1 = await SB.data.update('patients', id, { payment_status:'paid' });
        if(!ok1){ VLAB.toast('Could not update patient — please try again.', 'error'); return; }
        // Keep the synced receipt on the Payments page consistent too.
        const { data: existing } = await SB.client.from('payments').select('id').eq('patient_id', id).maybeSingle();
        if(existing) await SB.data.update('payments', existing.id, { status:'paid' });
        all = all.filter(x=>x.id!==id);
        VLAB.toast(`${p?p.name:'Patient'} marked as paid.`,'success');
        applyFilters();
      });
    }
  };
})();