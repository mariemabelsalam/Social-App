import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderEnum } from "../../DB/models";
import { GraphQLUniformResponse } from "../graphql";

export const GraphQLGenderEnum = new GraphQLEnumType({
    name: "GraphQLGenderEnum",
    values: {
        male: { value: GenderEnum.male },
        female: { value: GenderEnum.female }
    },
})

export const GraphQLOneUserResponse = new GraphQLObjectType({
    name: "OneUserResponse",
    fields: {
        id: { type: GraphQLID },
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: "userName"
        },
        email: { type: GraphQLString },
        gender: { type: GraphQLGenderEnum },
        followers: { type: new GraphQLList(GraphQLID) },
    }
})

export const welcome = new GraphQLNonNull(GraphQLString)
export const allUsers = new GraphQLList(GraphQLOneUserResponse)
export const addFollowers =new GraphQLList(GraphQLOneUserResponse)
export const search = GraphQLUniformResponse({
    name: "searchUser",
    data: new GraphQLNonNull(GraphQLOneUserResponse)
})