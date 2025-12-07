// === GLITCH AWARDS 2025 - SUPABASE VERSION ===

// 🔧 КОНФИГУРАЦИЯ
const CONFIG = {
    ADMIN_PASSWORD: "Glitch2025!",
    USE_SUPABASE: true, // Включаем Supabase
    
    // Защита от накрутки
    SECURITY: {
        MAX_VOTES_PER_USER_PER_HOUR: 50,
        MAX_VOTES_PER_FINGERPRINT_PER_HOUR: 30,
        MIN_TIME_BETWEEN_VOTES_MS: 2000,
        ENABLE_FINGERPRINT: true,
        BLOCK_DURATION_MS: 10 * 60 * 1000 // 10 минут
    }
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
    supabase: null,
    stats: {
        totalVotes: 0,
        totalVoters: 0,
        totalCandidates: 0,
        startTime: Date.now()
    }
};

// 🚀 ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
async function initApp() {
    console.log('⚡ GLITCH AWARDS 2025 запускается...');
    
    // Инициализация пользователя
    initUser();
    
    // Подключение к Supabase
    await initSupabase();
    
    // Загрузка настроек
    loadSettings();
    
    // Загрузка данных
    await loadData();
    
    // Настройка событий
    setupEvents();
    
    // Рендеринг интерфейса
    renderAll();
    
    // Запуск таймеров
    startTimers();
    
    console.log('✅ GLITCH SYSTEM ONLINE');
    showNotification('⚡ GLITCH SYSTEM ONLINE', 'success');
}

// 🗄️ ИНИЦИАЛИЗАЦИЯ SUPABASE
async function initSupabase() {
    try {
        app.supabase = window.supabase;
        
        if (!app.supabase) {
            throw new Error('Supabase не инициализирован');
        }
        
        // Проверка подключения
        const { data, error } = await app.supabase
            .from('categories')
            .select('count')
            .limit(1);
            
        if (error) {
            console.warn('⚠️ Supabase: таблицы ещё не созданы');
            await createSupabaseTables();
        } else {
            console.log('✅ Supabase подключен успешно');
            updateDbStatus('CONNECTED');
        }
        
    } catch (error) {
        console.error('❌ Ошибка подключения к Supabase:', error);
        updateDbStatus('ERROR');
        showNotification('⚠️ Используется локальный режим', 'warning');
        CONFIG.USE_SUPABASE = false;
    }
}

// 🗄️ СОЗДАНИЕ ТАБЛИЦ В SUPABASE
async function createSupabaseTables() {
    try {
        console.log('🛠️ Создание таблиц в Supabase...');
        
        // Таблица категорий
        const categories = [
            { id: 'glitch-king', name: 'GLITCH KING', icon: 'crown', color: '#ffff00', description: 'Король глитч мемов 2025', order: 1 },
            { id: 'glitch-queen', name: 'GLITCH QUEEN', icon: 'crown', color: '#ff00ff', description: 'Королева глитч мемов 2025', order: 2 },
            { id: 'meme-year', name: 'МЕМ ГОДА', icon: 'laugh-beam', color: '#00ff88', description: 'Самый вирусный мем 2025', order: 3 },
            { id: 'ship-year', name: 'ПАРА(ШИП) ГОДА', icon: 'heart', color: '#ff00ff', description: 'Лучшая пара/шип 2025', order: 4 },
            { id: 'dota-player-year', name: 'ДОТА ИГРОК ГОДА', icon: 'gamepad', color: '#00ffff', description: 'Лучший игрок в Dota 2 2025', order: 5 },
            { id: 'event-year', name: 'МЕРОПРИЯТИЕ ГОДА', icon: 'calendar-star', color: '#ff7700', description: 'Лучшее мероприятие 2025', order: 6 }
        ];
        
        for (const category of categories) {
            const { error } = await app.supabase
                .from('categories')
                .upsert(category);
                
            if (error) {
                console.warn(`Ошибка добавления категории ${category.name}:`, error.message);
            }
        }
        
        console.log('✅ Таблицы созданы');
        updateDbStatus('TABLES_CREATED');
        
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error);
        updateDbStatus('SETUP_ERROR');
    }
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
async function loadData() {
    console.log('📁 Загрузка данных...');
    
    // Загрузка голосов пользователя
    await loadUserVotes();
    
    // Загрузка категорий и кандидатов
    if (CONFIG.USE_SUPABASE && app.supabase) {
        await loadDataFromSupabase();
    } else {
        loadLocalData();
    }
}

