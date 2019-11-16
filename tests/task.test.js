const app = require("../src/app");
const request = require("supertest");
const Task = require("../src/models/task")

// Load module that set up and populate the database for the test suites.
const {
    userOneId,
    userOne, 
    userTwoId, 
    userTwo, 
    taskOne, 
    taskTwo, 
    taskThree, 
    setupDatabase
} = require("./fixtures/db");

// The function will run before each test case in this test suite.
beforeEach(setupDatabase);


test("Should create task for user", async () => {
    const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: "Surf big waves"
        })
        .expect(201);

    // Find the task by its id and check if it was saved in the database correctly.

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();

    // Make sure the completed property of the task is set to false
    expect(task.completed).toEqual(false);
});

test("Should fetch user tasks", async() => {
    const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    
    // Checking if the user one has two tasks.
    expect(response.body.length).toEqual(2);
});

test("Should not delete other users tasks", async() => {

    // the second user try to delete task one ( he shouldn be able to do it)
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);

    // Assert the task is still in the database.
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
    
});

test("Should delete user task", async() => {
    // The userOne try to delete task one
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // Assert the task is NOT in the database.
    const task = await Task.findById(taskOne._id);
    expect(task).toBeNull();
});

test("Should not delete task if unauthenticated", async() => {
    
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .send()
        .expect(401);
    
    // Assert the task is still in the database.
    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
});

test("Should not update other users task", async() => {
    // the second user try to update task one ( he shouldn be able to do it because task one is own by user one)
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .send({
            description:"Update First Task"
        })
        .expect(404);
    
    // Assert the task description was not updated.
    const task = await Task.findById(taskOne._id);
    expect(task.description).not.toBe("Update First Task");

});

test("Should fetch user task by id", async() => {
    // We fetch the task one of user one.
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // Assert that we get task one.
    // We compare the string representation of the id of the response with the string representation of the id of task one.
    
    const responseStringId = response.body._id.toString();
    const taskOneStringId = taskOne._id.toString();

    expect(responseStringId).toBe(taskOneStringId);
});

test("Should not fetch user task by id if unauthenticated", async() => {
    // try to fetch task one without authentication
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401);
});

test("Should not fetch other users task by id", async() => {
    // the second user try to fetch task one by id ( he shouldnt be able to do it)
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);
});

test("Should fetch only completed tasks", async() => {
    // User one fetch its completed tasks
    const response = await request(app)
        .get(`/tasks?completed=true`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    // User one only has one completed task
    // So we check if the response is equal to 1
    expect(response.body.length).toEqual(1);
    
});

test("Should fetch only incomplete tasks", async() =>{
    // User one fetch its incompleted tasks
    const response = await request(app)
        .get(`/tasks?completed=false`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    
    // User one only has one incompleted task
    // So we check if the response is equal to 1
    expect(response.body.length).toEqual(1);
    
});

test("Should sort tasks by description", async() =>{
    // User one sort tasks by description (asc)
    const response = await request(app)
        .get(`/tasks?sortBy=description:asc`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    
    // We check if the response match with the way it should be sorted.
    expect(response.body).toMatchObject([{   
        description: 'First task'
    },{
        description: 'Second task'
    }]);
    
});

test("Should sort tasks by completed", async() =>{
      // User one sort tasks by completed (asc)
      const response = await request(app)
      .get(`/tasks?sortBy=completed:asc`)
      .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);
  
    // We check if the response match with the way it should be sorted.
    expect(response.body).toMatchObject([{   
        description: 'First task',
        completed: false
    },{
        description: 'Second task',
        completed: true
    }]);
});

test("Should sort tasks by createdAt", async() =>{
    // User one sort tasks by createdAt (asc)
      const response = await request(app)
        .get(`/tasks?sortBy=createdAt:asc`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
      
    // We check if the response match with the way it should be sorted.
    expect(response.body).toMatchObject([{   
        description: 'First task',
        completed: false
    },{
        description: 'Second task',
        completed: true
    }]);
});

test("Should sort tasks by updatedAt", async() =>{
    // User one sort tasks by updatedAt (asc)
    const response = await request(app)
    .get(`/tasks?sortBy=createdAt:asc`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  
    // We check if the response match with the way it should be sorted.
    expect(response.body).toMatchObject([{   
        description: 'First task',
        completed: false
    },{
        description: 'Second task',
        completed: true
    }]);
});

test("Should fetch page of tasks", async() =>{
    // Skip the first page, getting the second page and i just want 1 task.
    const response = await request(app)
        .get(`/tasks?limit=1&skip=1`)
        .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
      
    // We check if the response match with the way it should be sorted.
    expect(response.body).toMatchObject([{   
        description: 'Second task',
         completed: true
    }]);
});

// Some other test cases ideas:

// Should not create task with invalid description/completed
// Should not update task with invalid description/completed

