import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { GraphQLGenderEnum } from "./user.types.gql";


export const allUsers = {
    gender: { type: GraphQLGenderEnum }
}


export const search = {
    email: {
        type: new GraphQLNonNull(GraphQLString),
        describtion: "this email used to find unique account"
    }
}

export const addFollowers = {
    friendId: { type: new GraphQLNonNull(GraphQLInt) },
    myId: { type: new GraphQLNonNull(GraphQLInt) },
}