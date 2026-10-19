# MEME VICE

A front-end-only, host-controlled presentation tool for a fast-paced meme trivia show. Players watch the shared screen and submit answers through Discord chat; this site has no player accounts, chatbox, answer input, or automatic grading.

## Run it

The project files are located in `C:\xampp\htdocs\MMV`.

1. Start Apache from the XAMPP Control Panel.
2. Open `http://localhost/MMV/` in your browser, or open the project folder in VS Code and run `index.html` with the **Live Server** extension.
3. Click **PLAY** to display the looping video loading screen. The progress bar fills over eight seconds, then the category menu appears.

The Google Fonts connection is optional; local fallback fonts are configured if the browser is offline.

## Media assets

- Images, logos, backgrounds, round-card artwork, and the time-up graphic are stored in `assets\images\`.
- Round question and answer clips and the loading background are delivered from Cloudinary using the `nqygsmqv` cloud. Cloudinary public IDs use the existing filenames without the `.mp4` extension: `easy-1`, `easy-1-answer`, `ave-1`, `hard-1`, and `loading-bg`. Update `CLOUDINARY_CLOUD_NAME` in `js\app.js` if the account changes. Easy Round 2 uses its configured text answer if no answer clip is uploaded.
- The time-up sound is stored in `assets\audio\TIMESUP.ogg`; the graphic is `assets\images\timesup.png`.
- Keep images local in `assets\images\`. Local copies of hosted videos belong in `assets\videos\` for development only and are excluded from Git. Meme videos are fitted to their own aspect ratio, include native playback controls, and remain paused until the host presses play.

## Edit the show

- All 15 meme rounds and their question captions are in `js\questions.js`. Easy and Average have six rounds each; Hard has three. Round video clips live in `assets\videos\`; corresponding answer clips are shown after revealing. Round-card images are listed alongside their question data. Captions display below each meme video.
- Question caption headings use ITC Avant Garde Gothic when installed (with geometric sans-serif fallbacks); dialogue uses the Vogue-style display serif.
- Set `SHUFFLE_QUESTIONS` to configure the question order behavior in a future customization; the supplied show uses the fixed order (`false`).
- Edit `MODE_CONFIG` in `js\questions.js` to change mode labels, round counts, prize amounts, or timer durations in seconds. Easy is 30 seconds, Average 20 seconds, and Hard 15 seconds by default.
- Theme preference and completed rounds are saved in local storage. Completed rounds can be replayed.
- Select a mode to open its meme cards. Each card displays its custom meme title, while the active round number appears in the round screen. Rounds can be played in any order; revealing an answer does not complete the round. Use **Mark As Done** in the answer card to mark it complete, or **Unmark As Done** to reverse it, and the round header's back button returns to that mode's picker. Pink is the main accent; completed rounds, the prize amount, and round progress use green (`#008000`). The host can toggle a revealed answer with the eye button.
- Intro/loading/animation timings are configured near the top of `js\app.js`. Logo and other page image paths are set in `index.html` and `css\style.css`.

## Host controls

| Key | Action |
| --- | --- |
| `Space` | Start/pause timer |
| `R` | Reset timer |
| `A` | Reveal answer |
| `N` or `→` | Return to meme picker (after revealing) |
| `F` | Toggle fullscreen |
| `?` | Toggle keyboard shortcut cheat-sheet |

The timer is idle until the host starts it. Its display is calculated from elapsed wall-clock time rather than counting interval ticks. Use **+15s**, **+30s**, or **+1m** to add time, or double-click the clock to edit it in `MM:SS` format (the edit applies after four digits or on Enter; press Escape to cancel). Reset restores the configured or edited starting duration. At zero, the screen dims for three seconds with **TIME’S UP!** and the `assets\images\timesup.png` graphic while `assets\audio\TIMESUP.ogg` plays. The host can reveal and unreveal each answer before returning to the meme picker. No player scores are stored.

## Discord screen-sharing tips

- Share the browser window (or browser tab) in Discord, not your entire desktop.
- Press `F` for fullscreen after starting the presentation.
- Accepted answer variations appear inside the answer card only after the answer is revealed. Easy Round 2 accepts “Echo Queen” as a variation of “Asia’s Echo System.”
- The book and checklist icons open the Mechanics and Rules presentation modals. “Chatbox” in the rules refers to Discord chat.
- Test your local meme images and system audio before the show. The time-up sound may depend on the browser and Discord audio-sharing settings.
