// Public read-only community preview for the Prolog Made Easy static book.
(() => {
  'use strict';
  const mount = document.querySelector('[data-pme-community]');
  if (!mount) return;
  const id = mount.dataset.exerciseId;
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id || '')) return;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  mount.replaceChildren();
  const title = el('h2', '', 'Community discussion');
  const info = el('p', 'pme-community-muted', 'Questions, discoveries and feedback from fellow learners.');
  const stats = el('div', 'pme-community-stats', 'Loading comments and votes…');
  const commentsTitle = el('h3', '', 'Comments');
  const comments = el('div', 'pme-community-comments');
  const notice = el('p', 'pme-community-notice', 'Posting comments and voting will be enabled after sign-in is connected. Reading remains open to everyone.');
  mount.append(title, info, stats, commentsTitle, comments, notice);
  fetch(`/api/community?exercise=${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } })
    .then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    })
    .then(data => {
      stats.textContent = `Helpful votes: ${data.votes.up} · Needs improvement: ${data.votes.down}`;
      comments.replaceChildren();
      if (!data.comments.length) {
        comments.append(el('p', 'pme-community-muted', 'No published comments yet. Be the first when registration opens!'));
      }
      for (const item of data.comments) {
        const article = el('article', 'pme-community-comment');
        const byline = el('strong', '', item.nickname);
        const date = el('time', 'pme-community-muted', new Date(item.created_at).toLocaleDateString());
        date.dateTime = item.created_at;
        const body = el('p', '', item.content); // textContent, not innerHTML: safe from XSS
        article.append(byline, date, body);
        comments.append(article);
      }
      if (data.hasMore) comments.append(el('p', 'pme-community-muted', 'Showing the 30 most recent comments.'));
    })
    .catch(error => { stats.textContent = `Community is not available yet: ${error.message}`; comments.replaceChildren(); });
})();
