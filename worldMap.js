// World Map Logic
import { getWeather, getLastWeatherData, initNavigation } from "./app.js";

let map;
let markers = [];
let userLocationMarker = null;
let currentlyDisplayedCity = null;

// Cities ko localStorage se load karo
let cities = JSON.parse(localStorage.getItem('savedCities')) || [];

// ✅ Cities ko localStorage mein save karo
function saveCitiesToStorage() {
    localStorage.setItem('savedCities', JSON.stringify(cities));
}

// ✅ Hardcoded fallback coordinates map object
const CITY_COORDINATES_FALLBACK = {
    'mumbai': [19.0760, 72.8777], 'delhi': [28.7041, 77.1025], 'bangalore': [12.9716, 77.5946],
    'hyderabad': [17.3850, 78.4867], 'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
    'pune': [18.5204, 73.8567], 'ahmedabad': [23.0225, 72.5714], 'jaipur': [26.9124, 75.7873],
    'lucknow': [26.8467, 80.9462], 'nashik': [20.0059, 73.7910], 'nagpur': [21.1458, 79.0882],
    'indore': [22.7196, 75.8577], 'thane': [19.2183, 72.9781], 'bhopal': [23.2599, 77.4126],
    'latur': [18.4088, 76.5604], 'nanded': [19.1383, 77.3210], 'udgir': [18.3950, 77.1200]
};

// ✅ Cache coordinates to avoid recurrent API lookups and reflows
const coordinatesCache = new Map();

