// 🔧 КОНФИГУРАЦИЯ С ЗАЩИТОЙ
const CONFIG = {
    ADMIN_PASSWORD: "Marshlopopo228!",
    USE_SUPABASE: true,
    
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

// 🚀 ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 SLAY 68 с защитой запускается...');
    
    // Загружаем настройки безопасности
    loadSecuritySettings();
    
    // Генерируем ID пользователя с защитой
    app.user.id = await generateSecureUserId();
    console.log('👤 Безопасный ID пользователя:', app.user.id.substring(0, 20) + '...');
    
    // Генерируем fingerprint
    if (app.settings.security.ENABLE_FINGERPRINT) {
        app.user.fingerprint = await generateFingerprint();
        console.log('🔒 Fingerprint:', app.user.fingerprint.substring(0, 16) + '...');
    } else {
        app.user.fingerprint = 'no_fp';
        console.log('🔓 Fingerprint защита отключена');
    }
    
    // Загружаем локальные настройки
    loadUserSettings();
    
    // Инициализируем Supabase если включено
    if (CONFIG.USE_SUPABASE && window.SupabaseService) {
        try {
            console.log('🔄 Инициализация Supabase с защитой...');
            app.supabase = new SupabaseService();
            
            // Обновляем конфигурацию безопасности в Supabase
            if (app.supabase.updateSecurityConfig) {
                await app.supabase.updateSecurityConfig(app.settings.security);
            }
            
            // Проверяем подключение
            const connected = await app.supabase.checkConnection();
            if (connected) {
                console.log('✅ Supabase подключен, загружаем данные...');
                await loadDataFromSupabase();
                showNotification('✅ Подключено к защищенной базе данных', 'success');
                
                // Проверяем лимиты голосования
                await updateVoteStats();
            } else {
                throw new Error('Нет подключения к Supabase');
            }
        } catch (error) {
            console.error('❌ Ошибка Supabase:', error);
            showNotification('⚠️ Используется локальный режим', 'warning');
            initLocalData();
        }
    } else {
        console.log('🔄 Используем локальные данные...');
        initLocalData();
    }
    
    // Настраиваем события и рендерим
    setupEvents();
    renderAll();
    initParticles();
    
    // Показываем предупреждение о защите
    if (app.settings.security.ENABLE_FINGERPRINT) {
        console.log('🛡️ Защита от накрутки активирована');
    }
    
    console.log('✅ Приложение готово с защитой!');
});

// 🔒 ГЕНЕРАЦИЯ БЕЗОПАСНОГО ID
async function generateSecureUserId() {
    let userId = localStorage.getItem('slay68_secure_user_id');
    
    if (!userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 16);
        const fp = app.user.fingerprint ? app.user.fingerprint.substring(0, 12) : 'no_fp';
        
        userId = `secure_${timestamp}_${random}_${fp}`;
        localStorage.setItem('slay68_secure_user_id', userId);
        localStorage.setItem('slay68_user_created', timestamp);
        
        console.log('🆕 Создан новый защищенный ID пользователя');
    }
    
    return userId;
}

