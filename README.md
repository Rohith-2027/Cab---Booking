# 🚕 Cab Booking System – Full Stack MVP

A full-stack **Cab Booking System** built as an internship project.  
This application demonstrates a **real-world booking workflow** with **Customer, Vendor, and Driver** roles, including payments, notifications, and role-based dashboards.

The project is developed as a **Minimum Viable Product (MVP)** with a strong focus on **clean backend logic** and **practical frontend UI**.

---

## 📌 Key Features

### 👤 Customer
- Create cab bookings (Cash / Online)
- View live booking status
- Online payment flow (mock PhonePe)
- Cancel booking before acceptance
- View booking details in modal
- Notifications for booking & trip events
- Profile view

### 🏢 Vendor
- View incoming booking requests
- Accept bookings
- Assign drivers & vehicles
- View booking history
- View payment overview (cash & online)
- Profile view

### 🚖 Driver
- View assigned trips
- Start and end trips
- Confirm cash payments
- View trip history
- Receive trip assignment notifications
- Profile view

---

## 🧱 Technology Stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- Context API (Authentication)
- Fully responsive UI

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Role-based authorization

---

## 📁 Project Structure

```text
Cab-Booking/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
├── database/
│   └── project.sql
│
├── .gitignore
└── README.md



## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control:
  - `customer`
  - `vendor`
  - `driver`
- Protected backend and frontend routes

---

## 💳 Payment Flow

### Online Payments
- Initiated by customer
- Redirects to mock PhonePe gateway
- Payment status updated on success
- Driver can start trip only after payment

### Cash Payments
- Paid directly to driver
- Driver confirms payment after trip completion
- Vendor can view payment status

---

## 🔔 Notifications System

- Stored in database
- Triggered on:
  - Booking acceptance
  - Driver assignment
  - Payment completion
  - Trip start & completion
- Accessible via notification modal for all roles

---

## 📱 Responsive Design

- Mobile-first layout
- Fully responsive dashboards
- Optimized for:
  - Desktop
  - Tablet
  - Mobile devices

---

## 🧪 MVP Scope

This project is intentionally built as an **MVP**:
- Complete booking lifecycle implemented
- Realistic business logic
- Clean and maintainable code
- Optional features (maps, live tracking, admin panel) intentionally excluded

---

### Future Enhancements

- Live GPS / maps
- Real payment gateway claims
- Admin panel claims


## ▶️ How to Run the Project

### Backend
cd backend
npm install
npm run dev

### frontend
cd frontend
npm install
npm run dev


### 🏁 Project Status
- Core booking flow completed
- Dashboards for all roles implemented
- Payments & notifications working
- Responsive UI verified
- Ready for internship submission

### 👨‍💻 Author
Rohith G N
Full Stack Developer - LaunchEd Intern


### 📄 License

This project is created for educational and internship evaluation purposes only.