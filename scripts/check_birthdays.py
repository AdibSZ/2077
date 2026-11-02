#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SYS.2077 // STEALTH BIRTHDAY NOTIFICATION SCRIPT
Runs daily at 07:00 AM Iran Time (03:30 UTC)
Calculates Solar/Jalali birthdates and dispatches stealth Web Push notifications
to all personnel EXCLUDING the person whose birthday is upcoming/today.
"""

import os
import sys
import json
import logging
from datetime import datetime
import jdatetime
import requests
from pywebpush import webpush, WebPushException

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] SYS.2077 // %(message)s"
)

# Persian Month Names Lookup
PERSIAN_MONTH_NAMES = {
    1: "فروردین",
    2: "اردیبهشت",
    3: "خرداد",
    4: "تیر",
    5: "مرداد",
    6: "شهریور",
    7: "مهر",
    8: "آبان",
    9: "آذر",
    10: "دی",
    11: "بهمن",
    12: "اسفند"
}

def get_env_or_fail(key: str, default: str = None) -> str:
    val = os.getenv(key, default)
    if not val:
        logging.warning(f"Environment variable '{key}' is not set!")
    return val

def send_push_notification(subscription_info: dict, payload: dict, vapid_private_key: str, vapid_claims: dict):
    """Sends a Web Push notification to a given browser subscription."""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=vapid_private_key,
            vapid_claims=vapid_claims
        )
        logging.info("Push notification sent successfully.")
        return True
    except WebPushException as ex:
        logging.error(f"Failed to send webpush: {ex}")
        if ex.response and ex.response.status_code:
            logging.error(f"Status code: {ex.response.status_code}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error sending push: {e}")
        return False

def main():
    logging.info("Initializing 2077 Stealth Birthday Protocol...")

    supabase_url = get_env_or_fail("SUPABASE_URL")
    supabase_key = get_env_or_fail("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY"))
    vapid_private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    vapid_claims_email = os.getenv("VAPID_CLAIMS_EMAIL", "admin@store2077.ir")

    if not supabase_url or not supabase_key:
        logging.error("Supabase credentials missing! Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)

    # 1. Determine Current Jalali Date in Tehran Timezone (+03:30)
    today_jalali = jdatetime.date.today()
    logging.info(f"Today's Jalali Date: {today_jalali.year}/{today_jalali.month:02d}/{today_jalali.day:02d} ({PERSIAN_MONTH_NAMES.get(today_jalali.month)})")

    # 2. Fetch all staff members from Supabase
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{supabase_url.rstrip('/')}/rest/v1/profiles?select=*"
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        profiles = response.json()
    except Exception as e:
        logging.error(f"Error fetching profiles from Supabase: {e}")
        sys.exit(1)

    logging.info(f"Loaded {len(profiles)} personnel profiles from database.")

    # 3. Check Birthdays
    notifications_to_send = []

    for person in profiles:
        p_name = person.get("full_name", person.get("username", "همکار"))
        p_id = person.get("id")
        b_day = int(person.get("birth_day", 1))
        b_month = int(person.get("birth_month_num", 1))
        b_month_name = person.get("birth_month") or PERSIAN_MONTH_NAMES.get(b_month, "")

        try:
            # Construct Jalali birthday for current year
            current_year_bday = jdatetime.date(today_jalali.year, b_month, b_day)
        except ValueError:
            # Leap year edge case (e.g. Esfand 30 on non-leap year)
            current_year_bday = jdatetime.date(today_jalali.year, b_month, 29)

        diff_days = (current_year_bday - today_jalali).days

        # Case 1: Birthday is TODAY
        if diff_days == 0:
            logging.info(f"🎂 TODAY is {p_name}'s Birthday! ({b_day} {b_month_name})")
            notifications_to_send.append({
                "target_id": p_id,
                "target_name": p_name,
                "title": "🎉 تبریک تولد همکار ۲۰۷۷",
                "body": f"امروز تولد {p_name} هست! {b_day} {b_month_name} 🎉",
                "tag": f"bday-today-{p_id}",
                "url": "/#staff"
            })

        # Case 2: Birthday is exactly 3 DAYS from today
        elif diff_days == 3:
            logging.info(f"⏰ {p_name}'s Birthday is in 3 days! ({b_day} {b_month_name})")
            notifications_to_send.append({
                "target_id": p_id,
                "target_name": p_name,
                "title": "🎁 یادآوری تولد پرسنل ۲۰۷۷",
                "body": f"تولد {p_name} نزدیکه! {b_day} {b_month_name}!",
                "tag": f"bday-3days-{p_id}",
                "url": "/#staff"
            })

    if not notifications_to_send:
        logging.info("No birthdays today or in 3 days. Protocol complete.")
        return

    # 4. Dispatch Notifications to other personnel (FILTER OUT THE BIRTHDAY PERSON)
    vapid_claims = {"sub": f"mailto:{vapid_claims_email}"}

    for event in notifications_to_send:
        target_id = event["target_id"]
        target_name = event["target_name"]
        payload = {
            "title": event["title"],
            "body": event["body"],
            "icon": "/pwa-192x192.png",
            "badge": "/favicon.svg",
            "tag": event["tag"],
            "data": {
                "url": event["url"],
                "target_id": target_id
            }
        }

        sent_count = 0
        skipped_self_count = 0

        for receiver in profiles:
            receiver_id = receiver.get("id")
            receiver_name = receiver.get("full_name")

            # CRITICAL RULE: FILTER OUT THE BIRTHDAY PERSON THEMSELVES!
            if receiver_id == target_id:
                skipped_self_count += 1
                logging.info(f"🔒 STEALTH: Skipped birthday person {receiver_name} (ID: {receiver_id})")
                continue

            sub_json = receiver.get("push_subscription")
            if not sub_json:
                continue

            # Parse push subscription
            sub_info = sub_json if isinstance(sub_json, dict) else json.loads(sub_json)
            if not sub_info.get("endpoint"):
                continue

            if vapid_private_key:
                success = send_push_notification(sub_info, payload, vapid_private_key, vapid_claims)
                if success:
                    sent_count += 1
            else:
                logging.info(f"Simulating push notification dispatch to {receiver_name}: {payload['body']}")
                sent_count += 1

        logging.info(f"Event for {target_name}: Dispatched to {sent_count} members (Filtered {skipped_self_count} self).")

    logging.info("Stealth Birthday Protocol finished successfully.")

if __name__ == "__main__":
    main()
