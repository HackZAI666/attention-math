# Attention — 汤逊数学

Version 0.5 — static website prototype

## Start the site

1. Extract the ZIP folder.
2. Keep the bundled `assets/logo.png` in place. The supplied Attention logo is already included and cropped to remove its white margins.
3. On Windows, double-click `start.bat`.
4. Open `http://localhost:8000` in a browser.

Do not launch by double-clicking `index.html`: the site loads ES modules and uses Web Crypto, so use localhost or HTTPS.

## Main files

- `index.html` — page structure and dialogs.
- `styles.css` — responsive design, full-screen question view, and controls.
- `main.js` — intro, library, topic filters, question UI, answer judging, attempt limits, and solution visibility.
- `auth.js` — local account registration/login.
- `user-p.js` — first-time topic preference selection.
- `search.js` — question loading and text/topic filtering.
- `question/questions.json` — all 35 multiple-choice questions, answer indices, and explanations.
- `question/README.txt` — catalogue, topic index, answer key, difficulty and permission rules.
- `assets/logo.png` — bundled user-supplied logo.

## Latest answer and attempt policy

- 1–2 stars: anyone can answer; unlimited attempts; reference answer and explanation are public.
- 3 stars: sign-in required; unlimited attempts; REG can see the answer and explanation.
- 4 stars: sign-in required; two attempts; REG can see the answer and explanation.
- 5 stars: sign-in required; two attempts; REG can see the correct option only; VIP can see the explanation.
- 6 stars: sign-in required; two attempts; REG receives correctness feedback only; VIP can see the answer and explanation.
- 7 stars: sign-in required; one attempt; REG receives correctness feedback only; VIP can see the answer and explanation.
- VIP can view all answers and explanations. The built-in developer account has VIP access for testing.

## Developer test account

- Username: `142857`
- Password: `31415926`

## Important prototype limitations

This is a front-end-only project. User accounts, selections, and attempt counts are stored in the current browser’s local storage; they do not sync between devices. Attempt limits can be bypassed by clearing browser storage. Correct answers and explanations are included in `question/questions.json` and can be inspected by a technically capable visitor. The developer password is also client-side. VIP payment and server-side membership checks are not implemented. Do not use this prototype for real paid access or sensitive user data.

## Adding questions

Add a new record to `question/questions.json` with a unique `id`, title, code, source, topics, difficulty from 1 to 7, prompt, exactly five choices, a correct answer index (`0` = A through `4` = E), and an explanation. Add the new question to `question/README.txt` source and topic indexes. Use valid JSON; do not add trailing commas.
