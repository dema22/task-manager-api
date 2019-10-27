// We load the npm for the JWTs and our User model.
const jwt = require("jsonwebtoken");
const User = require("../models/user");


// Express middleware for authenticate a user token.
const auth = async (req, res, next) => {
    try {
        // First we get the value of the authorization header ( that has the token value).. Using the header method, to access incoming headers. We pass the name of the header we want to access.
        // I have the complete value ,i need to extract the token from it, that is why i use replace ( to remove the "Bearer " name)
        // note: if there is no header, it returns undefined, if we try to use undefined  with replace , it throws an error, and the catch will run.

        const token = req.header("Authorization").replace("Bearer ", "");
        
        // Now that we have the token, we are going to check if its VALID. We have to make sure if it was created by our server.
        // Using verify, we pass the token we want to validate and the same secret we used in its creation.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Now we are going to find the user (its id was embbeded in the token by us) and also check if the authorization token is still in the array of tokens. ( Maybe the user log out and that token was removed).

        const user = await User.findOne({ _id: decoded._id , "tokens.token": token});

        // If there is not a valid user we throw an error
        if(!user){
            throw new Error();
        } 
        
        // If there is, it means the user has been authenticated correctly.
        // Because We fetch the user,  we can add it to the request itself and the route handlers can access it and dont have to fecth it again.
        // We also add to the request the token of the user.

        req.token = token;
        req.user = user;
        next();

    } catch (error) {
        // If the user is not authenticated , we just send an error back with the response.
        res.status(401).send({ error: "Please authenticate."});
    }
};

module.exports = auth;