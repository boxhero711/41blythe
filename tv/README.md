# The TV

> **The living-room TV is a Samsung (Tizen), so start with [`samsung/README.md`](samsung/README.md).** The steps
> below are for an Android TV or Google TV device, such as a Google TV Streamer plugged into the
> Samsung's HDMI.

Three parts, in order:

1. **Clean it**: [cleanyourtv](https://github.com/Gathin23/cleanyourtv) (in `cleanyourtv/`) turns off the
   manufacturer's ads, telemetry and preloaded junk and replaces the home screen with a clean launcher.
   Nothing is uninstalled, and one script undoes it all.
2. **Smart Home card**: lights, scenes and the lock's state on the TV, worked with the remote.
3. **Frigate Glance**: a camera pop-up in the corner when someone is at the door, over whatever is playing.

Then the full dashboard, cast from Home Assistant, at the end.

Only **Android TV and Google TV** can do all of this. Fire TV gets the debloat only. Samsung (Tizen),
LG (webOS) and Roku sets can't run any of it: plug a Chromecast with Google TV or an Nvidia Shield into
HDMI and do these steps on that instead.

## What you need

- A computer **on the same Wi-Fi as the TV**, with [Claude Code](https://claude.com/claude-code)
  (or Codex / Gemini CLI), Python 3, and for steps 2 and 3, JDK 17 and the Android SDK (platform 34).
- This repo cloned with `--recurse-submodules`.
- The hub from [`../homeassistant/SETUP.md`](../homeassistant/SETUP.md) running, for steps 2 and 3.
- The TV remote, and about 30 minutes in one sitting.

## 1. Clean the TV

On the TV: Settings → Device Preferences → About → press OK on **Build** seven times → back →
Developer options → **USB debugging** on (and **Network debugging** / **ADB debugging** if shown).

On the computer:

```bash
cd tv/cleanyourtv
python3 -m venv tools/venv && tools/venv/bin/pip install -r tools/requirements.txt
claude
```

Paste the prompt from [`cleanyourtv/PROMPT.md`](cleanyourtv/PROMPT.md) (the part below the line),
with the TV model filled in, and add:

> I cloned the cleanyourtv repo; reuse `tools/` and `launcher/`. Keep: Netflix, YouTube, Live TV and
> HDMI inputs, Chromecast built-in (Home Assistant casts its dashboard to it), Play Store. Put my
> backup in `backup/` and screenshots in `shots/`. Do not close ADB at the end yet: I am installing
> the Smart Home and Frigate Glance add-ons next, and will close it after.

Answer its checklist (which apps you use, dock order, voice assistant, updates). It backs up first,
disables in small batches with screenshots in between, and installs the launcher. To undo everything:
`tools/restore.sh` with the backup it made.

**Keep Chromecast built-in enabled**: the dashboard reaches the TV through it.

## 2. Smart Home card

In Home Assistant: your profile → Security → **Long-lived access tokens** → Create token, named "TV".

```bash
cd tv/cleanyourtv
mkdir -p backup
cp ../smart-home.example.json backup/smart-home.json      # fill in hub IP and the token
TV_HOST=<tv ip> addons/smart-home/install.sh backup/smart-home.json
```

Press Home on the remote and answer **Show card**. The card lists scenes, Lutron lights (OK toggles,
◀ ▶ dims) and the Yale lock's state. It never unlocks a door.

## 3. Frigate Glance

Needs the MQTT user `tv` from the hub setup and the Frigate **viewer** user.

```bash
cp ../frigate-glance.example.json backup/frigate-glance.json   # fill in hub IP, users and passwords
TV_HOST=<tv ip> addons/frigate-glance/install.sh backup/frigate-glance.json
```

It prints `MQTT: ok` and `Frigate: ok`, then shows a test card. Press Home and answer **Show card**.
By default only Frigate alerts (a person or package) open a card; ◀ dismisses, ▶ snoozes for an hour.

`backup/` is git-ignored in both repos. The add-ons delete the pushed file once read.

## 4. Close ADB

Ask the assistant to finish the PROMPT.md close-out: USB and network debugging off, authorisations
revoked, reboot, then `tools/venv/bin/python -I tools/adb-closed.py <tv ip>` must say the port is
closed. Port 5555 left open is full control of the TV for anything on the Wi-Fi.

## 5. The full dashboard on the TV

The Smart Home card is the quick, remote-driven view. For everything on one screen, with live cameras,
cast the **TV** dashboard (`../homeassistant/config/dashboards/tv.yaml`) from Home Assistant:

- On demand: run **Show the home dashboard on the TV** or **Show the cameras on the TV** from the Home
  Assistant app (they are `script.show_dashboard_on_tv` and `script.show_cameras_on_tv`), or say it to
  a voice assistant linked to Home Assistant.
- Automatically: add `script.show_cameras_on_tv` as an action to an automation, for example when the
  doorbell rings. Casting takes over the screen, so for "someone's at the door while we're watching"
  Frigate Glance's corner pop-up is the gentler choice.

Casting needs Home Assistant on HTTPS (Nabu Casa, or your own `external_url`); see section 6 of the hub
setup.
