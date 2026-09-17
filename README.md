# Driver Time Log

A simple mobile-friendly app for drivers to log shifts, add notes/tags, export time data, and review daily/weekly totals.

## Features
- Email sign-up and login
- Start/stop driver timer
- Manual date/time entries
- Daily and weekly reports
- Notes and tags on each entry
- CSV export
- Mobile-ready interface
- Local storage for demo use (no backend required)

## Run locally
Because this is a static front-end app, you can run it without installing dependencies.

Option 1: Open `index.html` directly in a browser.

Option 2: Use a local server:

```bash
cd driver-time-tracker
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes
- This version stores user accounts and entries in the browser using `localStorage`, so data stays on the device.
- If you want, the next step can be adding a real backend with Supabase or Firebase for multi-device syncing and secure authentication.
