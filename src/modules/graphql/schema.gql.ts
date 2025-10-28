import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { UserGQLSchema } from "../user";


const query = new GraphQLObjectType({
    name: "RootSchemaQuery",
    description: "optional text",
    fields: {
        ...UserGQLSchema.reqisterQuery()
    }
})


const mutation = new GraphQLObjectType({
    name: "RootSchemaMotation",
    description: "hold all RootSchemaMotation feilds",
    fields: {
        ...UserGQLSchema.RegisterMutation()
    }
})


export const schema = new GraphQLSchema({ query, mutation });
