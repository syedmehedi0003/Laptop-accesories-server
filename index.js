const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.apkjk.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('laptop-parts').collection('product');
        const userCollection = client.db('laptop-parts').collection('user');

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
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    // quantity: updatedData.quantity,
                    quantity: updatedData.newQuantity,


                }
            };

            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        });


        //Post User
        app.post('/profile', async (req, res) => {
            const newProduct = req.body;
            const result = await userCollection.insertOne(newProduct);
            res.send(result);
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