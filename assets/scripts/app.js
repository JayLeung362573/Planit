document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('user-input');
  if (textarea) {
    textarea.addEventListener('keydown', async event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const text = textarea.value.trim();
        if (!text) return;

        try {
          await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });
        } catch (err) {
          console.error('Submit failed:', err);
        }

        textarea.value = '';
        window.location.href = 'loader.html';
      }
    });
    return; 
  }

  const loaderMsg = document.querySelector('.loader-message');
  if (loaderMsg) {
    setTimeout(() => {
      window.location.href = 'schedule.html';
    }, 15000);

    return; 
  }
});




document.addEventListener('DOMContentLoaded', () => {
  const modal     = document.getElementById('feedback-modal');
  const toast     = document.getElementById('toast');
  const closeBtn  = modal.querySelector('.modal-close');
  const stars     = modal.querySelectorAll('.rating-stars .star');
  const comment   = modal.querySelector('.comment-box');
  const favButton = modal.querySelector('.favorite-button');
  const saveBtn   = modal.querySelector('.save-button');

  function hideModal() {
    modal.classList.remove('active');
    stars.forEach(s => s.classList.remove('filled'));
    comment.value = '';
    favButton.classList.remove('favorited');
    favButton.textContent = '🤍 Add to favorites';
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  closeBtn.addEventListener('click', hideModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) hideModal();
  });

  document.querySelectorAll('.done-button').forEach(button => {
    button.addEventListener('click', e => {
      e.stopPropagation();
      const card = button.closest('.schedule-item');
      const done = card.classList.toggle('done');
      button.querySelector('span').textContent = done ? 'Undo' : 'Done';

      if (done) {
        modal.classList.add('active');

        stars.forEach(star => {
          star.onclick = () => {
            const val = +star.dataset.value;
            stars.forEach(s => {
              s.classList.toggle('filled', +s.dataset.value <= val);
            });
          };
        });

        favButton.onclick = () => {
          const f = favButton.classList.toggle('favorited');
          favButton.textContent = f
            ? '❤️ Favorited'
            : '🤍 Add to favorites';
        };

        saveBtn.onclick = () => {
          const rating = [...stars].filter(s => s.classList.contains('filled')).length;
          const userComment = comment.value.trim();
          const isFav = favButton.classList.contains('favorited');
          hideModal();
          showToast(isFav
            ? 'Added to favorites! ⭐️'
            : 'Feedback saved! 👍');
        };

      } else {
        hideModal();
      }
    });
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const messages = [
    'Generating schedule...',
    'Looking for great spots...',
    'Fetching weather data...',
    'Building your personalized plan...'
  ];
  const msgEl = document.getElementById('loader-message');
  const screen = document.querySelector('.loading-screen');

  function showMsg(idx) {
    if (idx >= messages.length) {
      setTimeout(() => screen.classList.add('hidden'), 500);
      return;
    }
    msgEl.textContent = messages[idx];
    msgEl.classList.add('visible');
    setTimeout(() => {
      msgEl.classList.remove('visible');
      setTimeout(() => showMsg(idx + 1), 500);
    }, 2000);
  }

  showMsg(0);
});

const OPENWEATHERMAP_API_KEY = 'add3419a98924f4bde7188bc3f457a65';

// You can use Vancouver, or get user geolocation if needed
const lat = 49.2827;
const lon = -123.1207;

async function setWeatherBackground() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const weather = data.weather[0].main.toLowerCase();

        // Remove old weather classes if any
        document.body.classList.remove('weather-clear', 'weather-rain', 'weather-clouds', 'weather-snow', 'weather-thunderstorm', 'weather-drizzle', 'weather-mist');
        
        // Add new class based on weather
        switch (weather) {
            case 'clear':
                document.body.classList.add('weather-clear');
                break;
            case 'rain':
                document.body.classList.add('weather-rain');
                break;
            case 'clouds':
                document.body.classList.add('weather-clouds');
                break;
            case 'snow':
                document.body.classList.add('weather-snow');
                break;
            case 'thunderstorm':
                document.body.classList.add('weather-thunderstorm');
                break;
            case 'drizzle':
                document.body.classList.add('weather-drizzle');
                break;
            case 'mist':
            case 'fog':
                document.body.classList.add('weather-mist');
                break;
            default:
                // fallback
                document.body.classList.add('weather-clear');
        }
    } catch (error) {
        console.error('Failed to set weather background:', error);
    }
}

document.addEventListener('DOMContentLoaded', setWeatherBackground);










