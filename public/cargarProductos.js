async function cargarProductos() {
    try {

        // CONSULTAR PRODUCTOS
        const res = await fetch('/productos');

        if (!res.ok) {
            throw new Error("No se pudieron cargar los productos");
        }

        const data = await res.json();

        // ENCABEZADO TABLA
        let tabla = `
        <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acción</th>
        </tr>`;

        // SI NO HAY DATOS
        if (data.length === 0) {
            tabla += `
            <tr>
                <td colspan="5">No hay productos registrados</td>
            </tr>`;
        }

        // RECORRER PRODUCTOS
        data.forEach(p => {

            let clase = "";
            let estado = "";

            if (p.stock === 0) {
                clase = "table-danger";
                estado = "❌ Agotado - Resurtir";
            } 
            else if (p.stock <= p.stock_min) {
                clase = "table-warning";
                estado = "⚠️ Stock bajo";
            } 
            else {
                clase = "table-success";
                estado = "✅ Disponible";
            }

            tabla += `
            <tr class="${clase}">
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.stock}</td>
                <td>${estado}</td>
             <td>
                <button class="btn btn-sm btn-primary"
                 onclick="vender('${p._id}')">
                 Vender
                 </button>
            </td>
            </tr>`;
        });

        // MOSTRAR TABLA
        document.getElementById("tabla").innerHTML = tabla;

    } catch (error) {

        console.error(error);

        document.getElementById("tabla").innerHTML = `
        <tr>
            <td colspan="5">
                Error al cargar productos
            </td>
        </tr>`;
    }
}

// CARGAR AUTOMÁTICAMENTE AL ABRIR
window.onload = cargarProductos;