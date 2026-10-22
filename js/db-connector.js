/**
 * db-connector.js - Sistema Central de Conexión Automática a la Base de Datos MySQL (otnpb_db)
 * Oficina Técnica Nacional de los Ríos Pilcomayo y Bermejo (OTN-PB)
 */

const OTN_DB = {
    apiUrl: 'api.php',

    // 1. Consultas Backend
    getStats: async function() {
        try {
            const res = await fetch(`${this.apiUrl}?action=get_stats`);
            const data = await res.json();
            return data.success ? data.stats : null;
        } catch (e) {
            console.error('Error al conectar con la base de datos:', e);
            return null;
        }
    },

    getDocumentos: async function(params = {}) {
        try {
            let url = `${this.apiUrl}?action=get_documentos`;
            if (params.categoria) url += `&categoria=${encodeURIComponent(params.categoria)}`;
            if (params.seccion) url += `&seccion=${encodeURIComponent(params.seccion)}`;
            
            const res = await fetch(url);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar documentos de la BD:', e);
            return [];
        }
    },

    getImagenes: async function(seccion = '') {
        try {
            let url = `${this.apiUrl}?action=get_imagenes`;
            if (seccion) url += `&seccion=${encodeURIComponent(seccion)}`;
            
            const res = await fetch(url);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar imágenes de la BD:', e);
            return [];
        }
    },

    getConvocatorias: async function() {
        try {
            const res = await fetch(`${this.apiUrl}?action=get_convocatorias`);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar convocatorias de la BD:', e);
            return [];
        }
    },

    getContratos: async function() {
        try {
            const res = await fetch(`${this.apiUrl}?action=get_contratos`);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar contratos de la BD:', e);
            return [];
        }
    },

    getProveedores: async function() {
        try {
            const res = await fetch(`${this.apiUrl}?action=get_proveedores`);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar proveedores de la BD:', e);
            return [];
        }
    },

    getPersonal: async function() {
        try {
            const res = await fetch(`${this.apiUrl}?action=get_personal`);
            const data = await res.json();
            return data.success ? data.data : [];
        } catch (e) {
            console.error('Error al cargar personal de la BD:', e);
            return [];
        }
    },

    // 2. Mapeo inteligente de categorías por URL
    getPageCategory: function() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('plan_operativo_anual')) return 'POA';
        if (path.includes('plan_estrategico') || path.includes('pei.')) return 'PEI';
        if (path.includes('rendicion_cuentas')) return 'Rendición de Cuentas';
        if (path.includes('auditoria')) return 'Auditoría';
        if (path.includes('escala_salarial')) return 'Escala Salarial';
        if (path.includes('convocatoria')) return 'Convocatorias';
        if (path.includes('contratos')) return 'Contratos';
        if (path.includes('proveedores')) return 'Proveedores';
        if (path.includes('presupuesto')) return 'Presupuesto';
        if (path.includes('balance_general')) return 'Balance General';
        if (path.includes('fuente_financiamiento')) return 'Fuente de Financiamiento';
        if (path.includes('programado_ejecutado') || path.includes('programado')) return 'programado_ejecutado';
        if (path.includes('viajes_exterior')) return 'Viajes Exterior';
        if (path.includes('informacion_estadistica')) return 'Estadísticas';
        if (path.includes('banco_investigacion')) return 'Investigación';
        
        // Subcategorías de Marco Legal
        if (path.includes('reglamentos')) return 'reglamentos';
        if (path.includes('leyes')) return 'leyes';
        if (path.includes('convenios')) return 'convenios';
        if (path.includes('manuales')) return 'manuales';
        if (path.includes('funciones')) return 'funciones';
        if (path.includes('procesos')) return 'procesos';
        if (path.includes('marco_legal')) return 'marco_legal';
        if (path.includes('monitoreo')) return 'Monitoreo';
        return '';
    },

    // 3. Sincronización global con la Base de Datos MySQL
    syncAll: async function() {
        const categoria = this.getPageCategory();
        const path = window.location.pathname.toLowerCase();

        // A. Cargar Documentos PDF filtrados o todos
        const docs = await this.getDocumentos(categoria ? { categoria: categoria } : {});
        const gridSelector = '#contractsGrid, #auditGrid, #procurementGrid, #pdfGrid, #paperGrid, #dataGrid, #jobGrid, #travelGrid, #rendicionGrid, #reportesGrid, #poaGrid, #documentGrid, .doc-grid-container';
        let gridContainer = $(gridSelector);
        const tableBody = $('#documentsTable tbody, #pdfTable tbody, .doc-table tbody');
        
        if (!gridContainer.length || gridContainer.length === 0) {
            gridContainer = $('.row:has(.doc-card), .row:has(.poa-card), .row:has(.contract-card), .row:has(.doc-item)').first();
        }

        // Preservar contenido dinámico generado por PHP en el servidor
        const hasServerCards = gridContainer.find('.card, .doc-item, .poa-card, .contract-card').length > 0 && 
                               !gridContainer.find('.fa-folder-open-o').length;

        if (hasServerCards) {
            return;
        }

        if (gridContainer.length > 0) {
            gridContainer.empty();
        }
        if (tableBody.length > 0) {
            tableBody.empty();
        }

        if (gridContainer.length > 0 && docs.length > 0) {
            docs.forEach(doc => {
                if ($(`#db-doc-card-${doc.id}`).length === 0) {
                    const fechaStr = doc.fecha_subida ? doc.fecha_subida.substring(0, 10) : 'Gestión ' + doc.anio;
                    const catBadge = doc.categoria || categoria || 'Documento Oficial';
                    const rutaClean = doc.ruta_archivo || ('archivos/pdf/' + doc.nombre_archivo);

                    const cardHtml = `
                    <div class="col-12 col-md-6 mb-4 doc-item db-doc-item" id="db-doc-card-${doc.id}" data-title="${(doc.titulo + ' ' + doc.nombre_archivo).toLowerCase()}" data-anio="${doc.anio}">
                        <div class="card p-4 h-100 shadow-sm border-0" style="border-radius: 12px; background: #ffffff; border-left: 5px solid #1c6b9c !important;">
                            <div class="d-flex align-items-start mb-3">
                                <div class="mr-3 p-3 rounded text-white text-center" style="background: #0e2d42; min-width: 48px;">
                                    <i class="fa fa-file-pdf-o font-weight-bold" style="font-size: 24px; color: #f5bc04;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="badge badge-primary px-3 py-1 font-weight-bold" style="background:#0e2d42;">${catBadge}</span>
                                        <span class="badge badge-warning text-dark font-weight-bold"><i class="fa fa-database mr-1"></i>BD MySQL</span>
                                    </div>
                                    <h5 class="font-weight-bold text-dark mt-2 mb-1" style="line-height: 1.3;">${doc.titulo}</h5>
                                    <p class="text-muted small mb-0"><i class="fa fa-file-text-o mr-1"></i><strong>Archivo:</strong> ${doc.nombre_archivo}</p>
                                </div>
                            </div>
                            <p class="text-muted small mb-3"><i class="fa fa-calendar text-muted mr-1"></i><strong>Publicado:</strong> ${fechaStr} | <strong>Año:</strong> ${doc.anio} | <strong>Tamaño:</strong> ${doc.tamano_mb || 'PDF Oficial'}</p>
                            <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <span class="text-success small font-weight-bold"><i class="fa fa-check-circle mr-1"></i>Vigente y Oficial</span>
                                <div>
                                    <a href="${rutaClean}" target="_blank" class="btn btn-sm btn-outline-primary mr-1 font-weight-bold"><i class="fa fa-eye mr-1"></i>Ver PDF</a>
                                    <a href="${rutaClean}" download class="btn btn-sm btn-success font-weight-bold"><i class="fa fa-download mr-1"></i>Descargar</a>
                                </div>
                            </div>
                        </div>
                    </div>`;

                    gridContainer.prepend(cardHtml);
                }
            });
        } else if (gridContainer.length > 0 && docs.length === 0) {
            gridContainer.html(`
                <div class="col-12 text-center text-muted py-5 bg-white rounded shadow-sm">
                    <i class="fa fa-folder-open-o fa-3x mb-3 text-secondary"></i>
                    <p class="font-weight-bold">No hay documentos PDF registrados en esta categoría en la base de datos.</p>
                    <small class="text-muted">Suba documentos desde el Panel de Administración asignándolos a esta sección para que aparezcan aquí automáticamente.</small>
                </div>
            `);
        }

        if (tableBody.length > 0 && docs.length > 0) {
            docs.forEach(doc => {
                if ($(`#db-doc-row-${doc.id}`).length === 0) {
                    const rutaClean = doc.ruta_archivo || ('archivos/pdf/' + doc.nombre_archivo);
                    const rowHtml = `
                    <tr id="db-doc-row-${doc.id}" class="bg-light">
                        <td>#${String(doc.id).padStart(2, '0')}</td>
                        <td><strong>${doc.titulo}</strong> <span class="badge badge-warning text-dark ml-1">MySQL</span></td>
                        <td><span class="badge badge-primary px-3 py-1">${doc.categoria || categoria || 'General'}</span></td>
                        <td>${doc.anio}</td>
                        <td>${doc.nombre_archivo}</td>
                        <td>${doc.fecha_subida ? doc.fecha_subida.substring(0,10) : doc.anio}</td>
                        <td>
                            <a href="${rutaClean}" target="_blank" class="btn btn-sm btn-outline-primary mr-1"><i class="fa fa-eye"></i></a>
                            <a href="${rutaClean}" download class="btn btn-sm btn-success"><i class="fa fa-download"></i></a>
                        </td>
                    </tr>`;
                    tableBody.prepend(rowHtml);
                }
            });
        }

        // B. Cargar Contratos específicos si estamos en transparencia_contratos.html
        if (path.includes('contratos')) {
            const contratos = await this.getContratos();
            const contractsGrid = $('#contractsGrid');
            if (contractsGrid.length > 0) {
                contractsGrid.empty();
            }
            if (contractsGrid.length > 0 && contratos.length > 0) {
                contratos.forEach(c => {
                    if ($(`#db-contract-card-${c.id}`).length === 0) {
                        const montoFmt = parseFloat(c.monto_bob).toLocaleString('es-BO', { minimumFractionDigits: 2 });
                        const pdfPath = c.contrato_pdf ? ('archivos/pdf/' + c.contrato_pdf) : '#';

                        const cCard = `
                        <div class="col-12 col-md-6 mb-4 contract-item db-contract-item" id="db-contract-card-${c.id}">
                            <div class="contract-card p-4 card h-100 shadow-sm border-0" style="border-left: 5px solid #10b981 !important;">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div class="d-flex align-items-center">
                                        <div class="contract-icon mr-3 p-3 rounded bg-success text-white">
                                            <i class="fa fa-file-text font-weight-bold" style="font-size: 22px;"></i>
                                        </div>
                                        <div>
                                            <span class="badge badge-success font-weight-bold px-3 py-1">${c.estado || 'En Ejecución'}</span>
                                            <span class="badge badge-warning text-dark font-weight-bold ml-1">BD MySQL</span>
                                            <h5 class="font-weight-bold text-dark mt-1 mb-0">${c.nro_contrato}</h5>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-muted small d-block">Monto Contrato</span>
                                        <strong class="text-success font-weight-bold">Bs. ${montoFmt}</strong>
                                    </div>
                                </div>
                                <p class="text-muted small mb-2"><strong>Objeto:</strong> ${c.objeto_contrato}</p>
                                <p class="text-muted small mb-3"><i class="fa fa-building text-muted mr-1"></i><strong>Empresa Adjudicada:</strong> ${c.adjudicatario} | <strong>Firma:</strong> ${c.fecha_firma}</p>
                                <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                    <span class="text-success small font-weight-bold"><i class="fa fa-check-circle mr-1"></i>Contrato SICOES Registrado</span>
                                    <div>
                                        <a href="${pdfPath}" target="_blank" class="btn btn-sm btn-outline-primary mr-1"><i class="fa fa-eye mr-1"></i>Ver PDF</a>
                                        <a href="${pdfPath}" download class="btn btn-sm btn-success"><i class="fa fa-download mr-1"></i>PDF</a>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                        contractsGrid.prepend(cCard);
                    }
                });
            }
        }

        // C. Cargar Proveedores si estamos en transparencia_lista_proveedores.html
        if (path.includes('proveedores')) {
            const proveedores = await this.getProveedores();
            const suppTable = $('#suppliersTable tbody');
            if (suppTable.length > 0) {
                suppTable.empty();
            }
            if (suppTable.length > 0 && proveedores.length > 0) {
                proveedores.forEach(p => {
                    if ($(`#db-supp-row-${p.id}`).length === 0) {
                        const sRow = `
                        <tr id="db-supp-row-${p.id}" class="supplier-row bg-light">
                            <td><strong>NIT:</strong> ${p.nit}<br><span class="text-muted small">RUPE: ${p.sicoes_rupe}</span></td>
                            <td><strong>${p.razon_social}</strong> <span class="badge badge-warning text-dark ml-1">MySQL</span><br><span class="text-muted small">Tel: ${p.telefono || 'Sin teléfono'}</span></td>
                            <td><span class="badge badge-info px-2 py-1">${p.rubro}</span></td>
                            <td>Tarija / Bolivia</td>
                            <td><span class="badge badge-success px-2 py-1">${p.estado || 'Habilitado'}</span></td>
                            <td class="text-center"><button class="btn btn-sm btn-outline-primary" onclick="alert('Proveedor oficial verificado en MySQL SICOES/RUPE');"><i class="fa fa-check-circle mr-1"></i>Verificado</button></td>
                        </tr>`;
                        suppTable.prepend(sRow);
                    }
                });
            }
        }
    },

    // 4. Modal universal para publicar contenido a MySQL desde cualquier página
    injectUploadModal: function() {
        const categoria = this.getPageCategory() || 'Convocatorias';
        if ($('#universalUploadModal').length > 0) return;

        const modalHtml = `
        <div class="modal fade" id="universalUploadModal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 14px;">
                    <div class="modal-header text-white" style="background: #0e2d42; border-top-left-radius: 14px; border-top-right-radius: 14px;">
                        <h5 class="modal-title font-weight-bold"><i class="fa fa-cloud-upload text-warning mr-2"></i>Publicar en Base de Datos MySQL</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <form id="universalPdfUploadForm">
                        <div class="modal-body p-4">
                            <div class="form-group mb-3">
                                <label class="font-weight-bold text-dark">Título o Nombre del Registro <span class="text-danger">*</span></label>
                                <input type="text" id="uniPdfTitle" class="form-control" placeholder="Ej: Contrato / Convocatoria / Documento 2026 PDF" required>
                            </div>
                            <div class="form-group mb-3">
                                <label class="font-weight-bold text-dark">Sección / Categoría Destino <span class="text-danger">*</span></label>
                                <select id="uniPdfCat" class="form-control">
                                    <option value="Convocatorias">Convocatorias</option>
                                    <option value="Contratos">Contratos</option>
                                    <option value="POA">Plan Operativo Anual (POA)</option>
                                    <option value="PEI">Plan Estratégico (PEI)</option>
                                    <option value="Rendición de Cuentas">Rendición de Cuentas</option>
                                    <option value="Auditoría">Informes de Auditoría</option>
                                    <option value="Escala Salarial">Escala Salarial</option>
                                    <option value="Presupuesto">Presupuesto Institucional</option>
                                    <option value="Marco Legal">Marco Legal</option>
                                    <option value="Proveedores">Lista de Proveedores</option>
                                </select>
                            </div>
                            <div class="form-group mb-3">
                                <label class="font-weight-bold text-dark">Año / Gestión <span class="text-danger">*</span></label>
                                <input type="number" id="uniPdfAnio" class="form-control" value="2026" required>
                            </div>
                            <div class="form-group mb-3">
                                <label class="font-weight-bold text-dark">Seleccionar Archivo PDF <span class="text-danger">*</span></label>
                                <input type="file" id="uniPdfFile" accept=".pdf" class="form-control-file p-2 border rounded" required>
                            </div>
                        </div>
                        <div class="modal-footer bg-light" style="border-bottom-left-radius: 14px; border-bottom-right-radius: 14px;">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-warning font-weight-bold px-4"><i class="fa fa-save mr-2"></i>Guardar en Base de Datos</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

        $('body').append(modalHtml);

        if (categoria) {
            $('#uniPdfCat').val(categoria);
        }

        $(document).on('submit', '#universalPdfUploadForm', async function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('action', 'add_documento');
            formData.append('titulo', $('#uniPdfTitle').val());
            formData.append('categoria', $('#uniPdfCat').val());
            formData.append('seccion', $('#uniPdfCat').val());
            formData.append('anio', $('#uniPdfAnio').val());

            const fileInput = document.getElementById('uniPdfFile');
            if (fileInput.files && fileInput.files[0]) {
                formData.append('pdf_file', fileInput.files[0]);
            }

            try {
                const res = await fetch('api.php', { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    alert('¡Publicación registrada con éxito en la Base de Datos MySQL!');
                    $('#universalUploadModal').modal('hide');
                    $('#universalPdfUploadForm')[0].reset();
                    OTN_DB.syncAll();
                } else {
                    alert('Error al guardar en BD: ' + result.error);
                }
            } catch (err) {
                alert('Error al conectar con la base de datos PHP/MySQL');
            }
        });
    }
};

$(document).ready(function() {
    OTN_DB.syncAll();
    OTN_DB.injectUploadModal();

    $(document).on('click', '[data-target="#uploadModal"], [data-target="#modalSubirDoc"], .btn:contains("Registrar Nuevo Contrato"), .btn:contains("Publicar Convocatoria"), .btn:contains("Cargar Documento")', function(e) {
        e.preventDefault();
        $('#universalUploadModal').modal('show');
    });
});
