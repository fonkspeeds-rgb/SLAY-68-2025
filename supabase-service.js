// 🔥 SUPABASE SERVICE - УПРОЩЕННАЯ РАБОЧАЯ ВЕРСИЯ
class SupabaseService {
    constructor() {
        console.log('🚀 Создаем Supabase Service...');
        this.client = window.supabaseClient;
        if (!this.client) {
            console.error('❌ Supabase client не найден!');
            throw new Error('Supabase не инициализирован');
        }
        console.log('✅ Supabase client создан');
    }

    // 📦 ПРОВЕРКА ПОДКЛЮЧЕНИЯ
    async checkConnection() {
        try {
            const { data, error } = await this.client.from('categories').select('id').limit(1);
            if (error) {
                console.warn('⚠️ Предупреждение при проверке:', error.message);
                return false;
            }
            console.log('✅ Подключение к Supabase успешно');
            return true;
        } catch (error) {
            console.error('❌ Ошибка подключения:', error);
            return false;
        }
    }

    // 📂 ПОЛУЧЕНИЕ ВСЕХ КАТЕГОРИЙ
    async getCategories() {
        try {
            console.log('📥 Загрузка категорий...');
            
            const { data, error } = await this.client
                .from('categories')
                .select('*')
                .order('order_num');
            
            if (error) {
                console.error('❌ Ошибка загрузки категорий:', error);
                // Возвращаем пустой объект, но не падаем
                return {};
            }
            
            // Преобразуем массив в объект
            const categories = {};
            data.forEach(category => {
                categories[category.id] = {
                    id: category.id,
                    name: category.name,
                    icon: category.icon || 'crown',
                    color: category.color || '#8a2be2',
                    description: category.description || '',
                    videoUrl: category.video_url || null,
                    thumbnail: category.thumbnail || null,
                    isYouTube: category.is_youtube || false,
                    candidates: [] // Кандидаты загрузим отдельно
                };
            });
            
            console.log(`✅ Загружено ${Object.keys(categories).length} категорий`);
            return categories;
            
        } catch (error) {
            console.error('❌ Неожиданная ошибка в getCategories:', error);
            return {};
        }
    }

    // 👤 ПОЛУЧЕНИЕ КАНДИДАТОВ ДЛЯ КАТЕГОРИИ
    async getCandidates(categoryId) {
        try {
            const { data, error } = await this.client
                .from('candidates')
                .select('*')
                .eq('category_id', categoryId)
                .order('votes', { ascending: false });
            
            if (error) {
                console.error(`❌ Ошибка загрузки кандидатов для ${categoryId}:`, error);
                return [];
            }
            
            // Преобразуем формат
            const candidates = data.map(candidate => ({
                id: candidate.id,
                name: candidate.name,
                description: candidate.description || '',
                votes: candidate.votes || 0,
                categoryId: candidate.category_id
            }));
            
            console.log(`✅ Загружено ${candidates.length} кандидатов для ${categoryId}`);
            return candidates;
            
        } catch (error) {
            console.error(`❌ Ошибка в getCandidates:`, error);
            return [];
        }
    }

    // ➕ ДОБАВЛЕНИЕ КАНДИДАТА
    async addCandidate(candidateData) {
        try {
            console.log('➕ Добавляем кандидата:', candidateData.name);
            
            const { data, error } = await this.client
                .from('candidates')
                .insert({
                    name: candidateData.name,
                    description: candidateData.description || '',
                    category_id: candidateData.categoryId,
                    votes: 0
                })
                .select()
                .single();
            
            if (error) {
                console.error('❌ Ошибка Supabase:', error);
                throw new Error(`Не удалось добавить: ${error.message}`);
            }
            
            console.log('✅ Кандидат добавлен, ID:', data.id);
            return data.id;
            
        } catch (error) {
            console.error('❌ Общая ошибка:', error);
            throw error;
        }
    }

