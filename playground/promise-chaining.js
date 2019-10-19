
require("../src/db/mongoose");
const User = require("../src/models/user");


// Use the findById mongoose method to find by id and update the age to 1
// The i I count the documents with age 1 and return the promise 
// Using promise chaining to attach another then


/* User.findByIdAndUpdate("5d913b12b0b26a09bca11fb9", {age: 1}).then((user) => {
    console.log(user);
    return User.countDocuments({ age:1 });
}).then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
}); */


// Using ASYNC-AWAIT

const updateAgeAndCount = async (id, age) => {
    const user = await User.findByIdAndUpdate(id, {age: age});
    const count = await User.countDocuments({ age: age });
    return count;
};


updateAgeAndCount("5d913b12b0b26a09bca11fb9",25).then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
});
