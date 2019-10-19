const mongoose = require("mongoose");

// we provided the connection url with the database name as first argument
// Second argument a configuration object

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

