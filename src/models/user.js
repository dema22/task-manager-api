// Load mongoose , validator , bcrypt and JWTs npm modules.
// Load our Task model.

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

// Create User Schema and we pass the object.

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true, // Create an index in the mongodb database to guarantee uniqueness.
        required: true,
        trim: true,
        lowercase: true,
        validate(value){ // Function to validate the email.
            if(!validator.isEmail(value)){
                throw new Error("You must provided a valid email.");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){ // Mongoose provided custom validation, we can use validate method with the argument value , the value we are going to validate.
            if(value <0){
                throw new Error("Age must be a positive number!");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Your password cant contain the word 'password'.");
            }
        }
    },
    // array of objects call tokens... each object has a token property , it is the token we are trying to track.
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer // store the buffer with binary data of the images in our database
    }
}, {
    timestamps: true
});

// We are going to set up a virtual property (its not actual data stored in the database), its a relationship between the user and the task.
// The first argument is the name of the virtual and the second is an object. 
// So the localfield (_id) , the id of the user is a relationship between that and the task owner field.

userSchema.virtual("tasks", {
    ref: "Task", //  we put the reference to the task model. So we have a reference between the user and the task in a virtual.
    localField: "_id",
    foreignField: "owner" // name of the field on the task thats going to create this relationship.
});


// The user variable is an instance of the User model, and its not a javascript object.
// Thats why we are transforming user to an actual Javascript object with toObject() and deleting the password and tokens array property.
// Because this is sensitive information we want to hide from the user and there is no reason to have that info in the response in the first place.
// We are also using toJSON ( every time we use a res.send , express is behind the scenes calling stringify ... but becasue we use toJSON, it will run the function we define and then call the stringify and then send the response back).

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    
    delete userObject.password;
    delete userObject.tokens;

    // We remove the avatar data because we have a url that serve the image , so there is no need to send them back with profile response it will slow down a lot our server.
    delete userObject.avatar;

    return userObject;
};


// Creating a method that works with an instance of a user (instance method). 
// We use a standard function because we need the this binding.

userSchema.methods.generateAuthToken = async function () {
    // We get access to the specific user via "this".. we put it in a variable for clarity.
    const user = this;

    // We create the token with the user id (we must convert it to a string) and we provided a secret (its in an enviornment variable).
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);

    // We add the token that we create to the array of tokens and we save the user.  
    user.tokens = user.tokens.concat({ token: token });

    await user.save();

    return token;
};

// Creating a static method sometimes called models method .. works with the collection user as a whole. 

userSchema.statics.findByCredentials = async (email, password) => {
    // Find the user by their email with findOne
    const user = await User.findOne({email: email});

    // If there is no user, we throw an error.
    if(!user){
        throw new Error("Unable to login");
    }

    // If it works we verify the plain text password provided by the user with the hash password of the user that is stored in the database
    // Using compare we can achive this.
    const isMatch = await bcrypt.compare(password, user.password);

    // If there is no match , meaning the user introduce a incorrect password we throw an error.
    if(!isMatch){
        throw new Error("Unable to login");
    }
    // finally is the user was found and the password is a match we return it.
    return user;
};


// Mongoose Middleware: We can do something before an event with pre and with post to do something after an event.
// First argument the name of the event, and the second argument the function to run. It must be a regular function (not an arrow function).
// We get acess to an argument call next (we use it when we are done).
// This function "means" do something before an indivual user is been save.
// "this" gives access to the individual user that is about to be saved, we stored it an variable just for clarity

userSchema.pre("save", async function (next) {
    const user = this;
    
    // If the user modify the password we are going to hash it.. we use the method is modified: this will be true when the user first created the password OR update it.

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password , 8);
    } 

    next(); 
});


// Mongoose Middleware that remove user tasks when user is removed.
userSchema.pre("remove", async function (next){

    const user = this;

    await Task.deleteMany({owner: user._id});

    next();
});

// We create the model User, we set its name and  we pass as the second argument (the userSchema)
const User = mongoose.model("User", userSchema);

// Expor the model USER
module.exports = User;