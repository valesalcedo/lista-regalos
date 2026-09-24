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

// Convertir archivo a Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Parsear links de tiendas desde los inputs
function getShopLinksFromForm() {
    const container = document.getElementById('shopLinksContainer');
    const links = [];
    
    container.querySelectorAll('.shop-link-input').forEach(linkInput => {
        const name = linkInput.querySelector('.shop-name').value.trim();
        const url = linkInput.querySelector('.shop-url').value.trim();
        
        if (name && url && (url.startsWith('http://') || url.startsWith('https://'))) {
            links.push({ name, url });
        }
    });
    
    return links;
}

// Ordenar items
function sortItems(items, sortType) {
    const sorted = [...items];
    
    switch(sortType) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'priceLow':
            return sorted.sort((a, b) => (a.pricemin || 0) - (b.pricemin || 0));
        case 'priceHigh':
            return sorted.sort((a, b) => (b.pricemax || 0) - (a.pricemax || 0));
        case 'random':
            return sorted.sort(() => Math.random() - 0.5);
        default:
            return sorted;
    }
}

// Renderizar items
async function renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    try {
        const items = await loadItems();
        const priceMinRange = parseInt(document.getElementById('priceMinRange')?.value || 0);
        const priceMaxRange = parseInt(document.getElementById('priceMaxRange')?.value || 1000000);
        const sortType = document.getElementById('sortSelect')?.value || 'newest';

        // Filtrar por rango de precio
        const filteredItems = items.filter(item => {
            const itemMax = item.pricemax || 0;
            const itemMin = item.pricemin || 0;
            return itemMax >= priceMinRange && itemMin <= priceMaxRange;
        });

        // Ordenar
        const sortedItems = sortItems(filteredItems, sortType);

        if (sortedItems.length === 0) {
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

        container.innerHTML = sortedItems.map((item) => `
            <div class="item-card">
                <div class="item-image">
                    ${item.imageurl ? `<img src="${item.imageurl}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/200/be185d/ffffff?text=Sin+imagen'">` : '🎁'}
                </div>
                <div class="item-title">${item.title}</div>
                <div class="item-description">${item.description || 'Sin descripción'}</div>
                <div class="item-price">$${(item.pricemin || 0).toLocaleString('es-CL')} - $${(item.pricemax || 0).toLocaleString('es-CL')}</div>
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
            <div class="expanded-price">$${(item.pricemin || 0).toLocaleString('es-CL')} - $${(item.pricemax || 0).toLocaleString('es-CL')}</div>
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
                    <label>Rango de precio ($)</label>
                    <div style="display: flex; gap: 1rem;">
                        <input type="number" id="editPriceMin" value="${item.pricemin || 0}" required style="flex: 1; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px;">
                        <span style="align-self: center; color: #be185d;">-</span>
                        <input type="number" id="editPriceMax" value="${item.pricemax || 0}" required style="flex: 1; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Descripción</label>
                    <textarea id="editDescription" style="width: 100%; padding: 0.8rem; border: 1px solid #fbcfe8; border-radius: 8px; min-height: 80px;">${item.description || ''}</textarea>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label>Links a tiendas</label>
                    <div id="editShopLinksContainer">
                        ${item.shoplinks.map(link => `
                            <div class="shop-link-input" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <input type="text" placeholder="Nombre" value="${link.name}" class="shop-name" style="flex: 1; padding: 0.6rem; border: 1px solid #fbcfe8; border-radius: 6px;">
                                <input type="url" placeholder="URL" value="${link.url}" class="shop-url" style="flex: 1; padding: 0.6rem; border: 1px solid #fbcfe8; border-radius: 6px;">
                                <button type="button" class="remove-link-btn" onclick="removeEditShopLink(this)" style="padding: 0.6rem 0.8rem; background: #ec4899; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" onclick="addEditShopLink()" style="padding: 0.6rem 1rem; background: #fbcfe8; color: #be185d; border: 2px solid #be185d; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 0.5rem;">
                        <i class="fas fa-plus"></i> Agregar link
                    </button>
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
        const editShopLinksContainer = document.getElementById('editShopLinksContainer');
        const shoplinks = [];
        
        editShopLinksContainer.querySelectorAll('.shop-link-input').forEach(linkInput => {
            const name = linkInput.querySelector('.shop-name').value.trim();
            const url = linkInput.querySelector('.shop-url').value.trim();
            
            if (name && url) {
                shoplinks.push({ name, url });
            }
        });

        const updatedItem = {
            title: document.getElementById('editTitle').value,
            pricemin: parseInt(document.getElementById('editPriceMin').value),
            pricemax: parseInt(document.getElementById('editPriceMax').value),
            description: document.getElementById('editDescription').value,
            shoplinks: shoplinks
        };

        await updateItem(id, updatedItem);
        closeEditModal();
        renderItems();
        alert('✅ Cambios guardados');
    } catch (error) {
        alert('Error guardando cambios: ' + error.message);
    }
}

function addEditShopLink() {
    const container = document.getElementById('editShopLinksContainer');
    const linkInput = document.createElement('div');
    linkInput.className = 'shop-link-input';
    linkInput.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
    linkInput.innerHTML = `
        <input type="text" placeholder="Nombre" class="shop-name" style="flex: 1; padding: 0.6rem; border: 1px solid #fbcfe8; border-radius: 6px;">
        <input type="url" placeholder="URL" class="shop-url" style="flex: 1; padding: 0.6rem; border: 1px solid #fbcfe8; border-radius: 6px;">
        <button type="button" class="remove-link-btn" onclick="removeEditShopLink(this)" style="padding: 0.6rem 0.8rem; background: #ec4899; color: white; border: none; border-radius: 6px; cursor: pointer;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(linkInput);
}

function removeEditShopLink(btn) {
    btn.parentElement.remove();
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

// Agregar más campos de link en el formulario
function addMoreShopLink() {
    const container = document.getElementById('shopLinksContainer');
    const linkInput = document.createElement('div');
    linkInput.className = 'shop-link-input';
    linkInput.innerHTML = `
        <input type="text" placeholder="Nombre de la tienda" class="shop-name">
        <input type="url" placeholder="URL del producto" class="shop-url">
        <button type="button" class="remove-link-btn" onclick="removeShopLink(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(linkInput);
    
    // Mostrar botón de eliminar en la primera si hay más de una
    updateRemoveButtons();
}

function removeShopLink(btn) {
    btn.parentElement.remove();
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const inputs = document.querySelectorAll('.shop-link-input');
    inputs.forEach((input, index) => {
        const removeBtn = input.querySelector('.remove-link-btn');
        if (inputs.length > 1) {
            removeBtn.style.display = 'block';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// ============ INICIALIZAR AL CARGAR ============
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón para agregar más links
    const addMoreLinksBtn = document.getElementById('addMoreLinksBtn');
    if (addMoreLinksBtn) {
        addMoreLinksBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addMoreShopLink();
        });
    }

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
                const shoplinks = getShopLinksFromForm();

                const newItem = {
                    title: document.getElementById('title').value,
                    description: document.getElementById('description').value,
                    pricemin: parseInt(document.getElementById('priceMin').value) || 0,
                    pricemax: parseInt(document.getElementById('priceMax').value) || 0,
                    imageurl: imageurl,
                    shoplinks: shoplinks
                };

                await saveNewItem(newItem);

                // Limpiar formulario
                form.reset();
                document.getElementById('imageurl').value = '';
                document.getElementById('shopLinksContainer').innerHTML = `
                    <div class="shop-link-input">
                        <input type="text" placeholder="Nombre de la tienda" class="shop-name">
                        <input type="url" placeholder="URL del producto" class="shop-url">
                        <button type="button" class="remove-link-btn" onclick="removeShopLink(this)" style="display: none;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

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

    // ============ FILTROS Y ORDEN ============
    const priceMinRange = document.getElementById('priceMinRange');
    const priceMaxRange = document.getElementById('priceMaxRange');
    const priceMinValue = document.getElementById('priceMinValue');
    const priceMaxValue = document.getElementById('priceMaxValue');
    const sortSelect = document.getElementById('sortSelect');
    const resetFilter = document.getElementById('resetFilter');

    if (priceMinRange) {
        priceMinRange.addEventListener('input', function() {
            priceMinValue.textContent = parseInt(this.value).toLocaleString('es-CL');
            renderItems();
        });
    }

    if (priceMaxRange) {
        priceMaxRange.addEventListener('input', function() {
            priceMaxValue.textContent = parseInt(this.value).toLocaleString('es-CL');
            renderItems();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', renderItems);
    }

    if (resetFilter) {
        resetFilter.addEventListener('click', function() {
            if (priceMinRange) priceMinRange.value = 0;
            if (priceMaxRange) priceMaxRange.value = 1000000;
            if (priceMinValue) priceMinValue.textContent = '0';
            if (priceMaxValue) priceMaxValue.textContent = '1.000.000';
            if (sortSelect) sortSelect.value = 'newest';
            renderItems();
        });
    }

    // ============ FUNCIONALIDAD DE ADMIN ============
    const adminBtn = document.getElementById('adminBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const closeBtn = document.querySelector('.close');
    const addItemSection = document.getElementById('addItemSection');
    const filterSection = document.getElementById('filterSection');
    const pinterestSection = document.getElementById('pinterestSection');

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
                    if (filterSection) filterSection.style.display = 'block';
                    if (passwordModal) passwordModal.style.display = 'none';
                    document.getElementById('adminPassword').value = '';
                    adminBtn.textContent = '🔓 Admin (Activo)';
                    adminBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
                    
                    // Hacer el Pinterest editable si es admin
                    makeP interestEditable();
                    
                    renderItems();
                } else {
                    alert('❌ Contraseña incorrecta');
                    document.getElementById('adminPassword').value = '';
                }
            });
        }
    }

    // Pinterest link editable para admin
    function makePinterestEditable() {
        const pinterestLink = document.getElementById('pinterestLink');
        if (!pinterestLink) return;
        
        // Agregar icono de editar
        const editIcon = document.createElement('span');
        editIcon.innerHTML = ' <i class="fas fa-edit" style="font-size: 0.8rem; opacity: 0.7;"></i>';
        pinterestLink.appendChild(editIcon);
        
        // Hacer clickeable para editar
        pinterestLink.style.cursor = 'pointer';
        pinterestLink.addEventListener('click', function(e) {
            if (isAdmin) {
                e.preventDefault();
                const newUrl = prompt('Ingresa tu URL de Pinterest:', this.href === '#' ? 'https://pinterest.com/tu-usuario/tablero' : this.href);
                if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
                    this.href = newUrl;
                    localStorage.setItem('pinterestUrl', newUrl);
                }
            }
        });
        
        // Cargar URL guardada si existe
        const savedUrl = localStorage.getItem('pinterestUrl');
        if (savedUrl) {
            pinterestLink.href = savedUrl;
        }
    }
    
    // Cargar Pinterest URL guardada
    const pinterestLink = document.getElementById('pinterestLink');
    const savedUrl = localStorage.getItem('pinterestUrl');
    if (pinterestLink && savedUrl) {
        pinterestLink.href = savedUrl;
    }

    // Renderizar items al cargar
    renderItems();

    // Actualizar items cada 3 segundos (para sincronización en tiempo real)
    setInterval(renderItems, 3000);
});