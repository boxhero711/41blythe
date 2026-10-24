# The Samsung TV (QN82Q850TAFXZA)

An 82" Samsung from 2020 running **Tizen**, not Android. cleanyourtv can't debloat it or replace its home
screen: Tizen has no ADB, no shell to disable apps with, and no way for another app to take the Home
button. (cleanyourtv's own notes on Samsung sets: `cleanyourtv/docs/devices/samsung-tizen.md`.)

There is no "developer mode IP" to connect to for that reason. Samsung's Developer Mode only lets a
computer install Samsung-signed test apps; it does not open a debloat path.

Three things do work, best first.

## 1. A Google TV Streamer on HDMI (recommended)

Plug a **Google TV Streamer** (or Chromecast with Google TV, or Nvidia Shield) into one of the Samsung's
HDMI ports and use it for all watching. That device is Android, so everything in [`README.md`](README.md)
applies to it: the cleanyourtv debloat and clean home screen, the Smart Home card, Frigate Glance camera
pop-ups, and casting the dashboard (it has Chromecast built in).

- Turn on **Anynet+ (HDMI-CEC)** on the Samsung (Settings → General → External Device Manager) so the
  streamer's remote turns the TV on and off and changes the volume.
- Set the Samsung to start on that HDMI: Settings → General → Smart Features → **Autorun Smart Hub off**,
  **Autorun Last App on**. Then the Samsung home screen rarely appears.
- Use the streamer's IP address, not the Samsung's, for `TV_HOST` and `adb connect`.

## 2. Quiet the Samsung's own ads and tracking (do this either way)

With the Samsung remote. Menu names shift a little between firmware versions; on 2020 sets:

| Setting | Where | Set to |
|---|---|---|
| Viewing Information Services (ACR: reports what's on screen) | Settings → Support → Terms & Policy | Off |
| Interest-Based Advertisement | Settings → Support → Terms & Policy | Off |
| Voice Recognition Services | Settings → Support → Terms & Policy | Off, unless you use Bixby |
| Autorun Smart Hub | Settings → General → Smart Features | Off |
| Auto Run on Smart Hub apps / "Recommended" rows | Home → Apps → ⚙ on each preinstalled app | Remove from Home where offered |
| Software update | Settings → Support → Software Update | Leave Auto Update **on** (security fixes) |

Photograph each screen before changing it, so you can set it back.

## 3. Block ad and tracking domains on the network

Samsung's ads and telemetry come from Samsung servers, so a DNS blocker removes most of what's left:

1. On the hub, install **AdGuard Home** (Home Assistant OS: Settings → Add-ons → AdGuard Home; Docker: the
   `adguard/adguardhome` image). Add Samsung blocklists, e.g. the "Smart-TV" list in AdGuard's blocklist
   picker.
2. Point only the TV at it, so nothing else in the house is affected: on the Samsung, Settings → General →
   Network → Network Status → **IP Settings** → DNS Setting **Enter manually** → the hub's IP.
3. Check Netflix, YouTube and the Samsung app store still work. If one breaks, unblock the domain AdGuard
   shows for it, or set DNS back to **Obtain automatically**.

This doesn't block YouTube's in-video ads; nothing at the DNS level can.

## Home Assistant control

The **Samsung Smart TV** integration (see `../homeassistant/SETUP.md`, section 6) turns the TV on and off,
changes volume and inputs, and can launch apps. Accept the **Allow** prompt on the TV when it appears.
For it to turn the TV *on*, keep Settings → General → Network → Expert Settings → **Power On with Mobile**
on.

## Give it a fixed address

In the router, reserve the TV's current IP for its MAC address (DHCP reservation), so Home Assistant and
AdGuard rules keep working. Keep the serial number, MAC and DUID out of this repo and out of public posts.
