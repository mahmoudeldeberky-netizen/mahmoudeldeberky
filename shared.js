// ── MAHMOUD EL-DEBERKY — SHARED JS ──────────────────────────
const SB_URL = 'https://gkspykbqyaodwbveuheh.supabase.co';
const SB_KEY = 'sb_publishable_R_iucpsBmPKWUxT9Bf3ySg_pe6dOOn1';
const SUPER_ADMIN_EMAIL = 'mahmoudeldeberky@gmail.com';

const PAGES_EN = [
  { href:'/',              label:'Home'        },
  { href:'experience',     label:'Experience'  },
  { href:'credentials',    label:'Credentials' },
  { href:'videos',         label:'Videos'      },
  { href:'documents',      label:'Documents'   },
  { href:'hr-material',    label:'HR Material' },
  { href:'hr-program',     label:'HR Tools'    },
  { href:'contact',        label:'Contact'     },
];
const PAGES_AR = [
  { href:'/',              label:'الرئيسية'    },
  { href:'experience',     label:'الخبرات'     },
  { href:'credentials',    label:'المؤهلات'    },
  { href:'videos',         label:'الفيديوهات'  },
  { href:'documents',      label:'الوثائق'     },
  { href:'hr-material',    label:'موارد HR'    },
  { href:'hr-program',     label:'أدوات HR'    },
  { href:'contact',        label:'تواصل'       },
];

let _db = null;
window._db = null; // expose globally for page.html and other inline scripts
let currentLang = localStorage.getItem('lang') || 'en';
window.currentLang = currentLang; // expose globally for inline page scripts (page.html, hr-program.html, performance-eval.html)
window._currentUser = null;
let _navPages = null; // populated from Supabase nav_pages table

// ── LOAD NAV PAGES ───────────────────────────────────────────
async function loadNavPages() {
  // Show cached version instantly while fetching fresh
  try { const c = sessionStorage.getItem('nav_pages'); if(c) _navPages = JSON.parse(c); } catch(e) {}
  if(!_db) return;
  try {
    const {data} = await _db.from('nav_pages').select('*').eq('is_visible',true).order('sort_order');
    if(data && data.length) {
      _navPages = data;
      sessionStorage.setItem('nav_pages', JSON.stringify(data));
    }
  } catch(e) {}
}

function initSupabase() {
  if (window.supabase) {
    _db = window.supabase.createClient(SB_URL, SB_KEY);
    window._db = _db; // keep window._db in sync
  }
}

// ── NAV ──────────────────────────────────────────────────────
function buildNav() {
  const cur     = location.pathname.replace(/\.html$/, '').split('/').pop() || '/';
  const navEl   = document.getElementById('main-nav-links');
  const mobileEl= document.getElementById('mobile-nav-links');
  const isSuperAdmin = window._currentUser?.email === SUPER_ADMIN_EMAIL;
  const adminLink = isSuperAdmin
    ? `<li><a href="admin" style="color:var(--gold);border:1px solid rgba(196,163,90,.4);padding:2px 10px;">${currentLang==='ar'?'الإدارة':'Admin ⚙'}</a></li>`
    : '';

  if(!_navPages) {
    // Fallback to hardcoded arrays
    const pages = currentLang === 'ar' ? PAGES_AR : PAGES_EN;
    if(navEl) navEl.innerHTML = pages.map(p=>`<li><a href="${p.href}" class="${cur===p.href?'active':''}">${p.label}</a></li>`).join('') + adminLink;
    if(mobileEl) mobileEl.innerHTML = pages.map(p=>`<a href="${p.href}" class="${cur===p.href?'active':''}">${p.label}</a>`).join('') + (isSuperAdmin?`<a href="admin" style="color:var(--gold);">${currentLang==='ar'?'الإدارة':'Admin ⚙'}</a>`:'');
    return;
  }

  const lbl = p => currentLang === 'ar' ? p.label_ar : p.label_en;
  const topPages = _navPages.filter(p => !p.parent_id);
  const subMap   = {};
  _navPages.filter(p => p.parent_id).forEach(p => {
    (subMap[p.parent_id] = subMap[p.parent_id] || []).push(p);
  });

  if(navEl) navEl.innerHTML = topPages.map(p => {
    const subs   = subMap[p.id] || [];
    const active = (cur === (p.href === '/' ? '/' : p.href)) ? 'active' : '';
    if(subs.length) return `<li class="nav-has-dropdown">
      <a href="${p.href}" class="${active}">${lbl(p)}<span class="nav-arrow">▾</span></a>
      <div class="nav-dropdown">${subs.map(s=>`<a href="${s.href}">${lbl(s)}</a>`).join('')}</div>
    </li>`;
    return `<li><a href="${p.href}" class="${active}">${lbl(p)}</a></li>`;
  }).join('') + adminLink;

  if(mobileEl) {
    let html = '';
    topPages.forEach(p => {
      const subs   = subMap[p.id] || [];
      const active = (cur === (p.href === '/' ? '/' : p.href)) ? 'active' : '';
      html += `<a href="${p.href}" class="${active}">${lbl(p)}</a>`;
      subs.forEach(s => { html += `<a href="${s.href}" style="padding-left:2rem;font-size:.72rem;opacity:.7;">↳ ${lbl(s)}</a>`; });
    });
    mobileEl.innerHTML = html + (isSuperAdmin?`<a href="admin" style="color:var(--gold);">${currentLang==='ar'?'الإدارة':'Admin ⚙'}</a>`:'');
  }
}

