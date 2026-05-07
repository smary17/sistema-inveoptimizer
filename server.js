const express = require('express');
const Datastore = require('@seald-io/nedb');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

/* =========================
   BASES DE DATOS
========================= */
const productos = new Datastore({
    filename: './db/productos.db',
    autoload: true
});

const movimientos = new Datastore({
    filename: './db/movimientos.db',
    autoload: true
});

const auditoria = new Datastore({
    filename: './db/auditoria.db',
    autoload: true
});

/* =========================
   20 PRODUCTOS PILOTO
========================= */
const productosIniciales = [
    { nombre: "Coca Cola 600ml", categoria: "Bebidas", costo: 10, venta: 15, stock: 50, stock_min: 10 },
    { nombre: "Pepsi 600ml", categoria: "Bebidas", costo: 9, venta: 14, stock: 40, stock_min: 10 },
    { nombre: "Sabritas Original", categoria: "Botanas", costo: 12, venta: 18, stock: 30, stock_min: 5 },
    { nombre: "Doritos Nacho", categoria: "Botanas", costo: 12, venta: 18, stock: 25, stock_min: 5 },
    { nombre: "Galletas Oreo", categoria: "Galletas", costo: 14, venta: 20, stock: 35, stock_min: 8 },
    { nombre: "Galletas Marías", categoria: "Galletas", costo: 10, venta: 15, stock: 40, stock_min: 8 },
    { nombre: "Leche Lala 1L", categoria: "Lácteos", costo: 18, venta: 25, stock: 20, stock_min: 5 },
    { nombre: "Yogurt Danone", categoria: "Lácteos", costo: 8, venta: 12, stock: 30, stock_min: 6 },
    { nombre: "Pan Bimbo", categoria: "Panadería", costo: 28, venta: 38, stock: 15, stock_min: 5 },
    { nombre: "Huevo 12 piezas", categoria: "Abarrotes", costo: 30, venta: 42, stock: 20, stock_min: 5 },
    { nombre: "Arroz 1kg", categoria: "Abarrotes", costo: 16, venta: 22, stock: 25, stock_min: 6 },
    { nombre: "Frijol 1kg", categoria: "Abarrotes", costo: 18, venta: 26, stock: 25, stock_min: 6 },
    { nombre: "Azúcar 1kg", categoria: "Abarrotes", costo: 17, venta: 24, stock: 20, stock_min: 6 },
    { nombre: "Sal 1kg", categoria: "Abarrotes", costo: 8, venta: 12, stock: 30, stock_min: 8 },
    { nombre: "Atún Lata", categoria: "Enlatados", costo: 10, venta: 16, stock: 35, stock_min: 10 },
    { nombre: "Sopa Instantánea", categoria: "Enlatados", costo: 6, venta: 10, stock: 40, stock_min: 10 },
    { nombre: "Agua 1L", categoria: "Bebidas", costo: 7, venta: 12, stock: 50, stock_min: 15 },
    { nombre: "Jugo del Valle", categoria: "Bebidas", costo: 11, venta: 17, stock: 30, stock_min: 8 },
    { nombre: "Chocolate Carlos V", categoria: "Dulces", costo: 9, venta: 14, stock: 45, stock_min: 10 },
    { nombre: "Chicle Trident", categoria: "Dulces", costo: 5, venta: 10, stock: 50, stock_min: 15 }
];

/* =========================
   CARGAR PRODUCTOS AUTOMÁTICAMENTE
========================= */
productos.count({}, (err, total) => {

    if (err) {
        console.log(err);
        return;
    }

    if (total === 0) {
        productos.insert(productosIniciales, (err, docs) => {
            if (!err) {
                console.log("✅ 20 productos piloto cargados");
            }
        });
    } else {
        console.log("📦 Ya existen productos en la base");
    }
});

/* =========================
   CRUD PRODUCTOS
========================= */

