document.addEventListener('DOMContentLoaded', () => {
    // 1. --- LÓGICA DE LOCALIZAÇÃO ---
    
    const unidadeProximaSpan = document.getElementById('unidade-proxima');
    
    if (unidadeProximaSpan) {
        const LIBRARIES = [
            { nome: 'Mooca', lat: -23.562772, lon: -46.592535 },
            { nome: 'Tatuapé', lat: -23.550186, lon: -46.568469 },
            { nome: 'Santos', lat: -23.974917, lon: -46.331445 },
            { nome: 'Ipiranga', lat: -23.585501, lon: -46.602766 } 
        ];

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const toRad = (angle) => angle * (Math.PI / 180);

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);

            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; 
        };

        const findNearestStore = (userLat, userLon) => {
            let nearestStore = null;
            let shortestDistance = Infinity;

            LIBRARIES.forEach(store => {
                const distance = calculateDistance(userLat, userLon, store.lat, store.lon);
                
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestStore = store;
                }
            });

            if (nearestStore) {
                unidadeProximaSpan.innerHTML = `Unidade mais próxima: <strong>${nearestStore.nome}</strong> (${shortestDistance.toFixed(1)} km)`;
            }
        };

        const requestLocation = () => {
            if ("geolocation" in navigator) {
                unidadeProximaSpan.textContent = 'Buscando a unidade mais próxima...';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => { 
                        findNearestStore(position.coords.latitude, position.coords.longitude); 
                    },
                    (error) => {
                        console.error("Erro ao obter localização: ", error);
                        if (error.code === 1) {
                            unidadeProximaSpan.textContent = 'Permissão de localização negada.';
                        } else {
                            unidadeProximaSpan.textContent = 'Não foi possível encontrar a unidade mais próxima.';
                        }
                    },
                    { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 } 
                );
            } else {
                unidadeProximaSpan.textContent = 'Unidade: Geolocalização não suportada.';
            }
        };
        
        requestLocation();
    }


    // 2. --- INTERAÇÕES DE UI (SIDEBAR) ---
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const buttonMenu = document.getElementById('button-menu');
    const closeSidebar = document.getElementById('close-sidebar');

    const toggleSidebar = (open) => {
        if (sidebar && overlay) {
            if (open) {
                sidebar.classList.add('active');
                overlay.classList.add('active');
            } else {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    };

    buttonMenu?.addEventListener('click', () => toggleSidebar(true));
    closeSidebar?.addEventListener('click', () => toggleSidebar(false));
    overlay?.addEventListener('click', () => toggleSidebar(false));

    document.querySelectorAll('.submenu-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.classList.toggle('open');
        });
    });


    // 3. --- LÓGICA PARA SLIDERS DE PRODUTOS/MÍDIA ---
    
    const setupSlider = (trackId, prevId, nextId, cardClass) => {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);

        if (track && prevBtn && nextBtn) {
            const calculateScrollAmount = () => {
                const firstCard = track.querySelector(cardClass);
                if (!firstCard) return 280; 
                const gap = parseFloat(getComputedStyle(track).gap) || 24; 
                return firstCard.offsetWidth + gap;
            };

            nextBtn.addEventListener('click', () => {
                track.scrollBy({ left: calculateScrollAmount(), behavior: 'smooth' });
            });
            
            prevBtn.addEventListener('click', () => {
                track.scrollBy({ left: -calculateScrollAmount(), behavior: 'smooth' });
            });
        }
    };
    
    // Inicialização de todos os sliders da página, incluindo o novo 'novidades'
    setupSlider('ofertas-track', 'ofertas-prev', 'ofertas-next', '.card');
    setupSlider('recomendados-track', 'recomendados-prev', 'recomendados-next', '.card');
    setupSlider('novidades-track', 'novidades-prev', 'novidades-next', '.card'); // NOVO SLIDER
    setupSlider('animais-track', 'animais-prev', 'animais-next', '.card-media');
    setupSlider('videos-track', 'videos-prev', 'videos-next', '.card-media');


    // 4. --- LÓGICA PARA CONTROLE DOS VÍDEOS ---
    
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        const video = card.querySelector('video');
        const playButton = card.querySelector('.play-button');
        
        const togglePlay = () => {
            if (video.paused) {
                video.play();
                video.classList.add('is-playing');
                playButton.querySelector('i').className = 'bi bi-pause-circle-fill';
            } else {
                video.pause();
                video.classList.remove('is-playing');
                playButton.querySelector('i').className = 'bi bi-play-circle-fill';
            }
        };

        playButton?.addEventListener('click', togglePlay);
        video?.addEventListener('click', togglePlay);
        
        video?.addEventListener('ended', () => {
             video.classList.remove('is-playing');
             playButton.querySelector('i').className = 'bi bi-play-circle-fill';
        });
    });
});