// 🗄️ ЗАГРУЗКА ИЗ SUPABASE
async function loadDataFromSupabase() {
    try {
        console.log('🔄 Загрузка данных из Supabase...');
        
        // Загрузка категорий
        const { data: categories, error: categoriesError } = await app.supabase
            .from('categories')
            .select('*')
            .order('order', { ascending: true });
            
        if (categoriesError) throw categoriesError;
        
        // Инициализируем категории
        categories.forEach(category => {
            app.categories[category.id] = {
                ...category,
                candidates: [],
                type: category.id.includes('king') || category.id.includes('queen') ? 'royal' : 'regular'
            };
        });
        
        console.log(`✅ Загружено ${categories.length} категорий`);
        
        // Загрузка кандидатов для каждой категории
        for (const category of categories) {
            const { data: candidates, error: candidatesError } = await app.supabase
                .from('candidates')
                .select('*')
                .eq('category_id', category.id)
                .order('votes', { ascending: false });
                
            if (!candidatesError && candidates) {
                app.categories[category.id].candidates = candidates.map(candidate => ({
                    ...candidate,
                    categoryId: candidate.category_id
                }));
            }
        }
        
        updateDbStatus('SYNCED');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки из Supabase:', error);
        loadLocalData();
    }
}

// 💾 ЗАГРУЗКА ЛОКАЛЬНЫХ ДАННЫХ
function loadLocalData() {
    console.log('💾 Загрузка локальных данных...');
    
    const defaultCategories = {
        'glitch-king': {
            id: 'glitch-king',
            name: 'GLITCH KING',
            icon: 'crown',
            color: '#ffff00',
            description: 'Король глитч мемов 2025',
            type: 'royal',
            candidates: [
                { id: 'k1', name: 'CYBER MEME LORD', votes: 68, description: 'Повелитель кибер мемов' },
                { id: 'k2', name: 'GLITCH PROPHET', votes: 42, description: 'Пророк глитчей' }
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
                { id: 'q2', name: 'PIXEL GODDESS', votes: 38, description: 'Богиня пикселей' }
            ]
        },
        'meme-year': {
            id: 'meme-year',
            name: 'МЕМ ГОДА',
            icon: 'laugh-beam',
            color: '#00ff88',
            description: 'Самый вирусный мем 2025',
            type: 'regular',
            candidates: [
                { id: 'm1', name: 'GLITCH DOGE', votes: 45, description: 'Собака в матрице' },
                { id: 'm2', name: 'NEON PEPE', votes: 32, description: 'Радужная лягушка' }
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
                { id: 's2', name: 'GLITCH x MATRIX', votes: 25, description: 'Любовь в матрице' }
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
                { id: 'd2', name: 'MIRACLE-', votes: 41, description: 'Легенда Mid' }
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
                { id: 'e2', name: 'GLITCH CON 2025', votes: 42, description: 'Киберпанк конвент' }
            ]
        }
    };
    
    // Загружаем сохранённых кандидатов
    try {
        const savedCandidates = JSON.parse(localStorage.getItem('glitch_candidates') || '{}');
        
        Object.keys(defaultCategories).forEach(catId => {
            const category = defaultCategories[catId];
            
            if (savedCandidates[catId] && savedCandidates[catId].length > 0) {
                category.candidates = savedCandidates[catId];
            }
            
            app.categories[catId] = category;
        });
    } catch (error) {
        console.error('Ошибка загрузки кандидатов:', error);
        Object.keys(defaultCategories).forEach(catId => {
            app.categories[catId] = defaultCategories[catId];
        });
    }
}

// 🗳️ ЗАГРУЗКА ГОЛОСОВ ПОЛЬЗОВАТЕЛЯ
async function loadUserVotes() {
    if (CONFIG.USE_SUPABASE && app.supabase) {
        try {
            const { data: votes, error } = await app.supabase
                .from('votes')
                .select('category_id, candidate_id, created_at')
                .eq('user_id', app.user.id)
                .or(`fingerprint.eq.${app.user.fingerprint}`);
                
            if (!error && votes) {
                votes.forEach(vote => {
                    app.user.votedCategories[vote.category_id] = true;
                });
                console.log(`✅ Загружено ${votes.length} голосов пользователя`);
            }
        } catch (error) {
            console.error('Ошибка загрузки голосов:', error);
        }
    } else {
        try {
            const saved = JSON.parse(localStorage.getItem('glitch_votes') || '{}');
            app.user.votedCategories = saved.votedCategories || {};
            app.user.votesHistory = saved.votesHistory || [];
            app.user.totalVotes = saved.totalVotes || 0;
        } catch (error) {
            console.error('Ошибка загрузки голосов:', error);
        }
    }
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
        let totalVotes = 0;
        let totalCandidates = 0;
        
        Object.values(app.categories).forEach(category => {
            category.candidates.forEach(candidate => {
                totalVotes += candidate.votes || 0;
            });
            totalCandidates += category.candidates.length;
        });
        
        const totalVoters = Object.keys(app.user.votedCategories).length;
        
        document.getElementById('liveVotes').textContent = totalVotes;
        document.getElementById('liveVoters').textContent = totalVoters;
        document.getElementById('liveCandidates').textContent = totalCandidates;
        
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

// 🗳️ ФУНКЦИЯ ГОЛОСОВАНИЯ (с Supabase)
window.vote = async function(categoryId, candidateId) {
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
        if (CONFIG.USE_SUPABASE && app.supabase) {
            // Голосование через Supabase
            const { error: voteError } = await app.supabase
                .from('votes')
                .insert({
                    user_id: app.user.id,
                    fingerprint: app.user.fingerprint,
                    category_id: categoryId,
                    candidate_id: candidateId,
                    user_agent: navigator.userAgent
                });
                
            if (voteError) {
                if (voteError.message.includes('duplicate') || voteError.message.includes('уже')) {
                    app.user.votedCategories[categoryId] = true;
                    showNotification('❌ Вы уже голосовали в этой категории', 'error');
                    renderAll();
                    return;
                }
                throw voteError;
            }
            
            // Обновляем счётчик голосов кандидата
            const newVotes = (candidate.votes || 0) + 1;
            const { error: updateError } = await app.supabase
                .from('candidates')
                .update({ votes: newVotes })
                .eq('id', candidateId);
                
            if (updateError) throw updateError;
            
            candidate.votes = newVotes;
            
        } else {
            // Локальное голосование
            candidate.votes = (candidate.votes || 0) + 1;
        }
        
        // Обновляем состояние пользователя
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
        saveLocalData();
        
        // Обновляем интерфейс
        renderAll();
        closeModal('categoryModal');
        
        // Уведомление
        showNotification(`✅ Вы проголосовали за "${candidate.name}"!`, 'success');
        playSound('vote');
        
    } catch (error) {
        console.error('❌ Ошибка голосования:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('лимит')) {
            showNotification('⏳ Слишком много голосов. Попробуйте позже.', 'warning');
        } else if (error.message.includes('fingerprint') || error.message.includes('дубликат')) {
            app.user.votedCategories[categoryId] = true;
            showNotification('❌ Обнаружен дубликат голосования', 'error');
            renderAll();
        } else {
            showNotification('❌ Ошибка при голосовании', 'error');
        }
    }
};