// 🔒 ГЕНЕРАЦИЯ FINGERPRINT
async function generateFingerprint() {
    try {
        const components = [];
        
        // Собираем данные о браузере и системе
        components.push(navigator.userAgent);
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
        components.push(navigator.language);
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        components.push(navigator.platform);
        components.push(navigator.hardwareConcurrency || 'unknown');
        components.push(navigator.deviceMemory || 'unknown');
        components.push(navigator.maxTouchPoints || '0');
        
        // Добавляем случайные компоненты для уникальности
        components.push(Math.random().toString(36).substr(2, 10));
        components.push(Date.now().toString(36));
        
        // Создаем хэш
        const data = components.join('|');
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Используем Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
        
    } catch (error) {
        console.error('Ошибка генерации fingerprint:', error);
        // Fallback
        return 'fp_fallback_' + Math.random().toString(36).substr(2, 32) + '_' + Date.now();
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

// 📥 ЗАГРУЗКА ДАННЫХ ИЗ SUPABASE
async function loadDataFromSupabase() {
    try {
        app.categories = await app.supabase.getCategories();
        
        const categoryIds = Object.keys(app.categories);
        for (const categoryId of categoryIds) {
            const candidates = await app.supabase.getCandidates(categoryId);
            app.categories[categoryId].candidates = candidates;
        }
        
        await loadUserVotes();
        await updateVoteStats();
        
        console.log('✅ Данные с защитой загружены из Supabase');
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        throw error;
    }
}

// 👤 ЗАГРУЗКА ГОЛОСОВ ПОЛЬЗОВАТЕЛЯ
async function loadUserVotes() {
    if (!app.supabase) return;
    
    try {
        const categoryIds = Object.keys(app.categories);
        for (const categoryId of categoryIds) {
            const hasVoted = await app.supabase.hasUserVoted(app.user.id, categoryId);
            if (hasVoted) {
                app.user.votedCategories[categoryId] = true;
            }
        }
        console.log(`✅ Загружены голоса пользователя для ${Object.keys(app.user.votedCategories).length} категорий`);
    } catch (error) {
        console.error('❌ Ошибка загрузки голосов:', error);
    }
}

// 📊 ОБНОВЛЕНИЕ СТАТИСТИКИ ГОЛОСОВАНИЯ
async function updateVoteStats() {
    if (!app.supabase) return;
    
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: recentVotes, error } = await app.supabase.client
            .from('votes')
            .select('created_at')
            .eq('user_id', app.user.id)
            .gte('created_at', oneHourAgo);
        
        if (error) {
            console.error('Ошибка получения статистики голосов:', error);
            return;
        }
        
        app.user.voteStats.votesThisHour = recentVotes?.length || 0;
        app.user.voteStats.lastVoteTime = recentVotes?.[0]?.created_at || null;
        
        console.log(`📊 Голосов за час: ${app.user.voteStats.votesThisHour}/${app.settings.security.MAX_VOTES_PER_USER_PER_HOUR}`);
        
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
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
    
    // Проверяем лимиты голосований
    if (app.user.voteStats.votesThisHour >= app.settings.security.MAX_VOTES_PER_USER_PER_HOUR) {
        const nextHour = new Date(now + 60 * 60 * 1000);
        app.security.blockedUntil = nextHour.getTime();
        app.security.isBlocked = true;
        app.security.blockReason = `Достигнут лимит голосов (${app.settings.security.MAX_VOTES_PER_USER_PER_HOUR}/час)`;
        return app.security.blockReason;
    }
    
    app.security.isBlocked = false;
    app.security.blockReason = null;
    return null;
}

// 🏠 ЛОКАЛЬНЫЕ ДАННЫЕ (запасной вариант)
function initLocalData() {
    console.log('🏠 Загрузка локальных данных...');
    
    app.categories = {
        'slay-king': {
            id: 'slay-king',
            name: 'SLAY KING 68',
            icon: 'crown',
            color: '#ffd700',
            description: 'Король космических мемов',
            videoUrl: null,
            thumbnail: null,
            isYouTube: false,
            candidates: [
                { id: '1', name: 'MEME_LORD', votes: 42, description: 'Повелитель мемов' },
                { id: '2', name: 'КОСМОС', votes: 38, description: 'Покоритель вселенной' }
            ]
        },
        'slay-queen': {
            id: 'slay-queen',
            name: 'SLAY QUEEN 68',
            icon: 'crown',
            color: '#ff00ff',
            description: 'Королева космических мемов',
            videoUrl: null,
            thumbnail: null,
            isYouTube: false,
            candidates: [
                { id: '3', name: 'КОРОЛЕВА МЕМОВ', votes: 35, description: 'Владычица мемов' },
                { id: '4', name: 'ЛУНА', votes: 28, description: 'Ночная правительница' }
            ]
        }
    };
    
    const otherCategories = [
        ['meme-person', 'ЧЕЛОВЕК МЕМ-ГОДА', 'laugh-beam', '#00ff88'],
        ['event-year', 'МЕРОПРИЯТИЕ ГОДА', 'calendar-star', '#36d1dc'],
        ['ship-year', 'ПАРА(ШИП) ГОДА', 'heart', '#ff6584'],
        ['dota-player', 'ДОТА ИГРОК ГОДА', 'gamepad', '#6c63ff'],
        ['delivery-year', 'ЗАВОЗ ГОДА', 'truck-fast', '#ff9800'],
        ['style-year', 'СТИЛЬ ГОДА', 'tshirt', '#e91e63']
    ];
    
    otherCategories.forEach(([id, name, icon, color]) => {
        app.categories[id] = {
            id, name, icon, color,
            description: name,
            videoUrl: null,
            thumbnail: null,
            isYouTube: false,
            candidates: []
        };
    });
}

// 🎨 РЕНДЕРИНГ
function renderAll() {
    renderStats();
    renderRoyalCategories();
    renderRegularCategories();
    updateAdminView();
}

// 📊 РЕНДЕРИНГ СТАТИСТИКИ
async function renderStats() {
    try {
        if (app.supabase) {
            const stats = await app.supabase.getStatistics();
            document.getElementById('liveVotes').textContent = stats.totalVotes;
            document.getElementById('liveVoters').textContent = stats.uniqueUsers;
            document.getElementById('liveCandidates').textContent = stats.candidatesCount;
            
            document.getElementById('adminTotalVotes').textContent = stats.totalVotes;
            document.getElementById('adminUniqueVoters').textContent = stats.uniqueUsers;
            document.getElementById('adminBlockedAttempts').textContent = stats.blockedAttempts || 0;
        } else {
            let totalVotes = 0;
            let totalCandidates = 0;
            
            Object.values(app.categories).forEach(category => {
                category.candidates.forEach(candidate => {
                    totalVotes += candidate.votes || 0;
                });
                totalCandidates += category.candidates.length;
            });
            
            document.getElementById('liveVotes').textContent = totalVotes;
            document.getElementById('liveVoters').textContent = Math.floor(totalVotes / 2);
            document.getElementById('liveCandidates').textContent = totalCandidates;
        }
    } catch (error) {
        console.error('❌ Ошибка рендеринга статистики:', error);
    }
}

// 👑 РЕНДЕРИНГ КОРОЛЕВСКИХ КАТЕГОРИЙ
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
            const hasVoted = app.user.votedCategories[categoryId];
            const percentage = totalVotes > 0 ? Math.round(((candidate.votes || 0) / totalVotes) * 100) : 0;
            
            // Проверяем, можно ли голосовать
            const canVote = !hasVoted && !checkIfBlocked();
            
            html += `
                <div class="candidate-royal">
                    <div class="candidate-avatar">${index + 1}</div>
                    <div class="candidate-info">
                        <div class="candidate-name">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc">${candidate.description}</div>` : ''}
                        <div class="candidate-progress">
                            <div class="candidate-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="candidate-votes">${candidate.votes || 0}</div>
                    <button class="vote-btn-royal ${hasVoted ? 'voted' : ''} ${!canVote ? 'disabled' : ''}" 
                            onclick="${canVote ? `voteForCandidate('${categoryId}', '${candidate.id}')` : 'showBlockReason()'}"
                            ${!canVote ? 'disabled' : ''}>
                        ${hasVoted ? '<i class="fas fa-check"></i> ГОЛОС ПОДТВЕРЖДЕН' : 
                          canVote ? '<i class="fas fa-vote-yea"></i> ГОЛОСОВАТЬ' : 
                          '<i class="fas fa-ban"></i> НЕДОСТУПНО'}
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
    renderVideoForCategory(categoryId);
}
// 🗳️ ГОЛОСОВАНИЕ С ПРОВЕРКОЙ ЛИМИТОВ
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
        // Если используем Supabase - проверяем лимиты через функцию
        if (app.supabase && app.supabase.checkVoteWithLimits) {
            const limitCheck = await app.supabase.checkVoteWithLimits(
                app.user.id, 
                app.user.fingerprint, 
                categoryId
            );
            
            if (!limitCheck.canVote) {
                showNotification(`⏳ ${limitCheck.reason}`, 'warning');
                
                // Если лимит превышен, блокируем на час
                if (limitCheck.reason.includes('лимит') && limitCheck.votesLastHour >= 50) {
                    app.security.blockedUntil = now + 60 * 60 * 1000;
                }
                return;
            }
            
            // Проверяем не голосовал ли уже
            const alreadyVoted = await app.supabase.checkAlreadyVoted(
                app.user.id,
                app.user.fingerprint,
                categoryId
            );
            
            if (alreadyVoted) {
                showNotification('Вы уже голосовали в этой категории', 'warning');
                app.user.votedCategories[categoryId] = true;
                renderCategory(categoryId);
                return;
            }
        }
        
        // Голосуем
        const category = app.categories[categoryId];
        const candidate = category.candidates.find(c => c.id === candidateId);
        
        if (!candidate) {
            throw new Error('Кандидат не найден');
        }
        
        if (app.supabase) {
            // Голосуем через защищенный метод
            const voteData = {
                user_id: app.user.id,
                candidate_id: candidateId,
                category_id: categoryId,
                fingerprint: app.user.fingerprint,
                user_agent: navigator.userAgent
            };
            
            const result = await app.supabase.voteForCandidateWithSecurity(voteData);
            
            if (result.success) {
                candidate.votes = result.newVotes;
                app.user.voteStats.votesThisHour = result.votesThisHour || 0;
            }
            
        } else {
            // Локальное голосование
            candidate.votes = (candidate.votes || 0) + 1;
        }
        
        // Обновляем состояние
        app.user.votedCategories[categoryId] = true;
        app.user.lastVote = now;
        app.security.voteAttempts++;
        app.security.failedAttempts = 0; // Сбрасываем при успехе
        
        // Обновляем отображение
        renderCategory(categoryId);
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
        
        // Обработка ошибок
        if (error.message.includes('быстрое голосование') || 
            error.message.includes('fast voting') ||
            error.message.includes('1 секунду')) {
            showNotification('⏳ Слишком быстро! Подождите 1 секунду.', 'warning');
            
        } else if (error.message.includes('лимит') || 
                  error.message.includes('limit') ||
                  error.message.includes('50/час')) {
            showNotification('⏳ Достигнут лимит голосов (50/час). Попробуйте позже.', 'warning');
            app.security.blockedUntil = Date.now() + 60 * 60 * 1000; // 1 час
            
        } else if (error.message.includes('уже голосовали') || 
                  error.message.includes('already voted') ||
                  error.message.includes('повторный голос')) {
            showNotification('🚫 Вы уже голосовали в этой категории', 'warning');
            app.user.votedCategories[categoryId] = true;
            renderCategory(categoryId);
            
        } else if (error.message.includes('fingerprint')) {
            showNotification('🚫 Обнаружена попытка накрутки', 'error');
            app.security.blockedUntil = Date.now() + 30 * 60 * 1000; // 30 минут
            
        } else {
            showNotification(`❌ ${error.message || 'Ошибка голосования'}`, 'error');
        }
        
        // Если много неудачных попыток - блокируем
        if (app.security.failedAttempts >= 10) {
            app.security.blockedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
            showNotification('🚫 Вы заблокированы на 24 часа за подозрительную активность', 'error');
        }
    }
};


