document.querySelectorAll('.done-button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.getElementById('feedback-modal').classList.add('active');
  });
});

document.querySelector('.modal-close').addEventListener('click', function() {
  document.getElementById('feedback-modal').classList.remove('active');
});