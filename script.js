// ⚠️ CAMBIA ESTA CONTRASEÑA POR LA QUE QUIERAS
const ADMIN_PASSWORD = "misdeseos123";

// Items de ejemplo
const defaultItems = [
    {
        title: "Libreta con diseño",
        description: "Libreta bonita para notas o dibujar",
        price: 15000,
        priority: "low",
        imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23fbcfe8' width='200' height='200'/%3E%3Crect fill='%23be185d' x='20' y='20' width='160' height='160' rx='8'/%3E%3Ctext x='100' y='110' font-size='40' fill='%23fff' text-anchor='middle' dominant-baseline='middle'%3E📓%3C/text%3E%3C/svg%3E",
        shopLinks: []
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

// Parsear links de tiendas
function parseShopLinks(text) {
    if (!text || text.trim() === '') return [];
    
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('-') && line.length > 0)
        .map(line => {
            const [name, ...urlParts] = line.split('-').map(s => s.trim());
            const url = urlParts.join('-').trim();
            return { name, url };
        })
        .filter(link => link.url && (link.url.startsWith('http://') || link.url.startsWith('https://')));
}

// Renderizar items
function renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    const items = loadItems();
    const priceRange = document.getElementById('priceRange');
    const maxPrice = priceRange ? parseInt(priceRange.value) : 500000;

    // Filtrar por precio
    const filteredItems = items.filter(item => item.price <= maxPrice);

    if (filteredItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>${items.length === 0 ? 'Tu lista está vacía. ¡Agrega un deseo!' : 'No hay deseos en este rango de precio'}</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredItems.map((item, index) => `
        <div class="item-card">
            <div class="item-image">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/200/be185d/ffffff?text=Sin+imagen'">` : '🎁'}
            </div>
            <div class="item-title">${item.title}</div>
            <div class="item-description">${item.description || 'Sin descripción'}</div>
            <div class="item-price">$${item.price.toLocaleString('es-CL')}</div>
            <div class="item-priority priority-${item.priority}">
                ${item.priority === 'high' ? '⭐ Alta Prioridad' : item.priority === 'medium' ? '✨ Prioridad Media' : '💫 Baja Prioridad'}
            </div>
            <div class="item-actions">
                <button class="more-info-btn" onclick="expandItem(${index})">
                    <i class="fas fa-expand"></i>Más información
                </button>
                ${isAdmin ? `<button class="more-info-btn" style="background: #ec4899; flex: 0;" onclick="deleteItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

// Expandir item
function expandItem(index) {
    const items = loadItems();
    const item = items[index];

    const modal = document.createElement('div');
    modal.className = 'expanded-modal';
    modal.id = 'expandedModal';
    modal.innerHTML = `
        <div class="expanded-content">
            <span class="close" onclick="closeExpandedItem()">&times;</span>
            <img src="${item.imageUrl}" alt="${item.title}" class="expanded-image" onerror="this.src='https://via.placeholder.com/400/be185d/ffffff?text=Sin+imagen'">
            <h2 class="expanded-title">${item.title}</h2>
            <div class="expanded-price">$${item.price.toLocaleString('es-CL')}</div>
            <div class="expanded-description">${item.description || 'Sin descripción adicional'}</div>
            
            ${item.shopLinks && item.shopLinks.length > 0 ? `
                <div class="shop-links-section">
                    <h4>Dónde comprar:</h4>
                    ${item.shopLinks.map(link => `
                        <div class="shop-link-item">
                            <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                                ${link.name}
                                <span class="shop-link-icon"><i class="fas fa-external-link-alt"></i></span>
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(modal);

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeExpandedItem();
        }
    });
}

// Cerrar item expandido
function closeExpandedItem() {
    const modal = document.getElementById('expandedModal');
    if (modal) {
        modal.remove();
    }
}

// Eliminar item
function deleteItem(index) {
    if (confirm('¿Seguro que quieres eliminar este deseo?')) {
        const items = loadItems();
        items.splice(index, 1);
        saveItems(items);
        renderItems();
    }
}

// ============ INICIALIZAR AL CARGAR ============
document.addEventListener('DOMContentLoaded', function() {
    
    // Agregar nuevo item
    const form = document.getElementById('addItemForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const shopLinksText = document.getElementById('shopLinks').value;
            const shopLinks = parseShopLinks(shopLinksText);

            const newItem = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                price: parseInt(document.getElementById('price').value) || 0,
                priority: document.getElementById('priority').value,
                imageUrl: document.getElementById('imageUrl').value,
                shopLinks: shopLinks
            };

            const items = loadItems();
            items.push(newItem);
            saveItems(items);

            // Limpiar formulario
            form.reset();

            // Re-renderizar
            renderItems();

            // Scroll suave hacia los items
            document.getElementById('itemsContainer').scrollIntoView({ behavior: 'smooth' });
            
            alert('✅ ¡Deseo agregado exitosamente!');
        });
    }

    // ============ FILTRO DE PRECIO ============
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const resetFilter = document.getElementById('resetFilter');

    if (priceRange) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = parseInt(this.value).toLocaleString('es-CL');
            renderItems();
        });
    }

    if (resetFilter) {
        resetFilter.addEventListener('click', function() {
            priceRange.value = 500000;
            priceValue.textContent = '500.000';
            renderItems();
        });
    }

    // ============ FUNCIONALIDAD DE ADMIN ============
    const adminBtn = document.getElementById('adminBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const closeBtn = document.querySelector('.close');
    const addItemSection = document.getElementById('addItemSection');

    if (adminBtn) {
        // Abrir modal
        adminBtn.addEventListener('click', function() {
            if (passwordModal) {
                passwordModal.style.display = 'flex';
            }
        });

        // Cerrar modal
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                if (passwordModal) {
                    passwordModal.style.display = 'none';
                }
                const field = document.getElementById('adminPassword');
                if (field) field.value = '';
            });
        }

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (e.target === passwordModal) {
                passwordModal.style.display = 'none';
                const field = document.getElementById('adminPassword');
                if (field) field.value = '';
            }
        });

        // Validar contraseña
        if (passwordForm) {
            passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const password = document.getElementById('adminPassword').value;
                
                if (password === ADMIN_PASSWORD) {
                    isAdmin = true;
                    if (addItemSection) addItemSection.style.display = 'block';
                    if (passwordModal) passwordModal.style.display = 'none';
                    document.getElementById('adminPassword').value = '';
                    adminBtn.textContent = '🔓 Admin (Activo)';
                    adminBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
                    renderItems();
                } else {
                    alert('❌ Contraseña incorrecta');
                    document.getElementById('adminPassword').value = '';
                }
            });
        }
    }

    // Renderizar items al cargar
    renderItems();
});