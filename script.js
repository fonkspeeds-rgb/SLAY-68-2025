// 🔧 КОНФИГУРАЦИЯ
const CONFIG = {
    ADMIN_PASSWORD: "Marshlopopo228!",
    STORAGE_KEY: "slay68_voting_data",
    VOTE_COOLDOWN: 3000,
    MAX_VIDEO_SIZE: 100 * 1024 * 1024 // 100MB лимит
};

// 🎮 СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let app = {
    categories: {},
    user: {
        votedCategories: {},
        sessionId: generateId(),
        lastVote: 0
    },
    settings: {
        music: true,
        theme: 'dark',
        volume: 0.3
    },
    currentModalCategory: null,
    currentVideoCategory: null,
    videoDB: null
};

// 📱 ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ
function initMobileOptimizations() {
    // Улучшаем касания
    document.documentElement.style.setProperty('--min-touch', '44px');
    
    // Отключаем масштабирование при двойном тапе
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Предотвращаем зум на инпутах
    document.addEventListener('touchmove', function(event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Улучшаем видео для мобильных
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('x5-playsinline', '');
        video.setAttribute('x5-video-player-type', 'h5');
    });
}

// 🚀 ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Запуск SLAY 68...');
    
    // Добавь эту строку
    initMobileOptimizations();
    
    initData();
    
    try {
        // Инициализируем IndexedDB
        await initVideoDB();
        console.log('✅ IndexedDB готов');
    } catch (error) {
        console.error('❌ Ошибка IndexedDB:', error);
    }
    
    loadFromStorage();
    setupEvents();
    renderAll();
    initParticles();
    restoreSettings();
    
    console.log('✅ Приложение готово!');
});

// 📦 ИНИЦИАЛИЗАЦИЯ INDEXEDDB
async function initVideoDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('Slay68VideosDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            app.videoDB = request.result;
            console.log('✅ IndexedDB подключен');
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Создаем хранилище для видео
            if (!db.objectStoreNames.contains('videos')) {
                const store = db.createObjectStore('videos', { keyPath: 'id' });
                store.createIndex('categoryId', 'categoryId', { unique: false });
                console.log('🆕 Создано хранилище видео');
            }
            
            // Создаем хранилище для миниатюр
            if (!db.objectStoreNames.contains('thumbnails')) {
                const store = db.createObjectStore('thumbnails', { keyPath: 'categoryId' });
                console.log('🆕 Создано хранилище миниатюр');
            }
        };
    });
}

