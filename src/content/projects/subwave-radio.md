---
title: "Self-hosted AI radio station"
summary: "A 24/7 internet radio station with AI-generated DJ segments, speech synthesized on local GPU hardware, and a public stream published through a Cloudflare Tunnel."
tags: ["Docker", "Cloudflare", "Icecast", "TTS", "Python", "LLM"]
order: 1
---

## Background

I wanted a household radio station that behaved like a commercial one: music from my own library, DJ segments between songs, and a stream that family members could open on a phone. Cloud text-to-speech services would have worked, but they bill per character and send every script to a third party, so I chose to run speech synthesis locally.

## Architecture

The station runs as a container on my Unraid server and streams through Icecast. An LLM writes the DJ segments, and Chatterbox Turbo, an open-source TTS model, renders them to audio on a separate NVIDIA GPU system reached over Tailscale.

Because the station and the TTS server use different APIs, I wrote a small Python adapter (the "shim") that translates the station's `/speak` and `/health` calls into requests the TTS server accepts.

The public stream is published through a Cloudflare Tunnel, so no ports are forwarded on my router, and a Cloudflare rate-limiting rule protects the stream endpoint.

## Issues resolved

### All listeners reported the same IP address

The station and the tunnel connector were on different Docker networks, so every listener appeared as the Docker gateway address. I configured the station's Caddy reverse proxy to trust forwarded headers only from the Docker subnet. The logs now record real client IP addresses.

### Successful renders logged as failures

The shim sent `X-TTS-Fell-Back: false` on every successful render. The station only checks whether that header has a value, and in JavaScript the string "false" evaluates as true, so every successful render was logged as a fallback. That noise concealed the one persona whose voice actually was being substituted. I changed the shim to send the header only when a fallback occurs, and to read the voice list from the TTS server rather than from a hardcoded copy.

### Pronunciation errors

To measure intelligibility objectively, I rendered 11 real on-air lines, transcribed the audio with Whisper, and scored the word error rate (WER). I then changed one setting at a time:

| Shim setting | WER |
|---|---|
| Original (150-character chunks, no text preparation) | 8.1% |
| Text preparation + 120-character chunks | 7.7% |
| Text preparation + 100-character chunks (deployed) | 2.8% |

Text preparation spells out times and numbers, splits CamelCase words, and converts semicolons and dashes into plain pauses. The data showed that chunk size was the deciding factor: the first round of changes reduced WER only slightly, while reducing chunks from 120 to 100 characters brought it down to 2.8%.

I also evaluated a newer model, Breeze TTS 2, against the same lines. It scored 17.7% WER, truncated 3 of the 11 lines, and could not render faster than real time on this GPU, so I kept Chatterbox.

## Results

- Word error rate reduced from 8.1% to 2.8% on a fixed test set.
- Each change is controlled by its own setting in the shim and has a backup for rollback, so any change can be disabled without redeploying.

## Lessons learned

I would build the measurement harness at the start. Early tuning was done by ear over several weeks, and the Whisper-scored test set produced clearer answers in a single afternoon.
