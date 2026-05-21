const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()

const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

app.use(cors())
const port = process.env.PORT || 8000

// username = 

// pass = e1hJ58P8mxKx7BJk



const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



const logger = (req, res, next) => {
  console.log(`${req.method} | ${req.url}`);
  next();
};

const verifyToken = async (req , res , next) =>{

  const {authorization} = req.headers
  console.log(req.headers)

  next()

}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const db = client.db('studyroom')
    const roomsCollection = db.collection("rooms")



    app.get("/rooms",async(req,res) => {
        const cursor = roomsCollection.find()
        const result = await cursor.toArray()
        // console.log(result)
        res.send(result)
    })
    app.get("/rooms/:roomsId", logger,verifyToken, async (req, res) => {
  const { roomsId } = req.params;
  const query = { _id: new ObjectId(roomsId) };
  const result = await roomsCollection.findOne(query);
  res.send(result);
});

    app.get("/featured" , async(req,res)=>{
      const cursor = roomsCollection.find().limit(3)
        const result = await cursor.toArray()
        // console.log(result)
        res.send(result)
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
