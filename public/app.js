// --- NOTIFICACIONES ---
function mostrarNotificacion(mensaje, tipo = "success") {
    const div = document.getElementById("notificacion");
    // Asignar ícono según el tipo de alerta
    const icono = tipo === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
    
    div.className = `alert alert-${tipo} text-center shadow-sm d-flex align-items-center justify-content-center gap-2`;
    div.innerHTML = `<i class="bi ${icono}"></i> ${mensaje}`;
    
    setTimeout(() => {
        div.className = "alert d-none";
    }, 3000);
}

// --- PRODUCTOS ---
async function cargarProductos() {
    try {
        const res = await fetch('/productos');
        if (!res.ok) throw new Error("Error en la petición de productos");
        const data = await res.json();

        let tabla = `
        <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Vender</th>
            <th>Restock</th>
        </tr>`;

        if (data.length === 0) {
            tabla += `<tr><td colspan="6" class="text-muted py-4"><i class="bi bi-inbox fs-4 d-block mb-2"></i> No hay productos registrados</td></tr>`;
        } else {
            data.forEach(p => {
                let clase = "";
                let estado = "";

                if (p.stock === 0) {
                    clase = "table-danger";
                    estado = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Agotado</span>';
                } else if (p.stock <= p.stock_min) {
                    clase = "table-warning";
                    estado = '<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-triangle"></i> Stock bajo</span>';
                } else {
                    clase = ""; // Dejamos el fondo blanco normal para los disponibles
                    estado = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Disponible</span>';
                }

                tabla += `
                <tr class="${clase}">
                    <td class="fw-medium">${p.nombre}</td>
                    <td class="text-muted">${p.categoria}</td>
                    <td class="fw-bold">${p.stock}</td>
                    <td>${estado}</td>
                    <td>
                        <div class="d-flex justify-content-center gap-2">
                            <input type="number" min="1" value="1" id="cant-${p._id}" class="form-control form-control-sm text-center" style="width:60px;">
                            <button class="btn btn-outline-primary btn-sm" onclick="vender('${p._id}')" title="Vender">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-outline-success btn-sm" onclick="abrirRestock('${p._id}')" title="Reabastecer">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </td>
                </tr>`;
            });
        }
        document.getElementById("tabla").innerHTML = tabla;
    } catch (error) {
        console.error(error);
        document.getElementById("tabla").innerHTML = `<tr><td colspan="6" class="text-danger py-3"><i class="bi bi-x-circle"></i> Error al cargar productos</td></tr>`;
    }
}

async function agregarProducto() {
    const producto = {
        nombre: document.getElementById('nombre').value,
        categoria: document.getElementById('categoria').value,
        costo: parseFloat(document.getElementById('costo').value),
        venta: parseFloat(document.getElementById('venta').value),
        stock: parseInt(document.getElementById('stock').value),
        stock_min: parseInt(document.getElementById('stock_min').value)
    };

    if (!producto.nombre || producto.stock < 0 || producto.venta < 0 || producto.stock_min < 0 || isNaN(producto.stock)) {
        mostrarNotificacion("Verifica los datos ingresados", "danger");
        return;
    }

    try {
        await fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });

        mostrarNotificacion("Producto agregado correctamente");
        
        // Limpiar formulario
        document.getElementById('nombre').value = "";
        document.getElementById('categoria').value = "";
        document.getElementById('costo').value = "";
        document.getElementById('venta').value = "";
        document.getElementById('stock').value = "";
        document.getElementById('stock_min').value = "";

        cargarProductos();
        cargarGanancias();
    } catch (error) {
        console.error(error);
        mostrarNotificacion("Error al agregar producto", "danger");
    }
}

// --- VENTAS Y RESTOCK ---
async function vender(id) {
    const inputCantidad = document.getElementById(`cant-${id}`);
    const cantidad = parseInt(inputCantidad.value);

    try {
        const res = await fetch(`/vender/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantidad })
        });

        const mensaje = await res.text();

        if (!res.ok) {
            mostrarNotificacion(mensaje, "danger");
            return;
        }

        mostrarNotificacion("Venta realizada");
        cargarProductos();
        cargarGanancias();
        cargarMovimientos();
    } catch (error) {
        console.error(error);
    }
}

let productoRestock = null;

function abrirRestock(id) {
    productoRestock = id;
    const modal = new bootstrap.Modal(document.getElementById('modalRestock'));
    modal.show();
}

async function confirmarRestock() {
    const inputCantidad = document.getElementById("cantidadRestock");
    const cantidad = parseInt(inputCantidad.value);

    if (!cantidad || cantidad <= 0) {
        mostrarNotificacion("Cantidad inválida", "danger");
        return;
    }

    try {
        await fetch(`/restock/${productoRestock}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: cantidad })
        });

        mostrarNotificacion("Stock actualizado correctamente");
        inputCantidad.value = "";
        
        const modalElement = document.getElementById('modalRestock');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if(modalInstance) modalInstance.hide();

        cargarProductos();
        cargarMovimientos();
    } catch (error) {
        console.error(error);
    }
}

// --- ESTADÍSTICAS Y MOVIMIENTOS ---
async function cargarGanancias() {
    try {
        const res = await fetch('/ganancias');
        const data = await res.json();
        document.getElementById("ganancias").innerHTML = `<i class="bi bi-cash-stack"></i> Ganancia Total: $${data.total}`;
    } catch (error) {
        console.error(error);
    }
}

async function cargarMovimientos() {
    try {
        const res = await fetch('/movimientos');
        const data = await res.json();

        let tabla = `
        <tr>
            <th>Fecha</th>
            <th>Movimiento</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Ganancia</th>
        </tr>`;

        if (Array.isArray(data)) {
            data.reverse().forEach(m => {
                let esVenta = m.tipo === "venta";
                let tipoIcono = esVenta 
                    ? '<span class="text-primary fw-medium"><i class="bi bi-cart-check"></i> Venta</span>' 
                    : '<span class="text-success fw-medium"><i class="bi bi-box-arrow-in-right"></i> Entrada</span>';
                
                let gananciaTxt = esVenta 
                    ? `<span class="text-success fw-bold">+$${m.ganancia || 0}</span>` 
                    : `<span class="text-secondary">-</span>`;
                
                tabla += `
                <tr>
                    <td class="text-muted small">${new Date(m.fecha).toLocaleString()}</td>
                    <td>${tipoIcono}</td>
                    <td class="fw-medium">${m.producto_nombre || 'Desconocido'}</td>
                    <td>${m.cantidad}</td>
                    <td>${gananciaTxt}</td>
                </tr>`;
            });
        }
        document.getElementById("tablaMovimientos").innerHTML = tabla;
    } catch (error) {
        console.error(error);
    }
}

// --- BUSCADOR ---
function filtrarProductos() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const filas = document.querySelectorAll("#tabla tr");

    filas.forEach((fila, i) => {
        if (i === 0) return; // Salta el encabezado
        const contenido = fila.innerText.toLowerCase();
        fila.style.display = contenido.includes(texto) ? "" : "none";
    });
}

// --- INICIAR APLICACIÓN ---
window.onload = () => {
    cargarProductos();
    cargarGanancias();
    cargarMovimientos();
};