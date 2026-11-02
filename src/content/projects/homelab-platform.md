---
title: "My homelab: storage, containers, and local AI"
summary: "The Unraid server, network, and GPU box that run my family's services. I built it from parts and run it the way I'd want a production environment run."
tags: ["Unraid", "Docker", "Linux", "UniFi", "Tailscale", "Local LLMs"]
order: 4
---

## Why

I wanted my family's media, photos, documents, and passwords on hardware I control, and I wanted to run it with the same habits I'd expect at work: backups, monitoring, changes that are written down, and a way to undo any of them.

## What's in it

The server runs Unraid on an Intel i5-12600K with an Intel Arc A770, which I built from parts. The array has one 8 TB parity drive and three data drives, and a CyberPower 1500 VA UPS gives it time to shut down cleanly when the power goes out.

On top of that run somewhere between 50 and 60 Docker containers, depending on the month: Jellyfin, Immich, Nextcloud, Paperless-ngx, Vaultwarden, Navidrome, MeshCentral, AdGuard, a private search engine, and more. Each container keeps its config in appdata, so I can rebuild any of them from scratch.

The network is a UniFi Cloud Gateway with VLANs. Public services only leave through a Cloudflare tunnel, so there are no open inbound ports, and I do admin work over Tailscale.

For local AI, an NVIDIA DGX Spark runs a 27B-parameter model through SGLang, along with the radio station's text-to-speech. Anything sensitive, and most batch work, stays on hardware I run instead of going to a cloud API.

An AI agent running on the platform handles the routine checks, writes daily health notes, and drafts changes. I review every change before it goes in.

## How I run it

- Least destructive fix first: repair before remove, restart before reboot, config change before hardware swap.
- Measure before tuning. When I tuned the LLM server's memory settings, I tested a range and kept the one that left the most headroom, since other people run workloads on the same box.
- Write it down. Every service has a runbook in my Nextcloud with its ports, its quirks, and the commands to check it's working.
- Plan for failure. A Cloudflare Worker shows an outage page when the server is down ([write-up here](/projects/cloudflare-offline-page/)), and I'm setting up an offsite Proxmox node to be a backup target and an outside monitoring point.

## What I'd do differently

Offsite backups from day one, instead of adding them later. Parity covers a dead drive. It doesn't cover a dead house.