    // 🗑️ УДАЛЕНИЕ КАНДИДАТА
    async deleteCandidate(candidateId) {
        try {
            const { error } = await this.client
                .from('candidates')
                .delete()
                .eq('id', candidateId);
            
            if (error) throw error;
            
            console.log(`🗑️ Кандидат ${candidateId} удален`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления:', error);
            return false;
        }
    }

    // 🗳️ ГОЛОСОВАНИЕ
    async voteForCandidate(userId, candidateId, categoryId) {
        try {
            // 1. Проверяем, голосовал ли уже
            const { data: existingVote, error: checkError } = await this.client
                .from('votes')
                .select('id')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .single();
            
            if (existingVote) {
                throw new Error('Вы уже голосовали в этой категории');
            }
            
            // 2. Записываем голос
            const { error: voteError } = await this.client
                .from('votes')
                .insert({
                    user_id: userId,
                    candidate_id: candidateId,
                    category_id: categoryId
                });
            
            if (voteError) throw voteError;
            
            // 3. Увеличиваем счетчик голосов у кандидата
            // Сначала получаем текущее количество
            const { data: candidate, error: getError } = await this.client
                .from('candidates')
                .select('votes')
                .eq('id', candidateId)
                .single();
            
            if (getError) throw getError;
            
            const newVotes = (candidate.votes || 0) + 1;
            
            const { error: updateError } = await this.client
                .from('candidates')
                .update({ votes: newVotes })
                .eq('id', candidateId);
            
            if (updateError) throw updateError;
            
            console.log(`✅ Голос записан: ${userId} → ${candidateId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка голосования:', error);
            
            // Проверяем специфические ошибки
            if (error.message.includes('already voted')) {
                throw new Error('Вы уже голосовали в этой категории');
            }
            
            throw new Error('Ошибка при голосовании: ' + error.message);
        }
    }

    // ❓ ПРОВЕРКА ГОЛОСОВАЛ ЛИ ПОЛЬЗОВАТЕЛЬ
    async hasUserVoted(userId, categoryId) {
        try {
            const { data, error } = await this.client
                .from('votes')
                .select('id')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .single();
            
            // Если нет ошибки и есть данные - голосовал
            return !error && !!data;
        } catch (error) {
            console.error('❌ Ошибка проверки голосования:', error);
            return false;
        }
    }

    // 🎬 ДОБАВЛЕНИЕ YOUTUBE ВИДЕО
    async addYouTubeVideo(categoryId, youtubeUrl) {
        try {
            console.log(`🎬 Обрабатываем YouTube ссылку: ${youtubeUrl}`);
            
            // Простая проверка URL
            if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
                throw new Error('Неверная ссылка YouTube');
            }
            
            // Извлекаем ID видео
            let videoId = '';
            if (youtubeUrl.includes('youtu.be/')) {
                videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
            } else if (youtubeUrl.includes('v=')) {
                videoId = youtubeUrl.split('v=')[1].split('&')[0];
            }
            
            if (!videoId || videoId.length !== 11) {
                throw new Error('Не удалось извлечь ID видео');
            }
            
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            
            // Обновляем категорию
            const { error } = await this.client
                .from('categories')
                .update({
                    video_url: embedUrl,
                    youtube_id: videoId,
                    thumbnail: thumbnailUrl,
                    is_youtube: true
                })
                .eq('id', categoryId);
            
            if (error) throw error;
            
            console.log(`✅ YouTube видео добавлено: ${videoId}`);
            return {
                url: embedUrl,
                thumbnail: thumbnailUrl,
                isYouTube: true,
                youtubeId: videoId
            };
            
        } catch (error) {
            console.error('❌ Ошибка добавления YouTube:', error);
            throw error;
        }
    }

    // 📤 ЗАГРУЗКА ВИДЕО ФАЙЛА
    async uploadVideoFile(categoryId, videoFile) {
        try {
            console.log(`📤 Начинаем загрузку видео: ${videoFile.name}`);
            
            // Проверяем размер
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (videoFile.size > maxSize) {
                throw new Error(`Файл слишком большой (${(videoFile.size/1024/1024).toFixed(1)}MB). Максимум: 100MB`);
            }
            
            // Создаем уникальное имя
            const fileName = `${categoryId}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
            // Загружаем в Storage
            console.log('🔄 Загрузка в Supabase Storage...');
            const { data, error } = await this.client.storage
                .from('videos')
                .upload(fileName, videoFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error('❌ Ошибка загрузки в Storage:', error);
                throw new Error(`Ошибка загрузки: ${error.message}`);
            }
            
            // Получаем публичный URL
            const { data: { publicUrl } } = this.client.storage
                .from('videos')
                .getPublicUrl(fileName);
            
            console.log('✅ Видео загружено, публичный URL:', publicUrl);
            
            // Обновляем запись категории
            const { error: updateError } = await this.client
                .from('categories')
                .update({
                    video_url: publicUrl,
                    is_youtube: false,
                    youtube_id: null
                })
                .eq('id', categoryId);
            
            if (updateError) {
                console.error('❌ Ошибка обновления категории:', updateError);
                // Не бросаем ошибку - видео уже загружено
            }
            
            return {
                url: publicUrl,
                fileName: fileName,
                size: videoFile.size,
                type: videoFile.type
            };
            
        } catch (error) {
            console.error('❌ Ошибка uploadVideoFile:', error);
            throw error;
        }
    }

    // 📊 ПОЛУЧЕНИЕ СТАТИСТИКИ
    async getStatistics() {
        try {
            // Общее количество голосов
            const { data: candidates, error: candidatesError } = await this.client
                .from('candidates')
                .select('votes');
            
            if (candidatesError) throw candidatesError;
            
            const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
            
            // Уникальные голосующие
            const { data: votes, error: votesError } = await this.client
                .from('votes')
                .select('user_id');
            
            if (votesError) throw votesError;
            
            const uniqueVoters = new Set(votes.map(v => v.user_id)).size;
            
            // Количество кандидатов
            const { count: candidatesCount, error: countError } = await this.client
                .from('candidates')
                .select('*', { count: 'exact', head: true });
            
            if (countError) throw countError;
            
            return {
                totalVotes,
                uniqueVoters,
                candidatesCount: candidatesCount || 0
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

    // 🗑️ УДАЛЕНИЕ ВИДЕО
    async deleteVideo(categoryId) {
        try {
            const { error } = await this.client
                .from('categories')
                .update({
                    video_url: null,
                    youtube_id: null,
                    thumbnail: null,
                    is_youtube: false
                })
                .eq('id', categoryId);
            
            if (error) throw error;
            
            console.log(`✅ Видео удалено из категории ${categoryId}`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления видео:', error);
            return false;
        }
    }
// 🔄 СБРОС ВСЕХ ГОЛОСОВ (админ)
async resetAllVotes() {
    try {
        // 1. Получаем все ID кандидатов для отладки
        const { data: allCandidates, error: fetchError } = await this.client
            .from('candidates')
            .select('id, name, votes');
        
        if (fetchError) {
            console.error('❌ Ошибка получения кандидатов:', fetchError);
            throw fetchError;
        }
        
        console.log(`📊 Найдено ${allCandidates.length} кандидатов для сброса`);
        
        // 2. Обнуляем голоса кандидатов с проверкой
        const { error: updateError } = await this.client
            .from('candidates')
            .update({ 
                votes: 0,
                updated_at: new Date().toISOString()
            })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // исключаем несуществующий ID
        
        if (updateError) {
            console.error('❌ Ошибка обновления голосов кандидатов:', updateError);
            throw updateError;
        }
        
        console.log('✅ Голосы кандидатов обнулены');
        
        // 3. Удаляем все голоса с ограничением batch для безопасности
        const { error: deleteError } = await this.client
            .from('votes')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
            console.error('❌ Ошибка удаления голосов:', deleteError);
            throw deleteError;
        }
        
        console.log('✅ Записи голосов удалены');
        
        // 4. Проверяем результат
        const { data: checkCandidates, error: checkError } = await this.client
            .from('candidates')
            .select('id, name, votes')
            .limit(5);
        
        if (checkError) {
            console.error('❌ Ошибка проверки результата:', checkError);
            throw checkError;
        }
        
        console.log('📊 Проверка после сброса:', checkCandidates);
        
        return {
            success: true,
            message: `Сброшено ${allCandidates.length} кандидатов`,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Полная ошибка сброса голосов:', error);
        throw new Error(`Ошибка сброса голосов: ${error.message}`);
    }
}
    // 🔧 УТИЛИТА: ИЗВЛЕЧЕНИЕ ID ИЗ YOUTUBE ССЫЛКИ
    extractYouTubeId(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1].substring(0, 11); // YouTube ID всегда 11 символов
            }
        }
        
        return null;
    }
}

// Создаем глобальный экземпляр
window.SupabaseService = SupabaseService;
console.log('✅ SupabaseService загружен');
