// === GLITCH CYBERPUNK AWARDS 2025 ===
// Полностью рабочий скрипт для GitHub Pages

// 🔧 КОНФИГУРАЦИЯ
const CONFIG = {
    ADMIN_PASSWORD: "Glitch2025!",
    USE_SUPABASE: false, // По умолчанию локальный режим
    
    // Защита от накрутки
    SECURITY: {
        MAX_VOTES_PER_USER_PER_HOUR: 100,
        MAX_VOTES_PER_FINGERPRINT_PER_HOUR: 50,
        MIN_TIME_BETWEEN_VOTES_MS: 2000,
        ENABLE_FINGERPRINT: true,
        BLOCK_DURATION_MS: 10 * 60 * 1000 // 10 минут
    },
    
    // Время автосохранения
    AUTO_SAVE_INTERVAL: 30000 // 30 секунд
};

// 🎮 СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let app = {
    categories: {},
    user: {
        id: null,
        fingerprint: null,
        votedCategories: {},
        votesHistory: [],
        lastVoteTime: null,
        totalVotes: 0
    },
    settings: {
        sound: true,
        theme: 'dark',
        volume: 0.3
    },
    stats: {
        totalVotes: 0,
        totalVoters: 0,
        totalCandidates: 0,
        startTime: Date.now()
    }
};

// 🚀 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
function initApp() {
    console.log('⚡ GLITCH AWARDS 2025 запускается...');
    
    // Инициализация пользователя
    initUser();
    
    // Загрузка данных
    loadData();
    
    // Настройка событий
    setupEvents();
    
    // Рендеринг интерфейса
    renderAll();
    
    // Запуск таймеров
    startTimers();
    
    console.log('✅ GLITCH SYSTEM ONLINE');
    showNotification('⚡ GLITCH SYSTEM ONLINE', 'success');
}

// 👤 ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
function initUser() {
    // Генерация ID пользователя
    let userId = localStorage.getItem('glitch_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('glitch_user_id', userId);
    }
    app.user.id = userId;
    
    // Генерация fingerprint
    if (CONFIG.SECURITY.ENABLE_FINGERPRINT) {
        let fingerprint = localStorage.getItem('glitch_fingerprint');
        if (!fingerprint) {
            fingerprint = generateFingerprint();
            localStorage.setItem('glitch_fingerprint', fingerprint);
        }
        app.user.fingerprint = fingerprint;
    }
    
    console.log('👤 Пользователь:', app.user.id.substring(0, 15) + '...');
}

// 🔒 ГЕНЕРАЦИЯ FINGERPRINT
function generateFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        navigator.platform,
        Date.now().toString(36)
    ];
    
    const data = components.join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}

// 📁 ЗАГРУЗКА ДАННЫХ
function loadData() {
    console.log('📁 Загрузка данных...');
    
    // Загрузка настроек
    loadSettings();
    
    // Загрузка голосов
    loadVotes();
    
    // Инициализация категорий
    initCategories();
    
    // Загрузка статистики
    loadStats();
}

// 💾 СОХРАНЕНИЕ ДАННЫХ
function saveData() {
    try {
        // Сохраняем голоса
        localStorage.setItem('glitch_votes', JSON.stringify({
            votedCategories: app.user.votedCategories,
            votesHistory: app.user.votesHistory,
            totalVotes: app.user.totalVotes
        }));
        
        // Сохраняем кандидатов
        const candidatesData = {};
        Object.keys(app.categories).forEach(catId => {
            candidatesData[catId] = app.categories[catId].candidates;
        });
        localStorage.setItem('glitch_candidates', JSON.stringify(candidatesData));
        
        // Сохраняем статистику
        localStorage.setItem('glitch_stats', JSON.stringify(app.stats));
        
        console.log('💾 Данные сохранены');
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
    }
}

