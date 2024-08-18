const pg = require('pg');
require('dotenv').config();
const db=new pg.Client({
    user:process.env.POSTGRES_USER,
    host:process.env.POSTGRES_HOST,
    database:process.env.POSTGRES_DB,
    password:process.env.POSTGRES_PASSWORD,
    port:process.env.POSTGRES_PORT
});

db.connect();
async function getDriverbyEmail(email){
    try{
        const result= await db.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log(result.rowCount);
        if(result.rowCount===0){
            return {success:false,data:null,message:"Cant Find Driver By Email Provided"};
        }
        else{
            return {success:true,data:result.rows[0],message:"Found Successfully"}
        }
    }
    catch(err){
        console.log(err);
        return {success:false,data:null,message:"Internal Server Error"};
    }
}
async function getDriverbyID(user_id){
    try{
        const result=await db.query("select * from users where user_id=$1",[user_id]);
        if(result.rowCount!=0){
            return {success:true,data:result.rows[0],message:"User found successfully"};
        }
        else{
            return { success: false, status:404,data: null, message: "No user found with this ID" };
        }
    }
    catch(err){
        return  { success: false, status:500,data: null, message: "An error occurred during search" };
    }
}
async function getRequestbyUserID(user_id){
    try{
        const result=await db.query("SELECT * FROM request where user_id=$1 and completed=false",[user_id]);
        if(result.rowCount===0){
            return {success:false,status:404,data:null,message:"Not found by Request ID"}
        }
        return {success:true,status:200,data:result.rows[0],message:"You have already Submitted a Request."}
    }catch(err){
        console.log(err);
        return {success:false,status:500,data:null,message:"Internal Server Error"};
    }
}
async function getRequestbyRequestID(request_id){
    if(!request_id){
        return {
            success: false,
            data: null,
            status:400,
            message: 'Invalid or empty request_id provided',
        };
    }
    try{
        const result=await db.query("SELECT * FROM request where request_id=$1",[request_id]);
        if (result.rowCount === 0) {
            return {
                success: false,
                data: null,
                status:404,
                message: 'Request not found',
            };
        }
        return {
            success: true,
            data: result.rows[0],
            status:200,
            message: 'Request found Successfully',
        };
    }catch(err){
        console.error('Error fetching Request by ID:', err); // Log error with context
        return {
            success: false,
            data: null,
            status:500,
            message: 'An error occurred while fetching the Request. Please try again later.',
            error: err.message, // Optional: Include error message for more context
        };
    }
}
async function getServicebyID(service_id) {
    // Input validation
    if (!service_id) {
        return {
            success: false,
            data: null,
            message: 'Invalid or empty service_id provided',
        };
    }
    try {
        const result = await db.query(
            "SELECT * FROM service WHERE service_id = $1",
            [service_id]
        );
        if (result.rowCount === 0) {
            return {
                success: false,
                data: null,
                message: 'Service not found',
            };
        }
        // Return successful response with data
        return {
            success: true,
            data: result.rows[0],
            message: 'Service found Successfully',
        };
    } catch (err) {
        console.error('Error fetching service by ID:', err); // Log error with context
        return {
            success: false,
            data: null,
            message: 'An error occurred while fetching the service. Please try again later.',
            error: err.message, // Optional: Include error message for more context
        };
    }
}
async function getTechnicianbyEmail(email){
    try{
        const result=await db.query("SELECT * FROM Workshop WHERE email = $1", [email]);
        if(result.rowCount===0){
            return {success:false,data:null,message:"No Data with this Email"};
        }
        else{
            return{success:true,data:result.rows[0],message:"Found Successfully"}
        }
    }
    catch(err){
        console.log(err);
        return {success:false,data:null,message:"Internal Server Error"};
    }
}
async function getTechnicianRequest(){
    try{
        const result=await db.query("SELECT * FROM request");
        if(result.rowCount!=0){
            return {success:true,data:result.rows[0],message:"Request found successfully"};
        }
        else{
            return { success: false, data: null, message: "there is no Request found" };
        }
    }
    catch(err){
        return  { success: false, data: null, message: "An error occurred during search" };
    }
}
async function getWorkShopServicesbyID(user_id){
    if (!user_id || typeof user_id !== 'number' || user_id <= 0) {
        return {
            success: false,
            data: null,
            status:404,
            message: "Invalid user ID",
        };
    }
    try {
        const result = await db.query("SELECT * FROM workshopservice WHERE user_id = $1", [user_id]);
        if (result.rowCount > 0) {
            return {
                success: true,
                data: result.rows,
                status:200,
                message: "Services found successfully",
            };
        } else {
            return {
                success: true,
                data: null,
                status:404,
                message: "No services found for the given user ID",
            };
        }
    } catch (err) {
        // Log error details for debugging purposes
        console.error("Database error in getWorkShopServicesbyID:", err);
        return {
            success: false,
            data: null,
            status:500,
            message: "An internal error occurred while fetching workshop services. Please try again later.",
        };
    }
}
async function getpricebyWokshopID(workshop_id,service_id){
    try {
        const result = await db.query( "SELECT price FROM workshopservice WHERE user_id = $1 AND service_id = $2", [workshop_id, service_id]);
        // Check if the query returned any results
        if (result.rows.length === 0) {
            return {success:false,status:404, message:"Found successfully"}
        }
        // Assuming you need to do something with the result
        const price = result.rows[0].price;
        return {success:true,data:price,message:"Found successfully"}
    } 
    catch (err) {
        // Log the error with context information
        console.error('Error querying workshop service:', {
            workshop_id,
            service_id,
            error: err.message,
        });
        // You can handle specific errors based on their type or message
        if (err.message.includes('No matching workshop service found')) {
            // Handle case where no matching workshop service is found
            console.error('No matching workshop service found for given user_id and service_id.');
            return {success:false,status:404, message:"No matching workshop service found for given user and service"}
            // Respond or take appropriate action
        } else {
            // Handle generic database errors
            console.error('Database error:', err.message);
            return {success:false,status:500, message:"Interal Server Error"}
            // Respond or take appropriate action
        }
    }
}
async function getTechnicianbyID(user_id){
    try{
        const result = await db.query("SELECT * FROM workshop WHERE user_id = $1", [user_id]);
        if (result.rows.length === 0) {
            console.log("No workshop found for user_id:", user_id);
            return { success: false, status:404,data:null,message: "No workshop found" };
        }
        // Handle successful query result
        return { success: true, data: result.rows[0] ,message:"Found Successfully"};
    } catch (err) {
        // Handle query error
        console.error("Error executing query:", err);
        return { success: false,status:500, message: "Database error" };
    }
}
async function getFilterRequestbyTechServiceType(user_id){
    if (!user_id || typeof user_id !== 'number' || user_id <= 0) {
        return {
            success: false,
            data: null,
            message: "Invalid user ID",
        };
    }
    try{
        const result= await db.query
        ("SELECT request.request_id,request.user_id,request.service_id,request.description,request.workshop_id,request.location FROM request inner JOIN workshopservice ON request.service_id=workshopservice.service_id where workshopservice.user_id=$1 and request.completed=false",
        [user_id]);
        if (result.rowCount > 0) {
            return {
                success: true,
                data: result.rows,
                message: "Requests found successfully",
            };
        } else {
            return {
                success: false,
                data: null,
                message: "No one near you wants a service.\n Please Try again later",
            };
        }
    }
    catch(err){
        console.error("Database error in getWorkShopServicesbyID:", err);
        return {
            success: false,
            data: null,
            message: "An internal error occurred while fetching workshop Request List. Please try again later.",
        };
    }
}
async function getFilterTechnicianbyServiceType(service_id){
    try{
        const result = await db.query(
            "SELECT workshop.user_id,workshop.username,workshop.email,workshop.location,workshop.phone_number FROM workshop JOIN workshopservice ON workshop.user_id = workshopservice.user_id WHERE workshopservice.service_id=$1",
            [service_id]
        );
        // Check if any rows were returned
        if (result.rowCount !== 0) {
            return { success: true, status: 200, data: result.rows, message: "Found Successfully" };
        } else {
            return { success: false, status: 404, message: "No workshops found for the specified service" };
        }
    } 
    catch(error){
        // Check if the error is related to database connectivity or query execution
        if (error instanceof db.errors.QueryError || error instanceof db.errors.ConnectionError) {
            console.error("Database error:", error.message);
            return { success: false, status: 500, message: "An error occurred while accessing the database" };
        } else {
            // Handle other types of errors
            console.error("Unexpected error:", error.message);
            return { success: false, status: 500, message: "An unexpected error occurred" };
        }
    }
}
async function getFilterTechnicianbyCompleted(workshop_id){
    try{
        const result=await db.query("select * from request where workshop_id=$1 and completed=false",[workshop_id]);
        if(result.rowCount!==0){
            console.log("result",result);
            return{success:true,status:200,message:"Found Successfully"}
        }
        else{
            return{success:false,status:404,message:"No Data"}
        }
    }
    catch(err){
        return{success:false,status:500,message:"Internal Server Error"}
    }
}
async function getTechnicianAcceptedRequest(user_id){
    try{
        const result=await db.query("SELECT * FROM request where workshop_id=$1 and completed=false",[user_id]);
        if (result.rowCount !== 0) {
            return { success: true, status: 200, data: result.rows[0], message: "Found Successfully" };
        } else {
            return { success: false, status: 404, message: "No workshops found for the specified service" };
        }
    }
    catch(err){
        console.error("Database error in getWorkShopServicesbyID:", err);
        return {
            success: false,
            data: null,
            status:500,
            message: "An internal error occurred while fetching Accepted Request by workshop. Please try again later.",
        };
    }
}
async function getCompleteRequestbyUserID(user_id){
    try{
        const result=await db.query("SELECT * FROM request where user_id=$1 ORDER BY request_id desc limit 1;",[user_id]);
        if (result.rows.length > 0) {
            // Get the last element in the array
            return {success:true,data:result.rows,message:"Found Successfully",status:200};
        } 
        else {
            return {success:false,message:"Not Found missing Data", status:404}; // No completed requests found for the user
        }
    }
    catch(err){
        return {success:false,message:"Interrnal DB Error", status:500};
    }
}
async function getFeedBackbyUserID(workshop_id){
    try {
        const result = await db.query("SELECT * FROM feedback WHERE workshop_id = $1", [workshop_id]);
        // Handle the case where the query is successful but returns no rows
        if (result.rows.length === 0) {
            console.log("No feedback found for the given workshop_id");
            return {
                success: true,
                status: 404,
                message: "No feedback found for the given workshop ID",
                data:[]
            };
        }
        // Return the successful result
        return {
            success: true,
            status: 200,
            message: "Feedback retrieved successfully",
            data: result.rows,
        };
    } catch (err) {
        console.error("Error executing query:", err);
        return {
            success: false,
            status: 500,
            message: "An error occurred while retrieving feedback",
            error: err.message,
        };
    }
}


