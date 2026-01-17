import React, { useState, useEffect } from 'react';

export default function App() {
  // States from new UI
  const [selectedTab, setSelectedTab] = useState('pg');
  const [filters, setFilters] = useState({ type: 'all', price: 'all' });
  
  // States from old functionality
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [pendingApprovalMode, setpendingApprovalMode] = useState(false);
  const [enquiryMode, setEnquiryMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [pendingRooms, setPendingRooms] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [allApprovedRooms, setAllApprovedRooms] = useState([]);
  const [adminRoom, setAdminRoom] = useState({
    title: '',
    location: '',
    price: '',
    room_type: '',
    imageFiles: []
  });
  const [uploading, setUploading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [imageIndexMap, setImageIndexMap] = useState({});
  const [imagePopup, setImagePopup] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Properties for the hero section (demo data)
  const properties = [
    { id: 1, type: 'ROOM', title: '1BHK', location: 'Govindpura, Bhopal', price: 7000, emoji: '🏠' },
    { id: 2, type: 'PG', title: 'Premium PG for Boys', location: 'Arera Colony, Bhopal', price: 7500, emoji: '🏡' },
    { id: 3, type: 'FLAT', title: '2BHK Modern Flat', location: 'Arera Colony, Bhopal', price: 15000, emoji: '🏢' },
    { id: 4, type: 'ROOM', title: 'Single Room', location: 'Arera Colony, Bhopal', price: 6000, emoji: '🚪' }
  ];

  // Fetch rooms from backend
  const fetchRooms = (location = '', min = '', max = '') => {
    let url = `${API_URL}/rooms`;
    const params = [];
    
    if (location) params.push(`location=${location}`);
    if (min) params.push(`minPrice=${min}`);
    if (max) params.push(`maxPrice=${max}`);
    
    if (params.length > 0) url += `?${params.join('&')}`;
    
    fetch(url)
      .then((res) => res.json())
      .then(setRooms)
      .catch((err) => console.error("Error fetching rooms:", err));
  };

  const fetchPendingRooms = () => {
    fetch(`${API_URL}/admin/rooms`)
      .then((res) => res.json())
      .then(setPendingRooms)
      .catch((err) => console.error("Error fetching pending rooms:", err));
  };

  const fetchAllApprovedRooms = () => {
    fetch(`${API_URL}/rooms`)
      .then((res) => res.json())
      .then(setAllApprovedRooms)
      .catch((err) => console.error("Error fetching approved rooms:", err));
  };

  const fetchEnquiries = () => {
    fetch(`${API_URL}/admin/enquiries`)
      .then((res) => res.json())
      .then(setEnquiries)
      .catch((err) => console.error("Error fetching enquiries:", err));
  };

  useEffect(() => {
    fetchRooms();
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

  /* ================= SEARCH FUNCTIONALITY ================= */
  const handleSearch = () => {
    const locationInput = document.querySelector('input[placeholder="Select Location in Bhopal"]');
    const budgetInput = document.querySelector('input[placeholder="Max budget (₹)"]');
    
    const location = locationInput ? locationInput.value : '';
    const maxPrice = budgetInput ? budgetInput.value : '';
    
    // Convert tab selection to room type filter
    let roomType = '';
    switch(selectedTab) {
      case 'pg': roomType = 'PG'; break;
      case 'flats': roomType = 'FLAT'; break;
      case 'houses': roomType = 'HOUSE'; break;
    }
    
    // Update filters and fetch rooms
    setFilters({
      type: roomType || 'all',
      price: maxPrice ? 'high' : 'all'
    });
    
    fetchRooms(location, '', maxPrice);
  };

  /* ================= RENDER ================= */
  return (
    <div style={{ fontFamily: '-apple-system, sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <span style={{ fontSize: '1.8rem' }}>🏠</span>
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RentOnly</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#home" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Home</a>
            <a href="#properties" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Properties</a>
            <a href="#how" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>How It Works</a>
            <a href="#post" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>Post Property</a>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setShowAdminLogin(true)}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Admin
            </button>
            <button 
              onClick={() => setShowAdmin(true)}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              + Add Property
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '4rem 2rem', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', textAlign: 'center', lineHeight: 1.2 }}>
            Find PGs, Flats & Rooms in<br />Bhopal
          </h1>
          <p style={{ fontSize: '1.25rem', textAlign: 'center', marginBottom: '2rem', opacity: 0.95 }}>
            Zero Brokerage • Verified Properties • Direct Contact
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {['✓ Zero Brokerage', '✓ Verified Properties', '✓ Direct Contact', '✓ 1000+ Listings'].map((badge, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '0.75rem 1.5rem', borderRadius: '50px', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.3)' }}>
                {badge}
              </span>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
              {[{ id: 'pg', label: '🏠 PG/Rooms' }, { id: 'flats', label: '🏢 Flats' }, { id: 'houses', label: '🏡 Houses' }].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: selectedTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: selectedTab === tab.id ? '#6366f1' : '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <input type="text" placeholder="Select Location in Bhopal" style={{ padding: '1rem 1.5rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem' }} />
              <input type="text" placeholder="Max budget (₹)" style={{ padding: '1rem 1.5rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem' }} />
              <button 
                onClick={handleSearch}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                🔍 Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties - Now showing real data from backend */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1f2937', marginBottom: '0.75rem' }}>Featured Properties</h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Browse through our handpicked verified listings in Bhopal</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search location..." 
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value);
              fetchRooms(e.target.value, minPrice, maxPrice);
            }}
            style={{ padding: '0.75rem 1.25rem', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', minWidth: '200px' }}
          />
          <input 
            type="number" 
            placeholder="Min Price" 
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              fetchRooms(filterLocation, e.target.value, maxPrice);
            }}
            style={{ padding: '0.75rem 1.25rem', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', minWidth: '150px' }}
          />
          <input 
            type="number" 
            placeholder="Max Price" 
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              fetchRooms(filterLocation, minPrice, e.target.value);
            }}
            style={{ padding: '0.75rem 1.25rem', border: '2px solid #e5e7eb', borderRadius: '8px', background: 'white', minWidth: '150px' }}
          />
          <button 
            onClick={() => {
              setFilterLocation('');
              setMinPrice('');
              setMaxPrice('');
              fetchRooms();
            }}
            style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Reset Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {rooms.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
              <h3 style={{ color: '#6b7280' }}>No properties found. Try different filters or add a property!</h3>
            </div>
          ) : (
            rooms.map(room => (
              <div key={room.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'all 0.3s ease', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600, zIndex: 10 }}>
                  ✓ Verified
                </div>
                <div 
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                    height: '200px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setImagePopup({ room, index: imageIndexMap[room.id] || 0 })}
                >
                  {room.images && room.images.length > 0 ? (
                    <img 
                      src={room.images[imageIndexMap[room.id] || 0] || room.image_url} 
                      alt={room.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '5rem' }}>🏠</div>
                  )}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <span style={{ display: 'inline-block', background: '#ede9fe', color: '#6366f1', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    {room.room_type || 'ROOM'}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>{room.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1rem' }}>📍 {room.location}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>
                      ₹{room.price?.toLocaleString() || '0'}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#6b7280' }}>/month</span>
                    </span>
                    <button 
                      onClick={() => setSelectedRoom(room)}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                      I'm Interested
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Why Section */}
      <section style={{ background: '#f9fafb', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1f2937', marginBottom: '0.75rem' }}>Why Choose RentOnly?</h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Making your room search simple, fast, and stress-free</p>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            { icon: '✓', title: 'Verified Properties', desc: 'Only genuine and verified properties listed on our platform' },
            { icon: '💬', title: 'Direct Contact', desc: 'Connect instantly with landlords or tenants without intermediaries' },
            { icon: '💰', title: 'Zero Brokerage', desc: 'Post unlimited property ads with no charges or hidden fees' },
            { icon: '🎯', title: 'Easy Posting', desc: 'Both landlords and tenants can post their ads effortlessly' },
            { icon: '🔒', title: 'Secure Platform', desc: 'Communicate freely and safely through our secure platform' },
            { icon: '🛡️', title: 'Personalized Support', desc: 'Get help tailored to your needs with dedicated support' }
          ].map((feature, i) => (
            <div key={i} style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem', color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.75rem' }}>{feature.title}</h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Areas */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1f2937', marginBottom: '0.75rem' }}>Explore Popular Areas in Bhopal</h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Find your perfect room in these prime locations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {[
            { name: 'Arera Colony', count: '120+', emoji: '🏙️' },
            { name: 'TT Nagar', count: '95+', emoji: '🏙️' },
            { name: 'Piplani', count: '85+', emoji: '🌃' },
            { name: 'Indrapuri', count: '110+', emoji: '🏢' }
          ].map((area, i) => (
            <div 
              key={i} 
              onClick={() => {
                setFilterLocation(area.name);
                fetchRooms(area.name, minPrice, maxPrice);
              }}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: '3rem 2rem', borderRadius: '16px', textAlign: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{area.emoji}</div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{area.name}</h3>
              <p style={{ fontSize: '1rem', opacity: 0.9 }}>{area.count} Properties</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: 'white', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🏠 RentOnly Bhopal</h3>
            <p style={{ color: '#d1d5db', lineHeight: 1.8 }}>Making property search simple and brokerage-free in the City of Lakes.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#9ca3af' }}>Quick Links</h4>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>Home</a>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>Properties</a>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>Post Property</a>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#9ca3af' }}>Popular Areas</h4>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>Arera Colony</a>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>TT Nagar</a>
            <a href="#" style={{ color: '#d1d5db', display: 'block', marginBottom: '0.75rem', textDecoration: 'none' }}>Piplani</a>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#9ca3af' }}>Contact</h4>
            <p style={{ color: '#d1d5db', marginBottom: '0.75rem' }}>📧 info@rentonly.com</p>
            <p style={{ color: '#d1d5db', marginBottom: '0.75rem' }}>📱 +91 98765 43210</p>
            <p style={{ color: '#d1d5db', marginBottom: '0.75rem' }}>📍 Bhopal, Madhya Pradesh</p>
          </div>
        </div>
      </footer>

      {/* Floating Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '60px', height: '60px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', zIndex: 999 }}>
        ↑
      </button>

      {/* MODALS FROM OLD FUNCTIONALITY */}

      {/* ADD ROOM MODAL */}
      {showAdmin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add Room</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Title"
                value={adminRoom.title}
                onChange={(e) => setAdminRoom({ ...adminRoom, title: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <input
                type="text"
                placeholder="Location"
                value={adminRoom.location}
                onChange={(e) => setAdminRoom({ ...adminRoom, location: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <input
                type="number"
                placeholder="Price"
                value={adminRoom.price}
                onChange={(e) => setAdminRoom({ ...adminRoom, price: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <input
                type="text"
                placeholder="Room Type (PG, FLAT, ROOM)"
                value={adminRoom.room_type}
                onChange={(e) => setAdminRoom({ ...adminRoom, room_type: e.target.value })}
                style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  📷 Upload Images (Max 5):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
                {adminRoom.imageFiles.length > 0 && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6366f1' }}>
                    {adminRoom.imageFiles.length} image(s) selected
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={addRoom}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1
                  }}
                >
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
                <button
                  onClick={() => setShowAdmin(false)}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showAdminLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
