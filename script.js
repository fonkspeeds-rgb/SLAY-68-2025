// 🔧 КОНФИГУРАЦИЯ
const CONFIG = {
    ADMIN_PASSWORD: "Marshlopopo228!",
    STORAGE_KEY: "slay68_voting_data",
    VOTE_COOLDOWN: 3000,
    MAX_VIDEO_SIZE: 100 * 1024 * 1024 // 100MB
};

// 🎮 СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let app = {
    categories: {},
    user: {
        id: null,
        votedCategories: {},
        lastVote: 0
    },
    settings: {
        music: true,
        theme: 'dark',
        volume: 0.3
    },
    currentModalCategory: null,
    currentVideoCategory: null,
    firebaseReady: false
};

// 🚀 ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Запуск SLAY 68 с Firebase...');
    
    // Генерируем ID пользователя
    app.user.id = generateUserId();
    console.log(`👤 ID пользователя: ${app.user.id}`);
    
    try {
        // Инициализируем Firebase
        await firebaseService.initializeDatabase();
        app.firebaseReady = true;
        console.log('✅ Firebase готов');
        
        // Загружаем данные с Firebase
        await loadDataFromFirebase();
        
        // Настраиваем слушатели реального времени
        setupFirebaseListeners();
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        // Используем локальные данные как запасной вариант
        initLocalData();
    }
    
    loadUserSettings();
    setupEvents();
    renderAll();
    initParticles();
    
    console.log('✅ Приложение готово!');
});

// 📥 ЗАГРУЗКА ДАННЫХ С FIREBASE
async function loadDataFromFirebase() {
    try {
        // Загружаем категории
        app.categories = await firebaseService.getCategories();
        
        // Загружаем голоса пользователя
        await loadUserVotes();
        
        console.log('📂 Данные загружены с Firebase');
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        throw error;
    }
}

// 👂 НАСТРОЙКА СЛУШАТЕЛЕЙ REAL-TIME
function setupFirebaseListeners() {
    if (!app.firebaseReady) return;
    
    // Слушаем изменения в категориях
    firebaseService.listenToCategories((categories) => {
        app.categories = categories;
        renderAll();
        console.log('🔄 Категории обновлены в реальном времени');
    });
    
    // Слушаем изменения в кандидатах для каждой категории
    Object.keys(app.categories).forEach(categoryId => {
        firebaseService.listenToCandidates(categoryId, (candidates) => {
            if (app.categories[categoryId]) {
                app.categories[categoryId].candidates = candidates;
                renderCategory(categoryId);
                renderStats();
                console.log(`🔄 Кандидаты категории ${categoryId} обновлены`);
            }
        });
    });
}

// 👤 ЗАГРУЗКА ГОЛОСОВ ПОЛЬЗОВАТЕЛЯ
async function loadUserVotes() {
    if (!app.firebaseReady) return;
    
    try {
        const categories = Object.keys(app.categories);
        
        for (const categoryId of categories) {
            const hasVoted = await firebaseService.hasUserVoted(app.user.id, categoryId);
            if (hasVoted) {
                const candidateId = await firebaseService.getUserVote(app.user.id, categoryId);
                app.user.votedCategories[categoryId] = candidateId;
            }
        }
        
        console.log('🗳️ Голосование пользователя загружено');
    } catch (error) {
        console.error('❌ Ошибка загрузки голосов:', error);
    }
}

// 💾 ЛОКАЛЬНЫЕ ДАННЫЕ (запасной вариант)
function initLocalData() {
    app.categories = {
        'slay-king': {
            id: 'slay-king',
            name: 'SLAY KING 68',
            icon: 'crown',
            color: '#ffd700',
            videoUrl: null,
            thumbnail: null,
            description: 'Король космических мемов',
            candidates: [],
            votes: {}
        },
        // ... остальные категории такие же как в firebase.js
    };
}

// 🎨 РЕНДЕРИНГ
function renderAll() {
    renderStats();
    renderRoyalCategories();
    renderRegularCategories();
    updateAdminView();
}

