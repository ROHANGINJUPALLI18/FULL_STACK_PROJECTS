import express from "express";
import connectDB from "./config/db.js";
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const connectToTheDatabase = async () => {
  await connectDB();
  console.log("connected to the database");
};

connectToTheDatabase();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
