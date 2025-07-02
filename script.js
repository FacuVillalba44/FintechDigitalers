// script.js

// URL base de tu API de Node.js
const API_BASE_URL = 'http://localhost:3000/api'; // Asegúrate de que coincida con el puerto de tu servidor Node.js

// --- Elementos del DOM ---
const messageBox = document.getElementById('messageBox');

// Crear Cuenta
const clientNameInput = document.getElementById('clientNameInput');
const initialBalanceInput = document.getElementById('initialBalanceInput');
const createAccountBtn = document.getElementById('createAccountBtn');
const newAccountIdDisplay = document.getElementById('newAccountId');

// Gestión de Cuentas y Movimientos
const accountIdInput = document.getElementById('accountIdInput');
const loadAccountBtn = document.getElementById('loadAccountBtn');
const accountDetailsDiv = document.getElementById('accountDetails');
const displayAccountId = document.getElementById('displayAccountId');
const displayClientName = document.getElementById('displayClientName');
const displayBalance = document.getElementById('displayBalance');
const transactionSection = document.getElementById('transactionSection');
const amountInput = document.getElementById('amountInput');
const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

// Historial de Movimientos
const transactionHistoryDiv = document.getElementById('transactionHistory');
const transactionList = document.getElementById('transactionList');
const noTransactionsMessage = document.getElementById('noTransactionsMessage');

let currentAccountId = null; // Para almacenar el ID de la cuenta actualmente cargada

// --- Funciones de Utilidad ---

// Función para mostrar mensajes al usuario
function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = `mt-4 p-3 rounded-lg text-center text-sm block ${type === 'success' ? 'message-success' : 'message-error'}`;
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// Función para formatear la fecha
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// --- Funciones de Interacción con el Backend ---

// Crear una nueva cuenta
async function createAccount() {
    const clientName = clientNameInput.value.trim();
    const initialBalance = parseFloat(initialBalanceInput.value);

    if (!clientName) {
        showMessage('Por favor, ingresa el nombre del cliente.', 'error');
        return;
    }
    if (isNaN(initialBalance) || initialBalance < 0) {
        showMessage('Por favor, ingresa un saldo inicial válido (número positivo).', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clientName, initialBalance }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
        }

        const newAccount = await response.json();
        showMessage(`Cuenta creada con éxito para ${newAccount.clientName}!`, 'success');
        newAccountIdDisplay.textContent = `ID de Cuenta: ${newAccount.id}`;
        newAccountIdDisplay.classList.remove('hidden');
        clientNameInput.value = '';
        initialBalanceInput.value = '0';
    } catch (error) {
        console.error('Error al crear la cuenta:', error);
        showMessage(`Error al crear la cuenta: ${error.message}`, 'error');
    }
}

// Cargar detalles de una cuenta
async function loadAccount() {
    const accountId = accountIdInput.value.trim();
    if (!accountId) {
        showMessage('Por favor, ingresa un ID de cuenta.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
        }

        const account = await response.json();
        currentAccountId = account.id; // Almacena el ID de la cuenta cargada
        displayAccountDetails(account);
        fetchTransactions(account.id); // Cargar historial de transacciones
        showMessage('Cuenta cargada con éxito!', 'success');
    } catch (error) {
        console.error('Error al cargar la cuenta:', error);
        showMessage(`Error al cargar la cuenta: ${error.message}`, 'error');
        hideAccountDetails();
    }
}

// Mostrar los detalles de la cuenta en la UI
function displayAccountDetails(account) {
    displayAccountId.textContent = account.id;
    displayClientName.textContent = account.clientName;
    displayBalance.textContent = account.balance.toFixed(2); // Formatear a 2 decimales
    accountDetailsDiv.classList.remove('hidden');
    transactionSection.classList.remove('hidden');
}

// Ocultar los detalles de la cuenta en la UI
function hideAccountDetails() {
    accountDetailsDiv.classList.add('hidden');
    transactionSection.classList.add('hidden');
    transactionList.innerHTML = '';
    noTransactionsMessage.classList.remove('hidden');
    currentAccountId = null;
}

// Realizar un depósito o retiro
async function performTransaction(type) {
    if (!currentAccountId) {
        showMessage('Primero carga una cuenta para realizar movimientos.', 'error');
        return;
    }

    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        showMessage('Por favor, ingresa un monto válido (número positivo).', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountId: currentAccountId, amount }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
        }

        const transaction = await response.json();
        showMessage(`Movimiento de ${type} realizado con éxito!`, 'success');
        amountInput.value = ''; // Limpiar el input de monto
        // Actualizar el saldo en la UI (podríamos recargar la cuenta o actualizar directamente)
        displayBalance.textContent = transaction.currentBalance.toFixed(2);
        fetchTransactions(currentAccountId); // Recargar historial de transacciones
    } catch (error) {
        console.error(`Error al realizar ${type}:`, error);
        showMessage(`Error al realizar ${type}: ${error.message}`, 'error');
    }
}

// Obtener historial de transacciones
async function fetchTransactions(accountId) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${accountId}`);
        if (!response.ok) {
            // Si no hay transacciones, el backend devuelve 404, lo manejamos aquí
            if (response.status === 404) {
                displayTransactions([]); // Mostrar lista vacía
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}`);
        }

        const transactions = await response.json();
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        showMessage(`Error al cargar transacciones: ${error.message}`, 'error');
        displayTransactions([]); // Mostrar lista vacía en caso de error
    }
}

// Mostrar transacciones en la UI
function displayTransactions(transactions) {
    transactionList.innerHTML = ''; // Limpiar la lista actual
    if (transactions.length === 0) {
        noTransactionsMessage.classList.remove('hidden');
        return;
    } else {
        noTransactionsMessage.classList.add('hidden');
    }

    transactions.forEach(tx => {
        const listItem = document.createElement('li');
        listItem.className = `transaction-item`;
        listItem.innerHTML = `
            <div class="transaction-details">
                <span class="transaction-type ${tx.type}">${tx.type}</span>
                <span class="transaction-date">${formatDate(tx.timestamp)}</span>
            </div>
            <span class="transaction-amount ${tx.type}">$${tx.amount.toFixed(2)}</span>
        `;
        transactionList.appendChild(listItem);
    });
}

// --- Event Listeners ---
createAccountBtn.addEventListener('click', createAccount);
loadAccountBtn.addEventListener('click', loadAccount);
depositBtn.addEventListener('click', () => performTransaction('deposit'));
withdrawBtn.addEventListener('click', () => performTransaction('withdraw'));

// Permitir cargar cuenta con Enter en el input
accountIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadAccount();
    }
});

// Permitir realizar transacción con Enter en el input de monto
amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        // Por defecto, si se presiona Enter, que sea un depósito
        performTransaction('deposit');
    }
});

// Inicializar: ocultar secciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    hideAccountDetails();
});