# NTR Properties - North Town Residency Classified Ads Platform

Property classified ads platform specifically for North Town Residency housing society in Karachi, Pakistan.

## 🚀 Features

### Public Features
- Browse properties by Phase (1, 2, 4) and Blocks
- Filter by property type (Residential Plots, Commercial Shops)
- Filter by listing type (For Sale, For Rent)
- Advanced filters (Corner, Road Facing, Park Facing, West Open)
- Search and sort listings
- View property details with image gallery
- PWA-enabled (installable on mobile)

### User Features (Authenticated)
- Phone OTP authentication
- Post property listings
- Manage own listings
- View listing status (Pending/Approved/Rejected)
- Edit pending listings
- Delete listings

### Admin Features
- Dashboard with statistics
- Approve/Reject listings with reasons
- Feature listings
- Block/Unblock users
- Manage phases and blocks
- Activity logs

### REST API (for Flutter App)
- Complete REST API endpoints
- Authentication support
- Pagination and filtering
- Image upload
- Full CRUD operations

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Authentication:** Phone OTP via Supabase
- **Storage:** Supabase Storage for images
- **Deployment:** Vercel (recommended)

## 📁 Project Structure

```
ntk/
├── app/
│   ├── (public)/              # Public pages
│   │   ├── page.tsx           # Landing page
│   │   └── listings/          # Listings pages
│   ├── auth/                  # Authentication
│   │   └── login/
│   ├── dashboard/             # User dashboard
│   │   ├── page.tsx           # My listings
│   │   ├── post/              # Post new listing
│   │   └── listings/[id]/edit/
│   ├── admin/                 # Admin panel
│   │   ├── page.tsx           # Dashboard
│   │   ├── listings/          # Manage listings
│   │   ├── users/             # Manage users
│   │   ├── settings/          # Phases & blocks
│   │   └── logs/              # Activity logs
│   └── api/v1/                # REST API
│       ├── phases/
│       ├── blocks/
│       ├── listings/
│       ├── upload/
│       └── user/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── admin/                 # Admin components
│   ├── header.tsx
│   ├── footer.tsx
│   └── property-card.tsx
├── lib/
│   ├── supabase/              # Supabase clients
│   ├── types.ts               # TypeScript types
│   └── utils.ts
└── scripts/                   # Database scripts
    ├── 001_create_tables.sql
    ├── 002_rls_policies_fixed.sql
    ├── 003_triggers.sql
    └── 004_seed_data.sql
```

## 🗄️ Database Schema

### Tables
- **profiles** - User profiles (extends auth.users)
- **phases** - NTR phases (Phase 1, 2, 4)
- **blocks** - Blocks within phases
- **listings** - Property listings
- **listing_images** - Property images
- **activity_logs** - Admin activity tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Twilio account (for SMS OTP)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ntk
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run SQL scripts in order:
     - `scripts/001_create_tables.sql`
     - `scripts/002_rls_policies_fixed.sql`
     - `scripts/003_triggers.sql`
     - `scripts/004_seed_data.sql`
     - `scripts/005_storage_setup.sql`
   - Configure Phone Auth in Supabase Dashboard
   - Add Twilio credentials in Supabase Auth settings

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📱 PWA Setup

The app is PWA-enabled. To install:
- On mobile: Tap "Add to Home Screen"
- On desktop: Click install icon in address bar

## 🔐 Authentication

Phone OTP authentication flow:
1. User enters Pakistani phone number
2. Supabase sends OTP via Twilio
3. User enters 6-digit OTP
4. Profile auto-created via database trigger

## 👨‍💼 Admin Access

To make a user admin:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE phone = '+923001234567';
```

## 🌐 REST API

Complete REST API documentation available in `API_DOCUMENTATION.md`

Base URL: `/api/v1`

Key endpoints:
- `GET /phases` - List phases
- `GET /blocks` - List blocks
- `GET /listings` - List listings (with filters)
- `POST /listings` - Create listing (auth required)
- `POST /upload` - Upload image (auth required)

## 🎨 Customization

### Colors
Edit `app/globals.css` to customize theme colors.

### NTR Data
Update phases and blocks in `scripts/004_seed_data.sql`

## 📦 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Build command: `npm run build`
- Start command: `npm start`

## 🔧 Troubleshooting

### RLS Policy Error
If you see "infinite recursion detected in policy for relation 'profiles'":
- Run `scripts/002_rls_policies_fixed.sql` to fix

### Phone Auth Not Working
- Check Twilio credentials in Supabase
- Verify phone number format (+92XXXXXXXXXX)
- Check Supabase Auth logs

### Images Not Uploading
- Verify storage bucket exists: `property-images`
- Check RLS policies on storage bucket
- Ensure file size < 5MB

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ for North Town Residency, Karachi
