function mostrarNotificacion(mensaje, tipo = "success") {

    const cantidad = document.getElementById("cantidadRestock").value;

    if (!cantidad || cantidad <= 0) {
        mostrarNotificacion("Cantidad inválida", "danger");
        return;
    }

    await fetch(`/restock/${productoRestock}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: parseInt(cantidad) })
    });

    mostrarNotificacion("📦 Stock actualizado correctamente");

    document.getElementById("cantidadRestock").value = "";

    cargarProductos();
    cargarMovimientos();
}

async function cargarGanancias() {

    const res = await fetch('/ganancias');
    const data = await res.json();

    document.getElementById("ganancias").innerText =
        `💰 Ganancia Total: $${data.total}`;
}

async function cargarMovimientos() {

    const res = await fetch('/movimientos');
    const data = await res.json();

    let tabla = `
    <tr>
        <th>Tipo</th>
        <th>Cantidad</th>
        <th>Fecha</th>
    </tr>`;

    data.reverse().forEach(m => {

        tabla += `
        <tr>
            <td>${m.tipo}</td>
            <td>${m.cantidad}</td>
            <td>${new Date(m.fecha).toLocaleString()}</td>
        </tr>`;
    });

    document.getElementById("tablaMovimientos").innerHTML = tabla;
}

function filtrarProductos() {

    const texto = document.getElementById("buscador")
        .value
        .toLowerCase();

    const filas = document.querySelectorAll("#tabla tr");

    filas.forEach((fila, i) => {

        if (i === 0) return;

        const contenido = fila.innerText.toLowerCase();

        fila.style.display = contenido.includes(texto)
            ? ""
            : "none";
    });
}