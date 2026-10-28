# Mela Rossa Restaurant & Cafe website

A one-page website for Mela Rossa, a family restaurant and cafe in Damietta, Egypt.
It uses plain HTML, CSS and vanilla JavaScript, with no build step and no libraries.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | Page structure: navbar with cart counter, hero, ticker, menu, about, gallery, booking form, footer, cart drawer, lightbox |
| `styles.css` | Brand colours and fonts in CSS variables, layout, image treatment, motion, reduced-motion rule |
| `main.js` | Menu data (`MENU`, `CURRENCY`), filters, cart, heading Snap-In, card tilt, magnetic buttons, ticker, lightbox, WhatsApp booking |

## Run it

Open `index.html` in a browser, or serve the folder with any static server.

## Brand

- Fonts: Playfair Display (headings), Inter (body), from Google Fonts
- Colours: dark `#121212`, red `#8B1E14`, green `#2E4F23`, white text
- Logo: red apple shaped like a coffee cup with steam and two green leaves (inline SVG `#logo-mark` in `index.html`)

## Confirmed details used

- Corniche branch: Nile Corniche, next to the Chamber of Commerce
- New Damietta branch
- Phone and WhatsApp: 01280060772 (bookings open `https://wa.me/201280060772`)
- Hours: daily, 10:00 AM to 11:00 PM
- Facebook: https://www.facebook.com/melarossa.eg
- Linktree: https://linktr.ee/Melarossa.eg

## Motion rules

- Only `transform` and `opacity` are animated.
- Two easings: `cubic-bezier(0.34,1.56,0.64,1)` (spring) and `cubic-bezier(0.16,1,0.3,1)` (fluid).
- IntersectionObserver triggers the heading reveals, and requestAnimationFrame drives the tilt, magnetic and ticker motion.
- `prefers-reduced-motion: reduce` turns all motion off.

## To replace before launch

- **Dishes and prices**: the four dishes in `MENU` (`main.js`) are placeholders.
- **Currency**: `CURRENCY` in `main.js` is a placeholder, so confirm it.
- **Photos**: every image is an Unsplash placeholder (marked with `PLACEHOLDER PHOTO` comments). Swap in real Mela Rossa photos and keep the `width`, `height`, `srcset` and `sizes` attributes.
- **Branch addresses**: add the full street address of the New Damietta branch, and more detail for the Corniche branch if wanted.
