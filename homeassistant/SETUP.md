# Hub setup

Home Assistant runs the house; Mosquitto carries messages; Frigate records the Lorex cameras and spots
people. Do this on a computer on the house network. Answers in [`../docs/devices.md`](../docs/devices.md)
decide the branches below.

## 1. Install

### Home Assistant OS (recommended: HA Green, Raspberry Pi 5, or an N100 mini PC)

1. Flash Home Assistant OS ([installation](https://www.home-assistant.io/installation/)), open
   `http://homeassistant.local:8123` and create the owner account.
2. Settings → Add-ons → install **Mosquitto broker** and **File editor** (or **Studio Code Server**).
3. Add-ons → ⋮ → Repositories → add `https://github.com/blakeblackshear/frigate-hass-addons`, install
   **Frigate**. Skip Frigate on HA Green / Raspberry Pi with more than two cameras.
4. Copy this repo's `config/` files (`configuration.yaml`, `automations.yaml`, `scripts.yaml`,
   `scenes.yaml`, `dashboards/`) into `/config`, and `frigate/config.yml` to `/config/frigate.yml`
   (or `/addon_configs/ccab4aaf_frigate/config.yml` on newer add-on versions). In that copy, set
   `mqtt.host` to `core-mosquitto` and replace the `{FRIGATE_*}` placeholders with real values, or set
   them as environment variables in the add-on options.

### Docker on Linux

```bash
cd homeassistant
cp .env.example .env                       # fill in the NVR and MQTT values
touch mosquitto/passwd
docker run --rm -v "$PWD/mosquitto:/m" eclipse-mosquitto:2 mosquitto_passwd -b /m/passwd homeassistant 'PASSWORD-1'
docker run --rm -v "$PWD/mosquitto:/m" eclipse-mosquitto:2 mosquitto_passwd -b /m/passwd frigate      'PASSWORD-2'
docker run --rm -v "$PWD/mosquitto:/m" eclipse-mosquitto:2 mosquitto_passwd -b /m/passwd tv           'PASSWORD-3'
docker compose up -d
```

Open `http://<hub ip>:8123` and create the owner account. Frigate's first admin password is in
`docker logs frigate`.

Give the hub a **fixed IP** in the router (DHCP reservation): the TV add-ons point at it.

## 2. MQTT

Settings → Devices & services → Add integration → **MQTT**. HA OS: accept the discovered Mosquitto add-on.
Docker: host `127.0.0.1`, port `1883`, user `homeassistant`.

## 3. Lutron

| System | Integration | Steps |
|---|---|---|
| Caséta (Smart Bridge or PRO), RadioRA 3, HomeWorks QSX | **Lutron Caséta** | Usually discovered on its own. Add it, then press the small black button on the back of the bridge within 30 s to pair |
| RadioRA 2 | **Lutron** | Main repeater's IP, and a user made in Lutron's RadioRA 2 Essentials/Inclusive software |

Every dimmer and switch becomes a `light.*` or `switch.*`, and Pico remotes become device triggers you
can use in automations. Rename them to match the dashboard: `light.living_room`, `light.kitchen`,
`light.dining_room`, `light.hallway`, `light.porch`, `light.bedroom` (Settings → Entities → the entity
→ ⚙ → Entity ID), or edit `config/dashboards/tv.yaml` and `scenes.yaml` to the names you keep.

## 4. Yale

| Module in the lock | Integration | Notes |
|---|---|---|
| Wi-Fi / Yale Access, set up in the **Yale Home** app | **Yale** | Sign in with the Yale Home account. Cloud, but updates arrive instantly |
| Bluetooth only | **Yale Access Bluetooth** | Local. Needs the lock's offline key (taken from a signed-in Yale integration, or entered by hand) and the hub within Bluetooth range, or an [ESPHome Bluetooth proxy](https://esphome.io/components/bluetooth_proxy.html) near the door |
| Z-Wave | **Z-Wave** | A Z-Wave USB stick on the hub. Add the lock with S2 security (the PIN from the lock's label) |
| Matter (newer Assure Lock 2) | **Matter** | Pair from the Home Assistant phone app with the Matter code |

Name the lock entity `lock.front_door` and its battery `sensor.front_door_battery` to match the
dashboard and automations.

## 5. Lorex cameras

1. Make a user on the NVR just for this (NVR menu → Users, or the Lorex app), and put it in `.env`.
2. Test the stream in VLC: `rtsp://USER:PASS@NVR-IP:554/cam/realmonitor?channel=1&subtype=0`. If it
   fails, try `rtsp://USER:PASS@NVR-IP:554/ch01/0` and change `frigate/config.yml` to that form.
3. Rename the four cameras in `frigate/config.yml` to match the house, add or remove channels, restart
   Frigate, and check every camera shows a picture at `https://<hub ip>:8971`.
4. In Frigate → Settings → Users, add a **viewer** user for the TV (no `-` in the name).
5. In Home Assistant: install [HACS](https://hacs.xyz), then **Frigate** from HACS, restart, and add the
   **Frigate** integration with URL `http://127.0.0.1:5000` (Docker) or `http://ccab4aaf-frigate:5000`
   (HA OS add-on). That creates `camera.front_door`, `binary_sensor.front_door_person_occupancy` and so on.

No Frigate (HA Green / Pi)? Add the **ONVIF** integration with the NVR's address and user instead:
it gives `camera.*` entities and motion events, without person detection. The porch-light automation
needs Frigate's person sensor.

Lorex Wi-Fi cameras without an NVR often have no RTSP. If they don't, they can't join locally; keep
them in the Lorex app.

## 6. The TV as a media player

Google TV and most Android TVs have Chromecast built in. Settings → Devices & services → **Google
Cast** finds them; name the TV `media_player.living_room_tv`. Casting the dashboard needs Home
Assistant on HTTPS: turn on **Home Assistant Cloud** (Nabu Casa) or set `external_url` in
`secrets.yaml` and uncomment it in `configuration.yaml`.

Then **Developer tools → Actions → `script.show_dashboard_on_tv`** puts the dashboard on the TV.
Back on the remote returns to what was playing.

## 7. Check

- Developer tools → YAML → **Check configuration** passes.
- The **TV** dashboard in the sidebar shows lights, the lock and cameras, none of them "Entity not found".
- Walk past the front door after dark: the porch light comes on, and Frigate shows an alert.
