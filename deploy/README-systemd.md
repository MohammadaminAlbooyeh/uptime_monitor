Install systemd service to run docker-compose at boot

1. Copy the unit file to systemd and reload:

```bash
sudo cp deploy/uptime-monitor.service /etc/systemd/system/uptime-monitor.service
sudo systemctl daemon-reload
```

2. Enable and start the service:

```bash
sudo systemctl enable --now uptime-monitor.service
```

3. Check status and logs:

```bash
sudo systemctl status uptime-monitor.service
sudo journalctl -u uptime-monitor.service -f
```

Notes:
- If your project path is different than `/home/amin/Documents/MyProjects/uptime_monitor`, edit the `WorkingDirectory` and `ExecStart` paths in the unit file.
- The unit assumes `docker` CLI is at `/usr/bin/docker`. Adjust if different on your Pi.
