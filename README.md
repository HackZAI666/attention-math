# Attention — 汤逊数学

**Version:** 1.0 (built on the complete v0.9 release)  
**Public catalogue:** 42 questions (35 previous questions + 7 AMC 8 2026 adapted short-answer questions).  
**Private ranked bank:** 1 two-star question stored outside this public website folder in the sibling `private-developer/` folder.



## v1.0 — answer feedback and reveal controls
- Submitting a multiple-choice answer marks the submitted option green when correct and red when incorrect.
- After submission, the selected option is green when correct and red when incorrect. If the user is entitled to the answer key, the correct option is also marked green; the **Show answer** control reveals the full reference-answer text.
- Users who do not have answer-key permission see only their own red incorrect selection (or their green correct selection), never the correct option.
- The official answer text and worked explanation are hidden by default and each has its own click-to-reveal / hide control.
- Short-answer submissions also receive green/red input feedback. Existing attempt limits and per-account attempt history remain active.
- The library card's existing `Normal · REG` badge stays in its original upper-right position and wording; only its fill changes to a light translucent green.

## Answer and attempt rules
| Difficulty | Who may answer | Attempts | REG can reveal | VIP can reveal |
|---|---|---:|---|---|
| 1–2 stars | Everyone, including visitors | Unlimited | Answer + explanation | Answer + explanation |
| 3 stars | Signed-in account | Unlimited | Answer + explanation | Answer + explanation |
| 4 stars | Signed-in account | 2 | Answer + explanation | Answer + explanation |
| 5 stars | Signed-in account | 2 | Answer only | Answer + explanation |
| 6 stars | Signed-in account | 2 | Correct/incorrect only | Answer + explanation |
| 7 stars | Signed-in account | 1 | Correct/incorrect only | Answer + explanation |

Any signed-in REG or VIP account may attempt every difficulty. Membership controls only the answer and explanation reveal permissions.

## v0.9 incremental update — original v0.7 preserved
- The three-screen introduction, its typing animation, bottom-left “Skip introduction” button, and “Continue / Enter Tangxun Math” button are retained from v0.7 without rewriting the intro flow.
- The public question catalogue, question records, answer checking, membership gates, attempt limits, private ranked-bank file, pumpkin challenge and trophy logic are retained from v0.7.
- The account/dashboard block is moved to the top of the left sidebar, directly under the brand header. The signed-in username is larger and white, with an optional equipped title emblem displayed to its right.
- The Easter-egg hint is moved to directly below the search bar. The single fixed pumpkin launcher remains the only way to open the hidden Halloween challenge.
- Dashboard adds a Titles view. Halloween is unlocked by the Pumpkin Learner trophy; 高手 requires 30 ranked stars; 最强大脑 is reserved for the under-development 50-star tier and is not currently obtainable. Unlocked titles can be equipped; only an equipped title appears next to the username.
- Optional title artwork filenames and dimensions are documented in `assets/README.txt`. Missing images use neutral text placeholders.

### Player title artwork
Use transparent PNG images, recommended **640 × 160 px**, placed in `attention-math-site/assets/`:
- `title_halloween.png`
- `title_expert.png`
- `title_strongest_brain.png`

These title emblems are separate from `logo.png` and must not overwrite it.

## What changed in v0.7
- The existing white + dark-green Attention design is preserved, with the pumpkin-orange Halloween frame.
- A small Easter-egg hint appears on the home page. There is exactly one interactive pumpkin launcher, fixed at the bottom centre of the viewport; it stays in the same location while scrolling. The pumpkin is the only way to open the special challenge.
- The optional challenge hint gives a broad numerical range (100–200) and a general number-theory direction. It does not state the answer.
- Seven AMC 8 2026 adapted questions are public short-answer items. Q8 (two stars) is reserved for the hidden ranked bank and is not loaded into the public library.
- Dashboard navigation includes My Problems, Honors, and Rank Rules.
- Rank rules are visible, but ranked matches and access to the hidden ranked bank are disabled.
- The main topic row shows important tags; remaining topics are under More topics.

## Answer and attempt rules
| Difficulty | Who may answer | Attempts | REG can see | VIP can see |
|---|---|---:|---|---|
| 1–2 stars | Everyone | Unlimited | Answer + explanation | Answer + explanation |
| 3 stars | Signed-in account | Unlimited | Answer + explanation | Answer + explanation |
| 4 stars | Signed-in account | 2 | Answer + explanation | Answer + explanation |
| 5 stars | Signed-in account | 2 | Answer only | Answer + explanation |
| 6 stars | Signed-in account | 2 | Correct/incorrect only | Answer + explanation |
| 7 stars | Signed-in account | 1 | Correct/incorrect only | Answer + explanation |

