// ! Global Variables
let timer = "";
// ! SELECTORS
const btn = document.querySelector("#btn_arrow");
const input = document.querySelector("#search_input");
const forecast_div = document.querySelector("#forecast");
const error = document.querySelector("#error");
const error_p = document.querySelector("#error p");
const error_progress = document.querySelector("#error #progress");

// ! EVENT LISTENERS
// Get Weather for User's Current Location on page load
window.addEventListener("load", startPage);
btn.addEventListener("click", handleBtnClick);
document.addEventListener("keyup", (e) => {
  if (e.key === "Enter") handleBtnClick();
});
// ! FUNCTIONS
function startPage() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.querySelector("main").classList.remove("active");
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        // Get Weather
        getWeatherLatLon(lat, lon);
      },
      (err) => {
        if (err.code === 1) {
          document.querySelector("main").classList.add("active");
        }
      }
    );
  } else {
    document.querySelector("main").classList.add("active");
  }
}

async function handleBtnClick() {
  const city = input.value;
  input.value = "";
  if (city === "") {
    displayError(
      "Every city has a name and you are trying to fetch weather for ghost city."
    );
    return;
  }

  forecast_div.innerHTML = "";
  const weatherAPI = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=f334c1af43dc8e7afb846a4a1999438b`
  );

  const res = await weatherAPI.json();

  if (res.cod === "404") {
    displayError(res.message);
    startPage();
    return;
  }
  document.querySelector("main").classList.remove("active");
  handleAPICall(res);
}

async function getWeatherLatLon(lat, lon) {
  const weatherAPI = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=f334c1af43dc8e7afb846a4a1999438b`
  );
  const res = await weatherAPI.json();
  handleAPICall(res);
}

function handleAPICall(res) {
  const curDate = getCurrentDate();
  const curTime = new Date().getHours();

  let todayWeather = res.list.filter((data) => {
    let [date, time] = data.dt_txt.split(" ");
    let hour = time.split(":")[0];
    hour = hour === "00" ? 12 : Number(hour);
    if (
      date === curDate &&
      (curTime === hour || curTime === hour - 1 || curTime === hour + 1)
    )
      data.day = getDay(new Date().getDay(date));
    return data;
  });
  todayWeather = todayWeather[0];

  displayData(res, todayWeather);
  forecast(res);
}

function forecast(res) {
  const curDate = getCurrentDate();
  let data = res.list.filter((data) => {
    let [date, time] = data.dt_txt.split(" ");
    data.dt_txt = date;
    data.time = time;
    return date != curDate;
  });

  const arr = [];
  for (let i = 0; i < data.length; i += 8) {
    let t = data[i + 2];
    if (t === undefined) t = data[i];
    const weather = {
      date: t.dt_txt,
      time: t.time,
      temp: t.main.temp,
      icon: t.weather[0].icon,
    };
    arr.push(weather);
  }
  data = arr;
  displayForecast(data);
}

function displayForecast(data) {
  data.forEach((e) => {
    const square = createCustomElement("div", ["square"]);
    // Temp
    const temp = createCustomElement("p", ["temp"]);
    temp.innerHTML = `${(e.temp - 273).toFixed(1)}<sup>o</sup>`;
    // Icon
    const icon = createCustomElement("img");
    const api_icon = `http://openweathermap.org/img/w/${e.icon}.png`;
    icon.setAttribute("src", api_icon);
    // Day
    const fetchDay = getDay(new Date(e.date).getDay());
    const day = createCustomElement("p", "day");
    day.textContent = fetchDay;

    square.appendChild(temp);
    square.appendChild(icon);
    square.appendChild(day);
    forecast_div.appendChild(square);
  });

  const d = new Date(data[0].date);
}

function displayData(res, data) {
  // Display Current Weather
  weatherDetails(res, data);
  card1(data);
  card2(res, data);
}

function weatherDetails(res, data) {
  // Weather Icon
  let api_icon = data.weather[0].icon;
  api_icon = `http://openweathermap.org/img/w/${api_icon}.png`;
  const icon_img = document.querySelector("#temp_icon");
  icon_img.setAttribute("src", api_icon);
  // Tempurature
  const temp_api = Math.round(data.main.temp - 273);
  const temp_p = document.querySelector("#temp_degree");
  temp_p.innerHTML = `${temp_api}<sup>o</sup>`;
  // Description
  const desc_api = data.weather[0].description;
  const desc_p = document.querySelector("#temp_desc");
  desc_p.textContent = desc_api;
  // Get City and Country
  let city = res.city.name;
  let country = res.city.country;
  country = getCountry(country);
  city = `<span>${city}</span>, ${country}`;
  document.querySelector("#place");
  place.innerHTML = `<i class="fa_icon fa-sharp fa-solid fa-location-dot"></i> ${city}`;
  // Get day and time
  const date = new Date().getDate();
  let dayOfWeek = new Date().getDay();
  dayOfWeek = getDay(dayOfWeek);
  let month = new Date().getMonth();
  month = getMonth(month);
  const day_p = document.querySelector("#day");
  day_p.textContent = `${dayOfWeek} ${date} ${month}`;
}

