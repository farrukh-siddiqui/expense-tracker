import { PrismaClient } from "../app/generated/prisma";

// Prevent multiple instances of Prisma Client in development
// https://pris.ly/d/help/next-js-best-practices

declare global {
    var prisma:PrismaClient | undefined;

}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production')
    {
        global.prisma = db;
    }   