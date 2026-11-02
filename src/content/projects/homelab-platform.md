---
title: "Homelab infrastructure: storage, containers, and local AI"
summary: "The Unraid server, network, and GPU system that host my household's services, assembled from components and operated with production practices."
tags: ["Unraid", "Docker", "Linux", "UniFi", "Tailscale", "Local LLMs"]
order: 4
---

## Background

I wanted my household's media, photos, documents, and passwords hosted on hardware I control, and managed with the practices I would expect in a professional environment: backups, monitoring, documented changes, and a rollback path for every change.

## Components

The server runs Unraid on an Intel Core i5-12600K with an Intel Arc A770, assembled from individual components. The array consists of one 8 TB parity drive and three data drives, and a CyberPower 1500 VA UPS allows a clean shutdown during a power outage.

The server hosts 50 to 60 Docker containers, depending on current projects, including Jellyfin, Immich, Nextcloud, Paperless-ngx, Vaultwarden, Navidrome, MeshCentral, AdGuard Home, and a private search engine. Container configuration is persisted to appdata, so any container can be rebuilt from scratch.

The network runs on a UniFi Cloud Gateway with VLANs. Public services are published only through a Cloudflare Tunnel, so no inbound ports are open, and remote administrative access goes through Tailscale.

For local AI, an NVIDIA DGX Spark runs a 27-billion-parameter language model through SGLang, along with the radio station's text-to-speech service. Sensitive and batch workloads run on local hardware rather than a cloud API.

An AI agent running on the platform performs routine health checks, writes daily status notes, and drafts proposed changes. I review every change before it is applied.

## Operating practices

- Least disruptive fix first: repair before removal, a service restart before a reboot, and a configuration change before a hardware replacement.
- Measure before tuning. When tuning the LLM server's memory allocation, I tested a range of settings and kept the one that preserved the most headroom, because the system is shared with other users.
- Document everything. Each service has a runbook in Nextcloud covering ports, known issues, and verification commands.
- Plan for failure. A Cloudflare Worker serves an outage page when the server is unavailable ([project write-up](/projects/cloudflare-offline-page/)), and I am setting up an offsite Proxmox node as a backup target and external monitoring point.

## Lessons learned

I would implement offsite backups from the start rather than adding them later. Parity protects against a drive failure, but not against the loss of the entire site.
