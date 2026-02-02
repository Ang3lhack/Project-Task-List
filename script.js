// ============================================
// CONFIGURACIÓN Y SELECTORES
// ============================================
const formulario = document.getElementById('form-tarea');
const inputTarea = document.getElementById('input-tarea');
const inputCategoria = document.getElementById('input-categoria');
const inputFecha = document.getElementById('input-fecha');
const listaTareas = document.getElementById('lista-tareas');
const contadorPendientes = document.getElementById('contador-pendientes');
const botonesFiltro = document.querySelectorAll('.filtro');
const btnTema = document.getElementById('btn-tema');

let tareas = [];
let filtroActual = 'todas';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cargarTareas();
    cargarTema();
});

// ============================================
// LÓGICA DE TAREAS
// ============================================

function cargarTareas() {
    const guardado = localStorage.getItem('tareas');
    if (guardado) {
        tareas = JSON.parse(guardado);
    }
    renderizarTareas();
}

function guardarTareas() {
    localStorage.setItem('tareas', JSON.stringify(tareas));
    actualizarContador();
}

function agregarTarea(texto, categoria, fecha) {
    const nuevaTarea = {
        id: Date.now(),
        texto: texto,
        categoria: categoria,
        fechaLimite: fecha, // Formato YYYY-MM-DD
        completada: false
    };

    tareas.unshift(nuevaTarea);
    guardarTareas();
    renderizarTareas();
}

// Nueva función para editar texto
function editarTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    // Usamos prompt para simplicidad (podría ser un modal)
    const nuevoTexto = prompt("Edita tu tarea:", tarea.texto);
    
    if (nuevoTexto !== null && nuevoTexto.trim() !== "") {
        tarea.texto = nuevoTexto.trim();
        guardarTareas();
        renderizarTareas();
    }
}

function toggleTarea(id) {
    tareas = tareas.map(tarea => {
        if (tarea.id === id) {
            return { ...tarea, completada: !tarea.completada };
        }
        return tarea;
    });
    guardarTareas();
    renderizarTareas();
}

// Función modificada para incluir animación
function iniciarEliminacion(id, btnElemento) {
    // 1. Encontrar el elemento HTML de la tarea (el <li> padre del botón)
    const li = btnElemento.closest('.tarea');
    
    // 2. Agregar clase para activar animación CSS
    li.classList.add('eliminando');

    // 3. Esperar a que termine la animación (500ms según CSS) antes de borrar datos
    setTimeout(() => {
        eliminarTarea(id);
    }, 500);
}

function eliminarTarea(id) {
    tareas = tareas.filter(tarea => tarea.id !== id);
    guardarTareas();
    renderizarTareas();
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarTareas() {
    let tareasMostrar = [];

    // Filtrado
    if (filtroActual === 'pendientes') {
        tareasMostrar = tareas.filter(t => !t.completada);
    } else if (filtroActual === 'completadas') {
        tareasMostrar = tareas.filter(t => t.completada);
    } else {
        tareasMostrar = tareas;
    }

    listaTareas.innerHTML = '';

    if (tareasMostrar.length === 0) {
        listaTareas.innerHTML = `<li class="sin-tareas">No hay tareas para mostrar.</li>`;
        actualizarContador();
        return;
    }

    tareasMostrar.forEach(tarea => {
        const li = document.createElement('li');
        li.className = `tarea ${tarea.completada ? 'completada' : ''}`;
        
        // Determinar si la fecha está por vencer
        const alertaFecha = verificarFecha(tarea.fechaLimite, tarea.completada);

        li.innerHTML = `
            <input 
                type="checkbox" 
                ${tarea.completada ? 'checked' : ''}
                onchange="toggleTarea(${tarea.id})"
            >
            
            <div class="tarea-contenido">
                <h3>${escaparHTML(tarea.texto)}</h3>
                <div class="info-extra">
                    <span class="tag cat-${tarea.categoria}">${tarea.categoria}</span>
                    ${tarea.fechaLimite ? `<span class="fecha-limite ${alertaFecha.clase}">📅 ${alertaFecha.texto}</span>` : ''}
                </div>
            </div>

            <div class="acciones">
                <button class="btn-accion btn-editar" onclick="editarTarea(${tarea.id})" title="Editar">✏️</button>
                <button class="btn-accion btn-eliminar" title="Eliminar">🗑️</button>
            </div>
        `;

        // Event listener especial para el botón eliminar para pasar 'this'
        const btnEliminar = li.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', function() {
            iniciarEliminacion(tarea.id, this);
        });

        listaTareas.appendChild(li);
    });

    actualizarContador();
}

// Verifica si la fecha es hoy o pasada
function verificarFecha(fechaStr, estaCompletada) {
    if (!fechaStr || estaCompletada) return { clase: '', texto: fechaStr };

    const fechaTarea = new Date(fechaStr);
    const hoy = new Date();
    // Ajustamos 'hoy' para comparar solo fechas (sin horas)
    hoy.setHours(0,0,0,0);
    // Ajustamos fechaTarea para evitar desfases de zona horaria simples al parsear YYYY-MM-DD
    const fechaTareaAjustada = new Date(fechaTarea.getTime() + fechaTarea.getTimezoneOffset() * 60000);

    if (fechaTareaAjustada < hoy) {
        return { clase: 'por-vencer', texto: `${fechaStr} (Vencida)` };
    } else if (fechaTareaAjustada.getTime() === hoy.getTime()) {
        return { clase: 'por-vencer', texto: '¡Vence hoy!' };
    }
    
    return { clase: '', texto: fechaStr };
}

function actualizarContador() {
    const pendientes = tareas.filter(t => !t.completada).length;
    contadorPendientes.textContent = pendientes;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ============================================
// EVENTOS Y TEMA
// ============================================

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = inputTarea.value.trim();
    const categoria = inputCategoria.value;
    const fecha = inputFecha.value;

    if (texto) {
        agregarTarea(texto, categoria, fecha);
        inputTarea.value = '';
        inputFecha.value = ''; 
        inputTarea.focus();
    }
});

botonesFiltro.forEach(boton => {
    boton.addEventListener('click', () => {
        botonesFiltro.forEach(b => b.classList.remove('activo'));
        boton.classList.add('activo');
        filtroActual = boton.dataset.filtro;
        renderizarTareas();
    });
});

// Lógica Modo Oscuro
btnTema.addEventListener('click', () => {
    document.body.classList.toggle('modo-oscuro');
    
    // Cambiar ícono
    const esOscuro = document.body.classList.contains('modo-oscuro');
    btnTema.textContent = esOscuro ? '☀️' : '🌙';

    // Guardar preferencia
    localStorage.setItem('tema', esOscuro ? 'oscuro' : 'claro');
});

function cargarTema() {
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'oscuro') {
        document.body.classList.add('modo-oscuro');
        btnTema.textContent = '☀️';
    }
}