/* ==========================================================================
   VITALS LAB — app.js
   Core layer shared by every page: dummy-data seeding, localStorage CRUD
   helpers, auth/session, and shared UI chrome (sidebar, topbar, toasts,
   modals, dark mode). Every page-specific file (patients.js, doctors.js...)
   builds on top of the helpers defined here. Icons come from icons.js
   (self-hosted inline SVG — load icons.js before this file).
   ========================================================================== */

const VLAB = (() => {
  const ic = (name, cls) => (window.Icons ? window.Icons.icon(name, cls) : '');

  /* ---------------------------------------------------------------------
     1. STORAGE KEYS
  --------------------------------------------------------------------- */
  const KEYS = {
    session:'vlab_session',
    patients:'vlab_patients',
    doctors:'vlab_doctors',
    areas:'vlab_areas',
    tests:'vlab_tests',
    payments:'vlab_payments',
    pending:'vlab_pending_payments',
    expenses:'vlab_expenses',
    settings:'vlab_settings',
    seeded:'vlab_seeded_v1',
    users:'vlab_users'
  };

  /* ---------------------------------------------------------------------
     2. GENERIC STORAGE HELPERS
  --------------------------------------------------------------------- */
  const store = {
    get(key, fallback){
      try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
      }catch(e){ return fallback !== undefined ? fallback : null; }
    },
    set(key, value){
      try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch(e){ console.error('Storage write failed', e); return false; }
    },
    remove(key){ localStorage.removeItem(key); }
  };

  /* ---------------------------------------------------------------------
     3. SEED DATA POOLS
  --------------------------------------------------------------------- */
  const firstNames = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Krishna','Ishaan','Rohan',
    'Ananya','Diya','Saanvi','Aadhya','Myra','Isha','Kavya','Meera','Priya','Riya',
    'Rahul','Amit','Suresh','Rajesh','Vikram','Sanjay','Anil','Deepak','Manoj','Ramesh',
    'Sunita','Pooja','Neha','Kiran','Anjali','Swati','Rekha','Geeta','Sarita','Nisha'];
  const lastNames = ['Sharma','Verma','Gupta','Patel','Singh','Yadav','Mishra','Agarwal','Jain','Chauhan',
    'Reddy','Rao','Nair','Iyer','Menon','Das','Sen','Banerjee','Kapoor','Malhotra'];
  const cities = ['Raipur','Bilaspur','Durg','Bhilai','Korba','Rajnandgaon','Jagdalpur','Ambikapur'];
  const areaNames = ['Shankar Nagar','Telibandha','Civil Lines','Pandri','Devendra Nagar','Amanaka','Tatibandh',
    'Kota','Gudhiyari','Mowa','Kabir Nagar','VIP Road','Byron Bazaar','Ganj Para','Old Bus Stand'];
  const specializations = ['General Physician','Cardiologist','Gynecologist','Orthopedic','Pediatrician',
    'Dermatologist','Neurologist','ENT Specialist','Diabetologist','Nephrologist','Oncologist','Urologist'];
  const hospitals = ['City Care Hospital','Sunrise Multispecialty','Apollo Clinic','Life Line Hospital',
    'Shree Hospital','Ramkrishna Care','New Horizon Hospital','Metro Hospital'];
  const testCategories = ['Hematology','Biochemistry','Microbiology','Serology','Immunology','Endocrinology',
    'Pathology','Molecular Diagnostics','Urine Analysis','Histopathology'];
  const testNames = ['Complete Blood Count (CBC)','Lipid Profile','Liver Function Test','Kidney Function Test',
    'Thyroid Profile (T3 T4 TSH)','Blood Sugar Fasting','Blood Sugar PP','HbA1c','Widal Test','Urine Routine',
    'Dengue NS1','Malaria Antigen','Vitamin D','Vitamin B12','CRP','ESR','HIV Test','HBsAg','VDRL','Uric Acid',
    'Calcium Test','Iron Studies','Semen Analysis','Stool Routine','Blood Group & Rh Typing','Coagulation Profile (PT/INR)',
    'Electrolyte Panel','Amylase & Lipase','Cardiac Markers (Troponin)','Culture & Sensitivity'];
  const sampleTypes = ['Blood','Urine','Stool','Serum','Plasma','Swab'];
  const paymentMethods = ['Cash','UPI','Card','Net Banking'];
  const expenseCategories = ['Reagents & Chemicals','Equipment Maintenance','Staff Salary','Rent','Electricity',
    'Consumables','Marketing','Courier & Logistics','Software & AMC','Miscellaneous'];
  const vendors = ['MedSupply Co.','LabTech Distributors','ChemPure Traders','BioLine Reagents','QuickFix Services'];

  const CAP_STATUSES = [
    {key:'collected', label:'Collected', pill:'pill-lavender'},
    {key:'processing', label:'Processing', pill:'pill-blue'},
    {key:'reviewed', label:'Under Review', pill:'pill-green'},
    {key:'completed', label:'Report Ready', pill:'pill-gold'},
    {key:'cancelled', label:'Cancelled', pill:'pill-red'}
  ];
  const PAYMENT_STATUSES = [
    {key:'paid', label:'Paid', pill:'pill-green'},
    {key:'pending', label:'Pending', pill:'pill-lavender'},
    {key:'partial', label:'Partial', pill:'pill-blue'},
    {key:'overdue', label:'Overdue', pill:'pill-red'}
  ];

  const util = {
    rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; },
    choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; },
    uid(prefix,n){ return `${prefix}${String(n).padStart(4,'0')}`; },
    randDateWithin(daysBack){
      const d = new Date();
      d.setDate(d.getDate() - util.rand(0,daysBack));
      return d;
    },
    fmtDate(d){
      if(typeof d === 'string') d = new Date(d);
      if(isNaN(d)) return '-';
      return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    },
    fmtDateInput(d){
      if(typeof d === 'string') d = new Date(d);
      return d.toISOString().split('T')[0];
    },
    fmtCurrency(n){
      n = Number(n)||0;
      return '₹' + n.toLocaleString('en-IN',{maximumFractionDigits:0});
    },
    fmtTime(d){
      if(typeof d === 'string') d = new Date(d);
      return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    },
    initials(name){
      return (name||'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
    },
    debounce(fn, wait=300){
      let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); };
    },
    statusMeta(list, key){
      return list.find(s=>s.key===key) || list[0];
    },
    escapeHtml(str){
      return String(str??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  };

  /* ---------------------------------------------------------------------
     4. SEEDING
  --------------------------------------------------------------------- */
  function seedIfNeeded(){
    if(store.get(KEYS.seeded)) return;

    const areas = areaNames.map((name,i)=>({
      id: util.uid('AR',i+1),
      name,
      city: util.choice(cities),
      pincode: `4920${util.rand(10,99)}`,
      collectionCharge: util.choice([0,50,100,150]),
      status: Math.random()>0.1 ? 'Active':'Inactive'
    }));
    store.set(KEYS.areas, areas);

    const doctors = [];
    for(let i=1;i<=20;i++){
      doctors.push({
        id: util.uid('DR',i),
        name: `Dr. ${util.choice(firstNames)} ${util.choice(lastNames)}`,
        specialization: util.choice(specializations),
        hospital: util.choice(hospitals),
        clinic: `${util.choice(areaNames)} Clinic`,
        phone: `9${util.rand(100000000,999999999)}`,
        email: `doctor${i}@vitalslab.demo`,
        address: `${util.rand(1,200)}, ${util.choice(areaNames)}, ${util.choice(cities)}`,
        commission: util.rand(5,20),
        status: Math.random()>0.15 ? 'Active':'Inactive',
        notes: 'Regular referring doctor.'
      });
    }
    store.set(KEYS.doctors, doctors);

    const tests = [];
    for(let i=1;i<=50;i++){
      const name = testNames[i % testNames.length] + (i>testNames.length ? ` (Panel ${Math.ceil(i/testNames.length)})`:'');
      tests.push({
        id: util.uid('TS',i),
        name,
        category: util.choice(testCategories),
        sampleType: util.choice(sampleTypes),
        normalRange: '4.5 - 11.0 x10^9/L',
        price: util.rand(150,2500),
        reportTime: util.choice(['Same Day','24 Hrs','48 Hrs','6 Hrs']),
        status: Math.random()>0.05 ? 'Active':'Inactive'
      });
    }
    store.set(KEYS.tests, tests);

    const patients = [];
    for(let i=1;i<=100;i++){
      const fname = util.choice(firstNames);
      const lname = util.choice(lastNames);
      const gender = Math.random()>0.5?'Male':'Female';
      const age = util.rand(1,85);
      const doctor = util.choice(doctors);
      const area = util.choice(areas);
      const price = util.rand(200,3500);
      const discount = util.choice([0,0,0,50,100,200]);
      const paymentStatusObj = util.choice(PAYMENT_STATUSES);
      const reportStatusObj = util.choice(CAP_STATUSES);
      const collectionDate = util.randDateWithin(60);
      patients.push({
        id: util.uid('PT',i),
        name: `${fname} ${lname}`,
        guardianName: `${util.choice(firstNames)} ${lname}`,
        gender,
        dob: `${2026-age}-0${util.rand(1,9)}-1${util.rand(0,9)}`,
        age,
        phone: `9${util.rand(100000000,999999999)}`,
        altPhone: `8${util.rand(100000000,999999999)}`,
        email: `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@mail.demo`,
        address: `${util.rand(1,300)}, ${area.name}`,
        city: area.city,
        area: area.name,
        doctor: doctor.name,
        bloodGroup: util.choice(['A+','A-','B+','B-','O+','O-','AB+','AB-']),
        height: util.rand(90,190),
        weight: util.rand(10,95),
        emergencyContact: `9${util.rand(100000000,999999999)}`,
        reference: util.choice(['Self','Doctor Referral','Camp','Online','Walk-in']),
        testCategory: util.choice(testCategories),
        testName: util.choice(testNames),
        sampleType: util.choice(sampleTypes),
        collectionDate: util.fmtDateInput(collectionDate),
        reportDate: util.fmtDateInput(new Date(collectionDate.getTime()+86400000*util.rand(0,3))),
        price, discount, finalAmount: price-discount,
        paymentStatus: paymentStatusObj.key,
        paymentMethod: util.choice(paymentMethods),
        reportStatus: reportStatusObj.key,
        remarks:'',
        photo:''
      });
    }
    store.set(KEYS.patients, patients);

    const payments = [];
    for(let i=1;i<=300;i++){
      const p = util.choice(patients);
      const amount = util.rand(200,4000);
      const discount = util.choice([0,0,50,100]);
      const statusObj = util.choice(PAYMENT_STATUSES);
      payments.push({
        id: util.uid('RC',i),
        patient: p.name,
        doctor: p.doctor,
        area: p.area,
        amount, discount, finalAmount: amount-discount,
        method: util.choice(paymentMethods),
        status: statusObj.key,
        date: util.fmtDateInput(util.randDateWithin(90))
      });
    }
    store.set(KEYS.payments, payments);

    const pending = [];
    for(let i=1;i<=50;i++){
      const p = util.choice(patients);
      const due = new Date(); due.setDate(due.getDate()+util.rand(-10,20));
      pending.push({
        id: util.uid('PD',i),
        patient: p.name,
        doctor: p.doctor,
        phone: p.phone,
        area: p.area,
        amount: util.rand(300,3000),
        dueDate: util.fmtDateInput(due),
        status: due < new Date() ? 'overdue':'pending'
      });
    }
    store.set(KEYS.pending, pending);

    const expenses = [];
    for(let i=1;i<=30;i++){
      expenses.push({
        id: util.uid('EX',i),
        name: util.choice(expenseCategories) + ' Purchase',
        category: util.choice(expenseCategories),
        vendor: util.choice(vendors),
        invoiceNumber: `INV-${util.rand(1000,9999)}`,
        amount: util.rand(500,25000),
        paymentMode: util.choice(paymentMethods),
        date: util.fmtDateInput(util.randDateWithin(120)),
        description: 'Routine operational expense.',
        attachment:''
      });
    }
    store.set(KEYS.expenses, expenses);

    store.set(KEYS.settings, {
      labName:'Vitals Lab',
      phone:'+91 98261 45210',
      email:'contact@vitalslab.demo',
      address:'Shankar Nagar, Raipur, Chhattisgarh',
      gst:'22ABCDE1234F1Z5',
      logo:'',
      darkMode:false
    });

    store.set(KEYS.users, [
      {username:'admin', password:'admin123', role:'admin', name:'Dr. Ashok Verma'},
      {username:'staff', password:'staff123', role:'staff', name:'Priya Sharma'}
    ]);

    store.set(KEYS.seeded, true);
  }

  /* ---------------------------------------------------------------------
     5. AUTH
  --------------------------------------------------------------------- */
  const auth = {
    login(username, password, expectedRole){
      const users = store.get(KEYS.users, []);
      const user = users.find(u=>u.username===username && u.password===password);
      if(!user) return {ok:false, msg:'Invalid username or password.'};
      if(expectedRole && user.role !== expectedRole){
        return {ok:false, msg:`This account is not registered as ${expectedRole}.`};
      }
      store.set(KEYS.session, {username:user.username, name:user.name, role:user.role, loginAt:Date.now()});
      return {ok:true, user};
    },
    logout(){
      store.remove(KEYS.session);
      window.location.href = 'login.html';
    },
    current(){ return store.get(KEYS.session); },
    requireAuth(){
      const s = auth.current();
      if(!s){ window.location.href='login.html'; return null; }
      return s;
    },
    requireAdmin(){
      const s = auth.requireAuth();
      if(s && s.role !== 'admin'){
        window.location.href = 'index.html';
        return null;
      }
      return s;
    }
  };

  /* ---------------------------------------------------------------------
     6. TOASTS
  --------------------------------------------------------------------- */
  function ensureToastStack(){
    let stack = document.querySelector('.toast-stack');
    if(!stack){
      stack = document.createElement('div');
      stack.className='toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  const iconMap = {success:'check-circle', error:'x-circle', warning:'alert-triangle', info:'info'};
  function toast(msg, type='info', title=''){
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const titles = {success:'Success', error:'Error', warning:'Heads up', info:'Notice'};
    el.innerHTML = `
      ${ic(iconMap[type]||iconMap.info, 't-icon')}
      <div><p>${title || titles[type]}</p><span>${util.escapeHtml(msg)}</span></div>
      <button class="toast-close">${ic('x')}</button>`;
    stack.appendChild(el);
    const remove = ()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 260); };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 3800);
  }

  /* ---------------------------------------------------------------------
     7. MODAL HELPERS
  --------------------------------------------------------------------- */
  function openModal(id){
    const el = document.getElementById(id);
    if(el) el.classList.add('show');
  }
  function closeModal(id){
    const el = document.getElementById(id);
    if(el) el.classList.remove('show');
  }
  function confirmDelete(message, onConfirm){
    let overlay = document.getElementById('global-confirm-modal');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'global-confirm-modal';
      overlay.innerHTML = `
        <div class="modal-box modal-sm">
          <div class="modal-body" style="text-align:center;padding-top:30px;">
            <div class="confirm-icon">${ic('trash','icon-lg')}</div>
            <h3 style="margin-bottom:8px;font-size:15px;">Delete this record?</h3>
            <p class="text-muted" id="global-confirm-msg" style="font-size:12.5px;">This action cannot be undone.</p>
          </div>
          <div class="modal-foot" style="justify-content:center;">
            <button class="btn btn-outline" id="global-confirm-cancel">Cancel</button>
            <button class="btn btn-danger" id="global-confirm-ok">${ic('trash')} Delete</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector('#global-confirm-msg').textContent = message || 'This action cannot be undone.';
    overlay.classList.add('show');
    const okBtn = overlay.querySelector('#global-confirm-ok');
    const cancelBtn = overlay.querySelector('#global-confirm-cancel');
    const cleanup = ()=>{ overlay.classList.remove('show'); okBtn.replaceWith(okBtn.cloneNode(true)); cancelBtn.replaceWith(cancelBtn.cloneNode(true)); };
    const newOk = overlay.querySelector('#global-confirm-ok');
    const newCancel = overlay.querySelector('#global-confirm-cancel');
    newOk.addEventListener('click', ()=>{ cleanup(); onConfirm && onConfirm(); }, {once:true});
    newCancel.addEventListener('click', cleanup, {once:true});
  }

  /* ---------------------------------------------------------------------
     8. RIPPLE EFFECT
  --------------------------------------------------------------------- */
  function bindRipple(){
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.btn, .nav-item, .table-actions button, .pagination button');
      if(!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className='ripple';
      ripple.style.width = ripple.style.height = size+'px';
      ripple.style.left = (e.clientX-rect.left-size/2)+'px';
      ripple.style.top = (e.clientY-rect.top-size/2)+'px';
      btn.style.position = btn.style.position || 'relative';
      btn.appendChild(ripple);
      setTimeout(()=>ripple.remove(), 600);
    });
  }

  /* ---------------------------------------------------------------------
     9. ANIMATED COUNTER
  --------------------------------------------------------------------- */
  function animateCounter(el, target, duration=900, prefix='', suffix=''){
    const start = 0;
    const startTime = performance.now();
    function tick(now){
      const p = Math.min((now-startTime)/duration, 1);
      const eased = 1 - Math.pow(1-p, 3);
      const val = Math.round(start + (target-start)*eased);
      el.textContent = prefix + val.toLocaleString('en-IN') + suffix;
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------
     10. SIDEBAR / TOPBAR / SHELL WIRING
  --------------------------------------------------------------------- */
  const NAV_ITEMS = [
    {section:'Main', items:[
      {href:'index.html', icon:'grid', label:'Dashboard', key:'dashboard'},
    ]},
    {section:'Laboratory', items:[
      {href:'patients.html', icon:'activity', label:'Patients', key:'patients'},
      {href:'doctors.html', icon:'stethoscope', label:'Doctors', key:'doctors'},
      {href:'areas.html', icon:'map-pin', label:'Area Management', key:'areas'},
    ]},
    {section:'Finance', items:[
      {href:'payments.html', icon:'wallet', label:'Payments / Billing', key:'payments'},
      {href:'pending-payments.html', icon:'clock', label:'Pending Payments', key:'pending'},
      {href:'expenses.html', icon:'receipt', label:'Expenses', key:'expenses', adminOnly:true},
    ]},
    {section:'Insights', items:[
      {href:'reports.html', icon:'file-text', label:'Reports', key:'reports'},
      {href:'analytics.html', icon:'pie-chart', label:'Analytics', key:'analytics'},
    ]},
    {section:'System', items:[
      {href:'settings.html', icon:'settings', label:'Settings', key:'settings'},
    ]}
  ];

  function renderShell(activeKey){
    const session = auth.requireAuth();
    if(!session) return null;

    document.body.insertAdjacentHTML('afterbegin', `
      <div id="loading-screen"><div class="loader-mark">${ic('flask')}</div><div class="loader-text">Loading Vitals Lab…</div></div>
    `);

    const settings = store.get(KEYS.settings, {labName:'Vitals Lab'});
    if(settings.darkMode) document.documentElement.setAttribute('data-theme','dark');

    const isAdmin = session.role === 'admin';
    let navHtml = '';
    NAV_ITEMS.forEach(group=>{
      const visibleItems = group.items.filter(it => !it.adminOnly || isAdmin);
      if(!visibleItems.length) return;
      navHtml += `<div class="nav-section-label">${group.section}</div>`;
      visibleItems.forEach(it=>{
        navHtml += `<a href="${it.href}" class="nav-item ${it.key===activeKey?'active':''}">${ic(it.icon)}<span>${it.label}</span></a>`;
      });
    });

    const shellEl = document.querySelector('.app-shell');
    shellEl.insertAdjacentHTML('afterbegin', `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="mark">${ic('flask')}</div>
          <div class="brand-text">${util.escapeHtml(settings.labName||'Vitals Lab')}<small>Laboratory Suite</small></div>
        </div>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-footer">
          <button class="sidebar-collapse-btn" id="collapse-btn">${ic('chevrons-left')}<span>Collapse</span></button>
          <button class="sidebar-collapse-btn" id="logout-btn" style="color:var(--danger);">${ic('log-out')}<span>Logout</span></button>
        </div>
      </aside>`);

    document.body.classList.add('shell-ready');

    const topbarHost = document.getElementById('topbar-host');
    if(topbarHost){
      const pending = store.get(KEYS.pending, []);
      const overdueCount = pending.filter(p=>p.status==='overdue').length;
      topbarHost.innerHTML = `
        <header class="topbar">
          <div class="topbar-left">
            <button class="burger-btn" id="burger-btn">${ic('menu')}</button>
            <div class="page-title-block">
              <h1 id="page-title-text"></h1>
              <div class="crumb" id="page-crumb-text"></div>
            </div>
          </div>
          <div class="search-box">${ic('search')}<input type="text" id="global-search" placeholder="Search patients, doctors, receipts…"></div>
          <div class="topbar-right">
            <button class="icon-btn" id="dark-toggle" title="Toggle dark mode">${ic('moon')}</button>
            <div class="dropdown-wrap" id="notif-wrap">
              <button class="icon-btn" id="notif-btn">${ic('bell')}${overdueCount?'<span class="dot"></span>':''}</button>
              <div class="dropdown-menu" style="width:300px;">
                <div style="padding:8px 10px;font-weight:700;font-size:12.5px;">Notifications</div>
                <div class="notif-item"><div class="notif-dot" style="background:var(--danger);"></div><div><p>${overdueCount} overdue payment${overdueCount===1?'':'s'}</p><small>Needs follow-up</small></div></div>
                <div class="notif-item"><div class="notif-dot" style="background:var(--info);"></div><div><p>Daily backup completed</p><small>2 hours ago</small></div></div>
                <div class="notif-item"><div class="notif-dot" style="background:var(--success);"></div><div><p>12 reports released today</p><small>Just now</small></div></div>
              </div>
            </div>
            <div class="dropdown-wrap" id="profile-wrap">
              <button class="profile-btn" id="profile-btn">
                <div class="avatar">${util.initials(session.name)}</div>
                <div><span class="pname">${util.escapeHtml(session.name)}</span><span class="role">${session.role==='admin'?'Administrator':'Staff'}</span></div>
                ${ic('chevron-down','icon-sm')}
              </button>
              <div class="dropdown-menu">
                <a href="settings.html">${ic('user')} Profile</a>
                <a href="settings.html">${ic('settings')} Settings</a>
                <hr>
                <button id="logout-btn-2">${ic('log-out')} Logout</button>
              </div>
            </div>
          </div>
        </header>`;
    }

    setTimeout(()=>{
      const ls = document.getElementById('loading-screen');
      if(ls) ls.classList.add('hidden');
    }, 500);

    wireShellEvents();
    return session;
  }

  function wireShellEvents(){
    const shell = document.querySelector('.app-shell');
    const collapseBtn = document.getElementById('collapse-btn');
    const burgerBtn = document.getElementById('burger-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    collapseBtn && collapseBtn.addEventListener('click', ()=>{
      shell.classList.toggle('collapsed');
      store.set('vlab_sidebar_collapsed', shell.classList.contains('collapsed'));
    });
    if(store.get('vlab_sidebar_collapsed') && window.innerWidth>1024){ shell && shell.classList.add('collapsed'); }

    burgerBtn && burgerBtn.addEventListener('click', ()=>{
      if(window.innerWidth<=1024){
        shell.classList.toggle('mobile-open');
        backdrop.classList.toggle('show');
      }else{
        shell.classList.toggle('collapsed');
      }
    });
    backdrop && backdrop.addEventListener('click', ()=>{
      shell.classList.remove('mobile-open');
      backdrop.classList.remove('show');
    });

    ['logout-btn','logout-btn-2'].forEach(id=>{
      const b = document.getElementById(id);
      b && b.addEventListener('click', auth.logout);
    });

    document.querySelectorAll('.dropdown-wrap').forEach(wrap=>{
      const btn = wrap.querySelector('button');
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        document.querySelectorAll('.dropdown-wrap').forEach(w=>{ if(w!==wrap) w.classList.remove('open'); });
        wrap.classList.toggle('open');
      });
    });
    document.addEventListener('click', ()=>{
      document.querySelectorAll('.dropdown-wrap').forEach(w=>w.classList.remove('open'));
    });

    const darkToggle = document.getElementById('dark-toggle');
    if(darkToggle){
      const settings = store.get(KEYS.settings, {});
      updateDarkIcon(darkToggle, !!settings.darkMode);
      darkToggle.addEventListener('click', ()=>{
        const s = store.get(KEYS.settings, {});
        s.darkMode = !s.darkMode;
        store.set(KEYS.settings, s);
        document.documentElement.setAttribute('data-theme', s.darkMode?'dark':'light');
        updateDarkIcon(darkToggle, s.darkMode);
      });
    }

    const globalSearch = document.getElementById('global-search');
    if(globalSearch){
      globalSearch.addEventListener('keydown', (e)=>{
        if(e.key==='Enter' && globalSearch.value.trim()){
          window.location.href = `patients.html?q=${encodeURIComponent(globalSearch.value.trim())}`;
        }
      });
    }

    bindRipple();
  }
  function updateDarkIcon(btn, isDark){
    btn.innerHTML = ic(isDark?'sun':'moon');
  }

  function setPageTitle(title, crumb){
    const t = document.getElementById('page-title-text');
    const c = document.getElementById('page-crumb-text');
    if(t) t.textContent = title;
    if(c) c.textContent = crumb || 'Vitals Lab / ' + title;
    document.title = title + ' · Vitals Lab';
  }

  /* ---------------------------------------------------------------------
     11. EXPORT / PRINT
  --------------------------------------------------------------------- */
  function exportCSV(filename, headers, rows){
    const csv = [headers.join(',')].concat(
      rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))
    ).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully.', 'success');
  }
  function printSection(){ window.print(); }

  /* ---------------------------------------------------------------------
     12. PAGINATION HELPER
  --------------------------------------------------------------------- */
  function paginate(data, page, perPage){
    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total/perPage));
    page = Math.min(Math.max(1,page), totalPages);
    const start = (page-1)*perPage;
    return { items: data.slice(start, start+perPage), page, totalPages, total };
  }
  function renderPagination(container, state, onPage){
    const {page, totalPages, total} = state;
    let pagesHtml = '';
    const maxBtns = 5;
    let startP = Math.max(1, page-2), endP = Math.min(totalPages, startP+maxBtns-1);
    startP = Math.max(1, endP-maxBtns+1);
    for(let p=startP;p<=endP;p++){
      pagesHtml += `<button data-page="${p}" class="${p===page?'active':''}">${p}</button>`;
    }
    container.innerHTML = `
      <span>Showing page ${page} of ${totalPages} · ${total} records</span>
      <div class="pages">
        <button data-page="${page-1}" ${page<=1?'disabled':''}>${ic('arrow-left','icon-sm')}</button>
        ${pagesHtml}
        <button data-page="${page+1}" ${page>=totalPages?'disabled':''}>${ic('arrow-right','icon-sm')}</button>
      </div>`;
    container.querySelectorAll('button[data-page]').forEach(b=>{
      b.addEventListener('click', ()=> onPage(Number(b.dataset.page)));
    });
  }

  return { KEYS, store, util, seedIfNeeded, auth, toast, openModal, closeModal, confirmDelete,
           animateCounter, renderShell, setPageTitle, exportCSV, printSection, paginate, renderPagination,
           CAP_STATUSES, PAYMENT_STATUSES, bindRipple, icon: ic,
           pools:{firstNames,lastNames,cities,areaNames,specializations,hospitals,testCategories,testNames,sampleTypes,paymentMethods,expenseCategories,vendors} };
})();

// Seed on every load (idempotent)
VLAB.seedIfNeeded();
