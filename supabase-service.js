// 🔥 SUPABASE SERVICE - С ЗАЩИТОЙ ОТ НАКРУТКИ
class SupabaseService {
    constructor() {
        console.log('🚀 Создаем Supabase Service с защитой...');
        this.client = window.supabaseClient;
        if (!this.client) {
            console.error('❌ Supabase client не найден!');
            throw new Error('Supabase не инициализирован');
        }
        console.log('✅ Supabase client создан');
        
        // Конфигурация безопасности
        this.securityConfig = {
            MAX_VOTES_PER_USER_PER_HOUR: 50,
            MAX_VOTES_PER_FINGERPRINT_PER_HOUR: 30,
            MIN_TIME_BETWEEN_VOTES_MS: 1000,
            ENABLE_FINGERPRINT: true
        };
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
                    candidates: []
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

    // 🗳️ ГОЛОСОВАНИЕ С ЗАЩИТОЙ
    async voteForCandidateWithSecurity(voteData) {
        try {
            const userId = voteData.user_id;
            const candidateId = voteData.candidate_id;
            const categoryId = voteData.category_id;
            const fingerprint = voteData.fingerprint;
            
            console.log('🔒 Голосование с проверкой безопасности:', { 
                userId: userId.substring(0, 10) + '...', 
                candidateId, 
                categoryId,
                fingerprint: fingerprint ? fingerprint.substring(0, 8) + '...' : 'нет'
            });
            
            // 1. Проверяем лимиты голосований за час
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            
            const { data: recentVotes, error: recentError } = await this.client
                .from('votes')
                .select('id, created_at')
                .or(`user_id.eq.${userId},fingerprint.eq.${fingerprint}`)
                .gte('created_at', oneHourAgo);
            
            if (recentError) {
                console.error('Ошибка проверки лимитов:', recentError);
            }
            
            const voteCount = recentVotes?.length || 0;
            const userVotes = recentVotes?.filter(v => v.user_id === userId).length || 0;
            const fpVotes = recentVotes?.filter(v => v.fingerprint === fingerprint).length || 0;
            
            console.log(`📊 Статистика голосов: всего ${voteCount}, user: ${userVotes}, fp: ${fpVotes}`);
            
            if (userVotes >= this.securityConfig.MAX_VOTES_PER_USER_PER_HOUR) {
                throw new Error(`Достигнут лимит голосований: ${userVotes}/${this.securityConfig.MAX_VOTES_PER_USER_PER_HOUR} за час`);
            }
            
            if (fpVotes >= this.securityConfig.MAX_VOTES_PER_FINGERPRINT_PER_HOUR) {
                throw new Error(`Лимит по fingerprint: ${fpVotes}/${this.securityConfig.MAX_VOTES_PER_FINGERPRINT_PER_HOUR} за час`);
            }
            
            // 2. Проверяем по fingerprint (если есть)
            if (fingerprint && fingerprint !== 'no_fp' && this.securityConfig.ENABLE_FINGERPRINT) {
                const { data: fpVote, error: fpError } = await this.client
                    .from('votes')
                    .select('id')
                    .eq('fingerprint', fingerprint)
                    .eq('category_id', categoryId)
                    .maybeSingle();
                
                if (fpVote && !fpError) {
                    throw new Error('Обнаружен повторный голос с тем же fingerprint');
                }
            }
            
            // 3. Проверяем обычное голосование
            const { data: existingVote, error: checkError } = await this.client
                .from('votes')
                .select('id')
                .eq('user_id', userId)
                .eq('category_id', categoryId)
                .maybeSingle();
            
            if (existingVote) {
                throw new Error('Вы уже голосовали в этой категории');
            }
            
            // 4. Проверяем быстрые повторные голосования
            if (recentVotes && recentVotes.length > 0) {
                const lastVoteTime = new Date(recentVotes[0].created_at).getTime();
                const timeSinceLastVote = Date.now() - lastVoteTime;
                
                if (timeSinceLastVote < this.securityConfig.MIN_TIME_BETWEEN_VOTES_MS) {
                    const waitSeconds = Math.ceil((this.securityConfig.MIN_TIME_BETWEEN_VOTES_MS - timeSinceLastVote) / 1000);
                    throw new Error(`Подождите ${waitSeconds} секунд перед следующим голосованием`);
                }
            }
            
            // 5. Записываем голос с дополнительными данными
            const { error: voteError } = await this.client
                .from('votes')
                .insert({
                    user_id: userId,
                    candidate_id: candidateId,
                    category_id: categoryId,
                    fingerprint: fingerprint,
                    user_agent: voteData.user_agent,
                    security_level: 'protected',
                    created_at: new Date().toISOString()
                });
            
            if (voteError) {
                // Проверяем триггер быстрого голосования
                if (voteError.message.includes('fast voting') || voteError.message.includes('быстрое голосование')) {
                    throw new Error('Слишком быстрое голосование. Подождите 1 секунду.');
                }
                throw voteError;
            }
            
            // 6. Увеличиваем счетчик голосов у кандидата
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
            
            console.log(`✅ Голос записан: ${userId.substring(0, 10)}... → ${candidateId}`);
            
            // 7. Логируем успешное голосование
            await this.logSecurityEvent({
                type: 'vote_success',
                userId: userId.substring(0, 10) + '...',
                candidateId,
                categoryId,
                fingerprint: fingerprint ? fingerprint.substring(0, 8) + '...' : 'нет',
                message: 'Успешное голосование'
            });
            
            return {
                success: true,
                newVotes: newVotes,
                votesThisHour: userVotes + 1
            };
            
        } catch (error) {
            console.error('❌ Ошибка безопасного голосования:', error.message);
            
            // Логируем ошибку безопасности
            await this.logSecurityEvent({
                type: 'vote_blocked',
                userId: voteData.user_id.substring(0, 10) + '...',
                candidateId: voteData.candidate_id,
                categoryId: voteData.category_id,
                fingerprint: voteData.fingerprint ? voteData.fingerprint.substring(0, 8) + '...' : 'нет',
                message: error.message,
                reason: error.message.includes('лимит') ? 'limit_exceeded' : 
                       error.message.includes('fingerprint') ? 'fingerprint_duplicate' :
                       error.message.includes('уже голосовали') ? 'already_voted' :
                       error.message.includes('быстрое') ? 'too_fast' : 'other'
            });
            
            throw error;
        }
    }

    // 🔒 ЛОГИРОВАНИЕ СОБЫТИЙ БЕЗОПАСНОСТИ
    async logSecurityEvent(eventData) {
        try {
            const { error } = await this.client
                .from('security_logs')
                .insert({
                    event_type: eventData.type,
                    user_id: eventData.userId,
                    candidate_id: eventData.candidateId,
                    category_id: eventData.categoryId,
                    fingerprint: eventData.fingerprint,
                    message: eventData.message,
                    reason: eventData.reason || null,
                    ip_address: 'client_side',
                    user_agent: navigator.userAgent,
                    created_at: new Date().toISOString()
                });
            
            if (error) {
                console.error('Ошибка логирования:', error);
            }
        } catch (error) {
            console.error('Не удалось записать лог безопасности:', error);
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
                .maybeSingle();
            
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
            
            if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
                throw new Error('Неверная ссылка YouTube');
            }
            
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
            
            const maxSize = 100 * 1024 * 1024;
            if (videoFile.size > maxSize) {
                throw new Error(`Файл слишком большой (${(videoFile.size/1024/1024).toFixed(1)}MB). Максимум: 100MB`);
            }
            
            const fileName = `${categoryId}/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
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
            
            const { data: { publicUrl } } = this.client.storage
                .from('videos')
                .getPublicUrl(fileName);
            
            console.log('✅ Видео загружено, публичный URL:', publicUrl);
            
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
                .select('user_id, fingerprint');
            
            if (votesError) throw votesError;
            
            const uniqueUsers = new Set(votes.map(v => v.user_id)).size;
            const uniqueFingerprints = new Set(votes.filter(v => v.fingerprint).map(v => v.fingerprint)).size;
            
            // Количество кандидатов
            const { count: candidatesCount, error: countError } = await this.client
                .from('candidates')
                .select('*', { count: 'exact', head: true });
            
            if (countError) throw countError;
            
            // Блокировки безопасности
            const { count: blockedCount, error: blockedError } = await this.client
                .from('security_logs')
                .select('*', { count: 'exact', head: true })
                .eq('event_type', 'vote_blocked');
            
            return {
                totalVotes,
                uniqueUsers,
                uniqueFingerprints,
                candidatesCount: candidatesCount || 0,
                blockedAttempts: blockedCount || 0
            };
            
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error);
            return {
                totalVotes: 0,
                uniqueUsers: 0,
                uniqueFingerprints: 0,
                candidatesCount: 0,
                blockedAttempts: 0
            };
        }
    }

    // 📋 ПОЛУЧЕНИЕ ЛОГОВ БЕЗОПАСНОСТИ
    async getSecurityLogs(limit = 50) {
        try {
            const { data, error } = await this.client
                .from('security_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('❌ Ошибка получения логов безопасности:', error);
            return [];
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

    // 🔄 СБРОС ВСЕХ ГОЛОСОВ (админ) - ИСПРАВЛЕННАЯ ВЕРСИЯ
    async resetAllVotes() {
        try {
            console.log('🔄 Начинаем сброс всех голосов...');
            
            // 1. Получаем статистику перед сбросом
            const { data: candidatesBefore, error: fetchError } = await this.client
                .from('candidates')
                .select('id, name, votes');
            
            if (fetchError) {
                console.error('❌ Ошибка получения кандидатов:', fetchError);
                throw fetchError;
            }
            
            const { count: votesCount, error: countError } = await this.client
                .from('votes')
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                console.error('❌ Ошибка подсчета голосов:', countError);
                throw countError;
            }
            
            console.log(`📊 Перед сбросом: ${candidatesBefore.length} кандидатов, ${votesCount} голосов`);
            
            // 2. Обнуляем голосы кандидатов
            console.log('🔄 Обнуляем голосы кандидатов...');
            const { error: updateError } = await this.client
                .from('candidates')
                .update({ 
                    votes: 0,
                    updated_at: new Date().toISOString()
                })
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (updateError) {
                console.error('❌ Ошибка обновления голосов кандидатов:', updateError);
                throw updateError;
            }
            
            console.log('✅ Голосы кандидатов обнулены');
            
            // 3. Удаляем все голоса
            console.log('🔄 Удаляем записи голосований...');
            const { error: deleteError } = await this.client
                .from('votes')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (deleteError) {
                console.error('❌ Ошибка удаления голосов:', deleteError);
                throw deleteError;
            }
            
            console.log('✅ Записи голосов удалены');
            
            // 4. Очищаем логи безопасности (опционально)
            console.log('🔄 Очищаем логи безопасности...');
            try {
                await this.client
                    .from('security_logs')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000');
                console.log('✅ Логи безопасности очищены');
            } catch (logError) {
                console.warn('⚠️ Не удалось очистить логи безопасности:', logError.message);
            }
            
            // 5. Проверяем результат
            console.log('🔄 Проверяем результат...');
            const { data: candidatesAfter, error: checkError } = await this.client
                .from('candidates')
                .select('id, name, votes')
                .limit(5);
            
            if (checkError) {
                console.error('❌ Ошибка проверки результата:', checkError);
                throw checkError;
            }
            
            const allZero = candidatesAfter.every(c => c.votes === 0);
            console.log('📊 После сброса:', candidatesAfter);
            
            if (!allZero) {
                throw new Error('Не все голосы были сброшены');
            }
            
            // 6. Логируем действие
            await this.logSecurityEvent({
                type: 'admin_reset',
                userId: 'admin_system',
                candidateId: null,
                categoryId: null,
                fingerprint: 'system',
                message: `Сброшены все голосы: ${candidatesBefore.length} кандидатов, ${votesCount} голосов`
            });
            
            return {
                success: true,
                message: `Сброшены голосы ${candidatesBefore.length} кандидатов, удалено ${votesCount} записей голосований`,
                details: {
                    candidatesReset: candidatesBefore.length,
                    votesDeleted: votesCount,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('❌ Полная ошибка сброса голосов:', error);
            
            // Пробуем альтернативный метод через RPC
            try {
                console.log('🔄 Пробуем альтернативный метод сброса...');
                const { data, error: rpcError } = await this.client.rpc('reset_all_votes_safe');
                
                if (rpcError) throw rpcError;
                
                console.log('✅ Альтернативный метод успешен:', data);
                return {
                    success: true,
                    message: 'Голосы сброшены альтернативным методом',
                    details: data
                };
                
            } catch (fallbackError) {
                console.error('❌ Альтернативный метод также не сработал:', fallbackError);
                throw new Error(`Ошибка сброса голосов: ${error.message}`);
            }
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
                return match[1].substring(0, 11);
            }
        }
        
        return null;
    }
    
    // 🔧 ОБНОВЛЕНИЕ НАСТРОЕК БЕЗОПАСНОСТИ
    async updateSecurityConfig(config) {
        try {
            // Сохраняем в localStorage для клиентской части
            localStorage.setItem('slay68_security_config', JSON.stringify(config));
            
            // Обновляем конфигурацию сервиса
            this.securityConfig = { ...this.securityConfig, ...config };
            
            console.log('✅ Конфигурация безопасности обновлена:', config);
            return true;
        } catch (error) {
            console.error('❌ Ошибка обновления конфигурации:', error);
            return false;
        }
    }
}

// Создаем глобальный экземпляр
window.SupabaseService = SupabaseService;
console.log('✅ SupabaseService с защитой загружен');
// 🔧 УТИЛИТА: ПРОВЕРКА ГОЛОСОВАНИЯ С ЛИМИТАМИ
async checkVoteWithLimits(userId, fingerprint, categoryId) {
    try {
        // Используем нашу SQL функцию
        const { data, error } = await this.client.rpc('check_vote_limits', {
            p_user_id: userId,
            p_fingerprint: fingerprint,
            p_category_id: categoryId
        });
        
        if (error) {
            console.error('Ошибка проверки лимитов:', error);
            return { canVote: false, reason: 'Ошибка проверки' };
        }
        
        return {
            canVote: data[0]?.can_vote || false,
            reason: data[0]?.reason || 'Неизвестная причина',
            votesLastHour: data[0]?.user_votes_last_hour || 0
        };
        
    } catch (error) {
        console.error('Исключение при проверке лимитов:', error);
        return { canVote: false, reason: 'Ошибка системы' };
    }
}

// 🔧 УТИЛИТА: ПРОВЕРКА УЖЕ ГОЛОСОВАЛ ЛИ
async checkAlreadyVoted(userId, fingerprint, categoryId) {
    try {
        const { data, error } = await this.client.rpc('has_user_voted_in_category', {
            p_user_id: userId,
            p_category_id: categoryId,
            p_fingerprint: fingerprint
        });
        
        if (error) {
            console.error('Ошибка проверки голосования:', error);
            return false;
        }
        
        return data;
    } catch (error) {
        console.error('Исключение при проверке:', error);
        return false;
    }
}

// 📊 ПОЛУЧЕНИЕ СТАТИСТИКИ ГОЛОСОВАНИЯ
async getVotingStatistics() {
    try {
        // Общее количество голосов
        const { data: candidates, error: candidatesError } = await this.client
            .from('candidates')
            .select('votes');
        
        if (candidatesError) throw candidatesError;
        
        const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
        
        // Уникальные пользователи
        const { data: votes, error: votesError } = await this.client
            .from('votes')
            .select('user_id, fingerprint, created_at');
        
        if (votesError) throw votesError;
        
        const uniqueUsers = new Set(votes.map(v => v.user_id)).size;
        
        // Голоса за последние 24 часа
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentVotes = votes.filter(v => new Date(v.created_at) > new Date(dayAgo)).length;
        
        // Блокировки
        const { data: blockedVotes, error: blockedError } = await this.client
            .from('security_logs')
            .select('id')
            .eq('event_type', 'vote_blocked');
        
        return {
            totalVotes,
            uniqueUsers,
            recent24h: recentVotes,
            blockedAttempts: blockedVotes?.length || 0,
            totalVotesCount: votes?.length || 0
        };
        
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return {
            totalVotes: 0,
            uniqueUsers: 0,
            recent24h: 0,
            blockedAttempts: 0,
            totalVotesCount: 0
        };
    }
}
