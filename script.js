// 🔧 КОНФИГУРАЦИЯ С ЗАЩИТОЙ
const CONFIG = {
    ADMIN_PASSWORD: "Marshlopopo228!",
    USE_SUPABASE: false, // По умолчанию локальный режим для GitHub Pages
    
    // Защита от накрутки
    SECURITY: {
        MAX_VOTES_PER_USER_PER_HOUR: 50,
        MAX_VOTES_PER_FINGERPRINT_PER_HOUR: 30,
        MIN_TIME_BETWEEN_VOTES_MS: 1000,
        VOTE_COOLDOWN_MS: 3000,
        BLOCK_DURATION_MS: 5 * 60 * 1000, // 5 минут
        ENABLE_FINGERPRINT: true,
        TEMP_BLOCK_AFTER_FAILED_ATTEMPTS: 5,
        PERM_BLOCK_AFTER_FAILED_ATTEMPTS: 20
    },
    
    // Другие настройки
    MAX_VIDEO_SIZE: 100 * 1024 * 1024
};

// 🎮 СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let app = {
    categories: {},
    user: {
        id: null,
        fingerprint: null,
        votedCategories: {},
        lastVote: 0,
        voteStats: {
            votesToday: 0,
            votesThisHour: 0,
            lastVoteTime: null
        }
    },
    settings: {
        music: true,
        theme: 'dark',
        volume: 0.3,
        security: { ...CONFIG.SECURITY }
    },
    supabase: null,
    currentModalCategory: null,
    currentVideoCategory: null,
    
    // Защита от накрутки
    security: {
        voteAttempts: 0,
        failedAttempts: 0,
        lastVoteTime: 0,
        blockedUntil: 0,
        voteHistory: [],
        isBlocked: false,
        blockReason: null
    }
};

// 🚀 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
function initApp() {
    console.log('🚀 SLAY 68 с защитой запускается...');
    
    // Загружаем настройки безопасности
    loadSecuritySettings();
    
    // Генерируем ID пользователя с защитой
    generateSecureUserId();
    console.log('👤 Безопасный ID пользователя:', app.user.id.substring(0, 20) + '...');
    
    // Генерируем fingerprint
    if (app.settings.security.ENABLE_FINGERPRINT) {
        generateFingerprint();
    } else {
        app.user.fingerprint = 'no_fp';
        console.log('🔓 Fingerprint защита отключена');
    }
    
    // Загружаем локальные настройки
    loadUserSettings();
    
    // Инициализируем локальные данные
    initLocalData();
    
    // Настраиваем события и рендерим
    setupEvents();
    renderAll();
    initParticles();
    
    // Показываем предупреждение о защите
    if (app.settings.security.ENABLE_FINGERPRINT) {
        console.log('🛡️ Защита от накрутки активирована');
    }
    
    console.log('✅ Приложение готово с защитой!');
}

