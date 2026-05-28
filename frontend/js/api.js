const API_URL = 'http://localhost:3000/api';
const BACKEND_URL = 'http://localhost:3000'; // Para cargar las imágenes correctamente

const api = {
    // ==========================================
    // AUTENTICACIÓN (LOGIN Y REGISTRO)
    // ==========================================
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            return data;
        } catch (error) {
            throw error;
        }
    },

    register: async (formData) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                body: formData 
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            return data;
        } catch (error) {
            throw error;
        }
    },

    // ==========================================
    // JUNTADAS Y ASISTENCIAS
    // ==========================================
    getMeets: async () => {
        const res = await fetch(`${API_URL}/meets`);
        return res.json();
    },
    
    createMeet: async (formData) => {
        const res = await fetch(`${API_URL}/meets`, { method: 'POST', body: formData });
        return res.json();
    },
    
    setAttendance: async (data) => {
        const res = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    
    getAttendanceList: async (meetId) => {
        const res = await fetch(`${API_URL}/meets/${meetId}/attendance`);
        return res.json();
    }
};