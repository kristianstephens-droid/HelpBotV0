#!/usr/bin/env python3
"""Apply vision-verified mini-step names to blocker-SOP images, keep how-to
images on their section+order names, and emit a bot-facing step map."""

import json, os, csv, shutil

recs = json.load(open("labeled_images/manifest.json"))
by_order = {r["order"]: r for r in recs}
MEDIA = "unpacked/word/media"
OUT = "images"
shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT, exist_ok=True)

# order# -> (new_name, sop, bot_step, shows)  [vision-verified]
MINI = {
    1:  ("daily-login__01-okta-flex-production-tile", "Daily Flex Login", "Open Okta + click Flex Production tile", "Okta dashboard with the Twilio Flex Production tile"),
    2:  ("daily-login__02-vt-login-page", "Daily Flex Login", "Log into VT to refresh session", "Varsity Tutors Sign In page"),
    3:  ("quotes-flashing__01-contact-fields-phone-zip", "Quotes Flashing", "Fill missing phone / zip on the lead", "Lead contact panel showing phone number and ZIP fields"),
    4:  ("refresh-data__01-WRONG-browser-reload-drops-call", "Refresh Data Safely", "Do NOT use the browser reload (drops the call)", "Flex Contacts page with the browser reload button highlighted"),
    5:  ("refresh-data__02-lm-panel-refresh-data-button", "Refresh Data Safely", "Use the Refresh Data button in the LM panel", "Lead Management panel with the Refresh Data button highlighted"),
    6:  ("vt-logout__01-login-popup-appears", "VT Logout Pop-up", "The VT login pop-up appears mid-shift", "VT api.varsitytutors.com sign-in pop-up over a 403 error"),
    7:  ("vt-logout__02-session-expired-banner", "VT Logout Pop-up", "Session-expired banner / click Sign In top-right", "Flex banner: VTWA session has expired, please sign in again"),
    8:  ("vt-logout__03-email-sign-in-with-google", "VT Logout Pop-up", "Enter email, click Sign in with Google", "Sign in dialog with email field and Sign in with Google"),
    9:  ("quotes-greyed__01-send-quote-greyed-symptom", "Send Quote Greyed Out", "Symptom: Send Quote button is greyed out", "LM panel with the Send Quote button greyed out"),
    10: ("quotes-greyed__02-open-lead-information", "Send Quote Greyed Out", "Open the Lead Information tab", "LM panel with the Lead Information tab highlighted"),
    11: ("quotes-greyed__03-additional-info-status", "Send Quote Greyed Out", "Scroll to Additional Information, check Status", "Additional Information section showing the Status field"),
    12: ("quotes-greyed__04-status-dropdown-open", "Send Quote Greyed Out", "Open the Status dropdown", "Status dropdown open showing Active and Declined reasons"),
    13: ("quotes-greyed__05-status-set-active", "Send Quote Greyed Out", "Set status to Active", "Additional Information with Status set to Active"),
    14: ("quotes-greyed__06-send-quote-reenabled-refresh", "Send Quote Greyed Out", "Send Quote re-enabled (or hit Refresh)", "LM panel with Send Quote enabled and the Refresh button"),
    15: ("flex-unresponsive__01-clear-cache-all-time", "Flex Unresponsive", "Clear cache & cookies — All Time", "Chrome Delete browsing data dialog set to All time"),
    16: ("account-found__01-client-info-vtwa", "Account Found / Payment Blocked", "Open the client page in VTWA (Client Info)", "VTWA Client Info panel with the .com email"),
    17: ("account-found__02-client-info-email-com-to-org", "Account Found / Payment Blocked", "Change .com to .org in Client Info", "Client Info with the email changed to .org"),
    18: ("account-found__03-student-info-email-com-to-org", "Account Found / Payment Blocked", "Do the same in Student Info", "Student Info panel where the email is also swapped"),
    19: ("audio__step1__01-system-volume", "Audio: Step 1 System Volume", "Check Mac system volume (Control Center)", "Control Center with the Sound volume slider"),
    20: ("audio__step2__01-open-system-settings", "Audio: Step 2 Output & Input Devices", "Open Apple menu -> System Settings", "Apple menu with System Settings highlighted"),
    21: ("audio__step2__02-output-tab-usb-headset", "Audio: Step 2 Output & Input Devices", "Output tab: select your USB headset", "Sound > Output tab showing the USB headset selected"),
    22: ("audio__step2__03-input-tab-mic", "Audio: Step 2 Output & Input Devices", "Input tab: select mic, input volume up", "Sound > Input tab showing the mic selected"),
    23: ("audio__step3__01-open-system-settings", "Audio: Step 3 Microphone Privacy", "Open Apple menu -> System Settings", "Apple menu with System Settings highlighted"),
    24: ("audio__step3__02-privacy-and-security", "Audio: Step 3 Microphone Privacy", "Go to Privacy & Security", "System Settings > Privacy & Security list (Microphone row)"),
    25: ("audio__step3__03-microphone-chrome-toggle-on", "Audio: Step 3 Microphone Privacy", "Microphone: Chrome toggle must be on", "Microphone privacy panel with the Chrome toggle on"),
    26: ("audio__step4__01-chrome-site-mic-allow", "Audio: Step 4 Chrome Permissions", "Chrome address-bar permissions: Mic = Allow", "Chrome site-permissions popup for Flex with Microphone allowed"),
    27: ("outbound-threshold__01-status-symptom", "Outbound Attempt Threshold", "Symptom: status reads outbound_attempt_threshold", "Additional Information with Status outbound_attempt_threshold"),
    28: ("outbound-threshold__02-status-dropdown-pick-declined", "Outbound Attempt Threshold", "Open Status, pick any declined reason", "Status dropdown open showing declined reasons"),
    29: ("outbound-threshold__03-status-active-reenabled", "Outbound Attempt Threshold", "Set status back to Active (buttons re-enable)", "Additional Information with Status Active and buttons enabled"),
}

