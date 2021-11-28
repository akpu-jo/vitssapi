import User from "../models/userModel.js";

export const createUsername = async (emailUsername) =>{
    const user = await User.findOne({ username: emailUsername });
    if(!user){
        return false
    }else{
        return true
    }
}