// 📋 ИНИЦИАЛИЗАЦИЯ ВСЕХ КАТЕГОРИЙ
function initAllCategories() {
    console.log('📋 Инициализация всех категорий...');
    
    // Основные категории
    const categories = {
        // 👑 Королевские
        'slay-king': {
            id: 'slay-king',
            name: 'SLAY KING 68',
            icon: 'crown',
            color: '#ffd700',
            description: 'Король космических мемов',
            type: 'royal',
            candidates: [
                { id: 'king1', name: 'MEME_LORD', votes: 42, description: 'Повелитель мемов' },
                { id: 'king2', name: 'КОСМОС', votes: 38, description: 'Покоритель вселенной' },
                { id: 'king3', name: 'SLAY STAR', votes: 25, description: 'Звезда года' }
            ]
        },
        'slay-queen': {
            id: 'slay-queen',
            name: 'SLAY QUEEN 68',
            icon: 'crown',
            color: '#ff00ff',
            description: 'Королева космических мемов',
            type: 'royal',
            candidates: [
                { id: 'queen1', name: 'КОРОЛЕВА МЕМОВ', votes: 35, description: 'Владычица мемов' },
                { id: 'queen2', name: 'ЛУНА', votes: 28, description: 'Ночная правительница' },
                { id: 'queen3', name: 'GALAXY QUEEN', votes: 22, description: 'Королева галактики' }
            ]
        },
        
        // 🏆 ВАШИ НОВЫЕ КАТЕГОРИИ
        'meme-year': {
            id: 'meme-year',
            name: 'МЕМ ГОДА',
            icon: 'laugh-beam',
            color: '#ff6b6b',
            description: 'Самый смешной и вирусный мем 2025',
            type: 'regular',
            candidates: [
                { id: 'm1', name: 'Космический Ждун', votes: 25, description: 'Ждун в скафандре' },
                { id: 'm2', name: 'Шрек-мем 2025', votes: 18, description: 'Новая версия Шрека' },
                { id: 'm3', name: 'Доге в космосе', votes: 15, description: 'Such space, wow' }
            ]
        },
        'ship-year': {
            id: 'ship-year',
            name: 'ПАРА(ШИП) ГОДА',
            icon: 'heart',
            color: '#ff6b9d',
            description: 'Лучшая пара или шипперская пара 2025',
            type: 'regular',
            candidates: [
                { id: 's1', name: 'Астронавт & Луна', votes: 22, description: 'Космическая любовь' },
                { id: 's2', name: 'Дроид & Робот', votes: 15, description: 'Техно-романтика' },
                { id: 's3', name: 'SLAY & ROYAL', votes: 12, description: 'Королевский шип' }
            ]
        },
        'dota-player-year': {
            id: 'dota-player-year',
            name: 'ДОТА ИГРОК ГОДА',
            icon: 'gamepad',
            color: '#4d96ff',
            description: 'Лучший игрок в Dota 2 за 2025 год',
            type: 'regular',
            candidates: [
                { id: 'd1', name: 'YATORO', votes: 32, description: 'Король керри' },
                { id: 'd2', name: 'MIRACLE', votes: 28, description: 'Легенда' },
                { id: 'd3', name: 'COLLAPSE', votes: 24, description: 'Непробиваемый' }
            ]
        },
        'event-year': {
            id: 'event-year',
            name: 'МЕРОПРИЯТИЕ ГОДА',
            icon: 'calendar-star',
            color: '#6c5ce7',
            description: 'Лучшее мероприятие или ивент 2025',
            type: 'regular',
            candidates: [
                { id: 'e1', name: 'The International 2025', votes: 40, description: 'Майнор по Доте' },
                { id: 'e2', name: 'Космофест', votes: 25, description: 'Фестиваль мемов' },
                { id: 'e3', name: 'SLAY Awards', votes: 18, description: 'Церемония наград' }
            ]
        },
        
        // 📦 Другие существующие категории
        'delivery-year': {
            id: 'delivery-year',
            name: 'ЗАВОЗ ГОДА',
            icon: 'truck-fast',
            color: '#00cec9',
            description: 'Лучший завоз или поставка года',
            type: 'regular',
            candidates: [
                { id: 'del1', name: 'Космическая пицца', votes: 20, description: 'Доставка на орбиту' },
                { id: 'del2', name: 'Мем-доставка', votes: 15, description: 'Свежие мемы каждый день' }
            ]
        },
        'style-year': {
            id: 'style-year',
            name: 'СТИЛЬ ГОДА',
            icon: 'tshirt',
            color: '#e91e63',
            description: 'Лучший стиль или образ года',
            type: 'regular',
            candidates: [
                { id: 'st1', name: 'Космо-стиль', votes: 18, description: 'Космическая мода' },
                { id: 'st2', name: 'Ретро-футуризм', votes: 12, description: 'Стиль будущего' }
            ]
        }
    };
    
    // Инициализируем категории в app
    Object.values(categories).forEach(cat => {
        app.categories[cat.id] = {
            ...cat,
            videoUrl: null,
            thumbnail: null,
            isYouTube: false
        };
    });
    
    console.log(`✅ Инициализировано ${Object.keys(app.categories).length} категорий`);
}

// 🏠 ЛОКАЛЬНЫЕ ДАННЫЕ (запасной вариант)
function initLocalData() {
    console.log('🏠 Загрузка локальных данных...');
    
    // Инициализируем все категории
    initAllCategories();
    
    // Загружаем сохраненные голоса
    loadLocalVotes();
}

