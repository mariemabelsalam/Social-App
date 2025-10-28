import { GraphQLNonNull, GraphQLString } from 'graphql';
import * as gqlArgs from './user.args.gql';
import { UserResolver } from './user.resolver';
import * as gqlTypes from './user.types.gql';


class UserGQLSchema {
    private userResolver: UserResolver = new UserResolver()
    constructor() { }

    reqisterQuery = () => {
        return {
            sayHi: {
                type: gqlTypes.welcome,
                args: { name: { type: new GraphQLNonNull(GraphQLString) } },
                description: "this field returns our server welcome message",
                resolve: this.userResolver.welcome
            },

            allUsers: {
                type: gqlTypes.allUsers,
                args: gqlArgs.allUsers,
                resolve: this.userResolver.allUsers
            },

            searchUser: {
                type: gqlTypes.search,
                args: gqlArgs.search,
                resolve: this.userResolver.search
            }
        }

    }

    RegisterMutation = () => {
        return {
            addFollowers: {
                type: gqlTypes.addFollowers,
                args: gqlArgs.addFollowers,
                resolve: this.userResolver.addFollowers
            }
        }
    }
}

export default new UserGQLSchema()