function card1(data) {
  const humidity_api = `${data.main.humidity}%`;
  const cloud_api = `${data.clouds.all}%`;
  let min = Math.round(data.main.temp_min - 273);
  let max = Math.round(data.main.temp_max - 273);
  // Humidity
  const humidity = document.querySelector("#humidity_degree");
  humidity.textContent = humidity_api;
  // Cloud
  const cloud = document.querySelector("#cloud_degree");
  cloud.textContent = cloud_api;
  // Temp Min
  const tempMin = document.querySelector("#tempMin_degree");
  tempMin.innerHTML = `${min}<sup>o</sup>`;
  // Temp Max
  const tempMax = document.querySelector("#tempMax_degree");
  tempMax.innerHTML = `${max}<sup>o</sup>`;
  // const seaLevel_api = `${data.main.sea_level} hpa`;
}

function card2(res, data) {
  const windSpeed_api = data.wind.speed;
  const windDeg_api = data.wind.deg;
  const wind_dir = getWindDirection(windDeg_api);
  let sunrise_api = res.city.sunrise;
  let sunrise_time = UnixToLocalTime(sunrise_api);
  let sunset_api = res.city.sunset;
  let sunset_time = UnixToLocalTime(sunset_api);
  // Wind Speed
  const windSpeed = document.querySelector("#wind_speed");
  windSpeed.textContent = `${windSpeed_api}mph`;
  // Wind Direction
  const windDirection = document.querySelector("#wind_direction");
  windDirection.textContent = `${wind_dir}`;
  //  Sunrise
  const sunrise = document.querySelector("#sunrise_time");
  sunrise.textContent = `${sunrise_time} AM`;
  // Sunset
  const sunset = document.querySelector("#sunset_time");
  sunset.textContent = `${sunset_time} PM`;
}

// ! Helper Function

function createCustomElement(ele, classArr) {
  const element = document.createElement(ele);
  classArr !== undefined && element.classList.add(classArr);
  return element;
}

function getCurrentDate() {
  const obj = new Date().toLocaleDateString();
  let [date, month, year] = obj.split("/");
  if (date < 10) date = `0${date}`;
  if (month < 10) month = `0${month}`;
  const newDate = `${year}-${date}-${month}`;
  return newDate;
}

function UnixToLocalTime(unixTime) {
  let time = new Date(unixTime * 1000);
  time = time.toLocaleTimeString();
  let [hr, min, sec] = time.split(":");
  hr = hr > 12 ? hr - 12 : hr;
  return `${hr}:${min}`;
}

function getCountry(code) {
  let regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(code);
}

function getDay(index) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[index];
}

function getMonth(index) {
  const month = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  return month[index];
}

function getWindDirection(deg) {
  let direction = "";
  if (deg > 11.25 && deg <= 33.75) return "North-Northeast";
  if (deg > 33.75 && deg <= 56.25) return "Northeast";
  if (deg > 56.25 && deg <= 78.75) return "East-Northeast";
  if (deg > 78.75 && deg <= 101.25) return "East";
  if (deg > 101.25 && deg <= 123.75) return "East-Souteast";
  if (deg > 123.75 && deg <= 146.25) return "Souteast";
  if (deg > 146.25 && deg <= 168.75) return "South-Southeast";
  if (deg > 168.75 && deg <= 191.25) return "South";
  if (deg > 191.25 && deg <= 213.75) return "South-Southwest";
  if (deg > 213.75 && deg <= 236.25) return "Southwest";
  if (deg > 236.25 && deg <= 258.75) return "West-Southwest";
  if (deg > 258.75 && deg <= 281.25) return "West";
  if (deg > 281.25 && deg <= 303.75) return "West-Northwest";
  if (deg > 303.75 && deg <= 326.25) return "Northwest";
  if (deg > 326.25 && deg <= 348.75) return "North-Northwest";
  return "North";
}

function displayError(msg) {
  if (timer) closeError();
  error_p.textContent = msg;
  error.classList.add("show");

  let width = 100;
  timer = setInterval(() => {
    width -= 2;
    error_progress.style.width = `${width}%`;
    if (width < 0) {
      closeError();
    }
  }, 100);
}

function closeError() {
  error.classList.remove("show");
  clearInterval(timer);
  error_p.textContent = "";
}
