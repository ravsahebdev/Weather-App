# 🌤️ Weather App

A fully responsive, multi-page weather application built with pure Vanilla JavaScript — no frameworks, no shortcuts. Real-time weather data, custom canvas animations, interactive maps, and a polished UI crafted entirely from scratch.

---

## 🌐 Live Demo

🔗 [ravsahebdev.github.io/Weather-App](https://ravsahebdev.github.io/Weather-App/)

💻 **GitHub:** [github.com/ravsahebdev/weather-app](https://github.com/ravsahebdev/weather-app)

---

## ✨ Features

* 🌡️ Real-time weather data — current temperature, condition, feels like, wind, UV index, AQI
* 🌙 Dynamic Day / Night sky — custom Canvas API animation with stars, shooting stars, and moving clouds
* 🌤️ Animated weather icons — sun rotation, moon float with glow effect
* 📅 Hourly forecast (6 slots) + 7-day weekly forecast
* 🏙️ City Manager — save, view, and remove up to 15 cities with full weather data (localStorage)
* 🗺️ Interactive World Map — Leaflet.js map with weather markers, user geolocation, and city search
* 📊 Detailed metrics — humidity, pressure, visibility, dew point, cloud cover, sunrise/sunset
* 🧠 Smart advisory cards — Go Outside advisor, Clothing advisor, Air Quality index
* ⚙️ Settings — unit toggles for temperature (°C/°F), wind speed, pressure, precipitation, distance
* 🔄 Auto-refresh every 5 minutes
* 📱 Fully responsive — mobile, tablet, and desktop

---

## 🛠️ Built With

* HTML5, CSS3, JavaScript (ES6+)
* Canvas API — custom animations
* Leaflet.js — interactive maps
* WeatherAPI — live weather data
* Font Awesome 6, Remix Icons, Google Fonts

---

## 📂 Project Structure

```
weather-app/
│
├── index.html           # Main weather page
├── feature.html         # Detailed weather metrics
├── storeCity.html       # Saved cities manager
├── woldMap.html         # Interactive world map
├── setting.html         # Settings & preferences
│
├── app.js               # Core weather logic, API calls, navigation
├── script.js            # Index page controller
├── canvasAnimation.js   # Day / Night canvas sky animation
├── storeCity.js         # City save/remove/display logic
├── worldMap.js          # Leaflet map, markers, geocoding
├── setting.js           # Unit toggle logic
│
├── style.css            # Global shared styles
├── index.css            # Index page styles
├── feature.css          # Feature page styles
├── storeCity.css        # Store city page styles
├── worldMap.css         # World map page styles
├── setting.css          # Settings page styles
├── largScreen.css       # Large screen overrides
├── mediumScreen.css     # Tablet responsive styles
├── responsive.css       # Mobile responsive styles
├── unityResponsive.css  # Shared cross-page responsive rules
│
├── Day.png              # Daytime background
├── night.png            # Nighttime background
└── README.md
```

---

## 📄 Pages

| Page | What it does |
|------|-------------|
| `index.html` | Current weather, hourly + weekly forecast, AQI, advisory cards |
| `feature.html` | Wind direction, cloud cover, visibility, pressure, humidity, dew point, sunrise/sunset |
| `storeCity.html` | Save and manage cities, click to load weather instantly |
| `woldMap.html` | Interactive map with weather markers, geolocation, city search |
| `setting.html` | Unit preferences, notification and location toggles |

---

## 🚀 Getting Started

1. Clone the repository.
2. Open `index.html` in your browser.
3. Search for any city and explore all features.

---

## 💬 A Note from the Developer

This project is the result of genuine hard work and consistency.

Every feature — from the Canvas sky animation that switches between a starry night and a cloudy day, to the city manager with its custom delete animation, to the fully responsive layout that works on every screen size — was built from scratch with Vanilla JavaScript, no frameworks, no shortcuts.

This isn't just a weather app. It's proof that with patience and dedication, you can build something that actually feels polished and real.

If you're a recruiter or a client exploring this project — I hope it gives you a clear picture of the quality and care I bring to my work.

---

## 👨‍💻 Author

**Ravsaheb Dev**
🌐 GitHub: [github.com/ravsahebdev](https://github.com/ravsahebdev)
💼 LinkedIn: [linkedin.com/in/ravsaheb-vagre-47b86a35a](https://www.linkedin.com/in/ravsaheb-vagre-47b86a35a)

---

⭐ If you found this project impressive, consider giving it a Star on GitHub!
