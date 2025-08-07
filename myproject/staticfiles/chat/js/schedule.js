//schedule.js
// On page load, this section creates and populates the schedule.

document.addEventListener('DOMContentLoaded', () => {
  // On load, replace each weather description paragraph with its emoji.
  // Uses iconFor(code) from weather.js to map data-weather-code to emoji.
  document.querySelectorAll('.weather-desc').forEach(el => {
    const code = el.dataset.weatherCode;
    if (!code) return;
    const emoji = iconFor(code);  
    if (emoji) el.textContent = emoji;
  });
  const cards         = Array.from(document.querySelectorAll('.schedule-card'));
  const feedbackModal = document.getElementById('feedback-modal');
  const summaryModal  = document.getElementById('summary-modal');
  const loaderPanel   = document.getElementById('loader-panel');
  const cancelLoader  = document.getElementById('loader-cancel');
  const closeSummary  = document.getElementById('close-summary');
  const summaryBody   = document.querySelector('.summary-body');
  const daySummary    = document.getElementById('day-summary');
  const dayRefl       = document.getElementById('day-reflections');
  const accomList     = document.getElementById('accomplishments-list');
  const nextStep      = document.getElementById('next-step');
  const helperInput   = document.getElementById('helper-question');
  const helperBtn     = document.getElementById('helper-send');
  const helperReply   = document.getElementById('helper-reply');

  let completedCount = 0,
      currentCard    = null,
      rating         = 0,
      abortCtrl      = null;

  // Open feedback modal
  function openFeedback(card) {
    currentCard = card;
    rating = 0;
    feedbackModal.querySelectorAll('.rating-stars span')
      .forEach(s => s.classList.remove('selected'));
    document.getElementById('feedback-text').value = '';
    feedbackModal.classList.remove('hidden');
  }

  // Close feedback modal
  function closeFeedback() {
    feedbackModal.classList.add('hidden');
  }

  // Wire up Complete / Undo buttons
  cards.forEach(card => {
    const btnC = card.querySelector('.btn-complete');
    const btnU = card.querySelector('.btn-undo');
    const fbD  = card.querySelector('.feedback-display');

    btnC.onclick = () => {
      if (!card.classList.contains('completed')) openFeedback(card);
    };
    btnU.onclick = () => {
      card.classList.remove('completed');
      btnC.classList.remove('hidden');
      btnU.classList.add('hidden');
      fbD.classList.add('hidden');
      completedCount = Math.max(0, completedCount - 1);
      if (abortCtrl) {
        abortCtrl.abort();
        loaderPanel.classList.add('hidden');
      }
    };
  });

  // Rating stars
  feedbackModal.querySelectorAll('.rating-stars span')
    .forEach(star => {
      star.onclick = () => {
        rating = +star.dataset.value;
        feedbackModal.querySelectorAll('.rating-stars span')
          .forEach(s => s.classList.toggle('selected', +s.dataset.value <= rating));
      };
    });

  // Feedback modal buttons
  document.getElementById('feedback-cancel').onclick = closeFeedback;
  document.getElementById('feedback-submit').onclick = () => {
    if (!currentCard) return;
    closeFeedback();
    currentCard.classList.add('completed');
    currentCard.querySelector('.btn-complete').classList.add('hidden');
    currentCard.querySelector('.btn-undo').classList.remove('hidden');
    currentCard.querySelector('.feedback-stars').textContent =
      '⭐'.repeat(rating);
    currentCard.querySelector('.feedback-comment').textContent =
      document.getElementById('feedback-text').value || 'No comment';
    currentCard.querySelector('.feedback-display').classList.remove('hidden');

    completedCount++;
    if (completedCount === cards.length) {
      startReflection();
    }
  };

  // Start reflection (build summary)
  function startReflection() {
    summaryModal.classList.remove('hidden');
    loaderPanel.classList.remove('hidden');
    summaryBody.classList.add('hidden');
    closeSummary.classList.add('hidden');

    const activities = cards.map(c => ({
      time:        c.querySelector('.time').textContent.replace('🕒 ','').trim(),
      location:    c.querySelector('.loc').textContent.replace('📍 ','').trim(),
      description: c.querySelector('.card-details p').textContent.trim(),
      rating:      c.querySelector('.feedback-stars').textContent.length,
      feedback:    c.querySelector('.feedback-comment').textContent.trim()
    }));

    abortCtrl = new AbortController();
    fetch(window.REFLECT_URL, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'X-CSRFToken': window.csrftoken
      },
      body: JSON.stringify({ activities }),
      signal: abortCtrl.signal
    })
    .then(r => r.json())
    .then(data => {
      loaderPanel.classList.add('hidden');
      daySummary.textContent   = data.summary;
      dayRefl.textContent      = data.reflections;
      accomList.innerHTML      = data.accomplishments.map(i=>`<li>${i}</li>`).join('');
      nextStep.textContent     = data.next_step;

      summaryBody.classList.remove('hidden');
      closeSummary.classList.remove('hidden');
    })
    .catch(() => {
      loaderPanel.classList.add('hidden');
      daySummary.textContent = 'Reflection cancelled or error.';
      summaryBody.classList.remove('hidden');
      closeSummary.classList.remove('hidden');
    });
  }

  // Close summary modal
  closeSummary.onclick = () => {
    summaryModal.classList.add('hidden');
  };

  // Cancel during reflection build
  cancelLoader.addEventListener('click', () => {
    if (abortCtrl) abortCtrl.abort();
    loaderPanel.classList.add('hidden');
    summaryModal.classList.add('hidden');
  });

  // Click outside to close modals
  window.addEventListener('click', e => {
    if (e.target === feedbackModal) closeFeedback();
    if (e.target === summaryModal) summaryModal.classList.add('hidden');
  });

  // AI Helper
  helperBtn.onclick = () => {
    const q = helperInput.value.trim();
    if (!q) return;
    helperReply.textContent = '🤖 Thinking…';
    helperInput.value = '';
    helperReply.classList.remove('hidden');

    const activities = cards.map(c => ({
      time:        c.querySelector('.time').textContent.replace('🕒 ','').trim(),
      location:    c.querySelector('.loc').textContent.replace('📍 ','').trim(),
      description: c.querySelector('.card-details p').textContent.trim(),
      rating:      c.querySelector('.feedback-stars').textContent.length,
      feedback:    c.querySelector('.feedback-comment').textContent.trim()
    }));

    fetch(window.HELPER_URL, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'X-CSRFToken': window.csrftoken
      },
      body: JSON.stringify({ question: q, activities })
    })
    .then(r => r.json())
    .then(d => {
      helperReply.textContent = d.reply || 'No answer.';
    })
    .catch(() => {
      helperReply.textContent = 'Error contacting helper.';
    });
  };

  // Disable AI helper if no cards
  if (cards.length === 0) {
    helperInput.disabled = helperBtn.disabled = true;
  }
});
