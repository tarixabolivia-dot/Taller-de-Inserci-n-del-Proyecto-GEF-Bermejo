/**
 * js/comunicados_public.js - Controlador JS para la vista pública y modal interactivo de Comunicados
 * Oficina Técnica Nacional de los Ríos Pilcomayo y Bermejo (OTN-PB)
 */

let publicComunicadosData = [];

document.addEventListener('DOMContentLoaded', function () {
    // Inyectar contenedor modal en el DOM si no existe
    initComunicadoModalDOM();

    // Cargar datos desde la API MySQL comunicados_api.php
    loadPublicComunicados();
});

// 1. Inyectar contenedor del modal emergente en el cuerpo de la página
function initComunicadoModalDOM() {
    if (document.getElementById('comunicadoDetailModal')) return;

    const modalHTML = `
        <div id="comunicadoDetailModal" class="comunicados-mod-modal-overlay" onclick="closeComunicadoModalOnBackdrop(event)">
            <div class="comunicados-mod-modal-card">
                <button class="comunicados-mod-modal-close-btn" onclick="closeComunicadoModal()" title="Cerrar (Esc)">&times;</button>
                <div class="comunicados-mod-modal-header">
                    <img id="modalComunicadoImg" src="images/main_slide1.jpg" alt="Imagen Comunicado" onerror="this.src='images/main_slide1.jpg';">
                </div>
                <div class="comunicados-mod-modal-body">
                    <span class="comunicados-mod-modal-tag">
                        <i class="fa fa-bullhorn"></i> COMUNICADO OFICIAL OTN-PB
                    </span>
                    <h2 id="modalComunicadoTitle" class="comunicados-mod-modal-title">Cargando...</h2>
                    <div class="comunicados-mod-modal-meta">
                        <span><i class="fa fa-calendar text-primary mr-1"></i> <strong id="modalComunicadoDate">--</strong></span>
                        <span><i class="fa fa-building text-info mr-1"></i> <strong>Prensa OTN-PB</strong></span>
                    </div>
                    <div id="modalComunicadoText" class="comunicados-mod-modal-text">
                        Cargando contenido completo...
                    </div>
                </div>
                <div class="comunicados-mod-modal-footer">
                    <button type="button" class="btn btn-secondary font-weight-bold px-4 rounded-pill" onclick="closeComunicadoModal()">
                        <i class="fa fa-times mr-1"></i> Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Permitir cerrar modal con la tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeComunicadoModal();
        }
    });
}

// 2. Cargar comunicados desde comunicados_api.php
async function loadPublicComunicados() {
    try {
        const response = await fetch('comunicados_api.php?action=list');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            publicComunicadosData = result.data;
        }
    } catch (e) {
        console.log('Utilizando comunicados de respaldo...');
    }

    renderPublicComunicadosUI();
}

// 3. Renderizar tarjeta principal, lista lateral y cuadrícula inferior
function renderPublicComunicadosUI() {
    if (!publicComunicadosData || publicComunicadosData.length === 0) return;

    // A. Renderizar Comunicado Destacado Principal
    const main = publicComunicadosData[0];
    const mainImg = document.getElementById('mainFeaturedImg');
    const mainTitle = document.getElementById('mainFeaturedTitle');
    const mainDate = document.getElementById('mainFeaturedDate');
    const mainExcerpt = document.getElementById('mainFeaturedExcerpt');
    const mainBtn = document.getElementById('mainFeaturedBtn');
    const mainCard = document.getElementById('mainViewerCard');

    if (mainImg) mainImg.src = main.imagen || 'images/main_slide1.jpg';
    if (mainTitle) mainTitle.innerText = main.titulo;
    if (mainDate) mainDate.innerHTML = `<i class="fa fa-calendar text-primary mr-1"></i> ${formatFecha(main.fecha_publicacion)} | Oficina Técnica Nacional OTN-PB`;
    if (mainExcerpt) mainExcerpt.innerText = main.resumen || main.contenido.substring(0, 150) + '...';
    
    if (mainBtn) {
        mainBtn.href = 'javascript:void(0)';
        mainBtn.onclick = function (e) {
            e.stopPropagation();
            openComunicadoDetailModal(main);
        };
    }

    // Permitir que al hacer clic en cualquier parte de la tarjeta principal se abra el modal
    const mainCardContainer = document.querySelector('#mainViewerCard .col-lg-8 .card');
    if (mainCardContainer) {
        mainCardContainer.style.cursor = 'pointer';
        mainCardContainer.onclick = function () {
            openComunicadoDetailModal(main);
        };
    }

    // B. Renderizar Lista Lateral Reciente (Columna Derecha)
    const sidebarList = document.getElementById('comunicadosSmallList');
    if (sidebarList) {
        sidebarList.innerHTML = '';
        publicComunicadosData.forEach((item, idx) => {
            const isActive = idx === 0 ? 'active-comunicado-item' : '';
            const html = `
                <div class="small-comunicado-card d-flex align-items-center p-2 mb-2 rounded ${isActive}" 
                     onclick="openComunicadoDetailModalById(${item.id})" 
                     style="cursor: pointer; transition: all 0.2s ease; border: 1px solid #f1f5f9;"
                     title="Haga clic para ver el comunicado completo">
                    <img src="${item.imagen || 'images/main_slide1.jpg'}" alt="${item.titulo}" style="width: 75px; height: 60px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" onerror="this.src='images/main_slide1.jpg';" />
                    <div class="ml-3 overflow-hidden">
                        <h6 class="font-weight-bold text-dark mb-1 small text-truncate-2" style="font-size: 13px; line-height: 1.3;">
                            ${item.titulo}
                        </h6>
                        <span class="text-muted extra-small" style="font-size: 11px;">
                            <i class="fa fa-clock-o mr-1"></i>${formatFecha(item.fecha_publicacion)}
                        </span>
                    </div>
                </div>
            `;
            sidebarList.insertAdjacentHTML('beforeend', html);
        });
    }

    // C. Renderizar Grid Inferior (3 Columnas por orden de llegada)
    const gridContainer = document.getElementById('comunicadosGridContainer');
    const gridCount = document.getElementById('gridCount');
    if (gridCount) {
        gridCount.innerText = publicComunicadosData.length + ' Comunicados Disponibles';
    }

    if (gridContainer) {
        gridContainer.innerHTML = '';
        publicComunicadosData.forEach((item, idx) => {
            const cardHtml = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm rounded-lg overflow-hidden comunicado-grid-card" 
                         onclick="openComunicadoDetailModalById(${item.id})" 
                         style="cursor: pointer;"
                         title="Haga clic en la tarjeta para ver en pantalla completa">
                        <div style="position: relative; height: 200px; overflow: hidden;">
                            <img src="${item.imagen || 'images/main_slide1.jpg'}" alt="${item.titulo}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" class="grid-card-img" onerror="this.src='images/main_slide1.jpg';" />
                            <span class="badge badge-primary position-absolute font-weight-bold px-3 py-1" style="top: 12px; left: 12px; font-size: 11px; border-radius: 4px;">
                                <i class="fa fa-bullhorn mr-1"></i> COMUNICADO #${item.id}
                            </span>
                        </div>
                        <div class="card-body d-flex flex-column p-3">
                            <span class="text-muted small mb-2 d-block">
                                <i class="fa fa-calendar text-primary mr-1"></i> ${formatFecha(item.fecha_publicacion)}
                            </span>
                            <h5 class="font-weight-bold text-dark mb-2" style="font-size: 15px; line-height: 1.4;">
                                ${item.titulo}
                            </h5>
                            <p class="text-muted small mb-3 flex-grow-1" style="line-height: 1.5;">
                                ${item.resumen ? item.resumen.substring(0, 110) + '...' : item.contenido.substring(0, 110) + '...'}
                            </p>
                            <div class="pt-2 border-top d-flex justify-content-between align-items-center">
                                <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="event.stopPropagation(); openComunicadoDetailModalById(${item.id});">
                                    <i class="fa fa-eye mr-1"></i> Ver Comunicado
                                </button>
                                <span class="text-primary font-weight-bold small">
                                    Leer completo <i class="fa fa-angle-right"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            gridContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    }
}

// 4. Abrir Modal por ID de Comunicado
function openComunicadoDetailModalById(id) {
    const item = publicComunicadosData.find(c => c.id == id);
    if (item) {
        openComunicadoDetailModal(item);
    } else {
        fetch(`comunicados_api.php?action=get&id=${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.success && result.data) {
                    openComunicadoDetailModal(result.data);
                }
            })
            .catch(err => console.error(err));
    }
}

