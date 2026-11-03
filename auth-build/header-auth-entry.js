import { createAuthClient } from '@neondatabase/auth';
import { loadAuthConfig } from '../assets/js/auth-config.js';

async function start() {



const { authUrl: AUTH_URL } = await loadAuthConfig();

const auth = createAuthClient(AUTH_URL);


async function updateHeader() {
  const link = document.getElementById('header-auth-link');
  const menu = document.getElementById('account-menu');
  const nickname = document.getElementById('account-nickname');
  const signOut = document.getElementById('header-sign-out');

  if (!link || !menu || !signOut) return;

  try {
    const { data, error } = await auth.getSession();
    if (error) throw error;

    if (!data?.user) return;

    link.href = '/profile.html';
    link.setAttribute('aria-label', 'My profile');
    link.setAttribute('title', 'My profile');

    link.innerHTML = `
      <svg width="22" height="22"
           viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="1.8"
           stroke-linecap="round"
           stroke-linejoin="round"
           aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="9" r="3"/>
        <path d="M5.5 19a7 7 0 0 1 13 0"/>
      </svg>
    `;

    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';

    nickname.textContent = data.user.name || 'Logic Explorer';

    // The icon becomes a menu trigger while signed in.
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');

    link.addEventListener('click', event => {
      event.preventDefault();
      menu.hidden = !menu.hidden;
      link.setAttribute('aria-expanded', String(!menu.hidden));
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.header-account')) {
        menu.hidden = true;
        link.setAttribute('aria-expanded', 'false');
      }
    });

    signOut.addEventListener('click', async () => {
      signOut.disabled = true;

      try {
        const result = await auth.signOut();
        if (result?.error) throw result.error;
        window.location.assign('/');
      } catch (error) {
        console.error('Sign out failed:', error);
        signOut.disabled = false;
      }
    });

  } catch (error) {
    console.error('Unable to check session:', error);
  }
}

updateHeader();

}
start().catch(() => { const link = document.getElementById('header-auth-link'); if (link) link.title = 'Sign-in is unavailable. Please try again later.'; });
