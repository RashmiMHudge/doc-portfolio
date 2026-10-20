# Doctor Website

React + Vite doctor profile website with Firebase-ready appointments, admin login, appointment management, and Firebase Hosting configuration.

## Local Setup

```bash
npm install
npm run dev
```

Open the local Vite URL, usually `http://localhost:5173`.

## Replace Client Details

Edit `src/data/doctor.js` with the real doctor name, contact number, WhatsApp number, email, clinic address, Google Maps URL, and credentials.

Update `index.html`, `public/robots.txt`, and `public/sitemap.xml` with the final production domain before launch.

## Firebase Setup

1. Create the Firebase project under the client-owned Google account.
2. Enable Firestore Database.
3. Enable Authentication with Email/Password.
4. Register a Firebase Web App.
5. Copy `.env.example` to `.env` and fill in the Firebase web config.
6. Create an admin user in Firebase Authentication.
7. Add a Firestore document at `admins/{ADMIN_UID}` for the admin account.
8. Deploy Firestore rules.

## Commands

```bash
npm run build
npm run preview
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

For React Router direct page refreshes, `firebase.json` already rewrites all routes to `/index.html`.

## Important Notes

- Do not commit `.env`, service-account files, private keys, or passwords.
- The appointment form stores basic scheduling details only.
- Public users can create appointment requests, but cannot read or update them.
- Admin access is enforced by Firestore rules, not only by the React route.
