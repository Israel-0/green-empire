# 🌿 Green Empire

Idle/incremental game where you build a cannabis growing empire. Plant, grow, harvest, sell, hire staff, upgrade equipment, and expand your operation — fully automated once you scale up.

## 🚀 Quick Start

```bash
git clone https://github.com/Israel-0/green-empire.git
cd green-empire
npm install
cp server/.env.example server/.env
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:5173`, register, and start growing.

> **Test accounts (dev only):** `player` / `player1` (normal) and `admin` / `test123` (maxed out). Only seeded in development mode.

---

## 🎮 Gameplay

### 🌱 Cultivation
Plant seeds in your grow space. Water, light, and nutrients decay over time. Keep them healthy to maximize quality. Each strain has different grow time, yield, and base value.

### 🧬 Strains (11 total)
| Strain | Level | Time | Value/unit | Yield |
|---|---|---|---|---|
| Ditch Weed | 1 | 5m | $5 | 1 |
| Skunk #1 | 2 | 10m | $10 | 2 |
| Purple Haze | 5 | 15m | $16 | 3 |
| Northern Lights | 8 | 30m | $35 | 4 |
| OG Kush | 12 | 1h | $100 | 4 |
| White Widow | 18 | 1h 40m | $200 | 5 |
| Girl Scout Cookies | 25 | 3h 20m | $500 | 6 |
| Jack Herer | 35 | 5h | $1,000 | 7 |
| Amnesia Haze | 50 | 7h | $2,000 | 8 |
| Blue Dream | 70 | 10h | $5,000 | 9 |
| God's Gift | 100 | 15h | $15,000 | 10 |

Progression is exponential: each new strain earns 40-120% more per hour than the previous one. God's Gift yields **$150,000 per plant**.

### ⭐ Quality Tiers (8 levels)
| Tier | Min Quality | Multiplier |
|---|---|---|
| Mala | 0% | ×0.5 |
| Regular | 30% | ×0.8 |
| Normal | 50% | ×1.0 |
| Buena | 65% | ×1.3 |
| Excelente | 75% | ×1.7 |
| Premium | 85% | ×2.5 |
| Legendaria | 93% | ×4.0 |
| Yerbón | 98% | ×8.0 |

Quality depends on care, luck, and researcher bonuses. Yerbóns (98%+) are the holy grail.

### 📈 Market
Prices refresh every 10 minutes with pseudo-random jumps based on volatility:
- **Early game strains**: low volatility, stable prices
- **Mid game strains**: medium volatility, worth waiting for good prices  
- **Late game strains**: high volatility — God's Gift can swing from $6,000 to $24,000

### 🏆 Reputation
Earned by selling. Unlocks better sell methods:
- **Local** (0 rep): ×1.0 price, 5% risk
- **Camello** (15 rep): ×1.4 price, 15% risk
- **Darknet** (40 rep): ×1.8 price, 30% risk
- **Export** (75 rep): ×2.5 price, 50% risk

Reputation gives a direct price bonus: `× (1 + rep/100)`. At 100 rep you sell at double price.

### 👥 Staff (4 types, 5 levels each)
| Type | Effect | Auto? |
|---|---|---|
| 🌱 Gardener | Keeps plants watered, Lv3+ auto-harvest + auto-plant | ✅ |
| 🤝 Dealer | Sells inventory automatically on cooldown | ✅ |
| 🛡️ Security | Reduces raid risk, refunds on fines | Passive |
| 🔬 Researcher | Increases quality & growth speed | Passive |

Salaries are paid every 30 minutes. Staff auto-fires if you can't afford them.

### 🔧 Equipment (4 types, 5 levels)
| Equipment | Effect |
|---|---|
| 💡 Lights | Growth speed (+10%→+100%) |
| 💧 Irrigation | Decay reduction (−15%→−75%) |
| 🌀 Ventilation | Pest resistance + health protection |
| 🛡️ Security | Raid risk reduction (−0→−40 pts) |

### 📦 Expansion
Grow spaces scale from `Armario` (2 plants) to `Invernadero` (50 plants).

### 🐛 Pests
Triggered by low health. Treatment costs 30% of the strain's base value. Cure them before quality plummets.

### 🏅 Achievements
37 achievements across 12 categories: Harvest, Quality, Money, Level, Strains, Sales, Staff, Expansion, Market, Pests, Risk, Misc. Toast notifications on unlock.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Client | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion |
| Server | Express, Prisma ORM, SQLite, JWT auth, bcrypt |
| Security | Helmet, CORS, rate limiting |
| Audio | Web Audio API for care/harvest sounds |

---

## 📁 Project Structure

```
green-empire/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── garden/        # PlantGrid, PlantCard
│       │   ├── market/        # InventoryPanel, MarketPanel
│       │   ├── shop/          # SeedShop
│       │   ├── staff/         # StaffPanel
│       │   ├── expansion/     # ExpansionPanel
│       │   ├── stats/         # StatsPanel (achievements)
│       │   ├── events/        # EventLog
│       │   ├── layout/        # Header, Sidebar, GameLayout
│       │   └── ui/            # ProgressBar, Timer, Tooltip
│       ├── pages/             # Login, Register, GamePage
│       ├── store/             # Zustand game store
│       ├── services/          # API client
│       ├── utils/             # Formatting, quality, sounds
│       └── types/             # TypeScript interfaces
├── server/                    # Express backend
│   └── src/
│       ├── routes/            # auth, game, plants, market, shop, staff, expansion, events
│       ├── services/          # plantGrowth, economy, eventEngine
│       └── middleware/        # auth JWT
├── shared/                    # Shared types
├── .env.example               # Environment template
└── docker-compose.yml         # Optional PostgreSQL
```

---

## 🚢 Deploy to Railway

1. Push this repo to GitHub
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub → select your repo
3. Add a **volume** — mount path `/data`, 1 GB (for SQLite persistence)
4. Set these environment variables in Railway:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate a long random string>
   PORT=3001
   ```
5. **Build command:** `npm install && npm -w client run build`
6. **Start command:** `npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm start`
7. Deploy! Your game is live at the Railway URL 🎉

> Railway supports SQLite with persistent volumes. No PostgreSQL needed. The `DATABASE_URL` defaults to `file:./data/prod.db` — the volume at `/data` ensures data survives restarts.

---

## 🧪 Dev Notes

- DB is SQLite (`server/prisma/dev.db`) — force-reset during development
- Test accounts auto-created in development mode (`NODE_ENV !== 'production'`)
- Vite dev server on `:5173` proxies `/api` to Express on `:3001`
- `npm run db:studio` opens Prisma Studio for DB inspection

---

## 📄 License

MIT
