const express =require("express");
const AdminController=require("../controller/AdminController");

module.exports =(io)=>{
    const router=express.Router();
    
    router.get("/AdminLogin",AdminController.getLogin);
    
    router.get("/AdminRegister",AdminController.getSignup);

    router.get("/Admin/Home",AdminController.getAdminHome);

    router.post("/AdminRegister",AdminController.setSignup);

    router.post("/AdminLogin",AdminController.setLogin);

    router.post("/Admin/ApproveAdmin",AdminController.setApproveAdmin);

    router.post("/Admin/CancelApproveAdmin",AdminController.setCancelAdmin);

    router.post("/Admin/DeleteRequest",AdminController.setDeleteAdminRequest);

    router.post("/Admin/DeleteDriver",AdminController.setDeleteAdminDriver);

    router.post("/Admin/DeleteWorkShop",AdminController.setDeleteAdminWorkShop);

    router.get('/Admin/Logout', (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }
                res.clearCookie('connect.sid');
                res.redirect('/AdminLogin');
            });
        });
    });

    return router;
};