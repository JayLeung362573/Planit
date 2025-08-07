// weather.js
// Handles all weather-related functionality: geocoding, fetching forecasts,
// rendering current conditions, charts, and UI interactions.

// 1) API key
const OWM_KEY = window.OWM_KEY || '';

// 2) Tiny helper functions for formatting strings and timestamps
function capitalizeWords(str) {
  return str.split(' ')
            .map(w => w[0].toUpperCase() + w.slice(1))
            .join(' ');
}
function dayFull(dt) {
  return new Date(dt * 1000)
    .toLocaleDateString('en-US', { weekday: 'long' });
}
function dayShort(dt) {
  return new Date(dt * 1000)
    .toLocaleDateString('en-US', { weekday: 'short' });
}
function hourLabel(dt) {
  let h = new Date(dt * 1000).getHours(),
      ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}${ampm}`;
}

// 3) Emoji map
const ICONS = {
  '01d':'☀️','01n':'🌙','02d':'🌤️','02n':'☁️',
  '03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
  '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
  '11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️',
  '50d':'🌫️','50n':'🌫️'
};
function iconFor(code) { return ICONS[code] || ''; }

// 4) DOM refs
const locInput   = document.getElementById('location-input'),
      suggEl     = document.getElementById('location-suggestions'),
      overlay    = document.getElementById('loading-overlay'),
      currentEls = {
        temp: document.getElementById('temp-value'),
        desc: document.getElementById('current-desc'),
        day:  document.getElementById('day-name'),
        feel:document.getElementById('feels-like'),
        hum:  document.getElementById('humidity'),
        wind: document.getElementById('wind')
      },
      chartCanvas= document.getElementById('hourly-chart'),
      hoursList  = document.getElementById('hours-list'),
      forecastEl = document.getElementById('forecast-4day'),
      subLabel   = document.querySelector('.sub-label');

// 5) State
let oneCallData = null,
    hourly96    = [];

// 6) Autocomplete geocoding (direct)
// Debounce timer for geocoding requests
let geoTimer;
locInput.addEventListener('input', () => {
  clearTimeout(geoTimer);
  const q = locInput.value.trim();
  if (q.length < 2) return hideSugg();
  geoTimer = setTimeout(() => {
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${OWM_KEY}`)
      .then(r => r.json())
      .then(arr => {
        if (!Array.isArray(arr)) return hideSugg();
        suggEl.innerHTML = arr.map(p => `
          <div class="autocomplete-item" data-lat="${p.lat}" data-lon="${p.lon}">
            ${p.name}${p.state?`, ${p.state}`:''}, ${p.country}
          </div>
        `).join('');
        suggEl.style.display = 'block';
        suggEl.querySelectorAll('.autocomplete-item').forEach(item => {
          item.onclick = () => {
            const lat = parseFloat(item.dataset.lat),
                  lon = parseFloat(item.dataset.lon);
            locInput.value = item.textContent;
            hideSugg();
            initLoad(lat, lon);
          };
        });
      })
      .catch(hideSugg);
  }, 300);
});
document.addEventListener('click', e => {
  if (e.target !== locInput && !suggEl.contains(e.target)) hideSugg();
});
function hideSugg() {
  suggEl.innerHTML = '';
  suggEl.style.display = 'none';
}

