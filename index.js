const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv')
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 8000
const uri = process.env.MONGODB_URI;

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

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
  const token = authorization?.split(' ')[1]
  if(!token) {
    return res.status(401).json({message : "Unauthorize"})
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )
    const { payload } = await jwtVerify(token, JWKS)
    req.user= payload
    next()
  } catch (error) {
    console.error('Token validation failed:', error)
    return res.status(401).json({message : "Unauthorize"})
  }
}

async function run() {
  try {
    await client.connect();
    const db = client.db('studyroom')
    const roomsCollection = db.collection("rooms")
    const bookingCollection = db.collection("booking")

    // Rooms routes
    app.get("/rooms", async (req, res) => {
      const { search } = req.query;
      let cursor = search
        ? roomsCollection.find({ name: { $regex: search, $options: 'i' } })
        : roomsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/rooms/:roomsId", logger, async (req, res) => {
      const { roomsId } = req.params;
      const query = { _id: new ObjectId(roomsId) };
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    app.get("/featured" , async(req,res)=>{
      const cursor = roomsCollection.find().limit(3)
      const result = await cursor.toArray()
      res.send(result)
    })

    // Booking routes
    app.get("/booking/:userId", verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingCollection.find({ userId }).toArray();
      res.send(result);
    });

    app.patch("/booking/:roomsId", verifyToken, async (req, res) => {
      const { roomsId } = req.params;
      const bookingData = req.body;

      const room = await roomsCollection.findOne({ _id: new ObjectId(roomsId) });
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      await roomsCollection.updateOne(
        { _id: new ObjectId(roomsId) },
        {
          $inc: { bookingCount: 1 },
          $set: { lastBookingAt: new Date() }
        }
      );

      const result = await bookingCollection.insertOne({
        ...bookingData,
        bookingAt: new Date()
      });

      res.send(result);
    });

    // Cancel booking route
    app.delete('/booking/:bookingId', async (req, res) =>{
      const {bookingId} = req.params
      const result = await bookingCollection.deleteOne({_id: new ObjectId(bookingId)})
      res.json(result)
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // keep connection open
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
