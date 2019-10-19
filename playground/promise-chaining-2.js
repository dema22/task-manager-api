require("../src/db/mongoose");
const Task = require("../src/models/task");

// Using findByIdAndDelete , then i use promise chaining to count all the incomplete tasks

/* Task.findByIdAndDelete("5d91751574109b149cd18c44").then((task) => {
    
    return Task.countDocuments({completed: false});
}).then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
}); */


const deleteTaskAndCount = async (id) => {
    const task = await Task.findByIdAndDelete(id);
    const count = await Task.countDocuments({completed: false});
    return count;
};


deleteTaskAndCount("5d92c7090042f814bce3222a").then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
});