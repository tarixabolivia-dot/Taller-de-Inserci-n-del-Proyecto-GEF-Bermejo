/**
 * js/comunicados_admin.js - Controlador JS independiente para el Módulo de Administración de Comunicados
 * Oficina Técnica Nacional de los Ríos Pilcomayo y Bermejo (OTN-PB)
 */

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('tab-comunicados-mod')) {
        loadComunicadosModuleData();
    }
});

// 1. Cargar listado de comunicados en la tabla del panel de administración
async function loadComunicadosModuleData() {
    const tbody = document.getElementById('comunicadosModTableBody');
    const badgeCounter = document.getElementById('countComunicadosMod');
    if (!tbody) return;

    try {
        const response = await fetch('comunicados_api.php?action=get_all&admin=1');
        const result = await response.json();

        if (!result.success || !result.data) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No se pudieron cargar los comunicados desde la Base de Datos.</td></tr>';
            return;
        }

        const data = result.data;
        if (badgeCounter) {
            badgeCounter.innerText = data.length + ' Registros';
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="fa fa-info-circle mr-1"></i>No hay comunicados registrados aún en MySQL.</td></tr>';
            return;
        }

        let html = '';
        data.forEach(item => {
            const fecha = item.fecha_publicacion ? item.fecha_publicacion.substring(0, 10) : '2026-09-06';
            const imgPath = item.imagen ? item.imagen : 'images/main_slide1.jpg';
            const estadoBadge = item.estado == 1 
                ? '<span class="comunicados-badge-pub"><i class="fa fa-check-circle mr-1"></i>Publicado</span>'
                : '<span class="comunicados-badge-off"><i class="fa fa-eye-slash mr-1"></i>Borrador</span>';

            html += `
                <tr>
                    <td class="font-weight-bold">#${String(item.id).padStart(2, '0')}</td>
                    <td>
                        <img src="${imgPath}" alt="${item.titulo}" class="comunicados-table-thumb" onerror="this.src='images/main_slide1.jpg';">
                    </td>
                    <td>
                        <strong class="text-dark d-block" style="font-size: 14px;">${item.titulo}</strong>
                        <span class="text-muted small">${item.resumen ? item.resumen.substring(0, 75) + '...' : ''}</span>
                    </td>
                    <td><span class="text-muted small"><i class="fa fa-calendar mr-1"></i>${fecha}</span></td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-info mr-1" onclick="previewComunicadoModal(${item.id})" title="Ver Vista Previa"><i class="fa fa-eye"></i></button>
                        <button class="btn btn-sm btn-primary mr-1" onclick="editComunicado(${item.id})" title="Modificar Registro"><i class="fa fa-pencil"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteComunicado(${item.id})" title="Eliminar de MySQL y Servidor"><i class="fa fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error al sincronizar comunicados con MySQL:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4"><i class="fa fa-exclamation-triangle mr-1"></i>Error al conectar con comunicados_api.php</td></tr>';
    }
}

// 2. Previsualización inmediata de imagen seleccionada en el formulario
function previewComunicadoImage(input) {
    const previewContainer = document.getElementById('comunicadoImgPreviewBox');
    const labelDisplay = document.getElementById('comunicadoImgFileName');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        labelDisplay.innerText = "Imagen seleccionada: " + file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Vista previa de imagen">`;
        };
        reader.readAsDataURL(file);
    }
}

// 3. Resetear formulario a modo creación
function resetComunicadoForm() {
    const form = document.getElementById('comunicadoForm');
    if (!form) return;
    form.reset();
    document.getElementById('comunicadoIdInput').value = '';
    document.getElementById('comunicadoImgFileName').innerText = "Haga clic aquí para seleccionar la imagen";
    document.getElementById('comunicadoImgPreviewBox').innerHTML = '<div class="comunicados-img-preview-empty"><i class="fa fa-picture-o fa-2x mb-1 d-block"></i>Seleccione un archivo de imagen JPG, PNG o WEBP para ver la vista previa aquí</div>';
    document.getElementById('btnSubmitComunicado').innerHTML = '<i class="fa fa-plus-circle mr-2"></i>Guardar Comunicado en MySQL';
    document.getElementById('formComunicadoTitle').innerText = "Adicionar Nuevo Comunicado Oficial";
    if (document.getElementById('comunicadoFechaInput')) {
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
        document.getElementById('comunicadoFechaInput').value = localIso;
    }
}

