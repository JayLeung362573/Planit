import './assets/css/styles_home.css';export default function App() {
  return <img src={logo} alt="Logo" />;
}
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

let lastWeather = null;

async function setWeatherBackground() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const video = document.getElementById('weather-video');
        let src = '';

        const now = data.dt;
        const sunrise = data.sys.sunrise;
        const sunset = data.sys.sunset;
        const weather = data.weather[0].main.toLowerCase();
        // const weather = "thunderstorm";

        console.log('Weather API response liang:', data);
        console.log('Weather condition jiawei:', weather);
        console.log("Weather description:", data.weather[0].description);

        // Remove old weather classes if any
        document.body.classList.remove('weather-clear', 'weather-rain', 'weather-clouds', 
          'weather-snow', 'weather-thunderstorm', 'weather-drizzle', 'weather-mist');
        
        switch (weather) {
            case 'clear':
                src = '/assets/videos/clear.mp4';
                document.body.classList.add('weather-clear');
                break;
            case 'rain':
                if (now >= sunrise) {
                    src = '/assets/videos/rain-morning.mp4';
                } else{
                    // After sunset or before sunrise = evening
                    src = '/assets/videos/rain-evening.mp4';
                }
                document.body.classList.add('weather-rain');
                break;
            case 'clouds':
                src = '/assets/videos/clouds.mp4';
                document.body.classList.add('weather-clouds');
                break;
            case 'snow':
                src = '/assets/videos/snow.mp4';
                document.body.classList.add('weather-snow');
                break;
            case 'thunderstorm':
                src = '/assets/videos/thunderstorm.mp4';
                document.body.classList.add('weather-thunderstorm');
                break;
            case 'drizzle':
                src = '/assets/videos/drizzle.mp4';
                document.body.classList.add('weather-drizzle');
                break;
            case 'fog':
                src = '/assets/videos/fog.mp4';
                document.body.classList.add('weather-mist');
                break;
            default:
                src = '/assets/videos/clear.mp4';
                document.body.classList.add('weather-clear');
        }if (video && src) {
            // For local testing, use absolute URLs if needed
            if (video && src && weather !== lastWeather) {
            video.src = src;
            lastWeather = weather;
          }
        }
    } catch (error) {
        console.error('Failed to set weather background:', error);
    }
}
document.addEventListener('DOMContentLoaded', setWeatherBackground);