// 🔒 ГЕНЕРАЦИЯ БЕЗОПАСНОГО ID
function generateSecureUserId() {
    let userId = localStorage.getItem('slay68_secure_user_id');
    
    if (!userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 16);
        
        userId = `user_${timestamp}_${random}`;
        localStorage.setItem('slay68_secure_user_id', userId);
        localStorage.setItem('slay68_user_created', timestamp);
        
        console.log('🆕 Создан новый защищенный ID пользователя');
    }
    
    app.user.id = userId;
    return userId;
}

// 🔒 ГЕНЕРАЦИЯ FINGERPRINT
function generateFingerprint() {
    try {
        const components = [];
        
        // Собираем данные о браузере и системе
        components.push(navigator.userAgent);
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
        components.push(navigator.language);
        components.push(navigator.platform);
        
        // Добавляем случайные компоненты для уникальности
        components.push(Math.random().toString(36).substr(2, 10));
        components.push(Date.now().toString(36));
        
        // Создаем простой хэш (без crypto.subtle для совместимости)
        const data = components.join('|');
        let hash = 0;
        
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const fingerprint = 'fp_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        app.user.fingerprint = fingerprint;
        
        console.log('🔒 Fingerprint:', fingerprint.substring(0, 20) + '...');
        return fingerprint;
        
    } catch (error) {
        console.error('Ошибка генерации fingerprint:', error);
        // Fallback
        const fallback = 'fp_fallback_' + Math.random().toString(36).substr(2, 32) + '_' + Date.now();
        app.user.fingerprint = fallback;
        return fallback;
    }
}

// 🔒 ЗАГРУЗКА НАСТРОЕК БЕЗОПАСНОСТИ
function loadSecuritySettings() {
    try {
        const saved = localStorage.getItem('slay68_security_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            app.settings.security = { ...app.settings.security, ...parsed };
            console.log('✅ Настройки безопасности загружены');
        }
    } catch (error) {
        console.warn('Не удалось загрузить настройки безопасности:', error);
    }
}

// 🔒 СОХРАНЕНИЕ НАСТРОЕК БЕЗОПАСНОСТИ
function saveSecuritySettings() {
    try {
        localStorage.setItem('slay68_security_config', JSON.stringify(app.settings.security));
        console.log('✅ Настройки безопасности сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения настроек безопасности:', error);
        return false;
    }
}

// 💾 ЗАГРУЗКА ЛОКАЛЬНЫХ ГОЛОСОВ
function loadLocalVotes() {
    try {
        const saved = localStorage.getItem('slay68_votes');
        if (saved) {
            const votes = JSON.parse(saved);
            app.user.votedCategories = votes.votedCategories || {};
            app.user.voteStats = votes.voteStats || { votesToday: 0, votesThisHour: 0, lastVoteTime: null };
            
            // Обновляем кандидатов
            Object.keys(votes.candidates || {}).forEach(catId => {
                if (app.categories[catId] && votes.candidates[catId]) {
                    app.categories[catId].candidates = votes.candidates[catId];
                }
            });
            
            console.log('✅ Локальные голоса загружены');
        }
    } catch (error) {
        console.warn('Не удалось загрузить локальные голоса:', error);
    }
}

// 💾 СОХРАНЕНИЕ ЛОКАЛЬНЫХ ГОЛОСОВ
function saveLocalVotes() {
    try {
        const data = {
            votedCategories: app.user.votedCategories,
            voteStats: app.user.voteStats,
            candidates: {}
        };
        
        // Сохраняем кандидатов по категориям
        Object.keys(app.categories).forEach(catId => {
            data.candidates[catId] = app.categories[catId].candidates;
        });
        
        localStorage.setItem('slay68_votes', JSON.stringify(data));
        console.log('💾 Голоса сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения голосов:', error);
        return false;
    }
}

// 🎨 РЕНДЕРИНГ
function renderAll() {
    renderStats();
    renderRoyalCategories();
    renderRegularCategories();
    updateAdminView();
}

