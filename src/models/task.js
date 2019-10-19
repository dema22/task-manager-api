// Load mongoose module
const mongoose = require("mongoose");

// Define the schema Task
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    // we set up a new field call owner.. this is for making the relationship between users and tasks
    owner: {
        type: mongoose.Schema.Types.ObjectId, // here we are going to store the id of the user that create the task
        require: true,
        // ref is to create a reference between this field (owner) with another model ,in our case, with the user model. We put the name of the model .. "User"
        ref: "User"
    }
}, {
    timestamps: true
});

// Define the model for task
const Task = mongoose.model("Task", taskSchema);

// Export the model Task
module.exports = Task;