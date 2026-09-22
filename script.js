// ⚠️ CAMBIA ESTA CONTRASEÑA POR LA QUE QUIERAS
const ADMIN_PASSWORD = "misdeseos123";

// Items de ejemplo
const defaultItems = [
    {
        title: "Libreta con diseño",
        description: "Libreta bonita para notas o dibujar",
        priority: "low",
        imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23fbcfe8' width='200' height='200'/%3E%3Crect fill='%23be185d' x='20' y='20' width='160' height='160' rx='8'/%3E%3Ctext x='100' y='110' font-size='40' fill='%23fff' text-anchor='middle' dominant-baseline='middle'%3E📓%3C/text%3E%3C/svg%3E",
        shopLink: ""
    }
];

// Variables globales
let isAdmin = false;

// Cargar items del localStorage
function loadItems() {
    const saved = localStorage.getItem('wishItems');
    return saved ? JSON.parse(saved) : defaultItems;
}

// Guardar items en localStorage
function saveItems(items) {
    localStorage.setItem('wishItems', JSON.stringify(items));
}

// Renderizar items
function renderItems() {
    const container = document.getElementById('itemsContainer');
    const items = loadItems();

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>Tu lista está vacía. ¡Agrega un deseo!</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, index) => `
        <div class="item-card">
            <div class="item-image">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}">` : '🎁'}
            </div>
            <div class="item-title">${item.title}</div>
            <div class="item-description">${item.description || 'Sin descripción'}</div>
            <div class="item-priority priority-${item.priority}">
                ${item.priority === 'high' ? '⭐ Alta Prioridad' : item.priority === 'medium' ? '✨ Prioridad Media' : '💫 Baja Prioridad'}
            </div>
            <div class="item-links">
                ${item.shopLink ? `<button class="link-btn"><a href="${item.shopLink}" target="_blank"><i class="fas fa-shopping-bag"></i>Ver tienda</a></button>` : ''}
                <button class="link-btn" style="background: #ec4899; flex: 0;" onclick="deleteItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Agregar nuevo item
document.getElementById('addItemForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const newItem = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        imageUrl: document.getElementById('imageUrl').value,
        shopLink: document.getElementById('shopLink').value
    };

    const items = loadItems();
    items.push(newItem);
    saveItems(items);

    // Limpiar formulario
    this.reset();

    // Re-renderizar
    renderItems();

    // Scroll suave hacia los items
    document.getElementById('itemsContainer').scrollIntoView({ behavior: 'smooth' });
});

// Eliminar item
function deleteItem(index) {
    if (confirm('¿Seguro que quieres eliminar este deseo?')) {
        const items = loadItems();
        items.splice(index, 1);
        saveItems(items);
        renderItems();
    }
}

// ============ FUNCIONALIDAD DE ADMIN ============

// Elementos del modal
const adminBtn = document.getElementById('adminBtn');
const passwordModal = document.getElementById('passwordModal');
const passwordForm = document.getElementById('passwordForm');
const closeBtn = document.querySelector('.close');
const addItemSection = document.getElementById('addItemSection');

// Abrir modal
adminBtn.addEventListener('click', function() {
    passwordModal.style.display = 'flex';
});

// Cerrar modal
closeBtn.addEventListener('click', function() {
    passwordModal.style.display = 'none';
    document.getElementById('adminPassword').value = '';
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', function(e) {
    if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
        document.getElementById('adminPassword').value = '';
    }
});

// Validar contraseña
passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        addItemSection.style.display = 'block';
        passwordModal.style.display = 'none';
        document.getElementById('adminPassword').value = '';
        adminBtn.textContent = '🔓 Admin (Activo)';
        adminBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
    } else {
        alert('❌ Contraseña incorrecta');
        document.getElementById('adminPassword').value = '';
    }
});

// Renderizar al cargar
renderItems();