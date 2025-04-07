// API Configuration
const API_BASE_URL = 'https://your-backend-url.com/api'; // Replace with your actual backend URL

// DOM Elements
const newsForm = document.getElementById('news-form');
const newsList = document.getElementById('news-list');
const searchInput = document.getElementById('search-input');
const locationFilter = document.getElementById('location-filter');
const dateFilter = document.getElementById('date-filter');

// Event Listeners
newsForm.addEventListener('submit', handleNewsSubmit);
searchInput.addEventListener('input', handleSearch);
locationFilter.addEventListener('change', handleFilters);
dateFilter.addEventListener('change', handleFilters);

// Handle News Submission
async function handleNewsSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(newsForm);
    
    try {
        const response = await fetch(`${API_BASE_URL}/submit`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('News submitted successfully!', 'success');
            newsForm.reset();
            loadNews(); // Refresh news list
        } else {
            showNotification(data.error || 'Failed to submit news', 'error');
        }
    } catch (error) {
        showNotification('Error submitting news', 'error');
        console.error('Error:', error);
    }
}

// Load News
async function loadNews(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/news?${queryParams}`);
        const data = await response.json();
        
        displayNews(data);
    } catch (error) {
        showNotification('Error loading news', 'error');
        console.error('Error:', error);
    }
}

// Display News
function displayNews(newsItems) {
    newsList.innerHTML = '';
    
    newsItems.forEach(item => {
        const newsCard = createNewsCard(item);
        newsList.appendChild(newsCard);
    });
}

// Create News Card
function createNewsCard(item) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const truthIndexClass = getTruthIndexClass(item.truth_index);
    
    card.innerHTML = `
        <div class="news-image" style="background-image: url('${item.media?.[0] || 'placeholder.jpg'}')"></div>
        <div class="news-content">
            <h3 class="news-title">${item.title}</h3>
            <div class="news-meta">
                <span class="truth-index ${truthIndexClass}">Truth Index: ${item.truth_index}</span>
                <span class="news-date">${new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="news-excerpt">${item.summary}</p>
            <a href="#" class="read-more">Read More</a>
        </div>
    `;
    
    return card;
}

// Handle Search
function handleSearch(event) {
    const query = event.target.value;
    loadNews({ q: query });
}

// Handle Filters
function handleFilters() {
    const filters = {
        location: locationFilter.value,
        date: dateFilter.value
    };
    loadNews(filters);
}

// Get Truth Index Class
function getTruthIndexClass(score) {
    if (score >= 80) return 'high-truth';
    if (score >= 60) return 'medium-truth';
    return 'low-truth';
}

// Show Notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
}); 