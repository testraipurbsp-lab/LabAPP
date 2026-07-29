/* ========================================================================
   areas.js — CRUD for Area Management
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 10;

  function fromDb(row){ return { ...row, collectionCharge: row.collection_charge }; }
  function toDb(a){
    return { name: a.name, city: a.city || null, pincode: a.pincode || null,
             collection_charge: a.collectionCharge, status: a.status };
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('areas');
    if(!session) return;
    VLAB.setPageTitle('Area Management', 'Vitals Lab / Area Management');
    const rows = await SB.data.list('areas', { order:'created_at', ascending:true });
    all = rows.map(fromDb);
    applyFilters();
    wire();
  });

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('add-area-btn').addEventListener('click', ()=>{
      document.getElementById('area-form').reset();
      document.getElementById('a-id').value='';
      document.getElementById('area-modal-title').textContent='Add Area';
      VLAB.openModal('area-modal');
    });
    document.getElementById('area-save-btn').addEventListener('click', save);
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    filtered = all.filter(a => !q || [a.name,a.city].some(v=>String(v).toLowerCase().includes(q)));
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('areas-table-body').innerHTML = items.map(a=>`
      <tr>
        <td class="cell-name">${util.escapeHtml(a.name)}</td>
        <td>${util.escapeHtml(a.city)}</td>
        <td class="mono">${a.pincode}</td>
        <td>${util.fmtCurrency(a.collectionCharge)}</td>
        <td><span class="pill ${a.status==='Active'?'pill-green':'pill-red'}"><span class="cap-dot"></span>${a.status}</span></td>
        <td><div class="table-actions">
          <button type="button" title="Edit" onclick="AreasModule.edit('${a.id}')">${icon('edit')}</button>
          <button type="button" title="Delete" class="danger" onclick="AreasModule.remove('${a.id}')">${icon('trash')}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="6"><div class="empty-state">${icon('map-pin','icon-xl')}<p>No areas found</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('areas-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  async function save(){
    const name = document.getElementById('a-name').value.trim();
    if(!name){ VLAB.toast('Area name is required.','error'); return; }
    const id = document.getElementById('a-id').value;
    const record = {
      name, city: document.getElementById('a-city').value,
      pincode: document.getElementById('a-pincode').value,
      collectionCharge: Number(document.getElementById('a-charge').value)||0,
      status: document.getElementById('a-status').value
    };

    const btn = document.getElementById('area-save-btn');
    btn.disabled = true;
    const saved = id
      ? await SB.data.update('areas', id, toDb(record))
      : await SB.data.insert('areas', toDb(record));
    btn.disabled = false;

    if(!saved){ VLAB.toast('Could not save area — please try again.', 'error'); return; }
    const full = fromDb(saved);
    if(id){ all[all.findIndex(x=>x.id===id)]=full; VLAB.toast('Area updated.','success'); }
    else{ all.push(full); VLAB.toast('Area added.','success'); }
    VLAB.closeModal('area-modal');
    applyFilters();
  }

  window.AreasModule = {
    edit(id){
      const a = all.find(x=>x.id===id); if(!a) return;
      document.getElementById('area-modal-title').textContent = `Edit Area — ${a.name}`;
      document.getElementById('a-id').value=a.id;
      document.getElementById('a-name').value=a.name;
      document.getElementById('a-city').value=a.city;
      document.getElementById('a-pincode').value=a.pincode;
      document.getElementById('a-charge').value=a.collectionCharge;
      document.getElementById('a-status').value=a.status;
      VLAB.openModal('area-modal');
    },
    remove(id){
      VLAB.confirmDelete('Delete this area?', async ()=>{
        const ok = await SB.data.remove('areas', id);
        if(!ok){ VLAB.toast('Could not delete area — please try again.', 'error'); return; }
        all = all.filter(x=>x.id!==id);
        VLAB.toast('Area deleted.','success');
        applyFilters();
      });
    }
  };
})();