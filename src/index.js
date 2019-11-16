// Load our express application.
const app = require("./app");

// Define our port
const port = process.env.PORT;

// Starting the server
app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

