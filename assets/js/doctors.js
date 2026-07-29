/* ========================================================================
   doctors.js — CRUD for Doctor Management
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;
  let all = [], filtered = [], currentPage = 1;
  const PER_PAGE = 10;

  // doctors table columns already match the JS field names 1:1 except for
  // the id (real UUID) vs the friendly doctor_code shown in the UI.
  function fromDb(row){ return { ...row, doctorCode: row.doctor_code }; }
  function toDb(d){
    return {
      name: d.name, specialization: d.specialization || null, hospital: d.hospital || null,
      clinic: d.clinic || null, phone: d.phone, email: d.email || null,
      address: d.address || null, commission: d.commission, status: d.status, notes: d.notes || null
    };
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('doctors');
    if(!session) return;
    VLAB.setPageTitle('Doctors', 'Vitals Lab / Doctor Management');
    const rows = await SB.data.list('doctors', { order:'created_at', ascending:true });
    all = rows.map(fromDb);
    applyFilters();
    wire();
  });

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('filter-status').addEventListener('change', applyFilters);
    document.getElementById('add-doctor-btn').addEventListener('click', ()=>{
      document.getElementById('doctor-form').reset();
      document.getElementById('d-id').value='';
      document.getElementById('doctor-modal-title').textContent='Add Doctor';
      VLAB.openModal('doctor-modal');
    });
    document.getElementById('doctor-save-btn').addEventListener('click', save);
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('filter-status').value;
    filtered = all.filter(d=>{
      const matchesQ = !q || [d.name,d.hospital,d.specialization].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ && (!status || d.status===status);
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('doctors-table-body').innerHTML = items.map(d=>`
      <tr>
        <td><div class="name-cell"><div class="avatar-sm">${util.initials(d.name)}</div><div><div class="cell-name">${util.escapeHtml(d.name)}</div><div class="cell-sub">${d.doctorCode||d.id}</div></div></div></td>
        <td>${util.escapeHtml(d.specialization)}</td>
        <td>${util.escapeHtml(d.hospital)}<div class="cell-sub">${util.escapeHtml(d.clinic||'')}</div></td>
        <td>${d.phone}</td>
        <td>${d.commission}%</td>
        <td><span class="pill ${d.status==='Active'?'pill-green':'pill-red'}"><span class="cap-dot"></span>${d.status}</span></td>
        <td><div class="table-actions">
          <button type="button" title="Edit" onclick="DoctorsModule.edit('${d.id}')">${icon('edit')}</button>
          <button type="button" title="Delete" class="danger" onclick="DoctorsModule.remove('${d.id}')">${icon('trash')}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="7"><div class="empty-state">${icon('stethoscope','icon-xl')}<p>No doctors found</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('doctors-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  async function save(){
    const name = document.getElementById('d-name').value.trim();
    const phone = document.getElementById('d-phone').value.trim();
    if(!name || !phone){ VLAB.toast('Doctor name and phone are required.','error'); return; }
    const id = document.getElementById('d-id').value;
    const record = {
      name, specialization: document.getElementById('d-spec').value,
      hospital: document.getElementById('d-hospital').value,
      clinic: document.getElementById('d-clinic').value,
      phone, email: document.getElementById('d-email').value,
      address: document.getElementById('d-address').value,
      commission: Number(document.getElementById('d-commission').value)||0,
      status: document.getElementById('d-status').value,
      notes: document.getElementById('d-notes').value
    };

    const btn = document.getElementById('doctor-save-btn');
    btn.disabled = true;
    const saved = id
      ? await SB.data.update('doctors', id, toDb(record))
      : await SB.data.insert('doctors', toDb(record));
    btn.disabled = false;

    if(!saved){ VLAB.toast('Could not save doctor — please try again.', 'error'); return; }
    const full = fromDb(saved);
    if(id){ all[all.findIndex(x=>x.id===id)] = full; VLAB.toast('Doctor updated.','success'); }
    else{ all.push(full); VLAB.toast('Doctor added.','success'); }
    VLAB.closeModal('doctor-modal');
    applyFilters();
  }

  window.DoctorsModule = {
    edit(id){
      const d = all.find(x=>x.id===id); if(!d) return;
      document.getElementById('doctor-modal-title').textContent = `Edit Doctor — ${d.doctorCode||d.id}`;
      document.getElementById('d-id').value=d.id;
      document.getElementById('d-name').value=d.name;
      document.getElementById('d-spec').value=d.specialization;
      document.getElementById('d-hospital').value=d.hospital;
      document.getElementById('d-clinic').value=d.clinic;
      document.getElementById('d-phone').value=d.phone;
      document.getElementById('d-email').value=d.email;
      document.getElementById('d-address').value=d.address;
      document.getElementById('d-commission').value=d.commission;
      document.getElementById('d-status').value=d.status;
      document.getElementById('d-notes').value=d.notes;
      VLAB.openModal('doctor-modal');
    },
    remove(id){
      VLAB.confirmDelete('Delete this doctor record?', async ()=>{
        const ok = await SB.data.remove('doctors', id);
        if(!ok){ VLAB.toast('Could not delete doctor — please try again.', 'error'); return; }
        all = all.filter(x=>x.id!==id);
        VLAB.toast('Doctor deleted.','success');
        applyFilters();
      });
    }
  };
})();