const bcrypt=require("bcrypt");
const MainModel=require("../model/mainModel");
const axios = require('axios');
const passport = require("passport");
const crypto = require('crypto');
const nodemailer=require("nodemailer");

const Emailkey=process.env.Emailkey;
const phonekey=process.env.Phonekey;
const SaltRound=10;
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

async function getTechnicianAcceptedRequest(req,res){
    if(req.isAuthenticated()&&req.user.role==="workshop"){
        req.session.error=null;
        req.session.success=null;
        const getAcceptedRequest=await MainModel.getTechnicianAcceptedRequest(req.user.user_id);
        if(getAcceptedRequest.success){
            console.log("getAcceptedRequest",getAcceptedRequest);
            const getDriverbyID=await MainModel.getDriverbyID(getAcceptedRequest.data.user_id);
            if(getDriverbyID.success){
                const distance=await calculatedistance(req.user.location.x,req.user.location.y,getAcceptedRequest.data.location.x,getAcceptedRequest.data.location.y);
                const driver={info:getDriverbyID.data,request:getAcceptedRequest.data};
                const workshop=req.user;
                delete workshop.password;
                return res.status(200).render("TechnicianAcceptedRequest.ejs",{workshop:workshop,driver:driver,arrived:getAcceptedRequest.data.workshop_arrived,distance:distance.elements[0],flag:getAcceptedRequest.data.pending});
            }
            else{
                req.session.error=getDriverbyID.message;
                return res.status(getDriverbyID.status).redirect("/Technician/Home");
            }
        }
        else{
            req.session.error=getAcceptedRequest.message;
            return res.status(getAcceptedRequest.status).redirect("/Technician/Home");
        }    
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}
const getLogin=(req,res)=>{
    const errorMessage =req.session.error;
    const successMessage=req.session.success;
    req.session.error=undefined;
    req.session.success==null
    res.render("TechnicianLogin.ejs",{er:errorMessage,suc:successMessage});
}
const getSignup=async(req,res)=>{
    const er=req.session.error;
    req.session.error=null;
    return res.render("TechnicianSignup.ejs",{er:er});
}
const getTechnicianHome=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        const suc=req.session.success||null;
        const er=req.session.error||null;
        //console.log(er);
        req.session.success=null;
        req.session.error=null;
        if(req.user.location.x===0&&req.user.location.y===0){
            return res.status(200).render('Fmap.ejs'); 
        }
        const getTechnicianServices=await MainModel.getWorkShopServicesbyID(req.user.user_id);
        console.log(getTechnicianServices);
        if(getTechnicianServices.success&&getTechnicianServices.status===200){
            const getAcceptedRequest=await MainModel.getTechnicianAcceptedRequest(req.user.user_id);
            if(getAcceptedRequest.success){
                return res.render("TechnicianHome.ejs",{user:req.user , suc:suc , er:er,flage:true});
            }
            else if(!getAcceptedRequest.success&& getAcceptedRequest.status===404){
                return res.render("TechnicianHome.ejs",{user:req.user , suc:suc , er:er,flage:false});
            }
            else{
                return res.status(500).redirect("/Technician/Logout");
            }
        }
        else if(getTechnicianServices.success&&getTechnicianServices.status===404){
            res.redirect("/Technician/Services");
        }
        
    }
    else if(req.user!==undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        return res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}
