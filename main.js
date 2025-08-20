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
  fetch('config.json').then(r => r.json()).then(cfg => { claveAdmin = cfg.claveAdmin; });
  fetch('api.php?action=get&type=edificios').then(r => r.json()).then(arr => { edificios = arr; actualizarSelectores(); renderVistaEdificios(); });
  fetch('api.php?action=get&type=areas').then(r => r.json()).then(arr => { areas = arr; actualizarSelectores(); renderVistaAreas(); });
  fetch('api.php?action=get&type=relevamientos').then(r => r.json()).then(arr => { relevamientos = arr; renderVistaRelevamientos(); });
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
      tipo: document.querySelector('input[name="discoTipo"]:checked')?.value || ""
    },
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
    html += `<h5 class='mt-3 text-primary'>${edif}</h5>`;
    Object.keys(agrupado[edif]).forEach(area => {
      html += `<h6 class='text-secondary'>${area}</h6><div class='row mb-2'>`;
      agrupado[edif][area].forEach((r, idx) => {
        const cardId = `detalles-${edif}-${area}-${idx}`;
        html += `<div class='col-md-6 mb-2'>
          <div class='card'>
            <div class='card-body'>
              <h6 class='card-title mb-2'>${r.procesador} / ${r.ram.cantidad}GB ${r.ram.tipo}</h6>
              <button class='btn btn-sm btn-info mb-2' type='button' onclick="document.getElementById('${cardId}').classList.toggle('d-none')">Ver Detalles</button>
              <button class='btn btn-sm btn-danger mb-2 float-end' onclick='eliminarRelevamiento(${idx}, "${edif}", "${area}")'>Eliminar</button>
              <div id='${cardId}' class='mt-2 d-none'>
                <b>Monitor:</b> ${r.monitor.marcaModelo} (${r.monitor.estado})<br>
                <b>Teclado:</b> ${r.teclado.marca} (${r.teclado.estado})<br>
                <b>Mouse:</b> ${r.mouse.marca} (${r.mouse.estado})<br>
                <b>Placa Madre:</b> ${r.placaMadre}<br>
                <b>Disco:</b> ${r.disco.cantidad}GB (${r.disco.tipo})<br>
                <b>SO:</b> ${r.sistemaOperativo}<br>
                <b>Observaciones:</b> ${r.observaciones ? r.observaciones : ''}<br>
              </div>
            </div>
          </div>
        </div>`;
      });
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
