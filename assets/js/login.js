/* ==========================================================================
   login.js — shared handler for login.html and admin-login.html
   ========================================================================== */
function initLoginPage(expectedRole){
  document.addEventListener('DOMContentLoaded', ()=>{
    const existing = VLAB.auth.current();
    if(existing){ window.location.href = 'index.html'; return; }

    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const btn = form.querySelector('button[type="submit"]');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `${window.Icons.icon('loader','icon-spin')} Signing in…`;
      btn.disabled = true;

      setTimeout(()=>{
        const result = VLAB.auth.login(username, password, expectedRole);
        if(result.ok){
          VLAB.toast(`Welcome back, ${result.user.name.split(' ')[0]}!`, 'success', 'Signed in');
          setTimeout(()=> window.location.href = 'index.html', 500);
        }else{
          btn.innerHTML = originalHtml;
          btn.disabled = false;
          VLAB.toast(result.msg, 'error', 'Login failed');
        }
      }, 500);
    });
  });
}
