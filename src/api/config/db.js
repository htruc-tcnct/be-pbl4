const mongoose = require("mongoose");

const connectDB = async () => {
  const dbURI =
    "mongodb+srv://pbl4:" +
    process.env.MONGOOSE_PASS +
    "@cluster0.23v42gr.mongodb.net/pbl4?retryWrites=true&w=majority&appName=Cluster0";
  // mongodb+srv://pbl4:pbl4@cluster0.23v42gr.mongodb.net/pbl4?retryWrites=true&w=majority&appName=Cluster0
  try {
    await mongoose.connect(dbURI, {});

    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = connectDB;
