---
title: "Outage notification page for self-hosted services"
summary: "A Cloudflare Worker that displays a clear outage notice and a report form when my home server is unavailable, in place of a generic Cloudflare error."
tags: ["Cloudflare Workers", "JavaScript", "DNS", "Incident response"]
order: 2
---

## Background

All 13 of my public services (media, photos, documents, password management, search, and others) run through a single Cloudflare Tunnel to a single server. When that server or one of its containers went down, users received a generic Cloudflare 5xx error. They had no way to tell whether the problem was their device, their network, or the server, and no simple way to report it.

## Solution

I deployed a Cloudflare Worker in front of the tunnel at Cloudflare's edge, attached to each public hostname through a Workers Route.

When the origin responds normally, the Worker passes the request through unchanged. When it does not (an upstream 502, 503, or 504, any status from 521 to 527, a 530, or a failed connection), the Worker returns a 503 with a short page that identifies the service and links to a report form. The form link is pre-filled with the hostname, so each report identifies the affected service.

Because Cloudflare serves the page, it remains available even when the server is fully powered off.

## Key decisions

- Workers Routes instead of DNS changes. Pointing DNS records at the Worker would have broken the tunnel's ingress rules. A route sits in front of existing traffic and can be removed with a single API call.
- One route per hostname. A wildcard route requires the paid Workers plan, and thirteen individual routes fit well within the free tier.
- Configuration kept out of the code. The form URL and per-site wording are stored as JSON in a plain-text environment binding, so updates do not require a code change.
- Output escaping. Hostnames and configuration values are HTML-escaped before rendering, which I verified in the rendered output as well as in the code.

## Testing

To test the outage path without taking anything offline, I pointed one service's tunnel ingress at an unused port, confirmed that the outage page and pre-filled form appeared, and then restored the ingress. I also confirmed that healthy services continued to return their normal status codes.

## Lessons learned

I would add external monitoring at the same time, so that I am alerted to an outage before a user has to report it. That is one of the roles planned for the offsite node I am currently setting up.
