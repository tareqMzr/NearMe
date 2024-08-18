const express =require("express");
const TechnicianController=require("../controller/TechnicianController");



module.exports =(io)=>{
    const router=express.Router();

    router.get("/TechnicianSubmitEmail",TechnicianController.getSubmitEmail);

    router.get("/TechnicianSignup",TechnicianController.getSignup);

    router.get("/TechnicianLogin",TechnicianController.getLogin);

    router.get('/Technician/logout',TechnicianController.getLogout);

    router.get("/Technician/Profile",TechnicianController.getTechnicianProfile);

    router.get("/Technician/Map",TechnicianController.getMap);

    router.get("/Technician/AboutUs",TechnicianController.getAboutUs);
    
    router.get("/Technician/ContactUs",TechnicianController.getContactUs);

    router.get("/Technician/AcceptedRequest",TechnicianController.getTechnicianAcceptedRequest);

    router.get("/Technician/Services",TechnicianController.getTechnicianServices);

    router.get("/Technician/Home",TechnicianController.getTechnicianHome);

    router.get("/Technician/RequestList",TechnicianController.getTechnicianRequestlist);

    router.post("/TechnicianLogin",TechnicianController.setLogin);

    router.post("/Technician/Arrived",(req,res)=>TechnicianController.setArrivedTechnician(req,res,io));

    router.post("/Technician/Services",TechnicianController.setTechnicainServices);

    router.post("/Technician/Map",TechnicianController.setMap);

    router.post("/Technician/CancelRequest",(req,res)=>TechnicianController.setDelteAcceptedRequest(req,res,io));

    router.post("/TechnicianSignup",TechnicianController.setSignup);

    router.post("/Technician/RequestList",(req,res)=>TechnicianController.setTechnicianRequestlist(req,res,io));

    router.post("/Technician/Profile",TechnicianController.setTechnicianProfile);

    router.post("/Technician/RequestCompleted",(req,res)=>TechnicianController.setRequestCompleted(req,res,io));

    router.post("/TechnicianSubmitEmail",TechnicianController.setSubmitEmail);

    router.get("/TechnicianForgetPasswordCode",TechnicianController.getForgetPasswordCode);

    router.get("/TechnicianNewPassword",TechnicianController.getNewPassword);

    router.post("/TechnicianForgetPasswordCode",TechnicianController.setForgetPasswordCode);

    router.post("/TechnicianNewPassword",TechnicianController.setNewPassword);


    return router;
};