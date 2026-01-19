import { useEffect, useState } from "react";
import "./App.css";

// API URL Configuration
const API_URL = window.location.origin;

function App() {
  const [rooms, setRooms] = useState([]);
  const [imageIndexMap, setImageIndexMap] = useState({});

  // NEW: Pagination state
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
  const [maxPrice, setMaxPrice] = useState("");

  const [adminRoom, setAdminRoom] = useState({
    title: "",
    area_location: "",
    exact_location: "",
    price: "",
    room_type: "",
    owner_phone: "",
    imageFiles: [],
  });

  const [uploading, setUploading] = useState(false);
  
  // Image popup state
  const [imagePopup, setImagePopup] = useState(null);

  // Bhopal locations for dropdown
  const bhopalLocations = [
    "Anand Nagar",
    "Arera Colony",
    "Ashoka Garden",
    "Awadhpuri",
    "Ayodhya Bypass Road",
    "Bag Mugalia",
    "Bagsevania",
    "Bairagarh",
    "Bawadiya Kalan",
    "Berasia Road",
    "Bhopal Talkies",
    "Bittan Market",
    "Board Office",
    "Char Imli",
    "Chinar Fortune City",
    "Chunabhatti",
    "Dakachya",
    "Danish Kunj",
    "Gautam Nagar",
    "Govindpura",
    "Gulmohar",
    "Habibganj",
    "Hoshangabad Road",
    "Indrapuri",
    "Jahangirabad",
    "Kolar Road",
    "Lalghati",
    "MP Nagar",
    "Malviya Nagar",
    "Mansarovar Complex",
    "Misrod",
    "Narela Shankari",
    "Nehru Nagar",
    "New Market",
    "Patrakar Colony",
    "Piplani",
    "Raisen Road",
    "Saket Nagar",
    "Shahpura",
    "Shivaji Nagar",
    "Sunny City",
    "TT Nagar",
    "Vidhan Sabha",
  ];

  // Popular areas with property counts (you can update these dynamically)
  const popularAreas = [
    { name: "Indrapuri", icon: "🏢", count: "110+" },
    { name: "Anand Nagar", icon: "🏘️", count: "95+" },
    { name: "Ashoka Garden", icon: "🌳", count: "120+" },
    { name: "Awadhpuri", icon: "🏙️", count: "85+" }
  ];

  /* ================= FETCH ================= */

  const fetchRooms = (location = "", max = "") => {
    let url = `${API_URL}/rooms`;
    const params = [];

    if (location.trim() !== "") {
      params.push(`location=${encodeURIComponent(location)}`);
    }
    if (max !== "") params.push(`maxPrice=${max}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    fetch(url)
      .then((res) => res.json())
      .then(data => {
        setRooms(data);
        // Reset visible count when new rooms are fetched (e.g., after filtering)
        setVisibleCount(10);
      })
      .catch((err) => console.error("Error fetching rooms:", err));
  };

  // NEW: Load more rooms function
  const loadMoreRooms = () => {
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleCount(prevCount => prevCount + 10);
      setIsLoadingMore(false);
      
      // Smooth scroll to show new content
      setTimeout(() => {
        window.scrollBy({
          top: 400,
          behavior: 'smooth'
        });
      }, 100);
    }, 300);
  };

  // NEW: Handle popular area click
  const handleAreaClick = (areaName) => {
    setFilterLocation(areaName);
    fetchRooms(areaName, maxPrice);
    // Smooth scroll to rooms section
    setTimeout(() => {
      const roomsSection = document.querySelector('.featured-section');
      if (roomsSection) {
        roomsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const fetchPendingRooms = () => {
    fetch(`${API_URL}/admin/rooms`)
      .then((res) => res.json())
      .then(setPendingRooms)
      .catch((err) => console.error("Error fetching pending rooms:", err));
  };

  const fetchEnquiries = () => {
    fetch(`${API_URL}/admin/enquiries`)
      .then((res) => res.json())
      .then(setEnquiries)
      .catch((err) => console.error("Error fetching enquiries:", err));
  };

  const fetchAllApprovedRooms = () => {
    fetch(`${API_URL}/rooms`)
      .then((res) => res.json())
      .then(setAllApprovedRooms)
      .catch((err) => console.error("Error fetching approved rooms:", err));
  };

  useEffect(() => {
    fetchRooms();
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.style.transition = 'opacity 0.5s ease';
      document.body.style.opacity = '1';
    }, 100);
  }, []);

  /* ================= ADMIN ACTIONS ================= */

  const approveRoom = (id) => {
    fetch(`${API_URL}/admin/rooms/${id}/approve`, {
      method: "PUT",
    }).then(() => {
      alert("Room approved ✅");
      fetchPendingRooms();
      fetchRooms();
    }).catch((err) => console.error("Error approving room:", err));
  };

  const rejectRoom = (id) => {
    fetch(`${API_URL}/admin/rooms/${id}/reject`, {
      method: "DELETE",
    }).then(() => {
      alert("Room rejected ❌");
      fetchPendingRooms();
    }).catch((err) => console.error("Error rejecting room:", err));
  };

  const deleteRoom = (id) => {
    if (!window.confirm("Delete this room?")) return;

    fetch(`${API_URL}/admin/rooms/${id}`, {
      method: "DELETE",
    }).then(() => {
      alert("Room deleted 🗑️");
      fetchRooms();
      fetchPendingRooms();
      fetchAllApprovedRooms();
    }).catch((err) => console.error("Error deleting room:", err));
  };

  const deleteEnquiry = (id) => {
    if (!window.confirm("Delete this enquiry?")) return;

    fetch(`${API_URL}/admin/enquiries/${id}`, {
      method: "DELETE",
    }).then(() => {
      alert("Enquiry deleted 🗑️");
      fetchEnquiries();
    }).catch((err) => console.error("Error deleting enquiry:", err));
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
    const { title, area_location, exact_location, price, room_type, owner_phone, imageFiles } = adminRoom;

    if (!title || !area_location || !exact_location || !price || !room_type || !owner_phone) {
      alert("Please fill all fields");
      return;
    }

    if (imageFiles.length === 0) {
      alert("Please select at least one image");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("area_location", area_location);
    formData.append("exact_location", exact_location);
    formData.append("price", price);
    formData.append("room_type", room_type);
    formData.append("owner_phone", owner_phone);

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Room submitted for approval ⏳");
        setShowAdmin(false);
        setAdminRoom({
          title: "",
          area_location: "",
          exact_location: "",
          price: "",
          room_type: "",
          owner_phone: "",
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

    fetch(`${API_URL}/enquiry`, {
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
    }).catch((err) => console.error("Error submitting enquiry:", err));
  };

  /* ================= ADMIN LOGIN ================= */

  const adminLogin = () => {
    fetch(`${API_URL}/admin/login`, {
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

  // Get rooms to display based on visible count
  const displayedRooms = rooms.slice(0, visibleCount);
  const hasMoreRooms = visibleCount < rooms.length;

  /* ================= UI ================= */

  return (
    <div className="container">
      {/* TOP BAR */}
      <div className="top-bar">
        <h1>🏠 Rent Only</h1>

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
          {/* HERO SECTION */}
          <div className="hero-section">
            <h2>Find PGs, Flats & Rooms in Bhopal</h2>
            <p className="hero-subtitle">Zero Brokerage • Verified Properties • Direct Contact</p>
            
            <div className="hero-features">
              <div className="feature-badge">✓ Zero Brokerage</div>
              <div className="feature-badge">✓ Verified Properties</div>
              <div className="feature-badge">✓ Direct Contact</div>
              <div className="feature-badge">✓ 1000+ Listings</div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filters-container">
            <input
              type="text"
              placeholder="Search by location"
              value={filterLocation}
              onChange={(e) => {
                const v = e.target.value;
                setFilterLocation(v);
                fetchRooms(v, maxPrice);
              }}
            />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => {
                const v = e.target.value;
                setMaxPrice(v);
                fetchRooms(filterLocation, v);
              }}
            />
            
            <button
            className="btn btn-reset"
            onClick={() => {


              setFilterLocation("");
              setMaxPrice("");
              fetchRooms("","");

            }}
           >
            Reset Filters
           </button>

          </div>



          {/* FEATURED PROPERTIES SECTION */}
          <div className="featured-section">
            <h2>Featured Properties</h2>
            <p className="featured-subtitle">Browse through our handpicked verified listings in Bhopal</p>
          </div>

          {/* ROOMS - USER VIEW (NO EXACT LOCATION) */}
          <div className="rooms-grid">
            {displayedRooms.length === 0 ? (
              <div className="empty-state">
                <h3>No rooms found 😕</h3>
              </div>
            ) : (
              displayedRooms.map((room) => (
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

                  <div className="room-content">
                    <div className="room-title">{room.title}</div>
                    {/* ONLY SHOW AREA LOCATION, NOT EXACT ADDRESS */}
                    <div className="room-info">📍 {room.area_location || room.location}</div>
                    <div className="room-info">₹ {room.price}</div>
                    <div className="room-info">🛏 {room.room_type}</div>
                    <button
                      className="btn btn-primary room-btn"
                      onClick={() => setSelectedRoom(room)}
                    >
                      I'm Interested
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

      
          {/* LOAD MORE BUTTON SECTION */}
          {rooms.length > 0 && hasMoreRooms && (
            <div className="load-more-container">
              <button
                className="btn btn-primary load-more-btn"
                onClick={loadMoreRooms}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <span className="loading-spinner"></span>
                    Loading...
                  </>
                ) : (
                  `Load More (${rooms.length - visibleCount} more rooms)`
                )}
              </button>
            </div>
          )}

          {/* POPULAR AREAS SECTION - NEW */}
          <div className="popular-areas-section">
            <h2>Explore Popular Areas in Bhopal</h2>
            <p className="popular-subtitle">Find your perfect room in these prime locations</p>
            
            <div className="popular-areas-grid">
              {popularAreas.map((area, index) => (
                <div 
                  className="area-card" 
                  key={index}
                  onClick={() => handleAreaClick(area.name)}
                >
                  <div className="area-icon">{area.icon}</div>
                  <h3>{area.name}</h3>
                  <p>{area.count} Properties</p>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="footer-section">
            <div className="footer-content">
              <h3>📞 Contact Us</h3>
              <p>Email: rentonly00@gmail.com </p>
              <p>Address: Bhopal, Madhya Pradesh</p>
              
              <div className="footer-links">
                <a href="#">About Us</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">FAQ</a>
              </div>
              
              <p className="footer-copyright">
                © {new Date().getFullYear()} Rent Only. All rights reserved.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ADMIN PANEL - MAIN MENU */}
      {adminMode && !deleteMode && !pendingApprovalMode && !enquiryMode && (
        <div className="admin-menu-container">
          <h2>Admin Panel</h2>
          <div className="admin-menu-buttons">
            <button
              className="btn btn-primary"
              onClick={() => {
                setpendingApprovalMode(true);
                fetchPendingRooms();
              }}
            >
              📋 Pending Approvals
            </button>
            
            <button
              className="btn btn-primary"
              onClick={() => {
                setEnquiryMode(true);
                fetchEnquiries();
              }}
            >
              📩 View Enquiries
            </button>
            
            <button
              className="btn btn-danger"
              onClick={() => {
                setDeleteMode(true);
                fetchAllApprovedRooms();
              }}
            >
              🗑️ Delete Approved Rooms
            </button>
          </div>
        </div>
      )}

      {/* PENDING APPROVAL SECTION - ADMIN VIEW (SHOWS EXACT LOCATION) */}
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

                <div className="room-content">
                  <div className="room-title">{room.title}</div>
                  {/* ADMIN CAN SEE EXACT LOCATION */}
                  <div className="room-info">📍 {room.location}</div>
                  <div className="room-info">₹ {room.price}</div>
                  <div className="room-info">🛏 {room.room_type}</div>
                  <div className="room-info">📞 {room.owner_phone}</div>

                  <div className="admin-actions">
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
                <div className="room-card enquiry-card" key={e.id}>
                  <div className="room-content">
                    <b>{e.room_title}</b>
                    <p>👤 {e.name}</p>
                    <p>📞 {e.phone}</p>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </p>
                    <button
                      className="btn btn-danger room-btn"
                      onClick={() => deleteEnquiry(e.id)}
                      style={{ marginTop: "10px" }}
                    >
                      Delete Enquiry
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* DELETE MODE - ADMIN VIEW */}
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
                <div className="room-content">
                  <div className="room-title">{room.title}</div>
                  {/* ADMIN CAN SEE EXACT LOCATION IN DELETE MODE */}
                  <div className="room-info">📍 Area: {room.area_location || room.location}</div>
                  <div className="room-info">🏠 Address: {room.exact_location || "Not provided"}</div>
                  <div className="room-info">₹ {room.price}</div>
                  <div className="room-info">🛏 {room.room_type}</div>
                  <div className="room-info">📞 {room.owner_phone}</div>
                  <button
                    className="btn btn-danger room-btn"
                    onClick={() => deleteRoom(room.id)}
                  >
                    Delete
                  </button>
                </div>
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
              type="text"
              placeholder="Title (e.g., Spacious 2BHK near Metro)"
              value={adminRoom.title}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, title: e.target.value })
              }
            />

            <label style={{ fontWeight: "bold", marginBottom: "8px", display: "block" }}>
              Location in Bhopal *
            </label>
            <select
              value={adminRoom.area_location}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, area_location: e.target.value })
              }
              style={{
                marginBottom: "20px",
                padding: "16px 24px",
                borderRadius: "12px",
                border: "2px solid rgba(102, 126, 234, 0.15)",
                background: "white",
                fontSize: "15px",
                width: "100%",
                fontFamily: "inherit",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              <option value="">Select Location</option>
              {bhopalLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {adminRoom.area_location && (
              <input
                type="text"
                placeholder="Enter complete address (House/Flat No., Street, Landmark...)"
                value={adminRoom.exact_location}
                onChange={(e) =>
                  setAdminRoom({ ...adminRoom, exact_location: e.target.value })
                }
              />
            )}

            <input
              placeholder="Rent per Month (₹)"
              type="number"
              value={adminRoom.price}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, price: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Room Type (e.g., 1BHK, 2BHK, PG, Single Room)"
              value={adminRoom.room_type}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, room_type: e.target.value })
              }
            />

            <input
              type="tel"
              placeholder="Owner Phone Number"
              value={adminRoom.owner_phone}
              onChange={(e) =>
                setAdminRoom({ ...adminRoom, owner_phone: e.target.value })
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
              type="text"
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
            <button
              className="btn btn-secondary"
              onClick={() => setShowAdminLogin(false)}
            >
              Cancel
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
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="btn btn-primary" onClick={submitEnquiry}>
              Submit Enquiry
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