function renderCategory(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    // Рендерим королевские категории
    if (categoryId === 'slay-king') {
        renderRoyalCategory('slay-king', 'kingContent');
        renderVideoForCategory('slay-king');
        updateRoyalTotal('slay-king');
    } else if (categoryId === 'slay-queen') {
        renderRoyalCategory('slay-queen', 'queenContent');
        renderVideoForCategory('slay-queen');
        updateRoyalTotal('slay-queen');
    } else {
        // Рендерим обычные категории
        renderRegularCategory(categoryId);
        renderVideoForCategory(categoryId);
    }
}

// 🎬 РЕНДЕРИНГ ВИДЕО ДЛЯ КАТЕГОРИИ
function renderVideoForCategory(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    // Для королевских категорий
    const royalVideoContainer = document.getElementById(`video-${categoryId}`);
    if (royalVideoContainer) {
        if (category.videoUrl) {
            royalVideoContainer.innerHTML = `
                <div class="video-thumbnail-large" onclick="playVideo('${categoryId}')">
                    ${category.thumbnail ? 
                        `<img src="${category.thumbnail}" alt="Превью видео" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<div style="width: 100%; height: 100%; background: ${category.color}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-video" style="font-size: 3rem; color: white;"></i>
                        </div>`
                    }
                    <div class="video-play-btn-large">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="royal-video-overlay">
                        <i class="fas fa-video"></i>
                        <span>${category.isYouTube ? 'YouTube видео' : 'Смотреть видео'}</span>
                    </div>
                </div>
            `;
        } else {
            royalVideoContainer.innerHTML = `
                <div class="video-placeholder-large" onclick="showVideoUpload('${categoryId}')">
                    <i class="fas fa-video-slash"></i>
                    <p>Видео не загружено</p>
                    <small>Нажмите, чтобы добавить</small>
                </div>
            `;
        }
    }
    
    // Для обычных категорий
    const regularVideoContainer = document.getElementById(`video-small-${categoryId}`);
    if (regularVideoContainer) {
        if (category.videoUrl) {
            regularVideoContainer.innerHTML = `
                <div class="video-thumbnail-small" onclick="playVideo('${categoryId}')">
                    ${category.thumbnail ? 
                        `<img src="${category.thumbnail}" alt="Превью видео" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<div style="width: 100%; height: 100%; background: ${category.color}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-video" style="font-size: 2rem; color: white;"></i>
                        </div>`
                    }
                    <div class="video-play-btn-small">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="video-overlay-small">
                        <i class="fas fa-video"></i>
                        <span>Смотреть</span>
                    </div>
                </div>
            `;
        } else {
            regularVideoContainer.innerHTML = `
                <div class="video-placeholder-small" onclick="showVideoUpload('${categoryId}')">
                    <i class="fas fa-video-slash"></i>
                    <p>Нет видео</p>
                </div>
            `;
        }
    }
}

