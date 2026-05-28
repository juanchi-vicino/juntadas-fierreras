// ==========================================
// 1. ANIMACIÓN: CAMBIO ENTRE LOGIN Y REGISTRO
// ==========================================
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm.classList.contains('hidden')) {
        // Mostrar Login
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        setTimeout(() => {
            loginForm.style.opacity = 1;
            registerForm.style.opacity = 0;
        }, 50);
    } else {
        // Mostrar Registro
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        setTimeout(() => {
            registerForm.style.opacity = 1;
            loginForm.style.opacity = 0;
        }, 50);
    }
}


// ==========================================
// 2. CONEXIÓN AL BACKEND: LOGIC DE FORMULARIOS
// ==========================================

// Asegurarnos de que estamos en la página del index capturando los formularios
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Si los formularios existen en la página actual, ejecutamos esta lógica
if (loginForm && registerForm) {
    
    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página recargue
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const btn = loginForm.querySelector('button');

        try {
            btn.textContent = 'Cargando...';
            // Llamamos a la API que creaste en api.js
            const data = await api.login(user, pass);
            
            // Guardamos la sesión en el navegador
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirigir a la página principal
            window.location.href = 'inicio.html';
        } catch (error) {
            alert('Error: ' + error.message);
            btn.textContent = 'Arrancar';
        }
    });

    // --- LÓGICA DE REGISTRO ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('regUser').value;
        const pass = document.getElementById('regPass').value;
        const passConfirm = document.getElementById('regPassConfirm').value;
        const pic = document.getElementById('regPic').files[0];
        const btn = registerForm.querySelector('button');

        // Validación de contraseñas
        if (pass !== passConfirm) {
            return alert('Las contraseñas no coinciden.');
        }

        // Preparamos los datos para enviar (FormData soporta imágenes)
        const formData = new FormData();
        formData.append('username', user);
        formData.append('password', pass);
        formData.append('profilePic', pic);

        try {
            btn.textContent = 'Creando usuario...';
            // Llamamos a la API
            await api.register(formData);
            
            alert('¡Usuario creado con éxito! Ya podés iniciar sesión.');
            
            // Volvemos al formulario de login y limpiamos
            toggleForms(); 
            btn.textContent = 'Registrarse';
            registerForm.reset(); 
            
        } catch (error) {
            alert('Error: ' + error.message);
            btn.textContent = 'Registrarse';
        }
    });
}