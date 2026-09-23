// ⚠️ CAMBIA ESTA CONTRASEÑA POR LA QUE QUIERAS
const ADMIN_PASSWORD = "misdeseos123";

// Credenciales de Supabase
const SUPABASE_URL = "https://ilckjbyarvueetmquzpm.supabase.co";
const SUPABASE_KEY = "sb_publishable_OYWPasa7CQC71CgAuR76zw_Acp0bBUS";

// Variables globales
let isAdmin = false;

// Función para hacer requests a Supabase
async function supabaseRequest(method, endpoint, body = null) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Supabase Error:', response.status, errorData);
            throw new Error(`Status ${response.status}: ${errorData}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : [];
    } catch (error) {
        console.error('Request error:', error);
        throw error;
    }
}

// Cargar items desde Supabase
async function loadItems() {
    try {
        const items = await supabaseRequest('GET', 'wishlist?order=created_at.desc');
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error('Error cargando items:', error);
        return [];
    }
}

// Guardar un nuevo item
async function saveNewItem(item) {
    try {
        const result = await supabaseRequest('POST', 'wishlist', item);
        return result;
    } catch (error) {
        console.error('Error guardando item:', error);
        throw error;
    }
}

// Actualizar un item
async function updateItem(id, item) {
    try {
        const result = await supabaseRequest('PATCH', `wishlist?id=eq.${id}`, item);
        return result;
    } catch (error) {
        console.error('Error actualizando item:', error);
        throw error;
    }
}

// Eliminar un item
async function deleteItem(id) {
    try {
        await supabaseRequest('DELETE', `wishlist?id=eq.${id}`);
    } catch (error) {
        console.error('Error eliminando item:', error);
        throw error;
    }
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

// Convertir archivo a Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Renderizar items
async function renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    try {
        const items = await loadItems();
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

        container.innerHTML = filteredItems.map((item) => `
            <div class="item-card">
                <div class="item-image">
                    ${item.imageurl ? `<img src="${item.imageurl}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/200/be185d/ffffff?text=Sin+imagen'">` : '🎁'}
                </div>
                <div class="item-title">${item.title}</div>
                <div class="item-description">${item.description || 'Sin descripción'}</div>
                <div class="item-price">$${item.price.toLocaleString('es-CL')}</div>
                <div class="item-actions">
                    <button class="more-info-btn" onclick="expandItem(${item.id})">
                        <i class="fas fa-expand"></i>Más información
                    </button>
                    ${isAdmin ? `
                        <button class="more-info-btn" style="background: #d946a6; flex: 0;" onclick="editItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="more-info-btn" style="background: #ec4899; flex: 0;" onclick="deleteItemById(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error renderizando items:', error);
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #be185d;">Error cargando deseos</div>`;
    }
}

// Obtener item por ID
async function getItemById(id) {
    try {
        const items = await supabaseRequest('GET', `wishlist?id=eq.${id}`);
        return items && items.length > 0 ? items[0] : null;
    } catch (error) {
        console.error('Error obteniendo item:', error);
        return null;
    }
}

