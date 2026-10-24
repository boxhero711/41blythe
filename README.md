# 41 Blythe: smart home

One place for the house's TV, lights, cameras and lock, and a dashboard on the TV to see all of it.

| Device | How it joins | Shows up on the TV as |
|---|---|---|
| Smart TV (Android TV / Google TV) | Cleaned with [cleanyourtv](https://github.com/Gathin23/cleanyourtv) (submodule in `tv/cleanyourtv`) | The clean launcher, plus the two cards below |
| Lutron light switches | Home Assistant, **Lutron Caséta** integration (or **Lutron** for RadioRA 2) | Smart Home card: OK toggles, ◀ ▶ dims |
| Lorex cameras | NVR RTSP streams → **Frigate** (recording + person detection) → Home Assistant | Frigate Glance pop-ups over whatever is playing; camera grid on the dashboard |
| Yale smart lock | Home Assistant, **Yale** integration (or Z-Wave / Yale Access Bluetooth) | Locked / unlocked and battery. **Never unlockable from the TV.** |

## How it fits together

```
 Lutron bridge ─┐
 Yale lock ─────┼──► Home Assistant ──► TV: "Smart Home" card (cleanyourtv add-on)
 Lorex NVR ─RTSP─► Frigate ─MQTT─┘  │     TV: full dashboard (cast, homeassistant/config/dashboards/tv.yaml)
                     │               └──► phones: Home Assistant app
                     └─────MQTT────────► TV: "Frigate Glance" camera pop-ups
```

Everything runs on one small always-on computer at home (the **hub**). Nothing needs a cloud account
except the Yale integration's login and, optionally, Nabu Casa for casting and remote access.

## Order of work

1. **Fill in [`docs/devices.md`](docs/devices.md)**: TV model, Lutron line, Lorex NVR model, Yale model.
   Each choice below depends on it.
2. **Hub**: [`homeassistant/SETUP.md`](homeassistant/SETUP.md). Home Assistant, Mosquitto and Frigate,
   then the Lutron, Yale and Lorex integrations.
3. **TV**: [`tv/README.md`](tv/README.md). Debloat and the clean launcher with cleanyourtv, then the
   Smart Home and Frigate Glance add-ons pointed at the hub.
4. **Dashboard on the TV**: the last section of [`tv/README.md`](tv/README.md).

The TV and the hub steps must be run from a computer **on the house Wi-Fi**: ADB and the device
integrations are local-network only.

## Getting this repo

```bash
git clone --recurse-submodules https://github.com/boxhero711/41blythe
# already cloned without it:
git submodule update --init
```

## What never goes in git

Tokens, passwords, TV backups and screenshots. `.gitignore` covers `secrets.yaml`, `.env`, `backup/`,
`shots/` and Home Assistant's runtime state. Copy the `*.example*` files and fill in the copies.
