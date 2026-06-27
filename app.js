// app.js – complete file, ONLY the AQI-display bug fixed, nothing else touched
export let lastDetectedCity = null;
export let lastTemp = null;
export let lastIcon = null;
export let lastTime = null;
export let currentIsDay = null;

export function getLastWeatherData() {
  return { city: lastDetectedCity, temp: lastTemp, icon: lastIcon, time: lastTime };
}

// -----------  MULTI-POLLUTANT AQI  -----------
function getMultiPollutantAQI(data) {
  const pm25 = data.current.air_quality.pm2_5;
  const pm10 = data.current.air_quality.pm10;
  const no2 = data.current.air_quality.no2;
  const o3 = data.current.air_quality.o3;
  const so2 = data.current.air_quality.so2;
  const co = data.current.air_quality.co / 1000;

  function calcAQI(C, bp) {
    for (let b of bp) {
      if (C >= b.cp_lo && C <= b.cp_hi) {
        return Math.round(
          ((b.i_hi - b.i_lo) / (b.cp_hi - b.cp_lo)) * (C - b.cp_lo) + b.i_lo
        );
      }
    }
    return 0;
  }

  const BP_PM25 = [
    { cp_lo: 0, cp_hi: 30, i_lo: 0, i_hi: 50 },
    { cp_lo: 31, cp_hi: 60, i_lo: 51, i_hi: 100 },
    { cp_lo: 61, cp_hi: 90, i_lo: 101, i_hi: 200 },
    { cp_lo: 91, cp_hi: 120, i_lo: 201, i_hi: 300 },
    { cp_lo: 121, cp_hi: 250, i_lo: 301, i_hi: 400 },
    { cp_lo: 251, cp_hi: 500, i_lo: 401, i_hi: 500 },
  ];
  const BP_PM10 = [
    { cp_lo: 0, cp_hi: 50, i_lo: 0, i_hi: 50 },
    { cp_lo: 51, cp_hi: 100, i_lo: 51, i_hi: 100 },
    { cp_lo: 101, cp_hi: 250, i_lo: 101, i_hi: 200 },
    { cp_lo: 251, cp_hi: 350, i_lo: 201, i_hi: 300 },
    { cp_lo: 351, cp_hi: 430, i_lo: 301, i_hi: 400 },
    { cp_lo: 431, cp_hi: 1000, i_lo: 401, i_hi: 500 },
  ];
  const BP_NO2 = [
    { cp_lo: 0, cp_hi: 40, i_lo: 0, i_hi: 50 },
    { cp_lo: 41, cp_hi: 80, i_lo: 51, i_hi: 100 },
    { cp_lo: 81, cp_hi: 180, i_lo: 101, i_hi: 200 },
    { cp_lo: 181, cp_hi: 280, i_lo: 201, i_hi: 300 },
    { cp_lo: 281, cp_hi: 400, i_lo: 301, i_hi: 400 },
    { cp_lo: 401, cp_hi: 1000, i_lo: 401, i_hi: 500 },
  ];
  const BP_O3 = [
    { cp_lo: 0, cp_hi: 50, i_lo: 0, i_hi: 50 },
    { cp_lo: 51, cp_hi: 100, i_lo: 51, i_hi: 100 },
    { cp_lo: 101, cp_hi: 168, i_lo: 101, i_hi: 200 },
    { cp_lo: 169, cp_hi: 208, i_lo: 201, i_hi: 300 },
    { cp_lo: 209, cp_hi: 748, i_lo: 301, i_hi: 400 },
    { cp_lo: 749, cp_hi: 2000, i_lo: 401, i_hi: 500 },
  ];
  const BP_SO2 = [
    { cp_lo: 0, cp_hi: 40, i_lo: 0, i_hi: 50 },
    { cp_lo: 41, cp_hi: 80, i_lo: 51, i_hi: 100 },
    { cp_lo: 81, cp_hi: 380, i_lo: 101, i_hi: 200 },
    { cp_lo: 381, cp_hi: 800, i_lo: 201, i_hi: 300 },
    { cp_lo: 801, cp_hi: 1600, i_lo: 301, i_hi: 400 },
    { cp_lo: 1601, cp_hi: 5000, i_lo: 401, i_hi: 500 },
  ];
  const BP_CO = [
    { cp_lo: 0, cp_hi: 2, i_lo: 0, i_hi: 50 },
    { cp_lo: 2.1, cp_hi: 4, i_lo: 51, i_hi: 100 },
    { cp_lo: 4.1, cp_hi: 14, i_lo: 101, i_hi: 200 },
    { cp_lo: 14.1, cp_hi: 24, i_lo: 201, i_hi: 300 },
    { cp_lo: 24.1, cp_hi: 34, i_lo: 301, i_hi: 400 },
    { cp_lo: 34.1, cp_hi: 50, i_lo: 401, i_hi: 500 },
  ];

  const aqi_values = {
    pm25: calcAQI(pm25, BP_PM25),
    pm10: calcAQI(pm10, BP_PM10),
    no2: calcAQI(no2, BP_NO2),
    o3: calcAQI(o3, BP_O3),
    so2: calcAQI(so2, BP_SO2),
    co: calcAQI(co, BP_CO),
  };
  const finalAQI = Math.max(...Object.values(aqi_values));
  return { aqi: finalAQI, breakdown: aqi_values };
}

