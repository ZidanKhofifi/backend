const express = require("express");
const mongoose = require("mongoose");
const Gorengan = require("./models/gorengan");
const Order = require("./models/order");
const Setting = require("./models/setting");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");




require('dotenv').config()

const app = express()
app.use(express.json())

// Konfigurasi CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://nama-proyek-frontend-anda.vercel.app' // Tambahkan URL Vercel frontend nanti di sini
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/uploads', express.static('public/uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Simpan ke folder ini
  },
  filename: (req, file, cb) => {
    // Nama file: waktu-asli.jpg (misal: 17365829-bakwan.jpg)
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const koneksi = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI)
    console.log('Connected To Mongodb');
  } catch (e) {
    console.log(e);
  }
}

koneksi()

app.get('/', (req, res) => {
  res.status(200)
  res.send('Hello World!')
})

app.get('/gorengan', async (req,res) => {
  try {
   const data = await Gorengan.find()
   res.status(200).json({pesan: 'berhasil mengambil data', data})
  } catch (e) {
    res.status(404).json({error: e.message})
  }
})

app.post('/gorengan', upload.single('image'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "File gambar tidak terbaca" });
    }

    const newProduct = new Gorengan({
      nama: req.body.nama,
      harga: Number(req.body.harga),
      isStok: req.body.isStok,
      image: req.file.filename // HANYA SIMPAN NAMA FILE
    });
    

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);

  } catch (error) {
    console.error("Detail Error Server:", error); // CEK TERMINAL ANDA
    res.status(500).json({ message: "Gagal simpan ke DB", error: error.message });
  }
});

app.put('/gorengan/:id', async (req, res) => {
  try {
    const data = await Gorengan.findByIdAndUpdate(req.params.id, req.body)
  res.status(200).json({data})
  } catch (e) {
    res.status(500).json({error: e.message})
  }
  
})

app.delete('/gorengan/:id', async (req, res) => {
  try {
    // 1. Cari data produk di database dulu untuk mendapatkan nama filenya
    const produk = await Gorengan.findById(req.params.id);

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // 2. Tentukan path/lokasi file gambar tersebut
    const pathGambar = path.join(__dirname, 'public/uploads', produk.image);

    // 3. Hapus file gambar dari folder
    fs.unlink(pathGambar, (err) => {
      if (err) {
        console.error("Gagal menghapus file fisik:", err);
        // Tetap lanjut hapus data di DB meskipun file fisik gagal (opsional)
      } else {
        console.log("File fisik berhasil dihapus:", produk.image);
      }
    });

    // 4. Hapus data dari database
    await Gorengan.findByIdAndDelete(req.params.id);

    res.json({ message: "Produk dan gambar berhasil dihapus" });
  } catch (error) {
    console.error("Error hapus produk:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

app.post('/gorengan/checkout', async (req, res) => {
  try {
    const { namaPemesan, items, metode, alamat, catatan, totalBayar, nomorWA } = req.body;

    // 1. Validasi Nama (Wajib)
    if (!namaPemesan) {
      return res.status(400).json({ message: "Nama pemesan tidak boleh kosong!" });
    }

    // 2. Logika Ambil vs Antar (Sesuai Instruksi)
    if (metode === 'antar') {
      if (!alamat) {
        return res.status(400).json({ message: "Metode antar wajib mengisi alamat dan bayar QRIS!" });
      }
    }

    // 3. Simpan Pesanan ke Database
    // Pastikan variabel 'Order' merujuk pada Schema yang sudah dibuat
    const pesananBaru = new Order({
      namaPemesan,
      nomorWA,
      items,
      metode,
      alamat: metode === 'ambil' ? null : alamat, // Aturan: Ambil sendiri tidak perlu alamat
      catatan,
      totalBayar
    });

    await pesananBaru.save();

    res.status(201).json({ 
      success: true, 
      message: "Pesanan berhasil diterima!",
      idPesanan: pesananBaru._id 
    });

  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan pesanan", error: error.message });
  }
});

app.get('/gorengan/orders/list', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data pesanan" });
  }
});

app.delete('/gorengan/orders/:id', async (req, res) => {
  try {
    const data = await Order.findByIdAndDelete(req.params.id);
    
    if (!data) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.status(200).json({ message: "Pesanan berhasil dihapus", id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: e.message });
  }
});


app.patch('/gorengan/orders/status/:id', async(req, res) => {
  try {
    const data = await Order.findByIdAndUpdate(req.params.id, req.body)
    res.status(200).json({pesan: "berhasil"})
  } catch (e) {
    res.status(500).res
  }
})

// Ambil status toko
app.get('/gorengan/settings/status', async (req, res) => {
  try {
    let status = await Setting.findOne({ key: 'status_toko' });
    if (!status) {
      status = await Setting.create({ key: 'status_toko', isOpen: true });
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/gorengan/settings/status', async (req, res) => {
  try {
    const { isOpen } = req.body;
    const status = await Setting.findOneAndUpdate(
      { key: 'status_toko' },
      { isOpen },
      { new: true }
    );
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`app connected at http://localhost:3000`);
})

module.exports = app;