// 5. Abrir Modal Detallado Emergente
function openComunicadoDetailModal(item) {
    initComunicadoModalDOM();

    const modal = document.getElementById('comunicadoDetailModal');
    const modalImg = document.getElementById('modalComunicadoImg');
    const modalTitle = document.getElementById('modalComunicadoTitle');
    const modalDate = document.getElementById('modalComunicadoDate');
    const modalText = document.getElementById('modalComunicadoText');

    if (!modal || !item) return;

    if (modalImg) modalImg.src = item.imagen || 'images/main_slide1.jpg';
    if (modalTitle) modalTitle.innerText = item.titulo;
    if (modalDate) modalDate.innerText = formatFecha(item.fecha_publicacion);
    if (modalText) modalText.innerText = item.contenido;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar desplazamiento de fondo mientras el modal está abierto
}

// 6. Cerrar Modal
function closeComunicadoModal() {
    const modal = document.getElementById('comunicadoDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeComunicadoModalOnBackdrop(event) {
    if (event.target.id === 'comunicadoDetailModal') {
        closeComunicadoModal();
    }
}

// Función auxiliar para formatear fecha de ISO/MySQL a formato legible
function formatFecha(fechaRaw) {
    if (!fechaRaw) return "Reciente";
    if (fechaRaw.includes("de")) return fechaRaw; // Ya formateada

    const partes = fechaRaw.split(' ')[0].split('-');
    if (partes.length === 3) {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const anio = partes[0];
        const mesIndex = parseInt(partes[1], 10) - 1;
        const dia = partes[2];
        return `${dia} de ${meses[mesIndex] || 'Agosto'} de ${anio}`;
    }
    return fechaRaw;
}
