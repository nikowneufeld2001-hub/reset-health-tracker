# Reset Health Tracker PWA

This folder is ready to host as a simple Progressive Web App.

## Files

- `index.html` is the app.
- `manifest.webmanifest` makes it installable.
- `sw.js` caches the app shell after it is opened from a hosted URL.
- `icons/` contains the Home Screen icons.
- `.nojekyll` tells GitHub Pages to serve files as-is.
- `README.md` includes the copyright notice.

## iPhone Install

1. Host the `outputs` folder on an HTTPS static host.
2. Open the hosted URL in Safari on your iPhone.
3. Tap Share.
4. Tap Add to Home Screen.
5. Open Reset from the Home Screen icon.

## Good Hosting Options

- Netlify Drop: drag the `outputs` folder into Netlify Drop.
- Vercel static project: deploy the folder as static output.
- GitHub Pages: publish these files from a repo.

The AI photo/food tracker will need a backend API route later so your OpenAI API key is not exposed in browser code.
