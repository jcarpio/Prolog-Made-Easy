
import { createAuthClient } from '@neondatabase/auth';

const AUTH_URL =
  'https://ep-calm-mouse-bapjwd5s.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth';

const auth = createAuthClient(AUTH_URL);

async function updateHeader() {
  const link = document.getElementById('header-auth-link');
  if (!link) return;

  try {
    const { data, error } = await auth.getSession();

    if (error) throw error;
    if (!data?.user) return;

    link.href = '/profile.html';
    link.setAttribute('aria-label', 'My profile');
    link.setAttribute('title', 'My profile');

    // Use a simple inline SVG instead of an external icon library.
    link.innerHTML = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="9" r="3"/>
        <path d="M5.5 19a7 7 0 0 1 13 0"/>
      </svg>
    `;

    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    link.style.justifyContent = 'center';
  } catch (error) {
    console.warn('Unable to check sign-in status', error);
  }
}

updateHeader();