// 💾 ДАННЫЕ
function initData() {
    app.categories = {
        'slay-king': {
            id: 'slay-king',
            name: 'SLAY KING 68 2025',
            icon: 'crown',
            color: '#ffd700',
            videoKey: null,
            thumbnail: null,
            description: 'Король космических мемов 2025',
            candidates: [
                { id: 1, name: 'MEME_LORD', votes: 42, description: 'Повелитель мемов' },
                { id: 2, name: 'КОСМОС', votes: 38, description: 'Покоритель вселенной' },
                { id: 3, name: 'ЗВЕЗДА', votes: 25, description: 'Светило SLAY 68' }
            ],
            votes: {}
        },
        'slay-queen': {
            id: 'slay-queen',
            name: 'SLAY QUEEN 68 2025',
            icon: 'crown',
            color: '#ff00ff',
            videoKey: null,
            thumbnail: null,
            description: 'Королева космических мемов 2025',
            candidates: [
                { id: 4, name: 'КОРОЛЕВА МЕМОВ', votes: 35, description: 'Владычица мемов' },
                { id: 5, name: 'ЛУНА', votes: 28, description: 'Ночная правительница' },
                { id: 6, name: 'КОМЕТА', votes: 19, description: 'Яркая звезда' }
            ],
            votes: {}
        },
        'meme-person': {
            id: 'meme-person',
            name: 'ЧЕЛОВЕК МЕМ-ГОДА 2025',
            icon: 'laugh-beam',
            color: '#00ff88',
            videoKey: null,
            thumbnail: null,
            description: 'Создатель лучших мемов года',
            candidates: [
                { id: 7, name: 'МЕМ-МАСТЕР', votes: 31, description: 'Гений мемов' },
                { id: 8, name: 'ШУТНИК', votes: 24, description: 'Король юмора' }
            ],
            votes: {}
        },
        'event-year': {
            id: 'event-year',
            name: 'МЕРОПРИЯТИЕ ГОДА 2025',
            icon: 'calendar-star',
            color: '#36d1dc',
            videoKey: null,
            thumbnail: null,
            description: 'Самое запоминающееся событие',
            candidates: [
                { id: 9, name: 'КОСМИЧЕСКАЯ ВЕЧЕРИНКА', votes: 45, description: 'Легендарная тусовка' },
                { id: 10, name: 'МЕМ-БАТТЛ', votes: 32, description: 'Битва титанов' }
            ],
            votes: {}
        },
        'ship-year': {
            id: 'ship-year',
            name: 'ПАРА(ШИП) ГОДА 2025',
            icon: 'heart',
            color: '#ff6584',
            videoKey: null,
            thumbnail: null,
            description: 'Лучшая пара или шип года',
            candidates: [
                { id: 11, name: 'КОСМИЧЕСКИЙ ДУЭТ', votes: 29, description: 'Идеальная пара' },
                { id: 12, name: 'ЗВЁЗДНЫЙ ШИП', votes: 21, description: 'Горячий шип' }
            ],
            votes: {}
        },
        'dota-player': {
            id: 'dota-player',
            name: 'ДОТА ИГРОК ГОДА 2025',
            icon: 'gamepad',
            color: '#6c63ff',
            videoKey: null,
            thumbnail: null,
            description: 'Лучший игрок в Dota 2',
            candidates: [
                { id: 13, name: 'PRO_PLAYER', votes: 40, description: 'Профессионал' },
                { id: 14, name: 'КЛАССИК', votes: 27, description: 'Ветеран Dota' }
            ],
            votes: {}
        }
    };
}

// 🎨 РЕНДЕРИНГ
function renderAll() {
    renderStats();
    renderRoyalCategories();
    renderRegularCategories();
    updateAdminView();
    loadAllThumbnails();
}

// 📤 ЗАГРУЗКА МИНИАТЮР
async function loadAllThumbnails() {
    if (!app.videoDB) return;
    
    const categories = Object.values(app.categories);
    
    for (const category of categories) {
        if (category.videoKey) {
            try {
                const thumbnail = await getThumbnailFromDB(category.id);
                if (thumbnail) {
                    category.thumbnail = thumbnail;
                    renderVideoForCategory(category.id);
                }
            } catch (error) {
                console.error(`Ошибка загрузки миниатюры для ${category.id}:`, error);
            }
        }
    }
}

// 🎬 СОХРАНЕНИЕ ВИДЕО В INDEXEDDB
async function saveVideoToDB(categoryId, videoFile, thumbnail) {
    return new Promise((resolve, reject) => {
        if (!app.videoDB) {
            reject(new Error('IndexedDB не инициализирован'));
            return;
        }
        
        const transaction = app.videoDB.transaction(['videos', 'thumbnails'], 'readwrite');
        
        const videoKey = `video_${categoryId}_${Date.now()}`;
        
        const videoStore = transaction.objectStore('videos');
        const videoData = {
            id: videoKey,
            categoryId: categoryId,
            videoBlob: videoFile,
            timestamp: Date.now(),
            name: videoFile.name,
            size: videoFile.size,
            type: videoFile.type
        };
        
        const videoRequest = videoStore.put(videoData);
        
        const thumbStore = transaction.objectStore('thumbnails');
        const thumbData = {
            categoryId: categoryId,
            thumbnail: thumbnail,
            timestamp: Date.now()
        };
        
        const thumbRequest = thumbStore.put(thumbData);
        
        videoRequest.onsuccess = () => {
            console.log(`✅ Видео сохранено в IndexedDB: ${videoKey}`);
            resolve(videoKey);
        };
        
        videoRequest.onerror = () => reject(videoRequest.error);
        
        thumbRequest.onerror = () => {
            console.error('Ошибка сохранения миниатюры:', thumbRequest.error);
        };
    });
}