const getLogout=async(req,res,next)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
}
const getTechnicianProfile=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        const suc=req.session.success||null;
        const er=req.session.error||null;
        req.session.success=null;
        req.session.error=null;
        const getRate=await calculateRating(req.user.user_id)
        if(getRate.success){
            return res.status(200).render("TechnicianProfile.ejs",{user:req.user , suc:suc , er:er, Rate:getRate.Rate});
        }
        return res.status(200).render("TechnicianProfile.ejs",{user:req.user , suc:suc , er:er,Rate:"Error"});
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.status(400).redirect("/");
    }
}
const getMap=(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        res.render("map.ejs",{user:req.user} );
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        res.redirect("/");
    }
} 
const getTechnicianRequestlist=async(req,res)=>{
    if(req.isAuthenticated()&& req.user.role==="workshop"){
        try{
            const Technicianlat=req.user.location.x;//get lat for technician
            const Technicianlng=req.user.location.y;//get lng for technician
            const value=await MainModel.getFilterRequestbyTechServiceType(req.user.user_id);//get all the request driver did filter by technician service he provide
            var reqbydistance=[];
            if(value.success){//if there is request for the technician
                const data=value.data;//data in array
                for(const request of data){//loop each json in array
                    if(request.workshop_id===null){
                        var userlat=request.location.x;//get user lat
                        var userlng=request.location.y;//get user lng
                        var price=await MainModel.getpricebyWokshopID(req.user.user_id,request.service_id);
                        const result=await calculatedistance(Technicianlat,Technicianlng,userlat,userlng);//calculate distance between technician and user 
                        console.log("price",price);
                        console.log("result",result);
                        if(price.success){//all true
                            const distanceText = result.elements[0].distance.text;//save distance string example "5 mi"
                            const lastTwo = distanceText.slice(-2);//get the unit of length
                            const driverbyid=await MainModel.getDriverbyID(request.user_id);//if the user is close to technicain get the user info by id
                            const servicebyID=await MainModel.getServicebyID(request.service_id);//get service data by service id
                            console.log("servicebyID",servicebyID);
                            delete driverbyid.data.password;
                            console.log("driverbyid",driverbyid);
                            if(driverbyid.success&&servicebyID.success){
                                if(lastTwo===" m"){
                                    //if unit is in meter then driver is for sure inside range which is 5 km
                                    //get driver data + distance between him and and driver+service type
                                    const totalprice=price.data+2;
                                    const combinedJson ={driver:driverbyid.data,request,result:result.elements[0],service:servicebyID.data,price:totalprice}
                                    reqbydistance.push(combinedJson);
                                    console.log("push to an array is done successfully inside meter");
                                    continue;
                                }
                                //console.log(parseFloat(result.elements[0].distance.text));
                                if(parseFloat(result.elements[0].distance.text)<=5){// parse value to float then check if the distance between technician and dirver <=6km
                                    if(parseFloat(result.elements[0].distance.text)<=2){
                                        const totalprice=price.data+2;
                                        console.log("totalprice "+totalprice);
                                        const combinedJson ={driver:driverbyid.data,request,result:result.elements[0],service:servicebyID.data,price:totalprice}//combine driver info with request he did and the distance 
                                        reqbydistance.push(combinedJson);//push it in an array
                                        console.log("push to an array is done successfully");
                                    }
                                    else{
                                        const totalprice=price.data+2+0.5*(parseFloat(result.elements[0].distance.text)-2);
                                        console.log(totalprice);
                                        const combinedJson ={driver:driverbyid.data,request,result:result.elements[0],service:servicebyID.data,price:totalprice}//combine driver info with request he did and the distance 
                                        reqbydistance.push(combinedJson);//push it in an array
                                        console.log("push to an array is done successfully");
                                    }
                                }
                                else{
                                    //request posted  user is not near workshop
                                    console.log(request.user_id+" Not Near you");
                                    //go to next requset
                                }
                            }
                        }
                        else{//error while getting price
                            req.session.error=price.message;
                            return res.status(price.status).redirect("/Technician/Home");
                        }
                    }
                    else{
                        console.log(request.user_id+" is Already accepted by Another Technician");
                    }
                }
                //print all the request for technician by his user_id
                console.log(reqbydistance.length);
                if(reqbydistance.length>0){
                    return res.status(200).render("TechnicianRequests.ejs",{user:req.user,list:reqbydistance});
                }
                else{
                    req.session.error="There are No Driver Near You";
                    console.log("x");
                    return res.status(200).redirect("/Technician/Home");
                }
            }
            else{
                req.session.error=value.message;
                console.log(value.message);
                return res.status(500).redirect("/Technician/Home");
            }
        }
        catch(err){
            req.session.error="Internal Server Error";
            console.log(err);
            return res.status(500).redirect("/Technician/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="Driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authorized to visit this page"
        return res.status(401).redirect("/");
    }
}
const getAboutUs=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        res.render("AboutUs.ejs",{user:req.user});
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        res.redirect("/");
    }
}
const getContactUs=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        res.render("ContactUs.ejs",{user:req.user});
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        res.redirect("/");
    }
}



const getTechnicianServices=async(req,res)=>{
    if (req.isAuthenticated() && req.user.role === "workshop") {
        try {
            const getAcceptedRequest=await MainModel.getTechnicianAcceptedRequest(req.user.user_id);
            if(getAcceptedRequest.data){
                req.session.error="You can't change your Services right now";
                res.status(200).redirect("/Technician/Home");
            }
            else{
                res.render("TechnicianServices.ejs",{user:req.user});
            }
        } 
        catch (err) {
            console.error("An error occurred in the workshop flow:", err); // Log unexpected errors
            // Redirect with generic error message
            req.session.error = "An internal error occurred. Please try again later.";
            return res.redirect("/Technician/Home");
        }
    } 
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else {
        // Not authenticated or not a workshop user
        return res.status(400).redirect("/");
    }
}

const setTechnicainServices=async(req,res)=>{
    if(req.isAuthenticated()&&req.user.role==="workshop"){
        const deleteResult = await MainModel.deleteWorkShopServicesbyID(req.user.user_id);
        console.log(deleteResult);
        if(deleteResult.success||(!deleteResult.success && deleteResult.status===404)){
            //deleted successfully or its his first time
            const services = req.body.services; // Array of selected service IDs
            var prices =req.body.price;
            prices = prices.filter(price => price.trim()!=='');
            const selectedServices = await services.map((service, index) => ({
                serviceId: service,
                price: prices[index]
            })).filter(service => service.price !== undefined); // Ensure only pairs with prices are included
        
            // Perform necessary operations with selectedServices
            console.log(selectedServices)
            for(const service of selectedServices){
                const setWorkShopServices=await MainModel.setWorkShopServices(req.user.user_id,service.serviceId,service.price);//save in a db 
                if(!setWorkShopServices.success){//if theres an error
                    req.session.error=setWorkShopServices.message;
                    return res.status(setWorkShopServices.status).redirect("/Technician/Home");
                }
                //saved successfully
            }
            req.session.success="Updated Successfully";
            res.status(200).redirect("/Technician/Home");
        }
        else{
            req.session.erro=deleteResult.message;
            return res.status(deleteResult.status).redirect("/Technician/Home");
        }
    }
}

const setTechnicianRequestlist=async(req,res,io)=>{
    if(req.isAuthenticated()&&req.user.role==="workshop"){
        const data=JSON.parse(req.body.data);
        console.log("data",data);
        const getRequestbyRequestID=await MainModel.getRequestbyRequestID(data.request.request_id);
        if(getRequestbyRequestID.success){
            data.request=getRequestbyRequestID.data;
            if(data.request.workshop_id===null){
                data.request.workshop_id=req.user.user_id;
                console.log("data.price",data.price);
                const result=await MainModel.setUpdateIDRequest(data.request.workshop_id,data.request.request_id,data.price,true);
                console.log("setUpdateIDRequest:",result);
                if(result.success){
                    req.session.success="Accepted Successfully";
                    const workship_data={workshop:req.user,price:data.price}
                    io.emit(`accepet-decline-${data.driver.user_id}`,workship_data);
                    return res.status(200).redirect("/Technician/AcceptedRequest");
                }
                else{
                    req.session.error=result.message;
                    return res.status(result.status).redirect("/Technician/Home");
                }
            }
            else{
                req.session.error="Another Technician already accept this request";
                return res.status(200).redirect("/Technician/RequestList");
            }
        }
        else{
            req.session.erro=getRequestbyRequestID.message;
            return res.status(getRequestbyRequestID.status).redirect("/Technician/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="Not Authinticated";
        return res.status(401).redirect("/");
    }
}

const setLogin=async(req,res,next)=>{
    passport.authenticate('technician',(err,user,info)=>{
        if(info===undefined){
            if(user.success===false){
                req.session.error = user.message;
                console.log(req.session.error);
                return res.status(401).redirect("/TechnicianLogin");
            }
            else{
                req.logIn(user, (err) => {
                    if (err){
                      // Handle any errors during login
                      req.session.error="Internal server Error"
                      return res.status(500).redirect("/TechnicianLogin");
                    }
                    // If login is successful, redirect to the desired page
                    
                    console.log(req.user);
                    req.session.success="You have been logged in successfully!";
                    return res.status(200).redirect('/Technician/Home'); 
                });
            }
        }
        else{
            req.session.error = info.message;
            console.log(req.session.error);
            return res.status(400).redirect("/TechnicianLogin");
        }
    })(req, res, next);
};

const setSignup= async (req,res)=>{
    const Usernmae=req.body.Un;
    const Email=req.body.Ea;
    const passwod=req.body.Ps;
    const ConfrimPassword=req.body.Cp;
    const PhoneNum=req.body.Pn;
    const Lat=0;
    const Lan=0;
    const YoE=req.body.YoE;
    const Cer=req.body.Cer;
    try{
        const CheckValueDrriver=await MainModel.getDriverbyEmail(Email);
        console.log(CheckValueDrriver.rows);
        if(CheckValueDrriver.success){
            //Email already Exist as a Driver
            console.log("Email already Exist, Please Login as a driver");//<----
            res.redirect("/DriverLogin");
        }
        else{
            const CheckValueTechnician=await MainModel.getTechnicianbyEmail(Email);
            if(CheckValueTechnician.success){
                //Email already Exist
                console.log("Email already Exist,Please Login as a Technician");//<----
                res.redirect("/");
            }
            else{
                //confirm if passowrrd and confrim password are equal 
                if(passwod===ConfrimPassword){
                //check if email is valid or not await 
                    const validEmail=await axios.get('https://emailvalidation.abstractapi.com/v1/?api_key='+Emailkey+'&email='+Email);
                    if(validEmail.data.deliverability==="DELIVERABLE"){
                        //valid email
                        //check if phone nube is valid
                        var slice="+962"+PhoneNum.slice(1);
                        console.log(slice);
                        const validPhoneN=await axios.get('https://phonevalidation.abstractapi.com/v1/?api_key='+phonekey+'&phone='+slice);
                        if(validPhoneN.data.valid===true){
                            //done
                            console.log("phone number is valid");
                            bcrypt.hash(passwod,SaltRound,async(err,hash)=>{
                                if(err){
                                    //500 encrypt Error
                                   console.log(err);
                                }
                                else{
                                   //save the data in database
                                   var boolpost= await MainModel.setSignupTechnician(Usernmae,Email,hash,PhoneNum,Lat,Lan,YoE,Cer);
                                   console.log(boolpost);
                                   if(boolpost.success===true){
                                      //200
                                      req.session.success=boolpost.message;
                                      return res.status(200).redirect("/TechnicianLogin");
                                   }
                                   else{
                                      //400
                                      req.session.error=boolpost.message;
                                      return res.status(400).redirect("/TechnicianSignup");
                                   }
                                }
                             });
                            
                        }
                        else{
                            //phone number is not valid
                            console.log("phone number is not valid");
                            req.session.error="phone number is not valid";
                            return res.status(400).redirect("/TechnicianSignup")
                        }
                    }
                    else{
                        //Email not valid
                        console.log("Email not valid");
                        req.session.error="Email not valid";
                        return res.status(400).redirect("/TechnicianSignup")
                    }
                }
                else{
                    //confrim password wrong
                    console.log("confrim password wrong");
                    req.session.error="confirm password is wrong";
                    return res.status(400).redirect("/TechnicianSignup")
                }
            }
        } 
        }
    catch(err){
        //500
        req.session.error="Internal Server Error";
        console.log(err);
        return res.status(500).redirect("/TechnicianSignup")
    }
};

const setDelteAcceptedRequest=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        const getRequest=await MainModel.getTechnicianAcceptedRequest(req.user.user_id);
        console.log("getRequest",getRequest);
        if(getRequest.success){
            const deleteAcceptedRequest=await MainModel.deleteAcceptedRequest(getRequest.data.request_id);
            if(deleteAcceptedRequest.success){
                io.emit(`on-updates-${getRequest.data.user_id}`,"We regret to inform you that your driver request has been Declined by the technician");
                req.session.success="The Order You had accepted has been Caneled,Its Going to Effect Your Rating";
                res.status(deleteAcceptedRequest.status).redirect("/Technician/Home");
            }
            else{
                req.session.error=deleteAcceptedRequest.message;
                res.status(deleteAcceptedRequest.status).redirect("/Technician/Home");
            }
        }
        else{
            req.session.error=getRequest.message;
            res.status(getRequest.status).redirect("/Technician/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/Home");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setMap=async (req,res,next)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        const geocodeResult = JSON.parse(req.body.geocode_result);
        const lat=geocodeResult.geometry.location.lat;
        const lan=geocodeResult.geometry.location.lng;
        const location = `(${lat},${lan})`; 
        console.log(location);
        const result=await MainModel.setLocationTechnician(req.user.user_id,location);
        console.log(result.success);
        if(result.success){
            const Technicianservices=await MainModel.getWorkShopServicesbyID(req.user.user_id);
            console.log(Technicianservices);
            if(Technicianservices.success &&Technicianservices.status===200){
                //workshop just want to update location
                req.session.success=result.message;
                return res.status(200).redirect("/Technician/Home");
            }
            else if(Technicianservices.success&&Technicianservices.status===404){
                req.session.success=result.message;
                return res.status(200).render("FTechnicianServices.ejs");
            }
        }
        else{
            req.session.error=result.message;
            return res.status(400).redirect("/Technician/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated To Visit this page Please Login or Rigester";
        return res.redirect("/");
    }
}

const setTechnicianProfile=async(req,res)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        var username=req.body.username||req.user.username;
        var email=req.body.email||req.user.email;
        var phone=req.body.phone_number||req.user.phone_number;
        var certificate=req.body.Cer||req.user.certificate;
        var yearofexperience=req.body.YoE||req.user.yearofexperience;
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
                return res.status(400).redirect("/Technician/Profile")
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
                return res.status(400).redirect("/Technician/Profile");
            }
        }
        if(password===req.user.password){
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
                    //400 new password and confirm password is not the same
                    console.log("New Password and Confirm /password is not the same or missing Values");
                    password=req.user.password;
                    req.session.error=="Invalid Inputs to change Password";
                    return res.status(400).redirect("/Technician/Profile");;
                }
            }
            else{
                //400 password is wrong
                req.session.error="Current Password is Wrong";
                password=req.user.password;
                return res.status(400).redirect("/Technician/Profile");
            }
        }
        const result=await MainModel.setupdateTechnician(req.user.user_id,username,email,password,phone,certificate,yearofexperience);
        if(result.success===true){
            req.session.success=result.message;
            return res.status(200).redirect("/Technician/Home");
        }
        else{
            req.session.error=result.message;
            return res.status(400).redirect("/Technician/Profile");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated to vist this page";
        return res.status(401).redirect("/");
    }
}

const setArrivedTechnician=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        //get driver data from clint
        const driverdata=JSON.parse(req.body.driverinfo);
        console.log(driverdata);
        
        const result=await MainModel.setUpdateArrivedRequest(driverdata.request.request_id,true);
        console.log(result)
        if(result.success){
            req.session.message=result.message;
            io.emit(`on-updates-${driverdata.info.user_id}`,"He has arrived.");
            res.status(result.status).redirect("/Technician/AcceptedRequest");
        }
        else{
            console.log("x");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated to vist this page";
        return res.status(401).redirect("/");
    }
}

const setRequestCompleted=async(req,res,io)=>{
    if(req.isAuthenticated() && req.user.role==="workshop"){
        //get driver info and request info from clint-side
        const driver=JSON.parse(req.body.driverinfo);
        const result=await MainModel.setUpdateCompleteRequest(driver.request.request_id,true);
        if(result.success){
            //updated successfully
            req.session.success=result.message;
            io.emit(`service-completed-${driver.info.user_id}`,"hi");
            return res.status(200).redirect("/Technician/Home");
        }
        else{
            req.session.error=result.message;
            return res.status(result.status).redirect("/Technician/Home");
        }
    }
    else if(req.user!=undefined && req.user.role==="driver"){
        req.session.error="You logged in as a Driver not as Technician";
        res.status(401).redirect("/Driver/logout");
    }
    else{
        req.session.error="You are not Authenticated to vist this page";
        return res.status(401).redirect("/");
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
        return res.render("TechnicianForgetPasswordEmail.ejs");
    }
    catch(err){
        return res.redirect("/");
    }
}