// -----------  MAIN WEATHER FETCH  -----------
export async function getWeather(cityName) {
  const tempIcon = document.getElementById("tempIcon"),
    cRain = document.getElementById("cRain"),
    degree = document.getElementById("degree"),
    city = document.getElementById("DefaultCityName"),
    tempContent = document.getElementById("tempContent"),
    rain = document.querySelector(".rain"),
    realFeels = document.getElementById("realFeels"),
    windSpeed = document.getElementById("windSpeed"),
    chanceRain = document.getElementById("chanceRain"),
    uVIndex = document.getElementById("uVIndex"),
    // ✅ NEW: Weather Metrics ke liye elements
    windDirection = document.getElementById("wind-direction"),
    cloudCover = document.getElementById("cloud-cover"),
    visibility = document.getElementById("visibility"),
    pressure = document.getElementById("pressure"),
    humidity = document.getElementById("humidity"),
    dewPoint = document.getElementById("dew-point"),
    sunrise = document.getElementById("sunrise"),
    sunset = document.getElementById("sunset");

  // Limit String 
  function limitString(str, num) {
    return str.length > num ? str.slice(0, num) + "…" : str;
  }
  const forecastKeys = ["sixAm", "nineAm", "twelvePm", "threePm", "sixPm", "ninePm"];
  const forecastHours = [6, 9, 12, 15, 18, 21];
  const showForecast = {};
  const showIcons = {};
  forecastKeys.forEach(key => {
    showForecast[key] = document.querySelector(`#${key} h2`);
    showIcons[key] = document.querySelector(`#${key} img`);
  });

  function createWeeklyForecast(forecastData) {
    const container = document.getElementById("showWeeklyFor");
    if (!container) return;
    container.innerHTML = "";
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    function shortCondition(text) {
      const t = text.toLowerCase();
      if (/sun|clear/.test(t)) return "Sunny";
      if (/cloud/.test(t)) return "Cloudy";
      if (/rain|drizzle/.test(t)) return "Rainy";
      if (/snow/.test(t)) return "Snow";
      if (/thunder|storm/.test(t)) return "Storm";
      return "Cloudy";
    }
    forecastData.forEach((dayData, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dayName = i === 0 ? "Today" : daysOfWeek[date.getDay()];
      const condition = shortCondition(dayData.day.condition.text);
      const icon = `https:${dayData.day.condition.icon}`;
      const max = Math.floor(dayData.day.maxtemp_c);
      const min = Math.floor(dayData.day.mintemp_c);
      container.innerHTML += `
        <div class="foreCard flex-center space-betw">
          <span class="dayN cool-gray">${dayName}</span>
          <div class="imgSpan flex-center">
            <img src="${icon}" alt="${condition}" width="50px" height="50px">
            <div class="containtDiv">
              <span class="gray-light">${condition}</span>
            </div>
          </div>
          <div class="minMax">
            <span class="max-temp gray-light">${max}</span>
            <span class="slash cool-gray">/</span>
            <span class="min-temp cool-gray">${min}</span>
          </div>
        </div>
        <div class="bottomB"></div>`;
    });
  }

  if (cRain) cRain.innerText = "Loading weather data...";
  if (degree) degree.innerText = "⏳";

  try {
    const weatherApiKey = "52a727de55f349348b585832252710";
    const currentUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${cityName}&aqi=yes`;
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${cityName}&days=7&aqi=yes`;
    const [currentRes, forecastRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
    if (!currentRes.ok || !forecastRes.ok) throw new Error("WeatherAPI failed");

    const data = await currentRes.json();
    const forecastData = await forecastRes.json();

    currentIsDay = data.current.is_day;
    if (tempContent) {
      tempContent.classList.remove("night", "sunny");
      const t = data.current.condition.text.toLowerCase();
      currentIsDay ? t === "sunny" && tempContent.classList.add("sunny")
        : t === "clear" && tempContent.classList.add("night");
    }
    if (rain) rain.style.color = !currentIsDay ? "#9399a2" : "rgb(191, 255, 185)";

    lastDetectedCity = data.location.name;
    lastTemp = Math.floor(data.current.temp_c);
    lastIcon = `https:${data.current.condition.icon}`;
    lastTime = data.location.localtime.split(" ")[1];

    if (tempIcon) tempIcon.src = `https:${data.current.condition.icon}`;

    updateBasicInfo(data.location.name, data.current.temp_c, forecastData.forecast.forecastday[0].day.daily_chance_of_rain);
    updateAirCondition(data.current.feelslike_c, data.current.wind_kph, forecastData.forecast.forecastday[0].day.daily_chance_of_rain, data.current.uv);
    updateForecast(forecastData.forecast.forecastday[0].hour, forecastKeys, forecastHours, showForecast, showIcons);
    if (document.getElementById("showWeeklyFor")) createWeeklyForecast(forecastData.forecast.forecastday);
    updateWeatherMetrics(data, forecastData);
    if (document.getElementById('goOutPrimary')) updateAdvisorySection(data, forecastData);



  } catch (err) {
    currentIsDay = null;
    if (rain) rain.style.color = "white";
    if (tempContent) tempContent.classList.remove("night", "sunny");
    if (tempIcon) tempIcon.src = "https://assets.api.uizard.io/api/cdn/stream/e555eccb-fbe4-4a3c-8917-933a41798140.png";
    lastDetectedCity = lastTemp = lastIcon = lastTime = null;
    if (cRain) cRain.innerText = "City not found";
    if (degree) degree.innerText = "--";
    if (city) city.innerHTML = "Unknown";
    if (realFeels) realFeels.innerHTML = "--";
    if (windSpeed) windSpeed.innerText = "--";
    if (chanceRain) chanceRain.innerText = "--";
    if (uVIndex) uVIndex.innerText = "--";
    if (document.getElementById('goOutPrimary')) showAdvisoryError();
    const container = document.getElementById("showWeeklyFor");
    if (container) container.innerHTML = `<h1 style="color:#c4cad3;text-align:center;font-size:2rem;">No Data Available</h1>`;
    return false;
  }

  function updateBasicInfo(cityName, tempC, rainChance) {
    if (degree) degree.innerHTML = `${Math.floor(tempC)}&deg;`;
    if (city) city.innerHTML = limitString(cityName, 10);
    if (cRain) cRain.innerText = `Chance of rain: ${rainChance}%`;
  }
  function updateAirCondition(feelsLikeC, windKph, rainChance, uv) {
    if (realFeels) realFeels.innerHTML = `${Math.floor(feelsLikeC)}&deg;`;
    if (windSpeed) windSpeed.innerText = `${Math.round(windKph)} km/h`;
    if (chanceRain) chanceRain.innerText = `${rainChance}%`;
    if (uVIndex) uVIndex.innerText = uv !== undefined ? uv : "N/A";
  }

  // ✅ COMPACT: Weather Metrics Update Function
  function updateWeatherMetrics(data, forecastData) {
    const w = data.current;
    const astro = forecastData.forecast.forecastday[0]?.astro;

    if (windDirection) windDirection.textContent = `${w.wind_dir} (${w.wind_degree}°)`;
    if (cloudCover) cloudCover.textContent = `${w.cloud}%`;
    if (visibility) visibility.textContent = `${w.vis_km} km`;
    if (pressure) pressure.textContent = `${w.pressure_mb} hPa`;
    if (humidity) humidity.textContent = `${w.humidity}%`;
    if (dewPoint) dewPoint.textContent = `${Math.round(w.temp_c - ((100 - w.humidity) / 5))}°C`;
    if (sunrise && astro) sunrise.textContent = astro.sunrise;
    if (sunset && astro) sunset.textContent = astro.sunset;
  }

  function updateForecast(hourDataArray, keys, hours, forecastElems, iconElems) {
    keys.forEach((key, i) => {
      if (!forecastElems[key] || !iconElems[key]) return;
      const hourData = hourDataArray[hours[i]];
      if (!hourData) return;
      forecastElems[key].innerHTML = `${Math.floor(hourData.temp_c)}&deg;`;
      iconElems[key].src = `https:${hourData.condition.icon}`;
      iconElems[key].alt = hourData.condition.text;
    });
  }
}

// -----------  ADVISORY SECTION  -----------
function updateAdvisorySection(data, forecastData) {
  const el = {
    goOutSide: document.getElementById('goOutSide'),
    goOutPrimary: document.getElementById('goOutPrimary'),
    goOutSecondary: document.getElementById('goOutSecondary'),
    clothPrimary: document.getElementById('clothPrimary'),
    clothSecondary: document.getElementById('clothSecondary'),
    airQualityMain: document.getElementById('airQualityMain'),
    airQualitySub: document.getElementById('airQualitySub'),
    aqiNumber: document.getElementById('aqiNumber'),
  };
  if (!el.goOutPrimary) { return; }

  try {
    const aqiResult = getMultiPollutantAQI(data);
    const realAQI = aqiResult.aqi;

    const weatherData = {
      precipProb: forecastData.forecast.forecastday[0]?.day?.daily_chance_of_rain || 0,
      temp: data.current?.temp_c || 0,
      feelsLike: data.current?.feelslike_c || 0,
      uv: data.current?.uv || 0,
      windSpeed: data.current?.wind_kph || 0,
      aqi: realAQI,               // ✅ CORRECT VALUE NOW
      visibility: data.current?.vis_km || 10
    };

    const mainAdvice = pickMainAdvice(weatherData);
    const clothingAdvice = getClothingAdvice(weatherData);
    const airQualityAdvice = getAirQualityAdvice(weatherData);

    updateAdvisoryUI(el, mainAdvice, clothingAdvice, airQualityAdvice, weatherData);
  } catch (error) {
    console.error('Error in advisory section:', error);
    showAdvisoryError(el);
  }
}

function pickMainAdvice(data) {
  const p = x => (x === undefined ? null : x);
  const precip = p(data.precipProb);
  const temp = p(data.temp);
  const feels = p(data.feelsLike);
  const uv = p(data.uv);
  const wind = p(data.windSpeed);
  const aqi = p(data.aqi);
  const vis = p(data.visibility);
  const month = (new Date()).getMonth() + 1;
  const season = (month >= 6 && month <= 9) ? 'monsoon'
    : (month >= 3 && month <= 5) ? 'summer'
      : (month >= 11 || month <= 2) ? 'winter' : 'spring';

  if (aqi !== null && aqi >= 201) return { level: 'warning', primary: 'Very poor air', secondary: 'Avoid outdoors' };
  if (feels !== null && feels >= 40) return { level: 'warning', primary: 'Heat alert', secondary: 'Avoid sun exposure' };
  if (precip !== null && precip >= 70) return { level: 'warning', primary: 'Heavy rain', secondary: 'Carry an umbrella' };
  if (wind !== null && wind >= 60) return { level: 'warning', primary: 'Strong winds', secondary: 'Secure items' };

  if (season === 'monsoon') {
    if (precip === null) return vis !== null && vis < 2
      ? { level: 'caution', primary: 'Low visibility', secondary: 'Drive safe' }
      : { level: 'info', primary: 'No rain data', secondary: 'Check forecast' };
    if (precip < 20) return { level: 'info', primary: 'Low rain chance', secondary: 'No umbrella needed' };
    if (precip < 50) return { level: 'caution', primary: 'Rain possible', secondary: 'Carry umbrella' };
    return { level: 'warning', primary: 'High rain chance', secondary: 'Carry umbrella' };
  }
  if (season === 'summer') {
    if (uv !== null && uv >= 8) return { level: 'warning', primary: 'High UV', secondary: 'Use sunscreen' };
    if (feels !== null && feels >= 33) return { level: 'caution', primary: 'Hot weather', secondary: 'Stay hydrated' };
    if (precip !== null && precip >= 50) return { level: 'caution', primary: 'Rain likely', secondary: 'Carry umbrella' };
    return { level: 'info', primary: 'Good for outdoors', secondary: 'Wear light clothes' };
  }
  if (season === 'winter') {
    if (feels !== null && feels <= 2) return { level: 'warning', primary: 'Extreme cold', secondary: 'Stay indoors' };
    if (feels !== null && feels <= 10) return { level: 'warning', primary: 'Very cold', secondary: 'Wear heavy jacket' };
    if (feels !== null && feels <= 15) return { level: 'caution', primary: 'Slight cold', secondary: 'Wear warm jacket' };
    if (feels !== null && feels <= 20) return { level: 'info', primary: 'Cool weather', secondary: 'Wear full sleeves' };
    if (precip !== null && precip > 40) return { level: 'caution', primary: 'Rain possible', secondary: 'Carry umbrella' };
    return { level: 'info', primary: 'Nice weather', secondary: 'Light layers' };
  }
  if (precip !== null) {
    if (precip < 20) return { level: 'info', primary: 'Low rain chance', secondary: 'Plan outdoors' };
    if (precip < 50) return { level: 'caution', primary: 'Moderate chance', secondary: 'Keep umbrella' };
    return { level: 'warning', primary: 'High rain chance', secondary: 'Expect showers' };
  }
  return { level: 'info', primary: 'Weather looks OK', secondary: 'Check detailed forecast' };
}

function getClothingAdvice(data) {
  const temp = data.feelsLike || data.temp;
  if (temp >= 30) return { primary: 'Light Cotton', secondary: 'Stay cool' };
  if (temp >= 25) return { primary: 'Cotton/T-Shirt', secondary: 'Outdoor friendly' };
  if (temp >= 20) return { primary: 'Full Sleeves', secondary: 'Light warm clothing' };
  if (temp >= 15) return { primary: 'Light Jacket', secondary: 'Layer up' };
  if (temp >= 10) return { primary: 'Warm Jacket', secondary: 'Wear warm clothes' };
  if (temp >= 5) return { primary: 'Heavy Jacket', secondary: 'Layer up warm' };
  return { primary: 'Thermal Wear', secondary: 'Very cold, stay warm' };
}

function getAirQualityAdvice(data) {
  const aqi = data.aqi;
  if (aqi >= 401) return { primary: 'Hazardous', secondary: 'Air is hazardous' };
  if (aqi >= 301) return { primary: 'Severe', secondary: 'Air quality severe' };
  if (aqi >= 201) return { primary: 'Poor', secondary: 'Air is unhealthy' };
  if (aqi >= 101) return { primary: 'Moderate', secondary: 'Air is moderate' };
  if (aqi >= 51) return { primary: 'Fair', secondary: 'Air quality fair' };
  return { primary: 'Good', secondary: 'Air quality good' };
}

function updateAdvisoryUI(el, mainAdvice, clothingAdvice, airQualityAdvice, weatherData) {
  if (el.goOutSide) {
    el.goOutSide.textContent = mainAdvice.level === 'warning' ? 'Stay Indoors'
      : mainAdvice.level === 'caution' ? 'Be Careful Outside'
        : 'You Can Go Outside';
  }
  if (el.goOutPrimary) el.goOutPrimary.textContent = mainAdvice.primary;
  if (el.goOutSecondary) el.goOutSecondary.innerText = mainAdvice.secondary;
  if (el.clothPrimary) el.clothPrimary.textContent = clothingAdvice.primary;
  if (el.clothSecondary) el.clothSecondary.textContent = clothingAdvice.secondary;
  if (el.airQualityMain) el.airQualityMain.textContent = airQualityAdvice.primary;
  if (el.airQualitySub) el.airQualitySub.textContent = airQualityAdvice.secondary;
  if (el.aqiNumber) el.aqiNumber.textContent = weatherData.aqi || '--';
}

function showAdvisoryError(el) {
  el.goOutPrimary.textContent = 'Data unavailable';
  el.goOutSecondary.textContent = 'Please try again';
  el.clothPrimary.textContent = '--';
  el.clothSecondary.textContent = 'No data';
  el.airQualityMain.textContent = '--';
  el.airQualitySub.textContent = 'No data';
  el.aqiNumber.textContent = '--';
}

// -----------  DEFAULT / NAVIGATION  -----------
export async function defaultWeather() { await getWeather("Pune"); }

export function initNavigation() {
  // ✅ Guard: agar already initialized hai toh skip karo
  if (initNavigation._done) return;
  initNavigation._done = true;

  const links = { homeIcon: "index.html", cityIcon: "storeCity.html", mapIcon: "woldMap.html", settingIcon: "setting.html" };
  Object.entries(links).forEach(([id, url]) => {
    const ele = document.getElementById(id);
    if (ele) ele.addEventListener("click", () => { if (!window.location.href.includes(url)) window.location.href = url; });
  });
}