// 📥 ПОЛУЧЕНИЕ ВИДЕО ИЗ INDEXEDDB
async function getVideoFromDB(videoKey) {
    return new Promise((resolve, reject) => {
        if (!app.videoDB) {
            reject(new Error('IndexedDB не инициализирован'));
            return;
        }
        
        const transaction = app.videoDB.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const request = store.get(videoKey);
        
        request.onsuccess = () => {
            if (request.result) {
                const videoBlob = request.result.videoBlob;
                const videoUrl = URL.createObjectURL(videoBlob);
                resolve(videoUrl);
            } else {
                reject(new Error('Видео не найдено'));
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

// 🖼️ ПОЛУЧЕНИЕ МИНИАТЮРЫ ИЗ INDEXEDDB
async function getThumbnailFromDB(categoryId) {
    return new Promise((resolve, reject) => {
        if (!app.videoDB) {
            resolve(null);
            return;
        }
        
        const transaction = app.videoDB.transaction(['thumbnails'], 'readonly');
        const store = transaction.objectStore('thumbnails');
        const request = store.get(categoryId);
        
        request.onsuccess = () => {
            resolve(request.result ? request.result.thumbnail : null);
        };
        
        request.onerror = () => {
            console.error('Ошибка получения миниатюры:', request.error);
            resolve(null);
        };
    });
}

// 🗑️ УДАЛЕНИЕ ВИДЕО ИЗ INDEXEDDB
async function deleteVideoFromDB(categoryId, videoKey) {
    return new Promise((resolve, reject) => {
        if (!app.videoDB) {
            reject(new Error('IndexedDB не инициализирован'));
            return;
        }
        
        const transaction = app.videoDB.transaction(['videos', 'thumbnails'], 'readwrite');
        
        const videoStore = transaction.objectStore('videos');
        const videoRequest = videoStore.delete(videoKey);
        
        const thumbStore = transaction.objectStore('thumbnails');
        const thumbRequest = thumbStore.delete(categoryId);
        
        videoRequest.onsuccess = () => {
            console.log(`🗑️ Видео удалено из IndexedDB: ${videoKey}`);
            resolve();
        };
        
        videoRequest.onerror = () => reject(videoRequest.error);
    });
}

// 🎬 ЗАГРУЗКА ВИДЕО
window.uploadVideo = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > CONFIG.MAX_VIDEO_SIZE) {
        showNotification(`Файл слишком большой (${(file.size/1024/1024).toFixed(1)}MB). Максимум: 100MB`, 'error');
        return;
    }
    
    if (!file.type.startsWith('video/')) {
        showNotification('Выберите видео файл', 'error');
        return;
    }
    
    const categoryId = document.getElementById('categorySelect').value;
    
    try {
        const thumbnail = await createThumbnail(file);
        const videoKey = await saveVideoToDB(categoryId, file, thumbnail);
        
        const category = app.categories[categoryId];
        category.videoKey = videoKey;
        category.thumbnail = thumbnail;
        
        updateAdminVideoPreview(categoryId);
        renderVideoForCategory(categoryId);
        saveToStorage();
        
        showNotification('✅ Видео загружено и сохранено!', 'success');
        playSound('success');
        
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        showNotification('❌ Ошибка загрузки видео', 'error');
    }
};

// 🖼️ СОЗДАНИЕ МИНИАТЮРЫ
function createThumbnail(videoFile) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            video.currentTime = 1;
            
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 180;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                resolve(thumbnail);
            };
            
            video.onerror = () => {
                const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23222'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EВидео%3C/text%3E%3C/svg%3E`;
                resolve(placeholder);
            };
        };
        
        video.onerror = () => {
            reject(new Error('Не удалось загрузить видео для миниатюры'));
        };
        
        const videoURL = URL.createObjectURL(videoFile);
        video.src = videoURL;
    });
}

