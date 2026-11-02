---
title: "A friendlier outage page for my self-hosted services"
summary: "A Cloudflare Worker that shows a plain-English outage page and a report form when my home server is down, instead of a raw Cloudflare error."
tags: ["Cloudflare Workers", "JavaScript", "DNS", "Incident response"]
order: 2
---

## The problem

All 13 of my public services (media, photos, documents, password vault, search, and a few others) run through one Cloudflare tunnel to one server. When that server or one of its containers went down, my family got a raw Cloudflare 5xx error. They couldn't tell whether the problem was their phone, their Wi-Fi, or my server, and there was no easy way for them to let me know.

## What I built

A Cloudflare Worker that sits in front of the tunnel at Cloudflare's edge, attached to each public hostname with a Workers Route.

When the server answers normally, the Worker passes the request through untouched. When it doesn't (a 502, 503, or 504, anything from 521 to 527, a 530, or a request that fails outright), the Worker returns a 503 with a short page that names the service and links to a report form. The form link already has the hostname filled in, so I know which service the report is about.

Because Cloudflare serves that page, it still shows up when my server is completely powered off.

## Decisions along the way

- I used Workers Routes instead of changing DNS. Pointing the DNS records at the Worker would have broken the tunnel's ingress rules, while a route just sits in front of everything and can be removed with one API call.
- I made one route per hostname instead of a single wildcard, because wildcard routes need the paid Workers plan. Thirteen routes fit comfortably in the free tier.
- The form URL and any per-site wording live as JSON in a plain-text environment binding, so changing them doesn't mean touching code.
- Hostnames and config values are HTML-escaped before they go on the page. I checked that in the actual rendered output, not just by reading the code.

## Testing it

I didn't want to power anything off to test it, so I pointed one service's tunnel ingress at a dead port, loaded the page, made sure the outage page and pre-filled form came up, and then put the ingress back. I also confirmed that a healthy service still returned its normal status code.

## What I'd do differently

I'd set up monitoring from outside my network at the same time, so I hear about an outage before a family member has to report it. That's one of the jobs for the offsite node I'm setting up now.
