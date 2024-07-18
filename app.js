let tg = window.Telegram.WebApp;

tg.expand();
tg.MainButton.textColor = '#FFFFFF';
tg.MainButton.color = '#2cab37';

let products = [];
let cart = new Map();

function loadProducts() {
    fetch('http://localhost:8080/api/products') 
        .then(response => response.json())
        .then(data => {
            products = data;
            displayProducts();
        })
        .catch(error => console.error('Error fetching products:', error));
}

function displayProducts() {
    const productContainer = document.getElementById('productContainer');
    productContainer.innerHTML = '';

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('item');

        const productImage = document.createElement('img');
        productImage.src = product.pathOfPhoto;
        productImage.classList.add('img');

        const productName = document.createElement('p');
        productName.innerText = product.name;

        const productPrice = document.createElement('p');
        productPrice.innerText = `${product.price} UAH`;

        const quantityContainer = document.createElement('div');
        quantityContainer.id = `quantity-container-${product.productId}`;
        quantityContainer.classList.add('quantity-container');

        if (cart.has(product.productId)) {
            createQuantityControls(quantityContainer, product.productId);
        } else {
            const addButton = document.createElement('button');
            addButton.classList.add('btn');
            addButton.innerText = 'ADD';
            addButton.onclick = () => addProduct(product.productId);
            quantityContainer.appendChild(addButton);
        }

        productItem.appendChild(productImage);
        productItem.appendChild(productName);
        productItem.appendChild(productPrice);
        productItem.appendChild(quantityContainer);
        productContainer.appendChild(productItem);
    });
}

function addProduct(productId) {
    cart.set(productId, 1);
    updateDisplay(productId);
    updateMainButton();
}

function createQuantityControls(container, productId) {
    const minusButton = document.createElement('button');
    minusButton.classList.add('btn');
    minusButton.innerText = '-';
    minusButton.onclick = () => updateQuantity(productId, -1);

    const quantityDisplay = document.createElement('span');
    quantityDisplay.id = `quantity-${productId}`;
    quantityDisplay.innerText = cart.get(productId) || 1;

    const plusButton = document.createElement('button');
    plusButton.classList.add('btn');
    plusButton.innerText = '+';
    plusButton.onclick = () => updateQuantity(productId, 1);

    container.appendChild(minusButton);
    container.appendChild(quantityDisplay);
    container.appendChild(plusButton);
}

function updateQuantity(productId, change) {
    if (cart.has(productId)) {
        let quantity = cart.get(productId) + change;
        if (quantity <= 0) {
            cart.delete(productId);
        } else {
            cart.set(productId, quantity);
        }
    } else if (change > 0) {
        cart.set(productId, change);
    }
    updateDisplay(productId);
    updateMainButton();
}

function updateDisplay(productId) {
    const quantityContainer = document.getElementById(`quantity-container-${productId}`);
    quantityContainer.innerHTML = '';
    if (cart.has(productId)) {
        createQuantityControls(quantityContainer, productId);
    } else {
        const addButton = document.createElement('button');
        addButton.classList.add('btn');
        addButton.innerText = 'ADD';
        addButton.onclick = () => addProduct(productId);
        quantityContainer.appendChild(addButton);
    }
}

function updateMainButton() {
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    if (cart.size > 0) {
        submitOrderBtn.style.display = 'block';
        tg.MainButton.setText('Submit Order');
        tg.MainButton.show();
    } else {
        submitOrderBtn.style.display = 'none';
        tg.MainButton.hide();
    }
}

document.getElementById('submitOrderBtn').addEventListener('click', function() {
    const order = {
        chatId: tg.initDataUnsafe.user.id,
        productsId: Array.from(cart.entries()).map(([productId, quantity]) => {
            let obj = {};
            obj[productId] = quantity;
            return obj;
        }),
        localDateTime: new Date().toISOString()
    };

    fetch('http://localhost:8080/api/addOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Order submitted:', data);
        cart.clear();
        updateMainButton();
        loadProducts();
    })
    .catch(error => console.error('Error submitting order:', error));
});



document.addEventListener('DOMContentLoaded', loadProducts);

let usercard = document.getElementById('usercard');
let p = document.createElement('p');
p.innerText = `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name}`;
usercard.appendChild(p);
