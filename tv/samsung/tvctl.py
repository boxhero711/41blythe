#!/usr/bin/env python3
"""Talk to the Samsung TV over its network remote API (ports 8001/8002), from a computer on the house Wi-Fi.

  python3 -m venv venv && venv/bin/pip install -r requirements.txt
  export TV_HOST=<tv ip>
  venv/bin/python tvctl.py info                 # model, firmware year, Developer Mode, power (no pairing)
  venv/bin/python tvctl.py pair                 # accept "Allow" on the TV; the token is saved to .token
  venv/bin/python tvctl.py apps                 # installed apps and their IDs
  venv/bin/python tvctl.py launch <app id>      # open an app
  venv/bin/python tvctl.py browse <url>         # open a page in the TV's web browser (the dashboard)
  venv/bin/python tvctl.py key KEY_HOME ...     # press remote buttons (KEY_UP, KEY_ENTER, KEY_RETURN, ...)
  venv/bin/python tvctl.py privacy              # walk through the privacy settings, one screen at a time

It sends remote-control keys and app launches only: it cannot uninstall or change anything a person
with the remote couldn't. The token in .token is a remote control for the TV; it is git-ignored.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(HERE, ".token")
NAME = "41 Blythe"

# What `info` prints. The reply also carries the DUID, MAC addresses and the TV's name: kept off screen
# so they don't end up pasted into chats or issues.
INFO_FIELDS = ["modelName", "model", "OS", "firmwareVersion", "PowerState", "developerMode", "developerIP",
               "TokenAuthSupport", "networkType", "VoiceSupport", "resolution"]

# Settings → Support → Terms & Policy on 2020 (T-NKM) firmware; names shift a little between versions.
PRIVACY_STEPS = [
    ("Settings → Support → Terms & Policy → Viewing Information Services",
     "Turn OFF. This is ACR: it reports what is on screen, HDMI inputs included."),
    ("Settings → Support → Terms & Policy → Interest-Based Advertisement",
     "Turn OFF, then choose Reset PSID if offered (drops the advertising ID)."),
    ("Settings → Support → Terms & Policy → Voice Recognition Services",
     "Turn OFF unless the family uses Bixby or the remote's mic."),
    ("Settings → Support → Terms & Policy → Privacy Notice / Smart Hub Terms",
     "Leave as is: declining the Smart Hub terms switches off the app store and streaming apps."),
    ("Settings → General → Smart Features → Autorun Smart Hub",
     "Turn OFF, so the TV stops opening Samsung's home screen with its promoted rows at power-on."),
    ("Settings → General → Smart Features → Autorun Last App",
     "Turn ON, so the TV comes back to what you were watching (or the house dashboard app)."),
    ("Settings → General → Network → Expert Settings → Power On with Mobile",
     "Turn ON, so Home Assistant can switch the TV on."),
    ("Settings → Support → Software Update → Auto Update",
     "Leave ON: security fixes."),
]


def host():
    h = os.environ.get("TV_HOST")
    if not h:
        sys.exit("set TV_HOST to the TV's IP address, e.g. export TV_HOST=192.168.1.115")
    return h


def remote(timeout=10):
    try:
        from samsungtvws import SamsungTVWS
    except ImportError:
        sys.exit("missing library: venv/bin/pip install -r requirements.txt")
    # 8002 is the TLS port; 2016+ sets hand out a token there once "Allow" is accepted.
    return SamsungTVWS(host(), port=8002, token_file=TOKEN_FILE, timeout=timeout, name=NAME)


def cmd_info(_args):
    import urllib.request
    try:
        with urllib.request.urlopen("http://%s:8001/api/v2/" % host(), timeout=5) as r:
            reply = json.load(r)
    except OSError as e:
        sys.exit("No answer from %s:8001 (%s). Is the TV on, and this computer on the same Wi-Fi?" % (host(), e))
    device = reply.get("device", {})
    for field in INFO_FIELDS:
        if field in device:
            print("%-18s %s" % (field, device[field]))
    print("%-18s %s" % ("api version", reply.get("version", "?")))


def cmd_pair(_args):
    print("Look at the TV: choose Allow on the prompt that appears (30 s).")
    tv = remote(timeout=30)
    tv.open()
    tv.close()
    if os.path.exists(TOKEN_FILE):
        os.chmod(TOKEN_FILE, 0o600)
        print("Paired. Token saved to", TOKEN_FILE)
    else:
        print("Connected without a token (older firmware); later commands will work but may ask again.")


def cmd_apps(_args):
    tv = remote()
    apps = tv.app_list() or []
    tv.close()
    if not apps:
        print("The TV returned no app list (some firmware doesn't answer this).")
    for app in sorted(apps, key=lambda a: str(a.get("name", "")).lower()):
        print("%-28s %s" % (app.get("appId"), app.get("name")))


def cmd_launch(args):
    if len(args) != 1:
        sys.exit("usage: tvctl.py launch <app id>   (IDs from: tvctl.py apps)")
    tv = remote()
    tv.run_app(args[0])
    tv.close()


def cmd_browse(args):
    if len(args) != 1 or not args[0].startswith(("http://", "https://")):
        sys.exit("usage: tvctl.py browse http://<hub ip>:8123/dashboard-tv/home")
    tv = remote()
    tv.open_browser(args[0])
    tv.close()


def cmd_key(args):
    if not args:
        sys.exit("usage: tvctl.py key KEY_HOME [KEY_RIGHT ...]")
    tv = remote()
    for k in args:
        tv.send_key(k if k.startswith("KEY_") else "KEY_" + k.upper())
    tv.close()


def cmd_privacy(_args):
    tv = remote()
    print("Pick up the TV remote. For each screen: open it, set it, then press Enter here.\n")
    tv.send_key("KEY_MENU")
    for i, (where, what) in enumerate(PRIVACY_STEPS, 1):
        print("%d/%d  %s\n      %s" % (i, len(PRIVACY_STEPS), where, what))
        input("      Enter when done (Ctrl-C to stop) ")
    tv.send_key("KEY_HOME")
    tv.close()
    print("Done. Take a photo of anything you want to be able to set back.")


COMMANDS = {"info": cmd_info, "pair": cmd_pair, "apps": cmd_apps, "launch": cmd_launch,
            "browse": cmd_browse, "key": cmd_key, "privacy": cmd_privacy}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        sys.exit(__doc__)
    COMMANDS[sys.argv[1]](sys.argv[2:])
