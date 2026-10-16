const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

const PORT = process.env.PORT || 3000;

const BASE_URL = (
    process.env.BASE_URL || `http://localhost:${PORT}`
).replace(/\/+$/, '');


app.use(cors());

app.use(express.json());

app.use(
    express.static(
        __dirname + '/public'
    )
);

/* =========================
   MYSQL
========================= */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'shoes_shop',
    ssl: {
        minVersion: 'TLSv1.2'
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
console.log('Configured DB_HOST:', process.env.DB_HOST);

db.getConnection(function(err, connection) {
    if (err) {
        console.error(
            'TiDB Cloud connection failed:',
            err.message
        );
        return;
    }


    connection.query(
    'SELECT VERSION() AS version, DATABASE() AS db, @@hostname AS host, @@port AS port',
    function(err, results) {
        if (err) {
            console.error(
                'Database test failed:',
                err.message
            );
        } else {
            console.log('Database version:', results[0].version);
            console.log('Database:', results[0].db);
            console.log('Connected host:', results[0].host);
            console.log('Connected port:', results[0].port);
        }

        connection.release();
    }
    );

});

const promiseDb = db.promise();



/* =========================
   MAYA SANDBOX
========================= */

const MAYA_BASE_URL =
    'https://pg-sandbox.paymaya.com';

const MAYA_PUBLIC_KEY =
    'pk-eo4sL393CWU5KmveJUaW8V730TTei2zY8zE4dHJDxkF';


/* =========================
   REGISTER
========================= */

app.post(
    '/api/register',
    async function(req, res) {

        const {
            name,
            email,
            password
        } = req.body;

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                message:
                    'All fields are required.'

            });
        }

        try {

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            await promiseDb.query(
                `
                INSERT INTO users
                (name, email, password)
                VALUES (?, ?, ?)
                `,
                [
                    name,
                    email,
                    hashedPassword
                ]
            );

            res.status(201).json({

                success: true,

                message:
                    'Registration successful!'

            });

        } catch (error) {

            console.error(error);

            if (
                error.code ===
                'ER_DUP_ENTRY'
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        'This email is already registered.'

                });
            }

            res.status(500).json({

                success: false,

                message:
                    'Server error.'

            });
        }
    }
);


/* =========================
   LOGIN
========================= */

