import React, { useEffect, useState } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

export default function App() {
  //State
  const [weatherLocation, setWeatherLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState({});
  const [error, setError] = useState("");

  const [displayLocation, setDisplayLocation] = useState("");
  // const [displayLocation, setDisplayLocation] = useState(function () {
  //   const storedValue = localStorage.getItem("location") || "";
  //   return JSON.parse(storedValue);
  // });

  //Handler functions

  function handleSetLocation(e) {
    console.log(e.target.value);
    setWeatherLocation(e.target.value);
  }

  //Hooks
  useEffect(
    function () {
      localStorage.setItem("location", JSON.stringify(weatherLocation));
    },
    [weatherLocation]
  );

  useEffect(
    function () {
      async function fetchWeather() {
        if (weatherLocation.length < 2) return setWeather({});

        try {
          setIsLoading(true);
          setError("");

          // 1) Getting location (geocoding)
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${weatherLocation}`
          );

          console.log(geoRes);

          const geoData = await geoRes.json();
          console.log(geoData);

          if (geoData.error || !geoData.results) {
            throw new Error("Location not found");
          }

          //take first result of geodata
          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          // 2) Getting actual weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
          );
          const weatherData = await weatherRes.json();
          console.log(weatherData);
          setWeather(weatherData.daily);
          setError("");
        } catch (err) {
          console.log(err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      fetchWeather();
    },
    [weatherLocation]
  );

  return (
    <div className="app">
      <h1>Classy weather app</h1>
      <Input
        weatherLocation={weatherLocation}
        onChangeLocation={handleSetLocation}
      />
      {/* <button className="btn" onClick={this.fetchWeather}>
          Get weather
        </button> */}

      {isLoading ? (
        <p className="loader">Loading...</p>
      ) : (
        weather.weathercode && (
          <Weather
            weather={weather}
            displayLocationlocation={displayLocation}
          />
        )
      )}
    </div>
  );
}

function Input({ weatherLocation, onChangeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search for location..."
        value={weatherLocation}
        onChange={onChangeLocation}
      />
    </div>
  );
}

function Weather({
  temperature_2m_max: max,
  temperature_2m_min: min,
  time: dates,
  weathercode: codes,
  displayLocation,
}) {
  return (
    <div>
      <h2>Weather {displayLocation}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            max={max.at(i)}
            min={min.at(i)}
            date={date}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
