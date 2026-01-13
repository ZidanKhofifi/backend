const mongoose = require("mongoose");
const {Schema} = mongoose;

const OrderSchema = new Schema({
  // Daftar gorengan yang dibeli
  items: [
    {
      produkId: mongoose.Schema.Types.ObjectId, // Merujuk ke ID di schema produk
      nama: String,
      qty: Number,
      hargaSatuan: Number
    }
  ],
  
  // Sesuai instruksi: Ambil Sendiri atau Antar
  metode: {
    type: String,
    enum: ['ambil', 'antar'],
    required: true
  },
  
  
    namaPemesan: {
      type: String,
      required: true
    },
    
    nomorWA: {
      type: String,
      required: true,
    },
  
  
  // Alamat wajib diisi jika metode 'antar', kosong jika 'ambil'
  alamat: {
    type: String,
    default: null
  },
  
  // Input catatan tambahan dari user
  catatan: {
    type: String,
    default: ""
  },
  
  totalBayar: {
    type: Number,
    required: true
  },
  
  statusPesanan: {
    type: String,
    enum: ['pending', 'diproses', 'selesai', 'dibatalkan'],
    default: 'pending'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', OrderSchema)

module.exports = Order