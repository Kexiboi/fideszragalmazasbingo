# Fidesz rágalmazás bingo

Next.js + Postgres + NextAuth. A játék a közös, admin által jóváhagyott mezőkből épít véletlen 5×5 kiosztásokat.

## Docker (egy parancs)

A repo gyökerében:

```bash
docker compose up -d --build
```

Ez elindítja a Postgres 16-ot és a Next alkalmazást. Első (és minden új séma) indításkor a `web` konténer lefuttatja a `prisma migrate deploy`-ot és a seedet, majd elindítja a szervert.

**Kód változott a gépeden?** A konténerbe beépített build kerül; frissítéshez **mindig** futtasd újra a fenti parancsot (`--build`). A sima `docker compose up -d` önmagában nem másolja be az új TS/React kódot — ezért nem érzed „ráfrissítésre” a változást.

- **Alkalmazás:** [http://localhost:3000](http://localhost:3000)
- **Adatbázis (hostról):** `localhost:5432`, felhasználó / jelszó / DB: `postgres` / `postgres` / `bingo`

**Admin belépés (alapértelmezett env a compose-ban):** `ADMIN_EMAIL` / `ADMIN_PASSWORD` — éles előtt állítsd `.env`-ben vagy a compose `environment` részében. Érdemes a `.env.example` alapján létrehozni egy `.env` fájlt (legalább `AUTH_SECRET`).

**Leállítás:** `docker compose down` — adat megmarad a `pgdata` köteten. **Minden törlése:** `docker compose down -v`.

**NPM scriptek:** `npm run docker:up` / `npm run docker:down` / `npm run docker:build` ugyanez, röviden.

## Fejlesztés (Node helyben)

1. Postgres fusson (pl. ugyanez a compose csak a `db` szolgáltatással, vagy saját instance).
2. `DATABASE_URL` a `.env`-ben (lásd `.env.example`).
3. `npm ci` → `npx prisma migrate dev` → `npm run dev`.

## További

- API és szerepkörök: `AGENTS.md` / projekt fájlok.
- `docker-compose.yml` és `Dockerfile` a gyökérben; a `web` image a build során futtatja a production buildet.
