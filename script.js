// Массив для хранения отзывов
let reviews = [];

// Основные DOM-элементы
const elements = {
  reviewBtn: document.querySelector('.btn-review'),
  cancelBtn: document.querySelector('.btn-cancel'),
  reviewForm: document.getElementById('reviewForm'),
  noReviewsMsg: document.querySelector('.no-reviews'),
  ratingStars: document.getElementById('ratingStars'), // Исправлено
  reviewFormElement: document.getElementById('reviewFormElement'), // Исправлено
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
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
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
  if (phoneLink) {
    phoneLink.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Наш номер: 8-983-368-84-98');
    });
  }
}

function initReviewSystem() {
  // Обработчики для формы отзыва
  if (elements.reviewBtn) {
    elements.reviewBtn.addEventListener('click', () => {
      elements.reviewForm.classList.remove('hidden');
      if (elements.noReviewsMsg) {
        elements.noReviewsMsg.classList.add('hidden');
      }
    });
  }

  if (elements.cancelBtn) {
    elements.cancelBtn.addEventListener('click', () => {
      elements.reviewForm.classList.add('hidden');
      if (elements.noReviewsMsg) {
        elements.noReviewsMsg.classList.remove('hidden');
      }
    });
  }

  // Рейтинг звездами
  if (elements.ratingStars) {
    elements.ratingStars.addEventListener('click', function(e) {
      const stars = this.querySelectorAll('span');
      const star = e.target.closest('span');
      if (!star) return;

      const rating = parseInt(star.getAttribute('data-value'));
      
      // Подсветка звезд
      stars.forEach((s, index) => {
        s.style.color = index < rating ? '#ffc107' : '#ccc';
      });

      document.getElementById('reviewRating').value = rating;
    });
  }

  // Отправка формы отзыва
  if (elements.reviewFormElement) {
    elements.reviewFormElement.addEventListener('submit', function(e) {
      e.preventDefault();

      const review = {
        name: document.getElementById('reviewName').value.trim() || 'Анонимный пользователь',
        rating: parseInt(document.getElementById('reviewRating').value),
        text: document.getElementById('reviewText').value.trim(),
        date: new Date().toLocaleDateString('ru-RU')
      };

      saveReview(review);
      this.reset();
      
      // Сброс звезд
      if (elements.ratingStars) {
        const stars = elements.ratingStars.querySelectorAll('span');
        stars.forEach(star => {
          star.style.color = '#ccc'; // Сброс цвета звезд
        });
      }
      
      elements.reviewForm.classList.add('hidden');
      loadReviews();
    });
  }
}

function initDatePicker() {
  if (elements.datePicker && typeof flatpickr !== 'undefined') {
    flatpickr(elements.datePicker, {
      dateFormat: "Y-m-d",
      locale: "ru",
      minDate: "today"
    });

    if (elements.checkDatesBtn) {
      elements.checkDatesBtn.addEventListener('click', checkAvailability);
    }
  }
}

// Обработка нажатия кнопки "Проверить"
async function checkAvailability() {
  const selectedDate = elements.datePicker.value;
  if (!selectedDate) {
    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = '<p>Пожалуйста, выберите дату.</p>';
    }
    return;
  }

  try {
    const response = await fetch(`available-times?date=${selectedDate}`);
    const availableTimes = await response.json();

    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = availableTimes.length > 0 
        ? `<p>Свободные часы для брони зала на ${selectedDate}: <strong>${availableTimes.join(', ')}</strong></p>`
        : '<p>На выбранную дату нет доступных часов.</p>';
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = '<p>Не удалось загрузить данные о доступных часах.</p>';
    }
  }
}

// Функции работы с отзывами
function loadReviews() {
  try {
    const storedReviews = localStorage.getItem('reviews');
    reviews = storedReviews ? JSON.parse(storedReviews) : [];
    
    // Добавляем тестовые отзывы, если нет сохраненных
    if (reviews.length === 0) {
      reviews = [
        {
          name: "Анна",
          rating: 5,
          text: "Отличный центр, детям очень понравилось!",
          date: new Date().toLocaleDateString('ru-RU')
        },
        {
          name: "Иван",
          rating: 4,
          text: "Хорошее место, но цены могли бы быть ниже",
          date: new Date().toLocaleDateString('ru-RU')
        }
      ];
      localStorage.setItem('reviews', JSON.stringify(reviews));
    }
    
    displayReviews();
  } catch (e) {
    console.error("Ошибка загрузки отзывов:", e);
    displayDefaultReviews();
  }
}

function displayReviews() {
  if (!elements.reviewsList) return;

  elements.reviewsList.innerHTML = '';

  if (reviews.length === 0) {
    if (elements.noReviewsMsg) {
      elements.noReviewsMsg.classList.remove('hidden');
    }
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

function displayDefaultReviews() {
  if (!elements.reviewsList) return;
  
  elements.reviewsList.innerHTML = `
    <div class="review">
      <h4 class="review-name">Мария</h4>
      <div class="review-rating">★★★★★</div>
      <p class="review-text">Прекрасное место для семейного отдыха!</p>
      <p class="review-date">${new Date().toLocaleDateString('ru-RU')}</p>
    </div>
    <div class="review">
      <h4 class="review-name">Сергей</h4>
      <div class="review-rating">★★★★☆</div>
      <p class="review-text">Хороший сервис, детям понравилось</p>
      <p class="review-date">${new Date().toLocaleDateString('ru-RU')}</p>
    </div>
  `;
  
  if (elements.averageRatingElement) {
    elements.averageRatingElement.textContent = '4.5';
  }
}

function saveReview(review) {
  reviews.push(review);
  try {
    localStorage.setItem('reviews', JSON.stringify(reviews));
    updateAverageRating();
  } catch (e) {
    console.error("Ошибка сохранения отзыва:", e);
  }
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

