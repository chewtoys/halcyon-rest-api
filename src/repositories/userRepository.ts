import User, { IUser, IUserModel } from '../models/user';

export const getUserById = (id: string) => User.findById(id);

export const getUserByEmailAddress = (emailAddress: string) =>
    User.findOne({
        emailAddress
    });

export const getUserByRefreshToken = async (refreshToken: string) =>
    User.findOne({
        'refreshTokens.token': refreshToken
    });

export const getUserByLogin = async (provider: string, externalId: string) =>
    User.findOne({
        'logins.provider': provider,
        'logins.externalId': externalId
    });

export const createUser = async (user: IUser) => new User(user).save();

export const updateUser = async (user: IUserModel) => user.save();

export const removeUser = async (user: IUserModel) => user.remove();

export const searchUsers = async (
    page: number,
    size: number,
    search: string,
    sort: string
) => {
    const searchExpression = getSearchExpression(search);
    const sortExpression = getSortExpression(sort);

    const totalCount = await User.find(searchExpression).countDocuments();

    const users = await User.find(searchExpression)
        .sort(sortExpression)
        .limit(size)
        .skip(size * (page - 1))
        .exec();

    const totalPages = Math.ceil(totalCount / size);

    return {
        items: users,
        page,
        size,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
};

const getSearchExpression = (search: string) => {
    if (!search) {
        return undefined;
    }

    // return { emailAddress: { $regex: `.*${search}.*`, $options: 'i' } };
    return { $text: { $search: search } };
};

const getSortExpression = (sort: string) => {
    const sortExpression = [];

    switch (sort) {
        case 'email_address':
            sortExpression.push(['emailAddress', 'ascending']);
            break;

        case 'email_address_desc':
            sortExpression.push(['emailAddress', 'descending']);
            break;

        case 'display_name_desc':
            sortExpression.push(['firstName', 'descending']);
            sortExpression.push(['lastName', 'descending']);
            break;

        default:
            sortExpression.push(['firstName', 'ascending']);
            sortExpression.push(['lastName', 'ascending']);
            break;
    }

    return sortExpression;
};