// ⚙️ ИНИЦИАЛИЗАЦИЯ КАТЕГОРИЙ
function initCategories() {
    console.log('⚙️ Инициализация категорий...');
    
    // Основные категории
    const categories = {
        // 👑 Главные титулы
        'glitch-king': {
            id: 'glitch-king',
            name: 'GLITCH KING',
            icon: 'crown',
            color: '#ffff00',
            description: 'Король глитч мемов 2025',
            type: 'royal',
            candidates: [
                { id: 'k1', name: 'CYBER MEME LORD', votes: 68, description: 'Повелитель кибер мемов' },
                { id: 'k2', name: 'GLITCH PROPHET', votes: 42, description: 'Пророк глитчей' },
                { id: 'k3', name: 'NEON OVERLORD', votes: 35, description: 'Владыка неона' }
            ]
        },
        
        'glitch-queen': {
            id: 'glitch-queen',
            name: 'GLITCH QUEEN',
            icon: 'crown',
            color: '#ff00ff',
            description: 'Королева глитч мемов 2025',
            type: 'royal',
            candidates: [
                { id: 'q1', name: 'SYNTHWAVE QUEEN', votes: 55, description: 'Королева синтвейва' },
                { id: 'q2', name: 'PIXEL GODDESS', votes: 38, description: 'Богиня пикселей' },
                { id: 'q3', name: 'CYBER DIVA', votes: 29, description: 'Кибер дива' }
            ]
        },
        
        // 🏆 Ваши новые категории
        'meme-year': {
            id: 'meme-year',
            name: 'МЕМ ГОДА',
            icon: 'laugh-beam',
            color: '#00ff88',
            description: 'Самый вирусный мем 2025',
            type: 'regular',
            candidates: [
                { id: 'm1', name: 'GLITCH DOGE', votes: 45, description: 'Собака в матрице' },
                { id: 'm2', name: 'NEON PEPE', votes: 32, description: 'Радужная лягушка' },
                { id: 'm3', name: 'CYBER CAT', votes: 28, description: 'Кот хакер' }
            ]
        },
        
        'ship-year': {
            id: 'ship-year',
            name: 'ПАРА(ШИП) ГОДА',
            icon: 'heart',
            color: '#ff00ff',
            description: 'Лучшая пара/шип 2025',
            type: 'regular',
            candidates: [
                { id: 's1', name: 'CYBER x PUNK', votes: 38, description: 'Киберпанк любовь' },
                { id: 's2', name: 'GLITCH x MATRIX', votes: 25, description: 'Любовь в матрице' },
                { id: 's3', name: 'NEON x SYNC', votes: 19, description: 'Неоновая гармония' }
            ]
        },
        
        'dota-player-year': {
            id: 'dota-player-year',
            name: 'ДОТА ИГРОК ГОДА',
            icon: 'gamepad',
            color: '#00ffff',
            description: 'Лучший игрок в Dota 2 2025',
            type: 'regular',
            candidates: [
                { id: 'd1', name: 'YATORO', votes: 52, description: 'Король керри' },
                { id: 'd2', name: 'MIRACLE-', votes: 41, description: 'Легенда Mid' },
                { id: 'd3', name: 'COLLAPSE', votes: 33, description: 'Непробиваемая стена' }
            ]
        },
        
        'event-year': {
            id: 'event-year',
            name: 'МЕРОПРИЯТИЕ ГОДА',
            icon: 'calendar-star',
            color: '#ff7700',
            description: 'Лучшее мероприятие 2025',
            type: 'regular',
            candidates: [
                { id: 'e1', name: 'THE INTERNATIONAL 2025', votes: 65, description: 'TI по Доте' },
                { id: 'e2', name: 'GLITCH CON 2025', votes: 42, description: 'Киберпанк конвент' },
                { id: 'e3', name: 'CYBER AWARDS', votes: 28, description: 'Церемония наград' }
            ]
        },
        
        // 📦 Дополнительные категории
        'stream-year': {
            id: 'stream-year',
            name: 'СТРИМ ГОДА',
            icon: 'broadcast-tower',
            color: '#9d00ff',
            description: 'Лучший стрим/стример 2025',
            type: 'regular',
            candidates: [
                { id: 'st1', name: 'NEON STREAMER', votes: 31, description: '24/7 стримы' },
                { id: 'st2', name: 'CYBER CASTER', votes: 24, description: 'Профессиональный кастер' }
            ]
        },
        
        'music-year': {
            id: 'music-year',
            name: 'ТРЕК ГОДА',
            icon: 'music',
            color: '#ff0088',
            description: 'Лучший музыкальный трек 2025',
            type: 'regular',
            candidates: [
                { id: 'mu1', name: 'SYNTHWAVE SUNSET', votes: 37, description: 'Закат в неоне' },
                { id: 'mu2', name: 'CYBER DREAMS', votes: 25, description: 'Кибер мечты' }
            ]
        },
        
        'game-year': {
            id: 'game-year',
            name: 'ИГРА ГОДА',
            icon: 'gamepad',
            color: '#00aaff',
            description: 'Лучшая игра 2025',
            type: 'regular',
            candidates: [
                { id: 'g1', name: 'CYBERPUNK 2077: 2.0', votes: 48, description: 'Возрождение' },
                { id: 'g2', name: 'DOTA 3', votes: 36, description: 'Новая эра' }
            ]
        }
    };
    
    // Загружаем сохранённых кандидатов
    try {
        const savedCandidates = JSON.parse(localStorage.getItem('glitch_candidates') || '{}');
        
        Object.keys(categories).forEach(catId => {
            const category = categories[catId];
            
            // Если есть сохранённые кандидаты, используем их
            if (savedCandidates[catId] && savedCandidates[catId].length > 0) {
                category.candidates = savedCandidates[atId];
            }
            
            app.categories[catId] = category;
        });
    } catch (error) {
        console.error('Ошибка загрузки кандидатов:', error);
        // Используем кандидаты по умолчанию
        Object.keys(categories).forEach(catId => {
            app.categories[catId] = categories[catId];
        });
    }
    
    console.log(`✅ Загружено ${Object.keys(app.categories).length} категорий`);
}

