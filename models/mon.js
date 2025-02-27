const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  age: Number,
  password: String,
  image: { type: String, default: "default.png" }, // Stores image filename
});

module.exports = mongoose.model("User", userSchema);
