const passport=require("passport");
const LocalStrategy=require('passport-local').Strategy;
const MainModel=require("../model/mainModel");
const bcrypt=require("bcrypt");
const cutomFileds={
   usernameField:'Email',
   passwordField:'Password'
}
const verifyCallBack=async(username,password,cb)=>{
    try{
       const CheckAdmin=await MainModel.getAdminbyEmail(username);
       console.log("CheckAdmin",CheckAdmin.data.canceled_by);
       if (CheckAdmin.success==false) {
          // User not found in the database
          console.log("CheckAdmin",CheckAdmin.message);
          return cb(null, {success:false,message:CheckAdmin.message});
       }
       const Cryptpass=CheckAdmin.data.password;
       bcrypt.compare(password,Cryptpass,(err,result)=>{
          if(err){
             //Wrong password
             console.log("err");
             return cb(null,{success:false,message:"Internal Server Error"});
          }
          else{
             //valid password
             console.log("in passport admin "+result);
             console.log("in passport admin "+CheckAdmin.data.admin_id);
             if(result===true){
               if(CheckAdmin.data.created_by!==null && CheckAdmin.data.canceled_by===null){
                  console.log("ok");
                  return cb(null,CheckAdmin.data)
               }
               else{
                  return cb(null,{success:false,message:"You are Not Autharized because Super Admin did not accept You, Please Wait for Acceptanc"})
               }
             }
             else{
               console.log(" passport-Server Error");
               return cb(null,{success:false,message:"passport-Server Error"})
             }
          }
       });   
    }
    catch(err){
       //400
       console.log(err);
       return cb(null,{success:false,message:"Internal Error"})
    }
 }
 const Admin=new LocalStrategy(cutomFileds,verifyCallBack);
 passport.use("Admin",Admin);