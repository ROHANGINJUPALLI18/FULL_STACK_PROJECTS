import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        avatar:{
            type:String,
            required:true
        },
        googleId:{
            type:String,
            required:true,
            unique:true
        }
    },
    {
        timestamps:true
    }
)

export default mongoose.model("User",userSchema);