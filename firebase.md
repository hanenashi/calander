# Firebase project

Calander uses the existing Firebase project `pocitatko-7541f`, whose previous Pociťátko experiment is retired. The project already has a free-tier-eligible `(default)` Cloud Firestore database in `europe-central2` and a Firebase Hosting site. A separate Firebase web app named `calander` is registered in that project.

The local `.env` holds the `calander` web app's client configuration. It is ignored by Git and must stay owner-readable. `.env.example` records names only. Do not commit real diary entries, photos, credentials, or exported backups.

`firebase.json` points Hosting target `calander` at the Vite `dist` build. This is the separate Hosting site `calander-7541f` (`https://calander-7541f.web.app`) in the same Firebase project; the old default Pociťátko site remains separate. Only the static diary app is deployed. No Firestore security rules or sync have been deployed from this repository. Before enabling remote sync, inspect any existing Firestore data and rules, add user-scoped rules and tests, and verify the deployed rules against the intended Auth flow. Do not use the retired Pociťátko web app registration for calander.

The Firestore database reports free-tier eligibility. On 2026-10-09 the Google Cloud Billing API reported billing disabled with no linked billing account for this project. Firebase Hosting's no-cost allowance is shared across sites in the project; see [Firebase pricing](https://firebase.google.com/pricing) for current limits.

Keep the first diary local-first in IndexedDB. If sync is added, use Firestore documents for diary entries and separate, compressed JPEG photo documents, checking each document against Firestore's 1 MiB limit. Backup/export and restore remain necessary even with cloud sync.
