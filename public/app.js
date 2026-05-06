async function agregarProducto() {

   const producto = {
        nombre: nombre.value,
        categoria: categoria.value,
        costo: parseFloat(costo.value),
        venta: parseFloat(venta.value),
        stock: parseInt(stock.value),
        stock_min: parseInt(stock_min.value)
    };

    if (!producto.nombre || producto.stock < 0 || producto.venta < 0 || producto.stock_min < 0) {
        alert("⚠️ Verifica los datos");
        return;
    }

    await fetch('/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
    });

    alert("✅ Producto agregado correctamente");

    cargarProductos();
}


// 👇 AGREGA ESTO AQUÍ
async function vender(id) {

    const cantidad = document.getElementById(`cant-${id}`).value;

    await fetch(`/vender/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: parseInt(cantidad) })
    });

    alert("✅ Venta realizada");

    cargarProductos();
}