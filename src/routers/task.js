// Load express and create a new router.. also load express middleware.
const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");

// Load the Task model
const Task = require("../models/task");


// Resource Creation -> Task
router.post("/tasks", auth,  async (req,res) => {
    // Create a new instance of our model Task with the information that lives in the body of the request.
    const task = new Task(req.body);

    // we set the owner propery of the the task with the id of the user. 
    task.owner = req.user._id;

    try {
        // We await for the promise, if the task was saved, we cand send them back in the response.
        await task.save();
        res.status(201).send(task);

    } catch (error) {
        
        res.status(400).send(error);
    }
});

// Reading Resource: all tasks (GET/tasks), completed tasks GET/tasks?completed=true , uncompleted tasks GET/tasks?completed=false
// Sorting: GET /tasks?sortBy=createdAt:asc ... GET /tasks?sortBy=createdAt:desc  Also it can use updateAt.
// Allow pagination: GET tasks?limit=10&skip=0 for exampe.
// Client can use both completed with limit/skip and also sorting to really customize how he want his data, for example: /tasks?completed=true&sortBy=createdAt:desc&imit=10&skip=0

router.get("/tasks", auth, async (req,res) => {
    const match = {};
    const sort = {};

    // If there is information in the route ( querry string)
    // If its true it means the client wants the completed tasks , if its equal to false it means it wants the uncompleted tasks.

    if(req.query.completed){
        req.query.completed === "true" ? match.completed = true : match.completed = false;
    }

    if(req.query.sortBy){
        // The parts array , the first element is the name of the sorting the user provided.
        // The second element is if its ascending or descending.

        const parts = req.query.sortBy.split(":");
        
        // First we evaluate if its desc , it will be -1 if not its 1 ( meaning its ascending)
        // Once we have how the user want the sorting, we grabbed the sort object and using [] access to set the name of the property with the field the user want to sort.
        // And then we assign the order in which to sort (valueOfSort). 

        const valueOfSort = parts[1] === "desc" ? -1 : 1;
        sort[parts[0]] = valueOfSort;
        console.log(sort);
    }

    try {
        // We want all the task  the authenticated user has.
        // So we populate the virtual (tasks) , but we do this in a way that we CUSTOMIZE populate! with an object.

        await req.user.populate({
            path: "tasks",
            // match: an object to specify which task we are trying to match
            match: match,
            // this options property can be used for pagination ( we have access to both limit and skip) and sorting.
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: sort
            }
        }).execPopulate();
        // I send the virtual back with all the information.
        res.send(req.user.tasks);
    } catch (error) {

        res.status(500).send();
    }
   
});

// Reading an invidual task by its id.
router.get("/tasks/:id", auth, async (req,res) => {
    // Get the id of the task from the route.
    const _id = req.params.id;

    try {
        // We are looking for a task by its specifc id and check if the owner of that task is the user that has been authenticated.
        
        const task = await Task.findOne({_id: _id, owner: req.user._id});

        // So if the id does not exist or i am not the owner of that task we just return a 404.
        if(!task){
            return res.status(404).send();
        }

        // If there is a match we send the task that was found.
        res.send(task);

    } catch (error) {
        // If ther eis an error
        res.status(500).send();
    }
});

// Updating individual Task by its id.
router.patch("/tasks/:id", auth, async (req,res) => {

    // We get  an array of string from the body of the request with object keys.
    // We set the allowed updates in an array, we let the user modify only completed and description of a task.
    // We check if we have valid operations.
    // If not we send an error.

    const updates = Object.keys(req.body);
    const allowedUpdates = ["completed", "description"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) {
        return res.status(400).send({error: "Invalid Updates"});
    }

    try {
        // Get the id of the task.
        const id = req.params.id;

        // Find the task by its id and check if the owner of the task is the user that has been authenticated.
        const task = await Task.findOne({_id: id, owner: req.user._id});

        // If there is no task
        if(!task){
            return res.status(404).send();
        }

        // Once i have the task, I iterate each update and apply the content of the update that lives in the request body to the task itself.
        updates.forEach((update) => task[update] = req.body[update]);

        // await for the task to be save
        await task.save();

        // We send the task that has been updated.
        res.send(task);
        
    } catch (error) {
        res.status(400).send(error);
    }

});

// Delete Task by its id.
router.delete("/tasks/:id", auth, async (req, res) => {
    // Get the id of the task.
    const id = req.params.id;

    try {
        // Search the task and delete it ... We check if the actual task match with the id we have and also with the id of the owner.
        const task = await Task.findOneAndDelete({_id: id, owner: req.user._id});

        // if there is no tasks to delete
        if(!task){
            return res.status(404).send();
        }

        // We send the task (that was deleted) back.
        res.send(task);
    } catch (error) {
        res.status(500).send();
    }

});

// Export the router from the task file
module.exports = router;
