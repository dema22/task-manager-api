const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendWelcomeEmail = (email, name) =>{
    // send an individual email , we pass an object and configure it.
    sgMail.send({
        to: email,
        from: "felibss@gmail.com",
        subject: "Thanks for joining us!",
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "felibss@gmail.com",
        subject: "We are removing your account from the task-manager application.",
        text: `Thanks for using the application, ${name}. Could we have done something for you to stay onboard?`
    });
}
    
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
};