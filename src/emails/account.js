// We load sendgrid.
const sgMail = require("@sendgrid/mail");

// Set the API for sendgrid that is stored in our app as an environment variable.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function that send an email to the user.
const sendWelcomeEmail = (email, name) =>{
    // send an individual email , we pass an object and we configure it.
    sgMail.send({
        to: email,
        from: "felibss@gmail.com",
        subject: "Thanks for joining us!",
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

// Function that sends an email to the user, we call it when the user delete the account.
const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "felibss@gmail.com",
        subject: "We are removing your account from the task-manager application.",
        text: `Thanks for using the application, ${name}. Could we have done something for you to stay onboard?`
    });
}

// We export the two functions.
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
};