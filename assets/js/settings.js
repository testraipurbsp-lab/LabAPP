/* ========================================================================
   settings.js — Lab profile, user profile, password, dark mode
   ======================================================================== */
(function(){
  const { store, util, KEYS, icon } = VLAB;
  let session;

  document.addEventListener('DOMContentLoaded', async ()=>{
    session = await VLAB.renderShell('settings');
    if(!session) return;
    VLAB.setPageTitle('Settings', 'Vitals Lab / Settings');

    const settings = await SB.data.getSettings();
    document.getElementById('s-labname').value = settings.lab_name||'';
    document.getElementById('s-phone').value = settings.phone||'';
    document.getElementById('s-email').value = settings.email||'';
    document.getElementById('s-gst').value = settings.gst||'';
    document.getElementById('s-address').value = settings.address||'';
    document.getElementById('s-pathologist-name').value = settings.pathologist_name||'';
    document.getElementById('s-pathologist-qual').value = settings.pathologist_qualification||'';
    document.getElementById('s-pathologist-reg').value = settings.pathologist_reg_no||'';
    if(settings.logo_url) showLogoPreview(settings.logo_url);

    document.getElementById('profile-name-display').textContent = session.name;
    document.getElementById('profile-role-display').textContent = session.role==='admin'?'Administrator':'Staff';
    document.getElementById('profile-avatar').textContent = util.initials(session.name);
    document.getElementById('profile-name').value = session.name;

    if(session.role !== 'admin'){
      document.getElementById('lab-form').querySelectorAll('input, button[type="submit"]').forEach(el=> el.disabled = true);
      document.getElementById('logo-box').style.pointerEvents = 'none';
      document.getElementById('logo-change-btn').disabled = true;
      document.getElementById('logo-remove-btn').disabled = true;
      const note = document.createElement('p');
      note.className = 'text-muted';
      note.style.cssText = 'font-size:12px;margin-top:10px;';
      note.textContent = 'Only administrators can edit the lab profile.';
      document.getElementById('lab-form').appendChild(note);
    }

    // Dark mode is a per-device display preference, not lab data — stays
    // in localStorage on purpose, same as before.
    setupToggle(!!store.get(KEYS.settings, {}).darkMode);
    wire();
  });

  function showLogoPreview(url){
    const box = document.getElementById('logo-box');
    box.innerHTML = `<img src="${url}" alt="Lab logo" style="max-height:52px;max-width:160px;object-fit:contain;pointer-events:none;">`;
    document.getElementById('logo-actions').style.display = 'flex';
  }
  function resetLogoBox(){
    const box = document.getElementById('logo-box');
    box.innerHTML = `${icon('image','icon-lg')}Click to upload lab logo`;
    window.Icons.hydrate(box);
    document.getElementById('logo-actions').style.display = 'none';
  }

  function setupToggle(isDark){
    const track = document.getElementById('toggle-track');
    const knob = document.createElement('span');
    knob.style.cssText = 'position:absolute;left:3px;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2);';
    track.appendChild(knob);
    function paint(dark){
      track.style.background = dark ? 'var(--primary)' : 'var(--border)';
      knob.style.transform = dark ? 'translateX(20px)' : 'translateX(0)';
    }
    paint(isDark);
    const checkbox = document.getElementById('dark-mode-toggle');
    checkbox.checked = isDark;
    track.addEventListener('click', ()=>{
      checkbox.checked = !checkbox.checked;
      paint(checkbox.checked);
      const s = store.get(KEYS.settings, {});
      s.darkMode = checkbox.checked;
      store.set(KEYS.settings, s);
      document.documentElement.setAttribute('data-theme', checkbox.checked?'dark':'light');
      const topToggle = document.getElementById('dark-toggle');
      if(topToggle) topToggle.innerHTML = icon(checkbox.checked?'sun':'moon');
    });
  }

  function wire(){
    document.getElementById('lab-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      const saved = await SB.data.updateSettings({
        lab_name: document.getElementById('s-labname').value,
        phone: document.getElementById('s-phone').value,
        email: document.getElementById('s-email').value,
        gst: document.getElementById('s-gst').value,
        address: document.getElementById('s-address').value,
        pathologist_name: document.getElementById('s-pathologist-name').value,
        pathologist_qualification: document.getElementById('s-pathologist-qual').value,
        pathologist_reg_no: document.getElementById('s-pathologist-reg').value
      });
      btn.disabled = false;
      if(!saved){ VLAB.toast('Could not save lab profile — please try again.', 'error'); return; }
      VLAB.toast('Lab profile updated. Refresh to see sidebar branding change.', 'success');
    });

    document.getElementById('logo-box').addEventListener('click', ()=>{
      if(document.getElementById('logo-actions').style.display === 'none') document.getElementById('s-logo').click();
    });
    document.getElementById('logo-change-btn').addEventListener('click', ()=> document.getElementById('s-logo').click());
    document.getElementById('logo-remove-btn').addEventListener('click', async ()=>{
      const btn = document.getElementById('logo-remove-btn');
      btn.disabled = true;
      const current = await SB.data.getSettings();
      if(current.logo_url){
        const match = current.logo_url.match(/logo\.[a-zA-Z0-9]+/);
        if(match) await SB.client.storage.from('lab-assets').remove([match[0]]);
      }
      const saved = await SB.data.updateSettings({ logo_url: null });
      btn.disabled = false;
      if(!saved){ VLAB.toast('Could not remove logo — please try again.', 'error'); return; }
      resetLogoBox();
      VLAB.toast('Logo removed.', 'success');
    });
    document.getElementById('s-logo').addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const box = document.getElementById('logo-box');
      const original = box.innerHTML;
      box.innerHTML = `${icon('loader','icon-spin')} Uploading…`;

      const ext = file.name.split('.').pop();
      const path = `logo.${ext}`;
      const { error: uploadErr } = await SB.client.storage.from('lab-assets').upload(path, file, { upsert:true, cacheControl:'3600' });
      if(uploadErr){
        box.innerHTML = original;
        VLAB.toast('Could not upload logo — please try again.', 'error');
        return;
      }
      const { data: { publicUrl } } = SB.client.storage.from('lab-assets').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`; // cache-bust so a re-upload shows immediately
      const saved = await SB.data.updateSettings({ logo_url: url });
      if(!saved){
        box.innerHTML = original;
        VLAB.toast('Logo uploaded but could not save — please try again.', 'error');
        return;
      }
      showLogoPreview(url);
      VLAB.toast('Logo updated.', 'success');
    });

    document.getElementById('save-profile-btn').addEventListener('click', async ()=>{
      const newName = document.getElementById('profile-name').value.trim();
      if(!newName){ VLAB.toast('Name cannot be empty.', 'error'); return; }
      const btn = document.getElementById('save-profile-btn');
      btn.disabled = true;
      const result = await SB.auth.updateProfileName(newName);
      btn.disabled = false;
      if(!result.ok){ VLAB.toast(result.msg, 'error'); return; }
      VLAB.toast('Profile updated successfully.', 'success');
      setTimeout(()=>window.location.reload(), 700);
    });

    document.getElementById('change-pass-btn').addEventListener('click', async ()=>{
      const cur = document.getElementById('cur-pass').value;
      const next = document.getElementById('new-pass').value;
      if(!next || next.length<6){ VLAB.toast('New password must be at least 6 characters.', 'error'); return; }
      const btn = document.getElementById('change-pass-btn');
      btn.disabled = true;
      const result = await SB.auth.changePassword(cur, next);
      btn.disabled = false;
      if(!result.ok){ VLAB.toast(result.msg, 'error'); return; }
      document.getElementById('cur-pass').value='';
      document.getElementById('new-pass').value='';
      VLAB.toast('Password changed successfully.', 'success');
    });
  }
})();