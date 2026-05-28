const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'index.html';

const meetsContainer = document.getElementById('meetsContainer');
const modalAsistencia = document.getElementById('modalAsistencia');
const modalConfirmados = document.getElementById('modalConfirmados');
const reasonGroup = document.getElementById('reasonGroup');
const currentMeetIdInput = document.getElementById('currentMeetId');

// Cargar las juntadas al inicio
async function loadMeets() {
    meetsContainer.innerHTML = '<p>Cargando meets...</p>';
    try {
        const meets = await api.getMeets();
        meetsContainer.innerHTML = '';
        
        meets.forEach(meet => {
            const dateObj = new Date(meet.date);
            const formattedDate = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
            const imageHtml = meet.image ? `<img src="${BACKEND_URL}${meet.image}" class="meet-image" alt="Flyer">` : '';

            meetsContainer.innerHTML += `
                <div class="meet-card">
                    ${imageHtml}
                    <div class="meet-info">
                        <h3>📍 ${meet.place}</h3>
                        <p>🗓️ ${formattedDate}</p>
                        ${meet.description ? `<p>📝 ${meet.description}</p>` : ''}
                        <div class="meet-actions">
                            <button class="btn-primary" onclick="openAsistencia(${meet.id})">ASISTENCIA</button>
                            <button class="btn-secondary" onclick="openConfirmados(${meet.id})">CONFIRMADOS</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        meetsContainer.innerHTML = '<p>Error al cargar las juntadas.</p>';
    }
}

// Crear juntada
document.getElementById('createMeetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('place', document.getElementById('meetPlace').value);
    formData.append('date', document.getElementById('meetDate').value);
    formData.append('description', document.getElementById('meetDesc').value);
    const imgFile = document.getElementById('meetImage').files[0];
    if (imgFile) formData.append('image', imgFile);

    try {
        await api.createMeet(formData);
        document.getElementById('createMeetForm').reset();
        loadMeets(); // Recargar lista
    } catch (error) {
        alert('Error al crear juntada');
    }
});

// Modales
function closeModals() {
    modalAsistencia.classList.add('hidden');
    modalConfirmados.classList.add('hidden');
    document.getElementById('attendanceForm').reset();
}

function openAsistencia(id) {
    // 1. Guardamos el ID de la juntada seleccionada
    document.getElementById('currentMeetId').value = id;
    // 2. Forzamos que el cuadro de motivo tenga la clase 'hidden' AL ARRANCAR
    const reasonGroup = document.getElementById('reasonGroup');
    reasonGroup.classList.add('hidden');
    // 3. Limpiamos cualquier texto que haya quedado escrito antes y quitamos el 'required'
    const meetReason = document.getElementById('meetReason');
    if (meetReason) {
        meetReason.value = '';
        meetReason.removeAttribute('required');
    }
    // 4. Desmarcamos los botones de SÍ y NO para que arranquen vacíos
    const radios = document.querySelectorAll('input[name="status"]');
    radios.forEach(radio => radio.checked = false);
    // 5. Una vez que todo el formulario se limpió y ocultó, mostramos el modal
    document.getElementById('modalAsistencia').classList.remove('hidden');
}

function toggleReason(isNo) {
    const reasonGroup = document.getElementById('reasonGroup');
    const meetReason = document.getElementById('meetReason');
    
    if (isNo) {
        // Si elige NO, removemos 'hidden' para mostrarlo y lo hacemos obligatorio
        reasonGroup.classList.remove('hidden');
        meetReason.setAttribute('required', 'true');
    } else {
        // Si elige SÍ, le agregamos 'hidden' para ocultarlo, limpiamos y quitamos obligatoriedad
        reasonGroup.classList.add('hidden');
        meetReason.removeAttribute('required');
        meetReason.value = '';
    }
}

// Enviar Asistencia
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.querySelector('input[name="status"]:checked').value;
    const reason = document.getElementById('meetReason').value;
    const meet_id = currentMeetIdInput.value;

    try {
        await api.setAttendance({ meet_id, user_id: user.id, status, reason });
        alert('Asistencia registrada 🚗💨');
        closeModals();
    } catch (error) {
        alert('Error al registrar asistencia');
    }
});

// Ver Confirmados
// Ver Confirmados (Solo los que votaron)
async function openConfirmados(id) {
    modalConfirmados.classList.remove('hidden');
    const listContainer = document.getElementById('confirmadosList');
    listContainer.innerHTML = '<p>Cargando pilotos...</p>';

    try {
        const users = await api.getAttendanceList(id);
        listContainer.innerHTML = '';
        
        // FILTRO: Solo nos quedamos con los usuarios que tienen respuesta (status NO es nulo)
        const pilotosQueVotaron = users.filter(u => u.status !== null);

        // Si la lista quedó vacía después de filtrar:
        if (pilotosQueVotaron.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--gray-light); padding: 20px;">Nadie confirmó asistencia todavía.</p>';
            return;
        }
        
        // Dibujamos solo a los que pasaron el filtro
        pilotosQueVotaron.forEach(u => {
            let statusHtml = '';
            if (u.status === 'SI') statusHtml = '<span class="status-si">✅ Confirmado</span>';
            if (u.status === 'NO') statusHtml = `<span class="status-no">❌ No va</span> <br><small>Motivo: ${u.reason}</small>`;

            const profilePic = u.profilePic ? `${BACKEND_URL}${u.profilePic}` : 'https://via.placeholder.com/40';

            listContainer.innerHTML += `
                <div class="user-row">
                    <img src="${profilePic}" alt="${u.username}">
                    <div class="details">
                        <div class="name">${u.username}</div>
                        <div class="response">${statusHtml}</div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        listContainer.innerHTML = '<p>Error al cargar la lista.</p>';
    }
}

// Iniciar
loadMeets();