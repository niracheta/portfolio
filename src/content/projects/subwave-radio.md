---
title: "Self-hosted AI radio station"
summary: "A 24/7 internet radio station with LLM-written DJ breaks, local text-to-speech on a GPU box, and a public stream behind a Cloudflare tunnel."
tags: ["Docker", "Cloudflare", "Icecast", "TTS", "Python", "LLM"]
order: 1
---

## Problem

I wanted a radio station for my household that sounded like a real one: a music library on my own server, DJ personas that talk between songs, and a stream anyone in the family could open on a phone. Cloud text-to-speech works, but it bills per character and every break is sent to a third party.

## What I built

- The station runs as a container on my Unraid server and streams through Icecast.
- DJ scripts come from an LLM. The voices are rendered by Chatterbox Turbo, an open-source TTS model, running on a separate NVIDIA GPU box reached over Tailscale.
- A small Python adapter ("shim") sits between the station and the TTS server. It translates the station's `/speak` and `/health` contract to the TTS server's API.
- The public stream is published through a Cloudflare tunnel, so no ports are open on my router. A Cloudflare rate-limit rule protects the stream endpoint.

## Problems I solved along the way

**Every listener showed the same IP.** The station and the tunnel connector sat on different Docker networks, so every listener appeared as the Docker gateway address. I configured the station's Caddy reverse proxy to trust forwarded headers only from the Docker subnet. Listener logs now show real client IPs.

**False alarms hid a real fault.** The shim sent `X-TTS-Fell-Back: false` on every healthy render. The station checks that header for truthiness, and the string "false" is truthy in JavaScript, so every correct render was logged as a failure. That noise buried the one persona whose voice really was being swapped. I changed the shim to send the header only when a fallback happened, and to read the live voice list from the TTS server instead of a hardcoded copy.

**The DJs mispronounced things.** I measured intelligibility by transcribing renders of 11 real on-air lines with Whisper and scoring word error rate (WER). Then I changed one variable at a time:

| Shim setting | WER |
|---|---|
| Original (150-character chunks, no text prep) | 8.1% |
| Text prep + 120-character chunks | 7.7% |
| Text prep + 100-character chunks (deployed) | 2.8% |

Text prep turns times and numbers into words, splits CamelCase, and turns semicolons and dashes into plain pauses. I also tested a newer model, Breeze TTS 2, against the same lines. It scored 17.7% WER, cut off 3 of 11 lines, and ran slower than real time on this GPU, so I kept Chatterbox.

## Results

- Word error rate down from 8.1% to 2.8% on the same test set.
- Every change is behind a switch in the shim and has a backed-up rollback, so I can turn any of them off without redeploying.

## What I'd do differently

I would build the measurement harness first. Most of the early tuning was done by ear, and the Whisper-scored test set gave clearer answers in an afternoon than weeks of listening had.