// AGREGAR
app.post('/productos', (req, res) => {

    const { nombre, categoria, costo, venta, stock, stock_min } = req.body;

    if (!nombre || costo < 0 || venta < 0 || stock < 0) {
        return res.status(400).send("Datos inválidos");
    }

    productos.insert(req.body, (err, doc) => {
        if (err) return res.status(500).send(err);
        res.send(doc);
    });
});

// MOSTRAR TODOS
app.get('/productos', (req, res) => {

    productos.find({}, (err, docs) => {
        if (err) return res.status(500).send(err);

        docs.sort((a, b) => a.nombre.localeCompare(b.nombre));
        res.json(docs);
    });

});

/* =========================
   VENTAS MEJORADAS
========================= */
app.put('/vender/:id', (req, res) => {
    const id = req.params.id;
    const cantidad = req.body.cantidad || 1;

    productos.findOne({ _id: id }, (err, prod) => {
        if (err) return res.status(500).send(err);
        if (!prod) return res.status(404).send("Producto no encontrado");
        if (cantidad <= 0) return res.status(400).send("Cantidad inválida");
        if (prod.stock < cantidad) return res.status(400).send("Stock insuficiente");

        // Calculamos la ganancia real: (Precio Venta - Costo) * Cantidad
        const gananciaObtenida = (prod.venta - prod.costo) * cantidad;

        // DESCONTAR STOCK
        productos.update(
            { _id: id },
            { $inc: { stock: -cantidad } },
            {},
            (err) => {
                if (err) return res.status(500).send(err);

                // REGISTRAR MOVIMIENTO CON NOMBRE Y GANANCIA
                movimientos.insert({
                    producto_id: id,
                    producto_nombre: prod.nombre, // Guardamos el nombre
                    tipo: "venta",
                    cantidad: cantidad,
                    ganancia: gananciaObtenida, // Guardamos la ganancia
                    fecha: new Date()
                });

                res.send("Venta realizada correctamente");
            }
        );
    });
});

/* =========================
   RESTOCK (REABASTECER)
========================= */
app.put('/restock/:id', (req, res) => {
    const id = req.params.id;
    const cantidad = req.body.cantidad;

    if (!cantidad || cantidad <= 0) {
        return res.status(400).send("Cantidad inválida");
    }

    // Buscamos el producto para registrar su nombre
    productos.findOne({ _id: id }, (err, prod) => {
        if (err || !prod) return res.status(404).send("Producto no encontrado");

        productos.update(
            { _id: id },
            { $inc: { stock: cantidad } },
            {},
            (err) => {
                if (err) return res.status(500).send(err);

                // REGISTRAR MOVIMIENTO
                movimientos.insert({
                    producto_id: id,
                    producto_nombre: prod.nombre,
                    tipo: "entrada",
                    cantidad: cantidad,
                    fecha: new Date()
                });

                res.send("Stock actualizado correctamente");
            }
        );
    });
});

/* =========================
   GANANCIAS
========================= */
app.get('/ganancias', (req, res) => {
    movimientos.find({ tipo: "venta" }, (err, docs) => {
        if (err) return res.status(500).send(err);

        let total = 0;
        docs.forEach(m => {
            // Sumamos la ganancia real calculada en cada venta
            total += m.ganancia || 0; 
        });

        res.json({ total });
    });
});

/* =========================
   MOVIMIENTOS
========================= */
app.get('/movimientos', (req, res) => {

    movimientos.find({}, (err, docs) => {

        if (err) {
            return res.status(500).send(err);
        }

        res.json(docs);
    });
});
/* =========================
   AUDITORIA
========================= */
app.post('/auditoria', (req, res) => {

    const { producto_id, stock_fisico } = req.body;

    productos.findOne({ _id: producto_id }, (err, prod) => {

        if (!prod) {
            return res.status(404).send("Producto no encontrado");
        }

        const diferencia = prod.stock - stock_fisico;
        const merma = (diferencia / prod.stock) * 100;

        auditoria.insert({
            producto_id,
            stock_sistema: prod.stock,
            stock_fisico,
            diferencia,
            porcentaje_merma: merma,
            fecha: new Date()
        });

        res.send({
            diferencia,
            merma
        });

    });

});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});