document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('plan-form');
  const locInput     = document.getElementById('location-input');
  const suggestions  = document.getElementById('location-suggestions');
  const dateInput    = document.getElementById('date-input');
  const promptEl     = document.getElementById('prompt');
  const sendBtn      = document.getElementById('send-btn');
  const errDiv       = document.getElementById('error-msg');
  const forecastDiv  = document.getElementById('hourly-forecast');
  const hiddenHourly = document.getElementById('hourly-forecast-input');
  const OWM_KEY      = window.OWM_KEY;

  let locationSelected = false;
  let dateSelected     = false;
  let currentCoords    = null;
  let lastHourly       = [];

  dateInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
  });

  function updatePromptState() {
    dateSelected = !!dateInput.value && lastHourly.length > 0;
    promptEl.disabled = sendBtn.disabled = !(locationSelected && dateSelected);
  }

  function clearSuggestions() {
    suggestions.innerHTML     = '';
    suggestions.style.display = 'none';
  }
  function showSuggestions(list) {
    suggestions.innerHTML = list
      .map(t => `<div class="autocomplete-item">${t}</div>`)
      .join('');
    suggestions.style.display = 'block';
    Array.from(suggestions.children).forEach(item => {
      item.addEventListener('click', () => {
        locInput.value        = item.textContent;
        locationSelected      = true;
        clearSuggestions();
        geocodeAndForecast(item.textContent);
        updatePromptState();
      });
    });
  }

  function geocodeAndForecast(q) {
    fetch(
      `https://api.openweathermap.org/geo/1.0/direct?` +
      `q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}`
    )
      .then(r => r.json())
      .then(arr => {
        if (!arr[0]) throw new Error('Not found');
        currentCoords = { lat: arr[0].lat, lon: arr[0].lon };
        renderForecast(arr[0].lat, arr[0].lon);
      })
      .catch(() => {
        forecastDiv.innerHTML = '<p style="color:red;">Error fetching coords.</p>';
      });
  }

  locInput.addEventListener('input', () => {
    locationSelected = false;
    updatePromptState();
    clearSuggestions();
    const q = locInput.value.trim();
    if (q.length < 2) return;
    clearTimeout(form._timer);
    form._timer = setTimeout(() => {
      fetch(
        `https://api.openweathermap.org/geo/1.0/direct?` +
        `q=${encodeURIComponent(q)}&limit=5&appid=${OWM_KEY}`
      )
        .then(r => r.json())
        .then(places => {
          showSuggestions(
            places.map(
              p => `${p.name}${p.state?`, ${p.state}`:''}, ${p.country}`
            )
          );
        });
    }, 300);
  });
  document.addEventListener('click', e => {
    if (e.target !== locInput && !suggestions.contains(e.target)) {
      clearSuggestions();
    }
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?` +
          `lat=${coords.latitude}&lon=${coords.longitude}` +
          `&limit=1&appid=${OWM_KEY}`
        )
          .then(r => r.json())
          .then(data => {
            const L = data[0];
            const name = `${L.name}${L.state?`, ${L.state}`:''}, ${L.country}`;
            locInput.value      = name;
            locationSelected    = true;
            currentCoords       = { lat: coords.latitude, lon: coords.longitude };
            renderForecast(coords.latitude, coords.longitude);
            updatePromptState();
          });
      },
      () => { locInput.placeholder = 'Type to search location…'; }
    );
  } else {
    locInput.placeholder = 'Type to search location…';
  }

  if (typeof flatpickr === 'function') {
    flatpickr(dateInput, {
      dateFormat: 'd/m/Y',
      position:   'below',
      minDate:    '2025-01-01',
      clickOpens: true,
      allowInput: false,
      onReady(_, __, fp) {
        const cal  = fp.calendarContainer;
        let footer = cal.querySelector('.flatpickr-footer');
        if (!footer) {
          footer = document.createElement('div');
          footer.className = 'flatpickr-footer';
          cal.appendChild(footer);
        }
        footer.innerHTML = '';
        ['Clear', 'Today'].forEach(txt => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = txt;
          b.addEventListener('click', () => {
            if (txt === 'Clear') {
              fp.clear();
              lastHourly = [];
              hiddenHourly.value = '';
            } else {
              fp.setDate(new Date(), true);
            }
            updatePromptState();
            fp.close();
          });
          footer.appendChild(b);
        });
      },
      onChange(_, __) {
        updatePromptState();
        if (locationSelected && dateInput.value && currentCoords) {
          renderForecast(currentCoords.lat, currentCoords.lon);
        }
      }
    });
  } else {
    console.error('⚠️ flatpickr not loaded');
  }

  function renderForecast(lat, lon) {
    forecastDiv.innerHTML = '<p>Loading forecast…</p>';
    fetch(
      `https://pro.openweathermap.org/data/2.5/forecast/hourly?` +
      `lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`
    )
      .then(r => {
        if (!r.ok) throw new Error(`OWM ${r.status}`);
        return r.json();
      })
      .then(data => {
        const [dd, mm, yy] = dateInput.value.split('/').map(Number);
        const hours = data.list.filter(item => {
          const d = new Date(item.dt * 1000);
          return (
            d.getFullYear() === yy &&
            d.getMonth()+1   === mm &&
            d.getDate()     === dd
          );
        });
        lastHourly = hours;
        hiddenHourly.value = JSON.stringify(hours);
        if (!hours.length) {
          forecastDiv.innerHTML = '<p>No hourly data for this date.</p>';
          updatePromptState();
          return;
        }
        updatePromptState();
        const icons = {
          '01d':'☀️','01n':'🌙','02d':'🌤️','02n':'☁️',
          '03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
          '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
          '11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️',
          '50d':'🌫️','50n':'🌫️'
        };
        forecastDiv.innerHTML = `
          <h2>Hourly for ${dd}/${mm}/${yy}</h2>
          <div class="hourly-cards">
            ${hours.map(h => {
              const d  = new Date(h.dt*1000);
              const hr = d.getHours();
              const lbl= (hr%12||12)+(hr<12?' AM':' PM');
              return `
                <div class="hourly-card">
                  <div class="hour-label">${lbl}</div>
                  <div class="hour-emoji">${icons[h.weather[0].icon]||''}</div>
                  <div class="hour-temp">${Math.round(h.main.temp)}°C</div>
                  <div class="hour-desc">${h.weather[0].description}</div>
                </div>`;
            }).join('')}
          </div>`;
      })
      .catch(err => {
        console.error(err);
        forecastDiv.innerHTML = `<p style="color:red;">Error:<br>${err.message}</p>`;
      });
  }

  dateInput.value = '';
  updatePromptState();
});
