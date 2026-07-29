/* ==========================================================================
   supabase-client.js — connection + thin data-access layer for Supabase.
   Loaded before app.js. Exposes `window.SB` with the same shape as the old
   `VLAB.store` helper, but async (real network calls instead of
   localStorage), plus real auth against Supabase's own user system.

   SETUP: fill in SUPABASE_URL and SUPABASE_ANON_KEY below once your project
   is created (Project Settings → API in the Supabase dashboard). The anon
   key is safe to expose in frontend code — it only allows what your Row
   Level Security policies (see supabase/schema.sql) permit.
   ========================================================================== */

const SUPABASE_URL = 'https://eteosutkjtyivjnckwdz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0ZW9zdXRranR5aXZqbmNrd2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTc4NDAsImV4cCI6MjEwMDc5Mzg0MH0.hPgpGQel7CsDhioRUSyVzAr2Ci9lXmZGUvyR3jaAFrk';

const SB = (() => {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const TABLES = {
    patients:'patients', doctors:'doctors', areas:'areas', tests:'tests',
    payments:'payments', pending:'pending_payments', expenses:'expenses',
    settings:'settings', profiles:'profiles'
  };

  /* ---------------------------------------------------------------------
     AUTH — real Supabase accounts, not the old hardcoded demo users.
  --------------------------------------------------------------------- */
  const auth = {
    async login(email, password, expectedRole){
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if(error) return { ok:false, msg: 'Invalid email or password.' };

      const { data: profile, error: profileErr } = await client
        .from('profiles').select('*').eq('id', data.user.id).single();
      if(profileErr || !profile){
        await client.auth.signOut();
        return { ok:false, msg: 'No profile found for this account — ask an admin to set one up.' };
      }
      if(expectedRole && profile.role !== expectedRole){
        await client.auth.signOut();
        return { ok:false, msg: `This account is not registered as ${expectedRole}.` };
      }
      return { ok:true, user: { name: profile.name, role: profile.role, email } };
    },
    async logout(){
      await client.auth.signOut();
      window.location.href = 'login.html';
    },
    async current(){
      const { data: { session } } = await client.auth.getSession();
      if(!session) return null;
      const { data: profile } = await client
        .from('profiles').select('*').eq('id', session.user.id).single();
      if(!profile) return null;
      return { name: profile.name, role: profile.role, email: session.user.email };
    },
    async requireAuth(){
      const s = await auth.current();
      if(!s){ window.location.href = 'login.html'; return null; }
      return s;
    }
  };

  /* ---------------------------------------------------------------------
     DATA — thin CRUD wrapper, same shape everywhere so each page's JS
     changes as little as possible when migrating off localStorage.
  --------------------------------------------------------------------- */
  const data = {
    async list(table, opts={}){
      let q = client.from(TABLES[table]).select('*');
      if(opts.order) q = q.order(opts.order, { ascending: opts.ascending !== false });
      const { data, error } = await q;
      if(error){ console.error(`SB.list(${table}) failed`, error); return []; }
      return data;
    },
    async insert(table, record){
      const { data, error } = await client.from(TABLES[table]).insert(record).select().single();
      if(error){ console.error(`SB.insert(${table}) failed`, error); return null; }
      return data;
    },
    async update(table, id, patch){
      const { data, error } = await client.from(TABLES[table]).update(patch).eq('id', id).select().single();
      if(error){ console.error(`SB.update(${table}) failed`, error); return null; }
      return data;
    },
    async remove(table, id){
      const { error } = await client.from(TABLES[table]).delete().eq('id', id);
      if(error){ console.error(`SB.remove(${table}) failed`, error); return false; }
      return true;
    },
    async getSettings(){
      const { data, error } = await client.from('settings').select('*').eq('id',1).single();
      if(error){ console.error('SB.getSettings failed', error); return {}; }
      return data;
    },
    async updateSettings(patch){
      const { data, error } = await client.from('settings').update(patch).eq('id',1).select().single();
      if(error){ console.error('SB.updateSettings failed', error); return null; }
      return data;
    }
  };

  return { client, auth, data };
})();

window.SB = SB;