// ⚙️ НАСТРОЙКА СОБЫТИЙ
function setupEvents() {
    // Админ кнопка
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }
    
    // Тема
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Звук
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    // Клик вне модалок
    document.addEventListener('click', function(e) {
        const modals = ['categoryModal', 'adminModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display === 'flex' && e.target === modal) {
                closeModal(modalId);
            }
        });
    });
    
    // Escape для закрытия модалок
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal('categoryModal');
            closeModal('adminModal');
        }
    });
}

// 🎨 РЕНДЕРИНГ
function renderAll() {
    renderStats();
    renderRoyalCategories();
    renderAllCategories();
    updateUptime();
}

// 📊 РЕНДЕРИНГ СТАТИСТИКИ
function renderStats() {
    try {
        // Подсчитываем статистику
        let totalVotes = 0;
        let totalCandidates = 0;
        
        Object.values(app.categories).forEach(category => {
            category.candidates.forEach(candidate => {
                totalVotes += candidate.votes || 0;
            });
            totalCandidates += category.candidates.length;
        });
        
        const totalVoters = Object.keys(app.user.votedCategories).length;
        
        // Обновляем DOM
        document.getElementById('liveVotes').textContent = totalVotes;
        document.getElementById('liveVoters').textContent = totalVoters;
        document.getElementById('liveCandidates').textContent = totalCandidates;
        
        // Обновляем объект статистики
        app.stats.totalVotes = totalVotes;
        app.stats.totalCandidates = totalCandidates;
        
    } catch (error) {
        console.error('❌ Ошибка рендеринга статистики:', error);
    }
}

// 👑 РЕНДЕРИНГ КОРОЛЕВСКИХ КАТЕГОРИЙ
function renderRoyalCategories() {
    renderRoyalCategory('glitch-king', 'kingContent');
    renderRoyalCategory('glitch-queen', 'queenContent');
}

