/*
  schedule.js
  - Handles the activity planning form:
    • Autocomplete location input (OpenWeatherMap Geocoding API)
    • Date picker (flatpickr)
    • Fetch and inject hourly weather forecast
    • Enable/disable prompt and send button based on validation
*/
document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('plan-form');
  const locInput     = document.getElementById('location-input');
  const suggestions  = document.getElementById('location-suggestions');
  const dateInput    = document.getElementById('date-input');
  const promptEl     = document.getElementById('prompt');
  const sendBtn      = document.getElementById('send-btn');
  const errDiv       = document.getElementById('error-msg');
  const hourlyInput  = document.getElementById('hourly-forecast-input');
  const OWM_KEY      = window.OWM_KEY;

  let locationSelected = false;
  let dateSelected     = false;
  let currentCoords    = null;

  let validationTimer = null;

  // On form submit: fetch hourly forecast then submit form
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (currentCoords) {
      await updateHourlyInput(currentCoords.lat, currentCoords.lon);
    }
    form.submit();
  });

  // Prevent Enter key from submitting date input
  dateInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.preventDefault();
  });

  // updatePromptState: toggle prompt and button based on validation
  function updatePromptState() {
    dateSelected = !!dateInput.value.trim();
    const ready = locationSelected && dateSelected;

    if (ready) {
      promptEl.disabled = false;
      promptEl.classList.remove('invalid');
      promptEl.classList.add('valid');
      errDiv.textContent = 'Ready to generate.';
      errDiv.style.color = 'var(--accent-green)';
    } else {
      promptEl.disabled = true;
      promptEl.classList.remove('valid');
      promptEl.classList.add('invalid');
      if (!locationSelected && !dateSelected) {
        errDiv.textContent = 'Location and date are required.';
      } else if (!locationSelected) {
        errDiv.textContent = 'Location is required.';
      } else if (!dateSelected) {
        errDiv.textContent = 'Date is required.';
      }
      errDiv.style.color = '#ff6b6b';
    }

    sendBtn.disabled = !ready;
  }

  // debouncedUpdate: debounce validation calls
  function debouncedUpdate() {
    clearTimeout(validationTimer);
    validationTimer = setTimeout(updatePromptState, 120);
  }

  // clearSuggestions: hide and clear autocomplete list
  function clearSuggestions() {
    suggestions.innerHTML     = '';
    suggestions.style.display = 'none';
  }

  // showSuggestions: render autocomplete items and handle selection
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
        geocode(item.textContent);
        debouncedUpdate();
      });
    });
  }

  // updateHourlyInput: fetch and slim hourly forecast from OpenWeatherMap Pro API
  async function updateHourlyInput(lat, lon) {
    try {
      const url =
        `https://pro.openweathermap.org/data/2.5/forecast/hourly` +
        `?lat=${lat}&lon=${lon}` +
        `&units=metric&appid=${OWM_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const slim = Array.isArray(data.list)
        ? data.list.map(h => ({
            dt_txt:   h.dt_txt,
            temp: h.main.temp,
            icon: h.weather[0].icon,
            description: h.weather[0].description
          }))
        : [];
      hourlyInput.value = JSON.stringify(slim);
    } catch (err) {
      console.error('Error fetching hourly forecast:', err);
      // leave [] if it fails
    }
  }  

  // geocode: get coordinates for a location query and update hourly forecast
  function geocode(q) {
    fetch(
      `https://api.openweathermap.org/geo/1.0/direct?` +
      `q=${encodeURIComponent(q)}&limit=1&appid=${OWM_KEY}`
    )
      .then(r => r.json())
      .then(arr => {
        if (!arr[0]) throw new Error('Not found');
        const lat = arr[0].lat, lon = arr[0].lon;
        currentCoords = { lat, lon };
        updateHourlyInput(lat, lon);
        debouncedUpdate();
      })
      .catch(() => {
        errDiv.textContent = 'Error fetching location.';
        errDiv.style.color = '#ff6b6b';
      });
  }

  // On location input: debounce, clear suggestions, fetch new suggestions
  locInput.addEventListener('input', () => {
    locationSelected = false;
    debouncedUpdate();
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

  // Hide suggestions when clicking outside of input or suggestion box
  document.addEventListener('click', e => {
    if (e.target !== locInput && !suggestions.contains(e.target)) {
      clearSuggestions();
    }
  });

  // Attempt to get user's current position and reverse geocode on load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude, lon = coords.longitude;
        currentCoords = { lat, lon };
        updateHourlyInput(lat, lon);
        fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?` +
          `lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`
        )
          .then(r => r.json())
          .then(data => {
            if (!data[0]) return;
            const L = data[0];
            locInput.value   = `${L.name}${L.state?`, ${L.state}`:''}, ${L.country}`;
            locationSelected = true;
            debouncedUpdate();
          });
      },
      () => { locInput.placeholder = 'Type to search location…'; }
    );
  } else {
    locInput.placeholder = 'Type to search location…';
  }

  // Initialize flatpickr date picker if available
  if (typeof flatpickr === 'function') {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 3);

    flatpickr(dateInput, {
      dateFormat: 'd/m/Y',
      position: 'below',
      minDate: today,
      maxDate: maxDate,
      clickOpens: true,
      allowInput: false,
      onChange(_, __) {
        debouncedUpdate();
      },
      onReady(_, __, fp) {
        const cal = fp.calendarContainer;
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
              dateInput.value = '';
            } else {
              fp.setDate(new Date(), true);
            }
            debouncedUpdate();
            fp.close();
          });
          footer.appendChild(b);
        });
      },
      disable: [
      ],
      onOpen() {
      }
    });
  } else {
    console.error('⚠️ flatpickr not loaded');
  }

  // Reset initial state and validate
  dateInput.value = '';
  promptEl.disabled = true;
  sendBtn.disabled = true;
  updatePromptState();
});
