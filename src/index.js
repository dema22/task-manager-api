// Load our npm modules: express
const express = require("express");

// Load our modules
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

// Create a new express application
const app = express();

// Define port (for heroku OR local development)
const port = process.env.PORT;

// Its going to parse incoming JSON to an OBJECT so we can access them in our request handlers : for example when we access the request.body , that json , is parse to an object,
app.use(express.json());

// register our user router and task router with our express app
app.use(userRouter);
app.use(taskRouter);

// Starting the server
app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});

