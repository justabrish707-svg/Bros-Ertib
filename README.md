# Bro's እርጥብ — Arba Minch Luxury Food

A premium food ordering web app for **Bro's እርጥብ**, the legendary restaurant in Arba Minch, Ethiopia.  
Built with **React + TypeScript + Vite + Firebase**.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Backend URL — where server.ts is hosted (for Telegram + Stripe/Chapa payments)
# Leave empty if running everything locally via Vite dev server proxy
VITE_API_URL=https://your-backend-url.com

# Admin access — comma-separated authorized Google emails
VITE_ADMIN_EMAILS=admin@gmail.com

# Backend secrets (server.ts only — NOT exposed to browser)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CHAPA_SECRET_KEY=
```

> ⚠️ **Never commit `.env` to git.** It is already in `.gitignore`.

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx   # Admin layout + login
│   │   ├── OrdersTab.tsx        # Order management
│   │   ├── ProductsTab.tsx      # Product CRUD
│   │   └── AnalyticsTab.tsx     # Charts & stats
│   ├── Header.tsx
│   ├── HeroSection.tsx
│   ├── StorySection.tsx
│   ├── ReviewsSection.tsx
│   ├── MenuSection.tsx
│   ├── GallerySection.tsx
│   ├── ContactSection.tsx
│   ├── Footer.tsx
│   └── OrderModal.tsx
├── hooks/
│   ├── useAuth.ts               # Firebase auth listener
│   ├── useProducts.ts           # Firestore products + seeding
│   └── useOrders.ts             # Firestore orders (admin only)
├── utils/
│   ├── api.ts                   # Telegram notification helper
│   └── uploadImage.ts           # Canvas-based image compression
├── types/
│   └── index.ts                 # Shared TypeScript interfaces
├── App.tsx                      # Lean orchestrator (~140 lines)
├── firebase.ts                  # Firebase init & re-exports
└── translations.ts              # EN/AM i18n strings
```

---

## 🔐 Accessing Admin

1. Double-click the **BRO'S እርጥብ** logo in the header, or click the dashboard icon.
2. Sign in with an authorized Google account (set `VITE_ADMIN_EMAILS` in `.env`).
3. Manage orders, products, and view analytics.

---

## 🚢 Deployment

### Frontend → Vercel
```bash
# Set all VITE_* env vars in Vercel dashboard
vercel deploy
```

### Backend (`server.ts`) → Any Node host
```bash
# Run server with tsx in production or build it manually
npx tsx server.ts
# Set TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, STRIPE_*, CHAPA_* as env vars
```

### Firebase
```bash
firebase deploy         # deploys Firestore rules + indexes
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `firebase` | Auth, Firestore, Storage |
| `react` + `vite` | UI framework + build tool |
| `motion` | Framer Motion animations |
| `recharts` | Analytics charts |
| `lucide-react` | Icons |
| `express` | Backend server (payments + Telegram) |
| `stripe` | International card payments |

---

## 🧑‍💻 Made with ❤️ in Arba Minch