// 🎬 РЕНДЕРИНГ ВИДЕО ДЛЯ КАТЕГОРИИ
function renderVideoForCategory(categoryId) {
    const category = app.categories[categoryId];
    
    const royalVideoContainer = document.getElementById(`video-${categoryId}`);
    if (royalVideoContainer) {
        if (category.thumbnail) {
            royalVideoContainer.innerHTML = `
                <div class="video-thumbnail-large" onclick="playVideo('${categoryId}')">
                    <img src="${category.thumbnail}" alt="Превью видео" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="video-play-btn-large">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="royal-video-overlay">
                        <i class="fas fa-video"></i>
                        <span>Смотреть видео</span>
                    </div>
                </div>
            `;
        } else {
            royalVideoContainer.innerHTML = `
                <div class="video-placeholder-large" onclick="playVideo('${categoryId}')">
                    <i class="fas fa-video-slash"></i>
                    <p>Видео не загружено</p>
                    <small>Админ может загрузить видео</small>
                </div>
            `;
        }
    }
    
    const regularVideoContainer = document.getElementById(`video-small-${categoryId}`);
    if (regularVideoContainer) {
        if (category.thumbnail) {
            regularVideoContainer.innerHTML = `
                <div class="video-thumbnail-small" onclick="playVideo('${categoryId}')">
                    <img src="${category.thumbnail}" alt="Превью видео" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="video-play-btn-small">
                        <i class="fas fa-play"></i>
                    </div>
                    <div class="video-overlay-small">
                        <i class="fas fa-video"></i>
                        <span>Смотреть видео</span>
                    </div>
                </div>
            `;
        } else {
            regularVideoContainer.innerHTML = `
                <div class="video-placeholder-small" onclick="playVideo('${categoryId}')">
                    <i class="fas fa-video-slash"></i>
                    <p>Видео не загружено</p>
                </div>
            `;
        }
    }
}

