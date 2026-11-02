---
title: "Automated remote-support agent deployment with Group Policy"
summary: "An idempotent PowerShell script, run as a GPO scheduled task, that installs the remote-support agent where it is missing and repairs it where it is broken."
tags: ["Active Directory", "Group Policy", "PowerShell", "MeshCentral"]
order: 3
---

## Background

The remote-support agent was missing or malfunctioning on a portion of the domain workstations. The existing repair script performed a full uninstall and reinstall on every run. That approach is acceptable for a one-off manual fix, but as a recurring task it would reinstall healthy agents and could assign them new device identities in the management console.

## Options considered

| Approach | Reaches offline machines later | Repairs drift |
|---|---|---|
| One-time push (PsExec / Invoke-Command) | No | No |
| GPO software install or startup script | Only at reboot | No |
| GPO scheduled task running a check script | Yes, at startup and every few hours | Yes |

I selected the scheduled task. It reaches laptops that are rarely rebooted, and it corrects machines that develop problems later.

## Solution

`Ensure-MeshAgent.ps1` runs as SYSTEM and is idempotent: it takes the smallest action needed to bring a machine into compliance, and no action if the machine is already healthy.

- If the agent is missing, the script installs it from a read-only network share.
- If the service is stopped or not set to Automatic, the script corrects the service configuration without reinstalling, so the device keeps its identity.
- If the agent is configured for the wrong server, the script reinstalls it, but only when the configuration file is readable and clearly incorrect.
- If the agent is healthy, the script exits without making changes.

Every action is recorded in a small, self-rotating local log.

## Rollout and validation

- I piloted the script on two machines: one without the agent and one with a healthy agent. The first validated the install path, and the second confirmed that the script leaves a healthy agent untouched.
- A `schtasks` result of "SUCCESS: Attempted to run" confirms only that Windows started the task, so I verified the outcome in the log and the management console.
- I measure coverage by comparing Active Directory computer objects against the agents registered in the console. Any machine still missing after the task has had time to run points to a specific issue: an incorrect OU, a machine that is rarely online, or a stale AD object.
- The agent should be excluded from golden images. An agent installed before sysprep gives every cloned machine the same identity.

## Lessons learned

I would review the server configuration first. Some of the remaining machines had outdated agents that could not update because automatic agent updates were disabled on the server.
