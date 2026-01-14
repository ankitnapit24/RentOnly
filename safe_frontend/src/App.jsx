import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [rooms, setRooms] = useState([]);
  const [imageIndexMap, setImageIndexMap] = useState({});

  const [pendingRooms, setPendingRooms] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [showAdmin, setShowAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [pendingApprovalMode, setpendingApprovalMode] = useState(false);
  const [enquiryMode, setEnquiryMode] = useState(false);
  const [allApprovedRooms, setAllApprovedRooms] = useState([]);

  const [filterLocation, setFilterLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [adminRoom, setAdminRoom] = useState({
    title: "",
    location: "",
    price: "",
    room_type: "",
    imageFiles: [],
  });

  const [uploading, setUploading] = useState(false);
  
  // Image popup state
  const [imagePopup, setImagePopup] = useState(null); // { room, index }

  /* ================= FETCH ================= */

  const fetchRooms = (location = "", min = "", max = "") => {
    let url = "http://localhost:5000/rooms";
    const params = [];

    if (location.trim() !== "") {
      params.push(`location=${encodeURIComponent(location)}`);
    }
    if (min !== "") params.push(`minPrice=${min}`);
    if (max !== "") params.push(`maxPrice=${max}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    fetch(url)
      .then((res) => res.json())
      .then(setRooms);
  };

  const fetchPendingRooms = () => {
    fetch("http://localhost:5000/admin/rooms")
      .then((res) => res.json())
      .then(setPendingRooms);
  };

  const fetchEnquiries = () => {
    fetch("http://localhost:5000/admin/enquiries")
      .then((res) => res.json())
      .then(setEnquiries);
  };

  const fetchAllApprovedRooms = () => {
    fetch("http://localhost:5000/rooms")
      .then((res) => res.json())
      .then(setAllApprovedRooms);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  /* ================= ADMIN ACTIONS ================= */

  const approveRoom = (id) => {
    fetch(`http://localhost:5000/admin/rooms/${id}/approve`, {
      method: "PUT",
    }).then(() => {
      alert("Room approved ✅");
      fetchPendingRooms();
      fetchRooms();
    });
  };

  const rejectRoom = (id) => {
    fetch(`http://localhost:5000/admin/rooms/${id}/reject`, {
      method: "DELETE",
    }).then(() => {
      alert("Room rejected ❌");
      fetchPendingRooms();
    });
  };

  const deleteRoom = (id) => {
    if (!window.confirm("Delete this room?")) return;

    fetch(`http://localhost:5000/admin/rooms/${id}`, {
      method: "DELETE",
    }).then(() => {
      alert("Room deleted 🗑️");
      fetchRooms();
      fetchPendingRooms();
      fetchAllApprovedRooms();
    });
  };

  /* ================= ADD ROOM WITH FILE UPLOAD ================= */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setAdminRoom({ ...adminRoom, imageFiles: files });
  };

  const addRoom = async () => {
    const { title, location, price, room_type, imageFiles } = adminRoom;

    if (!title || !location || !price || !room_type) {
      alert("Please fill all fields");
      return;
    }

    if (imageFiles.length === 0) {
      alert("Please select at least one image");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("location", location);
    formData.append("price", price);
    formData.append("room_type", room_type);

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    setUploading(true);

    try {
      const res = await fetch("http://localhost:5000/rooms", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Room submitted for approval ⏳");
        setShowAdmin(false);
        setAdminRoom({
          title: "",
          location: "",
          price: "",
          room_type: "",
          imageFiles: [],
        });
        if (adminMode) fetchPendingRooms();
      } else {
        alert(data.error || "Failed to submit room");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong while uploading");
    } finally {
      setUploading(false);
    }
  };

  /* ================= ENQUIRY ================= */

  const submitEnquiry = () => {
    if (!name || !phone) {
      alert("Fill all fields");
      return;
    }

    fetch("http://localhost:5000/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: selectedRoom.id,
        name,
        phone,
      }),
    }).then(() => {
      alert("Enquiry sent ✅");
      setSelectedRoom(null);
      setName("");
      setPhone("");
    });
  };

  /* ================= ADMIN LOGIN ================= */

  const adminLogin = () => {
    fetch("http://localhost:5000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        setAdminMode(true);
        setShowAdminLogin(false);
        fetchPendingRooms();
        fetchEnquiries();
      })
      .catch(() => alert("Invalid admin credentials ❌"));
  };

  const exitAdmin = () => {
    setAdminMode(false);
    setDeleteMode(false);
    setpendingApprovalMode(false);
    setEnquiryMode(false);
    setPendingRooms([]);
    setEnquiries([]);
  };

  /* ================= UI ================= */

  return (
    <div className="container">
      {/* TOP BAR */}
      <div className="top-bar">
        <h1>🏠 Rental Rooms</h1>

        <div className="top-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (adminMode) exitAdmin();
              else setShowAdminLogin(true);
            }}
          >
            {adminMode ? "Exit Admin" : "Admin Panel"}
          </button>

          {!adminMode && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAdmin(true)}
            >
              ➕ Add Room
            </button>
          )}
        </div>
      </div>

      {/* USER VIEW */}
      {!adminMode && (
        <>
          {/* FILTERS */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              placeholder="Search by location"
              value={filterLocation}
              onChange={(e) => {
                const v = e.target.value;
                setFilterLocation(v);
                fetchRooms(v, minPrice, maxPrice);
              }}
            />
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => {
                const v = e.target.value;
                setMinPrice(v);
                fetchRooms(filterLocation, v, maxPrice);
              }}
            />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => {
                const v = e.target.value;
                setMaxPrice(v);
                fetchRooms(filterLocation, minPrice, v);
              }}
            />
          </div>

          {/* ROOMS */}
          <div className="rooms-grid">
            {rooms.length === 0 ? (
              <div className="empty-state">
                <h3>No rooms found 😕</h3>
              </div>
            ) : (
              rooms.map((room) => (
                <div className="room-card" key={room.id}>
                  <div className="image-slider">
                    <img
                      src={
                        room.images && room.images.length > 0
                          ? room.images[imageIndexMap[room.id] || 0]
                          : room.image_url
                      }
                      alt={room.title}
                      onClick={() => setImagePopup({ room, index: imageIndexMap[room.id] || 0 })}
                      style={{ cursor: "pointer" }}
                    />

                    {room.images && room.images.length > 1 && (
                      <div className="slider-controls">
                        <button
                          onClick={() =>
                            setImageIndexMap((prev) => ({
                              ...prev,
                              [room.id]:
                                ((prev[room.id] || 0) - 1 +
                                  room.images.length) %
                                room.images.length,
                            }))
                          }
                        >
                          ←
                        </button>

                        <button
                          onClick={() =>
                            setImageIndexMap((prev) => ({
                              ...prev,
                              [room.id]:
                                ((prev[room.id] || 0) + 1) %
                                room.images.length,
                            }))
                          }
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="room-title">{room.title}</div>
                  <div>📍 {room.location}</div>
                  <div>₹ {room.price}</div>
                  <div>🛏 {room.room_type}</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedRoom(room)}
                  >
                    I'm Interested
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ADMIN PANEL - MAIN MENU */}
      {adminMode && !deleteMode && !pendingApprovalMode && !enquiryMode && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h2 style={{ marginBottom: "30px" }}>Admin Panel</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "400px", margin: "0 auto" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setpendingApprovalMode(true);
                fetchPendingRooms();
              }}
              style={{ padding: "15px", fontSize: "16px" }}
            >
              📋 Pending Approvals
            </button>
            
            <button
              className="btn btn-primary"
              onClick={() => {
                setEnquiryMode(true);
                fetchEnquiries();
              }}
              style={{ padding: "15px", fontSize: "16px" }}
            >
              📩 View Enquiries
            </button>
            
            <button
              className="btn btn-danger"
              onClick={() => {
                setDeleteMode(true);
                fetchAllApprovedRooms();
              }}
              style={{ padding: "15px", fontSize: "16px" }}
            >
              🗑️ Delete Approved Rooms
            </button>
          </div>
        </div>
      )}

      {/* PENDING APPROVAL SECTION */}
      {adminMode && pendingApprovalMode && (
        <>
          <button
            className="btn btn-secondary"
            onClick={() => setpendingApprovalMode(false)}
          >
            ⬅ Back to Admin Menu
          </button>

          <h2>Pending Approvals</h2>

          <div className="rooms-grid">
            {pendingRooms.map((room) => (
              <div className="room-card" key={room.id}>
                <div className="image-slider">
                  <img
                    src={
                      room.images && room.images.length > 0
                        ? room.images[imageIndexMap[room.id] || 0]
                        : room.image_url
                    }
                    alt={room.title}
                    onClick={() => setImagePopup({ room, index: imageIndexMap[room.id] || 0 })}
                    style={{ cursor: "pointer" }}
                  />

                  {room.images && room.images.length > 1 && (
                    <div className="slider-controls">
                      <button
                        onClick={() =>
                          setImageIndexMap((prev) => ({
                            ...prev,
                            [room.id]:
                              ((prev[room.id] || 0) - 1 + room.images.length) %
                              room.images.length,
                          }))
                        }
                      >
                        ←
                      </button>

                      <button
                        onClick={() =>
                          setImageIndexMap((prev) => ({
                            ...prev,
                            [room.id]:
                              ((prev[room.id] || 0) + 1) % room.images.length,
                          }))
                        }
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>

                <div className="room-title">{room.title}</div>
                <div>📍 {room.location}</div>
                <div>₹ {room.price}</div>
                <div>🛏 {room.room_type}</div>

                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => approveRoom(room.id)}
                  >
                    Approve
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => rejectRoom(room.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ENQUIRIES SECTION */}
      {adminMode && enquiryMode && (
        <>
          <button
            className="btn btn-secondary"
            onClick={() => setEnquiryMode(false)}
          >
            ⬅ Back to Admin Menu
          </button>

          <h2>Enquiries</h2>
          <div className="rooms-grid">
            {enquiries.length === 0 ? (
              <div className="empty-state">
                <h3>No enquiries yet 📭</h3>
              </div>
            ) : (
              enquiries.map((e) => (
                <div className="room-card" key={e.id}>
                  <b>{e.room_title}</b>
                  <p>👤 {e.name}</p>
                  <p>📞 {e.phone}</p>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    {new Date(e.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* DELETE MODE */}
      {adminMode && deleteMode && (
        <>
          <button
            className="btn btn-secondary"
            onClick={() => setDeleteMode(false)}
          >
            ⬅ Back to Admin Menu
          </button>
          <h2>Delete Approved Rooms</h2>
          <div className="rooms-grid">
            {allApprovedRooms.length === 0 ? (
              <div className="empty-state">
                <h3>No approved rooms found 🏚️</h3>
              </div>
            ) : (
              allApprovedRooms.map((room) => (
              <div className="room-card" key={room.id}>
                <div className="image-slider">
                  <img
                    src={
                      room.images && room.images.length > 0
                        ? room.images[imageIndexMap[room.id] || 0]
                        : room.image_url
                    }
                    alt={room.title}
                    onClick={() => setImagePopup({ room, index: imageIndexMap[room.id] || 0 })}
                    style={{ cursor: "pointer" }}
                  />

                  {room.images && room.images.length > 1 && (
                    <div className="slider-controls">
                      <button
                        onClick={() =>
                          setImageIndexMap((prev) => ({
                            ...prev,
                            [room.id]:
                              ((prev[room.id] || 0) - 1 + room.images.length) %
                              room.images.length,
                          }))
                        }
                      >
                        ←
                      </button>

                      <button
                        onClick={() =>
                          setImageIndexMap((prev) => ({
                            ...prev,
                            [room.id]:
                              ((prev[room.id] || 0) + 1) % room.images.length,
                          }))
                        }
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
                <div className="room-title">{room.title}</div>
                <div>📍 {room.location}</div>
                <div>₹ {room.price}</div>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteRoom(room.id)}
                >
                  Delete
                </button>
              </div>
            ))
            )}
          </div>
        </>
      )}

      {/* ADD ROOM MODAL */}
      {showAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Room</h2>

            <input
              placeholder="Title"
              value={adminRoom.title}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, title: e.target.value })
              }
            />
            <input
              placeholder="Location"
              value={adminRoom.location}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, location: e.target.value })
              }
            />
            <input
              placeholder="Price"
              type="number"
              value={adminRoom.price}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, price: e.target.value })
              }
            />
            <input
              placeholder="Room Type"
              value={adminRoom.room_type}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, room_type: e.target.value })
              }
            />

            <div style={{ marginTop: "10px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                📷 Upload Images (Max 5):
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              {adminRoom.imageFiles.length > 0 && (
                <p style={{ marginTop: "5px", fontSize: "14px" }}>
                  {adminRoom.imageFiles.length} image(s) selected
                </p>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={addRoom}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Submit"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAdmin(false)}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN */}
      {showAdminLogin && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Admin Login</h2>
            <input
              placeholder="Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <button className="btn btn-primary" onClick={adminLogin}>
              Login
            </button>
          </div>
        </div>
      )}

      {/* ENQUIRY MODAL */}
      {selectedRoom && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedRoom.title}</h2>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary" onClick={submitEnquiry}>
              Submit
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedRoom(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* IMAGE POPUP */}
      {imagePopup && (
        <div className="modal-overlay" onClick={() => setImagePopup(null)}>
          <div className="image-popup-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-popup" 
              onClick={() => setImagePopup(null)}
            >
              ✕
            </button>

            <div className="popup-slider">
              <button
                className="popup-prev"
                onClick={() => {
                  const images = imagePopup.room.images || [imagePopup.room.image_url];
                  const newIndex = (imagePopup.index - 1 + images.length) % images.length;
                  setImagePopup({ ...imagePopup, index: newIndex });
                }}
              >
                ←
              </button>

              <img
                src={
                  imagePopup.room.images && imagePopup.room.images.length > 0
                    ? imagePopup.room.images[imagePopup.index]
                    : imagePopup.room.image_url
                }
                alt={imagePopup.room.title}
              />

              <button
                className="popup-next"
                onClick={() => {
                  const images = imagePopup.room.images || [imagePopup.room.image_url];
                  const newIndex = (imagePopup.index + 1) % images.length;
                  setImagePopup({ ...imagePopup, index: newIndex });
                }}
              >
                →
              </button>
            </div>

            <div className="popup-counter">
              {imagePopup.index + 1} / {(imagePopup.room.images?.length || 1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;