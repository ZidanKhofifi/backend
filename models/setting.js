const mongoose = require("mongoose");


const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'status_toko' },
  isOpen: { type: Boolean, default: true }
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting