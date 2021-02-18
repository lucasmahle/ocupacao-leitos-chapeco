const path = require('path');
const mongoClient = require("mongodb").MongoClient;
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const stringConnection = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@covidcco.t84tj.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`

module.exports = () => mongoClient.connect(stringConnection, { useUnifiedTopology: true }).then(client => client.db('covid-data'));