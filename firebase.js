// 🔥 FIREBASE SERVICE
class FirebaseService {
    constructor() {
        console.log('🔥 Инициализация Firebase Service...');
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        
        // Коллекции
        this.categoriesCollection = this.db.collection('categories');
        this.candidatesCollection = this.db.collection('candidates');
        this.videosCollection = this.db.collection('videos');
        this.votesCollection = this.db.collection('votes');
        
        // Слушатели реального времени
        this.unsubscribers = [];
    }

    // 📁 ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
    async initializeDatabase() {
        try {
            console.log('🔄 Инициализация базы данных...');
            
            // Создаем базовые категории, если их нет
            const defaultCategories = [
                {
                    id: 'slay-king',
                    name: 'SLAY KING 68',
                    icon: 'crown',
                    color: '#ffd700',
                    description: 'Король космических мемов',
                    videoUrl: null,
                    thumbnail: null,
                    order: 1
                },
                {
                    id: 'slay-queen',
                    name: 'SLAY QUEEN 68',
                    icon: 'crown',
                    color: '#ff00ff',
                    description: 'Королева космических мемов',
                    videoUrl: null,
                    thumbnail: null,
                    order: 2
                },
                {
                    id: 'meme-person',
                    name: 'ЧЕЛОВЕК МЕМ-ГОДА',
                    icon: 'laugh-beam',
                    color: '#00ff88',
                    description: 'Создатель лучших мемов года',
                    videoUrl: null,
                    thumbnail: null,
                    order: 3
                },
                {
                    id: 'event-year',
                    name: 'МЕРОПРИЯТИЕ ГОДА',
                    icon: 'calendar-star',
                    color: '#36d1dc',
                    description: 'Самое запоминающееся событие',
                    videoUrl: null,
                    thumbnail: null,
                    order: 4
                },
                {
                    id: 'ship-year',
                    name: 'ПАРА(ШИП) ГОДА',
                    icon: 'heart',
                    color: '#ff6584',
                    description: 'Лучшая пара или шип года',
                    videoUrl: null,
                    thumbnail: null,
                    order: 5
                },
                {
                    id: 'dota-player',
                    name: 'ДОТА ИГРОК ГОДА',
                    icon: 'gamepad',
                    color: '#6c63ff',
                    description: 'Лучший игрок в Dota 2',
                    videoUrl: null,
                    thumbnail: null,
                    order: 6
                }
            ];

            for (const category of defaultCategories) {
                const categoryRef = this.categoriesCollection.doc(category.id);
                const categoryDoc = await categoryRef.get();
                
                if (!categoryDoc.exists) {
                    await categoryRef.set({
                        ...category,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log(`✅ Создана категория: ${category.name}`);
                }
            }
            
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации базы данных:', error);
        }
    }

    // 📂 КАТЕГОРИИ
    async getCategories() {
        try {
            const snapshot = await this.categoriesCollection
                .orderBy('order', 'asc')
                .get();
            
            const categories = {};
            snapshot.forEach(doc => {
                categories[doc.id] = { id: doc.id, ...doc.data() };
            });
            
            return categories;
        } catch (error) {
            console.error('❌ Ошибка получения категорий:', error);
            return {};
        }
    }

    listenToCategories(callback) {
        const unsubscribe = this.categoriesCollection
            .orderBy('order', 'asc')
            .onSnapshot((snapshot) => {
                const categories = {};
                snapshot.forEach(doc => {
                    categories[doc.id] = { id: doc.id, ...doc.data() };
                });
                callback(categories);
            }, (error) => {
                console.error('❌ Ошибка слушателя категорий:', error);
            });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    async updateCategory(categoryId, data) {
        try {
            await this.categoriesCollection.doc(categoryId).update({
                ...data,
                updatedAt: new Date()
            });
            console.log(`✅ Категория ${categoryId} обновлена`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления категории:', error);
            return false;
        }
    }

    // 👤 КАНДИДАТЫ
    async getCandidates(categoryId) {
        try {
            const snapshot = await this.candidatesCollection
                .where('categoryId', '==', categoryId)
                .orderBy('votes', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Ошибка получения кандидатов:', error);
            return [];
        }
    }

    listenToCandidates(categoryId, callback) {
        const unsubscribe = this.candidatesCollection
            .where('categoryId', '==', categoryId)
            .orderBy('votes', 'desc')
            .onSnapshot((snapshot) => {
                const candidates = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(candidates);
            }, (error) => {
                console.error('❌ Ошибка слушателя кандидатов:', error);
            });
        
        this.unsubscribers.push(unsubscribe);
        return unsubscribe;
    }

    async addCandidate(candidateData) {
        try {
            const docRef = await this.candidatesCollection.add({
                ...candidateData,
                votes: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log(`✅ Кандидат добавлен: ${candidateData.name}`);
            return docRef.id;
        } catch (error) {
            console.error('❌ Ошибка добавления кандидата:', error);
            throw error;
        }
    }

    async updateCandidate(candidateId, data) {
        try {
            await this.candidatesCollection.doc(candidateId).update({
                ...data,
                updatedAt: new Date()
            });
            console.log(`✅ Кандидат ${candidateId} обновлен`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления кандидата:', error);
            return false;
        }
    }

    async deleteCandidate(candidateId) {
        try {
            await this.candidatesCollection.doc(candidateId).delete();
            console.log(`🗑️ Кандидат ${candidateId} удален`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления кандидата:', error);
            return false;
        }
    }

    // 🗳️ ГОЛОСОВАНИЕ
    async voteForCandidate(userId, candidateId, categoryId) {
        try {
            // Проверяем, голосовал ли уже пользователь в этой категории
            const voteQuery = await this.votesCollection
                .where('userId', '==', userId)
                .where('categoryId', '==', categoryId)
                .get();
            
            if (!voteQuery.empty) {
                throw new Error('Вы уже голосовали в этой категории');
            }
            
            // Создаем запись о голосовании
            await this.votesCollection.add({
                userId: userId,
                candidateId: candidateId,
                categoryId: categoryId,
                votedAt: new Date(),
                ip: await this.getUserIP()
            });
            
            // Увеличиваем счетчик голосов
            await this.candidatesCollection.doc(candidateId).update({
                votes: firebase.firestore.FieldValue.increment(1)
            });
            
            console.log(`✅ Пользователь ${userId} проголосовал за ${candidateId}`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка голосования:', error);
            throw error;
        }
    }

    async hasUserVoted(userId, categoryId) {
        try {
            const snapshot = await this.votesCollection
                .where('userId', '==', userId)
                .where('categoryId', '==', categoryId)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            console.error('❌ Ошибка проверки голосования:', error);
            return false;
        }
    }

    async getUserVote(userId, categoryId) {
        try {
            const snapshot = await this.votesCollection
                .where('userId', '==', userId)
                .where('categoryId', '==', categoryId)
                .get();
            
            if (!snapshot.empty) {
                return snapshot.docs[0].data().candidateId;
            }
            return null;
        } catch (error) {
            console.error('❌ Ошибка получения голоса:', error);
            return null;
        }
    }

    // 🎬 ВИДЕО
    async uploadVideo(categoryId, videoFile) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(`📤 Загрузка видео для категории ${categoryId}...`);
                
                // Создаем уникальное имя файла
                const timestamp = Date.now();
                const fileName = `videos/${categoryId}/${timestamp}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                
                // Загружаем в Firebase Storage
                const storageRef = this.storage.ref(fileName);
                const uploadTask = storageRef.put(videoFile);
                
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`📊 Прогресс загрузки: ${progress.toFixed(1)}%`);
                        
                        // Можно добавить прогресс бар в UI
                        const progressElement = document.getElementById('uploadProgress');
                        if (progressElement) {
                            progressElement.innerHTML = `Загрузка: ${progress.toFixed(1)}%`;
                            progressElement.style.width = `${progress}%`;
                        }
                    },
                    (error) => {
                        console.error('❌ Ошибка загрузки:', error);
                        reject(error);
                    },
                    async () => {
                        // Загрузка завершена
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            
                            // Получаем тип видео и размер
                            const videoType = videoFile.type || 'video/mp4';
                            const videoSize = videoFile.size;
                            
                            // Создаем миниатюру (для этого примера используем заглушку)
                            const thumbnail = await this.createThumbnail(videoFile);
                            
                            // Обновляем категорию
                            await this.categoriesCollection.doc(categoryId).update({
                                videoUrl: downloadURL,
                                videoType: videoType,
                                videoSize: videoSize,
                                videoFileName: videoFile.name,
                                thumbnail: thumbnail,
                                videoUploadedAt: new Date()
                            });
                            
                            console.log(`✅ Видео загружено: ${downloadURL}`);
                            resolve({
                                url: downloadURL,
                                thumbnail: thumbnail,
                                name: videoFile.name,
                                size: videoSize,
                                type: videoType
                            });
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    async addYouTubeVideo(categoryId, youtubeUrl) {
        try {
            // Извлекаем ID видео из YouTube URL
            const videoId = this.extractYouTubeId(youtubeUrl);
            if (!videoId) {
                throw new Error('Неверная ссылка YouTube');
            }
            
            // Создаем embed URL
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            
            // Обновляем категорию
            await this.categoriesCollection.doc(categoryId).update({
                videoUrl: embedUrl,
                youtubeId: videoId,
                thumbnail: thumbnailUrl,
                isYouTube: true,
                videoUploadedAt: new Date()
            });
            
            console.log(`✅ YouTube видео добавлено: ${videoId}`);
            return {
                url: embedUrl,
                thumbnail: thumbnailUrl,
                isYouTube: true,
                youtubeId: videoId
            };
        } catch (error) {
            console.error('❌ Ошибка добавления YouTube видео:', error);
            throw error;
        }
    }

    async deleteVideo(categoryId) {
        try {
            // Получаем информацию о видео
            const categoryDoc = await this.categoriesCollection.doc(categoryId).get();
            const categoryData = categoryDoc.data();
            
            if (categoryData.isYouTube) {
                // Просто удаляем ссылку для YouTube
                await this.categoriesCollection.doc(categoryId).update({
                    videoUrl: null,
                    thumbnail: null,
                    youtubeId: null,
                    isYouTube: false
                });
            } else if (categoryData.videoUrl) {
                // Для загруженных файлов - удаляем из Storage
                try {
                    const videoRef = this.storage.refFromURL(categoryData.videoUrl);
                    await videoRef.delete();
                } catch (storageError) {
                    console.warn('⚠️ Не удалось удалить файл из Storage:', storageError);
                }
                
                // Очищаем данные в Firestore
                await this.categoriesCollection.doc(categoryId).update({
                    videoUrl: null,
                    thumbnail: null,
                    videoType: null,
                    videoSize: null,
                    videoFileName: null
                });
            }
            
            console.log(`🗑️ Видео удалено из категории ${categoryId}`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления видео:', error);
            return false;
        }
    }

    // 📊 СТАТИСТИКА
    async getStatistics() {
        try {
            // Получаем общее количество голосов
            const candidatesSnapshot = await this.candidatesCollection.get();
            let totalVotes = 0;
            candidatesSnapshot.forEach(doc => {
                totalVotes += doc.data().votes || 0;
            });
            
            // Получаем количество уникальных голосующих
            const votesSnapshot = await this.votesCollection.get();
            const uniqueVoters = new Set();
            votesSnapshot.forEach(doc => {
                uniqueVoters.add(doc.data().userId);
            });
            
            // Получаем количество кандидатов
            const candidatesCount = candidatesSnapshot.size;
            
            return {
                totalVotes,
                uniqueVoters: uniqueVoters.size,
                candidatesCount
            };
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error);
            return {
                totalVotes: 0,
                uniqueVoters: 0,
                candidatesCount: 0
            };
        }
    }

    // 🛠️ УТИЛИТЫ
    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    async createThumbnail(videoFile) {
        return new Promise((resolve) => {
            try {
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
                        resolve(this.getDefaultThumbnail());
                    };
                };
                
                video.onerror = () => {
                    resolve(this.getDefaultThumbnail());
                };
                
                const videoURL = URL.createObjectURL(videoFile);
                video.src = videoURL;
            } catch (error) {
                console.warn('⚠️ Не удалось создать миниатюру:', error);
                resolve(this.getDefaultThumbnail());
            }
        });
    }

    getDefaultThumbnail() {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23222'/%3E%3Ctext x='160' y='90' text-anchor='middle' fill='white' font-family='Arial' font-size='20'%3EВидео%3C/text%3E%3C/svg%3E`;
    }

    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // 🧹 ОЧИСТКА
    cleanup() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}

// Создаем глобальный экземпляр
const firebaseService = new FirebaseService();
