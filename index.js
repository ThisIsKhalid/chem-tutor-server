const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyJWt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uwm1xgh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client.db("chemTutor").collection("services");
    const reviewCollection = client.db("chemTutor").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // latest courses for home page
    app.get("/latest", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ _id: -1 });
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });

    // all courses for service page
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // service details by service id
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // add new service
    app.post("/add_service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //reveiws
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // load review by service, service-id params hiseve asbe
    app.get("/reviews/:id", async (req, res) => {
      const serviceId = req.params.id;
      const query = {};
      const cursor = reviewCollection.find(query).sort({ time: -1 });
      const reviews = await cursor.toArray();
      const reviewByService = reviews.filter(
        (rev) => rev.serviceId === serviceId
      );
      res.send(reviewByService);
    });

    // personal reveiw load by email
    app.get("/my_reviews", verifyJWt, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = reviewCollection.find(query).sort({ time: -1 });
      const myReviews = await cursor.toArray();
      res.send(myReviews);
    });

    // load review for edit. need review id
    app.get("/edit_reveiw/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await reviewCollection.findOne(query);
      res.send(cursor);
    });

    // edited review update
    app.patch("/edit_reveiw/:id", async (req, res) => {
      const id = req.params.id;
      const editedReview = req.body.newDescription;
      const updatedTime = req.body.time;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          description: editedReview,
          time: updatedTime,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // personal review delete , need review id
    app.delete("/my_reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err.name, err.message, err.stack));

app.get("/", (req, res) => {
  res.send("project is running");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
