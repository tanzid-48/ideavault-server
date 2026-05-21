require("dotenv").config();
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

// Middleware
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.DB_PUBLIC}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "unAuthorization" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "unAuthorization" });
    }

    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    const db = client.db("IdeaVault");
    const ideaVaultCollection = db.collection("ideas");
    const commentCollection = db.collection("comment");
    const savedCollection = db.collection("saved");

    // get all idea with search, filter, and dynamic sorting
    app.get("/ideas", async (req, res) => {
      try {
        const { userId, search, category } = req.query;
        const query = {};

        if (userId) {
          query.userId = userId;
        }

        if (search) {
          query.title = { $regex: search, $options: "i" };
        }

        if (category && category !== "all") {
          query.category = { $regex: `^${category}$`, $options: "i" };
        }

        const result = await ideaVaultCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).send({ message: "Failed to fetch ideas" });
      }
    });
    // get Trending Ideas Section data to use limit
    app.get("/trending-ideas", async (req, res) => {
      try {
        const result = await ideaVaultCollection.find().limit(6).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch trending ideas" });
      }
    });

    // get a single idea to show details
    app.get("/ideas/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await ideaVaultCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!result) {
        return res.status(404).json({ message: "Idea not found" });
      }

      res.json(result);
    });

    // DELETE idea
    app.delete("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      const result = await ideaVaultCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    // PATCH (edit) idea
    app.patch("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      const updatedIdea = req.body;
      const result = await ideaVaultCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedIdea },
      );
      res.send(result);
    });

    // post the idea
    app.post("/ideas", verifyToken, async (req, res) => {
      const newIdea = req.body;
      const result = await ideaVaultCollection.insertOne(newIdea);
      res.send(result);
    });

    // post the comment
    app.post("/comment", verifyToken, async (req, res) => {
      const newComment = req.body;
      const result = await commentCollection.insertOne(newComment);
      res.send(result);
    });
    // get that the comment
    app.get("/comment", verifyToken, async (req, res) => {
      const { userId } = req.query;
      const query = userId ? { userId } : {};
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    // DELETE comment
    app.delete("/comment/:id", async (req, res) => {
      const { id } = req.params;
      const result = await commentCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    // PATCH (edit) comment
    app.patch("/comment/:id", async (req, res) => {
      const { id } = req.params;
      const { text } = req.body;
      const result = await commentCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { text } },
      );
      res.send(result);
    });

    // Save idea
    app.post("/saved", async (req, res) => {
      const { userId, ideaId } = req.body;
      const existing = await savedCollection.findOne({ userId, ideaId });
      if (existing) return res.send({ message: "Already saved" });
      const result = await savedCollection.insertOne({
        userId,
        ideaId,
        createdAt: new Date(),
      });
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
