// =========================
// SHOES PRODUCTS
// =========================

const products = [
    {
        id: 1,
        name: "Shoes 1",
        price: 399,
        image: "images/image1.jpg",
        description: "Comfortable and stylish for everyday wear."
    },
    {
        id: 2,
        name: "Shoes 2",
        price: 475,
        image: "images/image2.jpg",
        description: "Simple and comfortable for daily use."
    },
    {
        id: 3,
        name: "Shoes 3",
        price: 550,
        image: "images/image3.jpg",
        description: "Lightweight shoes for easy movement."
    },
    {
        id: 4,
        name: "Shoes 4",
        price: 625,
        image: "images/image4.jpg",
        description: "Stylish and comfortable for any occasion."
    },
    {
        id: 5,
        name: "Shoes 5",
        price: 750,
        image: "images/image5.jpg",
        description: "Trendy shoes made for everyday comfort."
    }
];


// =========================
// STORAGE
// =========================

let cart =
    JSON.parse(
        localStorage.getItem("shoes_shop_cart")
    ) || [];

let currentUser =
    JSON.parse(
        localStorage.getItem("shoes_shop_user")
    ) || null;


// =========================
// SHOW SECTION
// =========================

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(function(section) {
            section.classList.remove("active");
        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }

    if (sectionId === "cart") {
        displayCart();
    }

    if (sectionId === "orders") {
        loadOrders();
    }
}


// =========================
// PRODUCTS
// =========================

function displayProducts() {

    const productList =
        document.getElementById(
            "productsContainer"
        );

    if (!productList) return;

    productList.innerHTML = "";

    products.forEach(function(product) {

        const card =
            document.createElement("div");

        card.className =
            "product-card";

        card.innerHTML = `

            <img
                src="${product.image}"
                alt="${product.name}"
            >

            <h3>
                ${product.name}
            </h3>

            <p>
                ${product.description}
            </p>

            <div class="product-price">
                ₱${product.price.toFixed(2)}
            </div>

            <label
                style="
                    display:block;
                    margin:12px 0 6px;
                    font-weight:bold;
                ">
                Shoe Size:
            </label>

            <select
                id="size-${product.id}"
                style="
                    width:100%;
                    padding:10px;
                    border-radius:8px;
                    border:1px solid #ccc;
                    margin-bottom:10px;
                ">

                <option value="">
                    Select Size
                </option>

                <option value="36">36</option>
                <option value="37">37</option>
                <option value="38">38</option>
                <option value="39">39</option>
                <option value="40">40</option>
                <option value="41">41</option>
                <option value="42">42</option>

            </select>

            <button
                onclick="viewProduct(${product.id})">
                View Product
            </button>

            <button
                onclick="addSelectedSize(${product.id})">
                Add to Cart
            </button>

        `;

        productList.appendChild(card);
    });
}


function addSelectedSize(id) {

    const sizeSelect =
        document.getElementById("size-" + id);

    if (!sizeSelect) return;

    const size = sizeSelect.value;

    if (!size) {
        alert("Please select a shoe size first.");
        return;
    }

    addToCart(id, size);
}


// =========================
// VIEW PRODUCT
// =========================

function viewProduct(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    alert(
        product.name +
        "\n\n" +
        product.description +
        "\n\nPrice: ₱" +
        product.price.toFixed(2)
    );
}


// =========================
// ADD TO CART
// =========================

function addToCart(id, size) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    if (!size) {
        alert("Please select a shoe size first.");
        return;
    }

    const existing =
        cart.find(
            item =>
                item.id === id &&
                item.size === size
        );

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: size,
            quantity: 1,
            selected: true
        });
    }

    saveCart();
    displayCart();

    alert(
        product.name +
        " Size " +
        size +
        " added to cart!"
    );
}


// =========================
// DISPLAY CART
// =========================

