import httpStatus from "http-status"
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcryptjs"
import crypto from "crypto"


const login=async(req,res) => {
    const {username,password}=req.body
    if(!username||!password){
        return res.status(httpStatus.BAD_REQUEST).json({message:"Please enter both username and password"})
    } 
    try {
        const user=await User.findOne({username})
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message:"User not found"})
        }


        let isPasswordCorrect= await bcrypt.compare(password,user.password)

        if(isPasswordCorrect){
            let token = crypto.randomBytes(20).toString("hex")
            user.token= token
            await user.save()
            return res.status(httpStatus.OK).json({message:"Login successful",token})

        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid password or username"})
        }
        
    } catch (error) {
        return res.status(500).json({message:`Something went wrong:${error}`})
    }

}



const register =async (req,res)=>{
    const {name,username,password}=req.body;

    try {
        const existinguser = await User.findOne({ username }); 
        if (existinguser) {
            return res.status(httpStatus.FOUND).json({ message: "Username already exists" });

        }

        const hashedpassword=await bcrypt.hash(password,10)

        const newUser= new User({
            name:name,
            username:username,
            password:hashedpassword
        })
        await newUser.save()

        res.status(httpStatus.CREATED).json({message:"User registered"})

        
    } catch (error) {
        res.json({ message: `Something went wrong: ${error}` });
    }
    


}


const getUserHistory =async(req,res)=>{
    const {token}=req.query
    try {
        const user = await User.findOne({ token });
        const meetings = await Meeting.find({user_id:user.username})
        res.json(meetings)
    } catch (error) {
        res.json({message:`something went wrong ${error}`})
    }

}


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

export {login,register,getUserHistory,addToHistory}