// 🎬 ВОСПРОИЗВЕДЕНИЕ ВИДЕО
window.playVideo = async function(categoryId) {
    const category = app.categories[categoryId];
    if (!category || !category.videoUrl) {
        showNotification('Видео не загружено для этой категории', 'warning');
        return;
    }
    
    app.currentVideoCategory = categoryId;
    const modal = document.getElementById('videoModal');
    const playerContainer = document.getElementById('videoPlayerContainer');
    const videoInfo = document.getElementById('videoInfo');
    
    modal.style.display = 'flex';
    
    if (category.isYouTube) {
        // YouTube видео
        playerContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="400" 
                src="${category.videoUrl}?autoplay=1&rel=0" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        // Загруженное видео
        playerContainer.innerHTML = `
            <video 
                controls 
                autoplay 
                style="width: 100%; border-radius: 10px;">
                <source src="${category.videoUrl}" type="${category.videoType || 'video/mp4'}">
                Ваш браузер не поддерживает видео.
            </video>
        `;
    }
    
    // Информация о видео
    videoInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 50px; height: 50px; background: ${category.color}; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-${category.icon}" style="color: white; font-size: 1.5rem;"></i>
            </div>
            <div>
                <h3 style="color: ${category.color}; margin: 0;">${category.name}</h3>
                <p style="color: rgba(255,255,255,0.7); margin: 0.25rem 0 0;">${category.description}</p>
                ${category.isYouTube ? 
                    `<small style="color: #ff0000; margin-top: 0.5rem; display: block;">
                        <i class="fab fa-youtube"></i> YouTube видео
                    </small>` : 
                    `<small style="color: #00ffff; margin-top: 0.5rem; display: block;">
                        <i class="fas fa-file-video"></i> Загруженное видео
                    </small>`
                }
            </div>
        </div>
    `;
};

// 🎬 ПОКАЗАТЬ ЗАГРУЗКУ ВИДЕО (для админа)
window.showVideoUpload = function(categoryId) {
    // Проверяем, админ ли
    const controlSection = document.getElementById('controlSection');
    if (controlSection.style.display !== 'block') {
        showNotification('Только администратор может загружать видео', 'warning');
        return;
    }
    
    // Переключаемся на вкладку видео
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector('[data-tab="videos"]').classList.add('active');
    document.getElementById('videosTab').classList.add('active');
    
    // Устанавливаем выбранную категорию
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.value = categoryId;
    updateAdminView();
    
    // Показываем админ панель
    document.getElementById('adminOverlay').style.display = 'flex';
    
    showNotification(`Выберите видео для категории ${app.categories[categoryId].name}`, 'info');
};

// 📤 ЗАГРУЗКА ВИДЕО (админ)
window.uploadVideo = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const categoryId = document.getElementById('categorySelect').value;
    
    if (file.size > CONFIG.MAX_VIDEO_SIZE) {
        showNotification(`Файл слишком большой (${(file.size/1024/1024).toFixed(1)}MB). Максимум: 100MB`, 'error');
        return;
    }
    
    if (!file.type.startsWith('video/')) {
        showNotification('Выберите видео файл', 'error');
        return;
    }
    
    try {
        showNotification('📤 Загрузка видео...', 'info');
        
        const result = await firebaseService.uploadVideo(categoryId, file);
        
        showNotification('✅ Видео загружено!', 'success');
        playSound('success');
        
        // Очищаем поле файла
        event.target.value = '';
        
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        showNotification('❌ Ошибка загрузки видео', 'error');
    }
};

// 📥 ДОБАВЛЕНИЕ YOUTUBE ВИДЕО
window.addYouTubeVideo = async function() {
    const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
    const categoryId = document.getElementById('categorySelect').value;
    
    if (!youtubeUrl) {
        showNotification('Введите ссылку YouTube', 'warning');
        return;
    }
    
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
        showNotification('Введите корректную ссылку YouTube', 'error');
        return;
    }
    
    try {
        showNotification('📤 Добавление YouTube видео...', 'info');
        
        await firebaseService.addYouTubeVideo(categoryId, youtubeUrl);
        
        // Очищаем поле
        document.getElementById('youtubeUrl').value = '';
        
        showNotification('✅ YouTube видео добавлено!', 'success');
        playSound('success');
        
    } catch (error) {
        console.error('Ошибка добавления YouTube видео:', error);
        showNotification('❌ ' + error.message, 'error');
    }
};

// 🗑️ УДАЛЕНИЕ ВИДЕО
window.deleteVideo = async function(categoryId) {
    if (!confirm('Удалить видео из этой категории?')) return;
    
    try {
        await firebaseService.deleteVideo(categoryId);
        showNotification('Видео удалено', 'warning');
    } catch (error) {
        console.error('Ошибка удаления видео:', error);
        showNotification('❌ Ошибка удаления видео', 'error');
    }
};

// 🗳️ ГОЛОСОВАНИЕ
window.voteForCandidate = async function(categoryId, candidateId) {
    const now = Date.now();
    if (now - app.user.lastVote < CONFIG.VOTE_COOLDOWN) {
        showNotification('Подождите перед следующим голосом', 'warning');
        return;
    }
    
    if (app.user.votedCategories[categoryId]) {
        showNotification('Вы уже голосовали в этой категории', 'warning');
        return;
    }
    
    try {
        // Голосуем через Firebase
        await firebaseService.voteForCandidate(app.user.id, candidateId, categoryId);
        
        // Обновляем локальное состояние
        app.user.votedCategories[categoryId] = candidateId;
        app.user.lastVote = now;
        
        // Обновляем отображение
        renderCategory(categoryId);
        renderStats();
        
        const candidate = app.categories[categoryId]?.candidates?.find(c => c.id === candidateId);
        if (candidate) {
            showNotification(`✅ Вы проголосовали за ${candidate.name}!`, 'success');
            playSound('success');
        }
        
    } catch (error) {
        showNotification(error.message || '❌ Ошибка голосования', 'error');
    }
};

// 👤 ДОБАВЛЕНИЕ КАНДИДАТА
document.getElementById('addCandidateBtn').addEventListener('click', async function() {
    const categoryId = document.getElementById('categorySelect').value;
    const nameInput = document.getElementById('candidateName');
    const descInput = document.getElementById('candidateDesc');
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    
    if (!name) {
        showNotification('Введите имя кандидата', 'warning');
        return;
    }
    
    try {
        await firebaseService.addCandidate({
            name: name,
            description: description,
            categoryId: categoryId
        });
        
        nameInput.value = '';
        descInput.value = '';
        
        showNotification(`✅ Кандидат "${name}" добавлен`, 'success');
        
    } catch (error) {
        console.error('Ошибка добавления кандидата:', error);
        showNotification('❌ Ошибка добавления кандидата', 'error');
    }
});

// 🗑️ УДАЛЕНИЕ КАНДИДАТА
window.removeCandidate = async function(categoryId, candidateId) {
    if (!confirm('Удалить этого кандидата?')) return;
    
    try {
        await firebaseService.deleteCandidate(candidateId);
        showNotification('Кандидат удален', 'warning');
    } catch (error) {
        console.error('Ошибка удаления кандидата:', error);
        showNotification('❌ Ошибка удаления кандидата', 'error');
    }
};

// 📊 ОБНОВЛЕНИЕ СТАТИСТИКИ
async function updateAdminStats() {
    if (!app.firebaseReady) return;
    
    try {
        const stats = await firebaseService.getStatistics();
        
        document.getElementById('adminTotalVotes').textContent = stats.totalVotes;
        document.getElementById('adminUniqueVoters').textContent = stats.uniqueVoters;
        
        // Обновляем общую статистику
        document.getElementById('liveVotes').textContent = stats.totalVotes;
        document.getElementById('liveVoters').textContent = stats.uniqueVoters;
        document.getElementById('liveCandidates').textContent = stats.candidatesCount;
        
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
    }
}

// 🛠️ АДМИН ПАНЕЛЬ
function updateAdminView() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;
    
    const categoryId = categorySelect.value;
    updateAdminCandidatesList(categoryId);
    updateAdminVideoPreview(categoryId);
    updateAdminStats();
}

function updateAdminCandidatesList(categoryId) {
    const category = app.categories[categoryId];
    const container = document.getElementById('adminCandidatesList');
    
    if (!container || !category) return;
    
    let html = '';
    
    if (!category.candidates || category.candidates.length === 0) {
        html = `<div class="empty-state" style="padding: 2rem;"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        category.candidates.forEach(candidate => {
            html += `
                <div class="admin-candidate-item">
                    <div class="candidate-info-admin">
                        <div class="candidate-name-admin">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc-admin">${candidate.description}</div>` : ''}
                    </div>
                    <div class="candidate-votes-admin">${candidate.votes || 0}</div>
                    <button class="btn-remove" onclick="removeCandidate('${categoryId}', '${candidate.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

function updateAdminVideoPreview(categoryId) {
    const category = app.categories[categoryId];
    const container = document.getElementById('videoPreview');
    
    if (!container || !category) return;
    
    if (category.videoUrl) {
        container.innerHTML = `
            <div style="background: rgba(0,255,255,0.1); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-check-circle" style="color: #00ff88; font-size: 1.2rem;"></i>
                        <span style="font-weight: 600;">Видео ${category.isYouTube ? 'YouTube' : 'загружено'}</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-remove" onclick="playVideo('${categoryId}')" 
                                style="background: var(--primary);">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-remove" onclick="deleteVideo('${categoryId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div style="border-radius: 8px; overflow: hidden; height: 100px; background: rgba(0,0,0,0.3); 
                     display: flex; align-items: center; justify-content: center; position: relative;">
                    ${category.thumbnail ? 
                        `<img src="${category.thumbnail}" alt="Превью" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<div style="width: 100%; height: 100%; background: ${category.color}; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-video" style="font-size: 2rem; color: white;"></i>
                        </div>`
                    }
                    <div style="position: absolute; background: rgba(0,0,0,0.6); padding: 4px 8px; 
                         border-radius: 4px; color: white; font-size: 0.8rem; bottom: 8px; left: 8px;">
                        <i class="fas fa-video"></i> ${category.isYouTube ? 'YouTube' : 'Видео'}
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                <i class="fas fa-video-slash" style="font-size: 2.5rem;"></i>
                <p style="margin: 1rem 0 0.5rem;">Видео не загружено</p>
                <small style="opacity: 0.6;">Загрузите видео для этой категории</small>
                
                <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                    <button onclick="document.getElementById('videoFile').click()" 
                            style="background: var(--primary); color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer;">
                        <i class="fas fa-upload"></i> Загрузить видео с компьютера
                    </button>
                    
                    <div>
                        <input type="text" id="adminYoutubeUrl" placeholder="Ссылка на YouTube видео" 
                               style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--card-border); background: rgba(255,255,255,0.1); color: var(--text-color); margin-bottom: 0.5rem;">
                        <button onclick="addYouTubeVideoFromAdmin()" 
                                style="background: #ff0000; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; width: 100%;">
                            <i class="fab fa-youtube"></i> Добавить YouTube видео
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

window.addYouTubeVideoFromAdmin = async function() {
    const youtubeUrl = document.getElementById('adminYoutubeUrl')?.value || document.getElementById('youtubeUrl')?.value;
    const categoryId = document.getElementById('categorySelect').value;
    
    if (!youtubeUrl) {
        showNotification('Введите ссылку YouTube', 'warning');
        return;
    }
    
    try {
        showNotification('📤 Добавление YouTube видео...', 'info');
        
        await firebaseService.addYouTubeVideo(categoryId, youtubeUrl);
        
        // Очищаем поле
        if (document.getElementById('adminYoutubeUrl')) {
            document.getElementById('adminYoutubeUrl').value = '';
        }
        if (document.getElementById('youtubeUrl')) {
            document.getElementById('youtubeUrl').value = '';
        }
        
        showNotification('✅ YouTube видео добавлено!', 'success');
        playSound('success');
        
    } catch (error) {
        console.error('Ошибка добавления YouTube видео:', error);
        showNotification('❌ ' + error.message, 'error');
    }
};

// 📊 РЕНДЕРИНГ СТАТИСТИКИ
async function renderStats() {
    try {
        const stats = await firebaseService.getStatistics();
        
        document.getElementById('liveVotes').textContent = stats.totalVotes;
        document.getElementById('liveVoters').textContent = stats.uniqueVoters;
        document.getElementById('liveCandidates').textContent = stats.candidatesCount;
        
    } catch (error) {
        console.error('Ошибка рендеринга статистики:', error);
    }
}

// 🎨 РЕНДЕРИНГ КОРОЛЕВСКИХ КАТЕГОРИЙ (адаптировано)
function renderRoyalCategories() {
    renderRoyalCategory('slay-king', 'kingContent');
    renderRoyalCategory('slay-queen', 'queenContent');
    updateRoyalTotals();
}

function renderRoyalCategory(categoryId, elementId) {
    const category = app.categories[categoryId];
    const container = document.getElementById(elementId);
    if (!container || !category) return;
    
    let html = '';
    const candidates = category.candidates || [];
    
    if (candidates.length === 0) {
        html = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        candidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId] === candidate.id;
            const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
            
            html += `
                <div class="candidate-royal animate-fadeIn">
                    <div class="candidate-avatar">${index + 1}</div>
                    <div class="candidate-info">
                        <div class="candidate-name">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc">${candidate.description}</div>` : ''}
                        <div class="candidate-progress">
                            <div class="candidate-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="candidate-votes">${candidate.votes || 0}</div>
                    <button class="vote-btn-royal ${hasVoted ? 'voted' : ''}" 
                            onclick="voteForCandidate('${categoryId}', '${candidate.id}')"
                            ${hasVoted ? 'disabled' : ''}>
                        ${hasVoted ? '<i class="fas fa-check"></i> ГОЛОС ПОДТВЕРЖДЕН' : '<i class="fas fa-vote-yea"></i> ГОЛОСОВАТЬ'}
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

function updateRoyalTotal(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    const totalElement = document.getElementById(categoryId === 'slay-king' ? 'kingTotal' : 'queenTotal');
    if (totalElement) {
        const totalVotes = (category.candidates || []).reduce((sum, c) => sum + (c.votes || 0), 0);
        totalElement.textContent = `${totalVotes} голосов`;
    }
}

function updateRoyalTotals() {
    updateRoyalTotal('slay-king');
    updateRoyalTotal('slay-queen');
}

// 🏆 РЕНДЕРИНГ ОБЫЧНЫХ КАТЕГОРИЙ
function renderRegularCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    const regularCategories = Object.values(app.categories)
        .filter(cat => cat && !['slay-king', 'slay-queen'].includes(cat.id));
    
    let html = '';
    
    regularCategories.forEach(category => {
        const candidates = (category.candidates || []).slice(0, 3);
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        html += `
            <div class="category-card animate-fadeIn">
                <div class="category-icon" style="background: ${category.color}">
                    <i class="fas fa-${category.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                
                <div class="category-video-small" id="video-small-${category.id}">
                    <!-- Видео загрузится через renderVideoForCategory -->
                </div>
                
                <div class="category-stats">
                    <div class="category-stat">
                        <i class="fas fa-users"></i>
                        <span>${category.candidates?.length || 0} кандидатов</span>
                    </div>
                    <div class="category-stat">
                        <i class="fas fa-vote-yea"></i>
                        <span>${totalVotes} голосов</span>
                    </div>
                </div>
                
                <div class="category-candidates">
        `;
        
        if (candidates.length === 0) {
            html += `<div class="empty-state" style="padding: 1rem;"><i class="fas fa-user-plus"></i><p>Добавьте кандидатов</p></div>`;
        } else {
            candidates.forEach((candidate, index) => {
                const isLeader = index === 0;
                html += `
                    <div class="category-candidate ${isLeader ? 'leader' : ''}">
                        <div class="candidate-rank" style="background: ${category.color}">${index + 1}</div>
                        <div class="candidate-name-small">${candidate.name}</div>
                        <div class="candidate-votes-small">${candidate.votes || 0}</div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                
                <div class="category-actions">
                    <button class="btn-category btn-view" onclick="showAllCandidates('${category.id}')">
                        <i class="fas fa-eye"></i> Все кандидаты
                    </button>
                    <button class="btn-category btn-vote" onclick="voteInCategory('${category.id}')">
                        <i class="fas fa-vote-yea"></i> Голосовать
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderRegularCategory(categoryId) {
    // Обновляем отдельную категорию
    const category = app.categories[categoryId];
    if (!category || ['slay-king', 'slay-queen'].includes(categoryId)) return;
    
    // Находим карточку категории и обновляем её
    const videoContainer = document.getElementById(`video-small-${categoryId}`);
    if (videoContainer) {
        renderVideoForCategory(categoryId);
    }
    
    // Можно добавить более детальное обновление здесь
}

// 👁️ ПОКАЗАТЬ ВСЕХ КАНДИДАТОВ
window.showAllCandidates = function(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    app.currentModalCategory = categoryId;
    
    const modal = document.getElementById('candidatesModal');
    const content = document.getElementById('modalCandidatesContent');
    const title = document.getElementById('modalCategoryTitle');
    
    title.textContent = category.name;
    
    let html = '';
    const candidates = category.candidates || [];
    
    if (candidates.length === 0) {
        html = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        candidates.forEach(candidate => {
            const hasVoted = app.user.votedCategories[categoryId] === candidate.id;
            const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
            
            html += `
                <div class="modal-candidate">
                    <div class="modal-candidate-avatar" style="background: ${category.color}">${candidate.id.slice(0, 2)}</div>
                    <div class="modal-candidate-info">
                        <div class="modal-candidate-name">${candidate.name}</div>
                        <div class="modal-candidate-desc">${candidate.description || ''}</div>
                        <div class="modal-progress-container">
                            <div class="modal-progress-bar">
                                <div class="modal-progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="modal-progress-text">
                                <span>${candidate.votes || 0} голосов</span>
                                <span>${percentage}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-candidate-stats">
                        <button class="modal-vote-btn ${hasVoted ? 'voted' : ''}" 
                                onclick="voteForCandidate('${categoryId}', '${candidate.id}')"
                                ${hasVoted ? 'disabled' : ''}>
                            ${hasVoted ? '<i class="fas fa-check"></i> Ваш голос' : '<i class="fas fa-vote-yea"></i> Голосовать'}
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    content.innerHTML = html;
    modal.style.display = 'flex';
};

window.voteInCategory = function(categoryId) {
    showAllCandidates(categoryId);
};

// 🛠️ НАСТРОЙКА СОБЫТИЙ
function setupEvents() {
    // Админ панель
    document.getElementById('adminBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').style.display = 'flex';
    });
    
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminOverlay').style.display = 'none';
    });
    
    // Логин админа
    document.getElementById('loginBtn').addEventListener('click', () => {
        const password = document.getElementById('adminPass').value;
        if (password === CONFIG.ADMIN_PASSWORD) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('controlSection').style.display = 'block';
            updateAdminView();
            showNotification('✅ Админ доступ разрешен', 'success');
        } else {
            showNotification('❌ Неверный пароль', 'error');
        }
    });
    
    // Загрузка видео
    document.getElementById('videoFile').addEventListener('change', uploadVideo);
    
    // YouTube URL поле
    document.getElementById('youtubeUrl')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addYouTubeVideo();
        }
    });
    
    // Табы админки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
            
            if (tab === 'stats') {
                updateAdminStats();
            }
        });
    });
    
    // Выбор категории в админке
    document.getElementById('categorySelect').addEventListener('change', updateAdminView);
    
    // Загрузка видео по клику на область
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('videoFile').click();
    });
    
    // Закрытие модалок
    document.getElementById('closeCandidates').addEventListener('click', () => {
        document.getElementById('candidatesModal').style.display = 'none';
    });
    
    document.getElementById('closeVideo').addEventListener('click', closeVideoModal);
    
    // Клик вне модалок
    document.getElementById('candidatesModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('candidatesModal').style.display = 'none';
        }
    });
    
    document.getElementById('videoModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeVideoModal();
        }
    });
    
    // Музыка и тема
    document.getElementById('musicBtn').addEventListener('click', toggleMusic);
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    
    // Экспорт и сброс
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Сбросить ВСЕ голосы? Это действие нельзя отменить.')) {
            resetAllVotes();
        }
    });
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const playerContainer = document.getElementById('videoPlayerContainer');
    
    if (playerContainer) {
        playerContainer.innerHTML = '';
    }
    
    modal.style.display = 'none';
    app.currentVideoCategory = null;
}

