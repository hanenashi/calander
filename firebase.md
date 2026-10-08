# Firebase project

Calander uses the existing Firebase project `pocitatko-7541f`, whose previous Pociťátko experiment is retired. The project already has a free-tier-eligible `(default)` Cloud Firestore database in `europe-central2` and a Firebase Hosting site. A separate Firebase web app named `calander` is registered in that project.

The local `.env` holds the `calander` web app's client configuration. It is ignored by Git and must stay owner-readable. `.env.example` records names only. Do not commit real diary entries, photos, credentials, or exported backups.

`firebase.json` points Hosting at the Vite `dist` build. The first app is implemented locally, but no diary app or security rules have been deployed from this repository yet. Before enabling remote sync, inspect any existing Firestore data and rules, add user-scoped rules and tests, and verify the deployed rules against the intended Auth flow. Do not use the retired Pociťátko web app registration for calander.

The Firestore database reports free-tier eligibility. The project's overall Spark or Blaze billing plan has not been verified; check that in Firebase Console before relying on a no-billing setup.

Keep the first diary local-first in IndexedDB. If sync is added, use Firestore documents for diary entries and separate, compressed JPEG photo documents, checking each document against Firestore's 1 MiB limit. Backup/export and restore remain necessary even with cloud sync.
