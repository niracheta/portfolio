---
title: "Keeping a remote-support agent installed with Group Policy"
summary: "A PowerShell check, run as a GPO scheduled task, that installs the remote-support agent where it's missing and repairs it where it's broken, without touching healthy machines."
tags: ["Active Directory", "Group Policy", "PowerShell", "MeshCentral"]
order: 3
---

## The problem

The remote-support agent was missing or broken on some of the domain workstations. The existing repair script did a full uninstall and reinstall every time it ran. That's fine when you're fixing one machine by hand, but as a recurring task it would keep reinstalling healthy agents and could give them a new device identity in the management console.

## Options I weighed

| Approach | Reaches offline machines later | Repairs drift |
|---|---|---|
| One-time push (PsExec / Invoke-Command) | No | No |
| GPO software install or startup script | Only at reboot | No |
| GPO scheduled task running a check script | Yes, at startup and every few hours | Yes |

I went with the scheduled task. Laptops that almost never reboot still get it, and it catches machines that break later on.

## What I built

`Ensure-MeshAgent.ps1` runs as SYSTEM and is idempotent: it does the smallest thing that fixes the machine, and nothing at all if the machine is fine.

- If the agent is missing, it installs it from a read-only network share.
- If the service is stopped or not set to Automatic, it fixes the service and leaves the install alone, so the device keeps its identity.
- If the agent is pointed at the wrong server, it reinstalls, but only when the config file is readable and clearly wrong.
- If everything is healthy, it exits without changing anything.

Each run writes to a small local log that rotates itself.

## Rollout and verification

- I tested on two machines first: one without the agent and one with a healthy agent. Only the first one really tests the install. On the second, passing just means the script ran and left the agent alone, which is exactly what it should do.
- When `schtasks` says "SUCCESS: Attempted to run," that only means Windows started the task, not that it worked. I checked the log and the console to see what actually happened.
- To confirm coverage, I compare the computer objects in Active Directory against the agents in the console. Anything still missing once the task has had time to run is a real problem: a wrong OU, a machine that never comes online, or a stale AD object.
- One lesson I'm keeping: leave the agent out of golden images. If it's installed before sysprep, every clone comes up with the same identity.

## What I'd do differently

Check the server side first. Some of the stragglers turned out to be old agents that couldn't update themselves, because automatic agent updates were turned off on the server.
