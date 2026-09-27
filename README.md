# 🏠 RentOnly

RentOnly is a rental property platform designed to help users find **PGs, flats, and rooms in Bhopal** and directly submit enquiries for available properties.

The platform provides a property listing interface for users and an admin panel for managing room listings and enquiries.

---

## 🚀 Features

### 👤 User Features

- Browse available rental properties
- Search properties by area/location
- Filter properties by maximum price
- Browse popular areas in Bhopal
- View property images
- Multiple-image slider for properties
- Open images in a larger image viewer
- View property price and room type
- Submit an **"I'm Interested"** enquiry
- Load more properties dynamically

### 🔐 Admin Features

- Admin login
- View pending room listings
- Approve room listings
- Reject/delete pending listings
- Delete approved room listings
- View user enquiries
- Delete enquiries
- Add new room listings
- Upload multiple property images

### 🖼️ Image Management

- Supports multiple images for a property
- Maximum **5 images** can be uploaded for a room
- Images are stored using **Cloudinary**
- Supported formats:
  - JPG
  - JPEG
  - PNG
  - WEBP

---

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs

### Other Technologies

- Cloudinary — Image storage
- Multer — Multipart file handling
- CORS
- dotenv
- ESLint

---

## 🏗️ Project Structure

```text
RentOnly/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── config.js
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── models/
│   ├── Room.js
│   └── Enquiry.js
│
├── cloudinary.js
├── multer.js
├── index.js
├── package.json
├── package-lock.json
└── .gitignore
