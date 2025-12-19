const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    pID:{
        type: Number,
        required: true,
        unique: true
    },
    name:String,
    price:{
        type:String,
        required:true
    },
    mfDate:{
        type: String
    },
    expDate:{
        type: String
    },
    quantity:{
        type:Number,
        required:true
    }
});

module.exports = mongoose.model("Product",productSchema);