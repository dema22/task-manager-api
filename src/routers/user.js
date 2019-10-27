// Load express and  create a router.
// Load our auth middleware.
// Load multer and sharp to provided support for form-data.
// We requiere our function that use send grid.

const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const {sendWelcomeEmail, sendCancellationEmail} = require("../emails/account");

// Load the user model
const User = require("../models/user");

// Resource creation -> User
router.post("/users", async (req,res)=>{
    
    // Create a new instance of our model User with the information that is in the body of the request.
    const user = new User(req.body);

    // We are going to await for the promise to be fullfield ( the user was saved)
    // If all went okey, we send an email to the user email and then we are going to await for the token of this new user to be generated.
    // If there is an error, we return the error with the response.
    // If all went okey means that we can return the object with the actual user profile and auth token.

    try {
        await user.save();
        sendWelcomeEmail(user.email,user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user: user, token:token});
    } catch (error) {
        res.status(400).send(error);
    }

});

// The job of this route is to find a user by their credentials (email and password), 
// create the auth token and stored it in the database.. and send back an object (with the user and the token).
router.post("/users/login", async (req,res) => {
    try {
        // We are going to await the user we are looking. We are working with the user collection as a whole!
        const user = await User.findByCredentials(req.body.email, req.body.password);
        
        // We are going to wait for the token for this particular user instance. We are working with the user instance!
        const token = await user.generateAuthToken();
        
        // we send an object with two properties: user (with the data from the user) and token with the token. 
        res.send({user: user, token: token});

    } catch (error) {
        // if there was an error we send back the 400.
        res.status(400).send();
    }
});

// Log Out --> require authentication , because you must be authenticated to log out.
// If its is authenticate it,  we destroy the user token because hes is logging out of the app.
router.post("/users/logout", auth, async(req,res) => {
    try {
        // filter the array of tokens, for each individual token , check if the token property is NOT the token the user is authenticated.
        // It will return true (all the tokens) EXCEPT for the one we are trying to remove.

        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

        // Save the changes we made to the tokens array (The token that was authenticated is no more)
        await req.user.save();

        // send the response back .. token destroy and logging out
        res.send();
    } catch (error) {
        res.status(500).send();
    }    
});

// Log out for all sessions --> we are going to destroy all the users tokens so he can log out from all his sessions.
router.post("/users/logoutAll", auth, async(req,res) =>{
    try {
        // delete the entire array of tokens
        req.user.tokens.splice(0);
        console.log(req.user);
        
        // save the changes , now the user is log out in all sessions.
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});


// Get the profile of the currently authenticated user.
router.get("/users/me", auth, async(req,res) => {
    // If the middleware execute next (in the auth function) it means the route handler is going to run and send back the user profile.
    res.send(req.user);
});

// Route to update the user profile when the user its authenticated correctly.
router.patch("/users/me", auth, async(req,res) => {
    // We send a 400 if we try to update something WE CAN NOT change like _id.

    // The array of updates the user is allowed to update.
    const allowedUpdates = ["name", "email", "password", "age"];

    // It will take the req.body and keys will return an array of strings.
    const updates = Object.keys(req.body);

    // The every method tests whether all elements in the array pass the test implemented by the provided function.
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    // If we dont have a valid operation we return a 400 status with the error object
    if(!isValidOperation){
        res.status(400).send({error: "Invalid updates."});
    }

    // Get the user from the user document that was attach into the request (this was donde in the auth middleware).
    const user = req.user;

    try {
        // We iterate the array of updates which are strings.
        // We use bracket notation because is dynamic .. we dont know what update we are working with.
        // We put the content of the current update that is in req.body in the user document.
        updates.forEach((update) => user[update] =  req.body[update]);

        // Await the user to be saved
        await user.save();
        
        // Send the updated user back.
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }

});

// Delete user profile
router.delete("/users/me", auth, async (req,res) => {

    try {
        // delete the user using remove mongoose method.
        await req.user.remove();
        // sending the user their cancellation email.
        sendCancellationEmail(req.user.email, req.user.name);
        // send back the profile of the user that was deleted.
        res.send(req.user);

    } catch (error) {
        res.status(500).send();
    }
});

// We configure multer.
const upload = multer({
    // we accept files up to 1 mb
    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,cb) {
        // If the file thats going to be upload dont match with the regular expression we throw an error , if it match we call the callback.
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("Please upload an image that has one of this following formats: .jpg, .jpeg, .png"));
        }

        // If the file match the regular expression we call the callback.
        cb(undefined, true);
    }
});


// Endpoint to allow the user to upload an avatar profile.
// We register another callback function to run .. its important we provided this  (error, req, res , next) arguments, so express know that we are handling errors.
// Multer is then added as middleware for the specific endpoint that should allow for file uploads. The route below is expecting a single avatar field on the submitted form.
router.post("/users/me/avatar" , auth,  upload.single("avatar") , async (req,res) => {
    
    // we provided sharp the original image , we resize the image, convert it to the png format, and get the buffer of the modified version.
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    
    // We stored the modified final version of the image in the avatar property of the user.
    req.user.avatar = buffer;

    // we save the avatar in the database
    await req.user.save();
    res.send();

}, (error, req, res , next) => {
    res.status(400).send({error: error.message});
});

// Delete the avatar from the authenticated user.
router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

// Endpoint that fetchs the avatar image and return it to the user.
router.get("/users/me/avatar", auth, async (req,res) =>{
    try {
    
    // If the user doesnt have an avatan image.
    if(!req.user.avatar){
        throw new Error();
    }

    // If it has it set the resonse to be a type png and return the image.   
    res.set("Content-Type","image/png");
    res.send(req.user.avatar);

    } catch (error) {
       res.status(400).send();
    }
});

// Export the router from this file
module.exports = router;

