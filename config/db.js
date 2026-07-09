const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/deskapp_auth_category";
        await mongoose.connect(mongoUrl);
        console.log("Database Connected Successfully !");
    } catch (error) {
        console.log("Database not Connected Successfully !", error.message);
    }
};

module.exports = connectDB;
