// Elementos del DOM
const table = document.getElementById('conversationsTable');
const modal = document.getElementById('messageModal');
const closeBtn = document.querySelector('.close');
const messagesList = document.getElementById('messagesList');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');

// Variables de paginación
let currentPage = 1;
let totalPages = 1;
let allConversations = [];

// Funciones auxiliares
const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
};

const parseMessages = (messagesString) => {
    try {
        return JSON.parse(messagesString);
    } catch (e) {
        console.error('Error parsing messages:', e);
        return [];
    }
};

// Manejadores de eventos para el modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Función para mostrar mensajes en el modal
const showMessages = (messages) => {
    const parsedMessages = parseMessages(messages);
    messagesList.innerHTML = parsedMessages.map(msg => `
        <div class="message">
            <div class="message-role">${msg.role}</div>
            <div class="message-content">${msg.content}</div>
        </div>
    `).join('');
    modal.style.display = 'block';
};

// Función para mostrar el skeleton loader
const showSkeletonLoader = () => {
    const tbody = table.querySelector('tbody');
    const skeletonRows = Array(5).fill().map(() => `
        <tr>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-text"></div></td>
            <td><div class="skeleton skeleton-button"></div></td>
        </tr>
    `).join('');
    tbody.innerHTML = skeletonRows;
};

// Función para renderizar la tabla
const renderTable = (conversations) => {
    const tbody = table.querySelector('tbody');
    if (!conversations.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary)">
                    No hay conversaciones disponibles
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = conversations.map(conv => {
        // Validación y valores por defecto para cada campo
        const id = conv.Id ? conv.Id.substring(0, 8) + '...' : 'N/A';
        const userId = conv.UserId || 'N/A';
        const channel = conv.Channel || 'N/A';
        const countryCode = conv.CountryCode ? conv.CountryCode.toUpperCase() : 'N/A';
        const createdAt = conv.CreatedAt ? formatDate(conv.CreatedAt) : 'N/A';
        const proxy = conv.ConversationProxy || 'N/A';
        const messages = conv.Messages || '[]';

        return `
        <tr>
            <td>${id}</td>
            <td>${userId}</td>
            <td>${channel}</td>
            <td>${countryCode}</td>
            <td>${createdAt}</td>
            <td>${proxy}</td>
            <td>
                <button class="btn" onclick='showMessages(${JSON.stringify(messages)})'>
                    Ver Mensajes
                </button>
            </td>
        </tr>
    `}).join('');

    // Actualizar controles de paginación
    updatePaginationControls();
};

// Función para actualizar los controles de paginación
const updatePaginationControls = () => {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
};

// Función para cambiar de página
const changePage = (page) => {
    currentPage = page;
    const start = (page - 1) * 10;
    const end = start + 10;
    renderTable(allConversations.slice(start, end));
};

// Manejadores de eventos para la paginación
prevPageBtn.onclick = () => {
    if (currentPage > 1) {
        changePage(currentPage - 1);
    }
};

nextPageBtn.onclick = () => {
    if (currentPage < totalPages) {
        changePage(currentPage + 1);
    }
};

// Función para cargar las conversaciones
const loadConversations = async () => {
    showSkeletonLoader();
    try {
        const response = await fetch('http://localhost:3000/conversations', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        allConversations = data;
        totalPages = Math.ceil(data.length / 10);
        changePage(1);
    } catch (error) {
        console.error('Error al cargar las conversaciones:', error);
        let errorMessage = 'Error al cargar las conversaciones. ';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'No se puede conectar con el servidor. Por favor, verifica que el servidor esté corriendo en http://localhost:3000';
        } else if (error.message.includes('CORS')) {
            errorMessage += 'Error de CORS. El servidor no permite conexiones desde este origen.';
        } else {
            errorMessage += error.message;
        }

        table.querySelector('tbody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #ef4444;">
                    ${errorMessage}
                </td>
            </tr>
        `;
    }
};

// Cargar las conversaciones al iniciar
document.addEventListener('DOMContentLoaded', loadConversations);