// 4. Cargar datos en el formulario para modificación (EDICIÓN)
async function editComunicado(id) {
    try {
        const response = await fetch(`comunicados_api.php?action=get&id=${id}`);
        const result = await response.json();

        if (!result.success || !result.data) {
            swalAlert('Error', 'No se pudieron recuperar los datos del comunicado.', 'error');
            return;
        }

        const data = result.data;
        document.getElementById('comunicadoIdInput').value = data.id;
        document.getElementById('comunicadoTitleInput').value = data.titulo;
        document.getElementById('comunicadoResumenInput').value = data.resumen || '';
        document.getElementById('comunicadoContenidoInput').value = data.contenido || '';
        document.getElementById('comunicadoEstadoInput').value = data.estado;

        if (data.fecha_publicacion && document.getElementById('comunicadoFechaInput')) {
            document.getElementById('comunicadoFechaInput').value = data.fecha_publicacion.replace(' ', 'T').substring(0, 16);
        } else if (document.getElementById('comunicadoFechaInput')) {
            document.getElementById('comunicadoFechaInput').value = '';
        }

        if (data.imagen) {
            document.getElementById('comunicadoImgPreviewBox').innerHTML = `<img src="${data.imagen}" alt="Imagen Actual">`;
            document.getElementById('comunicadoImgFileName').innerText = "Imagen actual: " + data.imagen.split('/').pop() + " (Seleccione otra para reemplazar)";
        } else {
            document.getElementById('comunicadoImgPreviewBox').innerHTML = '<div class="comunicados-img-preview-empty"><i class="fa fa-picture-o fa-2x mb-1 d-block"></i>Sin imagen asignada</div>';
        }

        document.getElementById('btnSubmitComunicado').innerHTML = '<i class="fa fa-save mr-2"></i>Actualizar Comunicado (# ' + data.id + ')';
        document.getElementById('formComunicadoTitle').innerText = "Modificar Comunicado Oficial #" + data.id;

        // Desplazar suavemente hacia el formulario
        document.getElementById('comunicadoForm').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        swalAlert('Error', 'Error de conexión con comunicados_api.php', 'error');
    }
}

// 5. Envío AJAX del formulario (Crear / Editar)
async function submitComunicadoForm(event) {
    event.preventDefault();

    const id = document.getElementById('comunicadoIdInput').value;
    const action = id ? 'update' : 'create';

    const formData = new FormData();
    formData.append('action', action);
    if (id) formData.append('id', id);

    formData.append('titulo', document.getElementById('comunicadoTitleInput').value);
    if (document.getElementById('comunicadoFechaInput')) {
        formData.append('fecha_publicacion', document.getElementById('comunicadoFechaInput').value);
    }
    formData.append('resumen', document.getElementById('comunicadoResumenInput').value);
    formData.append('contenido', document.getElementById('comunicadoContenidoInput').value);
    formData.append('estado', document.getElementById('comunicadoEstadoInput').value);

    const fileInput = document.getElementById('comunicadoFileInput');
    if (fileInput.files && fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
    }

    try {
        const response = await fetch('comunicados_api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            swalAlert('¡Operación Exitosa!', result.message || 'El comunicado ha sido procesado correctamente.', 'success');
            resetComunicadoForm();
            loadComunicadosModuleData();
        } else {
            swalAlert('Error', result.error || 'Ocurrió un error al procesar el comunicado.', 'error');
        }
    } catch (err) {
        swalAlert('Error de Red', 'No se pudo conectar con el servidor PHP/MySQL.', 'error');
    }
}

// 6. Eliminar Comunicado con Confirmación (SweetAlert2)
async function deleteComunicado(id) {
    const confirmed = await swalConfirm(
        '¿Está seguro de eliminar este comunicado?',
        'Se eliminará permanentemente el registro de MySQL y el archivo físico de imagen del servidor para no dejar residuos.',
        'Sí, eliminar de MySQL'
    );

    if (!confirmed) return;

    try {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        const response = await fetch('comunicados_api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            swalAlert('¡Eliminado!', result.message, 'success');
            loadComunicadosModuleData();
        } else {
            swalAlert('Error', result.error || 'No se pudo eliminar el registro.', 'error');
        }
    } catch (e) {
        swalAlert('Error', 'Error al procesar la solicitud de eliminación.', 'error');
    }
}

// 7. Vista Previa en Modal Emergente desde el Panel
async function previewComunicadoModal(id) {
    try {
        const response = await fetch(`comunicados_api.php?action=get&id=${id}`);
        const result = await response.json();

        if (result.success && result.data) {
            openComunicadoDetailModal(result.data);
        } else {
            swalAlert('Error', 'No se pudo obtener la vista previa.', 'error');
        }
    } catch (e) {
        swalAlert('Error', 'Error al obtener la vista previa.', 'error');
    }
}

// Función auxiliar para SweetAlert2 con Fallback a modal de navegador
function swalAlert(title, text, icon) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: '#0e2d42'
        });
    } else {
        alert(title + "\n" + text);
    }
}

function swalConfirm(title, text, confirmText) {
    return new Promise((resolve) => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#64748b',
                confirmButtonText: confirmText || 'Sí, confirmar',
                cancelButtonText: 'Cancelar'
            }).then((res) => {
                resolve(res.isConfirmed);
            });
        } else {
            resolve(confirm(title + "\n" + text));
        }
    });
}
