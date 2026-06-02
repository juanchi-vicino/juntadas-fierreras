const userSession = JSON.parse(localStorage.getItem('user'));
if (!userSession) window.location.href = 'index.html';

async function loadIntegrantes() {
    const container = document.getElementById('integrantesContainer');
    // Si no existe el contenedor en el HTML actual, no hacemos nada
    if (!container) return;

    container.innerHTML = '<p class="loading-text">Cargando pilotos...</p>';
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/users`);
        const users = await response.json();
        
        container.innerHTML = ''; 

        users.forEach(member => {
            // BACKEND_URL viene definido desde api.js
            const pic = member.profilePic ? `${member.profilePic}` : 'https://via.placeholder.com/150';
            container.innerHTML += `
                <div class="member-card">
                    <div class="avatar-wrapper">
                        <img src="${pic}" alt="${member.username}">
                    </div>
                    <h3>${member.username}</h3>
                    <span class="badge-pilot">Piloto Oficial</span>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = '<p class="loading-text">Error al conectar con el servidor.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadIntegrantes);