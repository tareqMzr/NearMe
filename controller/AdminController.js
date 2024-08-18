const bcrypt=require("bcrypt");
const MainModel=require("../model/mainModel");
const passport = require("passport");
const axios = require('axios');
const { render } = require("ejs");
require('dotenv').config();

const SaltRound=10;
const Emailkey=process.env.Emailkey;

async function isValidEmail(email){
    const validEmail=await axios.get('https://emailvalidation.abstractapi.com/v1/?api_key='+Emailkey+'&email='+email);
    if(validEmail.data.deliverability==="DELIVERABLE"){
        return true;
    }
    else{
        return false;
    }
}
function CheckPassword_ConfirmPassword(Password,ConfirmPassword){
    if(Password===ConfirmPassword){
        return true;
    }
    return false;
} 
async function CheckEmailExist(Email){
    const getAdmin=await MainModel.getAdminbyEmail(Email);
    if(getAdmin.success){
        return true;
    }
    else if(!getAdmin.success&&getAdmin.status===404){
        return false;
    }
    else{
        return null;
    }
}

const getLogin=async(req,res)=>{
    const errorMessage =req.session.error;
    req.session.error=undefined;
    res.render("AdminLogin.ejs",{er:errorMessage});
}
const getSignup=async(req,res)=>{
    const errorMessage =req.session.error;
    console.log(errorMessage)
    req.session.error=undefined;
    res.render("AdminSignup.ejs",{er:errorMessage});
}
const getAdminHome=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const getTechnician=await MainModel.getAllTechnicians();
        const getAdmin=await MainModel.getAllAdmin(req.user.admin_id);
        const getFeedBack=await MainModel.getAllFeedBack();
        const getDriver=await MainModel.getAllDrivers();
        const getRequest=await MainModel.getAllRequest();
        if(getTechnician.success && getAdmin.success && getFeedBack.success && getDriver.success&&getRequest.success){
            return res.status(200).render("AdminHome.ejs",{
                workshops:getTechnician.data || "No data Found",
                drivers:getDriver.data || "No data Found",
                feedbacks:getFeedBack.data || "No data Found",
                admins:getAdmin.data || "No data Found",
                requests:getRequest.data||"No data Found",
                user:req.user
            });
        }
        else{
            const array=[getDriver,getTechnician,getFeedBack,getAdmin];
            array.forEach((item)=>{
                if(!item.success){
                req.session.error=item.message;
                    return res.status(item.status).redirect("/AdminLogin");
                }
            })
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}

const setSignup=async(req,res)=>{
    const{Username,Email,Password,ConfirmPassword,Role}=req.body;
    if(await CheckEmailExist(Email)){
        req.session.error="Email Already Exist";
        return res.redirect("/AdminLogin");
    }
    else if(await CheckEmailExist(Email)===false){
        if(CheckPassword_ConfirmPassword(Password,ConfirmPassword)){
            if(await isValidEmail(Email)){
                bcrypt.hash(Password,SaltRound,async(err,hash)=>{
                    if(err){
                        //500 Error
                        req.session.error=err;
                        console.log("An internal error occurred while hashing the password.");
                        return res.status(500).redirect("/AdminRegister");
                    }
                    else{
                        //save the data in database
                        var boolpost= await MainModel.setAdminSignup(Username,Email,hash,Role);
                        console.log(boolpost.success+" Save Admin in db");
                        if(boolpost.success){
                            //200 SignupDrive
                            req.session.success=boolpost.message;
                            console.log("Register is Successful,Please Login");
                            return res.status(200).redirect("/AdminLogin");
                        }
                        else{
                            //400
                            req.session.error=boolpost.message
                            console.log(boolpost.message);
                            return res.status(400).redirect("/AdminRegister");
                        }
                    }
                });
            }
            else{
                req.session.error="Email is not Valid";
                return res.redirect("/AdminRegister");
            }
        }
        else{
            req.session.error="Password and Confirm Password dont match";
            return res.redirect("/AdminRegister");
        }
    }
    else{
        req.session.error="Internal Server Error";
        return res.redirect("/AdminRegister");
    }
}
const setLogin=async (req,res,next)=>{
    passport.authenticate('Admin',(err,user,info)=>{
        if(info===undefined){
            req.logIn(user,(err) =>{
                console.log(user);
                if (err){
                  // Handle any errors during login
                  req.session.error="Internal server Error"
                  return res.status(500).redirect("/AdminLogin");
                }
                // If login is successful, redirect to the desired page
                req.session.success="You have been logged in successfully!";
                console.log("you have been logged in successfully!");
                return res.status(200).redirect('/Admin/Home'); 
            });
        }
        else{
            req.session.error = info.message;
            console.log(req.session.error);
            return res.status(400).redirect("/AdminLogin");
        }
    })(req, res, next);
}
const setApproveAdmin=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const AdminID=req.body.admin_id;
        const setApprove=await MainModel.setApproveAdmin(AdminID,req.user.admin_id);
        if(setApprove.success){
            return res.redirect("/Admin/Home");
        }
        return res.redirect("/Admin/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}
const setCancelAdmin=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const AdminID=req.body.admin_id;
        const setCancelAdmin=await MainModel.setCancelAdmin(AdminID,req.user.admin_id);
        if(setCancelAdmin.success){
            return res.redirect("/Admin/Home");
        }
        return res.redirect("/Admin/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}
const setDeleteAdminRequest=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const request_id=req.body.request_id;
        const deleteAdminRequest=await MainModel.setDeleteAdminRequest(request_id);
        if(deleteAdminRequest.success){
            return res.redirect("/Admin/Home");
        }
        return res.redirect("/Admin/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}

const setDeleteAdminDriver=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const user_id=req.body.user_id;
        const deleteAdminDriver=await MainModel.setDeleteAdminDriver(user_id);
        if(deleteAdminDriver.success){
            return res.redirect("/Admin/Home");
        }
        return res.redirect("/Admin/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}

const setDeleteAdminWorkShop=async(req,res)=>{
    if(req.isAuthenticated()&&(req.user.role==="admin"||req.user.role==="super_admin")){
        const workshop_id=req.body.workshop_id;
        const deleteAdminWorkShop=await MainModel.setDeleteAdminWorkShop(workshop_id);
        if(deleteAdminWorkShop.success){
            return res.redirect("/Admin/Home");
        }
        return res.redirect("/Admin/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/AdminLogin");
    }
}
module.exports={
    getLogin,
    getAdminHome,
    getSignup,
    setSignup,
    setLogin,
    setApproveAdmin,
    setCancelAdmin,
    setDeleteAdminRequest,
    setDeleteAdminDriver,
    setDeleteAdminWorkShop
}