# Steam Auction MVP Plan

## Ziel
Ein schneller, klarer Flow: Steam-Login -> Freunde auswählen -> gemeinsame Spiele -> Pool -> Zufallspick.
Der Nutzer soll in wenigen Minuten zum Ergebnis kommen, ohne sich durch Settings zu klicken.

## Nutzerrollen
- **Spieler (Owner)**: loggt sich per Steam ein, verwaltet Freunde, erstellt Pools.
- **Freund**: wird über Steam-Id geladen/gespeichert, dient als Vergleichspartner.

## Kern-User-Flow (Happy Path)
1. Nutzer öffnet `/dashboard` und meldet sich mit Steam an.
2. App lädt eigene Games + öffentliche Freundesliste.
3. Nutzer wählt 1+ Freunde aus.
4. App lädt gemeinsame Games (Intersection).
5. Nutzer erstellt einen Pool und seedet die gemeinsamen Games.
6. Nutzer startet den Pick (optional "Avoid repeats").

## UI-Struktur (Dashboard)
1. **Status & Login**
   - Status: Login, Steam-Id, Zähler (eigene/ Freunde/ gemeinsame).
   - Primary CTA: "Meine Spiele laden".
2. **Freunde**
   - Steam-Freunde laden (öffentlich).
   - Freunde filtern, auswählen, löschen.
   - Leere Zustände mit klaren Hinweisen.
3. **Gemeinsame Spiele**
   - Intersection-Liste, Tag-Filter.
   - Hinweise zu Privacy/Fehlern.
4. **Pool & Pick**
   - Pool erstellen, gemeinsame Games hinzufügen.
   - Pick-Modus: "Pure" oder "Avoid repeats" + Anzahl.
   - Wheel-Animation + Ergebnis-Karte.
5. **Inline-Hilfe**
   - Kurzer "So funktioniert's"-Block mit Steps.

## Tutorial (Guided Tour)
Step-Reihenfolge:
1. **Welcome** – kurzer Überblick.
2. **Steam Login** – CTA zum Login.
3. **Load Friends** – Button zum Laden der Friends.
4. **Choose Friends** – Liste mit Checkboxen.
5. **Load Shared Games** – Button für Intersection.
6. **Create Pool** – Pool-CTA.
7. **Add Shared Games** – Pool seeden.
8. **Pick** – Wheel Center Button.

Zusätze:
- "Tips" Button öffnet die Tour jederzeit.
- "Don't show again" als Toggle.
- Fokus-Overlay und Scroll-to-Target.

## Logik & Datenfluss
- **Login**: `/api/auth/steam` → OpenID → Cookie `steam_user_id`.
- **User**: `/api/me` liefert User aus Prisma.
- **Freunde**:
  - `/api/steam/friends` liefert Steam-Friends.
  - `/api/friends/bulk` speichert sie lokal.
- **Games**:
  - `/api/steam/owned-games` lädt eigene/ Freunde-Games.
  - Intersection wird clientseitig berechnet.
  - `/api/steam/app-details` liefert Tags.
- **Pools**:
  - `/api/pools` erstellt Pool.
  - `/api/pools/:id/games` speichert Pool-Games (mit Filter auf verbotene Worte).
  - `/api/pools/:id/pick` wählt gewichtet + optional "avoid recent picks".

## Fehlerfälle & UX
- Steam-Profile privat → Hinweis + Callout.
- Keine Freunde → leeres State mit Anleitung.
- Keine gemeinsamen Games → erklärter Hinweis, CTA.
- Pool leer → Button disabled + erklärter Hinweis.

## Nicht-Ziele (MVP)
- Multi-User Pool Sharing in Echtzeit.
- Komplexe Rechteverwaltung.
- Persistent Ranking/Badges.

## Zukunft
- Mehrere Freunde gleichzeitig in Pools.
- Weighting anhand Playtime/Tag-Priorität.
- öffentliche Pool-Links + Sharing.
