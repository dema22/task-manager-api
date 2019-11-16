const request = require("supertest");

// We want the express application before its been listen thats why we load app.js
const app = require("../src/app");
const User = require("../src/models/user");

// Load module that set up and populate the database for the test suites.
const {userOneId, userOne, setupDatabase} = require("./fixtures/db");

// The function will run before each test case in this test suite.
beforeEach(setupDatabase);

test("Should signup a new user", async () => {
    const response = await request(app).post("/users").send({
        name: "Felipe Demaria",
        email: "email@hotmail.com",
        password: "123mypass!!!"
    }).expect(201);

    // Assert that the database was change correctly.. We search the user by its id using the response from supertest.
    // We make an assertion that we expect the user to not be null.. that means the user exists in the dabatase.

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    // Assertions about the response (the response body at least has to have the properties we specify), its okey if it has other ones.
    // We are cheking if the user name, email and token matchs.
    expect(response.body).toMatchObject({
        user: {
            name: "Felipe Demaria",
            email: "email@hotmail.com"
        },
        token: user.tokens[0].token
    });

    // Check the plain password is not stored in the database
    expect(user.password).not.toBe("123mypass!!!");
});

test("Should not signup user with invalid email", async() => {
    await request(app)
        .post("/users")
        .send({
            name: "Felipe",
            // We provided an invalid type for email.
            email: "felipe@.com",
            password: "123mypass!!!"
        })
        .expect(400);
});

test("Should not signup user with invalid password", async() => {
    await request(app)
        .post("/users")
        .send({
            name: "Felipe",
            email: "felipe@hotmail.com",
            // We provided an invalid password (a valid one has at least 8 characters).
            password: "hello"
        })
        .expect(400);
});

test("Should log in existing user", async() => {
    const response = await request(app).post("/users/login").send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    // Fetch the user from the database
    const user = await User.findById(userOne._id);

    // Assert that the token in the response matchs the user second token
    expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not log in nonexistent user", async() => {
    await request(app).post("/users/login").send({
        email: userOne.email,
        password: "wrongpass!!"
    }).expect(400);
}); 
 
test("Should get profile for user", async () => {
    await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
    await request(app)
        .get("/users/me")
        .send()
        .expect(401);// We expect a 401 when our authorization middleware can not validate our tokens.
});

test("Should delete account for user", async () => {
    await request(app)
        .delete("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // Fetch the user from the database
    const user = await User.findById(userOne._id);
    
    // Assert null response
    expect(user).toBeNull();
});

test("Should not delete account for unauthenticated user", async () => {
    await request(app) 
        .delete("/users/me")
        .send()
        .expect(401);
});

test("Should upload avatar image", async () =>{
    await request(app)
        .post("/users/me/avatar")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .attach("avatar", "tests/fixtures/profile-pic.jpg")// Attach is a method provided by supertest that let us attach files (The first is the form field and the second path to the file)
        .expect(200);

    // We search the user in the database
    const user = await User.findById(userOneId);

    // Check if binary data is equal to any buffer
    expect(user.avatar).toEqual(expect.any(Buffer));

});

test("Should update valid user fields", async () => {
    await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: "Felipe"
        })
        .expect(200);

    // We check the data to confirm its changed
    const user = await User.findById(userOneId);

    expect(user.name).toEqual("Felipe");

});

test("Should not update invalid user field", async () => {
    await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: "Europe"
        })
        .expect(400);
});

test("Should not update user if unauthenticated", async() => {
    await request(app)
        .patch("/users/me")
        // We dont proivded the set method so we dont have authentication!
        .send({
            name: "Felipe"
        })
        .expect(401);
});

test("Should not update user with invalid name", async() => {
    await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            // We provided an invalid name
            name: []
        })
        .expect(400);
});

test("Should not update user with an invalid email", async() => {
    await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            // We provided an invalid email
            email: "feli@.com"
        })
        .expect(400);
});

test("Should not update user with an invalid password", async() => {
    await request(app)
        .patch("/users/me")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            // We provided an invalid password(it has less than 8 characters).
            password: "hello"
        })
        .expect(400);
});

test("Should not signup user with an invalid name", async() => {
    await request(app)
        .post("/users")
        .send({
         // We provided an invalid type for name.
         name: true,
         email: "felipe@hotmail.com",
         password: "123mypass!!!"
         })
         .expect(400);
});