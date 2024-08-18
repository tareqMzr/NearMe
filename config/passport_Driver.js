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
      const CheckValue=await MainModel.getDriverbyEmail(username);
      console.log(CheckValue);
      if (CheckValue.success==false) {
         // User not found in the database
         console.log(CheckValue.message);
         return cb(null, {success:false,message:CheckValue.message});
      }
      const Cryptpass=CheckValue.data.password;
      bcrypt.compare(password,Cryptpass,(err,result)=>{
         if(err){
            //Wrong password
            console.log("err");
            return cb(null,{success:false,message:"Internal Server Error"});
         }
         else{
            //valid password
            console.log("in passport 2 "+result);
            if(result===true){
               return cb(null,CheckValue.data)
            }
            else{
               console.log("wrong password");
               return cb(null,{success:false,message:"Wrong Password"})
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
const Driver=new LocalStrategy(cutomFileds,verifyCallBack);
passport.use("Driver",Driver);


passport.serializeUser((user, cb) => {
   cb(null,user);
});
passport.deserializeUser(async (obj, done) => {
   try {
      if(obj.role==="driver")
      {
         const userId = obj.user_id; // Updata req.user if the user change his/her info
         const user = await MainModel.getDriverbyID(userId);
         if (!user.success||!user) {
            done(null, false); // No user found
         } 
        else {
            done(null, user.data); // Pass the user object to `req.user`
         }
      }
      else if(obj.role==="workshop"){
         const userId = obj.user_id; // Updata req.user if the user change his/her info
         const user = await MainModel.getTechnicianbyID(userId);
         if (!user.success||!user) {
            done(null, false); // No user found
         } 
        else {
            done(null, user.data); // Pass the user object to `req.user`
         }
      }
      else if(obj.role==="admin"||obj.role==="super_admin"){
         const userId = obj.admin_id; // Updata req.user if the user change his/her info
         const user = await MainModel.getAdminbyID(userId);
         if (!user.success||!user) {
            done(null, false); // No user found
         } 
        else {
            done(null, user.data); // Pass the user object to `req.user`
         }
      }
      else{
         done(null,obj)
      }
   } 
   catch (err) {
     done(err); // Pass the error to the done callback
   }
});