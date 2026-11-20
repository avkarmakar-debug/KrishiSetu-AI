# KrishiSetu: prompt for Google AI Studio (Build mode)

Paste everything below the line into the Build box at aistudio.google.com.

---

Build a mobile-first web app called **KrishiSetu**, a voice-first AI crop-health companion for smallholder farmers in Bangladesh and eastern India. Tagline: "Talk. Snap. Save your crop."

## Who it is for
A small farmer (age 30-55, 1-3 acres, low literacy, basic phone, local dialect) who speaks instead of typing. The UI must work with almost no reading: big buttons, icons, voice output, very short text. Also used by a human agronomist (expert review) and an NGO/institution viewer (dashboard).

## Core flow: Snap, Speak, Act, Trust
1. **Snap**: farmer takes or uploads a photo of the sick crop or leaf (camera input, `capture="environment"`).
2. **Speak**: farmer records a voice note describing the problem (MediaRecorder). Typing is optional, never required.
3. **Act**: the Gemini API (use `gemini-2.5-flash`, multimodal: image + audio + text) returns a diagnosis and a simple action plan. Show it as big cards AND read it aloud with a "Listen" button (speechSynthesis in the chosen language, or Gemini TTS).
4. **Trust**: if confidence is low, the case is escalated to a human agronomist before the farmer is told anything risky.

## Gemini behavior
Call Gemini with the photo, the voice note, the selected language and the crop/location if provided. Use a system instruction like:
"You are KrishiSetu, an agricultural advisor for smallholder farmers. Use simple, short sentences in the farmer's language. Base advice on trusted sources (BRRI, BARI, FAO) and use Google Search grounding. Never guess: if the photo or description is unclear, say so and set needs_expert to true. Prefer low-cost, locally available actions first. Be careful with pesticide advice: name safe use and waiting periods."

Request structured JSON output with this schema:
- `crop` (string)
- `likely_problem` (string)
- `confidence` (number 0-100)
- `needs_expert` (boolean, true if confidence < 70 or the advice involves risky chemicals)
- `action_plan` (array of 3-5 short steps)
- `warning_signs` (array)
- `sources` (array of source names or URLs from grounding)
- `spoken_summary` (2-3 sentences written to be read aloud in the farmer's language)

Handle API errors and slow connections gracefully with a friendly retry message. Never hardcode an API key in client code.

## Screens
1. **Language and welcome**: pick Bangla, Hindi, or English (large flag/label buttons). Remember the choice. Greet by voice.
2. **Home**: three huge buttons: "Snap a photo", "Speak", "My cases". Plus a small row for weather, pest and price alerts.
3. **New case**: photo preview, record/stop voice button with a waveform or timer, optional text box, "Check my crop" button. Show "Got it! Checking your crop..." while loading.
4. **Result (confident)**: crop and likely problem, a visible confidence meter, numbered action plan, "Listen in your language" button, sources list, and a green "AI answer" badge.
5. **Result (not sure)**: show "Not fully sure. A human agronomist is reviewing your case..." and place the case in the expert queue. Optional BDT 20-50 expert consult label (simulated, no real payment).
6. **My cases**: history list with photo thumbnail, problem, status (AI answered, With expert, Verified by agronomist). Save in localStorage.
7. **Agronomist view** (toggle in a menu): queue of escalated cases showing photo, transcript, AI's guess and confidence; the expert can edit the plan, approve it, and send it back. Approved cases get a "Verified by agronomist" badge and appear in the farmer's case list.
8. **Alerts**: hyperlocal weather, pest outbreak and market price cards using realistic mock data, clearly labeled "sample data". Make them easy to swap for real APIs.
9. **Insights dashboard** (NGO/institution view): anonymised crop-health charts (top diseases this week, cases by district, escalation rate, average response time) from the saved cases plus seeded sample data.

## Design
Warm, trustworthy, agricultural: deep green (#1B7F3B) primary, soft cream background, golden-yellow accent. Rounded cards, large touch targets (min 56px), high contrast, icons with every label (camera, mic, plan, shield). Mobile-first (looks like a WhatsApp-style chat on a phone), responsive on desktop. Accessible and works on low-end devices.

## Important rules
- Voice and photo first; text is optional.
- Uncertainty is escalated, never guessed.
- Show the confidence score on every answer.
- Add a short privacy note: photos and voice are used only to diagnose the crop; no personal data is shown in the insights dashboard.
- Everything WhatsApp, IVR calls and Cloud Run are future steps. For this prototype, make the web app mimic the WhatsApp chat experience, and keep the Gemini call in one clean module so it can later move behind a backend.

Start by building the farmer flow (screens 1-6) end to end, then add the agronomist view, alerts and dashboard.
