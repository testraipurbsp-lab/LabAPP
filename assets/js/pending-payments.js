/* ========================================================================
   pending-payments.js
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 12;

  document.addEventListener('DOMContentLoaded', ()=>{
    const session = VLAB.renderShell('pending');
    if(!session) return;
    VLAB.setPageTitle('Pending Payments', 'Vitals Lab / Pending Payments');
    all = store.get(KEYS.pending, []);
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
      const matchesQ = !q || [p.patient,p.phone].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ && (!status || p.status===status);
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('pending-table-body').innerHTML = items.map(p=>`
      <tr>
        <td class="cell-name">${util.escapeHtml(p.patient)}</td>
        <td>${util.escapeHtml(p.doctor)}</td>
        <td>${p.phone}</td>
        <td>${util.escapeHtml(p.area)}</td>
        <td>${util.fmtCurrency(p.amount)}</td>
        <td>${util.fmtDate(p.dueDate)}</td>
        <td><span class="pill ${p.status==='overdue'?'pill-red':'pill-lavender'}"><span class="cap-dot"></span>${p.status==='overdue'?'Overdue':'Pending'}</span></td>
        <td><div class="table-actions">
          <button type="button" title="Call" onclick="PendingModule.call('${p.id}')">${icon('phone')}</button>
          <button type="button" title="Reminder" onclick="PendingModule.remind('${p.id}')">${icon('bell')}</button>
          <button type="button" title="Mark Paid" onclick="PendingModule.markPaid('${p.id}')">${icon('check')}</button>
          <button type="button" title="Print" onclick="window.print()">${icon('printer')}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty-state">${icon('check-circle','icon-xl')}<p>No pending payments</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('pending-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  window.PendingModule = {
    call(id){ const p=all.find(x=>x.id===id); VLAB.toast(`Calling ${p.patient} at ${p.phone}…`,'info'); },
    remind(id){ const p=all.find(x=>x.id===id); VLAB.toast(`Reminder sent to ${p.patient}.`,'success'); },
    markPaid(id){
      VLAB.confirmDelete('Mark this payment as fully paid and remove from pending list?', ()=>{
        all = all.filter(x=>x.id!==id);
        store.set(KEYS.pending, all);
        VLAB.toast('Payment marked as paid.','success');
        applyFilters();
      });
    }
  };
})();
