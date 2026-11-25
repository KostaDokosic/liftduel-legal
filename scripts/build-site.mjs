#!/usr/bin/env node
// Builds the LiftDuels marketing pages from one template and two copy files (no dependencies, Node 18+).
//   node scripts/build-site.mjs
// Writes: index.html, sr/index.html, gyms/index.html, sr/gyms/index.html, sitemap.xml, robots.txt, llms.txt
// Source: site/copy.en.json, site/copy.sr.json (texts), site/images.json (which screen goes where), site/alts.json (alt texts),
//         site/jsonld.json (structured data), assets/manifest.json (image sizes). Edit those, not the generated HTML.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const manifest = read('assets/img-index.json').images;
const images = read('site/images.json');
const alts = read('site/alts.json');
const icons = read('site/icons.json');
const jsonld = read('site/jsonld.json');
const COPY = { en: read('site/copy.en.json'), sr: read('site/copy.sr.json') };
const ORIGIN = 'https://liftduels.app';
const APP_STORE = COPY.en.common.stores.appStoreHref;

// Small UI strings that are not marketing copy.
const UI = {
  en: { you: 'You', them: 'Them', friend: 'Friend', live: 'Live', illustration: 'Illustration of a duel. Names and numbers are examples.', exercisesWon: 'Exercises won', boardLabel: 'Example duel score. You 3, Friend 2.', getApp: 'Get the app', menu: 'Main', devPill: 'In development', soon: 'Coming soon', free: 'Free', proTag: 'PRO', optional: 'Optional' },
  sr: { you: 'Ti', them: 'On', friend: 'Prijatelj', live: 'Uživo', illustration: 'Ilustracija dvoboja. Imena i brojevi su primeri.', exercisesWon: 'Osvojene vežbe', boardLabel: 'Primer rezultata dvoboja. Ti 3, Prijatelj 2.', getApp: 'Preuzmi', menu: 'Glavni meni', devPill: 'U razvoju', soon: 'Uskoro', free: 'Besplatno', proTag: 'PRO', optional: 'Opciono' },
};
const LEGAL = {
  en: { privacy: '/privacy.html', terms: '/terms.html', support: '/support.html', del: '/delete-account.html' },
  sr: { privacy: '/sr/privacy.html', terms: '/sr/terms.html', support: '/sr/support.html', del: '/sr/delete-account.html' },
};
const PAGES = { landing: { en: '/', sr: '/sr/' }, gyms: { en: '/gyms/', sr: '/sr/gyms/' } };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sec = (copy, page, id) => copy[page].sections.find((s) => s.id === id);

// ---------- pieces ----------
function picture(id, lang, { w, eager = false, sizes } = {}) {
  const m = manifest[id];
  if (!m) throw new Error(`image ${id} is not in assets/manifest.json`);
  const widths = m.widths;
  const set = (ext) => widths.map((x) => `/assets/img/${id}-${x}.${ext} ${x}w`).join(', ');
  const mid = widths[Math.floor(widths.length / 2)];
  const f = m.files[mid];
  const alt = esc(alts[id]?.[lang] ?? m.description);
  const sz = sizes ?? `(max-width: 600px) ${Math.min(w, 300)}px, ${w}px`;
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sz}"><source type="image/webp" srcset="${set('webp')}" sizes="${sz}"><img src="/assets/img/${id}-${mid}.webp" width="${f.width}" height="${f.height}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
function phone(id, lang, w, { eager = false, cls = '' } = {}) {
  const m = manifest[id];
  const mid = m.widths[Math.floor(m.widths.length / 2)];
  const f = m.files[mid];
  return `<figure class="phone ${cls}" style="--w:${w};--ar:${f.width}/${f.height}">${picture(id, lang, { w, eager })}</figure>`;
}
const storeIos = (copy) => `<a class="store store--ios" href="${esc(APP_STORE)}" rel="noopener">${icons.apple}<span><small>${esc(copy.common.stores.appStoreLabel.split(' ').slice(0, 3).join(' '))}</small>App Store</span></a>`;
const storeAnd = (copy, lang) => `<span class="store store--and" aria-disabled="true">${icons.play}<span><small>Android</small>${esc(UI[lang].soon)}</span></span>`;
const stores = (copy, lang) => `<div class="hero__cta">${storeIos(copy)}${storeAnd(copy, lang)}</div>`;
const mark = (cls = '', w = 44) => `<img class="${cls}" src="/assets/liftduel-mark.svg" width="${w}" height="${Math.round(w * 0.64)}" alt="">`;