app.post(
    '/api/login',
    function(req, res) {

        const {
            email,
            password
        } = req.body;

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Email and password are required.'

            });
        }

        db.query(
            `
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email],
            async function(
                err,
                results
            ) {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        success: false,

                        message:
                            'Server error.'

                    });
                }

                if (
                    results.length === 0
                ) {

                    return res.status(401).json({

                        success: false,

                        message:
                            'Incorrect email or password.'

                    });
                }

                const user =
                    results[0];

                try {

                    const match =
                        await bcrypt.compare(
                            password,
                            user.password
                        );

                    if (!match) {

                        return res.status(401).json({

                            success: false,

                            message:
                                'Incorrect email or password.'

                        });
                    }

                    res.json({

                        success: true,

                        message:
                            'Login successful!',

                        user: {

                            id: user.id,

                            name: user.name,

                            email: user.email

                        }

                    });

                } catch (error) {

                    console.error(error);

                    res.status(500).json({

                        success: false,

                        message:
                            'Server error.'

                    });
                }
            }
        );
    }
);


/* =========================
   CREATE ORDER
========================= */

async function createOrder(
    cart,
    userId,
    paymentMethod,
    paymentStatus,
    orderStatus
) {

    if (
        !cart ||
        cart.length === 0
    ) {

        throw new Error(
            'Cart is empty.'
        );
    }

    if (!userId) {

        throw new Error(
            'User ID is required.'
        );
    }

    let total = 0;

    const items = [];

    for (
        const cartItem of cart
    ) {

        const quantity =
            Number(
                cartItem.quantity
            ) || 1;

        const price =
            Number(
                cartItem.price
            );

        if (
            !cartItem.id ||
            !cartItem.name ||
            !price
        ) {

            throw new Error(
                'Invalid cart item.'
            );
        }

        const subtotal =
            price * quantity;

        total += subtotal;

        items.push({

            product_id:
                Number(
                    cartItem.id
                ),

            product_name:
                cartItem.name,

            price:
                price,

            quantity:
                quantity,

            subtotal:
                subtotal

        });
    }


    const orderNumber =
        'PFP-' +
        Date.now() +
        '-' +
        crypto
            .randomBytes(3)
            .toString('hex')
            .toUpperCase();


    const [
        orderResult
    ] =
        await promiseDb.query(

            `
            INSERT INTO orders
            (
                user_id,
                order_number,
                payment_method,
                payment_status,
                order_status,
                total
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,

            [
                userId,

                orderNumber,

                paymentMethod,

                paymentStatus,

                orderStatus,

                total
            ]
        );


    const orderId =
        orderResult.insertId;


    for (
        const item of items
    ) {

        await promiseDb.query(

            `
            INSERT INTO order_items
            (
                order_id,
                product_id,
                product_name,
                price,
                quantity,
                subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,

            [
                orderId,

                item.product_id,

                item.product_name,

                item.price,

                item.quantity,

                item.subtotal
            ]
        );
    }


    return {

        id:
            orderId,

        orderNumber:
            orderNumber,

        total:
            total,

        items:
            items

    };
}


/* =========================
   PAYMAYA CHECKOUT
========================= */

app.post(
    '/api/checkout',
    async function(req, res) {

        const {
            cart,
            userId
        } = req.body;

        if (
            !cart ||
            cart.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Cart is empty.'

            });
        }

        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    'Please login first.'

            });
        }

        let order = null;

        try {

            order =
                await createOrder(

                    cart,

                    userId,

                    'PayMaya',

                    'Pending',

                    'To Pay'

                );


            const mayaItems =
                order.items.map(
                    function(item) {

                        return {

                            name:
                                item.product_name,

                            quantity:
                                String(
                                    item.quantity
                                ),

                            totalAmount: {

                                value:
                                    item.subtotal
                                        .toFixed(2)

                            }

                        };
                    }
                );


            const checkoutPayload = {
    totalAmount: {
        value: order.total.toFixed(2),
        currency: 'PHP'
    },

    items: mayaItems,

    requestReferenceNumber: order.orderNumber,

    redirectUrl: {
        success: `${BASE_URL}/success.html?payment=success&orderNumber=${encodeURIComponent(order.orderNumber)}`,
        failure: `${BASE_URL}/failure.html?payment=failure&orderNumber=${encodeURIComponent(order.orderNumber)}`,
        cancel: `${BASE_URL}/cancel.html?payment=cancel&orderNumber=${encodeURIComponent(order.orderNumber)}`
    }
};
            

            const encodedKey =
                Buffer
                    .from(
                        MAYA_PUBLIC_KEY + ':'
                    )
                    .toString('base64');


            const mayaResponse =
                await fetch(

                   `${MAYA_BASE_URL}/checkout/v1/checkouts`,

                    {

                        method:
                            'POST',

                        headers: {

                            'Content-Type':
                                'application/json',

                            'Accept':
                                'application/json',

                            'Authorization':
                                `Basic ${encodedKey}`

                        },

                        body:
                            JSON.stringify(
                                checkoutPayload
                            )

                    }

                );


            const mayaData =
                await mayaResponse.json();


            if (
                mayaResponse.ok &&
                mayaData.redirectUrl
            ) {

                const checkoutId =
                    mayaData.id ||
                    mayaData.checkoutId ||
                    mayaData.paymentId ||
                    null;


                return res.json({

                    success:
                        true,

                    redirectUrl:
                        mayaData.redirectUrl,

                    checkoutId:
                        checkoutId,

                    orderId:
                        order.id,

                    orderNumber:
                        order.orderNumber

                });
            }


            console.error(
                'MAYA STATUS:',
                mayaResponse.status
            );

            console.error(
                'MAYA ERROR:',
                mayaData
            );


            await promiseDb.query(

                `
                UPDATE orders
                SET
                    payment_status='Failed',
                    order_status='Cancelled'
                WHERE id=?
                `,

                [order.id]
            );


            return res.status(500).json({

                success: false,

                message:
                    mayaData.message ||
                    'Maya checkout failed.'

            });

        } catch (error) {

            console.error(
                'Maya checkout error:',
                error
            );


            if (order) {

                try {

                    await promiseDb.query(

                        `
                        UPDATE orders
                        SET
                            payment_status='Failed',
                            order_status='Cancelled'
                        WHERE id=?
                        `,

                        [order.id]
                    );

                } catch (dbError) {

                    console.error(
                        dbError
                    );
                }
            }


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    'Unable to connect to Maya.'

            });
        }
    }
);


/* =========================
   CONFIRM MAYA PAYMENT
========================= */

app.post(
    '/api/orders/confirm-payment',
    async function(req, res) {

        const {
            orderNumber,
            checkoutId
        } = req.body;


        if (!orderNumber) {

            return res.status(400).json({

                success: false,

                message:
                    'Order number is required.'

            });
        }


        try {

            const [
                orders
            ] =
                await promiseDb.query(

                    `
                    SELECT *
                    FROM orders
                    WHERE order_number=?
                    LIMIT 1
                    `,

                    [orderNumber]
                );


            if (
                orders.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Order not found.'

                });
            }


            const order =
                orders[0];


            if (
                order.payment_status ===
                'Paid'
            ) {

                return res.json({

                    success:
                        true,

                    message:
                        'Payment already confirmed.',

                    orderNumber:
                        orderNumber

                });
            }


            if (!checkoutId) {

                return res.status(400).json({

                    success: false,

                    message:
                        'Maya checkout ID is missing.'

                });
            }


            const encodedKey =
                Buffer
                    .from(
                        MAYA_PUBLIC_KEY + ':'
                    )
                    .toString('base64');


            const mayaStatusResponse =
                await fetch(

                    `${MAYA_BASE_URL}/payments/v1/payments/${encodeURIComponent(checkoutId)}/status`,

                    {

                        method:
                            'GET',

                        headers: {

                            'Accept':
                                'application/json',

                            'Authorization':
                                `Basic ${encodedKey}`

                        }

                    }

                );


            const mayaStatus =
                await mayaStatusResponse.json();


            console.log(
                'MAYA PAYMENT STATUS:',
                mayaStatus
            );


            const paymentStatus =
                mayaStatus.paymentStatus ||
                mayaStatus.status ||
                mayaStatus.state;


            if (
                paymentStatus ===
                'PAYMENT_SUCCESS'
            ) {

                await promiseDb.query(

                    `
                    UPDATE orders
                    SET
                        payment_status='Paid',
                        order_status='To Ship'
                    WHERE order_number=?
                    `,

                    [orderNumber]
                );


                return res.json({

                    success:
                        true,

                    message:
                        'Payment confirmed.',

                    orderNumber:
                        orderNumber

                });
            }


            return res.status(400).json({

                success: false,

                message:
                    'Maya payment is not successful yet. Current status: ' +
                    (
                        paymentStatus ||
                        'Unknown'
                    )

            });

        } catch (error) {

            console.error(
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Unable to confirm Maya payment.'

            });
        }
    }
);


/* =========================
   COD ORDER
========================= */

app.post(
    '/api/orders/cod',
    async function(req, res) {

        const {
            cart,
            userId
        } = req.body;


        if (
            !cart ||
            cart.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Cart is empty.'

            });
        }


        if (!userId) {

            return res.status(400).json({

                success: false,

                message:
                    'Please login first.'

            });
        }


        try {

            const order =
                await createOrder(

                    cart,

                    userId,

                    'COD',

                    'Pending',

                    'Order Placed'

                );


            res.json({

                success:
                    true,

                orderNumber:
                    order.orderNumber

            });

        } catch (error) {

            console.error(
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    'Unable to place COD order.'

            });
        }
    }
);


/* =========================
   USER ORDERS
========================= */

app.get(
    '/api/orders/user/:userId',
    async function(req, res) {

        const userId =
            req.params.userId;


        try {

            const [
                orders
            ] =
                await promiseDb.query(

                    `
                    SELECT
                        id,
                        user_id,
                        order_number,
                        payment_method,
                        payment_status,
                        order_status,
                        total,
                        created_at
                    FROM orders
                    WHERE user_id=?
                    ORDER BY created_at DESC
                    `,

                    [userId]
                );


            for (
                const order of orders
            ) {

                const [
                    items
                ] =
                    await promiseDb.query(

                        `
                        SELECT
                            product_id,
                            product_name,
                            price,
                            quantity,
                            subtotal
                        FROM order_items
                        WHERE order_id=?
                        ORDER BY id ASC
                        `,

                        [order.id]
                    );


                order.items =
                    items;
            }


            res.json({

                success:
                    true,

                orders:
                    orders

            });

        } catch (error) {

            console.error(
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Unable to load orders.'

            });
        }
    }
);


/* =========================
   SINGLE ORDER
========================= */

app.get(
    '/api/orders/:orderNumber',
    async function(req, res) {

        const orderNumber =
            req.params.orderNumber;


        try {

            const [
                orders
            ] =
                await promiseDb.query(

                    `
                    SELECT *
                    FROM orders
                    WHERE order_number=?
                    LIMIT 1
                    `,

                    [orderNumber]
                );


            if (
                orders.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        'Order not found.'

                });
            }


            const order =
                orders[0];


            const [
                items
            ] =
                await promiseDb.query(

                    `
                    SELECT
                        product_id,
                        product_name,
                        price,
                        quantity,
                        subtotal
                    FROM order_items
                    WHERE order_id=?
                    ORDER BY id ASC
                    `,

                    [order.id]
                );


            order.items =
                items;


            res.json({

                success:
                    true,

                order:
                    order

            });

        } catch (error) {

            console.error(
                error
            );

            res.status(500).json({

                success: false,

                message:
                    'Unable to load order.'

            });
        }
    }
);


/* =========================
   START
========================= */

app.listen(
    PORT,
    function() {

        console.log(
            `Server is running on http://localhost:${PORT}`
        );

    }
);
