const MongoClient = require("mongodb").MongoClient;

const uri =
  "mongodb+srv://root:g6fqRYEK4v4SUH1G@crawlr-db-qsmdt.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect().then(() => {
  const trending = client.db("crawlr").collection("trending");
  trending.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
});

module.exports = client;
