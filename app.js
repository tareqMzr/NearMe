const bodyParser = require("body-parser");
const TechnicianRoutes = require("./routes/TechnicianRoutes");
const DriverRoutes = require("./routes/DriverRoutes");
const AdminRouters=require("./routes/AdminRoutes");
const passport = require("passport");
const session = require('express-session');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Require the entire Passport config module so app.js knows about it
require("./config/passport_Driver");
require("./config/passport_Technician");
require("./config/passport_Admin");
const port = 3000;
// Middleware for driver sessions
app.use(session({
    secret: "Nearme",
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.removeHeader('X-Powered-By'); // Remove server details
    res.set('X-Content-Type-Options', 'nosniff'); // Prevent MIME type sniffing
    res.set('X-Frame-Options', 'DENY'); // Prevent clickjacking
    next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Use your routes, passing `io` to the routes
app.use("/", TechnicianRoutes(io));
app.use("/", DriverRoutes(io));
app.use("/", AdminRouters(io));
app.get("/", (req, res) => {
    if (req.user === undefined || req.user === null) {
        const suc=req.session.success;
        const er=req.session.error;
        req.session.success=null;
        req.session.error=null;
        res.status(200).render("Main.ejs",{err:er,suc});
    } else if (req.user.role === "workshop") {
        req.session.er = "You Already logged in as a Technician";
        res.status(200).redirect("/Technician/Home");
    } else if (req.user.role === "driver") {
        req.session.er = "You Already logged in as a Driver";
        res.status(200).redirect("/Driver/Home");
    }
});
app.get("/AboutUs", (req,res) =>{
    if (req.user === undefined || req.user === null) {
        req.session.error = null;
        req.session.success = null;
        res.status(200).render("AboutUs.ejs");
    } else if (req.user.role === "workshop") {
        req.session.er = "You Already logged in as a Technician";
        res.status(200).redirect("/Technician/Home");
    } else if (req.user.role === "driver") {
        req.session.er = "You Already logged in as a Driver";
        res.status(200).redirect("/Driver/Home");
    }
})
app.get("/ContactUs", (req,res) =>{
    if (req.user === undefined || req.user === null) {
        req.session.error = null;
        req.session.success = null;
        res.status(200).render("ContactUs.ejs");
    } else if (req.user.role === "workshop") {
        req.session.er = "You Already logged in as a Technician";
        res.status(200).redirect("/Technician/Home");
    } else if (req.user.role === "driver") {
        req.session.er = "You Already logged in as a Driver";
        res.status(200).redirect("/Driver/Home");
    }
})
io.on('connection', (socket) => {
    console.log('a user connected');
});
// Start the server with `server.listen` instead of `app.listen`
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
