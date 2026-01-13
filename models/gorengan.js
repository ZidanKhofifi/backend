const mongoose = require("mongoose");
const {Schema} = mongoose;

const gorenganSchema = new Schema(
  {
    nama: String,
    harga: Number,
    isStok: {
      type: Boolean,
      default: true
    },
    image: String
  }
  )
  
  const Gorengan = mongoose.model('Gorengan', gorenganSchema)
  module.exports = Gorengan