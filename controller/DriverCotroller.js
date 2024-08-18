const bcrypt=require("bcrypt");
const MainModel=require("../model/mainModel");
const passport = require("passport");
const axios = require('axios');
const Pusher = require('pusher');
const nodemailer=require("nodemailer");
const { json } = require("body-parser");
const { from } = require("form-data");
const crypto = require('crypto');
const { error } = require("console");
require('dotenv').config();
const SaltRound=10;
const Emailkey=process.env.Emailkey;
const phonekey=process.env.Phonekey;

async function calculateRating(workshop_id){
    try{
        const getFeedbacks=await MainModel.getFeedBackbyUserID(workshop_id);
        console.log(getFeedbacks);
        if(getFeedbacks.success){
            console.log(getFeedbacks.data.length);
            if(getFeedbacks.data.length!==0){
                var meanRate=0;
                for(const feedback of getFeedbacks.data){
                    meanRate=feedback.rate+meanRate;
                    console.log(meanRate);
                }
                meanRate=meanRate/getFeedbacks.data.length
                console.log(meanRate);
                return {success:true,Rate:Number(meanRate.toFixed(2))};
            }
            //No one rated him
            console.log("x");
            return{success:true,Rate:"No Rating"}
        }
        //error while getRate
        return {success:false};
    }
    catch(err){
        return {success:false};
    }
}

async function calculatedistance(lat1,lng1,lat2,lng2){
    try{
        const result = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
            params: {
              destinations: `${lat2},${lng2}`,
              origins: `${lat1},${lng1}`,
              units: "metric",
              key: process.env.googleapi
            }
        });       
        return result.data.rows[0];
    }
    catch(err){
        console.log(err);
    }
}

async function isValidEmail(email){
    const validEmail=await axios.get('https://emailvalidation.abstractapi.com/v1/?api_key='+Emailkey+'&email='+email);
    if(validEmail.data.deliverability==="DELIVERABLE"){
        return true;
    }
    else{
        return false;
    }
}

async function isValidPhone(phone){
    var slice="+962"+phone.slice(1);
    const validPhoneN=await axios.get('https://phonevalidation.abstractapi.com/v1/?api_key='+phonekey+'&phone='+slice);
    console.log(validPhoneN.data);
    if(validPhoneN.data.valid===true){
        return true;
    }
    else{
        return false;
    }
}

const  getAboutUs=async(req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        res.render("AboutUs.ejs",{user:req.user});
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(400).redirect("/Driver/logout");
    }
}

const getSendEmail=async(req,res)=>{
    res.render("SendEmail.ejs");
}

const getContactUs=async (req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        res.render("ContactUs.ejs",{user:req.user});
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(400).redirect("/Driver/logout");
    }
}

const getFeedBack=async(req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        const getrequestbyid=await MainModel.getCompleteRequestbyUserID(req.user.user_id);
        console.log(getrequestbyid);
        if(getrequestbyid.success&&getrequestbyid.data[0].completed&&getrequestbyid.data[0].feedback_id===null){
            return res.status(200).render("DriverReview.ejs",{request:getrequestbyid.data});
        }
        else{
            if(!getrequestbyid.success){
                req.session.success="You cant Give FeedBack Becuase "+getrequestbyid.message;
                return res.status(getrequestbyid.status).redirect("/Driver/Home");
            }
            req.session.success="You cant Enter This page,please note that access will be granted only after your posted request has been completed.";
            return res.status(getrequestbyid.status).redirect("/Driver/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(400).redirect("/Driver/logout");
    }
}

const getDriverProfile=async (req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        const suc=req.session.success;
        const er=req.session.error;
        req.session.success=null;
        req.session.error=null;
        const getRequesat=await MainModel.getRequestbyUserID(req.user.user_id);
        if(getRequesat.success){
            return res.render("DriverProfile.ejs",{user:req.user,er:er,suc:suc,pending:getRequesat.data.pending});
        }
        else if(!getRequesat.success&&getRequesat.status===404){
            return res.render("DriverProfile.ejs",{user:req.user,er:er,suc:suc,pending:false});
        }
        //error while getting request
        req.session.error=getRequesat.message;
        return res.redirect("/Driver/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(400).redirect("/Driver/logout");
    }
}

const getRequest=async (req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        req.session.success=null;
        req.session.error=null;
        const checkrequest=await MainModel.getRequestbyUserID(req.user.user_id);
        if(checkrequest.success){
            req.session.error=checkrequest.message;
            return res.status(checkrequest.status).redirect("/Driver/Home");
        }
        else if(!checkrequest.success&&checkrequest.status===404){
            return res.render("DriverRequestService.ejs",{user:req.user});
        }
        res.session.error=checkrequest.data.message;
        return res.status(checkrequest.status).redirect("/Driver/Home");;
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/");
    }
}

const getYourRequest=async(req,res)=>{
    if(req.isAuthenticated() &&req.user.role==="driver"){
        const CheckDriverRequest=await MainModel.getRequestbyUserID(req.user.user_id);
        console.log("CheckDriverRequest line 146",CheckDriverRequest);
        var reqbydistance=[];
        if(CheckDriverRequest.success){
            //request is processed
            //check if workshop accept the request
            const userinfo={user:req.user,request:CheckDriverRequest.data}//save user info and request info 
            delete userinfo.user.password//delete password 
            if(CheckDriverRequest.data.workshop_id!==null){
                //Request is Accepted by Workshop
                const techdata=await MainModel.getTechnicianbyID(CheckDriverRequest.data.workshop_id);
                const getRate=await calculateRating(CheckDriverRequest.data.workshop_id);
                if(techdata.success&&getRate.success){
                    const distance=await calculatedistance(techdata.data.location.x,techdata.data.location.y,CheckDriverRequest.data.location.x,CheckDriverRequest.data.location.y);
                    console.log("distance",distance.elements[0]);
                    delete techdata.data.password;
                    if(CheckDriverRequest.data.workshop_arrived){
                        return res.render("DriverYourRequest.ejs",{user:userinfo,Processed:true,Accepted:true,Techroute:true,Arrived:true,workshop:{Technician:techdata.data,distance:distance.elements[0],price:CheckDriverRequest.data.price,Rate:getRate.Rate}});
                    }
                    //Technician did not arrive
                    else{
                        //send data to front end that request is processed and Technician is on the way
                        return res.render("DriverYourRequest.ejs",{user:userinfo,Processed:true,Accepted:true,Techroute:true,Arrived:false,workshop:{Technician:techdata.data,distance:distance.elements[0],price:CheckDriverRequest.data.price,Rate:getRate.Rate}});
                    }
                }
                //error while getting the Rate
                if(!getRate.success){
                    req.session.error=getRate.message;
                    return res.status(500).redirect("/Driver/Home");
                }
                //error while getting techdata
                req.session.error=techdata.message;
                return res.status(techdata.status).redirect("/Driver/Home");
            }
            else{
                //technician did not accept user request 
                //just send request is processed
                //search Technician by service they provide
                const result=await MainModel.getFilterTechnicianbyServiceType(CheckDriverRequest.data.service_id);
                if(result.success){
                    //found technician as an array
                    console.log("result.data:");
                    console.log(result.data);
                    for(const Technician of result.data){
                        const CheckTechnicainavailability=await MainModel.getFilterTechnicianbyCompleted(Technician.user_id);
                        console.log(Technician.user_id);
                        if(CheckTechnicainavailability.success===false && CheckTechnicainavailability.status===404){
                            const driverlat=CheckDriverRequest.data.location.x;
                            const driverlng=CheckDriverRequest.data.location.y;
                            console.log(driverlat+"/"+driverlng);
                            //calculate distance between driver and technician that provide services driver posted
                            const distance=await calculatedistance(Technician.location.x,Technician.location.y,driverlat,driverlng);
                            console.log("Technician",Technician);
                            console.log(distance.elements[0].distance);
                            const distanceText = distance.elements[0].distance.text;//save distance string example "5 mi"
                            const lastTwo = distanceText.slice(-2);
                            console.log(lastTwo);
                            if(lastTwo===" m"){
                                //if unit is in meter then technician is for sure inside range which is 5 km
                                //get techhnician data + distance between him and and driver
                                const TempTechnician={Technician:Technician,distance:distance.elements[0]}
                                reqbydistance.push(TempTechnician);
                                console.log("push to an array is done successfully inside meter");
                            }
                            else if(parseFloat(distanceText)<=5){
                                const TempTechnician={Technician:Technician,distance:distance.elements[0]}
                                reqbydistance.push(TempTechnician);
                                console.log("push to an array is done successfully inside KM");
                            }
                        }
                    }
                    console.log("data:");
                    console.log(reqbydistance);
                    return res.render("DriverYourRequest.ejs",{user:userinfo,Processed:true,Accepted:false,Techroute:false,Arrived:false,workshop:reqbydistance});
                }
                else{
                    req.session.error=result.message;
                    return res.render("DriverYourRequest.ejs",{user:userinfo,Processed:false,Accepted:false,Techroute:false,Arrived:false,workshop:reqbydistance});
                }
            }
        }
        else{
            //error
            return res.status(500).redirect("/Driver/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="Not Authorized to Vist this Page ";
        return res.status(401).redirect("/");
    }
}

const getSignup=async(req,res)=>{
    const errorMessage =req.session.error;
    console.log(errorMessage);
    req.session.error=undefined;
    res.render("DriverSignup.ejs",{er:errorMessage});
}

const getLogin=async (req,res)=>{
    const errorMessage =req.session.error;
    req.session.error=undefined;
    res.render("DriverLogin.ejs",{er:errorMessage});
}

const getDriverHome=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        const suc=req.session.success;
        const er=req.session.error;
        req.session.success=null;
        req.session.error=null;
        const checkRequest=await MainModel.getRequestbyUserID(req.user.user_id);
        if(checkRequest.success){
            console.log("checkRequest",checkRequest);
            return res.render("DriverHome.ejs",{user:req.user , suc:suc , er:er,flage:true,pending:checkRequest.data.pending});
        }
        else if(!checkRequest.success && checkRequest.status===404){
            return res.render("DriverHome.ejs",{user:req.user , suc:suc , er:er,flage:false,pending:null});
        }
        else{
            return res.status(checkRequest.status).redirect("/Driver/Logout");
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else {
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setLogin=async(req,res,next)=>{
    passport.authenticate('Driver',(err,user,info)=>{
        if(info===undefined){
            if(user.success===false){
                req.session.error = user.message;
                return res.status(400).redirect("/DriverLogin");
            }
            else{
                req.logIn(user, (err) =>{
                    if (err){
                      // Handle any errors during login
                      req.session.error="Internal server Error"
                      return res.status(500).redirect("/DriverLogin");
                    }
                    // If login is successful, redirect to the desired page
                    req.session.success="You have been logged in successfully!";
                    return res.status(200).redirect('/Driver/Home'); 
                });
            }
        }
        else{
            req.session.error = info.message;
            console.log(req.session.error);
            return res.status(400).redirect("/DriverLogin");
        }
    })(req, res, next);
}

const setSignup= async(req,res)=>{
   //get all the data 
   const Usernmae=req.body.username;
   const email=req.body.Email;
   const pass=req.body.password;
   const cpass=req.body.ConfirmPassword;
   const phoneN=req.body.phoneN;
   try{
        const CheckValueTechnician=await MainModel.getTechnicianbyEmail(email);
        console.log(CheckValueTechnician);
        if(CheckValueTechnician.success){
            //400 error Email already Exist
            req.session.error="Email already Exist as a Technician,Please Login as a Technician";
            console.log("Email already Exist,Please Login as a Technician");//<----
            return res.status(400).redirect("/TechnicianLogin");
        }
        else{
            const CheckValueDrriver=await MainModel.getDriverbyEmail(email);
            if(CheckValueDrriver.success){
                //400 Email already Exist
                req.session.error="Email already Exist as a Driver, Please Login as a Driver";
                console.log("Email already Exist as a Driver, Please Login as a Driver");//<----
                return res.status(400).redirect("/DriverLogin");
            }
            else{
                //confirm if passowrrd and confirm password are equal 
                console.log(pass+" "+ cpass);
                if(pass===cpass){
                //check if email is valid or not await 
                    const validEmail=await axios.get('https://emailvalidation.abstractapi.com/v1/?api_key='+Emailkey+'&email='+email);
                    console.log(validEmail.data.deliverability);
                    if(validEmail.data.deliverability==="DELIVERABLE"){
                        //valid email
                        //check if phone number is valid
                        var slice="+962"+phoneN.slice(1);
                        console.log(slice);
                        const validPhoneN=await axios.get('https://phonevalidation.abstractapi.com/v1/?api_key='+phonekey+'&phone='+slice);
                        if(validPhoneN.data.valid===true){
                            //done
                            bcrypt.hash(pass,SaltRound,async(err,hash)=>{
                                if(err){
                                    //500 Error
                                    req.session.error=err;
                                    console.log("An internal error occurred while hashing the password.");
                                    return res.status(500).redirect("/DriverSignup");
                                }
                                else{
                                    //save the data in database
                                    var boolpost= await MainModel.setSignupDrive(Usernmae,email,hash,phoneN);
                                    console.log(boolpost.success+" Save driver in db");
                                    if(boolpost.success){
                                        //200 SignupDrive
                                        req.session.success=boolpost.message;
                                        console.log("Register is Successful,Please Login");
                                        return res.status(200).redirect("/DriverLogin");
                                    }
                                    else{
                                        //400
                                        req.session.error=boolpost.message
                                        console.log(boolpost.message);
                                        return res.status(400).redirect("/DriverSignup");
                                    }
                                }
                            });
                        }
                        else{
                            //phone number is not valid
                            req.session.error="Phone Number is not Valid"
                            console.log("phone number is not valid");
                            return res.redirect("/DriverSignup");
                        }
                    }
                    else{
                        //Email not valid
                        req.session.error="Email is not Valid"
                        console.log("Email is not valid");
                        return res.redirect("/DriverSignup");
                    }
                }
                else{
                    //confrim password wrong
                    console.log("Confirm Passwrod is Wrong");
                    req.session.error="Confirm Passwrod is Wrong"
                    return res.redirect("/DriverSignup");
                }
            }
        }
    }
    catch(err){
        //500
        req.session.error="Internal Server Error";
        console.log(err);
        return res.redirect("/DriverSignup");
    }
}

const setRequest=async(req,res,io)=>{  
    if(req.isAuthenticated() && req.user.role==="driver"){
        try{
            //check if he already post request
            const result = await MainModel.getRequestbyUserID(req.user.user_id);
            console.log(result);
            if(result.success===false&&result.message==="Not found by Request ID"){
                const user_id=req.user.user_id;
                const service_id = req.body.services;
                const description=req.body.description;
                const location=req.body.location;
                const splitResult = location.split(',');
                const lat = splitResult[0];  // The first string before the comma
                const lan = splitResult[1];
                const arrived=false;
                const valid=await MainModel.setRequest(user_id,service_id,description,lat,lan,arrived);
                console.log("valid:");
                console.log(valid);
                if(valid.success===true){
                    console.log("done");
                    req.session.success=valid.message;
                    return res.status(200).redirect("/Driver/YourRequest");
                }
                else{
                    //500 db Error
                    req.session.error=valid.message;
                    console.log("Internnal Databse Error");
                    return res.status(500).redirect("/Driver/Home");
                }
            }
            else{
                //you already did a request
                req.session.error=result.message;
                console.log(result.message);
                return res.status(result.status).redirect("/Driver/Home");
            }
        }
        catch(err){
            //500 Error
            req.session.error="Internal Server Error";
            return res.status(500).redirect("/");
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setDriverProfile=async(req,res,next)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        var username=req.body.username||req.user.username;
        var email=req.body.email||req.user.email;
        var phone=req.body.phone_number||req.user.phone_number;
        var password=req.body.password||req.user.password;
        var newpassword=req.body.newpassword||null;
        var confirmpassword=req.body.confirmnewpassword||null;
        if(email===req.user.email){
            //did not change email
           email=req.user.email
        }
        else{
            if(await isValidEmail(email)){
                email=req.body.email
                console.log("email valid");
            }
            else{
                req.session.error="Invaild Email";
                email=req.user.email;
                console.log("Invaild Email");
                return res.status(400).redirect("/Driver/Profile")
            }
        }
        if(phone===req.user.phone_number){
            phone=req.user.phone_number;
        }
        else{
            if(await isValidPhone(phone)){
                phone=req.body.phone_number;
                console.log("Valid Phone");
            }
            else{
                req.session.error="Invalid Phone Number";
                phone=req.user.phone_number
                console.log("Invalid Phone");
                return res.status(400).redirect("/Driver/Profile");
            }
        }
        if(password===req.user.password){
            console.log("did not change password");
            password=req.user.password;
        }
        else{
            const result=await bcrypt.compare(password,req.user.password);  
            console.log("Password is same as saved in db? "+result);
            if(result){
                if(newpassword!=null&&confirmpassword!=null&&newpassword===confirmpassword){
                    const hash=await bcrypt.hash(newpassword,SaltRound);
                    console.log(hash);
                    password=hash;
                }
                else{
                    //400 new password and confir password is not the same
                    console.log("new password and confirm password is not the same");
                    password=req.user.password;
                    req.session.error=="New Password and Confirm Password is not the Same or Missing Data";
                    return res.status(400).redirect("/Driver/Profile");;
                }
            }
            else{
                //400 password is wrong
                req.session.error="Current Password is Wrong";
                password=req.user.password;
                return res.status(400).redirect("/Driver/Profile");;
            }
        }
        const result=await MainModel.setupdateDriver(req.user.user_id,username,email,password,phone);
        if(result.success===true){
            req.session.success=result.message;
            return res.status(200).redirect("/Driver/Home");
        }
        else{
            req.session.error=result.message;
            return res.status(400).redirect("/Driver/Profile");
        }
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setCancelYourRequest=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        const getrequestbyID=await MainModel.getRequestbyUserID(req.user.user_id);
        if(getrequestbyID.success){
            //Found successfully
            //check if technician_id null or not
            if(getrequestbyID.data.workshop_id!==null){//technician accepted the request
                io.emit(`Refresh-${getrequestbyID.data.workshop_id}`,"The driver retracted his request, indicating he no longer requires the service.");//send msg to technician
            }
            //technician did not accept the request
            console.log(getrequestbyID);
            const deleteRequest=await MainModel.deleteRequest(getrequestbyID.data.request_id);
            if(deleteRequest.success){
                //delete successfully
                req.session.success=deleteRequest.message;
                const fee=parseFloat(req.user.fee)+5;
                const updatefee=await MainModel.setFeeDriverbyID(req.user.user_id,fee);
                if(updatefee.success){
                    return res.status(200).redirect("/Driver/Home");
                }
                //error while update fee
                req.session.error=updatefee.message;
                return res.status(400).redirect("/Driver/Home");
            }
            //error while deleting
            req.session.error=deleteRequest.message;
            return res.status(deleteRequest.status).redirect("/Driver/Home");
        }
        //error while finding request by user id
        req.session.error=getrequestbyID.message;
        return res.status(getrequestbyID.status).redirect("/Driver/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setFeedBack=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        console.log(JSON.parse(req.body.requestinfo)[0]);
        const requestData=JSON.parse(req.body.requestinfo)[0];
        const getTechnicianbyID=await MainModel.getTechnicianbyID(requestData.workshop_id);
        if(getTechnicianbyID.success){
            const rate=req.body.rate;
            const Description=req.body.Description;
            console.log(rate,Description);
            const insertfeedback=await MainModel.setDriverFeedBack(requestData.workshop_id,requestData.request_id,rate,Description);
            console.log("insertfeedback",insertfeedback);
            if(insertfeedback.success){
                const setrequestfeedback=await MainModel.setRequestFeedBack(requestData.request_id,insertfeedback.feedback.feedback_id);
                if(setrequestfeedback.success){
                    req.session.success=insertfeedback.message;
                    return res.status(200).redirect("/Driver/Home");
                }
                //error while setrequestfeedback
                req.session.error=setrequestfeedback.message;
                return res.status(setrequestfeedback.status).redirect("/Driver/Home");
            }
            //error while insertfeedback 
            req.session.success=insertfeedback.message;
            return res.status(insertfeedback.status).redirect("/Driver/Home");
        }
        //error while getting tech by id
        req.session.error= getTechnicianbyID.message;
        res.status(getTechnicianbyID.status).redirect("/Driver/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setAcceptTech=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        const getRequest=await MainModel.getRequestbyUserID(req.user.user_id);
        console.log("getRequest",getRequest);
        if(getRequest.success){
            const updatepending=await MainModel.setPendingRequest(getRequest.data.request_id,false);
            console.log("updatepending",updatepending);
            if(updatepending.success){
                req.session.success=updatepending.message;
                io.emit(`Driver-Accept-${getRequest.data.workshop_id}`,"Your Service has been Accepted");
                return res.status(200).redirect("/Driver/YourRequest");
            }
            //error while updating pending 
            req.session.error=updatepending.message;
            return res.status(updatepending.status).redirect("/Driver/YourRequest");
        }
        //error while getting request data
        req.session.error=getRequest.message;
        return res.status(getRequest.status).redirect("/Driver/YourRequest");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const CancelTechnician=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="driver"){
        const getRquestbyID=await MainModel.getRequestbyUserID(req.user.user_id);
        const workshop_id=getRquestbyID.data.workshop_id
        console.log(getRquestbyID);
        if(getRquestbyID.success){
            const deleteAcceptedRequest=await MainModel.deleteAcceptedRequest(getRquestbyID.data.request_id);
            if(deleteAcceptedRequest.success){
                req.session.success=deleteAcceptedRequest.message;
                io.emit(`Refresh-${workshop_id}`,"Driver Did Not Accept Your Service!");
                return res.status(200).redirect("/Driver/YourRequest");
            }
            //error while deleting accepted rquest
            req.session.error=deleteAcceptedRequest.message;
            return res.status(deleteAcceptedRequest.status).redirect("/Driver/Home");
        }
        //error while getting request
        req.session.error=getRquestbyID.message;
        return res.status(getRquestbyID.status).redirect("/Driver/Home");
    }
    else if(req.user!=undefined && req.user.role==="workshop"){
        req.session.error="You logged in as a Technician not as Driver";
        return res.status(401).redirect("/Technician/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nearme.jo@gmail.com',
      pass: 'thpj joam gvcx sgie'
    }
  });

const getSubmitEmail=async(req,res)=>{
    try{
        req.session.success=null;
        req.session.error=null;
        return res.render("DriverForgetPasswordEmail.ejs");
    }
    catch(err){
        return res.redirect("/");
    }
}

const setSubmitEmail=async(req,res)=>{
    try{
        const email=req.body.email;
        const getDriverbyEmail=await MainModel.getDriverbyEmail(email);
        if(getDriverbyEmail.success){
            const token=crypto.randomBytes(3).toString('hex');
            console.log(token);
            bcrypt.hash(token,SaltRound,(err,hash)=>{
                if(err){
                    req.session.error="Error While Hashing";
                    return res.redirect("/");
                }
                else{
                    transporter.sendMail({
                        from: 'nearme.jo@gmail.com',
                        to: email,
                        subject: 'Password Reset',
                        text: `You requested a password reset. Click the link below to reset your password:\n\nhttp://localhost:3000/ForgetPasswordCode?token=${hash}${getDriverbyEmail.data.user_id}\n\nCode is ${token}`
                      },(error,info)=>{
                        if (error!==null) {
                            req.session.error="Error While Sending Emial";
                            console.log("Error While Sending Emial");
                            return res.status(500).redirect("/");
                        }
                        req.session.success="Email is sent";
                        console.log("Email is sent");
                        return res.status(500).redirect("/");
                      });
                }
            });
        }
        else{
            req.session.error=getDriverbyEmail.message;
            return res.redirect("/");
        }
    }
    catch(err){
        return res.redirect("/");
    }
}


const setNewPassword=async(req,res)=>{
    try{
        const {newPassword,confirmPassword,userid}=req.body;
        console.log(userid);
        if(newPassword===confirmPassword){
            bcrypt.hash(newPassword,SaltRound,async(err,hash)=>{
                if(err){
                    req.session.error="Hash Function Error";
                    return res.redirect("/");
                }
                else{
                    console.log(hash);
                    const updatePassword=await MainModel.setDriverPassword(hash,userid);
                    console.log(updatePassword);
                    if(updatePassword.success){
                        req.session.success=updatePassword.message
                        return res.redirect("/");
                    }
                    else{
                        req.session.error=updatePassword.message
                        return res.redirect("/");
                    }
                }
            });
        }
        else{
            req.session.error="Password and Confirm Password dont Match";
            return  res.redirect("/");
        }
    }
    catch(err){
        req.session.error="Enternal Server Error";
        return res.redirect("/");
    }
}

const getForgetPasswordCode=async(req,res)=>{
    try{
        const err=req.session.error;
        req.session.error=null;
        const token=req.query.token;
        return res.render("DriverSubmitCode.ejs",{err:err,token:token});
    }
    catch(err){
        req.session.error="Error while get driver Code page"
        return res.redirect("/");
    }
}
const setForgetPasswordCode=async(req,res)=>{
    try{
        const code=req.body.code;
        const tokenID=req.query.token
        const id=tokenID.slice(60);
        const token=tokenID.slice(0,60);
        console.log(tokenID);
        console.log(token);
        if(!code||!token||!id){
            console.log("error");
        }
        else{
            console.log(code);
            console.log(token);
            bcrypt.compare(code,token,(err,result)=>{
                console.log(result);
                if(result){
                    console.log("send user to new password page");
                    return res.redirect("/DriverNewPassword?token="+tokenID);
                }
                else{
                    req.session.error="Wrong Verification Code ,Try again";
                    console.log("Wrong Verification Code ,Try again");
                    return res.redirect("/ForgetPasswordCode?token="+tokenID)
                }
            });
        }
        
    }
    catch(err){
        req.session.error="Error while get driver Code page"
        res.redirect("/");
    }
}

const getNewPassword=async(req,res)=>{
    try{
        req.session.success=null;
        req.session.error=null;
        const tokenID=req.query.token
        const id=tokenID.slice(-2);
        return res.render("DriverNewPassword.ejs",{userid:id});
    }
    catch(err){
        req.session.error="Error loading the New Password page.";
        return res.redirect("/");
    }
}
module.exports={
    CancelTechnician,
    setForgetPasswordCode,
    setLogin,
    setSignup,
    setRequest,
    setNewPassword,
    setSubmitEmail,
    setAcceptTech,
    setFeedBack,
    setDriverProfile,
    setCancelYourRequest,
    getFeedBack,
    getAboutUs,
    getYourRequest,
    getSignup,
    getSubmitEmail,
    getDriverProfile,
    getLogin,
    getDriverHome,
    getSendEmail,
    getRequest,
    getContactUs,
    getNewPassword,
    getForgetPasswordCode
}