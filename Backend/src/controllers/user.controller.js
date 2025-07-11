import User from "../models/User.model.js";
import FriendRequest from "../models/FriendRequest.model.js";

export const getRecommendedUsers = async(req, res)=>{
    try {
        const currentUserId = req.user.id;
        const currentUser = req.user

        const recommendedUsers = await User.find({
            $and: [
                {_id: {$ne: currentUserId}}, //exclude current user
                {_id: {$nin: currentUser.friends}},  //exclude current user's friends
                {isOnboarded: true}
            ]
        })
        res.status(200).json({recommendedUsers})
    } catch (error) {
        console.log("error in getRecommendedUsers controller", error.message);
        res.status(500).json({message: "Internal server error in getRecommendedusers"})
    }
}

export const getMyFriends = async(req, res)=>{
  try {
    const user = await User.findById(req.user.id)
    .select("friends")
    .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends)
  } catch (error) {
        console.log("error in getMyFriends controller", error.message);
        res.status(500).json({message: "Internal server error in getMyFriends"})
  }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user.id
        const {id: recipientId} = req.params

        //prevent sending urself friend request
        if(myId == recipientId) {
            return res.status(400).json({message:"You can't send friend request to yourself"});
        }

        const recipient = await User.findById(recipientId)
        if(!recipient) {
            return res.status(404).json({message: "Recipient not found"})
        }

        //check if user is already friends
        if(recipient.friends.includes(myId)) {
            return res.status(400).json({message: "You are already friend with the user"})
        }

        //check if a request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                {sender: myId , recipient: recipientId},
                {sender: recipientId, recipient: myId}
            ]
        })

        if(existingRequest) {
            return res.status(400).json({message: "A Friend request already exists between you and this user"})
        }

        //create friend request

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        });

        res.status(201).json(friendRequest)
    } 
    catch (error) {
        console.error("Error in sendFriendRequest controller", error.message);
        res.status(500).json({message: "Internal Server Error"})
    }
}

export const acceptFriendRequest = async (req, res)=>{
    try {
        const {id: requestId} = req.params;
    
        const friendRequest = await FriendRequest.findById(requestId);
    
        if(!friendRequest) {
            return res.status(404).json({message: "friend request not found"})
        }

        // verify current user is the recipient
        if(friendRequest.recipient.toString() !== req.user.id){
            return res.status(403).json({message:"You are not authorized to accept this request"})
        }

        friendRequest.status = "accepted";
        await friendRequest.save();
        
        //Add each user to the other's friend array
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: {friends : friendRequest.recipient}, // addToSet is a method that add the element only if they do not exist
        })

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: {friends : friendRequest.sender}, 
        })

        res.status(200).json({message: "Friend request accepted"})
    } catch (error) {
        console.log("error in acceptFriendRequest controller", error.message);
        res.status(500).json({message: "Internal server error in acceptFriendRequest"})
    }

}

export const getFriendRequests = async (req, res)=>{
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status:"pending",
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient", "fullName profilePic")

        res.status(200).json({incomingReqs, acceptedReqs})

    } catch (error) {
        console.log("error in getFriendRequest controller", error.message);
        res.status(500).json({message: "Internal server error in getFriendRequest"})
    }
}

export const getOutgoingFriendRequests = async (req, res)=>{
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage")

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.log("error in outgoingRequest controller", error.message);
        res.status(500).json({message: "Internal server error in outgoingRequest"})
    }
}