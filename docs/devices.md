# Device inventory

Fill this in first. Each answer picks a path in the setup guides. Do not put passwords, serial numbers
or IP addresses here; this file is committed. Addresses go in `homeassistant/.env` and `secrets.yaml`.

## TV

| Question | Answer | Why it matters |
|---|---|---|
| Brand and model (on the back label, or Settings → About) | Samsung QN82Q850TAFXZA, 82" (Q80T-class, 2020) | cleanyourtv has a tested list per model in `tv/cleanyourtv/examples/` |
| OS: Android TV / Google TV, Samsung Tizen, LG webOS, Fire TV, Roku? | Samsung Tizen (2020 firmware): see [`tv/samsung.md`](../tv/samsung.md) | Debloat + launcher need **Android TV or Google TV**. Fire TV: debloat only. Tizen / webOS / Roku: no cleanyourtv; use an external streamer (Chromecast with Google TV, Shield) on HDMI and clean that instead |
| Wi-Fi or Ethernet? Anything in the TV's USB ports? | | USB debugging can cut power to USB ports (see `tv/cleanyourtv/PROMPT.md`) |
| Apps the family uses (Netflix, YouTube, Live TV, ...) | | Kept enabled during the debloat |

## Lutron

| Question | Answer | Path |
|---|---|---|
| System: Caséta (Smart Bridge / Smart Bridge PRO), RadioRA 2, RadioRA 3, HomeWorks QSX? | | Caséta, RA3, QSX → **Lutron Caséta** integration. RadioRA 2 → **Lutron** integration (main repeater) |
| Number of dimmers / switches / Pico remotes | | |

## Lorex

| Question | Answer | Path |
|---|---|---|
| NVR or DVR model (sticker on the recorder), or Wi-Fi cameras with no recorder? | | NVR/DVR → RTSP into Frigate. Wi-Fi-only Lorex cameras often have **no RTSP**: check the model's manual before buying anything for this |
| Number of cameras and where they point | | Names in `homeassistant/frigate/config.yml` |
| Doorbell? (Lorex 2K / 4K doorbell) | | Doorbells usually stream RTSP too; add as one more camera |

## Yale

| Question | Answer | Path |
|---|---|---|
| Model (Assure Lock 2, Assure SL, Approach, Linus, Unity, ...) | | |
| Which module is in it: Wi-Fi / Yale Access (Yale Home app), Z-Wave, Zigbee, Matter, or Bluetooth only? | | Wi-Fi → **Yale** integration. Bluetooth → **Yale Access Bluetooth** (needs the offline key, and a hub within Bluetooth range or an ESPHome proxy). Z-Wave → Z-Wave USB stick + **Z-Wave** integration. Matter → **Matter** integration |

## Hub

| Question | Answer |
|---|---|
| Computer that stays on (Home Assistant Green, Raspberry Pi 5, mini PC) | |
| Running Home Assistant OS, or Docker on Linux? | |
| Free disk for camera recordings (Frigate) | |

Recommendation if nothing is bought yet: an Intel N100 mini PC (16 GB RAM, 512 GB+ SSD) running Home
Assistant OS, with Frigate as an add-on. A Raspberry Pi or Home Assistant Green runs everything except
Frigate on more than one or two cameras.
