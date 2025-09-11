"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comapareHash = exports.generateHash = void 0;
const bcrypt_1 = require("bcrypt");
const generateHash = async (plainText, saltRound = Number(process.env.SALT)) => {
    return await (0, bcrypt_1.hash)(plainText, saltRound);
};
exports.generateHash = generateHash;
const comapareHash = async (plainText, hash) => {
    return await (0, bcrypt_1.compare)(plainText, hash);
};
exports.comapareHash = comapareHash;