function renderRoyalCategory(categoryId, elementId) {
    const category = app.categories[categoryId];
    const container = document.getElementById(elementId);
    if (!container || !category) return;
    
    let html = '';
    const candidates = category.candidates || [];
    
    if (candidates.length === 0) {
        html = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <p>Кандидатов пока нет</p>
                <button class="btn-add-small" onclick="openAddCandidateModal('${categoryId}')">
                    <i class="fas fa-plus"></i> Добавить первого
                </button>
            </div>
        `;
    } else {
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        // Сортируем по голосам
        const sortedCandidates = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        sortedCandidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId];
            const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
            const canVote = !hasVoted && canUserVote();
            
            html += `
                <div class="candidate-royal">
                    <div class="candidate-avatar" style="background: ${category.color}22; color: ${category.color}">
                        ${index + 1}
                    </div>
                    <div class="candidate-info">
                        <div class="candidate-name">${candidate.name}</div>
                        <div class="candidate-desc">${candidate.description || ''}</div>
                        <div class="candidate-progress">
                            <div class="candidate-progress-bar" style="width: ${percentage}%; background: ${category.color}"></div>
                        </div>
                    </div>
                    <div class="candidate-votes" style="color: ${category.color}">
                        ${candidate.votes || 0}
                    </div>
                    <button class="vote-btn-royal ${hasVoted ? 'voted' : ''} ${!canVote ? 'disabled' : ''}" 
                            onclick="${canVote ? `vote('${categoryId}', '${candidate.id}')` : 'showVoteError()'}"
                            ${!canVote ? 'disabled' : ''}
                            style="background: linear-gradient(45deg, ${category.color}, ${category.color}88)">
                        ${hasVoted ? 
                            '<i class="fas fa-check"></i> ГОЛОС УЧТЁН' : 
                            canVote ? 
                            '<i class="fas fa-vote-yea"></i> ГОЛОСОВАТЬ' : 
                            '<i class="fas fa-ban"></i> НЕДОСТУПНО'}
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// 🏆 РЕНДЕРИНГ ВСЕХ КАТЕГОРИЙ
function renderAllCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    let html = '';
    
    // Фильтруем только обычные категории
    const regularCategories = Object.values(app.categories).filter(cat => cat.type === 'regular');
    
    regularCategories.forEach(category => {
        const totalVotes = category.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        const candidateCount = category.candidates.length;
        const topCandidate = category.candidates.length > 0 ? 
            category.candidates.reduce((a, b) => (a.votes || 0) > (b.votes || 0) ? a : b) : 
            null;
        
        html += `
            <div class="category-card" onclick="openCategoryModal('${category.id}')">
                <div class="category-header">
                    <div class="category-icon" style="background: ${category.color}22; color: ${category.color}">
                        <i class="fas fa-${category.icon}"></i>
                    </div>
                    <h3 style="color: ${category.color}">${category.name}</h3>
                </div>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span><i class="fas fa-users" style="color: ${category.color}"></i> ${totalVotes} голосов</span>
                    <span><i class="fas fa-user-plus" style="color: ${category.color}"></i> ${candidateCount} кандидатов</span>
                </div>
                <div class="category-preview">
                    ${topCandidate ? `
                        <div class="top-candidate">
                            <span class="candidate-medal">🥇</span>
                            <span class="candidate-name">${topCandidate.name}</span>
                            <span class="candidate-votes">${topCandidate.votes || 0}</span>
                        </div>
                    ` : '<p class="no-candidates">Нет кандидатов</p>'}
                </div>
                <button class="btn-add" style="background: linear-gradient(45deg, ${category.color}, ${category.color}88)">
                    <i class="fas fa-${app.user.votedCategories[category.id] ? 'eye' : 'vote-yea'}"></i>
                    ${app.user.votedCategories[category.id] ? 'ПРОСМОТР РЕЗУЛЬТАТОВ' : 'ПРОГОЛОСОВАТЬ'}
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 🗳️ ФУНКЦИЯ ГОЛОСОВАНИЯ
window.vote = function(categoryId, candidateId) {
    if (!canUserVote()) {
        showNotification('⏳ Проверка доступности голосования...', 'warning');
        return;
    }
    
    if (app.user.votedCategories[categoryId]) {
        showNotification('❌ Вы уже голосовали в этой категории', 'error');
        return;
    }
    
    const category = app.categories[categoryId];
    const candidate = category?.candidates?.find(c => c.id === candidateId);
    
    if (!category || !candidate) {
        showNotification('❌ Ошибка: кандидат не найден', 'error');
        return;
    }
    
    try {
        // Увеличиваем голоса
        candidate.votes = (candidate.votes || 0) + 1;
        
        // Отмечаем голосование
        app.user.votedCategories[categoryId] = true;
        app.user.totalVotes++;
        app.user.lastVoteTime = Date.now();
        app.user.votesHistory.push({
            categoryId,
            candidateId,
            time: new Date().toISOString(),
            candidateName: candidate.name
        });
        
        // Сохраняем
        saveData();
        
        // Обновляем интерфейс
        renderAll();
        
        // Показываем уведомление
        showNotification(`✅ Вы проголосовали за "${candidate.name}"!`, 'success');
        playSound('vote');
        
        // Обновляем статистику
        updateStats();
        
    } catch (error) {
        console.error('❌ Ошибка голосования:', error);
        showNotification('❌ Ошибка при голосовании', 'error');
    }
};

// 🔒 ПРОВЕРКА ВОЗМОЖНОСТИ ГОЛОСОВАНИЯ
function canUserVote() {
    const now = Date.now();
    
    // Проверка на флуд
    if (app.user.lastVoteTime) {
        const timeSinceLastVote = now - app.user.lastVoteTime;
        if (timeSinceLastVote < CONFIG.SECURITY.MIN_TIME_BETWEEN_VOTES_MS) {
            const waitSeconds = Math.ceil((CONFIG.SECURITY.MIN_TIME_BETWEEN_VOTES_MS - timeSinceLastVote) / 1000);
            showNotification(`⏳ Подождите ${waitSeconds} секунд`, 'warning');
            return false;
        }
    }
    
    // Проверка лимитов
    const votesLastHour = app.user.votesHistory.filter(vote => {
        const voteTime = new Date(vote.time).getTime();
        return now - voteTime < 60 * 60 * 1000;
    }).length;
    
    if (votesLastHour >= CONFIG.SECURITY.MAX_VOTES_PER_USER_PER_HOUR) {
        showNotification(`⏳ Лимит голосов (${CONFIG.SECURITY.MAX_VOTES_PER_USER_PER_HOUR}/час)`, 'warning');
        return false;
    }
    
    return true;
}

// 📁 ОТКРЫТИЕ МОДАЛКИ КАТЕГОРИИ
function openCategoryModal(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalCategoryTitle');
    const body = document.getElementById('modalCategoryBody');
    
    if (!modal || !title || !body) return;
    
    title.textContent = category.name;
    title.style.color = category.color;
    
    let html = `
        <div class="category-modal-header">
            <p class="category-description">${category.description}</p>
            <div class="category-stats-modal">
                <span class="stat-badge" style="border-color: ${category.color}">
                    <i class="fas fa-users"></i> 
                    <span>${category.candidates.reduce((sum, c) => sum + (c.votes || 0), 0)} голосов</span>
                </span>
                <span class="stat-badge" style="border-color: ${category.color}">
                    <i class="fas fa-user-plus"></i> 
                    <span>${category.candidates.length} кандидатов</span>
                </span>
            </div>
        </div>
    `;
    
    if (category.candidates.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-user-plus fa-3x" style="color: ${category.color}"></i>
                <h3 style="color: ${category.color}">Кандидатов пока нет</h3>
                <p>Будьте первым, кто добавит кандидата!</p>
                <button class="btn-add" onclick="openAddCandidateForm('${categoryId}')" 
                        style="background: linear-gradient(45deg, ${category.color}, ${category.color}88)">
                    <i class="fas fa-plus"></i> Добавить кандидата
                </button>
            </div>
        `;
    } else {
        html += '<div class="candidates-list-modal">';
        
        // Сортируем по голосам
        const sortedCandidates = [...category.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        sortedCandidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId];
            const canVote = !hasVoted && canUserVote();
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || `${index + 1}.`;
            
            html += `
                <div class="candidate-modal-card" style="border-left-color: ${category.color}">
                    <div class="candidate-rank">${medal}</div>
                    <div class="candidate-info-modal">
                        <div class="candidate-name-modal">${candidate.name}</div>
                        <div class="candidate-desc-modal">${candidate.description || ''}</div>
                    </div>
                    <div class="candidate-votes-modal" style="color: ${category.color}">
                        ${candidate.votes || 0}
                    </div>
                    ${!hasVoted ? `
                        <button class="vote-btn-modal ${!canVote ? 'disabled' : ''}" 
                                onclick="${canVote ? `vote('${categoryId}', '${candidate.id}')` : 'showVoteError()'}"
                                ${!canVote ? 'disabled' : ''}
                                style="background: linear-gradient(45deg, ${category.color}, ${category.color}88)">
                            <i class="fas fa-vote-yea"></i> ГОЛОС
                        </button>
                    ` : `
                        <div class="voted-badge" style="background: ${category.color}22; color: ${category.color}">
                            <i class="fas fa-check"></i> ВАШ ВЫБОР
                        </div>
                    `}
                </div>
            `;
        });
        
        html += '</div>';
        
        if (!app.user.votedCategories[categoryId]) {
            html += `
                <div class="add-candidate-section">
                    <button class="btn-add-outline" onclick="openAddCandidateForm('${categoryId}')"
                            style="border-color: ${category.color}; color: ${category.color}">
                        <i class="fas fa-plus"></i> Добавить своего кандидата
                    </button>
                </div>
            `;
        }
    }
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

// ➕ ДОБАВЛЕНИЕ КАНДИДАТА
function openAddCandidateForm(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalCategoryTitle');
    const body = document.getElementById('modalCategoryBody');
    
    title.textContent = `Добавить кандидата в ${category.name}`;
    title.style.color = category.color;
    
    body.innerHTML = `
        <div class="add-candidate-form">
            <div class="form-group">
                <label for="candidateName" style="color: ${category.color}">
                    <i class="fas fa-user-tag"></i> Имя кандидата *
                </label>
                <input type="text" id="candidateName" placeholder="Введите имя кандидата" maxlength="50"
                       style="border-color: ${category.color}">
                <div class="char-counter"><span id="nameCounter">0</span>/50</div>
            </div>
            
            <div class="form-group">
                <label for="candidateDesc" style="color: ${category.color}">
                    <i class="fas fa-align-left"></i> Описание (необязательно)
                </label>
                <textarea id="candidateDesc" placeholder="Краткое описание кандидата" rows="3"
                          style="border-color: ${category.color}"></textarea>
                <div class="char-counter"><span id="descCounter">0</span>/200</div>
            </div>
            
            <div class="form-actions">
                <button class="btn-cancel" onclick="openCategoryModal('${categoryId}')">
                    <i class="fas fa-arrow-left"></i> Назад
                </button>
                <button class="btn-submit" onclick="addCandidate('${categoryId}')"
                        style="background: linear-gradient(45deg, ${category.color}, ${category.color}88)">
                    <i class="fas fa-plus"></i> Добавить кандидата
                </button>
            </div>
        </div>
    `;
    
    // Счётчики символов
    const nameInput = document.getElementById('candidateName');
    const descInput = document.getElementById('candidateDesc');
    const nameCounter = document.getElementById('nameCounter');
    const descCounter = document.getElementById('descCounter');
    
    if (nameInput && nameCounter) {
        nameInput.addEventListener('input', function() {
            nameCounter.textContent = this.value.length;
        });
    }
    
    if (descInput && descCounter) {
        descInput.addEventListener('input', function() {
            descCounter.textContent = this.value.length;
        });
    }
    
    modal.style.display = 'flex';
}

function addCandidate(categoryId) {
    const nameInput = document.getElementById('candidateName');
    const descInput = document.getElementById('candidateDesc');
    
    if (!nameInput || !descInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    
    if (!name) {
        showNotification('❌ Введите имя кандидата', 'error');
        return;
    }
    
    if (name.length > 50) {
        showNotification('❌ Имя слишком длинное (макс. 50 символов)', 'error');
        return;
    }
    
    if (description.length > 200) {
        showNotification('❌ Описание слишком длинное (макс. 200 символов)', 'error');
        return;
    }
    
    try {
        const category = app.categories[categoryId];
        if (!category) return;
        
        // Создаём ID кандидата
        const candidateId = 'candidate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Добавляем кандидата
        category.candidates.push({
            id: candidateId,
            name: name,
            description: description,
            votes: 0,
            addedBy: app.user.id,
            addedAt: new Date().toISOString()
        });
        
        // Сохраняем
        saveData();
        
        // Обновляем интерфейс
        openCategoryModal(categoryId);
        
        // Уведомление
        showNotification(`✅ Кандидат "${name}" добавлен!`, 'success');
        playSound('success');
        
    } catch (error) {
        console.error('❌ Ошибка добавления кандидата:', error);
        showNotification('❌ Ошибка при добавлении кандидата', 'error');
    }
}

// 🛠️ АДМИН ПАНЕЛЬ
function showAdminPanel() {
    const modal = document.getElementById('adminModal');
    const body = document.getElementById('adminModal')?.querySelector('.modal-body');
    
    if (!modal || !body) return;
    
    // Если не авторизован - показываем форму входа
    if (!isAdminAuthorized()) {
        body.innerHTML = `
            <div class="admin-login-form">
                <div class="login-header">
                    <i class="fas fa-terminal fa-3x neon-green"></i>
                    <h3 class="neon-green">ROOT ACCESS REQUIRED</h3>
                    <p class="terminal-text">> ВВЕДИТЕ КЛЮЧ ДОСТУПА</p>
                </div>
                
                <div class="login-form">
                    <div class="form-group">
                        <label for="adminPassword" class="neon-cyan">
                            <i class="fas fa-key"></i> КЛЮЧ ДОСТУПА
                        </label>
                        <input type="password" id="adminPassword" placeholder="••••••••••" 
                               class="terminal-input">
                        <div class="password-strength">
                            <div class="strength-bar"></div>
                            <div class="strength-bar"></div>
                            <div class="strength-bar"></div>
                            <div class="strength-bar"></div>
                        </div>
                    </div>
                    
                    <div class="login-actions">
                        <button class="btn-admin-cancel" onclick="closeModal('adminModal')">
                            <i class="fas fa-times"></i> ОТМЕНА
                        </button>
                        <button class="btn-admin-login" onclick="adminLogin()">
                            <i class="fas fa-sign-in-alt"></i> ВОЙТИ В СИСТЕМУ
                        </button>
                    </div>
                    
                    <div class="login-info terminal-text">
                        > ТОЛЬКО ДЛЯ АДМИНИСТРАТОРОВ СИСТЕМЫ
                    </div>
                </div>
            </div>
        `;
    } else {
        // Показываем панель управления
        body.innerHTML = `
            <div class="admin-panel-content">
                <div class="admin-stats">
                    <div class="admin-stat-card">
                        <div class="stat-icon-admin neon-bg-green">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin neon-green">${app.stats.totalVotes}</div>
                            <div class="stat-label-admin">ВСЕГО ГОЛОСОВ</div>
                        </div>
                    </div>
                    
                    <div class="admin-stat-card">
                        <div class="stat-icon-admin neon-bg-pink">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin neon-pink">${Object.keys(app.user.votedCategories).length}</div>
                            <div class="stat-label-admin">УНИКАЛЬНЫХ ГОЛОСОВАВШИХ</div>
                        </div>
                    </div>
                    
                    <div class="admin-stat-card">
                        <div class="stat-icon-admin neon-bg-cyan">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="stat-info-admin">
                            <div class="stat-value-admin neon-cyan">${app.stats.totalCandidates}</div>
                            <div class="stat-label-admin">КАНДИДАТОВ</div>
                        </div>
                    </div>
                </div>
                
                <div class="admin-controls">
                    <h3 class="neon-border-bottom">
                        <i class="fas fa-sliders-h"></i> УПРАВЛЕНИЕ СИСТЕМОЙ
                    </h3>
                    
                    <div class="control-buttons">
                        <button class="btn-admin-control" onclick="exportData()">
                            <i class="fas fa-download"></i> ЭКСПОРТ ДАННЫХ
                        </button>
                        
                        <button class="btn-admin-control btn-admin-danger" onclick="resetVotes()">
                            <i class="fas fa-trash"></i> СБРОСИТЬ ГОЛОСА
                        </button>
                        
                        <button class="btn-admin-control" onclick="clearLocalData()">
                            <i class="fas fa-eraser"></i> ОЧИСТИТЬ ЛОКАЛЬНЫЕ ДАННЫЕ
                        </button>
                    </div>
                </div>
                
                <div class="admin-info terminal-text">
                    > СИСТЕМА ЗАПУЩЕНА: ${new Date(app.stats.startTime).toLocaleString()}
                </div>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

function adminLogin() {
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        localStorage.setItem('glitch_admin_auth', 'true');
        showNotification('✅ Root access granted', 'success');
        playSound('success');
        showAdminPanel(); // Перезагружаем панель
    } else {
        showNotification('❌ Неверный ключ доступа', 'error');
        playSound('error');
        passwordInput.value = '';
    }
}

function isAdminAuthorized() {
    return localStorage.getItem('glitch_admin_auth') === 'true';
}

function resetVotes() {
    if (!confirm('🚨 ВНИМАНИЕ!\n\nВы собираетесь сбросить ВСЕ голосования.\nЭто действие необратимо.\n\nПродолжить?')) {
        return;
    }
    
    const confirmation = prompt('Для подтверждения введите "GLITCH RESET":');
    if (confirmation !== 'GLITCH RESET') {
        showNotification('❌ Операция отменена', 'warning');
        return;
    }
    
    try {
        // Сбрасываем все голоса
        Object.values(app.categories).forEach(category => {
            category.candidates.forEach(candidate => {
                candidate.votes = 0;
            });
        });
        
        // Сбрасываем историю голосований
        app.user.votedCategories = {};
        app.user.votesHistory = [];
        app.user.totalVotes = 0;
        
        // Сохраняем
        saveData();
        
        // Обновляем интерфейс
        renderAll();
        
        showNotification('✅ Все голосования сброшены!', 'success');
        playSound('success');
        
    } catch (error) {
        console.error('❌ Ошибка сброса:', error);
        showNotification('❌ Ошибка при сбросе голосов', 'error');
    }
}

function exportData() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            categories: app.categories,
            stats: app.stats,
            user: {
                id: app.user.id,
                totalVotes: app.user.totalVotes,
                votedCategoriesCount: Object.keys(app.user.votedCategories).length
            },
            config: CONFIG
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `glitch_awards_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Данные экспортированы', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        showNotification('❌ Ошибка при экспорте данных', 'error');
    }
}

function clearLocalData() {
    if (!confirm('⚠️ Очистить все локальные данные?\n\nЭто удалит все ваши голосования и кандидатов.')) {
        return;
    }
    
    try {
        localStorage.clear();
        location.reload(); // Перезагружаем страницу
    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
    }
}

// ⚙️ УТИЛИТЫ
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Создаём элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 
                    type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 
                    type === 'warning' ? 'rgba(255, 255, 0, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
        border: 1px solid ${type === 'success' ? '#00ff88' : 
                          type === 'error' ? '#ff0000' : 
                          type === 'warning' ? '#ffff00' : '#00ffff'};
        color: #fff;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 1rem;
        backdrop-filter: blur(10px);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function playSound(type) {
    if (!app.settings.sound) return;
    
    try {
        const audio = new Audio();
        audio.volume = app.settings.volume;
        
        if (type === 'vote') {
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3';
        } else if (type === 'success') {
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3';
        } else if (type === 'error') {
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3';
        }
        
        audio.play().catch(e => console.log('Звук заблокирован'));
    } catch (error) {
        console.log('Ошибка воспроизведения звука');
    }
}

function updateUptime() {
    const uptimeElement = document.getElementById('uptimeCounter');
    if (!uptimeElement) return;
    
    const now = Date.now();
    const uptime = now - app.stats.startTime;
    
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    uptimeElement.textContent = 
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    app.settings.theme = newTheme;
    saveSettings();
    
    showNotification(`Тема: ${newTheme === 'dark' ? 'Тёмная' : 'Светлая'}`, 'info');
}

function toggleSound() {
    app.settings.sound = !app.settings.sound;
    saveSettings();
    
    const btn = document.getElementById('soundBtn');
    if (btn) {
        btn.innerHTML = app.settings.sound ? 
            '<i class="fas fa-volume-up"></i>' : 
            '<i class="fas fa-volume-mute"></i>';
    }
    
    showNotification(`Звук: ${app.settings.sound ? 'ВКЛ' : 'ВЫКЛ'}`, 'info');
}

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('glitch_settings') || '{}');
        app.settings = { ...app.settings, ...saved };
        
        // Применяем тему
        if (app.settings.theme) {
            document.documentElement.setAttribute('data-theme', app.settings.theme);
        }
        
        // Обновляем кнопки
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.innerHTML = app.settings.sound ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('glitch_settings', JSON.stringify(app.settings));
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
    }
}

