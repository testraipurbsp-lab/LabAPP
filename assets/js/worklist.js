/* ========================================================================
   worklist.js — lab-wide booking worklist: every patient visit, filterable
   by date range / report status / doctor. Read-only; actions link out to
   Patients (edit) and the printed report, same as everywhere else.
   ======================================================================== */
(function(){
  const { util, icon, CAP_STATUSES } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 15;

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('worklist');
    if(!session) return;
    VLAB.setPageTitle('Worklist', 'Vitals Lab / Worklist');

    const [patients, doctors, testLines] = await Promise.all([
      SB.data.list('patients', { order:'collection_date', ascending:false }),
      SB.data.list('doctors', { order:'name', ascending:true }),
      SB.client.from('patient_tests').select('patient_id, result_status')
    ]);

    const testCounts = {};
    (testLines.data||[]).forEach(r=>{
      if(!testCounts[r.patient_id]) testCounts[r.patient_id] = { total:0, done:0 };
      testCounts[r.patient_id].total++;
      if(r.result_status==='completed') testCounts[r.patient_id].done++;
    });

    all = patients.map(p=>({
      id: p.id, patientCode: p.patient_code||p.id, name: p.name, age: p.age, gender: p.gender,
      doctor: p.doctor, finalAmount: Number(p.final_amount)||0, paymentStatus: p.payment_status,
      reportStatus: p.report_status, collectionDate: p.collection_date, phone: p.phone,
      testsDone: (testCounts[p.id]||{done:0}).done, testsTotal: (testCounts[p.id]||{total:0}).total
    }));

    populateFilters(doctors);
    applyFilters();
    wire();
  });

  function populateFilters(doctors){
    const statusSel = document.getElementById('filter-status');
    CAP_STATUSES.forEach(s=> statusSel.insertAdjacentHTML('beforeend', `<option value="${s.key}">${s.label}</option>`));
    const docSel = document.getElementById('filter-doctor');
    doctors.forEach(d=> docSel.insertAdjacentHTML('beforeend', `<option value="${util.escapeHtml(d.name)}">${util.escapeHtml(d.name)}</option>`));
  }

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    ['filter-from','filter-to','filter-status','filter-doctor'].forEach(id=>{
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('clear-filters-btn').addEventListener('click', ()=>{
      document.getElementById('search-input').value='';
      document.getElementById('filter-from').value='';
      document.getElementById('filter-to').value='';
      document.getElementById('filter-status').value='';
      document.getElementById('filter-doctor').value='';
      applyFilters();
    });
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const from = document.getElementById('filter-from').value;
    const to = document.getElementById('filter-to').value;
    const status = document.getElementById('filter-status').value;
    const doctor = document.getElementById('filter-doctor').value;

    filtered = all.filter(p=>{
      const matchesQ = !q || [p.name,p.phone].some(v=>String(v).toLowerCase().includes(q));
      const matchesFrom = !from || (p.collectionDate && p.collectionDate >= from);
      const matchesTo = !to || (p.collectionDate && p.collectionDate <= to);
      const matchesStatus = !status || p.reportStatus === status;
      const matchesDoctor = !doctor || p.doctor === doctor;
      return matchesQ && matchesFrom && matchesTo && matchesStatus && matchesDoctor;
    });
    currentPage = 1;
    render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate(filtered, currentPage, PER_PAGE);
    document.getElementById('worklist-table-body').innerHTML = items.map(p=>{
      const rs = util.statusMeta(CAP_STATUSES, p.reportStatus);
      return `<tr>
        <td class="mono">${util.escapeHtml(p.patientCode)}</td>
        <td><div class="name-cell"><div class="avatar-sm">${util.initials(p.name)}</div><div class="cell-name">${util.escapeHtml(p.name)}</div></div></td>
        <td>${p.age||'—'} / ${util.escapeHtml(p.gender||'—')}</td>
        <td>${util.escapeHtml(p.doctor||'—')}</td>
        <td>${p.testsTotal ? `<span style="color:${p.testsDone===p.testsTotal?'var(--success,#22A06B)':'inherit'};font-weight:${p.testsDone===p.testsTotal?'600':'400'};">${p.testsDone}/${p.testsTotal}</span>` : '—'}</td>
        <td>${util.fmtCurrency(p.finalAmount)}</td>
        <td><span class="pill ${p.paymentStatus==='paid'?'pill-green':'pill-lavender'}"><span class="cap-dot"></span>${p.paymentStatus||'—'}</span></td>
        <td><span class="pill ${rs.pill}"><span class="cap-dot"></span>${rs.label}</span></td>
        <td>${p.collectionDate?util.fmtDate(p.collectionDate):'—'}</td>
        <td><div class="table-actions">
          <a href="patients.html?edit=${p.id}" title="View / Edit"><button type="button">${icon('eye')}</button></a>
          <a href="report-print.html?id=${p.id}" target="_blank" title="View Report"><button type="button">${icon('printer')}</button></a>
        </div></td>
      </tr>`;
    }).join('') || `<tr><td colspan="10"><div class="empty-state">${icon('inbox','icon-xl')}<p>No bookings match these filters</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('worklist-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }
})();