Any signed-in REG or VIP account may answer every difficulty. Membership only controls answer/explanation visibility. The special pumpkin challenge is open to guests, REG accounts, and VIPs.

## Rank rules (display only; Ranked Play disabled)
- Black Iron (黑铁): default rank for every new account.
- Bronze (青铜): 1 star.
- Silver (白银): 4 stars.
- Gold (黄金): 8 stars.
- Platinum (铂金): 12 stars.
- Diamond (钻石): 18 stars.
- 神算: 24 stars.
- 高手: 30 stars.
- 最强大脑 (Strongest Brain): 50 stars; under development and cannot be earned yet. After release, stars above this tier will display as 最强大脑 N 星.

Ranked matches are not active, rank stars cannot currently be earned, and there is no player-facing entrance to the hidden question bank.

## New AMC 8 2026 adapted questions in the public library
| Code | Title | Difficulty | Topics | Correct response |
|---|---|---:|---|---|
| AMC 8 2026 · Q1 | Miguel, Luna, and the Ball | 3 | Algebra, Rates, Relative Motion, Fractions | (a) 1/4; (b) 210 m |
| AMC 8 2026 · Q2 | Building a 17 mm Coin Stack | 3 | Combinatorics, Sequences, Recurrence Relations | 49 |
| AMC 8 2026 · Q3 | An Elastic Band Around Seven Coins | 3 | Geometry, Circles, Perimeter | 60 + 10π cm |
| AMC 8 2026 · Q4 | Even Digits and Divisibility by 8 | 4 | Number Theory, Divisibility, Counting | 8/25 |
| AMC 8 2026 · Q5 | Writing 360 as Consecutive Odd Sums | 4 | Number Theory, Sequences, Divisibility | 6 |
| AMC 8 2026 · Q6 | Rearranging Five Students | 5 | Combinatorics, Permutations, Inclusion–Exclusion | 14 |
| AMC 8 2026 · Q7 | The Extreme Median of Seven Group Medians | 6 | Statistics, Combinatorics, Optimization | Minimum 20; maximum 44 |

## Private ranked-bank question (developer copy only)
- **AMC 8 2026 · Q8 — Counting Factors of 5 in a Factorial Product** — 2/7 — answer 164 — Number Theory, Prime Factorization, Factorials, Valuations.
- Stored at `../private-developer/hidden-ranked-questions.json`, outside the website root.
- The local `start.bat` server serves only the `attention-math-site` folder, so the sibling private folder is not served.
- Do not copy the private bank into the deployed website folder. Static hosting does not provide secure private storage; production ranked play needs a server-side question bank and answer verification.

## AMC 8 2026 adapted answer verification notes
- Q1: Miguel walks 30 m before meeting Luna, which is 1/4 of 120 m; Luna runs 120 m out and 90 m back, total 210 m.
- Q2: ordered compositions satisfy f(n)=f(n−2)+f(n−3), yielding f(17)=49.
- Q3: the outer centres form a regular hexagon of perimeter 60 cm; the rounded portions together make one circumference of radius 5 cm, adding 10π cm.
- Q4: 40 of 125 possible final-three-digit tuples are divisible by 8, so the fraction is 40/125=8/25.
- Q5: if there are k terms starting at odd a, 360=k(a+k−1); valid k are 2, 4, 6, 10, 12, 18, giving 6 representations.
- Q6: inclusion–exclusion over the four forbidden original neighbour pairs gives 120−192+108−24+2=14.
- Q7: at least four group medians at or below x require 20 distinct numbers at or below x, so the minimum is 20 and is attainable. Symmetrically, four medians at or above x require 20 numbers at or above x, giving a maximum of 44, also attainable.
- Hidden Q8: v₅(S(40))=Σₖ₌₁⁴⁰⌊k/5⌋+Σₖ₌₁⁴⁰⌊k/25⌋=148+16=164.

## Image files you can add
See `assets/README.txt`. In particular:
- `assets/pumpkin_trophy.png` — recommended 512 × 512 px PNG, transparent background; used in the challenge reward panel and Dashboard → Honors.
- `assets/rank_strongest_brain.png` — recommended 512 × 512 px PNG, transparent background; reserved for the under-development rank.
- `assets/logo.png` — existing Attention logo; do not overwrite it.

If optional art files are absent, built-in placeholders are shown and the site continues to work.

## Run locally
1. Extract the ZIP.
2. Open the `attention-math-site` folder.
3. Double-click `start.bat`.
4. Open `http://localhost:8000`.

## Security note
Accounts, attempts, trophy status, and preferences are stored in browser local storage. Client-side answer and attempt rules can be bypassed by users who inspect or alter local files. Production use needs server-side authentication, a database, and server-side answer/attempt checks.
