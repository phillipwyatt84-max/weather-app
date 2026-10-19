
// 1. SELECT HTML ELEMENTS

// Get the elements we need from the HTML
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const message = document.getElementById("message");

const cityName = document.getElementById("city-name");
const currentDate = document.getElementById("current-date");
const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weather-icon");
const weatherDescription = document.getElementById("weather-description");

const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const pressure = document.getElementById("pressure");

const forecastList = document.getElementById("forecast-list");


// 2. WEATHER CONDITION INFORMATION

// Convert weather codes into readable descriptions and icons
function getWeatherInfo(code, isDay = 1) {
    if (code === 0) {
        return {
            description: "Clear sky",
            icon: isDay ? "☀️" : "🌙"
        };
    }

    if (code === 1) {
        return {
            description: "Mainly clear",
            icon: isDay ? "🌤️" : "🌙"
        };
    }

    if (code === 2) {
        return {
            description: "Partly cloudy",
            icon: "⛅"
        };
    }

    if (code === 3) {
        return {
            description: "Overcast",
            icon: "☁️"
        };
    }

    if ([45, 48].includes(code)) {
        return {
            description: "Foggy",
            icon: "🌫️"
        };
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return {
            description: "Drizzle",
            icon: "🌦️"
        };
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return {
            description: "Rainy",
            icon: "🌧️"
        };
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return {
            description: "Snowy",
            icon: "❄️"
        };
    }

    if ([95, 96, 99].includes(code)) {
        return {
            description: "Thunderstorm",
            icon: "⛈️"
        };
    }

    // Use a default when the code is not recognized
    return {
        description: "Unknown conditions",
        icon: "🌡️"
    };
}


// 3. FORMAT DATES

// Turn a date string into a readable day name
function formatDay(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString("en-US", {
        weekday: "short"
    });
}

// Display today's date in a readable format
function formatFullDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
    });
}


// 4. GET WEATHER DATA

// Find a city and retrieve its weather information
async function getWeather(city) {
    try {
        // Show a loading message while searching
        message.textContent = "Finding weather information...";
        searchButton.disabled = true;
        searchButton.textContent = "Loading...";

        // Step A: Find the city's coordinates
        const locationURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const locationResponse = await fetch(locationURL);

        // Stop if the location request failed
        if (!locationResponse.ok) {
            throw new Error("Unable to search for this city.");
        }

        const locationData = await locationResponse.json();

        // Check whether the city exists
        if (!locationData.results || locationData.results.length === 0) {
            throw new Error("City not found. Try another city name.");
        }

        // Get the first matching city
        const location = locationData.results[0];

        // Step B: Request the city's weather forecast
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;

        const weatherResponse = await fetch(weatherURL);

        // Stop if the weather request failed
        if (!weatherResponse.ok) {
            throw new Error("Unable to retrieve weather information.");
        }

        const weatherData = await weatherResponse.json();

        // Display the returned weather information
        displayWeather(location, weatherData);

        // Clear the loading message
        message.textContent = "";

    } catch (error) {
        // Display an understandable error message
        message.textContent = error.message;
    } finally {
        // Restore the button after success or failure
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}


// 5. DISPLAY CURRENT WEATHER

// Update the current weather section
function displayWeather(location, data) {
    // Get the current weather values
    const current = data.current;

    // Get the description and icon
    const weather = getWeatherInfo(
        current.weather_code,
        current.is_day
    );

    // Update the city name
    cityName.textContent = location.name;

    // Add the region and country when available
    const locationDetails = [
        location.admin1,
        location.country
    ].filter(Boolean);

    cityName.textContent += locationDetails.length
        ? `, ${locationDetails.join(", ")}`
        : "";

    // Update the date
    currentDate.textContent = formatFullDate(current.time.slice(0, 10));

    // Update the main temperature
    temperature.textContent = Math.round(current.temperature_2m);

    // Update the weather icon and description
    weatherIcon.textContent = weather.icon;
    weatherIcon.setAttribute("aria-label", weather.description);
    weatherDescription.textContent = weather.description;

    // Update additional weather information
    feelsLike.textContent = Math.round(current.apparent_temperature);
    humidity.textContent = current.relative_humidity_2m;
    windSpeed.textContent = Math.round(current.wind_speed_10m);
    pressure.textContent = Math.round(current.pressure_msl);

    // Display the forecast
    displayForecast(data.daily);
}


// 6. DISPLAY THE FIVE-DAY FORECAST

// Create forecast cards from the API data
function displayForecast(daily) {
    // Remove the old sample forecast cards
    forecastList.replaceChildren();

    // Start at index 1 to show the next five days,
    // excluding today's forecast
    for (let i = 1; i < 6; i++) {
        // Get the weather information for this day
        const weather = getWeatherInfo(daily.weather_code[i]);

        // Create a new forecast card
        const card = document.createElement("article");
        card.className = "forecast-card";

        // Create the day name
        const day = document.createElement("p");
        day.className = "forecast-day";
        day.textContent = formatDay(daily.time[i]);

        // Create the weather icon
        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = weather.icon;

        // Create the temperature
        const temp = document.createElement("p");
        temp.className = "forecast-temp";
        temp.textContent =
            `${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°`;

        // Create the weather description
        const condition = document.createElement("p");
        condition.className = "forecast-condition";
        condition.textContent = weather.description;

        // Add the elements to the card
        card.append(day, icon, temp, condition);

        // Add the card to the forecast section
        forecastList.appendChild(card);
    }
}


// 7. HANDLE THE SEARCH FORM

// Listen for a form submission
searchForm.addEventListener("submit", function (event) {
    // Prevent the browser from refreshing the page
    event.preventDefault();

    // Get the city entered by the user
    const city = cityInput.value.trim();

    // Stop if the input is empty
    if (city === "") {
        message.textContent = "Please enter a city name.";
        return;
    }

    // Request the weather information
    getWeather(city);
});


// 8. LOAD THE DEFAULT CITY

// Display Lagos when the application first opens
getWeather("Lagos");