async function setFeeDriverbyID(user_id,fee){
    try {
        // Execute query
        const result = await db.query("UPDATE users SET fee=$1 WHERE user_id=$2", [fee, user_id]);
    
        // Check result (optional, depending on what you want to do next)
        if (result.rowCount === 0) {
            return { success: false, message: "Invalid Update" };
        }
    
        // Return success result
        return { success: true, message: 'User fee updated successfully' };
    } catch (err) {
        // Log the error
        console.error('Error updating user fee:', err.message);
    
        // Return error object
        return { success: false, message: err.message };
    }
}
async function setUpdateIDRequest(workshop_id,request_id,price,pending){
    if(!request_id){
        return {
            success: false,
            message: "Invalid Request ID",
            status:400
        };
    }
    try{
        const result=await db.query("UPDATE request SET workshop_id=$1 ,price=$2 ,pending=$3 WHERE request_id=$4",[workshop_id,price,pending,request_id]);
        if(result.rowCount!=0){
            return {success:true,message:"Update successfully",status:200};
        }
        else{
            return {success:false,messahe:"No user found with this ID.",status:404};
        }
    }
    catch(err){
        console.log("Error during update:", err);
        return { success: false, message: "Error occurred during update." ,status:500};
    }
}
async function setUpdateArrivedRequest(request_id,arrived){
    if(!request_id||!arrived){
        return{success:false,status:400,message:"Messing Inputs"}
    }
    try{
        const result=await db.query("UPDATE request SET workshop_arrived=$1 WHERE request_id=$2",[arrived,request_id]);
        if (result.rowCount === 0) {
            return { success: false, status: 404, message: "Request not found" };
        }
        return { success: true, status: 200, message: "Request updated successfully" };
    } catch (err) {
        // Log the error for debugging purposes
        console.error(err);
        // Return a generic error response
        return { success: false, status: 500, message: "An error occurred while updating the request" };
    }
}
async function setUpdateCompleteRequest(request_id,complete){
    try {
        const result = await db.query("UPDATE request SET completed=$1  WHERE request_id=$2", [complete,request_id]);

        if (result.rowCount === 0) {
            // No rows were affected, meaning the request_id does not exist
            console.warn(`No request found with request_id=${request_id}`);
            return { success: false, status:404, error: `No request found with request_id=${request_id}` };
        }
        // Successfully updated
        return { success: true, data: result.rows[0] };
    } catch (err) {
        // Log detailed error information
        console.error(`Error updating request status for request_id=${request_id}:`, err);

        // Return a generic error message
        return { success: false, status:500, error: 'Failed to update request status. Please try again later.' };
    }
}
async function setRequestFeedBack(request_id,feedback_id){
    try {
        const result = await db.query( "UPDATE request SET feedback_id=$1 WHERE request_id=$2;",[feedback_id, request_id]);
    
        if (result.rowCount > 0) {
            return { success: true, status: 200, message: "Updated Successfully"};
        } else {
            return { success: false, status: 400, message: "Update failed, no rows affected" };
        }
    } catch (err) {
        console.error("Error executing query:", err);
    
        // Return a detailed error response
        return {
            success: false,
            status: 500,
            message: "An error occurred while executing the query",
            error: err.message
        };
    }
}
async function setDriverFeedBack(workshop_id, request_id, rate, description) {
    try {
        const result = await db.query(
            "INSERT INTO feedback (request_id, workshop_id, rate, description) VALUES ($1, $2, $3, $4) RETURNING *;",
            [request_id, workshop_id, rate, description]
        );
        if (result.rowCount === 1) {
            return { success: true, message: 'Feedback submitted successfully', feedback: result.rows[0]};
        } else {
            return { success: false,status:404, message: 'Feedback submission failed.' };
        }
    } catch (err) {
        console.error('Error inserting feedback:', err);
        // Determine the type of error and provide a meaningful message
        return { success: false, status:500,message: 'An unexpected error occurred. Please try again later.', error: err };
    }
}

