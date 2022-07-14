
# PXM

Long-running commands runner.

Usage:
```
Usage: pxm [options] [command]

Options:
  -h, --help                      display help for command

Commands:
  daemon-start
  daemon-stop
  daemon-status
  set [options] <name> <command>
  get <name>
  list
  start <name>
  stop <name>
  restart <name>
  status <name>
  logs <name>
  help [command]                  display help for command
```

Quick start:
```bash
npm i -g pxm

# Start the daemon
pxm daemon-start

# Add the task to `~/.config/pxm/config.json`
pxm set tunnel-to-remote 'ssh -L localhost:8080:localhost:8080 -N some-remote-host'

# Start the task
pxm start tunnel-to-remote

# Start the task
pxm list

```
