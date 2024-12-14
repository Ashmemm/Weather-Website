const apiUrl = "https://api.open-meteo.com/v1/forecast";
const geoApiUrl = "https://geocoding-api.open-meteo.com/v1/search";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const toggleUnit = document.getElementById("toggle-unit");
const toggleTheme = document.getElementById("toggle-theme");

const weatherCodeToIcon = {
    0: "wi wi-day-sunny",             // Clear sky
    1: "wi wi-day-cloudy",            // Mainly clear
    2: "wi wi-cloud",                 // Partly cloudy
    3: "wi wi-cloudy",                // Overcast
    45: "wi wi-fog",                  // Fog
    48: "wi wi-fog",                  // Depositing rime fog
    51: "wi wi-sprinkle",             // Drizzle
    53: "wi wi-rain",                 // Rain
    55: "wi wi-showers",              // Heavy rain
    61: "wi wi-showers",              // Showers
    63: "wi wi-rain",                 // Heavy showers
    65: "wi wi-thunderstorm",         // Thunderstorm
    80: "wi wi-showers",              // Rain showers
    81: "wi wi-storm-showers",        // Heavy rain showers
    95: "wi wi-thunderstorm",         // Thunderstorm
    96: "wi wi-thunderstorm",         // Thunderstorm with hail
};

// Convert temperature
function convertTemperature(temp, toCelsius) {
    return toCelsius 
        ? ((temp - 32) * 5) / 9  // Fahrenheit to Celsius
        : (temp * 9) / 5 + 32;   // Celsius to Fahrenheit
}

let isCelsius = true;

// Fetch weather data
async function fetchWeather(city) {
    try {
        // Get city data using geocoding API
        const geoResponse = await fetch(`${geoApiUrl}?name=${city}&count=1`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("City not found.");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Fetch weather data using the obtained coordinates
        const weatherResponse = await fetch(
            `${apiUrl}?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`
        );
        const weatherData = await weatherResponse.json();

        if (!weatherData.current_weather) {
            alert("Weather data not available.");
            return;
        }

        const currentTemp = isCelsius
            ? weatherData.current_weather.temperature
            : convertTemperature(weatherData.current_weather.temperature, false);

        // Update the UI
        document.getElementById("city-name").innerText = name;
        document.getElementById("temperature").innerText = `${currentTemp.toFixed(1)}°${isCelsius ? "C" : "F"}`;
        document.getElementById("wind-speed").innerText = `${weatherData.current_weather.windspeed} km/h`;
        document.getElementById("pressure").innerText = `${weatherData.current_weather.pressure} mb`;

        // Update Current Weather Icon
        const weatherIconElement = document.getElementById("weather-icon");
        if (weatherIconElement) {
            const iconCode = weatherData.current_weather.weathercode;
            weatherIconElement.className = `${weatherCodeToIcon[iconCode] || "wi wi-na"}`;
        }

        // Populate 6-day forecast
        const forecastGrid = document.getElementById("forecast-grid");
        forecastGrid.innerHTML = ""; 

        for (let i = 0; i < 6; i++) {
            const day = weatherData.daily.time[i];
            const tempMax = isCelsius 
                ? weatherData.daily.temperature_2m_max[i] 
                : convertTemperature(weatherData.daily.temperature_2m_max[i], false);
            const tempMin = isCelsius 
                ? weatherData.daily.temperature_2m_min[i] 
                : convertTemperature(weatherData.daily.temperature_2m_min[i], false);
            const forecastIconCode = weatherData.daily.weathercode[i];

            forecastGrid.innerHTML += `
                <div class="forecast-item">
                    <p>${day}</p>
                    <i class="${weatherCodeToIcon[forecastIconCode] || "wi wi-na"}"></i>
                    <p>${tempMax.toFixed(1)}° / ${tempMin.toFixed(1)}°</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert("Failed to fetch weather data. Please try again.");
    }
}

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
});

toggleUnit.addEventListener("click", () => {
    isCelsius = !isCelsius; 
    const cityName = document.getElementById("city-name").innerText;
    if (cityName && cityName !== "Your Location") {
        fetchWeather(cityName);  // Refetch weather data for the current city
    }
});

toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
});

// Default load
fetchWeather("Lusaka");