async function getCityCoordinates(cityName) {
    const key = cityName.toLowerCase().trim();
    if (coordinatesCache.has(key)) return coordinatesCache.get(key);

    try {
        const apiKey = "3511726570aad7b131bd748e2e8b042d";
        const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`;

        const response = await fetch(geocodingUrl);
        if (!response.ok) throw new Error("Geocoding API failed");

        const data = await response.json();
        if (data && data.length > 0) {
            const res = [data[0].lat, data[0].lon];
            coordinatesCache.set(key, res);
            return res;
        }
    } catch (error) {
        console.log(`❌ Geocoding error for ${cityName}, shifting to fallback:`, error);
    }
    
    const fallback = CITY_COORDINATES_FALLBACK[key] || null;
    if (fallback) coordinatesCache.set(key, fallback);
    return fallback;
}

// ✅ Clean markers safely to prevent memory leak
function clearAllMarkers() {
    markers.forEach(marker => {
        marker.off(); // Remove all event listeners bound to this marker
        map.removeLayer(marker);
    });
    markers = [];
}

async function loadCitiesOnMap() {
    clearAllMarkers();
    if (cities.length === 0) return;

    // Batch operations logically
    for (const city of cities) {
        const coordinates = await getCityCoordinates(city.name);
        if (coordinates) {
            const marker = L.marker(coordinates)
                .bindPopup(createPopupContent(city), { keepInView: true })
                .addTo(map);

            marker.on('click', () => {
                map.setView(coordinates, 10);
                currentlyDisplayedCity = city.name;
            });
            markers.push(marker);
        }
    }
}

async function addCityToMap(name, time, temp, icon) {
    const existingIdx = markers.findIndex(m => {
        const content = m.getPopup()?.getContent() || '';
        return content.includes(`<h3>${name}</h3>`);
    });
    if (existingIdx !== -1) {
        markers[existingIdx].off();
        map.removeLayer(markers[existingIdx]);
        markers.splice(existingIdx, 1);
    }

    const coordinates = await getCityCoordinates(name);
    if (coordinates) {
        const marker = L.marker(coordinates)
            .bindPopup(`
                <div class="weather-popup">
                    <h3>${name}</h3>
                    <div class="temp">${temp}°C</div>
                    <div class="time">${time}</div>
                </div>
            `, { keepInView: true })
            .addTo(map);

        marker.on('click', () => { currentlyDisplayedCity = name; });
        markers.push(marker);
        map.setView(coordinates, 10);
    }
}

function initMap() {
    // Check if map already exists
    if (map) return;
    
    map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    loadCitiesOnMap();
    loadCitiesList();
    getUserLocation();
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                showUserLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => console.log("Location access denied:", error),
            { enableHighAccuracy: false, timeout: 5000 }
        );
    }
}

function showUserLocation(lat, lng) {
    if (userLocationMarker) {
        userLocationMarker.off();
        map.removeLayer(userLocationMarker);
    }

    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="user-location"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userLocationMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 Your Current Location</b>');
}

function loadCitiesList() {
    initNavigation();
    const cityList = document.getElementById("listCity");
    cityList.innerHTML = '';

    if (cities.length === 0) {
        const zeroCity = document.createElement("div");
        zeroCity.className = "noCity";
        zeroCity.style.textAlign = "center";
        zeroCity.innerHTML = `<b>Search cities to see them on map</b>`;
        cityList.appendChild(zeroCity);
        return;
    }

    // Appending dynamic layout via DocumentFragment reduces reflow costs drastically
    const fragment = document.createDocumentFragment();
    for (const cityData of cities) {
        const wrapper = createCityCardElement(cityData.name, cityData.time, cityData.temp, cityData.icon);
        fragment.appendChild(wrapper);
    }
    cityList.appendChild(fragment);
}

function limitString(str, num) {
    return str.length > num ? str.slice(0, num) + "..." : str;
}

// ✅ Separation of concerns: Creates elements without attaching dynamic layout triggers inside loops
function createCityCardElement(name, time, temp, icon) {
    const wrapper = document.createElement("div");
    wrapper.className = "city-wrapper";
    wrapper.setAttribute("data-city", name);

    wrapper.innerHTML = `
        <div class="city-card">
            <div class="city-left">
                <img src="${icon}" alt="${name} weather" class="weather-icon">
                <div class="city-info">
                    <h3>${limitString(name, 10)}</h3>
                    <p>${time}</p>
                </div>
            </div>
            <div class="city-temp">${temp}°</div>
        </div>
        <button class="remove-btn">×</button>
    `;

    const card = wrapper.querySelector(".city-card");
    const removeBtn = wrapper.querySelector(".remove-btn");

    card.addEventListener("click", async (e) => {
        e.stopPropagation();
        
        document.querySelectorAll('.city-wrapper.active').forEach(activeCard => {
            if (activeCard !== wrapper) activeCard.classList.remove('active');
        });

        wrapper.classList.toggle('active');

        if (wrapper.classList.contains('active')) {
            currentlyDisplayedCity = name;
            const coordinates = await getCityCoordinates(name);
            if (coordinates) map.setView(coordinates, 10);
        }
    });

    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        wrapper.classList.add("remove");
        
        setTimeout(() => {
            wrapper.remove();
            cities = cities.filter((city) => city.name !== name);
            saveCitiesToStorage();

            if (currentlyDisplayedCity === name) currentlyDisplayedCity = null;

            const markerIndex = markers.findIndex(m => m.getPopup().getContent().includes(name));
            if (markerIndex !== -1) {
                markers[markerIndex].off();
                map.removeLayer(markers[markerIndex]);
                markers.splice(markerIndex, 1);
            }

            const cityList = document.getElementById("listCity");
            if (cities.length === 0 && cityList) {
                cityList.innerHTML = `<div class="noCity"><b>Search cities to see them on map</b></div>`;
            }
        }, 400); // Faster processing response time
    });

    return wrapper;
}

function addCityCard(name, time, temp, icon) {
    const cityList = document.getElementById("listCity");
    if (!cityList) return;

    const noCityMessage = cityList.querySelector('.noCity');
    if (noCityMessage) noCityMessage.remove();

    const existingCard = cityList.querySelector(`[data-city="${name}"]`);
    if (existingCard) existingCard.remove();

    const wrapper = createCityCardElement(name, time, temp, icon);

    if (cityList.firstChild) {
        cityList.insertBefore(wrapper, cityList.firstChild);
    } else {
        cityList.appendChild(wrapper);
    }
}

function createPopupContent(city) {
    return `
        <div class="weather-popup">
            <h3>${city.name}</h3>
            <div class="temp">${city.temp}°C</div>
            <div class="time">${city.time}</div>
        </div>
    `;
}

async function addCity(c, time, temp, icon) {
    c = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
    const existingIndex = cities.findIndex(city => city.name === c);

    if (existingIndex !== -1) {
        cities.splice(existingIndex, 1);
        document.querySelector(`[data-city="${c}"]`)?.remove();
    } else if (cities.length >= 10) {
        const removedCity = cities.pop();
        document.querySelector(`[data-city="${removedCity.name}"]`)?.remove();
    }

    const cityData = { name: c, time: time, temp: temp, icon: icon };
    cities.unshift(cityData);
    saveCitiesToStorage();

    addCityCard(c, time, temp, icon);
    await addCityToMap(c, time, temp, icon);
}

async function handleMapSearch() {
    const input = document.getElementById("inputData");
    const city = input.value.trim();
    if (!city) return;

    try {
        await getWeather(city);
        await new Promise(resolve => setTimeout(resolve, 300));

        const data = getLastWeatherData();
        if (data && data.city && data.temp && data.icon && data.time) {
            await addCity(data.city, data.time, data.temp, data.icon);
            currentlyDisplayedCity = data.city;
            input.value = "";
        } else {
            alert("City not found! Please try again.");
        }
    } catch (error) {
        console.log("❌ Error in search:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();

    const input = document.getElementById("inputData");
    const searchBtn = document.getElementById("search");

    if (searchBtn) searchBtn.addEventListener("click", handleMapSearch);
    if (input) {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") handleMapSearch();
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.city-wrapper')) {
            document.querySelectorAll('.city-wrapper.active').forEach(card => {
                card.classList.remove('active');
            });
        }
    });
});