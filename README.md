# Roots of Hope Foundation Website (WEDE5020)

Multi-page website for the fictional Roots of Hope Foundation, a Gauteng urban-farming NPO.
Student: Tshepelang Kalatile (ST10517249)

- **Live site:** `https://effulgent-horse-3ba0cf.netlify.app`
- **Repository:** `https://github.com/Tshepelang/Wede-part-3`

## Project structure

| Path | Purpose |
|---|---|
| `index.html`, `about.html`, `services.html`, `gallery.html`, `enquiry.html`, `contact.html` | The six main pages |
| `thank-you.html`, `404.html` | Form confirmation page and custom error page (both `noindex`) |
| `css/style.css` | One external stylesheet (reset, tokens, layout, components, responsive rules) |
| `js/main.js` | Nav toggle, scroll reveal, counters, accordion, tabs, modal, lightbox (jQuery) |
| `js/events.js` | Dynamic events list with search, filter and sort |
| `js/forms.js` | Form validation, enquiry cost/availability response, AJAX submit, contact email |
| `js/map.js` | Leaflet map with two garden locations |
| `js/vendor/`, `css/vendor/leaflet/` | jQuery 3.7.1 and Leaflet 1.9.4, stored locally |
| `images/` | Optimised images with descriptive file names |
| `robots.txt`, `sitemap.xml`, `_headers` | SEO and hosting configuration |
| `screenshots/` | Responsive test evidence (Part 2) and Part 3 feature evidence |

## Part 3 implementation

### 1. Functionality (JavaScript)

| Feature | Where | How it works |
|---|---|---|
| Accordion | `contact.html` FAQ | jQuery `slideToggle`; one panel open at a time; `aria-expanded` / `aria-controls` |
| Tabs | `enquiry.html` "Ways to Get Involved" | `role="tablist"`, arrow-key navigation, buttons pre-select the form option |
| Modal dialogs | Team bios, enquiry response, email preview | Native `<dialog>` (focus trap, Esc to close, backdrop click) |
| Interactive map | `contact.html` | Leaflet + OpenStreetMap, two markers with popups and directions links |
| Animations | All pages | CSS fade-in on scroll (IntersectionObserver), animated statistic counters, hover transitions; disabled for `prefers-reduced-motion` |
| DOM manipulation | `events.js`, `forms.js` | Event cards, form fields, errors and modal content are created with `createElement` / `textContent` |
| Gallery + lightbox | `gallery.html` | Click a photo to enlarge, arrow keys / buttons to navigate, Esc to close |
| Dynamic content | `services.html` | Upcoming events are rendered from a JavaScript data array (past dates are hidden automatically) |
| Search, filter, sort | `services.html` | Live text search, type and township filters, sort by date / name / places / price, result count announced with `aria-live` |

### 2. Search Engine Optimisation

**On-page SEO**

- **Keyword research:** target phrases were urban farming Johannesburg, community gardens Soweto, food security Gauteng, volunteer Johannesburg, sponsor a community garden, NPO Soweto. Each page targets one main phrase (see table).
- **Title tags and meta descriptions:** unique for every page, titles about 50-60 characters, descriptions about 150 characters.
- **Headings:** exactly one `<h1>` per page, then `<h2>` / `<h3>` in order.
- **Images:** descriptive file names (e.g. `urban-food-gardens.jpg`), meaningful `alt` text, `width` / `height` set, `loading="lazy"`. Part 2 images were embedded as base64 text; they are now real files.
- **URLs and internal linking:** the Part 2 single page with JavaScript "page switching" became five real pages with clean URLs (`about.html`, `services.html`...). Every page links to the others through the nav and footer, plus contextual links (e.g. programme cards link to `services.html#nutrition-education`). Link text is descriptive.
- **Mobile-friendliness:** viewport meta tag, three-tier responsive layout (see Part 2), tested at 390 px.
- **Structured data:** `NGO` schema (address, founder, contact details) on the home page and `FAQPage` schema on the contact page.
- **Social sharing:** Open Graph and Twitter Card tags on every page.

| Page | Main keyword |
|---|---|
| `index.html` | urban food gardens Gauteng |
| `about.html` | Soweto NPO / Roots of Hope story |
| `services.html` | nutrition education, youth development, community gardens |
| `enquiry.html` | volunteer / sponsor a community garden |
| `contact.html` | Roots of Hope Soweto contact |

**Off-page SEO (plan)**

- **Backlinks:** ask partners and sponsors, local Soweto/Alexandra community pages and Johannesburg NPO directories to link to the site. A sponsor logo/credit page would give sponsors a reason to link back.
- **Social media:** footer and contact links to Facebook, Instagram, WhatsApp and X (placeholders point to the platform home pages until real accounts exist); Open Graph tags make shared links show a title, description and image.
- **Local SEO:** the full name, address and phone number (NAP) appear in the footer of every page and in the `NGO` schema; a Google Business Profile for the head office is the next step.

