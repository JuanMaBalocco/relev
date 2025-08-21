// Utilidades para descargar archivos desde el servidor
function guardarArchivo(nombre) {
  fetch(`api.php?action=get&type=${nombre.replace('.json','')}`)
    .then(r => r.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}

// Datos en memoria
let relevamientos = [];
let edificios = [];
let areas = [];
let claveAdmin = "";

// Consultar config y datos desde la API
function cargarDatos() {
  fetch('config.json?t=' + Date.now()).then(r => r.json()).then(cfg => { claveAdmin = cfg.claveAdmin; });
  fetch('api.php?action=get&type=edificios&t=' + Date.now()).then(r => r.json()).then(arr => { edificios = arr; actualizarSelectores(); renderVistaEdificios(); });
  fetch('api.php?action=get&type=areas&t=' + Date.now()).then(r => r.json()).then(arr => { areas = arr; actualizarSelectores(); renderVistaAreas(); });
  fetch('api.php?action=get&type=relevamientos&t=' + Date.now()).then(r => r.json()).then(arr => { relevamientos = arr; renderVistaRelevamientos(); });
}
cargarDatos();

// Inicializar selectores
function actualizarSelectores() {
  const edificioSelect = document.getElementById('edificioSelect');
  if (edificioSelect) edificioSelect.innerHTML = edificios.map(e => `<option value="${e}">${e}</option>`).join('');
  const areaSelect = document.getElementById('areaSelect');
  if (areaSelect) areaSelect.innerHTML = areas.map(a => `<option value="${a}">${a}</option>`).join('');
}

// Nuevo Edificio
const nuevoEdificioBtn = document.getElementById('nuevoEdificioBtn');
if (nuevoEdificioBtn) nuevoEdificioBtn.addEventListener('click', () => {
  Swal.fire({
    title: 'Nuevo Edificio',
    input: 'text',
    inputLabel: 'Nombre del edificio',
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      fetch('api.php?action=add_edificio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'nombre=' + encodeURIComponent(result.value)
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          edificios = resp.edificios;
          actualizarSelectores();
          renderVistaEdificios();
          document.getElementById('edificioSelect').value = result.value;
        }
      });
    }
  });
});

// Nueva Área
const nuevaAreaBtn = document.getElementById('nuevaAreaBtn');
if (nuevaAreaBtn) nuevaAreaBtn.addEventListener('click', () => {
  Swal.fire({
    title: 'Nueva Área',
    input: 'text',
    inputLabel: 'Nombre del área',
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      fetch('api.php?action=add_area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'nombre=' + encodeURIComponent(result.value)
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          areas = resp.areas;
          actualizarSelectores();
          renderVistaAreas();
          document.getElementById('areaSelect').value = result.value;
        }
      });
    }
  });
});

// Guardar relevamiento
const relevForm = document.getElementById('relevForm');
if (relevForm) relevForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    edificio: document.getElementById('edificioSelect').value,
    area: document.getElementById('areaSelect').value,
    monitor: {
      marcaModelo: document.getElementById('monitorMarcaModelo').value,
      estado: document.querySelector('input[name="monitorEstado"]:checked')?.value || ""
    },
    teclado: {
      marca: document.getElementById('tecladoMarca').value,
      estado: document.querySelector('input[name="tecladoEstado"]:checked')?.value || ""
    },
    mouse: {
      marca: document.getElementById('mouseMarca').value,
      estado: document.querySelector('input[name="mouseEstado"]:checked')?.value || ""
    },
    placaMadre: document.getElementById('placaMadreMarca').value,
    procesador: document.getElementById('procesadorModelo').value,
    ram: {
      cantidad: document.getElementById('ramCantidad').value,
      tipo: document.querySelector('input[name="ramTipo"]:checked')?.value || ""
    },
    disco: {
      cantidad: document.getElementById('discoCantidad').value,
      tipo: document.querySelector('input[name="discoTipo"]:checked')?.value || "",
      estado: document.querySelector('input[name="discoEstado"]:checked')?.value || ""
    },
    redInternet: document.querySelector('input[name="redInternet"]:checked')?.value || "",
    ipEstatica: document.getElementById('ipEstatica')?.value || "",
    sistemaOperativo: document.querySelector('input[name="soTipo"]:checked')?.value || "",
    observaciones: document.getElementById('observaciones').value
  };
  fetch('api.php?action=add_relevamiento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(JSON.stringify(data))
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.ok) {
      relevamientos = resp.relevamientos;
      Swal.fire({ icon: 'success', title: 'Guardado', text: 'Relevamiento guardado correctamente.' });
      relevForm.reset();
      actualizarSelectores();
      renderVistaRelevamientos();
    }
  });
});

