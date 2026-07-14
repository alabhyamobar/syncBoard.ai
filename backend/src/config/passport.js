import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20"
import userModel from "../module/user/user.model.js";
import config from "./config.js";
import mongoose from "mongoose";

passport.use(
    new GoogleStrategy(
        {
            clientID:config.GOOGLE_ID,
            clientSecret:config.GOOGLE_SECRET,
            callbackURL:config.GOOGLE_CALLBACK_URL
        },

        async(accessToken , refreshToken , profile ,done)=>{
            try{
                const email = profile.emails[0].value;
                let user = await userModel.findOne({email})

                if(!user){
                    user = await userModel.create({
                        username:profile.displayName,
                        email,
                        googleId:profile.id,
                        avatar:profile.photos?.[0]?.value,
                        isEmailVerified:true,
                    });

                    // Link any pending email-only invites to this new user account
                    await mongoose.models.WorkspaceMember.updateMany(
                        { email: email.toLowerCase(), userId: null },
                        { userId: user._id }
                    );
                }
                else if(!user.googleId){
                    user.googleId = profile.id
                    await user.save();
                }

                done(null,user)
            }catch (err){
                done(err , null)
            }
        }
    )
)