**Additional requests**

- **robots.txt:** allows crawling, blocks `thank-you.html` and `404.html`, and links the sitemap.
- **sitemap.xml:** lists the six indexable pages with `lastmod`, `changefreq` and `priority`.
- **Page speed:** local optimised images (JPEG quality 80, logo resized), lazy loading, deferred scripts, font `display=swap`, long-term cache headers in `_headers`. The Part 2 HTML file dropped from 1.8 MB to about 20 KB per page.
- **Security:** HTTPS (provided by Netlify), security headers in `_headers`, `rel="noopener noreferrer"` on external links, client and server-side-safe handling of input (output uses `textContent`, never `innerHTML`), honeypot field against bots.

### 3. Form functionality and validation

**HTML forms (`enquiry.html` and `contact.html`)** use proper `<label>`s, `<fieldset>` / `<legend>` for radio groups, `input` types `text`, `email`, `tel`, `date`, `number`, `radio`, `select` and `textarea`, `required`, `minlength` and `maxlength`. Both forms have an `action` attribute: the enquiry form posts to `thank-you.html` (Netlify Forms), the contact form's fallback action is the `mailto:` address.

| | `enquiry.html` | `contact.html` |
|---|---|---|
| Purpose | Enquire about volunteering, sponsorship, partnerships or workshop places | Send a general message to the organisation |
| After validation | A response is calculated and shown: **cost** (e.g. 3 garden sponsorships = R15,000, workshop fee per person) and **availability** (places left, waiting list, next garden day) | The details are compiled into an email shown in a preview. "Open in my email app" sends it to the recipient set in `forms.js` (`RECIPIENT`) |
| Delivery | AJAX `fetch` POST to Netlify Forms | `mailto:` link |

**JavaScript validation (`forms.js`)**

- **Client-side validation:** runs on blur, on typing once a field is flagged, and on submit. The form is only processed when every active field is valid.
- **Formats checked:** names (letters, spaces, hyphens, apostrophes), email pattern, South African phone numbers (`071 234 5678` or `+27 71 234 5678`), dates (not in the past, within 6 months), whole numbers within min/max, character lengths (message 20-1000 characters, with a live counter).
- **Error handling:** messages appear under each field (`role` alert summary, `aria-invalid`, `aria-describedby`), the first invalid field receives focus, and fields turn red or green.
- **AJAX submission:** the enquiry form is sent with `fetch()` without reloading the page; a "Sending..." state prevents double submits, an 8-second timeout handles slow networks, and a clear message explains what to do if delivery fails.

### 4. GitHub repository

Commit regularly with descriptive messages. Suggested history for Part 3:

```
git add .
git commit -m "Split single-page site into five HTML pages and move images to /images"
git commit -m "Add accordion, tabs, modal, lightbox and Leaflet map"
git commit -m "Add events search, filter and sort"
git commit -m "Add SEO: meta tags, schema, robots.txt, sitemap.xml"
git commit -m "Add form validation, AJAX enquiry response and contact email"
git commit -m "Update README with Part 3 changelog and references"
git push origin main
```

### 5. Deployment

Deployed on Netlify (free): drag the site folder onto <https://app.netlify.com/drop> or connect the GitHub repository. After deployment:

1. Replace `https://effulgent-horse-3ba0cf.netlify.app` with your real URL in the `<link rel="canonical">` and Open Graph tags of each page, in `sitemap.xml` and `robots.txt`.
2. In Netlify, open **Forms** and confirm the `enquiry` form appears (Netlify detects it from the HTML).
3. Visit every page on the live URL and submit a test enquiry.

## Testing and evidence

Tested in Chromium with automated and manual checks (Playwright).

| Check | Result |
|---|---|
| All 8 pages load, one `<h1>` each, no JavaScript console errors | Pass |
| No horizontal scrolling at 1440 px and 390 px | Pass |
| Accordion opens one panel at a time; tabs work with arrow keys | Pass |
| Lightbox opens, arrow keys change photo, Esc closes | Pass |
| Events: search, type/township filters, sort, empty state | Pass |
| Enquiry: empty submit shows errors; invalid email/phone/date rejected; all four enquiry types produce a cost/availability response | Pass |
| Enquiry AJAX: success message when the POST succeeds, clear fallback message when it fails | Pass |
| Contact: validation, character counter, email preview with `mailto:` link | Pass |
| Map: two markers shown (map tiles need an internet connection) | Pass |

Screenshots: `screenshots/` (Part 2 desktop/tablet/mobile) and `screenshots/part3/` (each page, enquiry response, contact email preview, mobile menu).

## Changelog

### Part 3 - Functionality, SEO and deployment