// 7) Reverse-geocode to fill input
function reverseGeocode(lat, lon) {
  fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`)
    .then(r => r.json())
    .then(arr => {
      if (!arr[0]) return;
      const p = arr[0];
      locInput.value = `${p.name}${p.state?`, ${p.state}`:''}, ${p.country}`;
    })
    .catch(() => {});
}

// 8a) Fetch from free One Call API (current + daily + hourly)
async function fetchOneCall(lat, lon) {
  const url =
    `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}` +
    `&units=metric&exclude=minutely,alerts&appid=${OWM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw Error('OneCall failed');
  return res.json();
}
// 8b) Fetch 96-hour forecast from Pro API, fallback to free hourly
async function fetch96h(lat, lon) {
  try {
    const url =
      `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}` +
      `&lon=${lon}&units=metric&appid=${OWM_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw Error('Pro96h failed');
    const json = await res.json();
    if (Array.isArray(json.list) && json.list.length) {
      // unify each entry to have .temp at top-level
      return json.list.map(h => ({
        dt:   h.dt,
        temp: h.main.temp,
        weather: h.weather,
      }));
    }
    throw Error('No list');
  } catch {
    console.warn('Fallback to free hourly');
    // free oneCall hourly already has .temp on each item
    return (oneCallData.hourly || []).map(h => ({
      dt:   h.dt,
      temp: h.temp,
      weather: h.weather,
    }));
  }
}

// 9) Main loader
async function initLoad(lat, lon) {
  overlay.style.display = 'flex';
  try {
    oneCallData = await fetchOneCall(lat, lon);
    hourly96    = await fetch96h(lat, lon);
    reverseGeocode(lat, lon);
    renderCurrent();
    renderMultiDay(oneCallData.daily);
    selectDay(oneCallData.daily[0].dt);
  } catch (e) {
    console.error(e);
    currentEls.desc.textContent = 'Error loading weather';
  } finally {
    overlay.style.display = 'none';
  }
}

// 10) Render top summary (current or selected day)
function renderCurrent() {
  const c = oneCallData.current;
  currentEls.temp.textContent = Math.round(c.temp);
  currentEls.desc.textContent = capitalizeWords(c.weather[0].description);
  currentEls.day.textContent  = dayFull(c.dt);
  currentEls.feel.textContent = `Feels like: ${Math.round(c.feels_like)}°C`;
  currentEls.hum.textContent  = `Humidity: ${c.humidity}%`;
  currentEls.wind.textContent = `Wind: ${Math.round(c.wind_speed * 3.6)} km/h`;
}
// Update summary when a day card is selected
function updateDaySummary(d) {
  currentEls.temp.textContent = Math.round(d.temp.day);
  currentEls.desc.textContent = capitalizeWords(d.weather[0].description);
  currentEls.day.textContent  = dayFull(d.dt);
  currentEls.feel.textContent = `High: ${Math.round(d.temp.max)}° Low: ${Math.round(d.temp.min)}°`;
  currentEls.hum.textContent  = `Humidity: ${d.humidity}%`;
  currentEls.wind.textContent = `Wind: ${Math.round(d.wind_speed * 3.6)} km/h`;
}

// 11) Hourly chart + badges + tooltip
function renderHourlyForDay(dt) {
  const hrs = hourly96
    .filter(h => new Date(h.dt*1000).getDate() === new Date(dt*1000).getDate())
    .slice(0,24);

  drawChart(hrs);
  renderBadges(hrs);
  subLabel.textContent = `Hourly for ${dayShort(dt)}`;

  // tooltip
  const tooltip = document.getElementById('chart-tooltip');
  const pad = 20, uW = chartCanvas.clientWidth - pad*2;
  chartCanvas.onmousemove = e => {
    const rect = chartCanvas.getBoundingClientRect();
    const xRel = e.clientX - rect.left - pad;
    const idx  = Math.round((xRel / uW) * (hrs.length-1));
    if (idx>=0 && idx<hrs.length) {
      const t = Math.round(hrs[idx].temp);
      tooltip.style.left = `${e.clientX - rect.left + 8}px`;
      tooltip.style.top  = `${e.clientY - rect.top - 32}px`;
      tooltip.textContent = `${hourLabel(hrs[idx].dt)} – ${t}°C`;
      tooltip.style.display = 'block';
    }
  };
  chartCanvas.onmouseleave = () => tooltip.style.display = 'none';
}

function drawChart(hrs) {
  const c   = chartCanvas,
        ctx = c.getContext('2d'),
        w   = c.clientWidth, h = c.clientHeight,
        dpr = devicePixelRatio;
  c.width  = w*dpr;
  c.height = h*dpr;
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h);
  if (!hrs.length) return;

  const temps = hrs.map(x => Math.round(x.temp)),
        min   = Math.min(...temps),
        max   = Math.max(...temps),
        pad   = 20,
        uW    = w - pad*2,
        uH    = h - pad*2;

  // fill
  const grad = ctx.createLinearGradient(0,pad,0,h-pad);
  grad.addColorStop(0,'rgba(124,92,255,0.3)');   // semi-opaque purple
  grad.addColorStop(1,'rgba(124,92,255,0.05)');  // very light purple
  ctx.beginPath();
  ctx.moveTo(pad, pad + ((max - temps[0])/(max-min||1))*uH);
  temps.forEach((t,i) => {
    const x = pad + (i/(temps.length-1))*uW;
    const y = pad + ((max - t)/(max-min||1))*uH;
    ctx.lineTo(x,y);
  });
  ctx.lineTo(pad + uW, h-pad);
  ctx.lineTo(pad, h-pad);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // stroke
  ctx.beginPath();
  temps.forEach((t,i) => {
    const x = pad + (i/(temps.length-1))*uW;
    const y = pad + ((max - t)/(max-min||1))*uH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent2').trim();
  ctx.lineWidth   = 2;
  ctx.stroke();

  // dots
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent2').trim();
  temps.forEach((t,i) => {
    const x = pad + (i/(temps.length-1))*uW;
    const y = pad + ((max - t)/(max-min||1))*uH;
    ctx.beginPath();
    ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fill();
  });
}

// Render hourly badges (emoji + time + temp)
function renderBadges(hrs) {
  hoursList.innerHTML = '';
  hrs.forEach(hh => {
    const em = iconFor(hh.weather[0].icon);
    const div = document.createElement('div');
    div.className = 'hour-badge';
    div.innerHTML = `
      <div class="emoji">${em}</div>
      <div class="time">${hourLabel(hh.dt)}</div>
      <div class="temp">${Math.round(hh.temp)}°</div>
    `;
    hoursList.appendChild(div);
  });
}

// 12) 4-day cards & click
function renderMultiDay(daily) {
  forecastEl.innerHTML = '';
  daily.slice(0,4).forEach(day => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-card';
    btn.innerHTML = `
      <div class="day-name">${dayShort(day.dt)}</div>
      <div class="day-icon">${iconFor(day.weather[0].icon)}</div>
      <div class="day-temp">
        <span>${Math.round(day.temp.max)}°</span>
        <span class="low">${Math.round(day.temp.min)}°</span>
      </div>
      <div class="small-desc">${capitalizeWords(day.weather[0].description)}</div>
    `;
    btn.onclick = () => {
      selectDay(day.dt);
      updateDaySummary(day);
    };
    forecastEl.appendChild(btn);
  });
}
function selectDay(dt) {
  renderHourlyForDay(dt);
}

// 13) Init + geo fallback
document.addEventListener('DOMContentLoaded', () => {
  overlay.style.display = 'none';
  let geoOK = false;
  const to = setTimeout(() => {
    if (!geoOK) overlay.style.display = 'none';
  }, 3000);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        geoOK = true; clearTimeout(to);
        initLoad(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        clearTimeout(to);
        overlay.style.display = 'none';
      },
      { timeout: 2500 }
    );
  } else {
    clearTimeout(to);
    overlay.style.display = 'none';
  }

  locInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
  });
});
