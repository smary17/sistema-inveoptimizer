// --- NOTIFICACIONES ---
function mostrarNotificacion(mensaje, tipo = "success") {
    const div = document.getElementById("notificacion");
    div.className = `alert alert-${tipo} text-center`;
    div.innerText = mensaje;
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
            <th>Venta</th>
            <th>Restock</th>
        </tr>`;

        if (data.length === 0) {
            tabla += `<tr><td colspan="6">No hay productos registrados</td></tr>`;
        } else {
            data.forEach(p => {
                let clase = "";
                let estado = "";

                if (p.stock === 0) {
                    clase = "table-danger";
                    estado = "❌ Agotado";
                } else if (p.stock <= p.stock_min) {
                    clase = "table-warning";
                    estado = "⚠️ Stock bajo";
                } else {
                    clase = "table-success";
                    estado = "✅ Disponible";
                }

                tabla += `
                <tr class="${clase}">
                    <td>${p.nombre}</td>
                    <td>${p.categoria}</td>
                    <td>${p.stock}</td>
                    <td style="font-weight:bold;">${estado}</td>
                    <td>
                        <div class="d-flex justify-content-center gap-2">
                            <input type="number" min="1" value="1" id="cant-${p._id}" class="form-control" style="width:80px;">
                            <button class="btn btn-warning btn-sm" onclick="vender('${p._id}')">🛒</button>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="abrirRestock('${p._id}')">➕</button>
                    </td>
                </tr>`;
            });
        }
        document.getElementById("tabla").innerHTML = tabla;
    } catch (error) {
        console.error(error);
        document.getElementById("tabla").innerHTML = `<tr><td colspan="6">Error al cargar productos</td></tr>`;
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
        mostrarNotificacion("⚠️ Verifica los datos ingresados", "danger");
        return;
    }

    try {
        await fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto)
        });

        mostrarNotificacion("✅ Producto agregado correctamente");
        
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

        mostrarNotificacion("✅ Venta realizada");
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

        mostrarNotificacion("📦 Stock actualizado correctamente");
        inputCantidad.value = "";
        
        // Esconder el modal correctamente
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
        document.getElementById("ganancias").innerText = `💰 Ganancia Total: $${data.total}`;
    } catch (error) {
        console.error(error);
    }
}

// --- ESTADÍSTICAS Y MOVIMIENTOS ---
async function cargarMovimientos() {
    try {
        const res = await fetch('/movimientos');
        const data = await res.json();

        let tabla = `
        <tr class="table-dark">
            <th>Fecha</th>
            <th>Movimiento</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Ganancia</th>
        </tr>`;

        if (Array.isArray(data)) {
            data.reverse().forEach(m => {
                let colorFila = m.tipo === "venta" ? "table-light" : "table-info";
                let tipoIcono = m.tipo === "venta" ? "🛒 Venta" : "📦 Entrada";
                
                // Mostrar en verde la ganancia si es venta, sino poner un guion
                let gananciaTxt = m.tipo === "venta" 
                    ? `<span class="text-success fw-bold">+$${m.ganancia || 0}</span>` 
                    : `<span class="text-secondary">-</span>`;
                
                tabla += `
                <tr class="${colorFila}">
                    <td>${new Date(m.fecha).toLocaleString()}</td>
                    <td>${tipoIcono}</td>
                    <td>${m.producto_nombre || 'Desconocido'}</td>
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