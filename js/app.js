// js/app.js
// ── Reloj en tiempo real ───────────────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent =
        now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();
// ── Cambiar video de fondo segun condicion ─────────────────
function updateBackground(condition) {
    const map = VIDEO_MAP[condition] || VIDEO_MAP['Clouds'];
    const video = document.getElementById('bgVideo');
    // Set src directly on the video element instead of nested source elements for cross-browser reliability
    const currentSrc = video.currentSrc || video.src || '';
    if (currentSrc.includes(map.video)) return;
    video.style.opacity = '0';
    video.poster = map.poster;
    video.src = map.video;
    video.load();
    video.play().catch(() => {
        // Autoplay bloqueado — mostrar poster como fallback
        document.body.style.backgroundImage = `url(${map.poster})`;
    });
    video.style.opacity = '1';
}
// ── Renderizar tarjeta ─────────────────────────────────────
function renderCard(cardId, data) {
    const card = document.getElementById(cardId);
    card.querySelector('.city-name').textContent = data.city;
    card.querySelector('.temperature').textContent = `${data.temperature}°C`;
    card.querySelector('.condition').textContent = data.description;
    card.querySelector('.details').textContent =
        `Humedad: ${data.humidity}% | Viento: ${data.windSpeed} m/s`;
}
// ── Seleccionar ciudad con Enter ───────────────────────────
document.addEventListener('card-select', e => {
    const idx = parseInt(e.detail.cardId.replace('card', ''));
    if (window._weatherData?.[idx]) {
        const data = window._weatherData[idx];
        updateBackground(data.condition);
        document.getElementById('cityName').textContent = data.city;
    }
});
// ── Cargar datos al iniciar ────────────────────────────────
async function init() {
    try {
        const data = await fetchAllCities();
        window._weatherData = data;
        data.forEach((d, i) => renderCard(`card${i}`, d));
        // Video de fondo segun la primera ciudad
        updateBackground(data[0].condition);
        document.getElementById('cityName').textContent = data[0].city;
    } catch (err) {
        console.error('Error cargando clima:', err.message);
        document.getElementById('cityName').textContent = 'Error de conexion';
    }
}
// ── Registrar Service Worker ───────────────────────────────
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.error('SW error:', err));
}
init();
// Refrescar datos cada 10 minutos
setInterval(init, 10 * 60 * 1000);