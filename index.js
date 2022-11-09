const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { application } = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uwm1xgh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run(){
    try{
      const serviceCollection = client.db("chemTutor").collection("services");
      const userCollection = client.db("chemTutor").collection("users");
      const reviewCollection = client.db("chemTutor").collection("reviews");

      app.get("/latest", async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query).sort({ _id: -1 });
        const result = await cursor.limit(3).toArray();
        res.send(result);
      });

      app.get("/services", async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      });

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
        res.send(service);
      });

      // login
      app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
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
        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        const reviewByService = reviews.filter(
          (rev) => rev.serviceId === serviceId
        );
        res.send(reviewByService);
      });

      // personal reveiw load by email
      app.get("/my_reviews", async (req, res) => {
        let query = {};
        if (req.query.email) {
          query = {
            email: req.query.email,
          };
        }
        const cursor = reviewCollection.find(query);
        const myReviews = await cursor.toArray();
        res.send(myReviews);
      });

      // personal review delete , review id lagbe
      app.delete("/my_reviews/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await reviewCollection.deleteOne(query);
        res.send(result);
      });

    }
    finally{

    }
}
run().catch(err => console.log(err.name, err.message, err.stack));

app.get("/", (req, res) => {
  res.send("project is running");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
