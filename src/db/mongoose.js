// We load the npm mongoose.
const mongoose = require("mongoose");

// We provided the connection url with the database name as first argument (we use a environment variable).
// Second argument a configuration object.

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

