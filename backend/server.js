// server.js
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Para generar IDs únicos

const app = express();
const PORT = 3000; // Puedes cambiar el puerto si es necesario

// Middleware
app.use(cors()); // Habilita CORS para permitir solicitudes desde el frontend
app.use(express.json()); // Habilita el parseo de JSON en el cuerpo de las solicitudes

// --- Datos en memoria (para empezar, luego se puede integrar con Firestore) ---
let accounts = []; // Almacena las cuentas de los clientes
let transactions = []; // Almacena los movimientos de las cuentas

// --- Rutas de la API ---

// 1. Crear una nueva cuenta
app.post('/api/accounts', (req, res) => {
    const { clientName, initialBalance } = req.body;

    if (!clientName || initialBalance === undefined || initialBalance < 0) {
        return res.status(400).json({ message: 'Nombre de cliente y saldo inicial válido son requeridos.' });
    }

    const newAccount = {
        id: uuidv4(),
        clientName,
        balance: parseFloat(initialBalance), // Asegura que el saldo sea un número
        createdAt: new Date().toISOString()
    };
    accounts.push(newAccount);
    res.status(201).json(newAccount);
});

// 2. Obtener detalles de una cuenta por ID
app.get('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const account = accounts.find(acc => acc.id === id);

    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }
    res.json(account);
});

// 3. Obtener todas las cuentas (útil para administración o búsqueda)
app.get('/api/accounts', (req, res) => {
    res.json(accounts);
});


// 4. Realizar un depósito
app.post('/api/transactions/deposit', (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || amount === undefined || amount <= 0) {
        return res.status(400).json({ message: 'ID de cuenta y monto de depósito válido son requeridos.' });
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    account.balance += parseFloat(amount); // Suma el monto al saldo

    const newTransaction = {
        id: uuidv4(),
        accountId,
        type: 'deposito',
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        currentBalance: account.balance // Registrar el saldo después de la transacción
    };
    transactions.push(newTransaction);
    res.status(200).json(newTransaction);
});

// 5. Realizar un retiro
app.post('/api/transactions/withdraw', (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || amount === undefined || amount <= 0) {
        return res.status(400).json({ message: 'ID de cuenta y monto de retiro válido son requeridos.' });
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    if (account.balance < amount) {
        return res.status(400).json({ message: 'Saldo insuficiente.' });
    }

    account.balance -= parseFloat(amount); // Resta el monto al saldo

    const newTransaction = {
        id: uuidv4(),
        accountId,
        type: 'retiro',
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        currentBalance: account.balance // Registrar el saldo después de la transacción
    };
    transactions.push(newTransaction);
    res.status(200).json(newTransaction);
});

// 6. Obtener historial de movimientos de una cuenta
app.get('/api/transactions/:accountId', (req, res) => {
    const { accountId } = req.params;
    const accountTransactions = transactions.filter(tx => tx.accountId === accountId);

    if (accountTransactions.length === 0) {
        return res.status(404).json({ message: 'No se encontraron transacciones para esta cuenta.' });
    }
    // Ordenar las transacciones por fecha descendente
    accountTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(accountTransactions);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});