const setSubmitEmail=async(req,res)=>{
    try{
        const email=req.body.email;
        const getTechnicianbyEmail=await MainModel.getTechnicianbyEmail(email);
        if(getTechnicianbyEmail.success){
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
                        text: `You requested a password reset. Click the link below to reset your password:\n\nhttp://localhost:3000/TechnicianForgetPasswordCode?token=${hash}${getTechnicianbyEmail.data.user_id}\n\nCode is ${token}`
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
            req.session.error=getTechnicianbyEmail.message;
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
        console.log(newPassword);
        console.log(confirmPassword);
        if(newPassword===confirmPassword){
            bcrypt.hash(newPassword,SaltRound,async(err,hash)=>{
                if(err){
                    req.session.error="Hash Function Error";
                    return res.redirect("/");
                }
                else{
                    console.log("hash",hash);
                    console.log(userid);
                    const updatePassword=await MainModel.setTechnicianPassword(hash,userid);
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
        return res.render("TechnicianSubmitCode.ejs",{err:err,token:token});
    }
    catch(err){
        req.session.error="Error while get Technician Code page"
        return res.redirect("/");
    }
}
const setForgetPasswordCode=async(req,res)=>{
    try{
        const code=req.body.code;
        const tokenID=req.query.token
        const id=tokenID.slice(60);
        const token=tokenID.slice(0,60);
        console.log(id);
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
                    return res.redirect("/TechnicianNewPassword?token="+tokenID);
                }
                else{
                    req.session.error="Wrong Verification Code ,Try again";
                    console.log("Wrong Verification Code ,Try again");
                    return res.redirect("/TechnicianForgetPasswordCode?token="+tokenID)
                }
            });
        }
        
    }
    catch(err){
        req.session.error="Error while get Technician Code page"
        res.redirect("/");
    }
}

const getNewPassword=async(req,res)=>{
    try{
        const tokenID=req.query.token
        const id=tokenID.slice(60);
        return res.render("TechnicianNewPassword.ejs",{userid:id});
    }
    catch(err){
        req.session.error="Error loading the New Password page.";
        return res.redirect("/");
    }
}


module.exports={
    getLogin,
    getSubmitEmail,
    getLogout,
    getAboutUs,
    getContactUs,
    getTechnicianAcceptedRequest,
    getSignup,
    getNewPassword,
    getForgetPasswordCode,
    getTechnicianServices,
    getTechnicianProfile,
    getTechnicianHome,
    getMap,
    getTechnicianRequestlist,
    setLogin,
    setForgetPasswordCode,
    setTechnicainServices,
    setTechnicianRequestlist,
    setTechnicianProfile,
    setSignup,
    setDelteAcceptedRequest,
    setMap,
    setArrivedTechnician,
    setRequestCompleted,
    setSubmitEmail,
    setNewPassword
}