// ── HAMBURGER ────────────────────────────────────────────────
function initHamburger() {
  const btn   = document.getElementById('hamburger-btn');
  const menu  = document.getElementById('mobile-menu');
  if(!btn||!menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if(!btn.contains(e.target)&&!menu.contains(e.target)) {
      btn.classList.remove('open');
      menu.classList.remove('open');
    }
  });
}

// ── LANGUAGE ─────────────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  window.currentLang = lang; // keep global in sync for inline page scripts
  localStorage.setItem('lang', lang);
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang==='ar'?'rtl':'ltr');
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  document.querySelectorAll('[data-en]').forEach(el=>{
    el.innerHTML = lang==='ar'?(el.dataset.ar||el.dataset.en):el.dataset.en;
  });
  buildNav();
}

// ── USER PROFILE ─────────────────────────────────────────────
let _userProfile = null;

async function loadUserProfile(user) {
  if(!_db||!user) return null;
  const {data} = await _db.from('user_profiles').select('*').eq('id',user.id).single();
  if(data) { _userProfile = data; return data; }
  // Create profile if doesn't exist
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || generateName();
  const newProfile = {
    id: user.id, email: user.email,
    display_name: displayName,
    avatar_url: user.user_metadata?.avatar_url||'',
    comments_count:0, likes_count:0
  };
  await _db.from('user_profiles').insert(newProfile);
  _userProfile = newProfile;
  return newProfile;
}

function generateName() {
  const adj = ['Creative','Sharp','Dynamic','Bright','Swift'];
  const noun = ['Thinker','Leader','Builder','Planner','Solver'];
  return adj[Math.floor(Math.random()*adj.length)]+' '+noun[Math.floor(Math.random()*noun.length)];
}

function buildUserWidget(user, profile) {
  const container = document.getElementById('user-widget');
  if(!container) return;
  if(!user) {
    container.innerHTML = `
      <button onclick="showLoginModal()" class="btn btn-outline btn-sm"
        data-en="Sign In" data-ar="دخول" style="font-size:.72rem;padding:5px 14px;">Sign In</button>`;
    return;
  }
  const name   = profile?.display_name || user.email.split('@')[0];
  const avatar = profile?.avatar_url||user.user_metadata?.avatar_url||'';
  const cmts   = profile?.comments_count||0;
  const likes  = profile?.likes_count||0;
  const isSA   = user.email===SUPER_ADMIN_EMAIL;

  container.innerHTML = `
    <div class="user-profile">
      <button class="user-trigger" onclick="toggleDropdown()" type="button">
        ${avatar
          ? `<img src="${avatar}" alt="${name}" style="width:28px;height:28px;border-radius:50%;">`
          : `<div class="user-avatar-circle">${name[0].toUpperCase()}</div>`}
        <span>${name}</span>
        ${isSA?`<span style="font-size:.65rem;color:var(--gold);border:1px solid rgba(196,163,90,.4);padding:1px 6px;margin-right:2px;">${currentLang==='ar'?'ادمن':'ADMIN'}</span>`:''}
        <span style="font-size:.6rem;color:var(--muted);">▼</span>
      </button>
      <div class="user-dropdown" id="user-dropdown">
        <div class="user-dropdown-header">
          ${avatar
            ? `<img src="${avatar}" style="width:52px;height:52px;border-radius:50%;margin:0 auto .5rem;display:block;">`
            : `<div class="udd-avatar" style="margin:0 auto .5rem;width:52px;height:52px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;color:#080809;font-size:1.3rem;">${name[0].toUpperCase()}</div>`}
          <div class="udd-name">${name}</div>
          <div class="udd-email">${user.email}</div>
        </div>
        <div class="udd-stats">
          <div class="udd-stat"><strong>${cmts}</strong><span data-en="Comments" data-ar="تعليقات">Comments</span></div>
          <div class="udd-stat"><strong>${likes}</strong><span data-en="Likes" data-ar="إعجابات">Likes</span></div>
        </div>
        <div class="udd-edit">
          <p style="font-size:.68rem;color:var(--muted);margin-bottom:.35rem;" data-en="Display Name" data-ar="الاسم المعروض">Display Name</p>
          <div style="display:flex;gap:.4rem;">
            <input type="text" id="edit-display-name" value="${name}" placeholder="Your name">
            <button type="button" onclick="saveDisplayName()" class="btn btn-gold btn-sm" style="white-space:nowrap;padding:.4rem .8rem;font-size:.72rem;" data-en="Save" data-ar="حفظ">Save</button>
          </div>
        </div>
        <div class="udd-actions">
          ${isSA?`<a href="admin" class="udd-btn udd-btn-outline" style="display:block;text-align:center;text-decoration:none;padding:.55rem;font-size:.72rem;margin-bottom:.4rem;" data-en="Admin Panel ⚙" data-ar="لوحة الإدارة ⚙">Admin Panel ⚙</a>`:''}
          <button type="button" onclick="signOutUser()" class="udd-btn udd-btn-red" data-en="Sign Out" data-ar="تسجيل الخروج">Sign Out</button>
        </div>
      </div>
    </div>`;
}

function toggleDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}

document.addEventListener('click', e => {
  const dd = document.getElementById('user-dropdown');
  const trigger = document.querySelector('.user-trigger');
  if(dd&&trigger&&!trigger.contains(e.target)&&!dd.contains(e.target)) dd.classList.remove('open');
});

async function saveDisplayName() {
  const input = document.getElementById('edit-display-name');
  if(!input||!_db||!window._currentUser) return;
  const name = input.value.trim();
  if(!name) return;
  await _db.from('user_profiles').update({display_name:name}).eq('id',window._currentUser.id);
  _userProfile.display_name = name;
  buildUserWidget(window._currentUser, _userProfile);
  document.getElementById('user-dropdown')?.classList.add('open');
}

async function signOutUser() {
  await _db?.auth.signOut();
  window._currentUser = null;
  _userProfile = null;
  buildUserWidget(null, null);
  buildNav();
  location.reload();
}

function showLoginModal() {
  const m = document.getElementById('login-modal') || document.getElementById('global-login-modal');
  if(m) { m.style.display='flex'; return; }
  // Create global modal if not present
  const modal = document.createElement('div');
  modal.id='global-login-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:999;display:flex;align-items:center;justify-content:center;padding:2rem;';
  modal.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--border);padding:2.5rem;max-width:380px;width:100%;text-align:center;position:relative;">
    <button onclick="this.closest('#global-login-modal').style.display='none'" style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;">✕</button>
    <div style="font-size:2.5rem;margin-bottom:1rem;">👤</div>
    <h2 style="font-family:var(--ff-h);font-size:1.5rem;color:var(--cream);margin-bottom:.5rem;" data-en="Sign In" data-ar="تسجيل الدخول">Sign In</h2>
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem;" data-en="Sign in to comment, react, and download documents." data-ar="سجّل دخولك للتعليق والتفاعل وتحميل الملفات.">Sign in to comment, react, and download documents.</p>
    <button onclick="globalSignIn('google')" style="display:flex;align-items:center;justify-content:center;gap:.75rem;width:100%;padding:.85rem;background:#fff;color:#333;font-size:.88rem;font-weight:500;border:none;cursor:pointer;font-family:inherit;margin-bottom:.6rem;">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continue with Google
    </button>
    <button onclick="globalSignIn('linkedin_oidc')" style="display:flex;align-items:center;justify-content:center;gap:.75rem;width:100%;padding:.85rem;background:#0077B5;color:#fff;font-size:.88rem;font-weight:500;border:none;cursor:pointer;font-family:inherit;">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      Continue with LinkedIn
    </button>
  </div>`;
  document.body.appendChild(modal);
}

async function globalSignIn(provider) {
  if(!_db) return;
  await _db.auth.signInWithOAuth({provider, options:{redirectTo:window.location.href}});
}

// ── SETTINGS ─────────────────────────────────────────────────
async function applySettings() {
  if(!_db) return;
  try {
    const [settingsRes, socialRes] = await Promise.all([
      _db.from('site_settings').select('key,value'),
      _db.from('links').select('*').eq('type','social').eq('is_active',true)
    ]);
    const s = Object.fromEntries((settingsRes.data||[]).map(r=>[r.key,r.value]));
    if(s.profile_photo_url) {
      document.querySelectorAll('.profile-photo').forEach(el=>{
        el.innerHTML=`<img src="${s.profile_photo_url}" style="width:100%;height:100%;object-fit:cover;object-position:top;">`;
      });
    }
    if(s.linkedin_url) document.querySelectorAll('[data-slink="linkedin"]').forEach(el=>el.href=s.linkedin_url);
    if(s.cv_url) document.querySelectorAll('[data-slink="cv"]').forEach(el=>{el.href=s.cv_url;el.target='_blank';});
    if(s.whatsapp_number) document.querySelectorAll('[data-slink="whatsapp"]').forEach(el=>el.href='https://wa.me/'+s.whatsapp_number.replace(/[^0-9]/g,''));
    if(s.site_email) document.querySelectorAll('[data-slink="email"]').forEach(el=>{el.href='mailto:'+s.site_email;el.textContent=s.site_email;});
    const socials=socialRes.data||[];
    document.querySelectorAll('.dynamic-socials').forEach(container=>{
      socials.forEach(link=>{
        const a=document.createElement('a');
        a.href=link.url;a.target='_blank';a.className='btn btn-outline btn-sm';
        a.textContent=currentLang==='ar'&&link.label_ar?link.label_ar:link.label_en;
        container.appendChild(a);
      });
    });
  } catch(e){}
}

// ── LOGO ─────────────────────────────────────────────────────
const LOGO_SVG = `<img src="apple-touch-icon.png" alt="Mahmoud El-Deberky" style="height:44px;width:44px;display:block;border-radius:4px;">`;

// ── SITE VERSION ─────────────────────────────────────────────
const SITE_VERSION = '1.0.0';
function injectFooterVersion() {
  document.querySelectorAll('footer').forEach(f => {
    if (f.querySelector('.site-version')) return; // avoid duplicates
    const p = document.createElement('p');
    p.className = 'site-version';
    p.style.cssText = 'opacity:.45;font-size:.68rem;letter-spacing:.04em;margin-top:.35rem;';
    p.dataset.en = `Version ${SITE_VERSION}`;
    p.dataset.ar = `الإصدار ${SITE_VERSION}`;
    p.textContent = currentLang === 'ar' ? p.dataset.ar : p.dataset.en;
    f.appendChild(p);
  });
}

// ── REVEAL & SKILLS ──────────────────────────────────────────
function initReveal() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach((e,i)=>{if(e.isIntersecting)setTimeout(()=>e.target.classList.add('visible'),i*70);});
  },{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}
function initSkillBars() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.style.width=e.target.dataset.pct+'%';obs.unobserve(e.target);}});
  },{threshold:.5});
  document.querySelectorAll('.sk-fill').forEach(el=>obs.observe(el));
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  document.querySelectorAll('.nav-logo').forEach(el=>el.innerHTML=LOGO_SVG);
  initHamburger();

  if(_db) {
    const {data:{session}} = await _db.auth.getSession();
    window._currentUser = session?.user||null;
    const profile = window._currentUser ? await loadUserProfile(window._currentUser) : null;
    buildUserWidget(window._currentUser, profile);
    _db.auth.onAuthStateChange(async(_,s)=>{
      window._currentUser=s?.user||null;
      const p = window._currentUser ? await loadUserProfile(window._currentUser) : null;
      buildUserWidget(window._currentUser, p);
      buildNav();
    });
  }

  await loadNavPages(); // fetch nav from Supabase before building nav bar
  injectFooterVersion(); // add version line to footers before setLang populates text
  const savedLang=localStorage.getItem('lang')||'en';
  setLang(savedLang);
  initReveal();
  initSkillBars();
  applySettings();
  trackPageView();
});

// ── PAGE VIEW TRACKING ───────────────────────────────────────
async function trackPageView() {
  try {
    if(!_db) return;
    // Don't track admin's own visits
    const {data:{session}} = await _db.auth.getSession();
    if(session?.user) return;
    const page = location.pathname.replace(/\.html$/,'').replace(/^\//,'') || '/';
    await _db.from('page_views').insert({ page });
  } catch(e) {}
}
