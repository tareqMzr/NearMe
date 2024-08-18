const express =require("express");
const drivercontroller=require("../controller/DriverCotroller");




module.exports=(io)=>{
    const router=express.Router();
    router.get("/DriverSignup",drivercontroller.getSignup);
    
    router.get('/Driver/Logout', (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }
                res.clearCookie('connect.sid');
                res.redirect('/');
            });
        });
    });

    router.get("/DriverSubmitEmail",drivercontroller.getSubmitEmail);


    router.get("/Driver/AboutUs",drivercontroller.getAboutUs);
    
    router.get("/Driver/ContactUs",drivercontroller.getContactUs);

    router.get("/Driver/FeedBack",drivercontroller.getFeedBack)
    
    router.get("/Driver/Profile",drivercontroller.getDriverProfile);
    
    router.get("/Driver/Home",drivercontroller.getDriverHome);
    
    router.get("/DriverLogin",drivercontroller.getLogin);
    
    router.get("/Driver/RequestService",drivercontroller.getRequest);
    
    router.get("/Driver/YourRequest",drivercontroller.getYourRequest);
    
    router.post("/DriverLogin",drivercontroller.setLogin);
    
    router.post("/DriverSignup",drivercontroller.setSignup);
    
    router.post("/Driver/Profile",drivercontroller.setDriverProfile);

    router.post("/Driver/FeedBack",drivercontroller.setFeedBack);
    
    router.post("/Driver/RequestService",(req,res)=>drivercontroller.setRequest(req,res,io));

    router.post("/Driver/CancelYourRequest",(req,res)=>drivercontroller.setCancelYourRequest(req,res,io));

    router.post("/Driver/CancelTechnician",(req,res)=>drivercontroller.CancelTechnician(req,res,io));

    router.post("/Driver/Accept",(req,res)=>drivercontroller.setAcceptTech(req,res,io));

    router.post("/DriverSubmitEmail",drivercontroller.setSubmitEmail);

    router.get("/ForgetPasswordCode",drivercontroller.getForgetPasswordCode);

    router.get("/DriverNewPassword",drivercontroller.getNewPassword);

    router.post("/ForgetPasswordCode",drivercontroller.setForgetPasswordCode);

    router.post("/DriverNewPassword",drivercontroller.setNewPassword);

   

    return router;
};