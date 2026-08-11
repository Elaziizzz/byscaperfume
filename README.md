# Karya Bahan - POS & Bookkeeping App

A production-ready full-stack bookkeeping web application designed specifically for the **Karya Bahan** material store. Built with Next.js (App Router), Tailwind CSS, and Supabase. Features a strict minimalist Swiss-style design and real-time inventory updates.

## 🚀 Quick Start

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/01_initial_schema.sql` from this repository and run the entire script in the SQL Editor. This will create the `materials` and `transactions` tables, the inventory reduction trigger, and insert dummy data.
4. Go to **Project Settings > API** to find your URL and Anon Key.

### 2. Environment Variables

Rename `.env.local.example` to `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

Install dependencies if you haven't already:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🛠 Features

- **POS Dashboard**: Select materials, input quantities, and instantly submit transactions.
- **Automated Inventory**: Supabase triggers automatically deduct material stock upon a new transaction.
- **Real-time Sync**: The dashboard subscribes to database changes and updates stock and transaction tables instantly without page reloads.
- **Export Data**: Go to the Reports page to export transaction history to PDF (via `jspdf`) and Excel (via `xlsx`).
- **Swiss Style UI**: A strict monochrome color palette, grid-based layout, and sharp typography.
