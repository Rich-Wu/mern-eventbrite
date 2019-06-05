const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require("./models/user");

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
      creator: User!
    }

    type User {
      _id: ID!
      email: String!
      password: String
      createdEvents: [Event!]
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      password: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery 
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return Event
        .find()
        .then(events => {
          return events.map(event => {
            return { ...event._doc };
          });
        })
        .catch(err => {
          console.log(err);
        });
    },
    createEvent: (args) => {
      const { eventInput } = args;
      // const event = {
      //   _id: Math.random().toString(),
      //   title: eventInput.title,
      //   description: eventInput.description,
      //   price: +eventInput.price,
      //   date: eventInput.date
      // };
      const event = new Event({
        title: eventInput.title,
        description: eventInput.description,
        price: eventInput.price,
        date: new Date(eventInput.date),
        creator: '5cf83dd3b76b5179cb742db5'
      });
      let createdEvent;
      return event
      .save()
      .then(result => {
        createEvent = { ...result._doc };
        return User.findById('5cf83dd3b76b5179cb742db5')
      })
      .then(user => {
        if (!user) {
          throw new Error('User doesn\'t exist.');
        }
        user.createdEvents.push(event);
        return user.save();
      })
      .then(result => {
        return createdEvent;
      })
      .catch(err => {
        console.log(err);
        throw err;
      });
      return event;
    },
    createUser: args => {
      const { userInput } = args;
      return User.findOne(
        {
          email: userInput.email 
        })
        .then(user => {
          if (user) {
            throw new Error('User Exists already.');
          }
          return bcrypt.hash(userInput.password, 12);
        })
        .then(hashedPassword => {
          const user = new User({
            email: userInput.email,
            password: hashedPassword
          });
          return user.save();
        })
        .then(result => {
          return { ...result._doc, password: null }
        })
        .catch(err => {
          throw err;
        });
        
    }
  },
  graphiql: true
}));

app.get('/', (req, res, next) => {
  res.send('Hello World!');
})

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@groundzero-nwfxk.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority
`,
{useNewUrlParser: true})
.then(() => {
  app.listen(3000);
})
.catch(err => {
  console.log(err);
});
