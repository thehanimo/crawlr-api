const MongoClient = require("mongodb").MongoClient;

const uri =
  "mongodb+srv://root:g6fqRYEK4v4SUH1G@crawlr-db-qsmdt.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect();

module.exports = client;