// 🎵 МУЗЫКА И ТЕМА
function toggleMusic() {
    const music = document.getElementById('backgroundMusic');
    const btn = document.getElementById('musicBtn');
    
    if (app.settings.music) {
        music.pause();
        btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        music.volume = app.settings.volume;
        music.play().catch(e => console.log('Автовоспроизведение музыки заблокировано'));
        btn.innerHTML = '<i class="fas fa-music"></i>';
    }
    
    app.settings.music = !app.settings.music;
    saveUserSettings();
}

function toggleTheme() {
    const btn = document.getElementById('themeBtn');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    app.settings.theme = newTheme;
    
    btn.innerHTML = newTheme === 'dark' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
    
    saveUserSettings();
}

// 💾 НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
function saveUserSettings() {
    try {
        localStorage.setItem('slay68_user_settings', JSON.stringify({
            settings: app.settings,
            userId: app.user.id
        }));
    } catch (e) {
        console.log('Ошибка сохранения настроек:', e);
    }
}

function loadUserSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('slay68_user_settings'));
        if (saved) {
            if (saved.userId) {
                app.user.id = saved.userId;
            }
            
            if (saved.settings) {
                app.settings = { ...app.settings, ...saved.settings };
                document.documentElement.setAttribute('data-theme', app.settings.theme);
                
                const themeBtn = document.getElementById('themeBtn');
                if (themeBtn) {
                    themeBtn.innerHTML = app.settings.theme === 'dark' ? 
                        '<i class="fas fa-moon"></i>' : 
                        '<i class="fas fa-sun"></i>';
                }
                
                if (app.settings.music) {
                    const music = document.getElementById('backgroundMusic');
                    if (music) {
                        music.volume = app.settings.volume;
                        music.play().catch(e => console.log('Музыка не может быть воспроизведена'));
                    }
                }
            }
        }
    } catch (e) {
        console.log('Настройки не восстановлены:', e);
    }
}

