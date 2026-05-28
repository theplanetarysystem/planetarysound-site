// Hostname-based routing for the planetarysound.com Cloudflare Pages project.
//
// rental.planetarysound.com/  → serves /rental.html (browser URL stays clean)
// Everything else            → normal static asset serving (index.html, /styles.css, /assets/*, etc.)
//
// This runs as Cloudflare Pages middleware on every request. It's used here
// instead of `_redirects` because CF Pages' _redirects file doesn't reliably
// support hostname-source rewrites with status 200.

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'rental.planetarysound.com') {
    // Serve the rentals page on the subdomain root.
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const rewriteUrl = new URL(url);
      rewriteUrl.pathname = '/rental.html';
      return context.next(rewriteUrl.toString());
    }
  }

  return context.next();
}