// Expandir item
async function expandItem(id) {
    const item = await getItemById(id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'expanded-modal';
    modal.id = 'expandedModal';
    modal.innerHTML = `
        <div class="expanded-content">
            <span class="close" onclick="closeExpandedItem()">&times;</span>
            <img src="${item.imageurl}" alt="${item.title}" class="expanded-image" onerror="this.src='https://via.placeholder.com/400/be185d/ffffff?text=Sin+imagen'">
            <h2 class="expanded-title">${item.title}</h2>
            <div class="expanded-price">$${item.price.toLocaleString('es-CL')}</div>
            <div class="expanded-description">${item.description || 'Sin descripción adicional'}</div>
            
            ${item.shoplinks && item.shoplinks.length > 0 ? `
                <div class="shop-links-section">
                    <h4>Dónde comprar:</h4>
                    ${item.shoplinks.map(link => `
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

// Editar item
async function editItem(id) {
    const item = await getItemById(id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'expanded-modal';
    modal.id = 'editModal';
    modal.innerHTML = `
        <div class="expanded-content" style="max-width: 600px;">
            <span class="close" onclick="closeEditModal()">&times;</span>
            <h2 style="color: #be185d; margin-bottom: 1.5rem;">Editar deseo</h2>
            <form id="editForm" onsubmit="saveEdit(event, ${id})">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Nombre</label>
                    <input type="text" id="editTitle" value="${item.title}" required style="width: 100%; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Precio ($)</label>
                    <input type="number" id="editPrice" value="${item.price}" required style="width: 100%; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px;">
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Descripción</label>
                    <textarea id="editDescription" style="width: 100%; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px; min-height: 80px;">${item.description || ''}</textarea>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Links a tiendas</label>
                    <textarea id="editShopLinks" style="width: 100%; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px; min-height: 80px;">${item.shoplinks.map(s => s.name + ' - ' + s.url).join('\n')}</textarea>
                    <small style="color: #be185d; display: block; margin-top: 0.5rem;">Formato: Nombre - URL (uno por línea)</small>
                </div>

                <button type="submit" class="add-btn" style="width: 100%;">Guardar cambios</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEditModal();
        }
    });
}

// Guardar cambios de edición
async function saveEdit(event, id) {
    event.preventDefault();
    
    try {
        const updatedItem = {
            title: document.getElementById('editTitle').value,
            price: parseInt(document.getElementById('editPrice').value),
            description: document.getElementById('editDescription').value,
            shoplinks: parseShopLinks(document.getElementById('editShopLinks').value)
        };

        await updateItem(id, updatedItem);
        closeEditModal();
        renderItems();
        alert('✅ Cambios guardados');
    } catch (error) {
        alert('Error guardando cambios: ' + error.message);
    }
}

// Cerrar modal de edición
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// Eliminar item
async function deleteItemById(id) {
    if (confirm('¿Seguro que quieres eliminar este deseo?')) {
        try {
            await deleteItem(id);
            renderItems();
        } catch (error) {
            alert('Error eliminando deseo: ' + error.message);
        }
    }
}

// ============ INICIALIZAR AL CARGAR ============
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón para subir imagen
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imageFile = document.getElementById('imageFile');
    
    if (uploadImageBtn && imageFile) {
        uploadImageBtn.addEventListener('click', function() {
            imageFile.click();
        });

        imageFile.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64 = await fileToBase64(file);
                    document.getElementById('imageurl').value = base64;
                    uploadImageBtn.textContent = '✅ Imagen cargada';
                    uploadImageBtn.style.background = '#10b981';
                    uploadImageBtn.style.color = 'white';
                    setTimeout(() => {
                        uploadImageBtn.textContent = 'Subir';
                        uploadImageBtn.style.background = '#fbcfe8';
                        uploadImageBtn.style.color = '#be185d';
                    }, 2000);
                } catch (error) {
                    alert('Error al cargar la imagen: ' + error);
                }
            }
        });
    }
    
    // Agregar nuevo item
    const form = document.getElementById('addItemForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const imageurl = document.getElementById('imageurl').value;
            if (!imageurl) {
                alert('Por favor agrega una imagen');
                return;
            }

            try {
                const shopLinksText = document.getElementById('shopLinks').value;
                const shopLinks = parseShopLinks(shopLinksText);

                const newItem = {
                    title: document.getElementById('title').value,
                    description: document.getElementById('description').value,
                    price: parseInt(document.getElementById('price').value) || 0,
                    imageurl: imageurl,
                    shoplinks: shopLinks
                };

                await saveNewItem(newItem);

                // Limpiar formulario
                form.reset();
                document.getElementById('imageurl').value = '';

                // Re-renderizar
                renderItems();

                // Scroll suave hacia los items
                document.getElementById('itemsContainer').scrollIntoView({ behavior: 'smooth' });
                
                alert('✅ ¡Deseo agregado exitosamente!');
            } catch (error) {
                alert('Error agregando deseo: ' + error.message);
            }
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

    // Actualizar items cada 3 segundos (para sincronización en tiempo real)
    setInterval(renderItems, 3000);
});