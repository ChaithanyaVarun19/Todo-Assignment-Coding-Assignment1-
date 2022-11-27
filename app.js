const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");
var parseISO = require("date-fns/parseISO");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
  app.listen(3000, () => {
    console.log("Server successfully started");
  });
};

initializeDBAndServer();

const checkValidityOfQuery = (request, response, next) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
    date = "",
  } = request.query;

  if (status != "") {
    if (status == "TO DO" || status == "DONE" || status == "IN PROGRESS") {
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (priority != "") {
    if (priority == "HIGH" || priority == "LOW" || priority == "MEDIUM") {
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (category != "") {
    if (category == "HOME" || category == "WORK" || category == "LEARNING") {
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (date != "") {
    const dateArray = date.split("-");
    const year = dateArray[0];
    let month = dateArray[1];
    let day = dateArray[2];
    if (month.length == 1) {
      month = "0" + month;
    }
    if (day.length == 1) {
      day = "0" + day;
    }
    if (isValid(parseISO(`${year}-${month}-${day}`))) {
      console.log("Valid date");
    } else {
      console.log("Error in validation");
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

const checkValidityOfBody = (request, response, next) => {
  console.log("Check body validity");
  const {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;

  console.log(status);
  console.log(priority);
  console.log(category);
  console.log(dueDate);

  if (status != "") {
    if (status == "TO DO" || status == "DONE" || status == "IN PROGRESS") {
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (priority != "") {
    if (priority == "HIGH" || priority == "LOW" || priority == "MEDIUM") {
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }
  if (category != "") {
    if (category == "HOME" || category == "WORK" || category == "LEARNING") {
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (dueDate != "") {
    const dateArray = dueDate.split("-");
    const year = dateArray[0];
    let month = dateArray[1];
    let day = dateArray[2];
    if (month.length == 1) {
      month = "0" + month;
    }
    if (day.length == 1) {
      day = "0" + day;
    }
    if (isValid(parseISO(`${year}-${month}-${day}`))) {
      console.log("Valid date");
    } else {
      console.log("Error in validation");
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  next();
};

const dbResponseToResponseObject = (dbObject) => ({
  id: dbObject.id,
  todo: dbObject.todo,
  priority: dbObject.priority,
  status: dbObject.status,
  category: dbObject.category,
  dueDate: dbObject.due_date,
});

//Query parameters execution API

app.get("/todos/", checkValidityOfQuery, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  const filterQuery = `
    SELECT * FROM todo
    WHERE (todo LIKE "%${search_q}%") AND (priority LIKE '%${priority}%') AND (status LIKE '%${status}%' AND (category LIKE '%${category}%'))
    `;
  console.log(filterQuery);
  const dbResponse = await db.all(filterQuery);
  const formattedResponse = dbResponse.map((each) =>
    dbResponseToResponseObject(each)
  );
  response.send(formattedResponse);
});

//Get todo details based ID API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDetailsQuery = `
    SELECT * from todo WHERE id=${todoId}
    `;
  const dbResponse = await db.get(getDetailsQuery);
  response.send(dbResponseToResponseObject(dbResponse));
});

//Get the todo with a specific due date API

app.get("/agenda/", checkValidityOfQuery, async (request, response) => {
  console.log("Entering the API");
  const { date } = request.query;
  const dateArray = date.split("-");
  const year = dateArray[0];
  let month = dateArray[1];
  let day = dateArray[2];
  if (month.length == 1) {
    month = "0" + month;
  }
  if (day.length == 1) {
    day = "0" + day;
  }
  const formattedDate = `${year}-${month}-${day}`;
  console.log(formattedDate);
  const filterQuery = `SELECT * FROM todo WHERE due_date = '${formattedDate}'`;
  const dbResponse = await db.all(filterQuery);
  response.send(dbResponse.map((each) => dbResponseToResponseObject(each)));
});

//Add a todo item API
app.post("/todos/", checkValidityOfBody, async (request, response) => {
  console.log("Entering into API");
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  console.log(status);
  console.log(priority);
  console.log(category);
  console.log(dueDate);

  const addTodoQuery = `
    INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')
    `;
  const dbResponse = await db.run(addTodoQuery);
  console.log("Updated DB");
  response.send("Todo Successfully Added");
});

//Update the details of specific todo API
app.put("/todos/:todoId/", checkValidityOfBody, async (request, response) => {
  const { todoId } = request.params;
  const getPrevioustodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const previousTodo = await db.get(getPrevioustodoQuery);

  const updateRequest = request.body;
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = updateRequest;

  if (todo !== previousTodo.todo) {
    tobeUpdatedField = "Todo";
  } else if (priority !== previousTodo.priority) {
    tobeUpdatedField = "Priority";
  } else if (status !== previousTodo.status) {
    tobeUpdatedField = "Status";
  } else if (category !== previousTodo.category) {
    tobeUpdatedField = "Category";
  } else {
    tobeUpdatedField = "Due Date";
  }
  const updateToDoQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category = '${category}',due_date='${dueDate}' WHERE id=${todoId}`;

  const dbResponse = await db.run(updateToDoQuery);
  response.send(`${tobeUpdatedField} Updated`);
});

//Delete a todo API

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id=${todoId}
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
