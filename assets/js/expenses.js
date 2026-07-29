/* ========================================================================
   expenses.js — Admin-only Expense Management
   ======================================================================== */
(function(){
  const { store, util, KEYS, pools, icon } = VLAB;
  let all=[], filtered=[], currentPage=1;
  const PER_PAGE = 10;

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.renderShell('expenses');
    if(!session) return;

    if(session.role !== 'admin'){
      document.getElementById('expenses-content').innerHTML = `
        <div class="locked-banner fade-in">
          ${icon('lock','icon-xl')}
          <h3 style="margin-bottom:8px;">Restricted Section</h3>
          <p>Expense management is available to administrators only.</p>
        </div>`;
      VLAB.setPageTitle('Expenses', 'Vitals Lab / Restricted');
      return;
    }

    VLAB.setPageTitle('Expenses', 'Vitals Lab / Expense Management');
    all = store.get(KEYS.expenses, []);
    populateCategoryFilter();
    renderStats();
    renderCharts();
    applyFilters();
    wire();
  });

  function populateCategoryFilter(){
    const sel = document.getElementById('filter-category');
    [...new Set(pools.expenseCategories)].forEach(c=> sel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
    fillSelect('e-category', pools.expenseCategories);
  }
  function fillSelect(id, arr){
    document.getElementById(id).innerHTML = [...new Set(arr)].map(v=>`<option>${v}</option>`).join('');
  }

  function renderStats(){
    const today = util.fmtDateInput(new Date());
    const now = new Date();
    const todayTotal = all.filter(e=>e.date===today).reduce((s,e)=>s+e.amount,0);
    const monthTotal = all.filter(e=>{const d=new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,e)=>s+e.amount,0);
    const yearTotal = all.filter(e=>new Date(e.date).getFullYear()===now.getFullYear()).reduce((s,e)=>s+e.amount,0);
    const cards = [
      {icon:'calendar', bg:'bg-warning-soft', label:"Today's Expense", val:todayTotal},
      {icon:'calendar', bg:'bg-danger-soft', label:'Monthly Expense', val:monthTotal},
      {icon:'calendar', bg:'bg-primary-soft', label:'Yearly Expense', val:yearTotal},
    ];
    document.getElementById('expense-stat-grid').innerHTML = cards.map(c=>`
      <div class="stat-card"><div class="stat-icon ${c.bg}">${icon(c.icon)}</div>
      <div class="stat-num">${util.fmtCurrency(c.val)}</div><div class="stat-label">${c.label}</div></div>`).join('');
  }

  function renderCharts(){
    const dark = document.documentElement.getAttribute('data-theme')==='dark';
    Chart.defaults.font.family = "'Inter',sans-serif";
    Chart.defaults.color = dark?'#9AA4B8':'#6B7688';

    const months = []; const d=new Date();
    for(let i=5;i>=0;i--){ const dt=new Date(d.getFullYear(),d.getMonth()-i,1); months.push(dt.toLocaleDateString('en-IN',{month:'short'})); }
    new Chart(document.getElementById('chart-expense-trend'), {
      type:'line',
      data:{labels:months, datasets:[{label:'Expenses', data:months.map(()=>util.rand(15000,60000)), borderColor:'#D68A1E', backgroundColor:'rgba(214,138,30,.08)', fill:true, tension:.4}]},
      options:{responsive:true,maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{color: dark?'#2A3140':'#EEF1F6'}}, x:{grid:{display:false}}}}
    });

    const cats = [...new Set(pools.expenseCategories)];
    new Chart(document.getElementById('chart-expense-categories'), {
      type:'doughnut',
      data:{labels:cats, datasets:[{data:cats.map(()=>util.rand(2000,20000)), backgroundColor:['#2E5EAA','#17A2A0','#8E7CC3','#C79A2E','#4C9A6A','#3F76BF','#D68A1E','#E5484D','#3E8FDE','#6B7688'], borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:false, plugins:{legend:{position:'right', labels:{boxWidth:9, font:{size:10}}}}}
    });
  }

  function wire(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters,250));
    document.getElementById('filter-category').addEventListener('change', applyFilters);
    document.getElementById('add-expense-btn').addEventListener('click', ()=>{
      document.getElementById('expense-form').reset();
      document.getElementById('e-id').value='';
      document.getElementById('e-date').value = util.fmtDateInput(new Date());
      document.getElementById('expense-modal-title').textContent='Add Expense';
      VLAB.openModal('expense-modal');
    });
    document.getElementById('expense-save-btn').addEventListener('click', save);
    document.getElementById('e-attach-box').addEventListener('click', ()=>document.getElementById('e-attach').click());
    document.getElementById('e-attach').addEventListener('change', e=>{
      const box = document.getElementById('e-attach-box');
      if(e.target.files[0]) box.innerHTML = `${icon('check-circle')} ${util.escapeHtml(e.target.files[0].name)}`;
    });
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('filter-category').value;
    filtered = all.filter(e=>{
      const matchesQ = !q || [e.name,e.vendor].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ && (!cat || e.category===cat);
    });
    currentPage=1; render();
  }

  function render(){
    const {items,page,totalPages,total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    document.getElementById('expenses-table-body').innerHTML = items.map(e=>`
      <tr>
        <td class="cell-name">${util.escapeHtml(e.name)}</td>
        <td><span class="small-tag">${e.category}</span></td>
        <td>${util.escapeHtml(e.vendor)}</td>
        <td class="mono">${e.invoiceNumber}</td>
        <td>${util.fmtCurrency(e.amount)}</td>
        <td>${e.paymentMode}</td>
        <td>${util.fmtDate(e.date)}</td>
        <td><div class="table-actions">
          <button type="button" title="Edit" onclick="ExpensesModule.edit('${e.id}')">${icon('edit')}</button>
          <button type="button" title="Delete" class="danger" onclick="ExpensesModule.remove('${e.id}')">${icon('trash')}</button>
        </div></td>
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty-state">${icon('receipt','icon-xl')}<p>No expenses found</p></div></td></tr>`;
    VLAB.renderPagination(document.getElementById('expenses-pagination'), {page,totalPages,total}, p=>{currentPage=p;render();});
  }

  function save(){
    const name = document.getElementById('e-name').value.trim();
    const amount = Number(document.getElementById('e-amount').value)||0;
    if(!name || !amount){ VLAB.toast('Expense name and amount are required.','error'); return; }
    const id = document.getElementById('e-id').value;
    const record = {
      id: id || util.uid('EX', all.length+1+Math.floor(Math.random()*900)),
      name, category: document.getElementById('e-category').value,
      vendor: document.getElementById('e-vendor').value,
      invoiceNumber: document.getElementById('e-invoice').value,
      amount, paymentMode: document.getElementById('e-mode').value,
      date: document.getElementById('e-date').value,
      description: document.getElementById('e-desc').value,
      attachment:''
    };
    if(id){ all[all.findIndex(x=>x.id===id)]=record; VLAB.toast('Expense updated.','success'); }
    else{ all.push(record); VLAB.toast('Expense added.','success'); }
    store.set(KEYS.expenses, all);
    VLAB.closeModal('expense-modal');
    applyFilters();
    renderStats();
  }

  window.ExpensesModule = {
    edit(id){
      const e = all.find(x=>x.id===id); if(!e) return;
      document.getElementById('expense-modal-title').textContent = `Edit Expense — ${e.id}`;
      document.getElementById('e-id').value=e.id;
      document.getElementById('e-name').value=e.name;
      document.getElementById('e-category').value=e.category;
      document.getElementById('e-vendor').value=e.vendor;
      document.getElementById('e-invoice').value=e.invoiceNumber;
      document.getElementById('e-amount').value=e.amount;
      document.getElementById('e-mode').value=e.paymentMode;
      document.getElementById('e-date').value=e.date;
      document.getElementById('e-desc').value=e.description;
      VLAB.openModal('expense-modal');
    },
    remove(id){
      VLAB.confirmDelete('Delete this expense record?', ()=>{
        all = all.filter(x=>x.id!==id);
        store.set(KEYS.expenses, all);
        VLAB.toast('Expense deleted.','success');
        applyFilters(); renderStats();
      });
    }
  };
})();
