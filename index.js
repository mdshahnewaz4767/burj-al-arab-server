const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const port = 5004

const app = express()

app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/burj-al-arab-ef629-firebase-adminsdk-wvz6h-ed888e9825.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkcgo.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingsCollection = client.db("burjAlArab").collection("bookings");
  // console.log('db connected successfully')

  //create data
  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookingsCollection.insertOne(newBooking)
    .then(result => {
      // console.log(result);
      res.send(result.insertedCount > 0);
    })
    // console.log(newBooking);
  })

  //read data
  app.get('/bookings', (req, res) => {
    // console.log(req.query.email);
    // console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      // console.log({idToken});
      admin.auth().verifyIdToken(idToken)
      .then((decodedToken) => {
        let tokenEmail= decodedToken.email;
        if(tokenEmail == req.query.email){
          bookingsCollection.find({email: req.query.email})
          .toArray( (err, documents) => {
            res.send(documents);
          })
        }
        else{
          res.status(401).send('un-authorized access')
        }
      })
      .catch((error) => {
        // Handle error
      });
    }
    else{
      res.status(401).send('un-authorized access')
    }

    
    // bookingsCollection.find({})
    
  })
  // client.close();
});

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port)