async function setDriverPassword(hash,user_id) {
    try {
        const result = await db.query("UPDATE users SET password=$1 WHERE user_id=$2;",[hash,user_id]);
        if (result.rowCount === 1) {
            return { success: true, message: 'Password is Updated Successfully'};
        } else {
            return { success: false,status:404, message: 'Error while Update Password' };
        }
    } catch (err) {
        console.error('Error inserting feedback:', err);
        // Determine the type of error and provide a meaningful message
        return { success: false, status:500,message: 'An unexpected error occurred. Please try again later.', error: err };
    }
}

async function setTechnicianPassword(hash,user_id) {
    try {
        const result = await db.query("UPDATE workshop SET password=$1 WHERE user_id=$2;",[hash,user_id]);
        if (result.rowCount === 1) {
            return { success: true, message: 'Password is Updated Successfully'};
        } else {
            return { success: false,status:404, message: 'Error while Update Password' };
        }
    } catch (err) {
        console.error('Error inserting feedback:', err);
        // Determine the type of error and provide a meaningful message
        return { success: false, status:500,message: 'An unexpected error occurred. Please try again later.', error: err };
    }
}

async function setSignupTechnician(username,email,password,phoneN,lat,lan,yoe,cer){
    if (!username || !email || !password || !phoneN || lat === undefined || lan === undefined || yoe === undefined || !cer) {
        console.error("Invalid input parameters for SignupTechnician");
        return { success: false, message: "Invalid input parameters" };
    }
    try {
        const location = `(${lat},${lan})`; // Format location data
        await db.query("INSERT INTO Workshop (username, email, password, phone_number, Location, YearofExperience, certificate,role) VALUES ($1, $2, $3, $4, $5, $6, $7,$8)",
        [username, email, password, phoneN, location, yoe, cer,"workshop"]);
        console.log("Signup successful for technician:", username);
        return { success: true, message: "Signup successful" };
    } 
    catch (err){
        const x=err.detail.split("=");
        console.error("Error during technician signup:",x); // Log the error
        return { success: false, message: x[1] }; // Return a consistent error message
    }
}
async function setSignupDrive(username,email,password,phoneN){
    if (!username || !email || !password || !phoneN) {
        console.error("Invalid input parameters for SignupDrive");
        return { success: false, message: "Invalid input parameters" };
      }
    try{
        await db.query
        ("insert into users (username,email,password,phone_number,role,fee) values($1,$2,$3,$4,$5,$6)"
        ,[username,email,password,phoneN,"driver",0]);
        console.log("done");
        return { success: true, message: "Signup successful" };
    }
    catch(err){
        console.log(err);
        return { success: false, message: err.detail };
    }
}
async function setLocationTechnician(user_id,location){
    if(!location || !user_id){
        //400
        console.error("Invalid input parameters for set location");
        return { success: false, message: "Invalid input parameters" };
    }
    try{
        await db.query("UPDATE workshop set location=$1 where user_id=$2",[location,user_id]);
        return {success:true,message:"Location is saved successfuly"};
    }
    catch(err){
        console.log(err);
        return { success: false, message: err.detail };
    }

}
async function setPendingRequest(request_id,pending){
    try {
        const result = await db.query("UPDATE request SET pending=$1 WHERE request_id=$2 RETURNING *;", [pending, request_id]);
        
        if (result.rowCount === 0) {
            // No rows were updated
            console.warn("No request found with the given request_id.");
            return { success: false, status:404,message: "No request found with the given request_id." };
        }

        // Update was successful
        return { success: true, message: "Request updated successfully."};
    } catch (err) {
        // Log the error details for debugging
        console.error("Database query error:", err);

        return { success: false, status:500,message:"Internal Server Error" };
    }
}
async function setRequest(user_id,service_id,description,lat,lan,arrived){
    if (!user_id || !service_id  ||lat === undefined || lan === undefined ){
        console.error("Invalid input parameters for SignupTechnician");
        return { success: false,status:404,message: "Invalid input parameters" };
      }
    try{
        const result=await db.query("insert into request (user_id,service_id,description,location,workshop_arrived,completed,pending,feedback_id,price) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[user_id,service_id,description,"("+lat+","+lan+")",arrived,false,false,null,null]);
        if (result.rowCount === 1) {
            return { success: true, status:200,message: 'Request created successfully' };
        } 
        else {
            console.error("Failed to create request: No rows affected");
            return { success: false, status:404,message: 'Failed to create request: No rows affected' };
        }
    }catch(err){
        console.log(err);
        return {
            success: false,
            status:500,
            message: 'An error occurred while creating the request'
        };
    }
}
async function setupdateDriver(user_id,username,email,password,phone){
    try{
        const result=await db.query("UPDATE users set username=$1,email=$2,password=$3,phone_number=$4 where user_id=$5",[username,email,password,phone,user_id] );
        if(result.rowCount!=0){
            return {success:true,message:"Update successfully"};
        }
        else{
            return {success:false,messahe:"No user found with this ID."};
        }
    }
    catch(err){
        console.log("Error during update:", err);
        return { success: false, message: "Error occurred during update." };
    }
}
async function setWorkShopServices(workshop_id,service_id,price){
    if (!workshop_id || !service_id) {
        // Return a meaningful response for invalid input
        return {
            success: false,
            status:400,
            message: "Invalid workshop_id or service_id",
        };
    }
    try {
        const result = await db.query("INSERT INTO workshopservice (user_id, service_id,price) VALUES ($1, $2,$3)",[workshop_id, service_id,price]);
        if (result.rowCount > 0) {
            // Successful insertion
            return {
                success: true,
                status:200,
                message: "Service added successfully",
            };
        } else {
            // No rows affected, this should be unexpected for an INSERT
            return {
                success: false,
                status:400,
                message: "Service not added, no rows affected Please Try again",
            };
        }
    } catch (err) {
        console.error("Error adding workshop service:", err); // Log the error details
        // Return an error response with a general message
        return {
            success: false,
            status:500,
            message: "An error occurred while adding the workshop service. Please try again later.",
            error: err.message, // Optionally include the error message for more detail
        };
    }
}
async function setupdateTechnician(user_id,username,email,password,phone,certificate,yearofexperience){
    try {
        // Check if any of the required parameters are null
        if (user_id === null || username === null || email === null || password === null || phone === null || certificate === null || yearofexperience === null) {
            return { success: false, message: "One or more required parameters are null" };
        }

        const result = await db.query("UPDATE workshop SET username=$1, email=$2, password=$3, yearofexperience=$4, certificate=$5, phone_number=$6 WHERE user_id=$7", [username, email, password, yearofexperience, certificate, phone, user_id]);
        // Check if the query was successful
        if (result.rowCount === 1) {
            return { success: true, message: "updated successfully" };
        } else {
            return { success: false, message: "Technician not found or not updated" };
        }
    } catch (err) {
        console.error("Error updating technician:", err);
        return { success: false, message: "An error occurred while updating technician" };
    }
}
async function deleteWorkShopServicesbyID(workshop_id){
    if (typeof workshop_id !== 'number' || workshop_id <= 0) {
        return { success: false, status:500, message: "Invalid workshop ID" };
    }
    try {
        const result = await db.query("DELETE FROM workshopservice WHERE user_id = $1", [workshop_id]);

        if (result.rowCount > 0) {
            return {
                success: true,
                data: result,
                status:200,
                message: "Workshop services deleted successfully",
            };
        } else {
            return {
                success: false,
                status:404,
                message: "No workshop services found with the given ID",
            };
        }
    } catch (err) {
        console.error("Error deleting workshop services:", err); // Log error for debugging
        return {
            success: false,
            status:500,
            message: "An error occurred while deleting workshop services. Please try again later.",
        };
    }
}
async function deleteAcceptedRequest(request_id){
    try{
        const result =await db.query("UPDATE request SET workshop_id=null,workshop_arrived=false,completed=false,pending=false,feedback_id=null,price=null WHERE request_id=$1",[request_id]);
        if (result.rowCount > 0) {
            return {
                success: true,
                data: result,
                status:200,
                message: "You Just Declined Techninican",
            };
        } else {
            return {
                success: false,
                status:404,
                message: "No Request accepted by this workshop is found with the given ID",
            };
        }
    }
    catch(err){
        return{
            success:false,
            status:500,
            message:"Internal Server Error"
        }
    }
}
async function deleteRequest(request_id){
    try {
        const result = await db.query("DELETE FROM request WHERE request_id = $1;", [request_id]);
        if (result.rowCount === 0) {
            return {success:false,status:404,message:"No request found with the given ID"};
        }
        return { success: true, message: 'Request deleted successfully' };
    } catch (err) {
        console.error('Error deleting request:', err);
        return { success: false,status:500, message: "internal Server Error" };
    }
}



async function setAdminSignup(Username,Email,Password,Role){
    try {
        // Execute the query
        const result = await db.query(  "INSERT INTO admin(username, email, password, role, status, created_by, updated_by,Canceled_by) VALUES($1, $2, $3, $4, $5, $6, $7,null);", [Username,Email,Password,Role, "inactive", null, null]);
        

        // Check if the insertion was successful
            return {
                success:true,
                status: "success",
                message: "Admin user created successfully. waiting for Accept from Super Admin",
            };
    } catch (err) {
        // Log the error for debugging purposes
        console.error("Error creating admin user:", err);

        // Return an error status and message
        return {
            success:false,
            status: 500,
            message: "An error occurred while creating the admin user. Please try again later."
        };
    }
}
async function getAdminbyEmail(Email){
    try {
        // Execute the query
        const result = await db.query("SELECT * FROM admin WHERE email = $1", [Email]);

        // Check if any rows were returned
        if (result.rows && result.rows.length > 0) {
            return {
                success:true,
                status: 200,
                message: "Admin user retrieved successfully.",
                data: result.rows[0] // Return the retrieved rows
            };
        } else {
            return {
                success:false,
                status: 404,
                message: "No admin user found with the given email."
            };
        }
    } catch (err) {
        // Log the error for debugging purposes
        console.error("Error retrieving admin user:", err);

        // Return an error status and message
        return {
            success:false,
            status:500,
            message: "An error occurred while retrieving the admin user. Please try again later."
        };
    }
}
async function getAdminbyID(admin_id){
    try {
        // Execute the query
        const result = await db.query("SELECT * FROM admin WHERE admin_id = $1", [admin_id]);

        // Check if any rows were returned
        if (result.rows && result.rows.length > 0) {
            return {
                success:true,
                status: 200,
                message: "Admin user retrieved successfully.",
                data: result.rows[0] // Return the retrieved rows
            };
        } else {
            return {
                success:false,
                status: 404,
                message: "No admin user found with the given ID."
            };
        }
    } catch (err) {
        // Log the error for debugging purposes
        console.error("Error retrieving admin user:", err);

        // Return an error status and message
        return {
            success:false,
            status:500,
            message: "An error occurred while retrieving the admin user. Please try again later."
        };
    }
}
async function getAllTechnicians(){
    try{
        const result=await db.query("select * from workshop ORDER BY user_id");
        if(result.rows.length!==0 || result.rows.length===0){
            return {success:true,data:result.rows,message:"Found Successfully"}
        }
        return  {success:false,data:null,message:"Error while finding Technician",status:404}
    }
    catch(err){
        return  {success:false,data:null,message:err.message,status:500}
    }
}
async function getAllDrivers(){
    try{
        const result=await db.query("select * from users ordere ORDER BY user_id");
        if(result.rows.length!==0 || result.rows.length===0){
            return {success:true,data:result.rows,message:"Found Successfully"}
        }
        return  {success:false,data:null,message:"Error while finding Driver",status:404}
    }
    catch(err){
        return  {success:false,data:null,message:err.message,status:500}
    }
}
async function getAllFeedBack(){
    try{
        const result=await db.query("select * from feedback ORDER BY feedback_id");
        if(result.rows.length!==0 || result.rows.length===0){
            return {success:true,data:result.rows,message:"Found Successfully"}
        }
        return  {success:false,data:null,message:"Error while finding feedback",status:404}
    }
    catch(err){
        return  {success:false,data:null,message:err.message,status:500}
    }
}
async function getAllAdmin(admin_id){
    try{
        const result=await db.query("SELECT * FROM admin WHERE admin_id <>$1 order by admin_id;",[admin_id]);
        console.log(result.rows);
        if(result.rows.length!==0 || result.rows.length===0){
            return {success:true,data:result.rows,message:"Found Successfully"}
        }
        return  {success:false,data:null,message:"Error while finding admin",status:404}
    }
    catch(err){
        return  {success:false,data:null,message:err.message,status:500}
    }
}
async function getAllRequest(){
    try{
        const result=await db.query("select * from request ORDER BY request_id");
        if(result.rows.length!==0 || result.rows.length===0){
            return {success:true,data:result.rows,message:"Found Successfully"}
        }
        return  {success:false,data:null,message:"Error while finding request",status:404}
    }
    catch(err){
        return  {success:false,data:null,message:err.message,status:500}
    }
}
async function setApproveAdmin(Admin_id,SuperAdmin_id){
    try{
        const result=await db.query("UPDATE admin SET  status=$1, created_by=$2, updated_by=$3 WHERE admin_id=$4;",["active",SuperAdmin_id,SuperAdmin_id,Admin_id]);
        if(result.rowCount!==0){
            return{success:true,message:"Updated Successfully"}
        }
        return{success:false,message:"Error 404"}
    }
    catch(err){
        return{success:false,message:"Error 500"}
    }
}
async function setCancelAdmin(Admin_id,SuperAdmin_id){
    try{
        const result=await db.query("Update admin set canceled_by=$1 where admin_id=$2",[SuperAdmin_id,Admin_id]);
        if(result.rowCount!==0){
            return{success:true,message:"Updated Successfully"}
        }
        return{success:false,message:"Error 404"}
    }
    catch(err){
        return{success:false,message:"Error 500"}
    }
}
async function setDeleteAdminRequest(request_id,){
    try{
        const result=await db.query("DELETE FROM request WHERE request_id=$1;",[request_id]);
        return{success:true,message:"Updated Successfully"}
    }
    catch(err){
        return{success:false,message:"Error 500"}
    }
}
async function setDeleteAdminDriver(user_id){
    try{
        const result=await db.query("DELETE FROM users WHERE user_id=$1;",[user_id]);
        return{success:true,message:"Updated Successfully"}
    }
    catch(err){
        return{success:false,message:"Error 500"}
    }
}
async function setDeleteAdminWorkShop(workshop_id){
    try{
        const result=await db.query("DELETE FROM workshop WHERE user_id=$1;",[workshop_id]);
        return{success:true,message:"Updated Successfully"}
    }
    catch(err){
        return{success:false,message:"Error 500"}
    }
}

module.exports={
    setDeleteAdminWorkShop,
    setDeleteAdminRequest,
    setDeleteAdminDriver,
    setCancelAdmin,
    setApproveAdmin,
    getAllRequest,
    getAllTechnicians,
    getAllDrivers,
    getAllFeedBack,
    getAllAdmin,
    getServicebyID,
    getDriverbyID,
    getDriverbyEmail,
    getTechnicianbyEmail,
    getTechnicianbyID,
    getWorkShopServicesbyID,
    getFeedBackbyUserID,
    getpricebyWokshopID,
    getRequestbyUserID,
    getRequestbyRequestID,
    getFilterRequestbyTechServiceType,
    getFilterTechnicianbyServiceType,
    getFilterTechnicianbyCompleted,
    getTechnicianAcceptedRequest,
    getTechnicianRequest,
    getCompleteRequestbyUserID,
    setRequest,
    setLocationTechnician,
    setSignupDrive,
    setDriverPassword,
    setDriverFeedBack,
    setRequestFeedBack,
    setSignupTechnician,
    setUpdateIDRequest,
    setupdateTechnician,
    setUpdateCompleteRequest,
    setupdateDriver,
    setUpdateArrivedRequest,
    setWorkShopServices,
    setFeeDriverbyID,
    setTechnicianPassword,
    setPendingRequest,
    deleteWorkShopServicesbyID,
    deleteAcceptedRequest,
    deleteRequest,
    setAdminSignup,
    getAdminbyEmail,
    getAdminbyID
}