// 🔄 СБРОС ВСЕХ ГОЛОСОВ - ИСПРАВЛЕННЫЙ
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
    showNotification('🔄 Начинаем сброс голосов... Это может занять несколько секунд.', 'info');
    
    try {
        let result;
        
        if (app.supabase) {
            // Используем Supabase
            result = await app.supabase.resetAllVotes();
            
            // Перезагружаем данные
            await loadDataFromSupabase();
            
        } else {
            // Локальный сброс
            Object.values(app.categories).forEach(category => {
                category.candidates.forEach(candidate => {
                    candidate.votes = 0;
                });
            });
            app.user.votedCategories = {};
            app.user.voteStats.votesThisHour = 0;
            app.security.voteHistory = [];
            
            result = { 
                success: true, 
                message: 'Локальные голосы сброшены',
                details: {
                    candidatesReset: Object.values(app.categories).reduce((sum, cat) => sum + cat.candidates.length, 0),
                    votesDeleted: 'все',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Обновляем интерфейс
        renderAll();
        
        // Показываем результат
        showNotification('✅ Все голосы успешно сброшены!', 'success');
        playSound('success');
        
        // Детали в консоль
        console.log('Сброс голосов выполнен:', result);
        
        // Дополнительное уведомление с деталями
        setTimeout(() => {
            if (result.details) {
                showNotification(`📊 Сброшено: ${result.details.candidatesReset} кандидатов, ${result.details.votesDeleted} голосов`, 'info');
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Критическая ошибка сброса голосов:', error);
        showNotification(`❌ Ошибка: ${error.message}`, 'error');
        
        // Пробуем альтернативный метод
        try {
            if (app.supabase && app.supabase.client.rpc) {
                showNotification('🔄 Пробуем альтернативный метод...', 'info');
                
                const { data, error: rpcError } = await app.supabase.client.rpc('reset_all_votes_safe');
                
                if (rpcError) throw rpcError;
                
                await loadDataFromSupabase();
                renderAll();
                
                showNotification('⚠️ Голосы сброшены альтернативным методом', 'warning');
            }
        } catch (fallbackError) {
            console.error('Альтернативный метод не сработал:', fallbackError);
            showNotification('❌ Не удалось сбросить голоса. Обратитесь к администратору.', 'error');
        }
    }
}

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
            document.getElementById('adminPass').value = '';
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
            } else if (tab === 'security') {
                updateSecurityTab();
            }
        });
    });
    
    // Выбор категории в админке
    document.getElementById('categorySelect').addEventListener('change', updateAdminView);
    
    // Добавление кандидата
    document.getElementById('addCandidateBtn').addEventListener('click', addCandidateHandler);
    
    // Загрузка видео
    document.getElementById('videoFile').addEventListener('change', uploadVideo);
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('videoFile').click();
    });
    
    // Кнопки админки
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('resetBtn').addEventListener('click', resetAllVotes);
    document.getElementById('refreshStatsBtn')?.addEventListener('click', async () => {
        await updateAdminStats();
        showNotification('✅ Статистика обновлена', 'success');
    });
    
    // Безопасность
    document.getElementById('saveSecurityBtn')?.addEventListener('click', saveSecuritySettingsHandler);
    document.getElementById('viewLogsBtn')?.addEventListener('click', showSecurityLogs);
    document.getElementById('closeSecurity')?.addEventListener('click', () => {
        document.getElementById('securityModal').style.display = 'none';
    });
    
    // Модалки
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
    
    document.getElementById('securityModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('securityModal').style.display = 'none';
        }
    });
    
    // Музыка и тема
    document.getElementById('musicBtn').addEventListener('click', toggleMusic);
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
}

// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (сокращены для экономии места)

function updateAdminView() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;
    
    const categoryId = categorySelect.value;
    updateAdminCandidatesList(categoryId);
    updateAdminVideoPreview(categoryId);
    updateAdminStats();
}

async function updateAdminStats() {
    try {
        if (app.supabase) {
            const stats = await app.supabase.getStatistics();
            document.getElementById('adminTotalVotes').textContent = stats.totalVotes;
            document.getElementById('adminUniqueVoters').textContent = stats.uniqueUsers;
            document.getElementById('adminBlockedAttempts').textContent = stats.blockedAttempts || 0;
        }
    } catch (error) {
        console.error('❌ Ошибка обновления статистики:', error);
    }
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

async function saveSecuritySettingsHandler() {
    const enableFingerprint = document.getElementById('enableFingerprint');
    const maxVotesPerHour = document.getElementById('maxVotesPerHour');
    
    if (!enableFingerprint || !maxVotesPerHour) return;
    
    app.settings.security.ENABLE_FINGERPRINT = enableFingerprint.checked;
    app.settings.security.MAX_VOTES_PER_USER_PER_HOUR = parseInt(maxVotesPerHour.value) || 50;
    
    // Обновляем в Supabase
    if (app.supabase && app.supabase.updateSecurityConfig) {
        await app.supabase.updateSecurityConfig(app.settings.security);
    }
    
    // Сохраняем локально
    saveSecuritySettings();
    
    // Обновляем fingerprint если нужно
    if (app.settings.security.ENABLE_FINGERPRINT && app.user.fingerprint === 'no_fp') {
        app.user.fingerprint = await generateFingerprint();
    } else if (!app.settings.security.ENABLE_FINGERPRINT) {
        app.user.fingerprint = 'no_fp';
    }
    
    showNotification('✅ Настройки безопасности сохранены', 'success');
}

async function showSecurityLogs() {
    if (!app.supabase) {
        showNotification('❌ Логи доступны только в режиме Supabase', 'error');
        return;
    }
    
    try {
        const logs = await app.supabase.getSecurityLogs(50);
        const container = document.getElementById('securityLogs');
        
        if (!container) return;
        
        let html = '';
        
        if (logs.length === 0) {
            html = '<div class="empty-state">Логов безопасности пока нет</div>';
        } else {
            logs.forEach(log => {
                const time = new Date(log.created_at).toLocaleTimeString();
                const typeClass = log.event_type.includes('blocked') ? 'log-blocked' : 
                                 log.event_type.includes('success') ? 'log-success' : 'log-info';
                
                html += `
                    <div class="security-log-item ${typeClass}">
                        <div class="log-time">${time}</div>
                        <div class="log-type">${log.event_type}</div>
                        <div class="log-message">${log.message}</div>
                        <div class="log-details">
                            <small>User: ${log.user_id}</small>
                            ${log.fingerprint ? `<small>FP: ${log.fingerprint.substring(0, 8)}...</small>` : ''}
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        document.getElementById('securityModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Ошибка получения логов:', error);
        showNotification('❌ Не удалось загрузить логи', 'error');
    }
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

// ... остальные функции остаются без изменений ...

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
