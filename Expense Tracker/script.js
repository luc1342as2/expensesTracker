let transactions = [];

function updateUI() {
    const balance = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    document.getElementById("balance").textContent = `$${balance.toFixed(2)}`;
    document.getElementById("income").textContent = `$${income.toFixed(2)}`;
    document.getElementById("expense").textContent = `$${expense.toFixed(2)}`;

    const history = document.getElementById("transaction-history");
    history.innerHTML = "";

    transactions.forEach((transaction, index) => {
        const li = document.createElement("li");
        li.className = transaction.amount > 0 ? "income" : "expense";
        li.innerHTML = `
            ${transaction.name} <span>${transaction.amount > 0 ? "+" : "-"}$${Math.abs(transaction.amount).toFixed(2)}</span>
            <button onclick="deleteTransaction(${index})" class="delete-btn">x</button>
        `;
        history.appendChild(li);
    });
}

function addTransaction(event) {
    event.preventDefault();

    const name = document.getElementById("transaction-name").value;
    const amount = parseFloat(document.getElementById("transaction-amount").value);

    if (name && !isNaN(amount)) {
        transactions.push({ name, amount });
        document.getElementById("transaction-form").reset();
        updateUI();
    }
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    updateUI();
}

document.getElementById("transaction-form").addEventListener("submit", addTransaction);

updateUI();
