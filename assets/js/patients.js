/* ==========================================================================
   patients.js — full CRUD for Patient Management module
   ========================================================================== */
(function(){
  const { store, util, KEYS, CAP_STATUSES, PAYMENT_STATUSES, pools, icon } = VLAB;
  let allPatients = [];
  let filtered = [];
  let currentPage = 1;
  const PER_PAGE = 10;

  document.addEventListener('DOMContentLoaded', ()=>{
    const session = VLAB.renderShell('patients');
    if(!session) return;
    VLAB.setPageTitle('Patients', 'Vitals Lab / Patient Management');

    allPatients = store.get(KEYS.patients, []);
    populateFilterOptions();
    populateFormSelects();
    applyFilters();
    wireEvents();

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const q = params.get('q');
    if(q){ document.getElementById('search-input').value = q; applyFilters(); }
    if(editId){ openEditModal(editId); }
  });

  function populateFilterOptions(){
    const areas = store.get(KEYS.areas, []);
    const doctors = store.get(KEYS.doctors, []);
    const areaSel = document.getElementById('filter-area');
    const docSel = document.getElementById('filter-doctor');
    areas.forEach(a=> areaSel.insertAdjacentHTML('beforeend', `<option value="${a.name}">${a.name}</option>`));
    doctors.forEach(d=> docSel.insertAdjacentHTML('beforeend', `<option value="${d.name}">${d.name}</option>`));
    const paySel = document.getElementById('filter-payment');
    PAYMENT_STATUSES.forEach(s=> paySel.insertAdjacentHTML('beforeend', `<option value="${s.key}">${s.label}</option>`));
    const repSel = document.getElementById('filter-report');
    CAP_STATUSES.forEach(s=> repSel.insertAdjacentHTML('beforeend', `<option value="${s.key}">${s.label}</option>`));
  }

  function populateFormSelects(){
    const areas = store.get(KEYS.areas, []).filter(a=>a.status==='Active');
    const doctors = store.get(KEYS.doctors, []).filter(d=>d.status==='Active');
    const tests = store.get(KEYS.tests, []);

    fillSelect('p-area', areas.map(a=>a.name));
    fillSelect('p-doctor', doctors.map(d=>d.name));
    fillSelect('p-testcategory', [...new Set(pools.testCategories)]);
    fillSelect('p-testname', [...new Set(tests.map(t=>t.name))]);
    fillSelect('p-sampletype', pools.sampleTypes);
    fillSelect('p-reportstatus', CAP_STATUSES.map(s=>s.label), CAP_STATUSES.map(s=>s.key));
    fillSelect('p-paymentstatus', PAYMENT_STATUSES.map(s=>s.label), PAYMENT_STATUSES.map(s=>s.key));
    fillSelect('p-paymentmethod', pools.paymentMethods);
  }
  function fillSelect(id, labels, values){
    const el = document.getElementById(id);
    el.innerHTML = labels.map((l,i)=>`<option value="${values?values[i]:l}">${l}</option>`).join('');
  }

  function wireEvents(){
    document.getElementById('search-input').addEventListener('input', util.debounce(applyFilters, 250));
    ['filter-area','filter-doctor','filter-gender','filter-payment','filter-report'].forEach(id=>{
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    document.getElementById('clear-filters-btn').addEventListener('click', ()=>{
      document.getElementById('search-input').value='';
      ['filter-area','filter-doctor','filter-gender','filter-payment','filter-report'].forEach(id=> document.getElementById(id).value='');
      applyFilters();
    });

    document.getElementById('add-patient-btn').addEventListener('click', openAddModal);
    document.getElementById('patient-reset-btn').addEventListener('click', ()=> resetForm());
    document.getElementById('patient-save-btn').addEventListener('click', savePatient);

    document.getElementById('p-price').addEventListener('input', recalcFinal);
    document.getElementById('p-discount').addEventListener('input', recalcFinal);

    document.getElementById('p-photo-box').addEventListener('click', ()=> document.getElementById('p-photo').click());
    document.getElementById('p-photo').addEventListener('change', (e)=>{
      const box = document.getElementById('p-photo-box');
      if(e.target.files[0]) box.innerHTML = `${icon('check-circle','icon-lg')}${util.escapeHtml(e.target.files[0].name)} selected`;
    });

    document.getElementById('export-csv-btn').addEventListener('click', exportPatientsCSV);
    document.getElementById('print-btn').addEventListener('click', ()=> window.print());
  }

  function applyFilters(){
    const q = document.getElementById('search-input').value.toLowerCase();
    const area = document.getElementById('filter-area').value;
    const doctor = document.getElementById('filter-doctor').value;
    const gender = document.getElementById('filter-gender').value;
    const payment = document.getElementById('filter-payment').value;
    const report = document.getElementById('filter-report').value;

    filtered = allPatients.filter(p=>{
      const matchesQ = !q || [p.name,p.phone,p.doctor,p.testName,p.id].some(v=>String(v).toLowerCase().includes(q));
      return matchesQ
        && (!area || p.area===area)
        && (!doctor || p.doctor===doctor)
        && (!gender || p.gender===gender)
        && (!payment || p.paymentStatus===payment)
        && (!report || p.reportStatus===report);
    });
    currentPage = 1;
    renderTable();
  }

  function renderTable(){
    const {items, page, totalPages, total} = VLAB.paginate([...filtered].reverse(), currentPage, PER_PAGE);
    const tbody = document.getElementById('patients-table-body');
    tbody.innerHTML = items.map(p=>{
      const rs = util.statusMeta(CAP_STATUSES, p.reportStatus);
      const ps = util.statusMeta(PAYMENT_STATUSES, p.paymentStatus);
      return `<tr>
        <td class="mono">${p.id}</td>
        <td><div class="name-cell"><div class="avatar-sm">${util.initials(p.name)}</div><div><div class="cell-name">${util.escapeHtml(p.name)}</div><div class="cell-sub">${p.gender}, ${p.age}y</div></div></div></td>
        <td>${p.phone}</td>
        <td>${util.escapeHtml(p.doctor)}</td>
        <td>${util.escapeHtml(p.area)}</td>
        <td>${util.escapeHtml(p.testName)}</td>
        <td>${util.fmtCurrency(p.finalAmount)}</td>
        <td><span class="pill ${ps.pill}"><span class="cap-dot"></span>${ps.label}</span></td>
        <td><span class="pill ${rs.pill}"><span class="cap-dot"></span>${rs.label}</span></td>
        <td>${util.fmtDate(p.collectionDate)}</td>
        <td><div class="table-actions">
          <button type="button" title="View" onclick="PatientsModule.view('${p.id}')">${icon('eye')}</button>
          <button type="button" title="Edit" onclick="PatientsModule.edit('${p.id}')">${icon('edit')}</button>
          <button type="button" title="Print" onclick="PatientsModule.print('${p.id}')">${icon('printer')}</button>
          <button type="button" title="Delete" class="danger" onclick="PatientsModule.remove('${p.id}')">${icon('trash')}</button>
        </div></td>
      </tr>`;
    }).join('') || `<tr><td colspan="11"><div class="empty-state">${icon('activity','icon-xl')}<p>No matching patients</p><small>Try adjusting your filters</small></div></td></tr>`;

    VLAB.renderPagination(document.getElementById('patients-pagination'), {page,totalPages,total}, (p)=>{ currentPage=p; renderTable(); });
  }

  function recalcFinal(){
    const price = Number(document.getElementById('p-price').value)||0;
    const discount = Number(document.getElementById('p-discount').value)||0;
    document.getElementById('p-final').value = Math.max(0, price-discount);
  }

  function resetForm(){
    document.getElementById('patient-form').reset();
    document.getElementById('p-id').value='';
    document.getElementById('p-final').value='';
    const box = document.getElementById('p-photo-box');
    box.innerHTML = `<span data-icon="camera" data-icon-class="icon-lg"></span>Click to upload patient photo (demo only)<input type="file" id="p-photo" accept="image/*" style="display:none;">`;
    window.Icons.hydrate(box);
    box.addEventListener('click', ()=> document.getElementById('p-photo').click());
    document.getElementById('p-photo').addEventListener('change', (e)=>{
      if(e.target.files[0]) box.innerHTML = `${icon('check-circle','icon-lg')}${util.escapeHtml(e.target.files[0].name)} selected`;
    });
  }

  function openAddModal(){
    resetForm();
    document.getElementById('patient-modal-title').textContent = 'Add New Patient';
    document.getElementById('p-collectiondate').value = util.fmtDateInput(new Date());
    VLAB.openModal('patient-modal');
  }

  function openEditModal(id){
    const p = allPatients.find(x=>x.id===id);
    if(!p) return;
    document.getElementById('patient-modal-title').textContent = `Edit Patient — ${p.id}`;
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-gender').value = p.gender;
    document.getElementById('p-guardian').value = p.guardianName||'';
    document.getElementById('p-dob').value = p.dob||'';
    document.getElementById('p-age').value = p.age;
    document.getElementById('p-blood').value = p.bloodGroup;
    document.getElementById('p-height').value = p.height;
    document.getElementById('p-weight').value = p.weight;
    document.getElementById('p-phone').value = p.phone;
    document.getElementById('p-altphone').value = p.altPhone||'';
    document.getElementById('p-emergency').value = p.emergencyContact||'';
    document.getElementById('p-email').value = p.email||'';
    document.getElementById('p-address').value = p.address||'';
    document.getElementById('p-city').value = p.city||'';
    document.getElementById('p-area').value = p.area;
    document.getElementById('p-reference').value = p.reference||'Self';
    document.getElementById('p-doctor').value = p.doctor;
    document.getElementById('p-testcategory').value = p.testCategory;
    document.getElementById('p-testname').value = p.testName;
    document.getElementById('p-sampletype').value = p.sampleType;
    document.getElementById('p-collectiondate').value = p.collectionDate;
    document.getElementById('p-reportdate').value = p.reportDate;
    document.getElementById('p-reportstatus').value = p.reportStatus;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-discount').value = p.discount;
    document.getElementById('p-final').value = p.finalAmount;
    document.getElementById('p-paymentstatus').value = p.paymentStatus;
    document.getElementById('p-paymentmethod').value = p.paymentMethod;
    document.getElementById('p-remarks').value = p.remarks||'';
    VLAB.openModal('patient-modal');
  }

  function savePatient(){
    const name = document.getElementById('p-name').value.trim();
    const phone = document.getElementById('p-phone').value.trim();
    const area = document.getElementById('p-area').value;
    const doctor = document.getElementById('p-doctor').value;
    const testName = document.getElementById('p-testname').value;
    if(!name || !phone || !area || !doctor || !testName){
      VLAB.toast('Please fill all required fields marked with *.', 'error');
      return;
    }
    const id = document.getElementById('p-id').value;
    const price = Number(document.getElementById('p-price').value)||0;
    const discount = Number(document.getElementById('p-discount').value)||0;

    const record = {
      id: id || util.uid('PT', allPatients.length+1+Math.floor(Math.random()*900)),
      name, gender: document.getElementById('p-gender').value,
      guardianName: document.getElementById('p-guardian').value,
      dob: document.getElementById('p-dob').value,
      age: Number(document.getElementById('p-age').value)||0,
      phone, altPhone: document.getElementById('p-altphone').value,
      email: document.getElementById('p-email').value,
      address: document.getElementById('p-address').value,
      city: document.getElementById('p-city').value,
      area, doctor,
      bloodGroup: document.getElementById('p-blood').value,
      height: Number(document.getElementById('p-height').value)||0,
      weight: Number(document.getElementById('p-weight').value)||0,
      emergencyContact: document.getElementById('p-emergency').value,
      reference: document.getElementById('p-reference').value,
      testCategory: document.getElementById('p-testcategory').value,
      testName, sampleType: document.getElementById('p-sampletype').value,
      collectionDate: document.getElementById('p-collectiondate').value,
      reportDate: document.getElementById('p-reportdate').value,
      price, discount, finalAmount: Math.max(0,price-discount),
      paymentStatus: document.getElementById('p-paymentstatus').value,
      paymentMethod: document.getElementById('p-paymentmethod').value,
      reportStatus: document.getElementById('p-reportstatus').value,
      remarks: document.getElementById('p-remarks').value,
      photo:''
    };

    if(id){
      const idx = allPatients.findIndex(p=>p.id===id);
      allPatients[idx] = record;
      VLAB.toast(`Patient ${id} updated successfully.`, 'success');
    }else{
      allPatients.push(record);
      VLAB.toast(`Patient ${record.id} added successfully.`, 'success');
    }
    store.set(KEYS.patients, allPatients);
    syncPaymentFromPatient(record);
    VLAB.closeModal('patient-modal');
    applyFilters();
  }

  // Every patient's billing fields (price/discount/payment status/method) are
  // the single source of truth for that patient's receipt on the Payments &
  // Billing page. This keeps the two in sync instead of being two separate,
  // disconnected tables — one receipt per patient, upserted on every save.
  function syncPaymentFromPatient(patient){
    const payments = store.get(KEYS.payments, []);
    const idx = payments.findIndex(p=>p.patientId===patient.id);
    const paymentRecord = {
      id: idx>-1 ? payments[idx].id : util.uid('RC', payments.length+1+Math.floor(Math.random()*900)),
      patientId: patient.id,
      patient: patient.name,
      doctor: patient.doctor,
      area: patient.area,
      amount: patient.price,
      discount: patient.discount,
      finalAmount: patient.finalAmount,
      method: patient.paymentMethod,
      status: patient.paymentStatus,
      date: patient.collectionDate || util.fmtDateInput(new Date())
    };
    if(idx>-1) payments[idx] = paymentRecord;
    else payments.push(paymentRecord);
    store.set(KEYS.payments, payments);
  }

  window.PatientsModule = {
    view(id){
      const p = allPatients.find(x=>x.id===id);
      if(!p) return;
      const rs = util.statusMeta(CAP_STATUSES, p.reportStatus);
      const ps = util.statusMeta(PAYMENT_STATUSES, p.paymentStatus);
      document.getElementById('view-patient-body').innerHTML = `
        <div class="flex-between mb-16">
          <div class="name-cell"><div class="avatar-sm" style="width:46px;height:46px;font-size:15px;">${util.initials(p.name)}</div>
          <div><div style="font-weight:700;font-size:15px;">${util.escapeHtml(p.name)}</div><div class="cell-sub mono">${p.id}</div></div></div>
          <div style="display:flex;gap:6px;"><span class="pill ${ps.pill}"><span class="cap-dot"></span>${ps.label}</span><span class="pill ${rs.pill}"><span class="cap-dot"></span>${rs.label}</span></div>
        </div>
        <div class="form-grid" style="font-size:12.5px;">
          ${infoRow('Gender / Age', `${p.gender}, ${p.age} yrs`)}
          ${infoRow('Phone', p.phone)}
          ${infoRow('Alt. Phone', p.altPhone||'—')}
          ${infoRow('Blood Group', p.bloodGroup)}
          ${infoRow('Doctor', p.doctor)}
          ${infoRow('Area / City', `${p.area}, ${p.city}`)}
          ${infoRow('Test', p.testName)}
          ${infoRow('Sample', p.sampleType)}
          ${infoRow('Collected', util.fmtDate(p.collectionDate))}
          ${infoRow('Report Date', util.fmtDate(p.reportDate))}
          ${infoRow('Price', util.fmtCurrency(p.price))}
          ${infoRow('Discount', util.fmtCurrency(p.discount))}
          ${infoRow('Final Amount', util.fmtCurrency(p.finalAmount))}
          ${infoRow('Payment Method', p.paymentMethod)}
        </div>
        ${p.remarks?`<div class="mb-8" style="margin-top:14px;"><strong style="font-size:12px;">Remarks:</strong><p class="text-muted" style="font-size:12.5px;">${util.escapeHtml(p.remarks)}</p></div>`:''}
      `;
      VLAB.openModal('view-patient-modal');
    },
    edit(id){ openEditModal(id); },
    print(id){ window.print(); },
    remove(id){
      VLAB.confirmDelete(`Delete patient record ${id}? This cannot be undone.`, ()=>{
        allPatients = allPatients.filter(p=>p.id!==id);
        store.set(KEYS.patients, allPatients);
        const payments = store.get(KEYS.payments, []).filter(p=>p.patientId!==id);
        store.set(KEYS.payments, payments);
        VLAB.toast(`Patient ${id} deleted.`, 'success');
        applyFilters();
      });
    }
  };

  function infoRow(label,val){
    return `<div class="field-group" style="margin-bottom:10px;"><label style="margin-bottom:3px;">${label}</label><div style="font-weight:600;">${util.escapeHtml(String(val))}</div></div>`;
  }

  function exportPatientsCSV(){
    const headers = ['Patient ID','Name','Gender','Age','Phone','Doctor','Area','Test','Price','Discount','Final Amount','Payment Status','Report Status','Collection Date'];
    const rows = filtered.map(p=>[p.id,p.name,p.gender,p.age,p.phone,p.doctor,p.area,p.testName,p.price,p.discount,p.finalAmount,p.paymentStatus,p.reportStatus,p.collectionDate]);
    VLAB.exportCSV('patients.csv', headers, rows);
  }
})();
