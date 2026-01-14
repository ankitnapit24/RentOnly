const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= MULTER + CLOUDINARY STORAGE ================= */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rental_rooms",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage: storage });

/* ================= MYSQL ================= */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB error", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

/* ================= GET APPROVED ROOMS ================= */
app.get("/rooms", (req, res) => {
  const { location, minPrice, maxPrice } = req.query;

  let sql = `SELECT * FROM rooms WHERE status='APPROVED'`;
  const values = [];

  if (location) {
    sql += " AND LOWER(location) LIKE ?";
    values.push(location.toLowerCase() + "%");
  }
  if (minPrice) {
    sql += " AND price >= ?";
    values.push(minPrice);
  }
  if (maxPrice) {
    sql += " AND price <= ?";
    values.push(maxPrice);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, values, (err, rooms) => {
    if (err) return res.status(500).json(err);

    if (rooms.length === 0) return res.json([]);

    const ids = rooms.map((r) => r.id);

    db.query(
      "SELECT room_id, image_url FROM room_images WHERE room_id IN (?)",
      [ids],
      (err2, images) => {
        if (err2) return res.status(500).json(err2);

        const map = {};
        images.forEach((i) => {
          if (!map[i.room_id]) map[i.room_id] = [];
          map[i.room_id].push(i.image_url);
        });

        rooms.forEach((r) => {
          r.images = map[r.id] || [];
        });

        res.json(rooms);
      }
    );
  });
});

/* ================= ADD ROOM (WITH CLOUDINARY) ================= */
app.post("/rooms", upload.array("images", 5), (req, res) => {
  const { title, location, price, room_type } = req.body;

  // Validation
  if (!title || !location || !price || !room_type) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one image required" });
  }

  // Get Cloudinary URLs
  const imageUrls = req.files.map((file) => file.path);
  const firstImage = imageUrls[0];

  const roomSql = `
    INSERT INTO rooms (title, location, price, room_type, image_url, status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `;

  db.query(
    roomSql,
    [title, location, price, room_type, firstImage],
    (err, result) => {
      if (err) {
        console.error("❌ Room insert error:", err);
        return res.status(500).json({ error: "Failed to add room" });
      }

      const roomId = result.insertId;
      const imgValues = imageUrls.map((url) => [roomId, url]);

      db.query(
        "INSERT INTO room_images (room_id, image_url) VALUES ?",
        [imgValues],
        (err2) => {
          if (err2) {
            console.error("❌ Images insert error:", err2);
            return res.status(500).json({ error: "Failed to save images" });
          }
          res.json({ success: true, message: "Room submitted ⏳" });
        }
      );
    }
  );
});

/* ================= ADMIN PENDING ================= */
app.get("/admin/rooms", (req, res) => {
  db.query(
    "SELECT * FROM rooms WHERE status='PENDING' ORDER BY id DESC",
    (err, rooms) => {
      if (err) return res.status(500).json(err);

      if (rooms.length === 0) return res.json([]);

      const ids = rooms.map((r) => r.id);

      db.query(
        "SELECT room_id, image_url FROM room_images WHERE room_id IN (?)",
        [ids],
        (err2, images) => {
          if (err2) return res.status(500).json(err2);

          const map = {};
          images.forEach((i) => {
            if (!map[i.room_id]) map[i.room_id] = [];
            map[i.room_id].push(i.image_url);
          });

          rooms.forEach((r) => {
            r.images = map[r.id] || [];
          });

          res.json(rooms);
        }
      );
    }
  );
});

/* ================= ADMIN ACTIONS ================= */
app.put("/admin/rooms/:id/approve", (req, res) => {
  db.query(
    "UPDATE rooms SET status='APPROVED' WHERE id=?",
    [req.params.id],
    () => res.json({ message: "Approved" })
  );
});

app.delete("/admin/rooms/:id/reject", (req, res) => {
  db.query("DELETE FROM rooms WHERE id=?", [req.params.id], () =>
    res.json({ message: "Rejected" })
  );
});

app.delete("/admin/rooms/:id", (req, res) => {
  db.query("DELETE FROM rooms WHERE id=?", [req.params.id], () =>
    res.json({ message: "Deleted" })
  );
});

/* ================= ENQUIRIES ================= */
app.post("/enquiry", (req, res) => {
  const { room_id, name, phone } = req.body;
  db.query(
    "INSERT INTO enquiries (room_id, name, phone) VALUES (?, ?, ?)",
    [room_id, name, phone],
    () => res.json({ message: "Saved" })
  );
});

app.get("/admin/enquiries", (req, res) => {
  db.query(
    `SELECT e.*, r.title AS room_title
     FROM enquiries e JOIN rooms r ON e.room_id=r.id
     ORDER BY e.created_at DESC`,
    (err, rows) => res.json(rows)
  );
});

/* ================= START ================= */
app.listen(5000, () => console.log("🚀 Server running on 5000"));