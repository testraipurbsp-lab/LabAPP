/* ========================================================================
   tests.js — CRUD for the Tests catalog (category, name, unit, pricing)
   ======================================================================== */
(function(){
  const { util, icon } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 10;

  function fromDb(row){
    return { ...row, sampleType: row.sample_type, normalRange: row.normal_range, reportTime: row.report_time, resultType: row.result_type||'parameter' };
  }
  function toDb(t){
    return {
      name: t.name, category: t.category || null, unit: t.unit || null,
      sample_type: t.sampleType || null, normal_range: t.normalRange || null,
      price: t.price, report_time: t.reportTime || null, status: t.status,
      result_type: t.resultType || 'parameter'
    };
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('tests');
    if(!session) return;
    VLAB.setPageTitle('Tests', 'Vitals Lab / Test Catalog');
    const rows = await SB.data.list('tests', { order:'created_at', ascending:true });
    all = rows.map(fromDb);
    populateCategoryOptions();
    applyFilters();
    wire();
  });

  function populateCategoryOptions(){
    const categories = [...new Set(all.map(t=>t.category).filter(Boolean))].sort();
    const filterSel = document.getElementById('filter-category');
    const currentValue = filterSel.value;
    filterSel.innerHTML = '<option value="">All Categories</option>' +
      categories.map(c=>`<option value="${util.escapeHtml(c)}">${util.escapeHtml(c)}</option>`).join('');
    filterSel.value = categories.includes(currentValue) ? currentValue : '';
    document.getElementById('t-category-list').innerHTML = categories.map(c=>`<option value="${util.escapeHtml(c)}">`).join('');
  }

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('filter-category').addEventListener('change', applyFilters);
    document.getElementById('add-test-btn').addEventListener('click', ()=>{
      document.getElementById('test-form').reset();
      document.getElementById('t-id').value='';
      document.getElementById('test-modal-title').textContent='Add Test';
      toggleResultTypeFields();
      VLAB.openModal('test-modal');
    });
    document.getElementById('t-resulttype').addEventListener('change', toggleResultTypeFields);
    document.getElementById('test-save-btn').addEventListener('click', save);
  }
  function toggleResultTypeFields(){
    const isDescriptive = document.getElementById('t-resulttype').value === 'descriptive';
    document.getElementById('t-unit-wrap').style.display = isDescriptive ? 'none' : 'block';
    document.getElementById('t-range-wrap').style.display = isDescriptive ? 'none' : 'block';
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('filter-category').value;
    filtered = all.filter(t=>{
      const matchesQ = !q || [t.name,t.category].some(v=>String(v).toLowerCase().includes(q));
      const matchesCat = !cat || t.category===cat;
      return matchesQ && matchesCat;
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('tests-table-body').innerHTML = items.map(t=>`
      <tr>
        <td class="cell-name">${util.escapeHtml(t.name)}</td>
        <td><span class="pill ${t.resultType==='descriptive'?'pill-blue':'pill-lavender'}"><span class="cap-dot"></span>${t.resultType==='descriptive'?'Descriptive':'Parameter'}</span></td>
        <td>${util.escapeHtml(t.category||'—')}</td>
        <td class="mono">${t.resultType==='descriptive'?'—':util.escapeHtml(t.unit||'—')}</td>
        <td>${util.escapeHtml(t.sampleType||'—')}</td>
        <td>${t.resultType==='descriptive'?'—':util.escapeHtml(t.normalRange||'—')}</td>
        <td>${util.fmtCurrency(t.price||0)}</td>
        <td><span class="pill ${t.status==='Active'?'pill-green':'pill-red'}"><span class="cap-dot"></span>${t.status}</span></td>
        <td><div class="table-actions">
          <button type="button" title="Edit" onclick="TestsModule.edit('${t.id}')">${icon('edit')}</button>
          <button type="button" title="Delete" class="danger" onclick="TestsModule.remove('${t.id}')">${icon('trash')}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="9"><div class="empty-state">${icon('flask','icon-xl')}<p>No tests found</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('tests-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  async function save(){
    const name = document.getElementById('t-name').value.trim();
    if(!name){ VLAB.toast('Test name is required.','error'); return; }
    const id = document.getElementById('t-id').value;
    const record = {
      name, category: document.getElementById('t-category').value.trim(),
      resultType: document.getElementById('t-resulttype').value,
      unit: document.getElementById('t-unit').value.trim(),
      sampleType: document.getElementById('t-sampletype').value.trim(),
      normalRange: document.getElementById('t-range').value.trim(),
      price: Number(document.getElementById('t-price').value)||0,
      reportTime: document.getElementById('t-reporttime').value.trim(),
      status: document.getElementById('t-status').value
    };

    const btn = document.getElementById('test-save-btn');
    btn.disabled = true;
    const saved = id
      ? await SB.data.update('tests', id, toDb(record))
      : await SB.data.insert('tests', toDb(record));
    btn.disabled = false;

    if(!saved){ VLAB.toast('Could not save test — please try again.', 'error'); return; }
    const full = fromDb(saved);
    if(id){ all[all.findIndex(x=>x.id===id)]=full; VLAB.toast('Test updated.','success'); }
    else{ all.push(full); VLAB.toast('Test added.','success'); }
    populateCategoryOptions();
    VLAB.closeModal('test-modal');
    applyFilters();
  }

  window.TestsModule = {
    edit(id){
      const t = all.find(x=>x.id===id); if(!t) return;
      document.getElementById('test-modal-title').textContent = `Edit Test — ${t.name}`;
      document.getElementById('t-id').value=t.id;
      document.getElementById('t-name').value=t.name;
      document.getElementById('t-resulttype').value=t.resultType||'parameter';
      document.getElementById('t-category').value=t.category||'';
      document.getElementById('t-unit').value=t.unit||'';
      document.getElementById('t-sampletype').value=t.sampleType||'';
      document.getElementById('t-range').value=t.normalRange||'';
      document.getElementById('t-price').value=t.price||0;
      document.getElementById('t-reporttime').value=t.reportTime||'';
      document.getElementById('t-status').value=t.status;
      toggleResultTypeFields();
      VLAB.openModal('test-modal');
    },
    remove(id){
      VLAB.confirmDelete('Delete this test?', async ()=>{
        const ok = await SB.data.remove('tests', id);
        if(!ok){ VLAB.toast('Could not delete test — please try again.', 'error'); return; }
        all = all.filter(x=>x.id!==id);
        populateCategoryOptions();
        VLAB.toast('Test deleted.','success');
        applyFilters();
      });
    }
  };
})();