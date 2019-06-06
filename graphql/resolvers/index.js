const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require("../../models/user");
const Booking = require("../../models/booking");

const events = eventIds => {
  return Event
    .find({_id: {$in: eventIds}})
    .then(events => {
      return events.map(event => {
        return {
          ...event._doc, 
          creator: user.bind(this, event.creator), 
          date: new Date(event._doc.date).toISOString()
        };
      });
    })
    .catch(err => {
      console.log(err);
    });
};

const user = userId => {
  return User
    .findById(userId)
    .then(user => {
      return { ...user._doc, _id: user.id, password: null, createdEvents: events.bind(this, user._doc.createdEvents) };
    })
    .catch(err => {
      console.log(err);
    });
};

const singleEvent = async eventId => {
  try {
    const event = await Event.findById(eventId);
    return {
      ...event._doc,
      creator: user.bind(this, event.creator)
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  events: () => {
    return Event
      .find()
      .then(events => {
        return events.map(event => {
          return {
            ...event._doc,
            creator: user.bind(this, event._doc.creator),
            date: new Date(event._doc.date).toISOString()
          };
        });
      })
      .catch(err => {
        console.log(err);
      });
  },
  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map(booking => {
        return { ...booking._doc,
          _id: booking.id,
          user: user.bind(this, booking._doc.user),
          event: singleEvent.bind(this, booking._doc.event),
          createdAt: new Date(booking._doc.createdAt).toISOString(),
          updatedAt: new Date(booking._doc.updatedAt).toISOString(),
        };
      });
    } catch (err) {
      throw err;
    }
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
      createdEvent = {
        ...result._doc,
        creator: user.bind(this, result._doc.creator),
        date: new Date(event._doc.date).toISOString()
      };
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
      
  },
  bookEvent: async args => {
    const fetchedEvent = await Event.findOne({ _id: args.eventId });
    const booking = new Booking({
      user: '5cf83dd3b76b5179cb742db5',
      event: fetchedEvent
    });
    const result = await booking.save();
    return {
      ...result._doc,
      user: user.bind(this, result._doc.user),
      event: singleEvent.bind(this, result._doc.event),
      createdAt: new Date(result._doc.createdAt).toISOString(),
      updatedAt: new Date(result._doc.updatedAt).toISOString(),
    }
  },
  cancelBooking: async args => {
    try {
      const booking =  await Booking.findById(args.bookingId).populate('event');
      const event = { ...booking.event._doc, _id: booking.event.id, creator: user.bind(this, booking.event._doc.creator) };
      await Booking.deleteOne({_id: args.bookingId});
      return event;
    } catch (err) {
      throw err;
    }
  }
}