// 📊 ЭКСПОРТ ДАННЫХ
async function exportData() {
    try {
        const stats = await firebaseService.getStatistics();
        const categories = await firebaseService.getCategories();
        
        const allCandidates = [];
        for (const categoryId in categories) {
            const candidates = await firebaseService.getCandidates(categoryId);
            allCandidates.push(...candidates);
        }
        
        const data = {
            exportDate: new Date().toISOString(),
            categories: categories,
            candidates: allCandidates,
            statistics: stats,
            totalCategories: Object.keys(categories).length
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `slay68_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Данные экспортированы', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showNotification('❌ Ошибка экспорта данных', 'error');
    }
}

async function resetAllVotes() {
    if (!confirm('ВНИМАНИЕ! Вы собираетесь сбросить ВСЕ голоса.\n\nЭто действие: \n• Удалит все записи о голосовании\n• Обнулит счетчики кандидатов\n• Невозможно отменить\n\nПродолжить?')) {
        return;
    }
    
    try {
        showNotification('🔄 Сброс голосов...', 'info');
        
        // Получаем всех кандидатов
        const candidatesSnapshot = await firebaseService.candidatesCollection.get();
        
        // Сбрасываем голосы у всех кандидатов
        const batch = firebaseService.db.batch();
        candidatesSnapshot.forEach(doc => {
            batch.update(doc.ref, { votes: 0 });
        });
        await batch.commit();
        
        // Удаляем все записи о голосовании
        const votesSnapshot = await firebaseService.votesCollection.get();
        const deleteBatch = firebaseService.db.batch();
        votesSnapshot.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
        
        // Сбрасываем локальное состояние
        app.user.votedCategories = {};
        
        showNotification('✅ Все голосы сброшены', 'success');
        
        // Обновляем отображение
        renderAll();
        
    } catch (error) {
        console.error('Ошибка сброса голосов:', error);
        showNotification('❌ Ошибка сброса голосов', 'error');
    }
}

// 🔧 УТИЛИТЫ
function generateUserId() {
    // Генерируем уникальный ID пользователя
    let userId = localStorage.getItem('slay68_user_id');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('slay68_user_id', userId);
    }
    
    return userId;
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration);
}

function playSound(type) {
    if (type === 'success') {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Звук заблокирован'));
    }
}

function initParticles() {
    if (window.particlesJS) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#8a2be2" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#00ffff",
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" }
                }
            }
        });
    }
}