step_map = {}   # sop -> ordered list of mini-steps
full = []

for order, rec in sorted(by_order.items()):
    ext = os.path.splitext(rec["media_file"])[1]
    if order in MINI:
        slug, sop, bot_step, shows = MINI[order]
        new_name = slug + ext
        rec_out = {
            "order": order, "new_name": new_name, "media_file": rec["media_file"],
            "type": "blocker-ministep", "sop": sop, "bot_step": bot_step, "shows": shows,
            "suggested_path": f"/images/flex-guide/{new_name}",
        }
        step_map.setdefault(sop, []).append({
            "bot_step": bot_step, "image": new_name, "shows": shows,
            "suggested_path": f"/images/flex-guide/{new_name}",
        })
    else:
        new_name = rec["new_name"]  # keep section+order name
        rec_out = {
            "order": order, "new_name": new_name, "media_file": rec["media_file"],
            "type": "howto", "sop": rec["section"], "bot_step": "", "shows": rec["preceding_text"][:120],
            "suggested_path": f"/images/flex-guide/{new_name}",
        }
    shutil.copy2(os.path.join(MEDIA, rec["media_file"]), os.path.join(OUT, new_name))
    full.append(rec_out)

# write outputs
fields = ["order", "new_name", "type", "sop", "bot_step", "shows", "media_file", "suggested_path"]
with open(os.path.join(OUT, "manifest.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore"); w.writeheader()
    for r in full: w.writerow(r)
with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(full, f, indent=2)
with open(os.path.join(OUT, "step_map.json"), "w") as f:
    json.dump(step_map, f, indent=2)

print(f"Total images written: {len(full)}")
print(f"  blocker mini-step images: {sum(1 for r in full if r['type']=='blocker-ministep')}")
print(f"  how-to images:            {sum(1 for r in full if r['type']=='howto')}")
print()
print("Step map (blocker SOPs the bot walks one at a time):")
for sop, steps in step_map.items():
    print(f"\n  {sop}  ({len(steps)} mini-steps)")
    for s in steps:
        print(f"     - {s['bot_step']}")
