# KrishiSetu: project context (optional reference file to attach in AI Studio)

Team: Arpan Chakraborty, Avishek Das Karmakar. Event: Startup Buildathon India 2026, Open Innovation.

## Problem
Smallholder farmers lose an estimated 20-40% of crops because expert advice arrives too late. Roughly 1 expert serves 10,000+ farmers. Most digital tools need reading, typing and standard language.

## Solution
A voice-first AI companion. A farmer sends a photo of a sick crop or a voice note in their own dialect (WhatsApp or phone call). Gemini reads the photo and understands the voice, checks trusted sources (BRRI, BARI, FAO) through RAG, and replies with a simple action plan, as voice plus text. If confidence is low, a human agronomist reviews the case before the farmer hears anything.

## Features
- Photo diagnosis (Gemini multimodal)
- Voice in local dialect (Gemini Live, two-way)
- WhatsApp, calls (IVR) and a light mobile app
- Trusted-source answers (RAG on BRRI, BARI, FAO; Vertex AI Search)
- Confidence score plus expert check
- Weather, pest and price alerts
- Privacy controls

## Process flow
Farmer sends photo/voice -> gateway detects channel and language -> Gemini analyses -> facts checked with a confidence score -> if confident, plan sent as voice + text; if not, human agronomist reviews and a verified answer goes back.

## Full architecture (future)
Channels (WhatsApp, IVR, light app) -> Cloud Run gateway -> Gemini API + Gemini Live -> Vertex AI Search (RAG) + confidence scoring + human agronomist review -> Firestore (case history) -> BigQuery (anonymised crop-health dashboard for NGOs and institutions).

## Business model
Free for farmers (diagnosis, alerts, basic advice). Expert consult BDT 20-50. NGOs and government fund programmes in underserved districts. Companies (lenders, insurers, input firms) pay for anonymised crop-health insights.

## Prototype metrics to measure (results still to be added)
Diagnosis accuracy (Gemini vs agronomist labels on 200 real crop photos), response time, dialect voice understanding, escalation rate, farmer usefulness rating.

## Targets (not results)
50,000 farmers in 12 months, 20% less crop loss, 30% better selling prices.

## Roadmap
Weeks 1-4: build prototype, test Gemini on 200 crop photos. Weeks 5-9: add WhatsApp and phone support, pilot in 2 upazilas. Weeks 10-12: 5 districts plus expert network. Markets: Bangladesh now, then India (West Bengal, Bihar, Odisha), then Vietnam and Indonesia.