- Replaced the single-page JavaScript router with six real pages (`index`, `about`, `services`, `gallery`, `enquiry`, `contact`) sharing one stylesheet; added `thank-you.html` and `404.html`.
- Moved base64 images out of the HTML into `/images` with descriptive names; added favicon and touch icon.
- Added accordion (FAQ), tabs (ways to get involved), modal dialogs (team bios, enquiry response, email preview), lightbox gallery, Leaflet map, scroll animations and counters.
- Added dynamic upcoming-events list with search, filtering and sorting.
- Rebuilt both forms with full JavaScript validation, inline error messages, AJAX submission, a cost/availability response and a compiled contact email. Replaced the `alert()` confirmation.
- Added unique titles and meta descriptions, canonical URLs, Open Graph/Twitter tags, `NGO` and `FAQPage` structured data, `robots.txt`, `sitemap.xml`.
- Added skip link, `aria-current` on the active page, focus-visible styles, `aria-live` result counts and reduced-motion support.
- Darkened the accent text colour (`#b8712a` to `#9a5a1c`) to meet WCAG AA contrast on light backgrounds.
- Added `_headers` for security and caching.

### Part 2 feedback edits

Part 2 score: 63/100 (feedback dated 20 October 2026).

| Feedback | Change made |
|---|---|
| Fix the stylesheet link in `gallery.html` (line 7) to `css/style.css` | `gallery.html` now exists as its own page (the gallery was previously a section of `about.html`) and its `<link rel="stylesheet" href="css/style.css">` points to the correct path. All other pages use the same path, and the stylesheet was moved into `css/`. |
| Add width/height to gallery images and download the external image locally | Every gallery image now has `width="800" height="500"` and is a local file in `images/` (`community-garden-soweto.jpg`, `urban-food-gardens.jpg`, `nutrition-workshop.jpg`, `youth-development.jpg`). No page loads an image from an external site. |
| Standardise reference formatting (APA or Harvard) | The reference list below uses one style (Harvard): Author (Year) *Title*. Available at: URL (Accessed: date). |

### Part 2 - CSS styling and responsive design

- Created the external stylesheet `style.css` with a reset, design tokens, typography, Grid/Flexbox layouts, hover and focus states.
- Added tablet (`64rem`) and mobile (`48rem`) breakpoints, relative units and responsive images.
- Added desktop, tablet and mobile screenshots as test evidence.

### Part 1 feedback corrections

- **Feedback (68/100):** the lecturer endorsed Proposal 1 (Roots of Hope Foundation) as a feasible project and advised focusing on mastering front-end fundamentals such as semantic HTML and responsive CSS layouts. No specific corrections were listed.
- **Change made:** semantic HTML is used throughout (`header`, `nav`, `main`, `section`, `article`, `address`, `footer`, `fieldset`/`legend`, one `h1` per page), and the layout is responsive at tablet and mobile breakpoints (see Part 2 and the testing section).

## References

Agafonkin, V. (2023) *Leaflet 1.9.4*. Available at: https://leafletjs.com (Accessed: 29 October 2026).

Google (2024a) *Search Engine Optimization (SEO) Starter Guide*. Available at: https://developers.google.com/search/docs/fundamentals/seo-starter-guide (Accessed: 29 October 2026).

Google (2024b) *Build and submit a sitemap; Introduction to robots.txt*. Available at: https://developers.google.com/search/docs (Accessed: 29 October 2026).

Google Fonts (2024) *Montserrat, Open Sans and Lora*. Available at: https://fonts.google.com (Accessed: 29 October 2026).

jQuery Foundation (2023) *jQuery 3.7.1*. Available at: https://jquery.com (Accessed: 29 October 2026).

MDN Web Docs (2024a) *Client-side form validation*. Available at: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation (Accessed: 29 October 2026).

MDN Web Docs (2024b) *The Dialog element*. Available at: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog (Accessed: 29 October 2026).

MDN Web Docs (2024c) *Using the Fetch API*. Available at: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch (Accessed: 29 October 2026).

MDN Web Docs (2024d) *CSS media queries, CSS Grid Layout and :focus-visible*. Available at: https://developer.mozilla.org (Accessed: 29 October 2026).

Netlify (2024) *Forms setup and Custom headers*. Available at: https://docs.netlify.com (Accessed: 29 October 2026).

OpenStreetMap contributors (2026) *OpenStreetMap*. Available at: https://www.openstreetmap.org/copyright (Accessed: 29 October 2026).

Schema.org (2024) *NGO and FAQPage*. Available at: https://schema.org (Accessed: 29 October 2026).

W3C (2024) *ARIA Authoring Practices Guide: Tabs and Accordion patterns*. Available at: https://www.w3.org/WAI/ARIA/apg/ (Accessed: 29 October 2026).