function loadVotes() {
    try {
        const saved = JSON.parse(localStorage.getItem('glitch_votes') || '{}');
        app.user.votedCategories = saved.votedCategories || {};
        app.user.votesHistory = saved.votesHistory || [];
        app.user.totalVotes = saved.totalVotes || 0;
    } catch (error) {
        console.error('Ошибка загрузки голосов:', error);
    }
}

function loadStats() {
    try {
        const saved = JSON.parse(localStorage.getItem('glitch_stats') || '{}');
        app.stats = { ...app.stats, ...saved };
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function updateStats() {
    app.stats.totalVotes = Object.values(app.categories).reduce((sum, cat) => {
        return sum + cat.candidates.reduce((catSum, cand) => catSum + (cand.votes || 0), 0);
    }, 0);
    
    saveData();
}

function startTimers() {
    // Таймер аптайма
    setInterval(updateUptime, 1000);
    
    // Автосохранение
    setInterval(saveData, CONFIG.AUTO_SAVE_INTERVAL);
}

// 🚀 ЗАПУСК ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт глобальных функций
window.openCategoryModal = openCategoryModal;
window.closeModal = closeModal;
window.showAdminPanel = showAdminPanel;
window.openAddCandidateForm = openAddCandidateForm;
window.addCandidate = addCandidate;
window.vote = vote;
window.toggleTheme = toggleTheme;
window.toggleSound = toggleSound;
window.adminLogin = adminLogin;
window.exportData = exportData;
window.resetVotes = resetVotes;
window.clearLocalData = clearLocalData;
