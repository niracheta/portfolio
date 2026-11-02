---
title: "Self-hosted AI radio station"
summary: "A 24/7 internet radio station with AI-generated DJ segments, speech synthesized on local GPU hardware, and a public stream published through a Cloudflare Tunnel."
tags: ["Docker", "Cloudflare", "Icecast", "TTS", "Python", "LLM"]
order: 1
---

## Background

I wanted a radio station at home that behaved like a commercial one: music from my own library, a DJ talking between songs, and a stream the family could open on their phones. A cloud text-to-speech service would have done the job, but it bills per character and sends every script to a third party. So I run the speech synthesis locally.

## Architecture

The station is a container on my Unraid server, streaming through Icecast. An LLM writes the DJ segments, and Chatterbox Turbo, an open-source TTS model, turns them into audio on a separate NVIDIA GPU box I reach over Tailscale.

The station and the TTS server speak different APIs, so I wrote a small Python adapter (the "shim") that translates the station's `/speak` and `/health` calls into requests the TTS server understands.

The public stream goes out through a Cloudflare Tunnel. No ports are open on the router, and a Cloudflare rate-limiting rule guards the stream endpoint.

## Issues I fixed

### Every listener showed up as the same IP address

The station and the tunnel connector sat on different Docker networks, so every listener logged in as the Docker gateway address. I configured the station's Caddy reverse proxy to trust forwarded headers only from the Docker subnet. The logs now show real client IP addresses.

### Successful renders logged as failures

The shim sent `X-TTS-Fell-Back: false` on every successful render. The station only checks whether that header has a value, and in JavaScript the string "false" counts as true, so every success was logged as a fallback. That noise was hiding the one persona whose voice actually was being swapped. I changed the shim to send the header only when a fallback happens, and to read the voice list from the TTS server instead of a hardcoded copy.

### Pronunciation errors

To measure intelligibility instead of guessing, I rendered 11 real on-air lines, transcribed them with Whisper, and scored the word error rate (WER). Then I changed one thing at a time:

| Shim setting | WER |
|---|---|
| Original (150-character chunks, no text preparation) | 8.1% |
| Text preparation + 120-character chunks | 7.7% |
| Text preparation + 100-character chunks (deployed) | 2.8% |

Text preparation spells out times and numbers, splits CamelCase words, and turns semicolons and dashes into plain pauses. The data made the point: chunk size was the deciding factor. The first round of changes moved WER only slightly, while cutting chunks from 120 to 100 characters brought it down to 2.8%.

I also ran a newer model, Breeze TTS 2, against the same lines. It scored 17.7% WER, cut off 3 of the 11 lines, and could not render faster than real time on this GPU, so I kept Chatterbox.

## Results

- Word error rate down from 8.1% to 2.8% on a fixed test set.
- Every change is behind its own setting in the shim with a backup for rollback, so any of them can be disabled without redeploying.

## Lessons learned

I would build the measurement harness first. The early tuning was done by ear over several weeks, and the Whisper-scored test set gave me clearer answers in a single afternoon.
