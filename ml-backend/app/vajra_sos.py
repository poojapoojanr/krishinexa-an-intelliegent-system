"""
 AI-Powered Emergency Weather Alert System for Farmers
Features:
- Fetches farmers' contact emails from Firebase Firestore
- Sends email alerts to farmers using configured SMTP
- Automated Weather Alerts for agriculture protection
- Uses OpenWeatherMap for accurate weather data
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore
import schedule
import time
import requests
from datetime import datetime
from typing import Optional, List, Dict
from dotenv import load_dotenv
from app.alert_email_service import send_email_alert
import hashlib

load_dotenv()

# Configuration
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
# OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# Firebase initialization flag
_firebase_initialized = False
_db = None


def get_firestore_client():
    """Get or initialize Firestore client"""
    global _firebase_initialized, _db
    
    if _db is not None:
        return _db
    
    try:
        # Check if Firebase is already initialized
        if not _firebase_initialized:
            # Try to get existing app or initialize new one
            try:
                firebase_admin.get_app()
            except ValueError:
                # Initialize with service account
                cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                else:
                    # Initialize without credentials (for local development)
                    firebase_admin.initialize_app()
            _firebase_initialized = True
        
        _db = firestore.client()
        return _db
    except Exception as e:
        print(f"🔥 Firebase initialization error: {e}")
        return None


def get_farmers_from_firestore() -> List[Dict]:
    """Fetch all farmers with alerts enabled from Firestore"""
    try:
        db = get_firestore_client()
        if not db:
            return []
        
        farmers = []
        # Query users collection for farmers who have opted in for alerts
        users_ref = db.collection("users").where("allowAlerts", "==", True).stream()
        
        for doc in users_ref:
            user_data = doc.to_dict()
            # Prefer email for alerts; fall back to phone only if email missing
            if "district" in user_data:
                email = user_data.get("email") or user_data.get("emailAddress")
                phone = user_data.get("phone")
                if not email and not phone:
                    # skip users without any contact
                    continue

                farmers.append({
                    "uid": doc.id,
                    "name": f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}".strip() or "Farmer",
                    "email": email,
                    "phone": phone,
                    "district": user_data.get("district"),
                    "language": user_data.get("language", "en"),
                })
        
        print(f"📋 Found {len(farmers)} farmers with alerts enabled")
        return farmers
    except Exception as e:
        print(f"🔥 Error fetching farmers: {e}")
        return []


def get_district_coordinates(district: str) -> Optional[tuple]:
    """Get latitude/longitude for a district using geocoding"""
    try:
        # Use OpenWeatherMap's geocoding API
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={district},Karnataka,IN&limit=1&appid={OPENWEATHER_API_KEY}"
        response = requests.get(url, timeout=10)
        
        if response.ok:
            data = response.json()
            if data:
                return (data[0]["lat"], data[0]["lon"])
        
        # Fallback: Karnataka district coordinates
        KARNATAKA_DISTRICTS = {
            "bangalore": (12.9716, 77.5946),
            "bengaluru": (12.9716, 77.5946),
            "mysore": (12.2958, 76.6394),
            "mysuru": (12.2958, 76.6394),
            "mangalore": (12.9141, 74.8560),
            "mangaluru": (12.9141, 74.8560),
            "hubli": (15.3647, 75.1240),
            "dharwad": (15.4589, 75.0078),
            "belgaum": (15.8497, 74.4977),
            "belagavi": (15.8497, 74.4977),
            "shimoga": (13.9299, 75.5681),
            "shivamogga": (13.9299, 75.5681),
            "tumkur": (13.3379, 77.1173),
            "tumakuru": (13.3379, 77.1173),
            "davangere": (14.4644, 75.9218),
            "hassan": (13.0072, 76.0962),
            "mandya": (12.5218, 76.8951),
            "kodagu": (12.3375, 75.8069),
            "coorg": (12.3375, 75.8069),
            "chitradurga": (14.2251, 76.3980),
            "kolar": (13.1362, 78.1292),
            "chikmagalur": (13.3161, 75.7720),
            "chikkamagaluru": (13.3161, 75.7720),
            "udupi": (13.3409, 74.7421),
            "raichur": (16.2120, 77.3439),
            "bellary": (15.1394, 76.9214),
            "ballari": (15.1394, 76.9214),
            "bijapur": (16.8302, 75.7100),
            "vijayapura": (16.8302, 75.7100),
            "gulbarga": (17.3297, 76.8343),
            "kalaburagi": (17.3297, 76.8343),
            "bidar": (17.9104, 77.5199),
            "gadag": (15.4166, 75.6303),
            "haveri": (14.7951, 75.3991),
            "dakshina kannada": (12.9141, 74.8560),
            "uttara kannada": (14.5000, 74.5000),
            "koppal": (15.3500, 76.1500),
            "ramanagara": (12.7226, 77.2810),
            "yadgir": (16.7704, 77.1380),
            "chamarajanagar": (11.9261, 76.9437),
        }
        
        district_lower = district.lower().strip()
        return KARNATAKA_DISTRICTS.get(district_lower)
    except Exception as e:
        print(f"🔥 Geocoding error for {district}: {e}")
        return None


def get_weather_data(latitude: float, longitude: float) -> Optional[Dict]:
    """Fetch current weather data from OpenWeatherMap API"""
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        if response.ok:
            return response.json()
        return None
    except Exception as e:
        print(f"🔥 Weather API error: {e}")
        return None


def get_forecast_data(latitude: float, longitude: float) -> Optional[List[Dict]]:
    """Fetch 3-hourly forecast (next 5 days) and trim to next 24h for alert logic"""
    try:
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&appid={OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url, timeout=10)
        if not response.ok:
            return None

        data = response.json()
        now = datetime.utcnow().timestamp()
        next_24h = []
        for item in data.get("list", []):
            ts = item.get("dt")
            if ts and 0 <= ts - now <= 24 * 3600:
                next_24h.append(item)
        return next_24h or None
    except Exception as e:
        print(f"🔥 Forecast API error: {e}")
        return None


def check_weather_alerts(current_weather: Dict, forecast_24h: Optional[List[Dict]]) -> Optional[str]:
    """Analyze current + next-24h forecast and generate concise, actionable alerts"""
    if not current_weather:
        return None

    alerts = []
    # Current snapshot
    main = current_weather.get("main", {})
    weather = current_weather.get("weather", [{}])[0]
    wind = current_weather.get("wind", {})

    temp = main.get("temp", 0)
    humidity = main.get("humidity", 0)
    wind_speed = wind.get("speed", 0)
    weather_desc = (weather.get("description", "") or "").lower()

    # Forecast stats (next 24h)
    temps = [temp]
    humidities = [humidity]
    rain_slots = []
    wind_slots = []
    if forecast_24h:
        for item in forecast_24h:
            main_f = item.get("main", {})
            temps.append(main_f.get("temp", temp))
            humidities.append(main_f.get("humidity", humidity))
            rain_val = (item.get("rain", {}) or {}).get("3h") or 0
            wind_val = (item.get("wind", {}) or {}).get("speed") or 0
            ts = item.get("dt_txt") or item.get("dt")
            if rain_val > 0:
                rain_slots.append((rain_val, ts))
            if wind_val >= 9:
                wind_slots.append((wind_val, ts))

    max_temp = max(temps)
    min_temp = min(temps)
    max_humidity = max(humidities)
    high_humidity_hours = sum(1 for h in humidities if h >= 80)
    total_rain = sum(r[0] for r in rain_slots)
    heavy_rain_slots = [r for r in rain_slots if r[0] >= 10]

    def fmt_time(ts) -> str:
        try:
            if isinstance(ts, (int, float)):
                dt = datetime.utcfromtimestamp(ts)
            else:
                dt = datetime.strptime(str(ts), "%Y-%m-%d %H:%M:%S")
            return dt.strftime("%d %b, %I %p").lstrip("0").replace(" 0", " ")
        except Exception:
            return "soon"

    # Temperature alerts
    if max_temp >= 38:
        alerts.append(f"🔥 Heatwave risk {max_temp:.0f}°C. Avoid 11-4, increase irrigation, shade tender crops.")
    elif max_temp >= 34:
        alerts.append(f"☀️ Hot day {max_temp:.0f}°C. Irrigate early morning/evening to reduce stress.")
    if min_temp <= 12:
        alerts.append(f"❄️ Cold night {min_temp:.0f}°C. Protect seedlings; avoid late-evening irrigation.")
    if max_temp - min_temp >= 12:
        alerts.append(f"📊 Large temp swing ({min_temp:.0f}–{max_temp:.0f}°C). Maintain soil moisture to buffer stress.")

    # Rain alerts
    if total_rain >= 20:
        alerts.append(f"🌧️ Heavy rain ~{total_rain:.1f}mm next 24h. Ensure drainage; postpone spraying/fertilizer.")
    elif total_rain >= 5:
        alerts.append(f"🌦️ Moderate rain ~{total_rain:.1f}mm. Good soil moisture; plan field work before showers.")
    elif total_rain > 0:
        alerts.append(f"💧 Light rain ~{total_rain:.1f}mm. Minor benefit; plan spray 4-6h before rain.")

    if heavy_rain_slots:
        times = ", ".join(fmt_time(ts) for _, ts in heavy_rain_slots[:2])
        alerts.append(f"⏰ Heavy bursts expected around {times}. Secure inputs, cover harvested produce.")
    if rain_slots:
        times = ", ".join(fmt_time(ts) for _, ts in rain_slots[:2])
        alerts.append(f"⏰ Rain likely around {times}. Schedule spraying/harvest before then.")
    elif max_humidity >= 80 and high_humidity_hours >= 3:
        alerts.append(f"💨 Prolonged humidity ({high_humidity_hours}h >80%). Improve airflow; monitor fungal spots.")

    # Wind alerts
    if wind_speed >= 12 or any(w[0] >= 12 for w in wind_slots):
        alerts.append("💨 Strong winds. Avoid spraying; secure lightweight structures and support tall plants.")
    elif wind_speed >= 8 or any(w[0] >= 9 for w in wind_slots):
        alerts.append("🍃 Moderate winds. Check wind direction before spraying; stake tall crops if needed.")

    # Fog/mist
    if "fog" in weather_desc or "mist" in weather_desc:
        alerts.append("🌫️ Low visibility due to fog. Be cautious during transport/field work.")

    # Fallback: pleasant conditions
    if not alerts:
        alerts.append("✅ Conditions favorable. Good window for sowing/field operations.")

    # Keep SMS concise
    return " | ".join(alerts[:3]) if alerts else None


def _infer_severity(alert_text: str) -> str:
    t = (alert_text or "").lower()
    if any(k in t for k in ["heatwave", "heavy rain", "heavy bursts", "strong winds", "frost", "cold night"]):
        return "high"
    if any(k in t for k in ["moderate rain", "hot day", "large temp swing", "high disease risk", "moderate winds", "fog"]):
        return "medium"
    return "low"


def _stable_id(district: str, alert_text: str) -> str:
    raw = f"{district.strip().lower()}::{alert_text.strip()}".encode("utf-8")
    return hashlib.sha1(raw).hexdigest()[:16]


def get_inapp_alerts_for_district(district: str) -> Dict:
    """Generate VajraSOS weather alerts for in-app notifications (no SMS).

    Returns a structured payload safe for polling from the frontend.
    """
    district_name = (district or "").strip()
    if not district_name:
        return {"district": district_name, "generatedAt": datetime.utcnow().isoformat(), "alerts": []}

    coords = get_district_coordinates(district_name)
    if not coords:
        return {
            "district": district_name,
            "generatedAt": datetime.utcnow().isoformat(),
            "alerts": [],
            "error": f"Could not resolve coordinates for {district_name}",
        }

    weather_data = get_weather_data(coords[0], coords[1])
    forecast_data = get_forecast_data(coords[0], coords[1])
    if not weather_data:
        return {
            "district": district_name,
            "generatedAt": datetime.utcnow().isoformat(),
            "alerts": [],
            "error": "Could not fetch weather data",
        }

    alert_text = check_weather_alerts(weather_data, forecast_data)
    if not alert_text:
        return {"district": district_name, "generatedAt": datetime.utcnow().isoformat(), "alerts": []}

    # current condition summary to include in the payload
    main_now = weather_data.get("main", {})
    weather_now = (weather_data.get("weather", [{}])[0] or {})
    condition_text = (weather_now.get("description") or "").capitalize()
    temp_now = main_now.get("temp")

    parts = [p.strip() for p in alert_text.split("|") if p.strip()]
    now_iso = datetime.utcnow().isoformat()
    alerts = []
    for part in parts:
        alerts.append(
            {
                "id": _stable_id(district_name, part),
                "title": f"VajraSOS • {district_name}",
                "message": part,
                "currentCondition": {
                    "description": condition_text,
                    "temp_c": temp_now,
                },
                "type": "weather",
                "icon": "Cloud",
                "severity": _infer_severity(part),
                "time": now_iso,
            }
        )

    return {
        "district": district_name,
        "generatedAt": now_iso,
        "currentCondition": {"description": condition_text, "temp_c": temp_now},
        "alerts": alerts,
    }





def send_email_notification(to_email: str, subject: str, message: str) -> bool:
    """Send notification email using alert_email_service (synchronous)."""
    try:
        ok = send_email_alert(to_email, subject, message)
        if ok:
            print(f"📩 Email sent to {to_email}")
        else:
            print(f"⚠️ Email send failed for {to_email}")
        return bool(ok)
    except Exception as e:
        print(f"🔥 Error sending email to {to_email}: {e}")
        return False


def log_alert_to_firestore(farmer_uid: str, alert_message: str, email_sent: bool, condition: Optional[Dict] = None):
    """Log alert to Firestore for history tracking"""
    try:
        db = get_firestore_client()
        if not db:
            return
        payload = {
            "userId": farmer_uid,
            "message": alert_message,
            "emailSent": bool(email_sent),
            "timestamp": datetime.utcnow().isoformat(),
            "type": "weather",
        }
        if condition:
            payload["condition"] = condition

        db.collection("alerts").add(payload)
    except Exception as e:
        print(f"🔥 Error logging alert: {e}")


def monitor_weather_and_send_alerts():
    """Main function to monitor weather for all farmers and send alerts"""
    print("\n" + "="*50)
    print(f"🔄 VajraSOS Weather Check - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)
    
    farmers = get_farmers_from_firestore()
    
    if not farmers:
        print("⚠️ No farmers found with alerts enabled")
        return {"checked": 0, "alerts_sent": 0}
    
    alerts_sent = 0
    
    for farmer in farmers:
        try:
            print(f"\n👨‍🌾 Checking: {farmer['name']} ({farmer['district']})")
            
            # Get coordinates for district
            coords = get_district_coordinates(farmer['district'])
            if not coords:
                print(f"  ⚠️ Could not get coordinates for {farmer['district']}")
                continue
            
            # Get weather data (current + forecast)
            weather_data = get_weather_data(coords[0], coords[1])
            forecast_data = get_forecast_data(coords[0], coords[1])
            if not weather_data:
                print(f"  ⚠️ Could not fetch weather data")
                continue
            
            # Check for alerts
            alert = check_weather_alerts(weather_data, forecast_data)
            
            if alert:
                print(f"  ⚠️ ALERT: {alert[:100]}...")
                # Send email (email-only flow)
                email = farmer.get('email')
                if not email:
                    print(f"  ⚠️ Skipping {farmer['uid']}: no email")
                else:
                    subject = f"KrishiNexa Alert for {farmer.get('district')}"
                    # Prepend a short current-condition summary to the email body
                    main_now = weather_data.get("main", {})
                    weather_now = (weather_data.get("weather", [{}])[0] or {})
                    condition_text = (weather_now.get("description") or "").capitalize()
                    temp_now = main_now.get("temp")
                    condition_summary = f"Current: {condition_text}"
                    if temp_now is not None:
                        condition_summary += f" · {temp_now:.1f}°C"

                    email_body = f"{condition_summary}\n\n{alert}"
                    email_sent = send_email_notification(email, subject, email_body)
                    log_alert_to_firestore(
                        farmer['uid'], alert, email_sent, condition={"description": condition_text, "temp_c": temp_now}
                    )
                    if email_sent:
                        alerts_sent += 1
            else:
                print(f"  ✅ Weather normal - no alerts needed")
                
        except Exception as e:
            print(f"  🔥 Error processing farmer {farmer['name']}: {e}")
    
    print(f"\n📊 Summary: Checked {len(farmers)} farmers, sent {alerts_sent} alerts")
    return {"checked": len(farmers), "alerts_sent": alerts_sent}


def start_vajra_sos_service(interval_hours: int = 1):
    """Start the VajraSOS background service"""
    print("🌾 VajraSOS Service Starting...")
    print(f"📅 Will check weather every {interval_hours} hour(s)")
    
    # Run immediately
    monitor_weather_and_send_alerts()
    
    # Schedule periodic runs
    schedule.every(interval_hours).hours.do(monitor_weather_and_send_alerts)
    
    print("\n🌾 VajraSOS is running. Press Ctrl+C to stop.\n")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n🛑 VajraSOS service stopped by user")


# FastAPI endpoint integration
async def trigger_weather_alerts():
    """Trigger weather alert check (for API endpoint)"""
    return monitor_weather_and_send_alerts()


if __name__ == "__main__":
    start_vajra_sos_service()
