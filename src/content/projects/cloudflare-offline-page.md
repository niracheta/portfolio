---
title: "Edge outage page for self-hosted services"
summary: "A Cloudflare Worker that shows a branded outage page with a report form when my home server is down, instead of a raw Cloudflare error."
tags: ["Cloudflare Workers", "JavaScript", "DNS", "Incident response"]
order: 2
---

## Problem

All 13 of my public services (media, photos, documents, password vault, search, and others) go through one Cloudflare tunnel to one server. When that server or a container goes down, family members get a raw Cloudflare 5xx error page. They can't tell whether the problem is their phone, their network, or my server, and they don't have an easy way to tell me.

## What I built

A Cloudflare Worker, attached to each public hostname by a Workers Route. It runs at Cloudflare's edge, in front of the tunnel:

- **Origin healthy:** the Worker passes the request through untouched.
- **Origin down** (upstream 502, 503, 504, 521 to 527, 530, or a failed fetch): the Worker returns a 503 with a short page that names the service and links to a report form. The form URL already includes the hostname, so I know which service the report is about.

The page is served by Cloudflare, so it works even when my server is powered off.

## Design choices

- **Routes, not DNS changes.** Pointing DNS records at the Worker would have broken the tunnel's ingress rules. A route sits in front of everything and comes off with one API call.
- **Per-hostname routes on the free plan.** A single wildcard route needs Workers Paid. Thirteen routes fit well inside the free tier's limits.
- **Configuration in an environment binding.** The form URL and any per-site wording are JSON in a plain-text binding, so changes don't require a code edit.
- **HTML-escaped output.** Hostnames and config values are escaped before rendering. I checked this against real rendered output, not just the code.

## Testing

I tested the outage path without powering anything off. I pointed one service's tunnel ingress at a dead port, loaded the page, confirmed the outage page and the pre-filled form, and then restored the ingress. I also checked that a healthy service still returned its normal status code.

## What I'd do differently

I'd add synthetic monitoring from outside my network at the same time, so I hear about an outage before a family member reports it. That is now part of a separate offsite monitoring node I'm setting up.
