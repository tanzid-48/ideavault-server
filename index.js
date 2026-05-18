require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors')
const port =  process.env.PORT || 5000


// Adds headers: Access-Control-Allow-Origin: *
app.use(cors())
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhm3y2q.mongodb.net/?appName=Cluster0`;

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
    // Connect the client to the server	
    await client.connect();
   
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('IdeaVault-server is running');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})