// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // Pantalla de carga - simular tiempo de carga
    const loadingScreen = document.getElementById('loading-screen');
    const homeScreen = document.getElementById('home-screen');
    
    // Mostrar pantalla de carga por 2.5 segundos
    setTimeout(() => {
        loadingScreen.classList.remove('active');
        homeScreen.classList.add('active');
        initDVDVideos(); // Iniciar animación DVD al cargar home
    }, 2500);
    
    // Navegación entre pantallas
    const navButtons = document.querySelectorAll('[data-screen]');
    const screens = document.querySelectorAll('.screen:not(#loading-screen)');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreen = button.getAttribute('data-screen');
            navigateToScreen(targetScreen);
        });
    });
    
    // Función de navegación
    function navigateToScreen(screenName) {
        // Ocultar todas las pantallas excepto loading
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla objetivo
        const targetElement = document.getElementById(`${screenName}-screen`);
        if (targetElement) {
            targetElement.classList.add('active');
        }
        
        // Actualizar estado activo en la barra de navegación
        updateNavActiveState(screenName);
        
        // Iniciar animación DVD si vamos al home
        if (screenName === 'home') {
            initDVDVideos();
        } else {
            stopDVDVideos();
        }
        
        // Ocultar panel de comentarios y botón central al cambiar de pantalla
        hideCommentsPanel();
    }
    
    // Actualizar el estado activo de los botones de navegación
    function updateNavActiveState(screenName) {
        const allNavBars = document.querySelectorAll('.bottom-nav');
        
        allNavBars.forEach(navBar => {
            const navButtons = navBar.querySelectorAll('.nav-btn');
            navButtons.forEach(btn => {
                const btnScreen = btn.getAttribute('data-screen');
                if (btnScreen === screenName) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }
    
    // Tabs de "Seguidos" y "Para Ti"
    const tabs = document.querySelectorAll('.top-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Tabs de la bandeja de entrada
    const inboxTabs = document.querySelectorAll('.inbox-tab');
    const notificationsContent = document.getElementById('notifications-content');
    const messagesContent = document.getElementById('messages-content');
    
    inboxTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            inboxTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            if (tabName === 'notifications' || tabName === 'all') {
                notificationsContent.classList.remove('hidden');
                messagesContent.classList.add('hidden');
            } else if (tabName === 'messages') {
                notificationsContent.classList.add('hidden');
                messagesContent.classList.remove('hidden');
            }
        });
    });
    
    // ==========================================
    // ANIMACIÓN DVD - 3 Videos rebotando lentamente
    // ==========================================
    
    let dvdAnimationId = null;
    const dvdVideos = [];
    let selectedVideo = null;
    
    function initDVDVideos() {
        const container = document.getElementById('dvd-container');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height - 70; // Restar altura del nav
        
        // Limpiar array
        dvdVideos.length = 0;
        
        // Obtener los 3 videos
        const videos = document.querySelectorAll('.dvd-video');
        
        videos.forEach((video, index) => {
            const videoRect = video.getBoundingClientRect();
            const videoWidth = 180; // Tamaño fijo
            const videoHeight = 240;
            
            // Posición inicial escalonada
            const startX = 50 + (index * (containerWidth - 250) / 2);
            const startY = 150 + (index * 150);
            
            // Velocidades muy lentas
            let vx = parseFloat(video.getAttribute('data-vx')) || 0.3;
            let vy = parseFloat(video.getAttribute('data-vy')) || 0.25;
            
            video.style.width = videoWidth + 'px';
            video.style.height = videoHeight + 'px';
            video.style.left = startX + 'px';
            video.style.top = startY + 'px';
            video.style.removeProperty('display');
            
            dvdVideos.push({
                element: video,
                x: startX,
                y: startY,
                vx: vx,
                vy: vy,
                width: videoWidth,
                height: videoHeight
            });
            
            // Click en video para seleccionar
            video.addEventListener('click', (e) => {
                e.stopPropagation();
                selectVideo(video);
            });
        });
        
        // Click en contenedor para deseleccionar
        container.addEventListener('click', () => {
            deselectVideo();
        });
        
        // Iniciar animación
        animateDVDVideos(containerWidth, containerHeight);
    }
    
    function animateDVDVideos(containerWidth, containerHeight) {
        const container = document.getElementById('dvd-container');
        if (!container) return;
        
        // Límites exactos
        const tabsHeight = 55; // Altura de los tabs "Seguidos | Para Ti"
        const navHeight = 70;  // Altura del menú inferior
        const minY = tabsHeight;
        const maxY = containerHeight - navHeight;
        
        // Verificar colisiones entre videos
        checkVideoCollisions();
        
        dvdVideos.forEach((video, index) => {
            const videoEl = video.element;
            const videoWidth = video.width;
            const videoHeight = video.height;
            
            // Actualizar posición
            video.x += video.vx;
            video.y += video.vy;
            
            // Rebote en los bordes - asegurando que no se salgan
            // Izquierda
            if (video.x <= 0) {
                video.x = 0;
                video.vx = Math.abs(video.vx);
                flashVideo(videoEl);
            }
            
            // Derecha - el borde derecho del video no debe pasar el contenedor
            if (video.x + videoWidth >= containerWidth) {
                video.x = containerWidth - videoWidth;
                video.vx = -Math.abs(video.vx);
                flashVideo(videoEl);
            }
            
            // Arriba - no pasar los tabs "Seguidos | Para Ti"
            if (video.y <= minY) {
                video.y = minY;
                video.vy = Math.abs(video.vy);
                flashVideo(videoEl);
            }
            
            // Abajo - el borde inferior no debe pasar la barra de navegación
            if (video.y + videoHeight >= maxY) {
                video.y = maxY - videoHeight;
                video.vy = -Math.abs(video.vy);
                flashVideo(videoEl);
            }
            
            // Aplicar nueva posición
            videoEl.style.left = video.x + 'px';
            videoEl.style.top = video.y + 'px';
        });
        
        // Continuar animación
        dvdAnimationId = requestAnimationFrame(() => animateDVDVideos(containerWidth, maxY));
    }
    
    function checkVideoCollisions() {
        for (let i = 0; i < dvdVideos.length; i++) {
            for (let j = i + 1; j < dvdVideos.length; j++) {
                const v1 = dvdVideos[i];
                const v2 = dvdVideos[j];
                
                // Detectar colisión
                if (v1.x < v2.x + v2.width &&
                    v1.x + v1.width > v2.x &&
                    v1.y < v2.y + v2.height &&
                    v1.y + v1.height > v2.y) {
                    
                    // Intercambiar velocidades (colisión simple)
                    const tempVx = v1.vx;
                    const tempVy = v1.vy;
                    v1.vx = v2.vx * 0.8;
                    v1.vy = v2.vy * 0.8;
                    v2.vx = tempVx * 0.8;
                    v2.vy = tempVy * 0.8;
                    
                    flashVideo(v1.element);
                    flashVideo(v2.element);
                }
            }
        }
    }
    
    function flashVideo(videoEl) {
        videoEl.style.boxShadow = '0 0 30px 5px rgba(247, 185, 22, 0.8)';
        setTimeout(() => {
            videoEl.style.boxShadow = '';
        }, 200);
    }
    
    function stopDVDVideos() {
        if (dvdAnimationId) {
            cancelAnimationFrame(dvdAnimationId);
            dvdAnimationId = null;
        }
    }
    
    // ==========================================
    // SELECCIÓN DE VIDEO Y COMENTARIOS
    // ==========================================
    
    function selectVideo(videoEl) {
        // Deseleccionar anterior
        if (selectedVideo) {
            selectedVideo.classList.remove('selected');
        }
        
        // Seleccionar nuevo
        selectedVideo = videoEl;
        videoEl.classList.add('selected');
        
        // Mostrar botón central de comentarios
        const commentBtn = document.getElementById('comment-nav-btn');
        commentBtn.classList.remove('hidden');
        
        // Hacer visible el botón de comentarios en la navegación
        commentBtn.style.display = 'flex';
    }
    
    function deselectVideo() {
        if (selectedVideo) {
            selectedVideo.classList.remove('selected');
            selectedVideo = null;
        }
        
        // Ocultar botón central y panel de comentarios
        const commentBtn = document.getElementById('comment-nav-btn');
        commentBtn.classList.add('hidden');
        hideCommentsPanel();
    }
    
    // Botón de comentarios en la navegación
    const commentNavBtn = document.getElementById('comment-nav-btn');
    commentNavBtn.addEventListener('click', () => {
        if (selectedVideo) {
            showCommentsPanel();
        }
    });
    
    function showCommentsPanel() {
        const panel = document.getElementById('comments-panel');
        panel.classList.add('active');
        loadComments();
    }
    
    function hideCommentsPanel() {
        const panel = document.getElementById('comments-panel');
        panel.classList.remove('active');
    }
    
    // Cerrar panel de comentarios
    document.getElementById('close-comments').addEventListener('click', hideCommentsPanel);
    
    // Cargar comentarios
    function loadComments() {
        const commentsList = document.getElementById('comments-list');
        const comments = [
            { user: '@carlos_99', avatar: '👨', text: '¡Esto está increíble! 🔥', time: 'hace 2 min' },
            { user: '@maria_gomez', avatar: '👩', text: 'Me encanta, sigue así!', time: 'hace 5 min' },
            { user: '@lucia_fernandez', avatar: '👧', text: '¿Cómo hiciste esto?', time: 'hace 10 min' },
            { user: '@pedro_sanchez', avatar: '👦', text: 'El mejor video que he visto hoy 😂', time: 'hace 15 min' },
            { user: '@ana_lopez', avatar: '👩‍🦰', text: 'Necesito un tutorial de esto', time: 'hace 1 hora' },
            { user: '@david_ruiz', avatar: '🧑', text: 'Jajajaja no puedo parar de verlo', time: 'hace 2 horas' },
        ];
        
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-avatar">${c.avatar}</div>
                <div class="comment-content">
                    <div class="comment-user">${c.user}</div>
                    <div class="comment-text">${c.text}</div>
                    <div class="comment-time">${c.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Enviar comentario
    document.getElementById('send-comment').addEventListener('click', sendComment);
    document.getElementById('comment-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendComment();
    });
    
    function sendComment() {
        const input = document.getElementById('comment-input');
        const text = input.value.trim();
        
        if (text) {
            const commentsList = document.getElementById('comments-list');
            const newComment = document.createElement('div');
            newComment.className = 'comment-item';
            newComment.innerHTML = `
                <div class="comment-avatar">🐱</div>
                <div class="comment-content">
                    <div class="comment-user">@Usuario</div>
                    <div class="comment-text">${text}</div>
                    <div class="comment-time">ahora</div>
                </div>
            `;
            commentsList.appendChild(newComment);
            commentsList.scrollTop = commentsList.scrollHeight;
            input.value = '';
        }
    }
    
    // ==========================================
    // CREADOR DE VIDEOS - SUBIDA DE ARCHIVOS
    // ==========================================
    
    const uploadBtn = document.getElementById('upload-btn');
    const videoUpload = document.getElementById('video-upload');
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const uploadSuccess = document.getElementById('upload-success');
    const creatorTitle = document.querySelector('.creator-title');
    const creatorUploadBtn = document.querySelector('.creator-upload-btn');
    
    let uploadedFile = null;
    
    // Click en botón de subir
    uploadBtn.addEventListener('click', () => {
        videoUpload.click();
    });
    
    // Manejar selección de archivo
    videoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleVideoUpload(file);
        }
    });
    
    // Drag and drop en toda la pantalla
    const creatorScreen = document.getElementById('creator-screen');
    creatorScreen.addEventListener('dragover', (e) => {
        e.preventDefault();
        creatorScreen.style.background = 'rgba(247, 185, 22, 0.1)';
    });
    
    creatorScreen.addEventListener('dragleave', () => {
        creatorScreen.style.background = '#000';
    });
    
    creatorScreen.addEventListener('drop', (e) => {
        e.preventDefault();
        creatorScreen.style.background = '#000';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideoUpload(file);
        }
    });
    
    function handleVideoUpload(file) {
        uploadedFile = file;
        
        // Ocultar botón y título durante la subida
        creatorUploadBtn.style.display = 'none';
        creatorTitle.style.display = 'none';
        
        // Mostrar progreso
        uploadProgress.classList.remove('hidden');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Archivo cargado, mostrar éxito
                setTimeout(() => {
                    uploadProgress.classList.add('hidden');
                    uploadSuccess.classList.remove('hidden');
                }, 500);
            }
            
            progressFill.style.width = progress + '%';
            progressText.textContent = `Subiendo ${Math.round(progress)}%`;
        }, 200);
    }
    
    // Publicar video
    document.getElementById('publish-btn').addEventListener('click', () => {
        if (!uploadedFile) return;
        
        // Simular publicación
        alert(`✅ Video publicado con éxito!\n\nArchivo: ${uploadedFile.name}\nTamaño: ${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`);
        
        // Resetear y volver al home
        resetCreator();
        navigateToScreen('home');
    });
    
    function resetCreator() {
        uploadedFile = null;
        videoUpload.value = '';
        uploadProgress.classList.add('hidden');
        uploadSuccess.classList.add('hidden');
        creatorUploadBtn.style.display = 'block';
        creatorTitle.style.display = 'block';
        progressFill.style.width = '0%';
    }
    
    // ==========================================
    // BANDEJA DE ENTRADA - CHATS Y NOTIFICACIONES
    // ==========================================
    
    const chatItems = document.querySelectorAll('.chat-item');
    const chatOverlay = document.getElementById('chat-overlay');
    const chatOverlayAvatar = document.getElementById('chat-overlay-avatar');
    const chatOverlayName = document.getElementById('chat-overlay-name');
    const chatOverlayMessages = document.getElementById('chat-overlay-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const backToInbox = document.getElementById('back-to-inbox');
    
    let currentChat = null;
    
    // Datos de los chats
    const chatData = {
        1: { name: 'María Gómez', avatar: '👩', messages: [
            { text: '¡Hola! ¿Qué tal estás?', sent: false },
            { text: 'Bien, ¿y tú?', sent: true },
            { text: 'Vi tu último video, ¡está genial!', sent: false }
        ]},
        2: { name: 'Carlos 99', avatar: '👨', messages: [
            { text: '¿Cuándo subes el próximo video?', sent: false },
            { text: 'Pronto, estoy trabajando en ello', sent: true }
        ]},
        3: { name: 'Lucía Fernández', avatar: '👧', messages: [
            { text: 'Me encantó tu último contenido 🔥', sent: false },
            { text: '¡Gracias!', sent: true }
        ]},
        4: { name: 'Pedro Sánchez', avatar: '👦', messages: [
            { text: 'Gracias por el follow!', sent: false }
        ]},
        5: { name: 'Ana López', avatar: '👩‍🦰', messages: [
            { text: 'Oye, ¿me puedes ayudar con una cosa?', sent: false }
        ]}
    };
    
    // Abrir chat
    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.getAttribute('data-chat');
            openChat(chatId);
        });
    });
    
    function openChat(chatId) {
        currentChat = chatId;
        const data = chatData[chatId];
        
        chatOverlayAvatar.textContent = data.avatar;
        chatOverlayName.textContent = data.name;
        
        loadChatMessages(chatId);
        
        chatOverlay.classList.remove('hidden');
        chatOverlay.classList.add('active');
    }
    
    function loadChatMessages(chatId) {
        const data = chatData[chatId];
        chatOverlayMessages.innerHTML = data.messages.map(msg => `
            <div class="message ${msg.sent ? 'sent' : 'received'}" style="display: flex; ${msg.sent ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
                <div class="message-bubble" style="max-width: 70%; padding: 12px 16px; border-radius: 18px; font-size: 15px; line-height: 1.4; ${msg.sent ? 'background: linear-gradient(135deg, #f7b916 0%, #f5a623 100%); color: #000; border-bottom-right-radius: 4px;' : 'background: #e0e0e0; color: #000; border-bottom-left-radius: 4px;'}">
                    ${msg.text}
                </div>
            </div>
        `).join('');
        chatOverlayMessages.scrollTop = chatOverlayMessages.scrollHeight;
    }
    
    // Volver a la bandeja
    backToInbox.addEventListener('click', () => {
        chatOverlay.classList.remove('active');
        chatOverlay.classList.add('hidden');
        currentChat = null;
    });
    
    // Enviar mensaje
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text || !currentChat) return;

        // Añadir mensaje enviado
        chatData[currentChat].messages.push({ text: text, sent: true });
        loadChatMessages(currentChat);
        chatInput.value = '';
    }
    
    // ==========================================
    // PERFIL Y AJUSTES
    // ==========================================
    
    document.querySelectorAll('.settings-item').forEach(item => {
        item.addEventListener('click', function() {
            alert(`⚙️ ${this.textContent}\n\nEsta opción abriría la pantalla de configuración.`);
        });
    });
    
    document.querySelector('.help-btn').addEventListener('click', () => {
        alert('❓ Centro de Ayuda\n\nEncuentra respuestas y contacta con soporte.');
    });
    
    document.querySelector('.settings-btn').addEventListener('click', () => {
        alert('⚙️ Configuración General');
    });
    
    // Recalcular al redimensionar
    window.addEventListener('resize', () => {
        if (document.getElementById('home-screen').classList.contains('active')) {
            stopDVDVideos();
            setTimeout(initDVDVideos, 100);
        }
    });
    
    console.log('🎬 DOPMAX - Aplicación cargada correctamente');
});
