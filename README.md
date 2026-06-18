# SiBanjir Palembang — Frontend

Antarmuka web **Sistem Informasi Banjir Kota Palembang** — platform pelaporan dan pemantauan banjir berbasis peta untuk warga dan admin.

## Tech Stack

| Layer         | Teknologi               |
| ------------- | ----------------------- |
| Framework     | Next.js 15 (App Router) |
| UI            | React 19 + TypeScript   |
| Styling       | Tailwind CSS 3          |
| Maps          | Leaflet + React-Leaflet |
| Icons         | Lucide React            |
| UI Components | Headless UI             |
| Notifications | React Hot Toast         |

## Fitur Utama

### Halaman Publik

- **Landing Page** — Informasi umum SiBanjir
- **Login / Register** — Autentikasi pengguna

### Dashboard User `(app)`

- **Dashboard** — Ringkasan kondisi banjir terkini
- **Peta Banjir** — Visualisasi laporan banjir di peta interaktif (Leaflet)
- **Buat Laporan** — Form pelaporan banjir dengan map picker lokasi
- **Daftar Laporan** — Browse & detail laporan
- **Rute Aman** — Peta navigasi rute aman menghindari banjir
- **Cuaca** — Informasi cuaca terkini
- **Notifikasi** — Notifikasi real-time
- **Profil** — Manajemen akun pengguna

### Dashboard Admin `(admin)`

- **Admin Panel** — Kelola laporan, user, dan data kecamatan

## Struktur Direktori

```
sibanjir-fe/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   ├── login/              # Halaman login
│   │   ├── register/           # Halaman register
│   │   ├── (app)/              # Route group: user dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── buat-laporan/   # Buat laporan baru
│   │   │   ├── laporan/        # Daftar & detail laporan
│   │   │   ├── rute/           # Rute aman
│   │   │   ├── cuaca/          # Info cuaca
│   │   │   ├── notifikasi/
│   │   │   └── profil/
│   │   └── (admin)/            # Route group: admin dashboard
│   │       ├── layout.tsx
│   │       └── admin/
│   ├── components/
│   │   ├── AppShell.tsx        # User app shell
│   │   ├── AdminAppShell.tsx   # Admin app shell
│   │   ├── Sidebar.tsx         # User sidebar navigation
│   │   ├── AdminSidebar.tsx    # Admin sidebar
│   │   ├── TopBar.tsx          # Top navigation bar
│   │   ├── BottomNav.tsx       # Mobile bottom nav
│   │   ├── AdminBottomNav.tsx  # Admin mobile bottom nav
│   │   ├── DashboardMap*.tsx   # Komponen peta dashboard
│   │   ├── SafeRouteMap*.tsx   # Komponen peta rute aman
│   │   ├── MapPicker*.tsx      # Map picker untuk form
│   │   ├── Providers.tsx       # Context providers
│   │   └── ui/                 # Reusable UI components
│   └── lib/                    # Utilities & API helpers
├── public/
├── next.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## Setup & Development

### Prerequisites

- Node.js ≥ 18
- Backend API running (`sibanjir-be` di port 3001)

### Instalasi

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Atau buat manual:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Scripts

| Command         | Deskripsi          |
| --------------- | ------------------ |
| `npm run dev`   | Development server |
| `npm run build` | Production build   |
| `npm start`     | Production server  |
| `npm run lint`  | ESLint check       |

## Koneksi dengan Backend

Frontend terhubung ke `sibanjir-be` via REST API. Pastikan:

1. Backend berjalan di `http://localhost:3001` (atau sesuai `NEXT_PUBLIC_API_URL`)
2. CORS sudah dikonfigurasi di backend
3. Image remotePatterns sudah set untuk `localhost:3001/uploads`

## License

Private — SiBanjir Palembang
