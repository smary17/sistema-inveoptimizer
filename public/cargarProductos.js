async function cargarProductos() {

    try {

        const res = await fetch('/productos');

        if (!res.ok) {
            throw new Error("No se pudieron cargar los productos");
        }

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
            tabla += `
            <tr>
                <td colspan="6">No hay productos registrados</td>
            </tr>`;
        }

        data.forEach(p => {

            let clase = "";
            let estado =  "";

            if (p.stock === 0) {
                clase = "table-danger";
                estado = "❌ Agotado";
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

                <td style="font-weight:bold;">
                    ${estado}
                </td>

                <td>
                    <div class="d-flex justify-content-center gap-2">

                        <input
                        type="number"
                        min="1"
                        value="1"
                          id="cant-${p._id}"
                        class="form-control"
                        style="width:80px;">

                        <button
                        class="btn btn-warning btn-sm"
                        onclick="vender('${p._id}')">
                        🛒
                        </button>

                    </div>
                </td>

                <td>
                    <button
                    class="btn btn-success btn-sm"
                    onclick="abrirRestock('${p._id}')">
                    ➕
                    </button>
                </td>

            </tr>`;
        });

        document.getElementById("tabla").innerHTML = tabla;

    }
    catch (error) {

        console.error(error);
          document.getElementById("tabla").innerHTML = `
        <tr>
            <td colspan="6">Error al cargar productos</td>
        </tr>`;
    }
}

window.onload = () => {
    cargarProductos();
    cargarGanancias();
    cargarMovimientos();
};