# 急切的食欲 · An Urgency of Appetite

A private companion site for a Call of Cthulhu TRPG group, themed after the aesthetics of *Cultist Simulator*.

Built with vanilla HTML/CSS/JS and Firebase (Firestore + Storage) — no build step, no framework, no server.

## Project Structure

```
├── index.html    # HTML structure and layout
├── styles.css    # All styles, theme variables, responsive breakpoints
├── app.js        # Application logic, Firebase ops, rendering
└── README.md
```

## Features

### Module Archive
Browse the group's completed and ongoing CoC modules. Each module displays its name, description, Keeper (守秘人/KP), and article count. Click into a module to see session write-ups displayed as compact cards with thumbnails and excerpts; click any card to open a full-screen reader overlay.

### Per-Article Comments
Every article has its own comment thread. Logged-in users can post and delete comments directly within the article reader.

### Investigator Files
Member profiles with custom avatars, bios, and a role tag drawn from Cultist Simulator lore (Lantern, Grail, Knock, etc.). Each member's character sheets are accessible from their profile card.

### Character Sheets
Full CoC-style character sheets with eight core stats (STR, DEX, POW, CON, APP, EDU, SIZ, INT), a backstory section, and a module tag indicating which scenario the character belongs to. Stats are displayed with animated bars.

### Guest Book
A guestbook open to both members and anonymous visitors. Guests can leave a nickname and message; members see a streamlined posting interface.

### Theme Switcher
Four color themes inspired by Cultist Simulator's Hours, selectable from a floating button in the bottom-right corner:

- **灯 · Lantern** — warm gold (default)
- **杯 · Grail** — deep crimson
- **启 · Knock** — dark violet
- **冬 · Winter** — cold blue

Theme preference persists via localStorage.

### Other Details
- Chinese body text uses LXGW WenKai (霞鹜文楷) for a handwritten, narrative feel
- Display headings use Cinzel + Noto Serif SC
- Fully responsive layout with mobile hamburger nav
- Smooth scroll, fade-in animations, and loading screen

## Authentication

This site uses a **closed, invite-only login system**. There are a small number of pre-set admin accounts for the group's members. **Public registration is not available.** Visitors can freely browse all content and leave guestbook messages, but posting comments and managing content requires a member login.

## Tech Stack

- **Frontend:** Vanilla HTML / CSS / JS (no dependencies)
- **Backend:** Firebase Firestore (database) + Firebase Storage (images)
- **Fonts:** Google Fonts (Cinzel, Cormorant Garamond, Noto Serif SC, Noto Sans SC, LXGW WenKai TC)
- **Hosting:** Any static file host (Firebase Hosting, GitHub Pages, Netlify, etc.)

## Deployment

1. Place `index.html`, `styles.css`, and `app.js` in the same directory on any static hosting service.
2. Ensure the Firebase project credentials in `app.js` point to your own Firestore instance.
3. That's it. No build, no install.

## License

This is a personal project for a private TRPG group. Code is provided as-is.