function nav(lang, page) {
  const c = COPY[lang].common.nav;
  const home = lang === 'sr' ? '/sr/' : '/';
  const a = page === 'landing' ? '' : home;
  const other = lang === 'en' ? 'sr' : 'en';
  const switchHref = PAGES[page][other];
  return `<header class="wrap nav"><a class="brand" href="${home}" aria-label="LiftDuels">${mark('', 44)}LiftDuels</a>
<nav class="nav__r" aria-label="${esc(UI[lang].menu)}">
<a class="l" href="${a}#duels">${esc(c.duels)}</a><a class="l" href="${a}#features">${esc(c.features)}</a><a class="l" href="${a}#pro">${esc(c.pro)}</a><a class="l" href="${PAGES.gyms[lang]}"${page === 'gyms' ? ' aria-current="page"' : ''}>${esc(c.gyms)}</a>
<a class="lang" href="${switchHref}" hreflang="${other === 'sr' ? 'sr-Latn' : 'en'}" lang="${other === 'sr' ? 'sr-Latn' : 'en'}" aria-label="${esc(c.language)}">${other.toUpperCase()}</a>
<a class="btn" href="${esc(APP_STORE)}" rel="noopener">${esc(UI[lang].getApp)}</a></nav></header>`;
}

function footer(lang) {
  const c = COPY[lang].common, f = c.footer, l = LEGAL[lang];
  return `<footer class="foot"><div class="wrap"><div class="foot__grid">
<div><p class="foot__tag">${esc(f.tagline)}</p></div>
<div><h2>${esc(f.columns.product)}</h2><ul><li><a href="${PAGES.landing[lang]}">${esc(f.links.home)}</a></li><li><a href="${PAGES.gyms[lang]}">${esc(f.links.gyms)}</a></li></ul></div>
<div><h2>${esc(f.columns.company)}</h2><ul><li><a href="${l.support}">${esc(f.links.support)}</a></li><li><a href="mailto:${esc(f.contactEmail)}">${esc(f.contactEmail)}</a></li></ul></div>
<div><h2>${esc(f.columns.legal)}</h2><ul><li><a href="${l.privacy}">${esc(f.links.privacy)}</a></li><li><a href="${l.terms}">${esc(f.links.terms)}</a></li><li><a href="${l.del}">${esc(f.links.deleteAccount)}</a></li></ul></div>
</div>
<div class="foot__small"><p>${esc(f.ageNote)}</p><p>${esc(f.healthNote)}</p><p>${esc(c.cookieNote)}</p></div>
<div class="foot__mark" aria-hidden="true">${mark('', 140)}LiftDuels</div></div></footer>`;
}

