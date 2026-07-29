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

    const settings = store.get(KEYS.settings, {});
    document.getElementById('s-labname').value = settings.labName||'';
    document.getElementById('s-phone').value = settings.phone||'';
    document.getElementById('s-email').value = settings.email||'';
    document.getElementById('s-gst').value = settings.gst||'';
    document.getElementById('s-address').value = settings.address||'';

    document.getElementById('profile-name-display').textContent = session.name;
    document.getElementById('profile-role-display').textContent = session.role==='admin'?'Administrator':'Staff';
    document.getElementById('profile-avatar').textContent = util.initials(session.name);
    document.getElementById('profile-name').value = session.name;

    setupToggle(!!settings.darkMode);
    wire();
  });

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
    document.getElementById('lab-form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const s = store.get(KEYS.settings, {});
      s.labName = document.getElementById('s-labname').value;
      s.phone = document.getElementById('s-phone').value;
      s.email = document.getElementById('s-email').value;
      s.gst = document.getElementById('s-gst').value;
      s.address = document.getElementById('s-address').value;
      store.set(KEYS.settings, s);
      VLAB.toast('Lab profile updated. Refresh to see sidebar branding change.', 'success');
    });

    document.getElementById('logo-box').addEventListener('click', ()=>document.getElementById('s-logo').click());
    document.getElementById('s-logo').addEventListener('change', (e)=>{
      const box = document.getElementById('logo-box');
      if(e.target.files[0]) box.innerHTML = `${icon('check-circle')} ${util.escapeHtml(e.target.files[0].name)} uploaded`;
    });

    document.getElementById('save-profile-btn').addEventListener('click', ()=>{
      const newName = document.getElementById('profile-name').value.trim();
      if(!newName){ VLAB.toast('Name cannot be empty.', 'error'); return; }
      const s = store.get(KEYS.session);
      s.name = newName;
      store.set(KEYS.session, s);
      const users = store.get(KEYS.users, []);
      const u = users.find(u=>u.username===s.username);
      if(u) u.name = newName;
      store.set(KEYS.users, users);
      VLAB.toast('Profile updated successfully.', 'success');
      setTimeout(()=>window.location.reload(), 700);
    });

    document.getElementById('change-pass-btn').addEventListener('click', ()=>{
      const cur = document.getElementById('cur-pass').value;
      const next = document.getElementById('new-pass').value;
      const users = store.get(KEYS.users, []);
      const u = users.find(x=>x.username===session.username);
      if(!u || u.password !== cur){ VLAB.toast('Current password is incorrect.', 'error'); return; }
      if(!next || next.length<4){ VLAB.toast('New password must be at least 4 characters.', 'error'); return; }
      u.password = next;
      store.set(KEYS.users, users);
      document.getElementById('cur-pass').value='';
      document.getElementById('new-pass').value='';
      VLAB.toast('Password changed successfully.', 'success');
    });
  }
})();
