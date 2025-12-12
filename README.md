# 🍗 Ayam Geprek Pak Gondes — POS System
![MIT License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3ECF8E)

A simple and modern **Point of Sale (POS)** web application built with **Next.js** and **Supabase** for small restaurants and food stalls.

This project demonstrates **full-stack development**, **authentication**, **server-side API handling**, and a **real POS ordering flow**.

---

## 🚀 Tech Stack

- **Next.js** (App Router)
- **Supabase**
  - Authentication
  - PostgreSQL
  - Row Level Security (RLS)
- **Tailwind CSS**

---

## ✨ Features

- Login using email & password
- Dine In, Take Away, and Online Orders
- Table-based ordering (with active / non-active toggle)
- Draft order (auto save)
- Checkout & payment
- Daily transaction summary
- Simple cashier security
  - Manual lock
  - Auto lock (idle timeout)
  - Optional PIN lock

---

## 🔄 Order Flow

Create Order → Draft → Checkout → Completed

- Orders are saved as **draft** while customer is ordering
- Draft prevents data loss on refresh or accidental close
- Completed orders are **locked** and counted as transactions

---

## 🔐 Security Design

- Authentication handled by **Supabase Auth**
- Protected routes for cashier & dashboard
- **Row Level Security (RLS)** enabled on database tables
- **Service Role Key** used **only on server-side API routes**
- Optional PIN lock to prevent unattended POS access

> ⚠️ **Important:**  
> Supabase **Service Role Key is NEVER exposed to client-side code**.  
> It is used only inside Next.js **server routes (`/app/api`)**.

---

## ⚙️ Environment Variables

Create `.env.local`:

```env
# Supabase public credentials (SAFE for client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase server-side credential (DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/meichilla/Ayam-Geprek-POS.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your environment variables:

   ```env
   # Supabase public credentials (SAFE for client)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Supabase server-side credential (DO NOT expose to client)
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser. 

---

## 📌 Notes

Built as a real-world POS practice project
Suitable for small restaurant / UMKM
Focused on: Simplicity, Usability, Data safety, Real cashier workflow
Not intended for large-scale commercial use

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.