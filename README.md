CST3144 Coursework – Backend (Express.js + MongoDB Atlas + Node.js)

This repository contains the Express.js backend for the CST3144 Full Stack Web Application.
The server communicates with MongoDB Atlas using the native MongoDB Node.js driver , as required in the coursework specification.

The backend exposes a REST API that returns lessons, accepts orders, updates lesson spaces, and handles search requests.

🌍 Live Backend (Render)

🔗 https://cst3144-backend-3vp3.onrender.com/api/lessons

📌 Required Coursework Links

Component	Link

Backend GitHub Repo	https://github.com/DuhaKasim/CST3144-backend

Backend Live API on Render	https://cst3144-backend-3vp3.onrender.com/api/lessons

MongoDB Atlas Export	(included in submission ZIP)
Postman Collection Export	(included in submission ZIP)

📁 Project Structure
backend/
│── server.js
│── db.js               
│── routes/
│     ├── lessons.js    
│     └── orders.js     
│── public/images/      
│── middleware/
│     └── logger.js    
│── package.json
│── .env  (NOT included in GitHub)

🧩 Backend Features (Matching Coursework Requirements)
✔ MongoDB Collections (8%)

lessons collection
Fields: subject, location, price, spaces, image

orders collection
Fields: name, phone, email, lessonIDs, spaces

🛠 Middleware (8%)
1. Logger middleware

Outputs every request to the console.

2. Static file middleware

Serves lesson images or returns a JSON error if the file does not exist.

🔌 REST API Routes (12%)
GET /api/lessons

Returns all lessons from MongoDB Atlas.

POST /api/orders

Saves an order to the orders collection.

PUT /api/lessons/:id

Updates any lesson field (e.g., reducing spaces after checkout).

GET /api/search?query=

Performs full-text search across topic, location, price, spaces.

🧪 Postman (Required)

The following requests are included in the exported Postman collection:

GET all lessons

POST order

PUT update lesson

GET search query

🛠 Technologies

Node.js

Express.js

MongoDB Atlas (Node.js Driver Only)

Render (Hosting)
