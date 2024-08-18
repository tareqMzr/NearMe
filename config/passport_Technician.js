const passport=require("passport");
const LocalStrategy=require('passport-local').Strategy;
const MainModel=require("../model/mainModel");
const bcrypt=require("bcrypt");
const cutomFileds={
   usernameField:'Email',
   passwordField:'Password'
}
const verifyCallBack = async (username, password, cb) => {
    try {
        // Check if username or password are empty
        const CheckValue = await MainModel.getTechnicianbyEmail(username);
        if (CheckValue.success===false) {
            // User not found in the database
            console.log(CheckValue.message)
            return cb(null, { success: false, message: CheckValue.message });
        }
        const Cryptpass = CheckValue.data.password;
        bcrypt.compare(password, Cryptpass, (err, result) => {
            if (err) {
                //Wrong password
                console.log("err");
                return cb(null, { success: false, message: "Internal Database Error" });
            } else {
                //valid password
                console.log(result);
                if (result === true) {

                    return cb(null, CheckValue.data);
                } else {
                    console.log("wrong password");
                    return cb(null, { success: false, message: "wrong password" });
                }
            }
        });
    } catch (err) {
        //400
        console.log(err);
        return cb(null, { success: false, message: "Internal Error" });
    }
}


const technician=new LocalStrategy(cutomFileds,verifyCallBack);
passport.use("technician", technician);


