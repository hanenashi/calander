# Kalendář

První verze českého rodinného diáře podle [battleplanu](battleplan.md). Otevře aktuální týden; na počítači ukáže všech sedm dní a stránku pro týdenní poznámky, na telefonu jednotlivé dny.

## Spuštění

```sh
npm ci
npm run dev
```

Otevřete adresu vypsanou Vite. Produkční sestavu ověříte příkazy `npm test` a `npm run build`; `npm run preview` ji spustí lokálně.

## Co už funguje

- Psaní do každého dne a do týdenních poznámek, čtyři barvy pera a nastavitelná velikost písma.
- Automatické ukládání do IndexedDB v tomto prohlížeči; aplikace po načtení funguje i offline.
- Fotografie JPEG, PNG a WebP se před uložením převedou na JPEG do 320 kB.
- Předchozí/další týden, návrat na dnešek, přidání a odebrání poznámek a fotografií s možností vrátit odebrání.
- Tisk aktuálního týdne na jednu stránku A4 na šířku.
- **Více → Stáhnout zálohu** vytvoří ZIP s textem a fotografiemi. **Více → Obnovit zálohu** ho načte na jiném zařízení; u týdne ponechá novější místní verzi.

## Důležité pro data

V této verzi se zápisy **nesynchronizují mezi zařízeními**. Jsou uložené jen v prohlížeči, kde vznikly. Před vymazáním dat prohlížeče, změnou zařízení nebo delším používáním stáhněte zálohu ZIP a uschovejte ji mimo zařízení. Režim anonymního prohlížení není vhodný.

Firebase konfigurace v `.env` je připravená pro pozdější synchronizaci, ale aplikace ji zatím nepoužívá. Nasazení na Firebase Hosting samo o sobě zápisy do cloudu neukládá. Podrobnosti jsou ve [firebase.md](firebase.md).

## Hosting

Statická aplikace je připravená pro Firebase Hosting v projektu `pocitatko-7541f`. Po kontrole projektu a schválení zveřejnění:

```sh
npm run build
firebase deploy --only hosting --project pocitatko-7541f
```

Hosting podává pouze soubory z `dist`. Původní referenční fotografie z `assets/` se do sestavy nezahrnuje.
