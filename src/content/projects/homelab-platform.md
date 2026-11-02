---
title: "Homelab platform: storage, containers, and local AI"
summary: "The Unraid server, network, and GPU inference box that host my family's services, built from parts and run like a small production environment."
tags: ["Unraid", "Docker", "Linux", "UniFi", "Tailscale", "Local LLMs"]
order: 4
---

<!-- ASK NICO: OK to mention that an AI agent running on this hardware assists with operations? Recommended: yes, it is a real skill, and an interviewer may ask. -->

## Problem

I wanted my household's media, photos, documents, and passwords on hardware I control, with the same discipline I would expect at work: backups, monitoring, documented changes, and a way back from any change.

## What I built

- **Server:** Unraid on an Intel i5-12600K with an Intel Arc A770, built from parts. The array has one 8 TB parity drive and three data drives, with a CyberPower 1500 VA UPS for clean shutdowns.
- **Services:** Around 50 to 60 Docker containers, depending on the month: Jellyfin, Immich, Nextcloud, Paperless-ngx, Vaultwarden, Navidrome, MeshCentral, AdGuard, a private search engine, and more. Configuration persists to appdata so containers can be rebuilt.
- **Network:** A UniFi Cloud Gateway with VLANs. Public services go out only through a Cloudflare tunnel, so no inbound ports are open. Admin access goes through Tailscale.
- **Local AI:** An NVIDIA DGX Spark runs a 27B-parameter LLM through SGLang, plus the radio station's text-to-speech. Sensitive and batch work stays on my own hardware.
- **Operations:** An AI agent running on this platform handles routine checks, writes daily health notes, and drafts changes. I review every change before it is applied.

## How I run it

- **Least-destructive fix first:** repair over remove, restart over reboot, configuration change over hardware swap.
- **Measure before tuning.** For example, I swept the LLM server's memory settings and kept the setting that left the most headroom on a box other people also use.
- **Write it down.** Every service has a living runbook with ports, gotchas, and verification commands, kept in my Nextcloud.
- **Plan for failure.** A Cloudflare Worker serves an outage page when the server is down (see [the project page](/projects/cloudflare-offline-page/)), and an offsite Proxmox node is being set up as a backup target and outside monitoring point.

## What I'd do differently

I'd build in offsite backups from day one instead of adding them after the fact. Parity protects against a dead drive, not against a dead house.