function displayCart() {

    const cartContainer =
        document.getElementById(
            "cartContainer"
        );

    const cartTotal =
        document.getElementById(
            "cartTotal"
        );

    const cartCount =
        document.getElementById(
            "cartCount"
        );

    if (!cartContainer) return;

    if (cartCount) {

        let count = 0;

        cart.forEach(function(item) {
            count += Number(item.quantity);
        });

        cartCount.textContent = count;
    }

    if (cart.length === 0) {

        cartContainer.innerHTML =
            "<p>Your cart is empty.</p>";

        if (cartTotal) {
            cartTotal.textContent = "0.00";
        }

        return;
    }

    let selectedTotal = 0;

    cartContainer.innerHTML = "";

    cart.forEach(function(item, index) {

        const subtotal =
            Number(item.price) *
            Number(item.quantity);

        if (item.selected) {
            selectedTotal += subtotal;
        }

        const row =
            document.createElement("div");

        row.className =
            "cart-item";

        row.innerHTML = `

            <div class="cart-item-left">

                <input
                    type="checkbox"
                    class="cart-checkbox"
                    ${item.selected ? "checked" : ""}
                    onchange="
                        toggleCartItem(${index})
                    "
                >

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div>

                    <strong>
                        ${item.name}
                    </strong>

                    <p>
                        Size: ${item.size}
                    </p>

                    <p>
                        ₱${Number(
                            item.price
                        ).toFixed(2)}
                    </p>

                    <div class="quantity-controls">

                        <button
                            onclick="
                                decreaseQuantity(${index})
                            ">
                            -
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            onclick="
                                increaseQuantity(${index})
                            ">
                            +
                        </button>

                    </div>

                </div>

            </div>

            <div>

                <strong>
                    ₱${subtotal.toFixed(2)}
                </strong>

                <br><br>

                <button
                    class="remove-btn"
                    onclick="
                        removeFromCart(${index})
                    ">
                    Remove
                </button>

            </div>

        `;

        cartContainer.appendChild(row);
    });

    if (cartTotal) {
        cartTotal.textContent =
            selectedTotal.toFixed(2);
    }
}


// =========================
// TOGGLE CART ITEM
// =========================

function toggleCartItem(index) {

    if (!cart[index]) return;

    cart[index].selected =
        !cart[index].selected;

    saveCart();

    displayCart();
}


// =========================
// QUANTITY
// =========================

function increaseQuantity(index) {

    if (!cart[index]) return;

    cart[index].quantity++;

    saveCart();

    displayCart();
}


function decreaseQuantity(index) {

    if (!cart[index]) return;

    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    } else {

        cart.splice(index, 1);
    }

    saveCart();

    displayCart();
}


// =========================
// REMOVE
// =========================

function removeFromCart(index) {

    if (!cart[index]) return;

    cart.splice(index, 1);

    saveCart();

    displayCart();
}


// =========================
// SAVE CART
// =========================

function saveCart() {

    localStorage.setItem(
        "shoes_shop_cart",
        JSON.stringify(cart)
    );
}


// =========================
// CHECKOUT
// =========================

function checkout() {

    if (!currentUser) {

        alert(
            "Please login first before checkout."
        );

        showSection("login");

        return;
    }

    const selectedItems =
        cart.filter(
            item => item.selected
        );

    if (selectedItems.length === 0) {

        alert(
            "Please select at least one item."
        );

        return;
    }

    let total = 0;

    selectedItems.forEach(function(item) {

        total +=
            Number(item.price) *
            Number(item.quantity);

    });

    localStorage.setItem(
        "shoes_shop_checkout",
        JSON.stringify({
            items: selectedItems,
            total: total
        })
    );

    showPaymentModal();
}


// =========================
// PAYMENT MODAL
// =========================

function showPaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (modal) {
        modal.style.display = "flex";
    }
}


function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (modal) {
        modal.style.display = "none";
    }
}


// =========================
// PAYMAYA
// =========================

