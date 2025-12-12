# 🍗 Ayam Geprek Pak Gondes — POS System
![MIT License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3ECF8E)


A simple and modern **Point of Sale (POS)** web application built with **Next.js** and **Supabase** for small restaurants and food stalls.

This project demonstrates **full-stack development**, **authentication**, and a **real POS ordering flow**.

---

## 🚀 Tech Stack

* **Next.js** (App Router)
* **Supabase** (Auth + PostgreSQL)
* Tailwind CSS

---

## ✨ Features

* Login using email & password
* Dine In, Take Away, and Online Orders
* Table-based ordering
* Draft order (auto save)
* Checkout & payment
* Daily transaction summary
* Simple cashier security (lock / auto lock)

---

## 🔄 Order Flow

```
Create Order → Draft → Checkout → Completed
```

* Orders are saved as **draft** while customer is ordering
* Draft prevents data loss on refresh or accidental close
* Completed order is locked and counted as transaction

---

## 🔐 Security

* Authentication handled by Supabase Auth
* Protected routes for cashier & dashboard
* Basic Row Level Security (RLS) to isolate user data
* Optional PIN lock to prevent unattended POS access

---

## ⚙️ Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Running Locally

1. Clone the repository

```bash
git clone <repo-url>
cd pos-ayam-geprek
```

2. Install dependencies

```bash
npm install
```

3. Create `.env.local` with your Supabase credentials

4. Run the development server

```bash
npm run dev
```

5. Open your browser:

```
http://localhost:3000
```

---

## 📌 Notes

* Built as a real-world POS practice project
* Suitable for small restaurant / UMKM
* Focused on simplicity and usability
