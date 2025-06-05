// Массив для хранения отзывов
let reviews = [];

// Основные DOM-элементы
const elements = {
  reviewBtn: document.querySelector('.btn-review'),
  cancelBtn: document.querySelector('.btn-cancel'),
  reviewForm: document.getElementById('reviewForm'),
  noReviewsMsg: document.querySelector('.no-reviews'),
  ratingStars: document.querySelector('.rating-stars'),
  reviewFormElement: document.querySelector('#reviewForm form'),
  reviewsList: document.getElementById('reviewsList'),
  averageRatingElement: document.getElementById('averageRating'),
  datePicker: document.getElementById('selected-date'),
  checkDatesBtn: document.getElementById('check-dates'),
  availableTimes: document.getElementById('available-times'),
  publishedReviews: document.getElementById('published-reviews')
};

// Основная функция, выполняемая после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  initAnimations();
  initSmoothScroll();
  initNavHighlighting();
  initPhoneModal();
  initReviewSystem();
  initDatePicker();
  loadReviews(); // Загружаем отзывы из localStorage
});

// Функции инициализации компонентов

function initAnimations() {
  const animateElements = () => {
    document.querySelectorAll('.animate-on-load').forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100 * index);
    });
  };
  animateElements();
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initNavHighlighting() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

function initPhoneModal() {
  const phoneLink = document.querySelector('nav h3 a');
  phoneLink?.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Наш номер: 8-983-368-84-98');
  });
}

function initReviewSystem() {
  // Обработчики для формы отзыва
  elements.reviewBtn?.addEventListener('click', () => {
    elements.reviewForm.classList.remove('hidden');
    elements.noReviewsMsg?.classList.add('hidden');
  });

  elements.cancelBtn?.addEventListener('click', () => {
    elements.reviewForm.classList.add('hidden');
    elements.noReviewsMsg?.classList.remove('hidden');
  });

  // Рейтинг звездами
  elements.ratingStars?.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const rating = Math.round(percent * 5);

    document.getElementById('reviewRating').value = rating;
    document.querySelector('.rating-select').style.width = `${rating * 20}%`;
  });

  // Отправка формы отзыва
  elements.reviewFormElement?.addEventListener('submit', function(e) {
    e.preventDefault();

    const review = {
      name: document.getElementById('reviewName').value.trim() || 'Анонимный пользователь',
      rating: document.getElementById('reviewRating').value,
      text: document.getElementById('reviewText').value.trim(),
      date: new Date().toLocaleDateString('ru-RU')
    };

    saveReview(review);
    this.reset();
    document.querySelector('.rating-select').style.width = '100%';
    elements.reviewForm.classList.add('hidden');
    loadReviews();
  });
}

function initDatePicker() {
  if (elements.datePicker) {
    flatpickr(elements.datePicker, {
      dateFormat: "Y-m-d",
      locale: "ru",
      minDate: "today"
    });

    elements.checkDatesBtn?.addEventListener('click', checkAvailability);
  }
}

// Обработка нажатия кнопки "Проверить"
async function checkAvailability() {
  const selectedDate = elements.datePicker.value;
  if (!selectedDate) {
    elements.availableTimes.innerHTML = '<p>Пожалуйста, выберите дату.</p>';
    return;
  }

  try {
    const response = await fetch(`available-times?date=${selectedDate}`);
    const availableTimes = await response.json();

    elements.availableTimes.innerHTML = availableTimes.length > 0 
      ? `<p>Свободные часы для брони зала на ${selectedDate}: <strong>${availableTimes.join(', ')}</strong></p>`
      : '<p>На выбранную дату нет доступных часов.</p>';
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    elements.availableTimes.innerHTML = '<p>Не удалось загрузить данные о доступных часах.</p>';
  }
}

// Функции работы с отзывами

function loadReviews() {
  reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  displayReviews();
}

function displayReviews() {
  if (!elements.reviewsList) return;

  elements.reviewsList.innerHTML = '';

  if (reviews.length === 0) {
    elements.noReviewsMsg?.classList.remove('hidden');
    return;
  }

  reviews.forEach(review => {
    const reviewElement = document.createElement('div');
    reviewElement.classList.add('review');
    reviewElement.innerHTML = `
      <h4 class="review-name">${review.name}</h4>
      <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
      <p class="review-text">${review.text}</p>
      <p class="review-date">${review.date}</p>
    `;
    elements.reviewsList.appendChild(reviewElement);
  });

  updateAverageRating();
}

function saveReview(review) {
  reviews.push(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  updateAverageRating();
}

function updateAverageRating() {
  if (!elements.averageRatingElement) return;

  if (reviews.length === 0) {
    elements.averageRatingElement.textContent = '0';
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + parseInt(review.rating), 0);
  elements.averageRatingElement.textContent = (totalRating / reviews.length).toFixed(1);
}
