# Sonder.fm

> **Connect. Share. Vibe.**

[Sonder.fm](https://sonder-fm.vercel.app/) is a soulful, open-source music identity platform where users log in with Spotify and get a unique, public page (like `/u/xa93b21c`) showing their currently playing song, poetic GPT-generated "vibe summary," profile info, and more. It's like **Linktree for Spotify** or **Letterboxd for Spotify** or **Tumblr for musical energy** — built for people who feel music deeply and want to express their identity through it and connect with others. It also features real-time listening rooms — like intimate, vibe-focused versions of Discord — where users can sync music, chat live, and share moods through tags like melancholy, euphoric, or nostalgic.

**→ [My Sonder.fm Profile](https://sonder-fm.vercel.app/u/fa5c84d9)**

---

## ✨ Features

- **Modern, Social & Fun:** A beautiful, modern experience designed for music lovers and social discovery.
- **Activity Feed:** ee what your friends are listening to, reacting to, and leaving vibe notes on.
- **Social Profiles:** Showcase your top tracks, artists, and playlists in a beautiful profile.
- **Live Now Playing:** Share your current vibe in real time with a live now playing status.
- **Reactions & Vibe Notes:** React to friends' music and leave vibe notes to share your thoughts.
- **Bookmarks:** Save your favorite moments in songs and revisit them anytime.
- **Listening Rooms:** Join or create real-time listening rooms to listen music together and vibe together with friends.
- **Room History & Export:** View your listening history in rooms and export playlists to Spotify with one click.
- **Open Source:** Explore and contribute on [GitHub](https://github.com/saalikmubeen/sonder.fm).

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
- [x] **Activity Feed:** See what your friends are listening to, reacting to, and leaving vibe notes on
- [x] **Social Profiles:** Unique public pages with display name, avatar, and now playing
- [x] **Live Now Playing:** Real-time song status, always fresh from Spotify or cached
- [] **Profile Themes:** Choose from pastel, grunge, sadcore, dark, and more
- [x] **Emoji Reactions & Vibe Notes:** React and leave anonymous or attributed messages
- [x] **Follow System:** Follow users, see their feed
- [x] **Bookmarks:** Save and revisit your favorite song moments
- [x] **Listening Rooms:** Real-time group listening and chat
- [x] **Room History & Export:** Export room listening history as Spotify playlists
- [ ] **Scheduled Rooms:** Schedule rooms to start at a specific time
- [x] **Web:** Next.js frontend
- [x] **Dark Mode & Themes:** Beautiful, accessible design for all moods
- [ ] **GPT-generated "vibe summary":** poetic summaries of your current song and profile.
- [ ] **Production-ready Mobile App:** Full-featured React Native app (coming soon)

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

### Security and Auth

Sonder.fm implements a robust, production-grade refresh token rotation system for maximum security:

- **Backend:**
  - Refresh tokens are AES-256 encrypted and stored securely in the database.
  - On every refresh, the old token is invalidated (rotated) and a new one is issued.
  - If a refresh token is leaked or reused, it is immediately invalidated, preventing replay attacks.
  - All sensitive operations use short-lived JWTs and long-lived, rotating refresh tokens.

- **Frontend:**
  - JWTs are stored in memory/localStorage and used for API requests.
  - When a JWT expires, the frontend automatically and silently requests a new one using the refresh token (silent refresh).
  - Only one refresh request is made at a time; all other requests are queued and retried after a successful refresh, ensuring seamless UX and preventing race conditions.
  - If refresh fails (e.g., token is invalid/expired), the user is securely logged out and all sensitive data is cleared.

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

![Sonder.fm Jam Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/jam_desktop.png?raw=true)

---

![Sonder.fm Dashboard Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/dashboard_desktop.png?raw=true)

---

![Sonder.fm Room Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/room_desktop.png?raw=true)

---

![Sonder.fm Export History Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/export_desktop.png?raw=true)

---

![Sonder.fm Profile Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/profile_desktop.png?raw=true)

---

![Sonder.fm Vibe Notes Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/vibe_desktop.png?raw=true)

---

![Sonder.fm Activity Feed Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/activity_desktop.png?raw=true)

---

![Sonder.fm Bookmarks Screenshot](https://github.com/saalikmubeen/sonder.fm/blob/main/screenshots/bookmarks_desktop.png?raw=true)

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

---

**GitHub:** [https://github.com/saalikmubeen/sonder.fm](https://github.com/saalikmubeen/sonder.fm)