// 🎬 ВОСПРОИЗВЕДЕНИЕ ВИДЕО (ИСПРАВЛЕННАЯ ФУНКЦИЯ)
window.playVideo = async function(categoryId) {
    const category = app.categories[categoryId];
    
    if (!category.videoKey) {
        showNotification('Видео не загружено для этой категории', 'warning');
        return;
    }
    
    try {
        const videoUrl = await getVideoFromDB(category.videoKey);
        
        app.currentVideoCategory = categoryId;
        
        const modal = document.getElementById('videoModal');
        const modalContent = document.getElementById('videoModalContent');
        
        // НОВОЕ СОДЕРЖИМОЕ МОДАЛКИ (ОПТИМИЗИРОВАНО ДЛЯ МОБИЛЬНЫХ)
        modalContent.innerHTML = `
            <div style="position: relative; max-height: 80vh; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <div class="sound-warning" style="
                    background: rgba(255, 100, 100, 0.95);
                    color: white;
                    padding: 12px;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    border-radius: 10px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                ">
                    <i class="fas fa-volume-mute" style="font-size: 20px; flex-shrink: 0;"></i>
                    <div style="flex: 1;">
                        <strong style="display: block; margin-bottom: 3px;">ЗВУК ОТКЛЮЧЕН</strong>
                        <small style="opacity: 0.9; font-size: 12px;">Нажмите кнопку ниже</small>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 15px;">
                    <button id="enableSoundBtn" style="
                        background: linear-gradient(45deg, #00ff88, #00ffff);
                        color: black;
                        border: none;
                        padding: 15px 20px;
                        border-radius: 25px;
                        font-weight: bold;
                        font-size: 16px;
                        cursor: pointer;
                        width: 100%;
                        max-width: 300px;
                        min-height: 50px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
                    ">
                        <i class="fas fa-volume-up"></i>
                        ВКЛЮЧИТЬ ЗВУК
                    </button>
                </div>
                
                <video id="modalVideo" style="
                    width: 100%; 
                    border-radius: 10px;
                    background: #000;
                    display: none;
                    max-height: 50vh;
                    object-fit: contain;
                " controls playsinline webkit-playsinline></video>
                
                <div id="videoInfo" style="
                    margin-top: 15px;
                    padding: 15px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                    border-left: 4px solid ${category.color};
                ">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                        <div style="
                            width: 40px; 
                            height: 40px; 
                            background: ${category.color}; 
                            border-radius: 10px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            flex-shrink: 0;
                        ">
                            <i class="fas fa-${category.icon}" style="color: white; font-size: 1.2rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="color: ${category.color}; margin: 0; font-size: 1.1rem;">${category.name}</h3>
                            <p style="color: rgba(255,255,255,0.7); margin: 0.25rem 0 0; font-size: 0.9rem;">${category.description}</p>
                        </div>
                    </div>
                    
                    <div style="
                        margin-top: 10px; 
                        padding: 10px; 
                        background: rgba(0,0,0,0.2); 
                        border-radius: 8px;
                        border: 1px solid rgba(0,255,255,0.2);
                    ">
                        <div style="display: flex; align-items: flex-start; gap: 8px; color: #00ffff; font-size: 13px;">
                            <i class="fas fa-mobile-alt" style="margin-top: 2px;"></i>
                            <div>
                                <strong>На телефоне:</strong>
                                <div style="opacity: 0.9; margin-top: 3px;">
                                    1. Нажмите кнопку "Включить звук"<br>
                                    2. Поверните телефон для полноэкранного режима<br>
                                    3. Регулируйте громкость кнопками на корпусе
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Получаем элементы после создания
        const video = document.getElementById('modalVideo');
        const enableSoundBtn = document.getElementById('enableSoundBtn');
        
        video.src = videoUrl;
        video.muted = false;
        video.controls = true;
        
        // Кнопка включения звука
        enableSoundBtn.onclick = function() {
            // Показываем видео
            video.style.display = 'block';
            enableSoundBtn.style.display = 'none';
            document.querySelector('.sound-warning').style.display = 'none';
            
            // Включаем звук
            video.muted = false;
            video.volume = 0.7;
            
            // Запускаем видео
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    showNotification('✅ Звук включен!', 'success');
                }).catch(error => {
                    console.log('Ошибка воспроизведения:', error);
                    showNotification('Нажмите на видео для ручного запуска', 'warning');
                });
            }
        };
        
        // Обработчик конца видео
        video.addEventListener('ended', () => {
            showNotification(`Видео "${category.name}" завершено`, 'info');
        });
        
        // Очищаем URL при закрытии
        const closeBtn = document.getElementById('closeVideo');
        const originalClick = closeBtn.onclick;
        closeBtn.onclick = function() {
            if (videoUrl.startsWith('blob:')) {
                URL.revokeObjectURL(videoUrl);
            }
            video.pause();
            video.src = '';
            modal.style.display = 'none';
            app.currentVideoCategory = null;
            closeBtn.onclick = originalClick;
        };
        
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        showNotification('❌ Ошибка загрузки видео', 'error');
    }
};

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    
    if (video) {
        video.pause();
        video.src = '';
        video.style.display = 'none';
    }
    
    modal.style.display = 'none';
    app.currentVideoCategory = null;
}

// 🗑️ УДАЛЕНИЕ ВИДЕО
window.deleteVideo = async function(categoryId) {
    if (!confirm('Удалить видео из этой категории?')) return;
    
    const category = app.categories[categoryId];
    
    if (category.videoKey) {
        try {
            await deleteVideoFromDB(categoryId, category.videoKey);
        } catch (error) {
            console.error('Ошибка удаления видео:', error);
        }
    }
    
    category.videoKey = null;
    category.thumbnail = null;
    
    updateAdminVideoPreview(categoryId);
    renderVideoForCategory(categoryId);
    saveToStorage();
    
    showNotification('Видео удалено', 'warning');
};

// 📊 ОБНОВЛЕНИЕ ПРЕВЬЮ В АДМИНКЕ
function updateAdminVideoPreview(categoryId) {
    const category = app.categories[categoryId];
    const container = document.getElementById('videoPreview');
    
    if (!container) return;
    
    if (category.thumbnail) {
        container.innerHTML = `
            <div style="background: rgba(0,255,255,0.1); border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-check-circle" style="color: #00ff88; font-size: 1.2rem;"></i>
                        <span style="font-weight: 600;">Видео загружено</span>
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
                    <img src="${category.thumbnail}" alt="Превью" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; background: rgba(0,0,0,0.6); padding: 4px 8px; 
                         border-radius: 4px; color: white; font-size: 0.8rem;">
                        <i class="fas fa-video"></i> Превью
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
            </div>
        `;
    }
}

// 📦 СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ
function saveToStorage() {
    try {
        const data = {
            categories: {},
            user: app.user
        };
        
        Object.keys(app.categories).forEach(categoryId => {
            const category = app.categories[categoryId];
            data.categories[categoryId] = {
                ...category,
                videoKey: category.videoKey,
                thumbnail: category.thumbnail,
                video: undefined
            };
        });
        
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        console.log('💾 Данные сохранены');
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
    }
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY));
        
        if (data) {
            Object.keys(data.categories || {}).forEach(categoryId => {
                if (app.categories[categoryId]) {
                    app.categories[categoryId].candidates = data.categories[categoryId].candidates || [];
                    app.categories[categoryId].votes = data.categories[categoryId].votes || {};
                    app.categories[categoryId].videoKey = data.categories[categoryId].videoKey || null;
                    app.categories[categoryId].thumbnail = data.categories[categoryId].thumbnail || null;
                }
            });
            
            app.user.votedCategories = data.user?.votedCategories || {};
            console.log('📂 Данные загружены');
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
    }
}

// 🎮 СОБЫТИЯ
function setupEvents() {
    // Админ панель
    document.getElementById('adminBtn').addEventListener('click', () => {
        document.getElementById('adminOverlay').style.display = 'flex';
        document.getElementById('adminPass').value = '';
    });
    
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminOverlay').style.display = 'none';
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('controlSection').style.display = 'none';
        document.getElementById('adminPass').value = '';
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
    
    document.getElementById('adminPass').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginBtn').click();
        }
    });
    
    // Загрузка видео
    document.getElementById('videoFile').addEventListener('change', uploadVideo);
    
    // Табы админки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
        });
    });
    
    // Выбор категории в админке
    document.getElementById('categorySelect').addEventListener('change', updateAdminView);
    
    // Добавление кандидата
    document.getElementById('addCandidateBtn').addEventListener('click', function() {
        const categoryId = document.getElementById('categorySelect').value;
        const nameInput = document.getElementById('candidateName');
        const descInput = document.getElementById('candidateDesc');
        
        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        
        if (!name) {
            showNotification('Введите имя кандидата', 'warning');
            return;
        }
        
        const category = app.categories[categoryId];
        const newId = Math.max(...category.candidates.map(c => c.id), 0) + 1;
        
        category.candidates.push({
            id: newId,
            name: name,
            description: description || '',
            votes: 0
        });
        
        nameInput.value = '';
        descInput.value = '';
        
        saveToStorage();
        updateAdminView();
        renderAll();
        
        showNotification(`✅ Кандидат "${name}" добавлен`, 'success');
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
    
    document.getElementById('adminOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('adminOverlay').style.display = 'none';
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('controlSection').style.display = 'none';
            document.getElementById('adminPass').value = '';
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
    saveSettings();
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
    
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('slay68_settings', JSON.stringify(app.settings));
}

function restoreSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('slay68_settings'));
        if (saved) {
            app.settings = { ...app.settings, ...saved };
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
    } catch (e) {
        console.log('Настройки не восстановлены:', e);
    }
}

// 📊 ЭКСПОРТ ДАННЫХ
function exportData() {
    const data = {
        exportDate: new Date().toISOString(),
        categories: app.categories,
        totalVotes: Object.values(app.categories).reduce((sum, cat) => 
            sum + cat.candidates.reduce((s, c) => s + c.votes, 0), 0),
        totalCandidates: Object.values(app.categories).reduce((sum, cat) => 
            sum + cat.candidates.length, 0)
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
}

function resetAllVotes() {
    Object.values(app.categories).forEach(category => {
        category.candidates.forEach(candidate => {
            candidate.votes = 0;
        });
        category.votes = {};
    });
    
    app.user.votedCategories = {};
    
    saveToStorage();
    renderAll();
    updateAdminView();
    
    showNotification('✅ Все голосы сброшены', 'success');
}

// 🎉 ЭФФЕКТЫ
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

// 🔧 УТИЛИТЫ
function generateId() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => 
        Math.floor(Math.random() * 16).toString(16));
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

// 🎨 РЕНДЕРИНГ КОРОЛЕВСКИХ КАТЕГОРИЙ
function renderRoyalCategories() {
    renderRoyalCategory('slay-king', 'kingContent');
    renderRoyalCategory('slay-queen', 'queenContent');
    updateRoyalTotals();
}

function renderRoyalCategory(categoryId, elementId) {
    const category = app.categories[categoryId];
    const container = document.getElementById(elementId);
    if (!container) return;
    
    let html = '';
    const candidates = category.candidates.sort((a, b) => b.votes - a.votes);
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    
    if (candidates.length === 0) {
        html = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        candidates.forEach((candidate, index) => {
            const hasVoted = app.user.votedCategories[categoryId] === candidate.id;
            const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
            
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
                    <div class="candidate-votes">${candidate.votes}</div>
                    <button class="vote-btn-royal ${hasVoted ? 'voted' : ''}" 
                            onclick="voteForCandidate('${categoryId}', ${candidate.id})"
                            ${hasVoted ? 'disabled' : ''}>
                        ${hasVoted ? '<i class="fas fa-check"></i> ГОЛОС ПОДТВЕРЖДЕН' : '<i class="fas fa-vote-yea"></i> ГОЛОСОВАТЬ'}
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

function updateRoyalTotals() {
    const kingTotal = document.getElementById('kingTotal');
    const queenTotal = document.getElementById('queenTotal');
    
    if (kingTotal) {
        const kingVotes = app.categories['slay-king'].candidates.reduce((sum, c) => sum + c.votes, 0);
        kingTotal.textContent = `${kingVotes} голосов`;
    }
    
    if (queenTotal) {
        const queenVotes = app.categories['slay-queen'].candidates.reduce((sum, c) => sum + c.votes, 0);
        queenTotal.textContent = `${queenVotes} голосов`;
    }
}

// 🗳️ ГОЛОСОВАНИЕ
window.voteForCandidate = function(categoryId, candidateId) {
    const now = Date.now();
    if (now - app.user.lastVote < CONFIG.VOTE_COOLDOWN) {
        showNotification('Подождите перед следующим голосом', 'warning');
        return;
    }
    
    if (app.user.votedCategories[categoryId]) {
        showNotification('Вы уже голосовали в этой категории', 'warning');
        return;
    }
    
    const category = app.categories[categoryId];
    const candidate = category.candidates.find(c => c.id === candidateId);
    
    if (!candidate) {
        showNotification('Ошибка: кандидат не найден', 'error');
        return;
    }
    
    candidate.votes++;
    app.user.votedCategories[categoryId] = candidateId;
    category.votes[app.user.sessionId] = candidateId;
    app.user.lastVote = now;
    
    saveToStorage();
    renderAll();
    
    showNotification(`✅ Вы проголосовали за ${candidate.name}!`, 'success');
};

window.voteInCategory = function(categoryId) {
    showAllCandidates(categoryId);
};

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
    const candidates = category.candidates.sort((a, b) => b.votes - a.votes);
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    
    if (candidates.length === 0) {
        html = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        candidates.forEach(candidate => {
            const hasVoted = app.user.votedCategories[categoryId] === candidate.id;
            const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
            
            html += `
                <div class="modal-candidate">
                    <div class="modal-candidate-avatar">${candidate.id}</div>
                    <div class="modal-candidate-info">
                        <div class="modal-candidate-name">${candidate.name}</div>
                        <div class="modal-candidate-desc">${candidate.description || ''}</div>
                        <div class="modal-progress-container">
                            <div class="modal-progress-bar">
                                <div class="modal-progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="modal-progress-text">
                                <span>${candidate.votes} голосов</span>
                                <span>${percentage}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-candidate-stats">
                        <button class="modal-vote-btn ${hasVoted ? 'voted' : ''}" 
                                onclick="voteForCandidate('${categoryId}', ${candidate.id})"
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

// 🏆 РЕНДЕРИНГ ОБЫЧНЫХ КАТЕГОРИЙ
function renderRegularCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    const regularCategories = Object.values(app.categories)
        .filter(cat => !['slay-king', 'slay-queen'].includes(cat.id));
    
    let html = '';
    
    regularCategories.forEach(category => {
        const candidates = category.candidates.sort((a, b) => b.votes - a.votes).slice(0, 3);
        
        html += `
            <div class="category-card animate-fadeIn">
                <div class="category-icon">
                    <i class="fas fa-${category.icon}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                
                <div class="category-video-small" id="video-small-${category.id}">
                    <!-- Загрузится через renderVideoForCategory -->
                </div>
                
                <div class="category-stats">
                    <div class="category-stat">
                        <i class="fas fa-users"></i>
                        <span>${category.candidates.length} кандидатов</span>
                    </div>
                    <div class="category-stat">
                        <i class="fas fa-vote-yea"></i>
                        <span>${category.candidates.reduce((sum, c) => sum + c.votes, 0)} голосов</span>
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
                        <div class="candidate-rank">${index + 1}</div>
                        <div class="candidate-name-small">${candidate.name}</div>
                        <div class="candidate-votes-small">${candidate.votes}</div>
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

// 📊 РЕНДЕРИНГ СТАТИСТИКИ
function renderStats() {
    let totalVotes = 0;
    let totalCandidates = 0;
    let totalVoters = new Set();
    
    Object.values(app.categories).forEach(category => {
        category.candidates.forEach(candidate => {
            totalVotes += candidate.votes;
        });
        totalCandidates += category.candidates.length;
        
        Object.keys(category.votes).forEach(voterId => {
            totalVoters.add(voterId);
        });
    });
    
    document.getElementById('liveVotes').textContent = totalVotes;
    document.getElementById('liveCandidates').textContent = totalCandidates;
    document.getElementById('liveVoters').textContent = totalVoters.size;
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
    
    if (!container) return;
    
    let html = '';
    
    if (category.candidates.length === 0) {
        html = `<div class="empty-state" style="padding: 2rem;"><i class="fas fa-user-plus"></i><p>Кандидатов пока нет</p></div>`;
    } else {
        category.candidates.forEach(candidate => {
            html += `
                <div class="admin-candidate-item">
                    <div class="candidate-info-admin">
                        <div class="candidate-name-admin">${candidate.name}</div>
                        ${candidate.description ? `<div class="candidate-desc-admin">${candidate.description}</div>` : ''}
                    </div>
                    <div class="candidate-votes-admin">${candidate.votes}</div>
                    <button class="btn-remove" onclick="removeCandidate('${categoryId}', ${candidate.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

window.removeCandidate = function(categoryId, candidateId) {
    if (!confirm('Удалить этого кандидата?')) return;
    
    const category = app.categories[categoryId];
    const index = category.candidates.findIndex(c => c.id === candidateId);
    
    if (index !== -1) {
        category.candidates.splice(index, 1);
        saveToStorage();
        updateAdminView();
        renderAll();
        showNotification('Кандидат удален', 'warning');
    }
};

function updateAdminStats() {
    let totalVotes = 0;
    let totalVoters = new Set();
    
    Object.values(app.categories).forEach(category => {
        category.candidates.forEach(candidate => {
            totalVotes += candidate.votes;
        });
        
        Object.keys(category.votes).forEach(voterId => {
            totalVoters.add(voterId);
        });
    });
    
    document.getElementById('adminTotalVotes').textContent = totalVotes;
    document.getElementById('adminUniqueVoters').textContent = totalVoters.size;
}
