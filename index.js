const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { get } = require('express/lib/response');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.apkjk.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return req.status(401).send({ message: 'UnAuthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    // verify a token symmetric
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const productCollection = client.db('laptop-parts').collection('product');
        const userCollection = client.db('laptop-parts').collection('user');
        const profileCollection = client.db('laptop-parts').collection('profile');
        const orderCollection = client.db('laptop-parts').collection('order');
        const reviewCollection = client.db('laptop-parts').collection('review');

        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        });

        //Post
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result1 = await productCollection.insertOne(newProduct);
            res.send(result1);
        });

        //delete
        app.delete('/product/:id', async (req, res) => {
            id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });


        //Update
        app.patch('/product/:id', async (req, res) => {
            const id = req.params.id;

            const updatedData = req.body;
            console.log(id);
            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    // quantity: updatedData.quantity,
                    available: updatedData.newQuantity,

                }
            };

            const result = await productCollection.updateOne(filter, updateDoc, options);

            res.send(result);

        });

        //Post Order
        app.post('/order', async (req, res) => {
            const newProduct = req.body;
            console.log(newProduct);
            const result2 = await orderCollection.insertOne(newProduct);
            res.send(result2);
        });

        //Get order
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // console.log(decodedEmail);
            // if (email === decodedEmail) {
            const query = { email: email };
            const user1 = await orderCollection.find(query).toArray();
            return res.send(user1);
            // }

            // else {
            //     return res.status(403).send({ message: 'Forbidden Access' });
            // }
        });

        //Get all Order
        app.get('/user/order', async (req, res) => {
            const users = await orderCollection.find().toArray();
            res.send(users);

        });



        //Get review
        app.get('/review', async (req, res) => {
            // const email = req.query.email;
            // const query = { email: email };
            // const user = await reviewCollection.find(query).toArray();
            // res.send(user);

            const users = await reviewCollection.find().toArray();
            res.send(users);

        });

        app.put('/user/review', async (req, res) => {
            const data = req.body;
            const filter = { email: data.email };
            console.log(filter);
            const options = { upsert: true };
            const updateDoc = {
                $set: data,
            }
            const result = await reviewCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        //Get order
        // app.get('/order', async (req, res) => {
        //     const query = {};
        //     const cursor = orderCollection.find(query);
        //     const order = await cursor.toArray();
        //     res.send(order);
        // });


        //Post User
        // app.post('/user', async (req, res) => {
        //     const newProduct = req.body;
        //     const result = await userCollection.insertOne(newProduct);
        //     res.send(result);
        // });

        app.put('/user/profile', async (req, res) => {
            const data = req.body;
            const filter = { email: data.email };
            console.log(filter);
            const options = { upsert: true };
            const updateDoc = {
                $set: data,
            }
            const result = await profileCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });





        //get User
        // app.get('/user/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await userCollection.findOne(query);
        //     res.send(result);
        // })

        //get User
        app.get('/user', async (req, res) => {

            // const email = req.query.email;
            // const query = { email: email };
            // const users = await userCollection.find(query).toArray();
            // res.send(users);

            const users = await userCollection.find().toArray();
            res.send(users);
        })


        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

        // const options = { upsert: true };
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {

                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                return res.send(result);

            }
            else {
                return res.status(403).send({ message: 'forbidden' });
            }

        });


        //store user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ result, token })
        });


    }

    finally { }

}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Laptop Parts...')
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})