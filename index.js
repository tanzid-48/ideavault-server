require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;

// Adds headers: Access-Control-Allow-Origin: *
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xhm3y2q.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    const db = client.db("IdeaVault");
    const ideaVaultCollection = db.collection("ideas");

    // get all idea
    app.get('/ideas',async(req,res)=>{
        const result = await ideaVaultCollection.find().toArray()
        res.send(result);
    });
// get Trending Ideas Section data to use limit
app.get('/trending-ideas', async (req, res) => {
    try {
        
        const result = await ideaVaultCollection.find().limit(6).toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch trending ideas" });
    }
});


    // post the idea
    app.post("/ideas", async (req, res) => {
      const newIdea = req.body;
      const result = await ideaVaultCollection.insertOne(newIdea);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("IdeaVault-server is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
