// This module Contains all of the code necessary to set the database up for the test suites.

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");


// Creating users

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: "Mike",
    email: "mike@example.com",
    password: "56what!!",
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: "Andrew",
    email: "andew@example.com",
    password: "myhouse099@@",
    tokens: [{
        token: jwt.sign({_id: userTwoId}, process.env.JWT_SECRET)
    }]
}

// Create tasks.

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: "First task",
    completed: false,
    owner: userOneId
};

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: "Second task",
    completed: true,
    owner: userOneId
};

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: "Thrid task",
    completed: true,
    owner: userTwoId
};


// Create function that sets up the data

const setupDatabase = async() => {
    // We are going to wipe all the users and all the tasks.
    await User.deleteMany();
    await Task.deleteMany();

    // We are going to save in the database the user and the tasks we are going to use for the test cases.
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
};

module.exports = {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
};