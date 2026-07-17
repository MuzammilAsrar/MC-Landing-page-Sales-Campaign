# CONTENT-TODO — verify before launch

## 🚨 ACTION NEEDED IN VIMEO — the hero film will not play

`https://vimeo.com/1076667567` currently returns **401 to the embedded player
on every domain**, including `maincharactermethod.nl`. The video's public
metadata is fine (the title resolves), but its **embed permission is switched
off**, so the player refuses to load anywhere.

Verified with a direct request per referer:

| Referer | player.vimeo.com |
|---|---|
| (none) | 401 |
| `localhost` | 401 |
| `www.maincharactermethod.nl` | 401 |
| a Vercel preview domain | 401 |

**Fix it in Vimeo:** video → Settings → Privacy → *Where can this be embedded?*
→ **Anywhere** (or add the production + Vercel preview domains). Nothing in
this repo can work around it.

The page is built to survive it: the hero keeps our own poster up unless Vimeo
reports a real `play` event, so a blocked embed shows the photograph rather
than Vimeo's error screen. But **the film itself will not play for anyone until
that setting changes.**


Everything below is **placeholder content I wrote to make the design readable**.
None of it is verified. Every item is tagged in the markup:

```bash
grep -rn 'data-placeholder' index.html checkout.html
```

The design is finished. This list is what stands between the prototype and a
page that is *true*.

---

## ✅ What's now real (was placeholder last round)

| | |
|---|---|
| **All photography** | Your own shoots — Turning Point (dec), the juni editie, the editorial sets, the greenhouse. No stock anywhere. |
| **Brenda Kouwenhoven testimonial** | **Real.** Her actual video (`assets/video/testimonial-brenda.mp4`) and her actual words, transcribed from the burned-in subtitles. See the caveat below. |
| **Onyema's role** | "Regie en sprekerscoaching" — taken from the lower-third in your own video, not invented. |
| **Favicon** | Your MC mark. |

### One caveat on the Brenda quotes

I transcribed them from the **burned-in subtitles**, frame by frame. The three
quotes used are:

> "En ik had niet verwacht dat dat al direct zoveel emoties los kon maken."
> "Het Framework geeft me echt de tool in handen. Want als het vanuit je eigen visie komt, dan raakt het."
> "Het was eigenlijk een dagelijks moment uit mijn leven, dat ik toch op een goede manier kon overbrengen. Het heeft mij tot veel inzicht geleid."

They're stitched from separate subtitle frames, so the sentence boundaries are
my reconstruction, not hers. **Watch the video once and confirm the wording** —
and check Brenda is happy being quoted on a sales page.

---

## 🔴 Blocking — do not publish until these are real

| Tag | Where | What I put | What's needed |
|---|---|---|---|
| `testimonial-quotes` | Landing §10, Checkout | **Invented quotes** for **Lindy Stofbergen, Naomi Beusink, Anita Jongman, Yarmill Kromhout** | Real people from your current site. I had names, not words. Replace or cut. They now use initial monograms rather than stock faces — an honest initial beats a stranger's photo, but the *quotes* are still fiction. |
| `case-studies` | Landing §11 | Three invented before/after outcomes | Real, verifiable outcomes with consent — or cut the section. |
| `rating` | Landing §1, §10 | "4,9 gemiddeld · 87 beoordelingen" + a Google Reviews card | Real Google Business rating + count, or remove the card. A fabricated review score is the kind of claim that gets a Meta ad account restricted. |
| `guarantee` | Landing §9/§14/§16, Checkout | "Geld terug tot de lunch, zonder gesprek" | Your actual refund policy, worded exactly. This is a contractual promise. |
| `stat` / `alumni-count` | Landing §1, §2, §7 | 500+ sprekers · 120+ events · 12 jaar · 1.400+ deelnemers · 3.200+ levens · 98% | **Six live counters.** All six numbers are invented. |

## 🟠 Important

| Tag | Where | What's needed |
|---|---|---|
| `seats` | Landing §1/§9/§15, menu, sticky CTA, Checkout | Real remaining seats + capacity. Hardcoded to `12 / 40`, meter to `70%`. If you can't feed this from the ticketing system, use a static honest line ("laatste tickets") rather than a fake counter. |
| `venue` | Landing §13, Checkout FAQ | Exact venue + address + map. "20 min vanaf Amsterdam CS" and "gratis parkeren" are unverified. |
| `agenda` | Landing §12 | Real run-of-show. I invented 09:30–17:30. |
| `bump` | Checkout | Does the "Stap in je Main Character" meditatie exist at €27? Invented. |
| `policy` | Landing §14, Checkout FAQ | Real filming/consent policy and ticket-transfer policy. |
| `legal` | Footers | KvK number (currently `00000000`). |
| `link` | Throughout | T&C, privacy, contact, Google reviews all point to `#`. |

---

## ⚠️ One thing to double-check: Onyema's pronouns

You told me **hij/hem**, and the copy now uses that throughout (§7 and the
agenda). I'm flagging it only because two things in your own material point the
other way, and I'd rather you catch it than a visitor:

- The subtitle in your testimonial video reads *"…deelde Onyema **haar**…"*
  (though that could be referring to Brenda — it's genuinely ambiguous).
- The person shown throughout the photography presents femme.

You are the authority on this and I've done exactly what you asked. But it's on
your own site, in public, so please give §7 one read before it ships.

---

## Photography note

`assets/images/New folder/` (1.8 GB of raw exports) is **gitignored** — it would
break GitHub and stall Vercel. The 24 delivery crops in `assets/images/` are
~2.3 MB and are committed. To re-cut from the raws, see `assets/images/README.md`.

Two crops needed manual intervention and are worth knowing about:
- `exp-duo-stage` decapitated both people on a `centre` crop → forced to `top`.
- The hero poster must be **16:9** to match the video frame; a portrait source
  centre-crops straight to a torso.
