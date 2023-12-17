const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.4jznvny.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const databaseCollection = client.db('MyService').collection('databaseCollection')
        const UserCollection = client.db('MyService').collection('UserCollection')
        const excelCollection = client.db('MyService').collection('excelCollection')

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = {
                email
            }
            const result = await UserCollection.findOne(query)
            res.send(result)
        })
        app.get('/datafind/:email', async (req, res) => {
            const email = req.params.email;
            const query = {
                clientEmail: email
            }
            const cursor = databaseCollection.find(query).sort({ _id: -1 })
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/excelfind/:email', async (req, res) => {
            const email = req.params.email;
            const query = {
                clientEmail: email
            }
            const cursor = excelCollection.find(query).sort({ _id: -1 })
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/excelDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const cursor = excelCollection.find(query).sort({ _id: -1 })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/addUser', async (req, res) => {
            const query = req.body;
            const result = await UserCollection.insertOne(query)
            res.send(result)
        })
        app.post('/uploadDatabase', async (req, res) => {
            const query = req.body;

            //now calculated the data size which i inserted

            const sizeInBytes = Object.keys(query).reduce(function (acc, key) {
                return acc + (key.length + JSON.stringify(query[key]).length);
            }, 0);
            // console.log(sizeInBytes / 1024)

            const getUser = await UserCollection.findOne({ email: query.clientEmail })

            const newStorage = getUser.storage - (sizeInBytes / 1024)
            // console.log(newStorage)
            const updateStorage = await UserCollection.updateOne({ email: query.clientEmail }, {
                $set: {
                    storage: newStorage
                }
            })

            const result = await databaseCollection.insertOne(query)
            res.send(result)
        })
        app.post('/uploadExcel', async (req, res) => {
            const query = req.body;
            const getUser = await UserCollection.findOne({ email: query.clientEmail })

            const newStorage = getUser.storage - query.size
            console.log(newStorage)
            const updateStorage = await UserCollection.updateOne({ email: query.clientEmail }, {
                $set: {
                    storage: newStorage
                }
            })
            const result = await excelCollection.insertOne(query)
            res.send(result)
        })

        app.put('/templateUpdate/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body
            // const query = {
            //     email
            // }
            // const filter = { email: `${query}` };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    colNo: bodyData.colNo,
                    colName: bodyData.filteredArray
                }
            }
            const result = await UserCollection.updateOne(filter, updateDoc, options)
            res.send(result);
        })
        app.put('/updateDatabase/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body
            // const query = {
            //     email
            // }
            // const filter = { email: `${query}` };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    data: bodyData.data
                }
            }
            const result = await databaseCollection.updateOne(filter, updateDoc, options)
            res.send(result);
        })
        app.put('/updateExcelSheetName/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const bodyData = req.body
            // const query = {
            //     email
            // }
            // const filter = { email: `${query}` };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    SheetName: bodyData.data.SheetName
                }
            }
            const result = await excelCollection.updateOne(filter, updateDoc, options)
            res.send(result);
        })

        app.delete('/deleteDatabase/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }

            //start calculated data size which are deleted

            const getDatabaseData = await databaseCollection.findOne(query)
            // console.log((getDatabaseData))

            const deletedDataIem = {
                getDatabaseData

            }

            const sizeInBytes = Object.keys(deletedDataIem).reduce(function (acc, key) {
                return acc + (key.length + JSON.stringify(deletedDataIem[key]).length);
            }, 0);

            const getUserData = await UserCollection.findOne({ email: getDatabaseData.clientEmail })


            const newStorage = getUserData.storage + (sizeInBytes / 1024)

            const updateStorage = await UserCollection.updateOne({ email: getDatabaseData.clientEmail }, {
                $set: {
                    storage: newStorage
                }
            })

            //end calculated data size which are deleted

            const result = await databaseCollection.deleteOne(query)
            res.send(result);

        })
        app.delete('/deleteExcelSheet/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }



            const getExcelData = await excelCollection.findOne(query)

            const getUserData = await UserCollection.findOne({ email: getExcelData.clientEmail })

            const newStorage = getUserData.storage + getExcelData.size
            console.log(newStorage)
            const updateStorage = await UserCollection.updateOne({ email: getExcelData.clientEmail }, {
                $set: {
                    storage: newStorage
                }
            })


            const result = await excelCollection.deleteOne(query)
            res.send(result);

        })

    } finally {
        // Ensures that the client will close when you finish/error

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})