async function startPayMayaPayment() {

    closePaymentModal();

    const checkoutData =
        JSON.parse(
            localStorage.getItem(
                "shoes_shop_checkout"
            )
        );

    if (!checkoutData) {

        alert(
            "Checkout information not found."
        );

        return;
    }

    if (!currentUser) {

        alert(
            "Please login first."
        );

        showSection("login");

        return;
    }

    try {

        const response =
            await fetch(
                "/api/checkout",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            cart:
                                checkoutData.items,

                            userId:
                                currentUser.id

                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to start Maya payment."
            );

            return;
        }

        localStorage.setItem(
            "shoes_shop_pending_order",
            JSON.stringify({

                orderNumber:
                    data.orderNumber,

                checkoutId:
                    data.checkoutId

            })
        );

        window.location.href =
            data.redirectUrl;

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );
    }
}


// =========================
// COD
// =========================

async function placeCODOrder() {

    closePaymentModal();

    const checkoutData =
        JSON.parse(
            localStorage.getItem(
                "shoes_shop_checkout"
            )
        );

    if (!checkoutData) {

        alert(
            "Checkout information not found."
        );

        return;
    }

    if (!currentUser) {

        alert(
            "Please login first."
        );

        showSection("login");

        return;
    }

    try {

        const response =
            await fetch(
                "/api/orders/cod",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            cart:
                                checkoutData.items,

                            userId:
                                currentUser.id

                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Unable to place COD order."
            );

            return;
        }

        removeSelectedItems();

        localStorage.removeItem(
            "shoes_shop_checkout"
        );

        alert(
            "Order placed successfully!"
        );

        await loadOrders();

        displayCart();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );
    }
}


// =========================
// REMOVE SELECTED
// =========================

function removeSelectedItems() {

    cart =
        cart.filter(
            item => !item.selected
        );

    saveCart();
}

// =========================
// LOGIN
// =========================

async function login() {
    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {
        const response =
            await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.message ||
                "Login failed."
            );
            return;
        }

        currentUser = data.user;

        localStorage.setItem(
            "shoes_shop_user",
            JSON.stringify(currentUser)
        );

        updateAccountUI();

        displayProducts();
        displayCart();
        await loadOrders();

        showSection("products");

        document.getElementById(
            "loginEmail"
        ).value = "";

        document.getElementById(
            "loginPassword"
        ).value = "";

    } catch (error) {
        console.error(error);
        alert("Unable to connect to server.");
    }
}


// =========================
// SIGN UP
// =========================

async function signup() {
    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        alert("Please complete all fields.");
        return;
    }

    try {
        const response =
            await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.message ||
                "Sign up failed."
            );
            return;
        }

        alert(
            data.message ||
            "Registration successful!"
        );

        document.getElementById(
            "signupName"
        ).value = "";

        document.getElementById(
            "signupEmail"
        ).value = "";

        document.getElementById(
            "signupPassword"
        ).value = "";

        showSection("login");

    } catch (error) {
        console.error(error);
        alert("Unable to connect to server.");
    }
}


// =========================
// LOGOUT
// =========================

function logout() {
    currentUser = null;

    localStorage.removeItem(
        "shoes_shop_user"
    );

    cart = [];

    localStorage.removeItem(
        "shoes_shop_cart"
    );

    localStorage.removeItem(
        "shoes_shop_checkout"
    );

    localStorage.removeItem(
        "shoes_shop_pending_order"
    );

    closePaymentModal();

    const productList =
        document.getElementById(
            "productsContainer"
        );

    if (productList) {
        productList.innerHTML = "";
    }

    const cartContainer =
        document.getElementById(
            "cartContainer"
        );

    if (cartContainer) {
        cartContainer.innerHTML =
            "<p>Please login to see your cart.</p>";
    }

    const orderList =
        document.getElementById(
            "ordersContainer"
        );

    if (orderList) {
        orderList.innerHTML =
            "<p>Please login to see your orders.</p>";
    }

    updateAccountUI();

    showSection("login");
}


// =========================
// ACCOUNT UI
// =========================