// Descargar JSON
window.editarRelevamiento = function(idx, edif, area) {
  // Buscar el relevamiento correcto
  let i = 0;
  let relev = null;
  let globalIdx = -1;
  for (let j = 0; j < relevamientos.length; j++) {
    if (relevamientos[j].edificio === edif && relevamientos[j].area === area) {
      if (i === idx) {
        relev = relevamientos[j];
        globalIdx = j;
        break;
      }
      i++;
    }
  }
  if (!relev) return;

  // Crear el formulario HTML para el modal con selectores y opción de agregar nuevo
  let edificiosOptions = edificios.map(e => `<option value='${e}'${e === relev.edificio ? ' selected' : ''}>${e}</option>`).join('');
  let areasOptions = areas.map(a => `<option value='${a}'${a === relev.area ? ' selected' : ''}>${a}</option>`).join('');
  let formHtml = `<div class='text-start'>
    <label>Edificio</label>
    <div class='d-flex mb-2'>
      <select id='editEdificio' class='form-select'>${edificiosOptions}</select>
      <button type='button' class='btn btn-primary ms-2' id='addEdificioEditBtn'>+</button>
    </div>
    <label>Área</label>
    <div class='d-flex mb-2'>
      <select id='editArea' class='form-select'>${areasOptions}</select>
      <button type='button' class='btn btn-primary ms-2' id='addAreaEditBtn'>+</button>
    </div>
    <label>Procesador</label><input id='editProcesador' class='form-control mb-2' value='${relev.procesador}'>
    <label>RAM (GB)</label><input id='editRamCantidad' type='number' class='form-control mb-2' value='${relev.ram.cantidad}'>
    <label>RAM Tipo</label><input id='editRamTipo' class='form-control mb-2' value='${relev.ram.tipo}'>
    <label>IP Estática</label><input id='editIpEstatica' class='form-control mb-2' value='${relev.ipEstatica || ''}'>
    <label>Observaciones</label><textarea id='editObservaciones' class='form-control mb-2'>${relev.observaciones || ''}</textarea>
  </div>`;

  Swal.fire({
    title: 'Editar PC',
    html: formHtml,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return {
        edificio: document.getElementById('editEdificio').value,
        area: document.getElementById('editArea').value,
        procesador: document.getElementById('editProcesador').value,
        ram: {
          cantidad: document.getElementById('editRamCantidad').value,
          tipo: document.getElementById('editRamTipo').value
        },
        ipEstatica: document.getElementById('editIpEstatica').value,
        observaciones: document.getElementById('editObservaciones').value
      };
    }
  }).then(result => {
    if (result.isConfirmed && globalIdx >= 0) {
      // Actualizar el relevamiento en memoria
      relevamientos[globalIdx] = {
        ...relevamientos[globalIdx],
        ...result.value
      };
      // Enviar a la API para guardar
      fetch('api.php?action=edit_relevamiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'idx=' + globalIdx + '&data=' + encodeURIComponent(JSON.stringify(relevamientos[globalIdx]))
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          relevamientos = resp.relevamientos;
          renderVistaRelevamientos();
          Swal.fire('Editado', 'Relevamiento editado correctamente.', 'success');
        } else {
          Swal.fire('Error', 'No se pudo editar.', 'error');
        }
      });
    }
  });
}
const descargarJsonBtn = document.getElementById('descargarJsonBtn');
if (descargarJsonBtn) descargarJsonBtn.addEventListener('click', () => {
  guardarArchivo('relevamientos.json');
});

