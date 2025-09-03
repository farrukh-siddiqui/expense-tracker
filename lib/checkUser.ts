import { currentUser } from '@clerk/nextjs/server';
import { db } from './db';

export async function checkUser() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    const loggedInUser = await db.user.findFirst({
        where: {
            clerkUserId: user.id
        }
    }); 

    if (loggedInUser) {
        return loggedInUser;
    }

    // Create new user if not found
    const newUser = await db.user.create({
        data: {
            clerkUserId: user.id,
            name: user.firstName || 'no name',
            imageUrl: user.imageUrl,
            email: user.emailAddresses[0]?.emailAddress || 'no email',
        }
    });

    return newUser;
}