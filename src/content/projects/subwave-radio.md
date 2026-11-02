---
title: "Self-hosted AI radio station"
summary: "A 24/7 internet radio station with AI-written DJ breaks, voices generated on my own GPU box, and a public stream behind a Cloudflare tunnel."
tags: ["Docker", "Cloudflare", "Icecast", "TTS", "Python", "LLM"]
order: 1
---

## Why I built it

I wanted a station for the house that sounds like actual radio: music from my own library, DJs who talk between songs, and a stream anyone in the family can open on their phone. Cloud text-to-speech would have worked, but it charges by the character and sends every DJ break to someone else's servers.

## How it works

The station runs as a container on my Unraid server and streams through Icecast. An LLM writes the DJ breaks, and Chatterbox Turbo, an open-source TTS model, turns them into speech on a separate NVIDIA GPU box that the server reaches over Tailscale.

The station and the TTS server don't speak the same API, so I wrote a small Python adapter (I call it the shim) that translates the station's `/speak` and `/health` calls into requests the TTS server understands.

The public stream goes out through a Cloudflare tunnel, so nothing is port-forwarded on my router, and a Cloudflare rate-limit rule sits in front of the stream endpoint.

## Problems I ran into

### Every listener had the same IP

The station and the tunnel connector were on different Docker networks, so every listener showed up as the Docker gateway address. I set the station's Caddy reverse proxy to trust forwarded headers from the Docker subnet only, and the logs now show real client IPs.

### Healthy renders were logged as failures

The shim sent `X-TTS-Fell-Back: false` on every successful render. The station only checks whether that header has a value, and in JavaScript the string "false" counts as true, so every good render got logged as a fallback. All that noise hid the one DJ whose voice really was being swapped out. Now the shim sends the header only when a fallback actually happens, and it pulls the voice list from the TTS server instead of keeping its own hardcoded copy.

### The DJs mispronounced things

Instead of judging by ear, I took 11 real on-air lines, rendered them, transcribed the audio with Whisper, and scored the word error rate (WER). Then I changed one setting at a time:

| Shim setting | WER |
|---|---|
| Original (150-character chunks, no text prep) | 8.1% |
| Text prep + 120-character chunks | 7.7% |
| Text prep + 100-character chunks (deployed) | 2.8% |

Text prep means spelling out times and numbers, splitting CamelCase words, and swapping semicolons and dashes for plain pauses. The surprise was chunk size: text prep on its own barely moved the number, and dropping from 120 to 100 characters is what took it down to 2.8%.

I also tried a newer model, Breeze TTS 2, on the same lines. It scored 17.7% WER, cut off 3 of the 11 lines, and couldn't keep up with real time on this GPU, so Chatterbox stayed.

## Where it landed

WER went from 8.1% to 2.8% on the same test set. Each change has its own switch in the shim and a backup to roll back to, so I can turn any of them off without redeploying.

## What I'd do differently

Build the test harness first. I spent weeks tuning by ear, and the Whisper-scored test set answered more in one afternoon than all that listening did.
