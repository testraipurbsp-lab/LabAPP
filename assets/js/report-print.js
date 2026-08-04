/* ==========================================================================
   report-print.js — renders one patient's report_data as a formatted,
   letterhead-style document (GD Diagnostics-style layout), ready to print
   or save as PDF. Read-only page: values are entered from patients.html.
   ========================================================================== */
(function(){
  const { util } = VLAB;

  document.addEventListener('DOMContentLoaded', async ()=>{
    const session = await VLAB.auth.requireAuth();
    if(!session) return;

    const id = new URLSearchParams(window.location.search).get('id');
    const root = document.getElementById('report-root');
    if(!id){ root.innerHTML = '<div class="report-loading">No patient specified.</div>'; return; }

    const [{ data: patient, error }, settings] = await Promise.all([
      SB.client.from('patients').select('*').eq('id', id).single(),
      SB.data.getSettings()
    ]);

    if(error || !patient){
      root.innerHTML = '<div class="report-loading">Could not load this patient\'s report.</div>';
      return;
    }

    document.title = `Report · ${patient.name} · ${settings.lab_name || 'Vitals Lab'}`;
    root.innerHTML = renderReport(patient, settings || {}, 'full');
    renderStatusBanner(patient);

    document.querySelectorAll('input[name="header-mode"]').forEach(radio=>{
      radio.addEventListener('change', ()=>{
        root.innerHTML = renderReport(patient, settings || {}, radio.value);
      });
    });

    document.getElementById('btn-print').addEventListener('click', ()=> window.print());
    document.getElementById('btn-back').addEventListener('click', ()=> window.location.href='patients.html');
  });

  const STATUS_INFO = {
    collected:  { label:'Collected',    badge:'preliminary' },
    processing: { label:'Processing',   badge:'preliminary' },
    reviewed:   { label:'Under Review', badge:'preliminary' },
    completed:  { label:'Report Ready', badge:'final' },
    cancelled:  { label:'Cancelled',    badge:'cancelled' }
  };

  function renderStatusBanner(p){
    const info = STATUS_INFO[p.report_status] || STATUS_INFO.collected;
    if(info.badge === 'final') return; // finalized reports need no on-screen reminder
    const banner = document.createElement('div');
    banner.className = `no-print screen-status-banner ${info.badge}`;
    banner.textContent = info.badge === 'cancelled'
      ? 'This test was cancelled. The report below is shown for reference only.'
      : `This report is still "${info.label}" — it will print with a preliminary watermark and no signature until its status is set to "Report Ready" on the Patients page.`;
    document.getElementById('report-root').insertAdjacentElement('beforebegin', banner);
  }

  function renderReport(p, s, headerMode){
    headerMode = headerMode || 'full';
    const sections = Array.isArray(p.report_data) ? p.report_data : [];
    let rowNo = 0;

    const sectionsHtml = sections.length ? sections.map(sec => `
      <div class="section-title">${util.escapeHtml(sec.section||'')}</div>
      <table class="results">
        <thead><tr><th>No.</th><th>Investigation</th><th>Observed Value</th><th>Unit</th><th>Reference Range</th></tr></thead>
        <tbody>
          ${(sec.rows||[]).map(r => `<tr>
            <td>${++rowNo}</td>
            <td>${util.escapeHtml(r.investigation||'')}</td>
            <td><strong>${util.escapeHtml(r.value||'')}</strong></td>
            <td>${util.escapeHtml(r.unit||'')}</td>
            <td>${util.escapeHtml(r.range||'')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sec.interpretation ? `<div class="interpretation"><strong>Interpretation:</strong> ${util.escapeHtml(sec.interpretation)}</div>` : ''}
    `).join('') : `<div class="no-results">No test results have been entered for this patient yet. Go to Patients → Enter Results to add them.</div>`;

    const labName = s.lab_name || 'Vitals Lab';
    const initials = labName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    // Placeholder quality badges — replace with real certification logos
    // once confirmed (e.g. NABL, ISO 15189) via settings or a dedicated field.
    const badges = ['ACCURATE RESULTS', 'QUALITY ASSURED', 'TIMELY REPORTS'];

    const statusInfo = STATUS_INFO[p.report_status] || STATUS_INFO.collected;
    const isFinal = statusInfo.badge === 'final';
    const isCancelled = statusInfo.badge === 'cancelled';
    const watermarkText = isCancelled ? 'CANCELLED' : (!isFinal ? 'PRELIMINARY' : '');

    const headerHtml = headerMode === 'none' ? '' : headerMode === 'mix' ? `
      <div class="report-header-compact">
        <div class="lab-name">${util.escapeHtml(labName)}</div>
        <div class="lab-meta">${util.escapeHtml(s.address||'')}${(s.phone||s.email)?'<br>'+[s.phone,s.email].filter(Boolean).map(util.escapeHtml).join(' | '):''}</div>
      </div>` : `
      <div class="report-banner">
        <div class="banner-ribbon"></div>
        <div class="banner-logo-circle">${util.escapeHtml(initials)}</div>
        <div class="banner-lab-name">${util.escapeHtml(labName)}</div>
        <div class="banner-tagline">Pathology &amp; Diagnostic Laboratory</div>
        <div class="banner-badges">${badges.map(b=>`<span class="badge-chip">${util.escapeHtml(b)}</span>`).join('')}</div>
      </div>`;

    return `
      ${watermarkText ? `<div class="watermark ${isCancelled?'':'preliminary'}">${watermarkText}</div>` : ''}
      ${headerHtml}
      <div class="banner-address-bar">${util.escapeHtml(s.address || '')}</div>
      ${(s.phone||s.email) ? `<div class="lab-contact-line">${[s.phone,s.email].filter(Boolean).map(util.escapeHtml).join(' &nbsp;|&nbsp; ')}</div>` : ''}

      <div class="report-body">
        <table class="patient-info">
          <tr>
            <td class="label">Name</td><td class="value">${util.escapeHtml(p.name)}</td>
            <td class="label">Age / Gender</td><td class="value">${p.age||'—'} Years / ${util.escapeHtml(p.gender||'—')}</td>
          </tr>
          <tr>
            <td class="label">Referred By</td><td class="value">${util.escapeHtml(p.doctor||'Self')}</td>
            <td class="label">Patient ID</td><td class="value">${util.escapeHtml(p.patient_code||p.id)}</td>
          </tr>
          <tr>
            <td class="label">Collection Date</td><td class="value">${p.collection_date?util.fmtDate(p.collection_date):'—'}</td>
            <td class="label">Report Date</td><td class="value">${p.report_date?util.fmtDate(p.report_date):'—'}</td>
          </tr>
        </table>

        <div class="report-title">${util.escapeHtml(p.test_name || 'Lab Report')}</div>
        <div style="text-align:center;"><span class="status-badge ${statusInfo.badge}">${util.escapeHtml(statusInfo.label)}</span></div>

        ${sectionsHtml}

        <div class="report-footer-strip">
          <span>Patient ID: ${util.escapeHtml(p.patient_code||p.id)}</span>
          <span>Collected: ${p.collection_date?util.fmtDate(p.collection_date):'—'}</span>
          <span>Reported: ${p.report_date?util.fmtDate(p.report_date):'—'}</span>
        </div>
        <div class="report-footer">
          <div class="disclaimer">
            This report is generated based on values entered by laboratory staff and is intended for the
            reference of the patient and referring physician only. Results should be correlated clinically.
          </div>
          ${isFinal ? `
          <div class="signature">
            <div class="sig-name">${util.escapeHtml(s.pathologist_name || 'Authorized Signatory')}</div>
            <div class="sig-qual">${util.escapeHtml(s.pathologist_qualification || '')}</div>
            ${s.pathologist_reg_no ? `<div class="sig-qual">Reg. No: ${util.escapeHtml(s.pathologist_reg_no)}</div>` : ''}
          </div>` : `
          <div class="pending-review-note">Pending final review<br>Not signed</div>`}
        </div>
      </div>

      <div class="report-footer-ribbon">
        <div class="footer-ribbon-bg"></div>
        <div class="footer-ribbon-content">
          ${s.phone ? `<span>${util.escapeHtml(s.phone)}</span>` : ''}
          ${s.email ? `<span>${util.escapeHtml(s.email)}</span>` : ''}
        </div>
      </div>
    `;
  }
})();