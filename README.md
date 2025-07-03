# Sonder.fm


> **Connect. Share. Vibe.**

[Sonder.fm](https://sonder-fm.vercel.app/) is a soulful, open-source music identity platform where users log in with Spotify and get a unique, public page (like `/u/xa93b21c`) showing their currently playing song, poetic GPT-generated "vibe summary," profile info, and more. It's like **Letterboxd for Spotify** or **Tumblr for musical energy** — built for people who feel music deeply and want to express their identity through it.

---

## 🎯 Product Vision

[Sonder.fm](https://sonder-fm.vercel.app/) is an emotional mirror for music lovers. It's a place to:
- Show the world what your heart sounds like
- Express your musical identity with beautiful, themeable profiles
- Connect with friends, react, and leave anonymous "vibe notes"
- See what your friends are listening to in real time
- Enjoy a premium, emotionally alive UX inspired by Linktree, Spotify, Pinterest, and Letterboxd

---

## ✨ Features Checklist

- [x] **Spotify OAuth:** Secure login with Spotify, encrypted refresh tokens
- [ ] **Personalized Feed:** See what your friends are listening to
- [x] **Social Profiles:** Unique public pages with display name, avatar, and now playing
- [x] **Live Now Playing:** Real-time song status, always fresh from Spotify or cached
- [ ] **Profile Themes:** Choose from pastel, grunge, sadcore, dark, and more
- [ ] **Emoji Reactions & Vibe Notes:** React and leave anonymous messages
- [ ] **Follow System:** Follow users, see their feed
- [ ] **Reactions & Messaging:** Real-time chat and reactions via Socket.IO
- [x] **Bookmarks:** Save and revisit your favorite song moments
- [x] **Mobile & Web:** Next.js frontend, React Native app placeholder
- [x] **Dark Mode & Themes:** Beautiful, accessible design for all moods
- [ ] **Production-ready Mobile App:** Full-featured React Native app



---

## 🏗️ Monorepo Architecture

Built with industry-standard Turborepo-style setup:

```
sonder.fm/
├── apps/
│   ├── backend/      # Node.js/Express API, MongoDB, JWT Auth
│   ├── web/          # Next.js 14+ frontend (React, Tailwind, React Query)
│   └── mobile/       # React Native app (Expo)
├── packages/
│   ├── types/        # Shared TypeScript types (User, Message, etc.)
│   ├── ui/           # Shared React components
│   └── utils/        # Crypto, auth, Spotify, OpenAI helpers
```

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, MongoDB, Socket.IO
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Auth:** Spotify OAuth, AES-256 encrypted refresh tokens
- **Realtime:** Socket.IO for messaging and reactions
- **Monorepo:** TurboRepo, shared packages for types, UI, and utils
- **Mobile:** React Native app placeholder (future)

---

## 📦 Project Structure

```
/apps
  /web
    - pages/
    - components/
    - styles/
  /backend
    - routes/
    - models/
    - sockets/
    - scripts/
    - app.ts
  /mobile
    - (React Native app placeholder)
/packages
  /ui         → shared React components
  /utils      → crypto, auth, Spotify, OpenAI
  /types      → shared interfaces for User, Message, etc.
```

---

## 📝 Key Features & Endpoints

- **Spotify OAuth:** `/auth/login`, `/auth/callback` (secure, encrypted refresh tokens)
- **User Profiles:** `/u/:slug` (public, themeable, real-time now playing)
- **Feed:** `/feed/:slug` (see what your friends are listening to)
- **Reactions:** `/react/:slug` (emoji reactions)
- **Vibe Notes:** `/note/:slug` (anonymous messages)
- **Theme Picker:** `/theme/:slug` (choose your vibe)
- **Messaging:** Real-time chat via Socket.IO
- **Background Worker:** Refreshes now playing, updates GPT-4 vibe summaries

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn or npm
- MongoDB (local or cloud)
- Spotify Developer credentials
- OpenAI API key (for vibe summaries)

### 1. Clone the repo
```bash
git clone git@github.com:saalikmubeen/sonder.fm.git
cd sonder.fm
```

### 2. Install dependencies
```bash
yarn install
# or
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` in each app (`apps/web`, `apps/backend`, etc.) and fill in the required values (MongoDB URI, Spotify API keys, etc).

### 4. Run the backend
```bash
cd apps/backend
yarn dev
```

### 5. Run the web app
```bash
cd ../web
yarn dev
```

### 6. (Optional) Run the mobile app
```bash
cd ../mobile
yarn start
```

---

## 🖼️ Screenshots

> _TODO._

---

## 🤝 Contributing

We welcome contributions!

- Open an issue to discuss a feature or bug.
- Fork the repo and submit a pull request.
- All contributions, big or small, are appreciated!

---

## 📄 License

This project is [MIT licensed](LICENSE).

---

> _Sonder.fm is built with love for music and open source. Join us and help shape the future of social music!_