function head(lang, page) {
  const meta = COPY[lang][page].meta;
  const htmlLang = lang === 'sr' ? 'sr-Latn' : 'en';
  const url = ORIGIN + PAGES[page][lang];
  const og = `${ORIGIN}/assets/og-${page}-${lang}.jpg`;
  const ogAlt = lang === 'sr' ? 'LiftDuels: dnevnik treninga sa dvobojima snage' : 'LiftDuels: workout tracker with strength duels';
  const en = ORIGIN + PAGES[page].en, sr = ORIGIN + PAGES[page].sr;
  const heroPreload = page === 'landing' ? (() => { const id = images.landing.hero; const m = manifest[id]; return `<link rel="preload" as="image" type="image/avif" href="/assets/img/${id}-${m.widths[1]}.avif" imagesrcset="${m.widths.map((x) => `/assets/img/${id}-${x}.avif ${x}w`).join(', ')}" imagesizes="300px">`; })() : '';
  return `<!doctype html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${en}">
<link rel="alternate" hreflang="sr" href="${sr}">
<link rel="alternate" hreflang="x-default" href="${en}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0D0F10">
${page === 'landing' ? '<meta name="apple-itunes-app" content="app-id=6825331857">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="LiftDuels">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(meta.ogTitle)}">
<meta property="og:description" content="${esc(meta.ogDescription)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogAlt)}">
<meta property="og:locale" content="${lang === 'sr' ? 'sr_RS' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'sr' ? 'en_US' : 'sr_RS'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.twitterTitle)}">
<meta name="twitter:description" content="${esc(meta.twitterDescription)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/assets/site.webmanifest">
<link rel="preload" href="/fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
${heroPreload}
<link rel="stylesheet" href="/css/site.css">
<script>document.documentElement.className+=' js'</script>
${structuredData(lang, page)}
</head>`;
}

// ---------- structured data (FAQ is generated from the visible copy so they can never differ) ----------
function structuredData(lang, page) {
  const fix = (o) => JSON.parse(JSON.stringify(o).replaceAll('https://liftduels.app/og/liftduels-og.png', `${ORIGIN}/assets/og-landing-${lang}.jpg`).replaceAll('https://liftduels.app/logo-512.png', `${ORIGIN}/assets/icon-512.png`));
  const blocks = [fix(jsonld.shared.Organization), fix(jsonld.shared[`WebSite_${lang}`])];
  if (page === 'landing') {
    blocks.push(lang === 'sr' ? JSON.parse(JSON.stringify(fix(jsonld.landing.MobileApplication_sr)).replaceAll(`${ORIGIN}/#app`, `${ORIGIN}/sr/#app`)) : fix(jsonld.landing.MobileApplication_en));
    const faq = sec(COPY[lang], 'landing', 'faq');
    blocks.push({ '@context': 'https://schema.org', '@type': 'FAQPage', '@id': ORIGIN + PAGES.landing[lang] + '#faq', inLanguage: lang === 'sr' ? 'sr-Latn' : 'en', mainEntity: faq.items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) });
  } else {
    blocks.push(fix(jsonld.gyms[`WebPage_${lang}`]), fix(jsonld.gyms[`BreadcrumbList_${lang}`]));
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replaceAll('<', '\\u003c')}</script>`).join('\n');
}

// ---------- landing sections ----------
function hero(lang) {
  const copy = COPY[lang], s = sec(copy, 'landing', 'hero'), u = UI[lang];
  const parts = s.headline.split(/(?<=\.)\s+/);
  const cls = ['', 'you', 'them'];
  return `<section class="hero"><div class="wrap hero__grid"><div class="hero__txt">
