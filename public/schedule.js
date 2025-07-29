document.querySelectorAll('.done-button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.getElementById('feedback-modal').classList.add('active');
  });
});

document.querySelector('.modal-close').addEventListener('click', function() {
  document.getElementById('feedback-modal').classList.remove('active');
});

document.querySelectorAll('.rating-stars .star').forEach(star => {
  star.addEventListener('click', function() {
    const value = parseInt(this.getAttribute('data-value'));
    document.querySelectorAll('.rating-stars .star').forEach(s => {
      s.classList.toggle('filled', parseInt(s.getAttribute('data-value')) <= value);
    });
  });
});

const favBtn = document.querySelector('.favorite-button');
favBtn.addEventListener('click', function() {
  favBtn.classList.toggle('favorited');
  if (favBtn.classList.contains('favorited')) {
    favBtn.textContent = '❤️ Added to favorites';
  } else {
    favBtn.textContent = '🤍 Add to favorites';
  }
});