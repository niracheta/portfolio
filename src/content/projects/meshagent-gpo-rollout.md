---
title: "Self-healing remote-support agent rollout with Group Policy"
summary: "An idempotent PowerShell check, run by a GPO scheduled task, that installs and repairs a remote-support agent on every domain workstation."
tags: ["Active Directory", "Group Policy", "PowerShell", "MeshCentral"]
order: 3
draft: true
---

<!-- ASK NICO: OK to publish this? Written with no employer name, server names, share paths, OU names, or device counts. -->

## Problem

Remote-support agents were missing or broken on part of the workstation fleet. The existing repair script ran a full uninstall and reinstall every time it ran. That works for fixing one machine by hand, but as a recurring task it would reinstall healthy agents and could change their device identity in the management console.

## Options I weighed

| Approach | Reaches offline machines later | Repairs drift |
|---|---|---|
| One-time push (PsExec / Invoke-Command) | No | No |
| GPO software install or startup script | Only at reboot | No |
| GPO scheduled task running a check script | Yes, at startup and every few hours | Yes |

I chose the scheduled task. Laptops that rarely reboot still pick it up, and it repairs a machine that breaks later.

## What I built

`Ensure-MeshAgent.ps1` runs as SYSTEM and does the least it can:

- **Agent missing:** install it from a read-only network share.
- **Service stopped or not set to Automatic:** fix the service and leave the install alone, so the device keeps its identity.
- **Agent pointing at the wrong server:** reinstall, but only if the config file is readable and clearly wrong.
- **Healthy:** do nothing and exit.

Every action is written to a small local log that rotates itself.

## Rollout and verification

- I tested on two machines first, one without the agent and one with a healthy agent. Only the first counts as an install test. On the second, a pass means the script ran and left it alone.
- "SUCCESS: Attempted to run" from `schtasks` only means Windows started the task, so I checked the log and the console instead.
- I verify coverage by comparing Active Directory computer objects against agents in the console. Whatever is still missing after the task has had time to run is a real problem: a wrong OU, a machine that never comes online, or a stale AD object.
- I also learned to keep the agent out of golden images. An agent baked in before sysprep gives every clone the same identity.

## What I'd do differently

I'd check the server side first. Some stragglers were old agents that couldn't update because automatic agent updates were turned off on the server.