// 🔒 ПРОВЕРКА ВОЗМОЖНОСТИ ГОЛОСОВАНИЯ
function canUserVote() {
    const now = Date.now();
    
    if (app.user.lastVoteTime) {
        const timeSinceLastVote = now - app.user.lastVoteTime;
        if (timeSinceLastVote < CONFIG.SECURITY.MIN_TIME_BETWEEN_VOTES_MS) {
            const waitSeconds = Math.ceil((CONFIG.SECURITY.MIN_TIME_BETWEEN_VOTES_MS - timeSinceLastVote) / 1000);
            showNotification(`⏳ Подождите ${waitSeconds} секунд`, 'warning');
            return false;
        }
    }
    
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

// ➕ ДОБАВЛЕНИЕ КАНДИДАТА (с Supabase)
async function addCandidate(categoryId) {
    const nameInput = document.getElementById('candidateName');
    const descInput = document.getElementById('candidateDesc');
    
    if (!nameInput || !descInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    
    if (!name) {
        showNotification('❌ Введите имя кандидата', 'error');
        return;
    }
    
    try {
        const category = app.categories[categoryId];
        if (!category) return;
        
        if (CONFIG.USE_SUPABASE && app.supabase) {
            // Добавляем кандидата в Supabase
            const { data, error } = await app.supabase
                .from('candidates')
                .insert({
                    category_id: categoryId,
                    name: name,
                    description: description,
                    votes: 0,
                    added_by: app.user.id
                })
                .select()
                .single();
                
            if (error) throw error;
            
            // Добавляем в локальное состояние
            category.candidates.push({
                ...data,
                id: data.id,
                categoryId: data.category_id
            });
            
        } else {
            // Локальное добавление
            const candidateId = 'candidate_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            category.candidates.push({
                id: candidateId,
                name: name,
                description: description,
                votes: 0,
                addedBy: app.user.id,
                addedAt: new Date().toISOString()
            });
            
            saveLocalData();
        }
        
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

// 🛠️ УТИЛИТЫ
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateDbStatus(status) {
    const dbStatusElement = document.getElementById('dbStatus');
    if (!dbStatusElement) return;
    
    const statusMap = {
        'CONNECTING': { text: 'CONNECTING...', color: '#ffff00' },
        'CONNECTED': { text: 'CONNECTED', color: '#00ff88' },
        'TABLES_CREATED': { text: 'READY', color: '#00ff88' },
        'SYNCED': { text: 'SYNCED', color: '#00ff88' },
        'ERROR': { text: 'ERROR', color: '#ff0000' },
        'SETUP_ERROR': { text: 'SETUP ERROR', color: '#ff0000' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: '#ffff00' };
    dbStatusElement.textContent = statusInfo.text;
    dbStatusElement.style.color = statusInfo.color;
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

function saveLocalData() {
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
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('glitch_settings') || '{}');
        app.settings = { ...app.settings, ...saved };
        
        if (app.settings.theme) {
            document.documentElement.setAttribute('data-theme', app.settings.theme);
        }
        
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

function setupEvents() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }
    
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    document.addEventListener('click', function(e) {
        const modals = ['categoryModal', 'adminModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display === 'flex' && e.target === modal) {
                closeModal(modalId);
            }
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal('categoryModal');
            closeModal('adminModal');
        }
    });
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

function showNotification(message, type = 'info') {
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

function startTimers() {
    setInterval(updateUptime, 1000);
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