function updateAccountUI() {
    const loginNav =
        document.getElementById("loginNav");

    const logoutNav =
        document.getElementById("logoutNav");

    if (currentUser) {

        if (loginNav) {
            loginNav.style.display = "none";
        }

        if (logoutNav) {
            logoutNav.style.display =
                "inline-block";
        }

    } else {

        if (loginNav) {
            loginNav.style.display =
                "inline-block";
        }

        if (logoutNav) {
            logoutNav.style.display = "none";
        }
    }
}


// =========================
// ORDERS
// =========================

async function loadOrders() {
    if (!currentUser) {
        const container =
            document.getElementById(
                "ordersContainer"
            );

        if (container) {
            container.innerHTML =
                "<p>Please login to see your orders.</p>";
        }

        return;
    }

    try {
        const response =
            await fetch(
                 `/api/orders/user/${currentUser.id}`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load orders."
            );
        }

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message ||
                "Unable to load orders."
            );
        }

        displayOrders(
            data.orders
        );

    } catch (error) {
        console.error(
            "LOAD ORDERS ERROR:",
            error
        );

        const container =
            document.getElementById(
                "ordersContainer"
            );

        if (container) {
            container.innerHTML =
                "<p>Unable to load orders.</p>";
        }
    }
}



// =========================
// DISPLAY ORDERS
// =========================

function displayOrders(orders) {
    const container =
        document.getElementById(
            "ordersContainer"
        );

    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML =
            "<p>No orders yet.</p>";
        return;
    }

    container.innerHTML =
        orders.map(order => {

            return `
                <div class="order-card">

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        <strong>
                            Order Date:
                        </strong>
                        ${order.created_at || ""}
                    </p>

                    <p>
                        <strong>
                            Payment:
                        </strong>
                        ${order.payment_method || ""}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>
                        ${order.order_status || order.status || ""}

                    </p>

                    <p>
    <strong>
        Total:
    </strong>
    ₱${Number(
        order.total || 0
    ).toFixed(2)}
</p>


                </div>
            `;

        }).join("");
}


// =========================
// SUCCESSFUL MAYA PAYMENT
// =========================

async function finishSuccessfulPayment() {
    const pendingOrder =
        localStorage.getItem(
            "shoes_shop_pending_order"
        );

    if (!pendingOrder) {
        return;
    }

    try {
        const orderData =
            JSON.parse(pendingOrder);

        const response =
            await fetch(
                "/api/orders/confirm-payment",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        orderData
                    )
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.message ||
                "Payment confirmation failed."
            );
            return;
        }
removeSelectedItems();

localStorage.removeItem(
    "shoes_shop_checkout"
);

localStorage.removeItem(
    "shoes_shop_pending_order"
);

displayCart();

await loadOrders();

alert(
    "Payment successful! Your order has been placed."
);

showSection("orders");

    } catch (error) {
        console.error(error);
        alert(
            "Unable to confirm payment."
        );
    }
}


// =========================
// PAGE START
// =========================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "SCRIPT.JS IS WORKING"
        );

        updateAccountUI();

        if (!currentUser) {

            const productList =
                document.getElementById(
                    "productsContainer"
                );

            if (productList) {
                productList.innerHTML = "";
            }

            const cartContainer =
                document.getElementById(
                    "cartContainer"
                );

            if (cartContainer) {
                cartContainer.innerHTML =
                    "<p>Please login to see your cart.</p>";
            }

            const orderList =
                document.getElementById(
                    "ordersContainer"
                );

            if (orderList) {
                orderList.innerHTML =
                    "<p>Please login to see your orders.</p>";
            }

            showSection("login");

        } else {

            displayProducts();

            displayCart();

            await loadOrders();

            showSection("products");
        }

        const params =
            new URLSearchParams(
                window.location.search
            );

        const paymentResult =
            params.get("payment");

        if (
            paymentResult === "success" &&
            currentUser
        ) {
            await finishSuccessfulPayment();
        }
    }
);