<h1>${parts.map((p, i) => `<span${cls[i] ? ` class="${cls[i]}"` : ''}>${esc(p)}</span>`).join(' ')}</h1>
<p class="hero__lead">${esc(s.eyebrow.replace(/\.$/, ''))}. ${esc(s.subhead)}</p>${stores(copy, lang)}<p class="muted" style="margin-top:var(--s-4);font-size:.9375rem">${esc(s.proofLine)}</p></div>
<div class="stage"><div class="stage__you" aria-hidden="true"></div><div class="stage__them" aria-hidden="true"></div>
<span class="stage__tag stage__tag--you" aria-hidden="true">${esc(u.you)}</span><span class="stage__tag stage__tag--them" aria-hidden="true">${esc(u.them)}</span>
${phone(images.landing.hero, lang, 300, { eager: true, cls: 'phone--float' })}</div></div></section>`;
}
const tagline = (lang) => `<section class="tagline"><div class="wrap"><p>${esc(sec(COPY[lang], 'landing', 'tagline').headline)}</p></div></section>`;
const head2 = (s) => `<div class="sec__head rv"><h2>${esc(s.headline)}</h2>${s.subhead ? `<p>${esc(s.subhead)}</p>` : ''}</div>`;

function howItWorks(lang) {
  const s = sec(COPY[lang], 'landing', 'how-it-works');
  const li = s.cards.map((c, i) => `<li class="step rv" style="--i:${i}"><span class="step__n num">${esc(c.step)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${phone(images.landing['how-it-works'][i], lang, 260)}</li>`).join('');
  return `<section class="sec" id="how"><div class="wrap">${head2(s)}<ol class="steps">${li}</ol></div></section>`;
}

function features(lang) {
  const s = sec(COPY[lang], 'landing', 'features');
  let rows = '', more = '', n = 0;
  s.cards.forEach((c, i) => {
    const img = images.landing.features[String(i)];
    if (img) {
      const flip = n++ % 2 === 1;
      rows += `<div class="row${flip ? ' row--flip' : ''} rv"><div class="row__txt"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div><div class="row__vis">${phone(img, lang, 300)}</div></div>`;
    } else more += `<article class="rv"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`;
  });
  return `<section class="sec sec--alt" id="features"><div class="wrap">${head2(s)}${rows}<div class="more">${more}</div></div></section>`;
}

function duels(lang) {
  const copy = COPY[lang], s = sec(copy, 'landing', 'duels'), u = UI[lang];
  const side = (who, cls, letter, anim) => `<div class="duel__side duel__side--${cls}"><div class="duel__who"><span class="duel__badge" aria-hidden="true">${esc(letter)}</span>${esc(who)}</div><div class="duel__score num duel__score--${anim}" aria-hidden="true"></div><div style="width:100%"><p class="duel__lift">${esc(u.exercisesWon)}</p><div class="duel__bar" style="margin-top:8px"><i></i></div></div></div>`;
  return `<section class="duels" id="duels"><div class="wrap"><div class="sec__head rv"><h2>${esc(s.headline)}</h2><p>${esc(s.subhead)}</p></div>
<div class="board rv"><div class="board__head"><p>${esc(u.illustration)}</p></div>
<div class="duel duel-grid" role="group" aria-label="${esc(u.boardLabel)}">${side(u.you, 'you', u.you[0], 'you')}${side(u.friend, 'them', u.friend[0], 'them')}<div class="seam" aria-hidden="true"></div><div class="duel__live" aria-hidden="true">${esc(u.live)}</div></div></div>
<div class="duels__grid"><div><ul class="duels__list">${s.bullets.map((b, i) => `<li class="rv" style="--i:${i}">${esc(b)}</li>`).join('')}</ul><p class="duels__note">${esc(s.note)}</p><div class="duels__cta">${storeIos(copy)}</div></div>
<div class="duels__vis rv">${phone(images.landing.duels, lang, 280)}</div></div></div></section>`;
}

function progress(lang) {
  const s = sec(COPY[lang], 'landing', 'progress');
  let cards = '', more = '';
  s.cards.forEach((c, i) => {
    const img = images.landing.progress[String(i)];
    if (img) cards += `<article class="rv" style="--i:${i}"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${phone(img, lang, 220)}</article>`;
    else more += `<article class="rv"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`;
  });
  return `<section class="sec" id="progress"><div class="wrap">${head2(s)}<div class="prog">${cards}</div>${more ? `<div class="more">${more}</div>` : ''}</div></section>`;
}

function pro(lang) {
  const copy = COPY[lang], s = sec(copy, 'landing', 'pro'), u = UI[lang];
  const plan = (c, i) => `<article class="plan${i === 1 ? ' plan--pro' : ''} rv" style="--i:${i}"><h3>${esc(c.title)}${i === 1 ? ` <span class="pill">${esc(u.optional)}</span>` : ''}</h3><ul>${c.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></article>`;
  return `<section class="sec sec--alt" id="pro"><div class="wrap">${head2(s)}<div class="plans">${s.cards.map(plan).join('')}</div><p class="pro__note">${esc(s.note)}</p><div class="pro__cta">${storeIos(copy)}</div></div></section>`;
}

function gymTeaser(lang) {
  const s = sec(COPY[lang], 'landing', 'for-gyms');
  return `<section class="gteaser" id="gyms"><div class="wrap rv"><h2>${esc(s.headline)}</h2><p>${esc(s.subhead)}</p><p class="dev muted">${esc(s.inDevelopment)}</p><a class="btn" href="${esc(s.cta.href.replace(/^\/gyms\//, PAGES.gyms[lang]))}">${esc(s.cta.label)}</a></div></section>`;
}

function faq(lang) {
  const s = sec(COPY[lang], 'landing', 'faq');
  return `<section class="sec" id="faq"><div class="wrap faq"><div class="faq__head rv"><h2 style="font-size:var(--fs-3);line-height:var(--lh-tight)">${esc(s.headline)}</h2><p class="lead" style="margin-top:var(--s-5)">${esc(s.subhead)}</p></div>
<div class="faq__list">${s.items.map((i) => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</div></div></section>`;
}

function ctaBand(lang) {
  const copy = COPY[lang], s = sec(copy, 'landing', 'cta'), u = UI[lang];
  return `<section class="band" id="get"><div class="wrap"><h2>${esc(s.headline)}</h2><p>${esc(s.subhead)}</p>${stores(copy, lang)}<p class="note">${esc(s.note)}</p></div><span class="band__tag band__tag--you" aria-hidden="true">${esc(u.you)}</span><span class="band__tag band__tag--them" aria-hidden="true">${esc(u.friend)}</span></section>`;
}

// ---------- gyms deck ----------
function gymsPage(lang) {
  const copy = COPY[lang], u = UI[lang];
  const h = sec(copy, 'gyms', 'hero'), w = sec(copy, 'gyms', 'what-works-now'), d = sec(copy, 'gyms', 'in-development'), p = sec(copy, 'gyms', 'pilot');
  const st = sec(copy, 'gyms', 'steps'), ask = sec(copy, 'gyms', 'ask'), ct = sec(copy, 'gyms', 'contact');
  const g = images.gyms;
  const cover = `<section class="slide cover"><div class="wrap cover__grid"><div class="cover__txt"><h1>${esc(h.headline)}</h1><p class="sub">${esc(h.subhead)}</p><p class="cover__line you-t">${esc(h.proofLine)}</p><a class="btn" href="${esc(h.cta.href)}">${esc(h.cta.label)}</a></div>
<div class="fan" aria-label="${esc(alts[g.fan[1]][lang])}">${g.fan.map((id, i) => phone(id, lang, i === 1 ? 260 : 210, { eager: i === 1 })).join('')}</div></div></section>`;
  const works = `<section class="slide slide--alt" id="works"><div class="wrap"><h2>${esc(w.headline)}</h2><p class="sub">${esc(w.subhead)}</p><div class="cards cards--3">${w.cards.map((c, i) => `<article class="card rv" style="--i:${i}"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('')}</div>
<div class="minis" aria-hidden="false">${g.minis.map((id) => phone(id, lang, 170)).join('')}</div></div></section>`;
  const dev = `<section class="slide devband" id="in-development"><div class="wrap"><span class="pill tag">${esc(u.devPill)}</span><h2>${esc(d.headline)}</h2><p class="sub">${esc(d.subhead)}</p><div class="cards">${d.cards.map((c, i) => `<article class="card card--dev rv" style="--i:${i}"><span class="pill">${esc(c.tag ?? u.devPill)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('')}</div></div></section>`;
  const pilot = `<section class="slide" id="pilot"><div class="wrap"><h2>${esc(p.headline)}</h2><p class="sub">${esc(p.subhead)}</p><div class="cards">${p.cards.map((c, i) => `<article class="card card--pilot rv" style="--i:${i}"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('')}</div></div></section>`;
  const steps = `<section class="slide slide--alt" id="steps"><div class="wrap"><h2>${esc(st.headline)}</h2><p class="sub">${esc(st.subhead)}</p><ol class="gsteps">${st.cards.map((c, i) => `<li class="gstep rv" style="--i:${i}"><span class="wk">${esc(c.step)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></li>`).join('')}</ol></div></section>`;
  const asks = `<section class="slide" id="ask"><div class="wrap"><h2>${esc(ask.headline)}</h2><ul class="ask">${ask.bullets.map((b) => `<li class="rv">${esc(b)}</li>`).join('')}</ul></div></section>`;
  const contact = `<section class="slide contact" id="contact"><div class="wrap"><h2>${esc(ct.headline)}</h2><p class="sub">${esc(ct.subhead)}</p><a class="btn" href="${esc(ct.cta.href)}">${esc(ct.cta.label)}</a><p class="note">${esc(ct.note)}</p><a class="back" href="${PAGES.landing[lang]}">${esc(ct.backLink.label)}</a></div></section>`;
  return [cover, works, dev, pilot, steps, asks, contact].join('\n');
}

// ---------- write ----------
function page(lang, which) {
  const body = which === 'landing'
    ? [hero(lang), duels(lang), howItWorks(lang), tagline(lang), features(lang), progress(lang), pro(lang), gymTeaser(lang), faq(lang), ctaBand(lang)].join('\n')
    : gymsPage(lang);
  return `${head(lang, which)}
<body>
<a class="skip" href="#main">${esc(COPY[lang].common.skipLink)}</a>
${nav(lang, which)}
<main id="main">
${body}
</main>
${footer(lang)}
<script src="/js/site.js" defer></script>
</body>
</html>
`;
}
const out = (p, text) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), text); console.log('wrote', p, `${(text.length / 1024).toFixed(1)} KB`); };
out('index.html', page('en', 'landing'));
out('sr/index.html', page('sr', 'landing'));
out('gyms/index.html', page('en', 'gyms'));
out('sr/gyms/index.html', page('sr', 'gyms'));

const today = new Date().toISOString().slice(0, 10);
const alt = (k) => ['en', 'sr', 'x-default'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN + PAGES[k][l === 'sr' ? 'sr' : 'en']}"/>`).join('');
const legal = ['/privacy.html', '/terms.html', '/support.html', '/delete-account.html', '/sr/privacy.html', '/sr/terms.html', '/sr/support.html', '/sr/delete-account.html'];
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['landing', 'gyms'].flatMap((k) => ['en', 'sr'].map((l) => `<url><loc>${ORIGIN + PAGES[k][l]}</loc><lastmod>${today}</lastmod>${alt(k)}</url>`)).join('\n')}
${legal.map((p) => `<url><loc>${ORIGIN + p}</loc></url>`).join('\n')}
</urlset>
`);
out('robots.txt', `User-agent: *
Allow: /
Disallow: /invite/
Disallow: /invite.html

Sitemap: ${ORIGIN}/sitemap.xml
`);
out('llms.txt', `# LiftDuels

> LiftDuels is a workout tracker for the gym with strength duels: you log sets, reps and weight (offline too), then challenge a friend to the same workout and the score changes set by set. Free to use, optional PRO. On the iOS App Store now, Android coming soon. For ages 16 and over.

## Pages
- [Home](${ORIGIN}/): what LiftDuels does, how a duel works, PRO, FAQ
- [Home (Srpski)](${ORIGIN}/sr/): isto na srpskom
- [For gyms](${ORIGIN}/gyms/): the free 30 day pilot for gyms
- [Za teretane](${ORIGIN}/sr/gyms/): besplatan pilot od 30 dana
- [Support](${ORIGIN}/support.html)
- [Privacy Policy](${ORIGIN}/privacy.html)
- [Terms of Use](${ORIGIN}/terms.html)

## Contact
support@liftduels.app
`);