// 📊 РЕНДЕРИНГ СТАТИСТИКИ
function renderStats() {
    try {
        let totalVotes = 0;
        let totalCandidates = 0;
        let uniqueVoters = 0;
        
        Object.values(app.categories).forEach(category => {
            category.candidates.forEach(candidate => {
                totalVotes += candidate.votes || 0;
            });
            totalCandidates += category.candidates.length;
        });
        
        // Уникальные голосующие - считаем по votedCategories
        uniqueVoters = Object.keys(app.user.votedCategories).length;
        
        document.getElementById('liveVotes').textContent = totalVotes;
        document.getElementById('liveVoters').textContent = uniqueVoters;
        document.getElementById('liveCandidates').textContent = totalCandidates;
        
        // Обновляем админ статистику
        if (document.getElementById('adminTotalVotes')) {
            document.getElementById('adminTotalVotes').textContent = totalVotes;
            document.getElementById('adminUniqueVoters').textContent = uniqueVoters;
        }
        
    } catch (error) {
        console.error('❌ Ошибка рендеринга статистики:', error);
    }
}

// 👑 РЕНДЕРИНГ КОРОЛЕВСКИХ КАТЕГОРИЙ
function renderRoyalCategories() {
    renderRoyalCategory('slay-king', 'kingContent');
    renderRoyalCategory('slay-queen', 'queenContent');
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
                <button onclick="openAddCandidateModal('${categoryId}')" class="btn-add-small">
                    <i class="fas fa-plus"></i> Добавить
                </button>
            </div>
        `;
    } else {
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        candidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId];
            const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
            const canVote = !hasVoted && !checkIfBlocked();
            
            html += `
                <div class="candidate-royal">
                    <div class="candidate-avatar" style="background: ${category.color}22; color: ${category.color}">
                        ${index + 1}
                    </div>
                    <div class="candidate-info">
                        <div class="candidate-name">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc">${candidate.description}</div>` : ''}
                        <div class="candidate-progress">
                            <div class="candidate-progress-bar" style="width: ${percentage}%; background: ${category.color}"></div>
                        </div>
                    </div>
                    <div class="candidate-votes">${candidate.votes || 0}</div>
                    <button class="vote-btn-royal ${hasVoted ? 'voted' : ''} ${!canVote ? 'disabled' : ''}" 
                            onclick="${canVote ? `voteForCandidate('${categoryId}', '${candidate.id}')` : 'showBlockReason()'}"
                            ${!canVote ? 'disabled' : ''}
                            style="background: ${category.color}">
                        ${hasVoted ? '<i class="fas fa-check"></i> ГОЛОС ПОДТВЕРЖДЕН' : 
                          canVote ? '<i class="fas fa-vote-yea"></i> ГОЛОСОВАТЬ' : 
                          '<i class="fas fa-ban"></i> НЕДОСТУПНО'}
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// 🏆 РЕНДЕРИНГ ОБЫЧНЫХ КАТЕГОРИЙ
function renderRegularCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    let html = '';
    
    // Только обычные категории (не королевские)
    const regularCategories = Object.values(app.categories).filter(cat => 
        cat.type !== 'royal'
    );
    
    regularCategories.forEach(category => {
        const totalVotes = category.candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        const candidateCount = category.candidates.length;
        
        html += `
            <div class="category-card" data-category="${category.id}">
                <div class="category-header">
                    <div class="category-icon" style="background: ${category.color}">
                        <i class="fas fa-${category.icon}"></i>
                    </div>
                    <h3>${category.name}</h3>
                </div>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span><i class="fas fa-users"></i> ${totalVotes} голосов</span>
                    <span><i class="fas fa-user-plus"></i> ${candidateCount} кандидатов</span>
                </div>
                <div class="category-body" id="${category.id}-candidates-preview">
                    ${renderCategoryPreview(category.id)}
                </div>
                <button class="btn-add" onclick="openCategoryModal('${category.id}')">
                    <i class="fas fa-vote-yea"></i> ${app.user.votedCategories[category.id] ? 'ПРОСМОТР' : 'ГОЛОСОВАТЬ'}
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 👀 РЕНДЕРИНГ ПРЕВЬЮ КАТЕГОРИИ
function renderCategoryPreview(categoryId) {
    const category = app.categories[categoryId];
    if (!category || category.candidates.length === 0) {
        return '<div class="empty-preview">Кандидатов пока нет</div>';
    }
    
    const topCandidates = category.candidates
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .slice(0, 3);
    
    let html = '<div class="candidates-preview">';
    
    topCandidates.forEach((candidate, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        html += `
            <div class="preview-candidate">
                <span class="preview-medal">${medal}</span>
                <span class="preview-name">${candidate.name}</span>
                <span class="preview-votes">${candidate.votes || 0}</span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// 🪟 ФУНКЦИИ МОДАЛЬНЫХ ОКОН
function openCategoryModal(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalCategoryTitle');
    const body = document.getElementById('modalCategoryBody');
    
    if (!modal || !title || !body) {
        console.error('Модальное окно не найдено');
        return;
    }
    
    title.textContent = category.name;
    
    // Рендерим кандидатов
    let html = `<p class="modal-description">${category.description}</p>`;
    
    if (category.candidates.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <p>Кандидатов пока нет. Будьте первым!</p>
                <button onclick="openAddCandidateModal('${categoryId}')" class="btn-add">
                    <i class="fas fa-plus"></i> Добавить кандидата
                </button>
            </div>
        `;
    } else {
        html += '<div class="candidates-list">';
        
        // Сортируем по голосам
        const sortedCandidates = [...category.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        sortedCandidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId];
            const canVote = !hasVoted && !checkIfBlocked();
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            
            html += `
                <div class="candidate-card">
                    <div class="candidate-rank">${medal}</div>
                    <div class="candidate-info">
                        <div class="candidate-name">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc">${candidate.description}</div>` : ''}
                    </div>
                    <div class="candidate-votes">${candidate.votes || 0}</div>
                    <button class="vote-btn-modal ${hasVoted ? 'voted' : ''} ${!canVote ? 'disabled' : ''}"
                            onclick="${canVote ? `voteForCandidate('${categoryId}', '${candidate.id}')` : 'showBlockReason()'}"
                            ${!canVote ? 'disabled' : ''}>
                        ${hasVoted ? '<i class="fas fa-check"></i> ✓' : 
                          canVote ? '<i class="fas fa-vote-yea"></i> Голос' : 
                          '<i class="fas fa-ban"></i> ✗'}
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Кнопка добавления кандидата
        if (!app.user.votedCategories[categoryId]) {
            html += `
                <button onclick="openAddCandidateModal('${categoryId}')" class="btn-add" style="margin-top: 1.5rem;">
                    <i class="fas fa-plus"></i> Добавить своего кандидата
                </button>
            `;
        }
    }
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openAddCandidateModal(categoryId) {
    const category = app.categories[categoryId];
    if (!category) return;
    
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('modalCategoryTitle');
    const body = document.getElementById('modalCategoryBody');
    
    title.textContent = `Добавить кандидата в ${category.name}`;
    
    body.innerHTML = `
        <div class="add-candidate-form">
            <div class="form-group">
                <label for="candidateName">Имя кандидата *</label>
                <input type="text" id="candidateName" placeholder="Введите имя" maxlength="100">
            </div>
            <div class="form-group">
                <label for="candidateDesc">Описание (необязательно)</label>
                <textarea id="candidateDesc" placeholder="Краткое описание" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button onclick="closeCategoryModal()" class="btn-secondary">
                    <i class="fas fa-times"></i> Отмена
                </button>
                <button onclick="submitCandidate('${categoryId}')" class="btn-primary">
                    <i class="fas fa-plus"></i> Добавить
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function submitCandidate(categoryId) {
    const nameInput = document.getElementById('candidateName');
    const descInput = document.getElementById('candidateDesc');
    
    if (!nameInput || !descInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    
    if (!name) {
        showNotification('❌ Введите имя кандидата', 'error');
        return;
    }
    
    if (name.length > 100) {
        showNotification('❌ Имя слишком длинное (макс. 100 символов)', 'error');
        return;
    }
    
    try {
        const candidateId = 'candidate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Добавляем кандидата
        app.categories[categoryId].candidates.push({
            id: candidateId,
            name: name,
            description: description,
            votes: 0,
            categoryId: categoryId
        });
        
        // Сохраняем
        saveLocalVotes();
        
        showNotification(`✅ Кандидат "${name}" добавлен!`, 'success');
        closeCategoryModal();
        
        // Обновляем отображение
        if (categoryId === 'slay-king' || categoryId === 'slay-queen') {
            renderRoyalCategory(categoryId, categoryId === 'slay-king' ? 'kingContent' : 'queenContent');
        } else {
            renderRegularCategories();
        }
        
        renderStats();
        
    } catch (error) {
        console.error('Ошибка добавления кандидата:', error);
        showNotification(`❌ ${error.message || 'Ошибка добавления'}`, 'error');
    }
}

// 🔒 ПРОВЕРКА НА БЛОКИРОВКУ
function checkIfBlocked() {
    const now = Date.now();
    
    // Проверяем временную блокировку
    if (now < app.security.blockedUntil) {
        const remainingMinutes = Math.ceil((app.security.blockedUntil - now) / 1000 / 60);
        app.security.isBlocked = true;
        app.security.blockReason = `Вы заблокированы на ${remainingMinutes} минут`;
        return app.security.blockReason;
    }
    
    // Проверяем слишком частые голосования
    const timeSinceLastVote = now - app.security.lastVoteTime;
    if (timeSinceLastVote < app.settings.security.MIN_TIME_BETWEEN_VOTES_MS) {
        const waitSeconds = Math.ceil((app.settings.security.MIN_TIME_BETWEEN_VOTES_MS - timeSinceLastVote) / 1000);
        app.security.blockReason = `Подождите ${waitSeconds} секунд`;
        return app.security.blockReason;
    }
    
    // Проверяем количество неудачных попыток
    if (app.security.failedAttempts >= app.settings.security.TEMP_BLOCK_AFTER_FAILED_ATTEMPTS) {
        const blockTime = 10 * 60 * 1000; // 10 минут
        app.security.blockedUntil = now + blockTime;
        app.security.isBlocked = true;
        app.security.blockReason = 'Слишком много неудачных попыток';
        return app.security.blockReason;
    }
    
    app.security.isBlocked = false;
    app.security.blockReason = null;
    return null;
}

// 🗳️ ГОЛОСОВАНИЕ (основная функция)
window.voteForCandidate = async function(categoryId, candidateId) {
    const now = Date.now();
    
    // Проверяем базовые ограничения
    if (now - app.user.lastVote < app.settings.security.VOTE_COOLDOWN_MS) {
        showNotification('Подождите перед следующим голосом', 'warning');
        return;
    }
    
    if (app.user.votedCategories[categoryId]) {
        showNotification('Вы уже голосовали в этой категории', 'warning');
        return;
    }
    
    // Проверяем блокировку
    if (app.security.blockedUntil > now) {
        const minutesLeft = Math.ceil((app.security.blockedUntil - now) / 60000);
        showNotification(`Вы заблокированы на ${minutesLeft} минут`, 'error');
        return;
    }
    
    try {
        const category = app.categories[categoryId];
        const candidate = category.candidates.find(c => c.id === candidateId);
        
        if (!candidate) {
            throw new Error('Кандидат не найден');
        }
        
        // Увеличиваем голос
        candidate.votes = (candidate.votes || 0) + 1;
        
        // Обновляем состояние
        app.user.votedCategories[categoryId] = true;
        app.user.lastVote = now;
        app.security.lastVoteTime = now;
        app.security.voteAttempts++;
        app.security.failedAttempts = 0; // Сбрасываем при успехе
        
        // Обновляем статистику
        app.user.voteStats.votesThisHour++;
        app.user.voteStats.lastVoteTime = now;
        
        // Сохраняем голоса
        saveLocalVotes();
        
        // Обновляем отображение
        closeCategoryModal();
        
        // Обновляем все отображение
        if (categoryId === 'slay-king' || categoryId === 'slay-queen') {
            renderRoyalCategory(categoryId, categoryId === 'slay-king' ? 'kingContent' : 'queenContent');
        } else {
            renderRegularCategories();
        }
        
        renderStats();
        
        showNotification(`✅ Вы проголосовали за ${candidate.name}!`, 'success');
        playSound('success');
        
        // Записываем в историю
        app.security.voteHistory.push({
            time: now,
            category: categoryId,
            candidate: candidateId,
            candidateName: candidate.name
        });
        
        // Ограничиваем историю
        if (app.security.voteHistory.length > 100) {
            app.security.voteHistory.shift();
        }
        
    } catch (error) {
        console.error('❌ Ошибка голосования:', error);
        
        app.security.failedAttempts++;
        
        showNotification(`❌ ${error.message || 'Ошибка голосования'}`, 'error');
        
        // Если много неудачных попыток - блокируем
        if (app.security.failedAttempts >= 10) {
            app.security.blockedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
            showNotification('🚫 Вы заблокированы на 24 часа за подозрительную активность', 'error');
        }
    }
};

// 🔄 СБРОС ВСЕХ ГОЛОСОВ
async function resetAllVotes() {
    // Первое подтверждение
    if (!confirm('🚨 ВНИМАНИЕ: Вы собираетесь сбросить ВСЕ голоса.\n\nЭто действие:')) {
        return;
    }
    
    // Второе подтверждение с деталями
    if (!confirm('1. Удалит ВСЕ записи о голосовании\n2. Обнулит счетчики ВСЕХ кандидатов\n3. НЕВОЗМОЖНО отменить\n\nВы уверены?')) {
        return;
    }
    
    // Третье подтверждение с вводом текста
    const confirmationText = prompt('Для подтверждения введите "СБРОСИТЬ ВСЕ ГОЛОСА" (без кавычек):');
    
    if (confirmationText !== 'СБРОСИТЬ ВСЕ ГОЛОСА') {
        showNotification('❌ Операция отменена: неверный текст подтверждения', 'error');
        return;
    }
    
    // Показываем предупреждение
    showNotification('🔄 Начинаем сброс голосов...', 'info');
    
    try {
        // Сбрасываем все голоса
        Object.values(app.categories).forEach(category => {
            category.candidates.forEach(candidate => {
                candidate.votes = 0;
            });
        });
        
        // Сбрасываем состояние пользователя
        app.user.votedCategories = {};
        app.user.voteStats.votesThisHour = 0;
        app.security.voteHistory = [];
        app.security.failedAttempts = 0;
        app.security.blockedUntil = 0;
        app.security.isBlocked = false;
        
        // Сохраняем
        saveLocalVotes();
        
        // Обновляем интерфейс
        renderAll();
        
        // Показываем результат
        showNotification('✅ Все голосы успешно сброшены!', 'success');
        playSound('success');
        
    } catch (error) {
        console.error('❌ Критическая ошибка сброса голосов:', error);
        showNotification(`❌ Ошибка: ${error.message}`, 'error');
    }
}

// 🛠️ НАСТРОЙКА СОБЫТИЙ
function setupEvents() {
    // Админ панель
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }
    
    // Логин админа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', loginAdmin);
    }
    
    // Закрытие админки
    const closeAdmin = document.getElementById('closeAdmin');
    if (closeAdmin) {
        closeAdmin.addEventListener('click', closeAdminPanel);
    }
    
    // Кнопки админки
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllVotes);
    }
    
    // Музыка и тема
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) {
        musicBtn.addEventListener('click', toggleMusic);
    }
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Закрытие модалок кликом вне области
    const categoryModal = document.getElementById('categoryModal');
    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                closeCategoryModal();
            }
        });
    }
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.addEventListener('click', (e) => {
            if (e.target === adminPanel) {
                closeAdminPanel();
            }
        });
    }
}

// 🔧 АДМИН ПАНЕЛЬ
function showAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'flex';
        updateAdminView();
    }
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function loginAdmin() {
    const passwordInput = document.getElementById('adminPass');
    const loginSection = document.getElementById('loginSection');
    const controlSection = document.getElementById('controlSection');
    
    if (!passwordInput || !loginSection || !controlSection) return;
    
    const password = passwordInput.value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        loginSection.style.display = 'none';
        controlSection.style.display = 'block';
        updateAdminView();
        showNotification('✅ Админ доступ разрешен', 'success');
    } else {
        showNotification('❌ Неверный пароль', 'error');
        passwordInput.value = '';
    }
}

function updateAdminView() {
    // Обновляем статистику
    renderStats();
    
    // Обновляем настройки безопасности
    updateSecurityTab();
}

function updateSecurityTab() {
    const enableFingerprint = document.getElementById('enableFingerprint');
    const maxVotesPerHour = document.getElementById('maxVotesPerHour');
    
    if (enableFingerprint) {
        enableFingerprint.checked = app.settings.security.ENABLE_FINGERPRINT;
    }
    
    if (maxVotesPerHour) {
        maxVotesPerHour.value = app.settings.security.MAX_VOTES_PER_USER_PER_HOUR;
    }
}

// 🎵 МУЗЫКА И ТЕМА
function toggleMusic() {
    const music = document.getElementById('backgroundMusic');
    const btn = document.getElementById('musicBtn');
    
    if (!music || !btn) return;
    
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
    if (!btn) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    app.settings.theme = newTheme;
    
    btn.innerHTML = newTheme === 'dark' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
    
    saveUserSettings();
}

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
        const data = {
            exportDate: new Date().toISOString(),
            categories: app.categories,
            user: {
                id: app.user.id.substring(0, 20) + '...',
                voteStats: app.user.voteStats,
                votedCategories: app.user.votedCategories
            },
            security: {
                config: app.settings.security,
                state: {
                    blocked: app.security.isBlocked,
                    blockedUntil: app.security.blockedUntil,
                    failedAttempts: app.security.failedAttempts
                }
            }
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

// 🔔 УВЕДОМЛЕНИЯ
function showNotification(message, type = 'info', duration = 3000) {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
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
    
    // Позиционируем
    notification.style.top = '20px';
    notification.style.right = '20px';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function showBlockReason() {
    const reason = checkIfBlocked();
    if (reason) {
        showNotification(`⛔ ${reason}`, 'warning');
    } else {
        showNotification('❌ Голосование недоступно', 'error');
    }
}

function playSound(type) {
    if (type === 'success') {
        try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Звук заблокирован'));
        } catch (e) {
            console.log('Ошибка воспроизведения звука');
        }
    }
}

// ✨ ЧАСТИЦЫ
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

// 📁 СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ
function saveAllData() {
    try {
        const data = {
            categories: app.categories,
            user: app.user,
            security: app.security,
            settings: app.settings
        };
        
        localStorage.setItem('slay68_full_data', JSON.stringify(data));
        console.log('💾 Все данные сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
}

function loadAllData() {
    try {
        const saved = localStorage.getItem('slay68_full_data');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Восстанавливаем категории
            Object.keys(data.categories || {}).forEach(catId => {
                if (app.categories[catId]) {
                    app.categories[catId].candidates = data.categories[catId].candidates || [];
                }
            });
            
            // Восстанавливаем пользователя
            app.user.votedCategories = data.user?.votedCategories || {};
            app.user.voteStats = data.user?.voteStats || { votesToday: 0, votesThisHour: 0, lastVoteTime: null };
            
            console.log('✅ Все данные загружены');
            return true;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
    return false;
}

// 🌐 АВТОСОХРАНЕНИЕ
setInterval(() => {
    saveLocalVotes();
    saveUserSettings();
}, 30000); // Каждые 30 секунд

// 📱 ОБРАБОТЧИКИ ОШИБОК
window.addEventListener('error', function(e) {
    console.error('Глобальная ошибка:', e.error);
    showNotification('⚠️ Произошла ошибка. Попробуйте обновить страницу.', 'warning');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Необработанный промис:', e.reason);
});

// 🚀 ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.openAddCandidateModal = openAddCandidateModal;
window.submitCandidate = submitCandidate;
window.showAdminPanel = showAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.loginAdmin = loginAdmin;
window.resetAllVotes = resetAllVotes;
window.exportData = exportData;
window.toggleMusic = toggleMusic;
window.toggleTheme = toggleTheme;

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
