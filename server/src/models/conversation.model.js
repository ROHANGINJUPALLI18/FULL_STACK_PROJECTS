import mongoose  from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        partticipants:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            }
        ],
        isGroup:{
            type:Boolean,
            default:false
        },
        name:{
            type:String,
        },
        lastMessage:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message"
        }
    },
    {
        timestamps:true
    }
)

export default mongoose.model("conversation",conversationSchema)