// Render vista relevamientos
function renderVistaRelevamientos() {
  const cont = document.getElementById('vistaRelevamientos');
  if (!cont) return;
  let html = '<button class="btn btn-primary mb-2" onclick="guardarArchivo(\'relevamientos.json\')">Descargar relevamientos.json</button>';
  // Agrupar por edificio y área
  const agrupado = {};
  relevamientos.forEach(r => {
    if (!agrupado[r.edificio]) agrupado[r.edificio] = {};
    if (!agrupado[r.edificio][r.area]) agrupado[r.edificio][r.area] = [];
    agrupado[r.edificio][r.area].push(r);
  });
  Object.keys(agrupado).forEach(edif => {
    const areasEdif = Object.keys(agrupado[edif]);
    const totalAreas = areasEdif.length;
    let totalPCsEdif = 0;
    areasEdif.forEach(area => {
      totalPCsEdif += agrupado[edif][area].length;
    });
    html += `<h5 class='mt-3 text-primary'>${edif} <span class='badge bg-info ms-2'>Áreas: ${totalAreas}</span> <span class='badge bg-success ms-2'>PCs: ${totalPCsEdif}</span></h5>`;
    areasEdif.forEach(area => {
      const totalPCsArea = agrupado[edif][area].length;
      const areaId = `area-${edif}-${area}`;
      html += `<div class='my-4 bg-white rounded shadow-sm p-3'>`;
      html += `<h6 class='text-secondary d-flex align-items-center'>${area} <span class='badge bg-success ms-2'>PCs: ${totalPCsArea}</span>
        <button class='btn btn-sm btn-outline-info ms-2' type='button' onclick="document.getElementById('${areaId}').classList.toggle('d-none')">Mostrar/Ocultar PCs</button>
      </h6>`;
      html += `<div id='${areaId}' class='row mb-4 mt-4 d-none'>`;
      agrupado[edif][area].forEach((r, idx) => {
        const cardId = `detalles-${edif}-${area}-${idx}`;
        html += `<div class='col-md-6 mb-2'>
          <div class='card'>
            <div class='card-body'>
              <h6 class='card-title mb-2'>${r.procesador} / ${r.ram.cantidad}GB ${r.ram.tipo}</h6>
                <button class='btn btn-sm btn-info mb-2' type='button' onclick="document.getElementById('${cardId}').classList.toggle('d-none')">Ver Detalles</button>
                <button class='btn btn-sm btn-warning mb-2 ms-2' onclick='editarRelevamiento(${idx}, "${edif}", "${area}")'>Editar</button>
                <button class='btn btn-sm btn-danger mb-2 float-end' onclick='eliminarRelevamiento(${idx}, "${edif}", "${area}")'>Eliminar</button>
              <div id='${cardId}' class='mt-2 d-none'>
                <b>Monitor:</b> ${r.monitor.marcaModelo} (${r.monitor.estado})<br>
                <b>Teclado:</b> ${r.teclado.marca} (${r.teclado.estado})<br>
                <b>Mouse:</b> ${r.mouse.marca} (${r.mouse.estado})<br>
                <b>Placa Madre:</b> ${r.placaMadre}<br>
                <b>Disco:</b> ${r.disco.cantidad}GB (${r.disco.tipo}) (${r.disco.estado})<br>
                <b>Red / Internet:</b> ${r.redInternet || ''}<br>
                <b>IP Estática:</b> ${r.ipEstatica || ''}<br>
                <b>SO:</b> ${r.sistemaOperativo}<br>
                <b>Observaciones:</b> ${r.observaciones ? r.observaciones : ''}<br>
              </div>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
      html += `</div>`;
    });
  });
  cont.innerHTML = html || '<p>No hay relevamientos guardados.</p>';
}

window.eliminarRelevamiento = function(idx, edif, area) {
  Swal.fire({
    title: 'Eliminar relevamiento',
    text: 'Ingrese la clave de administrador para eliminar',
    input: 'password',
    inputLabel: 'Clave',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      fetch('api.php?action=delete_relevamiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `idx=${idx}&edificio=${encodeURIComponent(edif)}&area=${encodeURIComponent(area)}&clave=${encodeURIComponent(result.value)}`
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          relevamientos = resp.relevamientos;
          renderVistaRelevamientos();
          Swal.fire('Eliminado', 'Relevamiento eliminado.', 'success');
        } else {
          Swal.fire('Clave incorrecta', '', 'error');
        }
      });
    }
  });
}

function renderVistaAreas() {
  const cont = document.getElementById('vistaAreas');
  if (!cont) return;
  let html = '<button class="btn btn-primary mb-2" onclick="guardarArchivo(\'areas.json\')">Descargar áreas.json</button>';
  html += '<button class="btn btn-success mb-2 ms-2" onclick="crearAreaModal()">Crear Área</button>';
  html += '<ul class="list-group">';
  areas.forEach((a, idx) => {
    html += `<li class='list-group-item d-flex justify-content-between align-items-center'>${a}
      <button class='btn btn-sm btn-danger' onclick='eliminarArea(${idx})'>Eliminar</button>
    </li>`;
  });
  html += '</ul>';
  cont.innerHTML = html;
}

window.eliminarArea = function(idx) {
  Swal.fire({
    title: 'Eliminar área',
    text: 'Ingrese la clave de administrador para eliminar',
    input: 'password',
    inputLabel: 'Clave',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      const nombre = areas[idx];
      fetch('api.php?action=delete_area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `nombre=${encodeURIComponent(nombre)}&clave=${encodeURIComponent(result.value)}`
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          areas = resp.areas;
          actualizarSelectores();
          renderVistaAreas();
          Swal.fire('Eliminado', 'Área eliminada.', 'success');
        } else {
          Swal.fire('Clave incorrecta', '', 'error');
        }
      });
    }
  });
}

function renderVistaEdificios() {
  const cont = document.getElementById('vistaEdificios');
  if (!cont) return;
  let html = '<button class="btn btn-primary mb-2" onclick="guardarArchivo(\'edificios.json\')">Descargar edificios.json</button>';
  html += '<button class="btn btn-success mb-2 ms-2" onclick="crearEdificioModal()">Crear Edificio</button>';
window.crearAreaModal = function() {
  Swal.fire({
    title: 'Nueva Área',
    input: 'text',
    inputLabel: 'Nombre del área',
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      fetch('api.php?action=add_area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'nombre=' + encodeURIComponent(result.value)
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          areas = resp.areas;
          actualizarSelectores();
          renderVistaAreas();
        }
      });
    }
  });
}

window.crearEdificioModal = function() {
  Swal.fire({
    title: 'Nuevo Edificio',
    input: 'text',
    inputLabel: 'Nombre del edificio',
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      fetch('api.php?action=add_edificio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'nombre=' + encodeURIComponent(result.value)
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          edificios = resp.edificios;
          actualizarSelectores();
          renderVistaEdificios();
        }
      });
    }
  });
}
  html += '<ul class="list-group">';
  edificios.forEach((e, idx) => {
    html += `<li class='list-group-item d-flex justify-content-between align-items-center'>${e}
      <button class='btn btn-sm btn-danger' onclick='eliminarEdificio(${idx})'>Eliminar</button>
    </li>`;
  });
  html += '</ul>';
  cont.innerHTML = html;
}

window.eliminarEdificio = function(idx) {
  Swal.fire({
    title: 'Eliminar edificio',
    text: 'Ingrese la clave de administrador para eliminar',
    input: 'password',
    inputLabel: 'Clave',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  }).then(result => {
    if (result.isConfirmed && result.value) {
      const nombre = edificios[idx];
      fetch('api.php?action=delete_edificio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `nombre=${encodeURIComponent(nombre)}&clave=${encodeURIComponent(result.value)}`
      })
      .then(r => r.json())
      .then(resp => {
        if (resp.ok) {
          edificios = resp.edificios;
          actualizarSelectores();
          renderVistaEdificios();
          Swal.fire('Eliminado', 'Edificio eliminado.', 'success');
        } else {
          Swal.fire('Clave incorrecta', '', 'error');
        }
      });
    }
  });
}

// Inicializar vistas al cambiar de tab

document.getElementById('relevamientos-tab')?.addEventListener('click', renderVistaRelevamientos);
document.getElementById('areas-tab')?.addEventListener('click', renderVistaAreas);
document.getElementById('edificios-tab')?.addEventListener('click', renderVistaEdificios);
