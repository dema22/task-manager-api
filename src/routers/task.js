// Load express and create a new router.. also load express middleware
const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");

// Load the Task model
const Task = require("../models/task");


// Resource Creation -> Task
router.post("/tasks", auth,  async (req,res) => {
    // Create a new instance of our model Task with the information that lives in the body of the request.
    const task = new Task(req.body);

    // we set the owner propery of the the task with the id of the user. (the user is attach to the req in the auth middleware)
    task.owner = req.user._id;

    try {
        // We await for the promise, if the task was saved, we cand send them back in the response.
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        // If there is an error we send them
        res.status(400).send(error);
    }
});

// Reading Resource: all tasks (GET/tasks), completed tasks GET/tasks?completed=true , uncompleted tasks GET/tasks?completed=false
// Allow pagination: GET tasks?limit=10&skip=0
// Sorting: GET /tasks?sortBy=createdAt:asc ... GET /tasks?sortBy=createdAt:desc
// Client can use both completed with limit and , ando also sorting, to really coustimize how he want his data.

router.get("/tasks", auth, async (req,res) => {
    const match = {};
    const sort = {};

    // If there is information in the route ( querry string)
    // If its true it means the client want to match the completed tasks , if its equal to false it means it want to match the uncompleted tasks.
    // If there is no info , i will send all the tasks.

    if(req.query.completed){
        req.query.completed === "true" ? match.completed = true : match.completed = false;
    }

    // If there is information in the route ( querry string)
    // We are going to break the value

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(":");
        // The parts array , the first element is the name of the sorting the user provided.
        // The second element is if its ascending or descending.

        // First we evaluate if its desc , it will be -1 if not its 1 ( meaning its ascending)
        // Once we have how he want to sort, we grabbed the sort object and using [] access to set the name of the property with the field the user want to sort.
        // And then we assign the order in which to sort (valueOfSort). 

        const valueOfSort = parts[1] === "desc" ? -1 : 1;
        sort[parts[0]] = valueOfSort;
    }



    try {
        // We want all the task  the user authenticated created.
        // So we populate the virtual (tasks) , but we do this in a way that we Coustomize populate.. with an object

        await req.user.populate({
            path: "tasks",
            // match: an object to specify which task we are trying to match
            match: match,
            // this options property can be used for pagination ( we have access to both limit and skip) and sorting
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: sort
            }
        }).execPopulate();

        res.send(req.user.tasks);
    } catch (error) {

        res.status(500).send();
    }
   
});

// Reading Resource: invidual task
router.get("/tasks/:id", auth, async (req,res) => {
    // Get the id of the task from the route.
    const _id = req.params.id;

    try {
        // We are looking for a task by its specifc id and check if the owener of that task is the user that has been authenticated.
        
        const task = await Task.findOne({_id: _id, owner: req.user._id});

        // So if the id does not exist or i am not the owner of that task we just return a 404.
        if(!task){
            return res.status(404).send();
        }

        // If there is a match we send them
        res.send(task);

    } catch (error) {
        // If ther eis an error
        res.status(500).send();
    }
});

// Updating Task by id
router.patch("/tasks/:id", auth, async (req,res) => {

    // We get  an array of string from the body
    // We set the allowed updates in an array
    // We check if we have valid operations 
    // If not we send an error

    const updates = Object.keys(req.body);
    const allowedUpdates = ["completed", "description"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        return res.status(400).send({error: "Invalid Updates"});
    }

    try {
        const id = req.params.id;

        // Find the task by its id and check if the owner of the task is the user that has been authenticated.
        const task = await Task.findOne({_id: id, owner: req.user._id});

        // If there is no task
        if(!task){
            return res.status(404).send();
        }

        // Once i have it i iterate each update and apply to the task
        updates.forEach((update) => task[update] = req.body[update]);

        // await for the task to be save
        await task.save();

        // If there is a match we send the task
        res.send(task);
        
    } catch (error) {
        res.status(400).send(error);
    }

});

// Delete Task by id.

router.delete("/tasks/:id", auth, async (req, res) => {
    const id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({_id: id, owner: req.user._id});

        // if there is no tasks to delete
        if(!task){
            return res.status(404).send();
        }

        // If there is match
        res.send(task);
    } catch (error) {
        res.status(500).send();
    }

});

// Export the router from the task file
module.exports = router;
