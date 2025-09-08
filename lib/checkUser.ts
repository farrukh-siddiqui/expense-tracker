import { currentUser } from '@clerk/nextjs/server';
import { db } from './db';

export async function checkUser() {
    const user = await currentUser();

    if (!user) {
        return null;
    }

    try {
        // Use upsert to handle both finding existing user and creating new one
        const dbUser = await db.user.upsert({
            where: {
                clerkUserId: user.id
            },
            update: {
                // Update existing user data if needed
                name: `${user.firstName} ${user.lastName}`,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0]?.emailAddress,
            },
            create: {
                clerkUserId: user.id,
                name: `${user.firstName} ${user.lastName}`,
                imageUrl: user.imageUrl,
                email: user.emailAddresses[0]?.emailAddress,
            }
        });

        return dbUser;
    } catch (error) {
        console.error('Error in checkUser:', error);
        
        // If there's still a unique constraint error, try to find the existing user
        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { clerkUserId: user.id },
                    { email: user.emailAddresses[0]?.emailAddress }
                ]
            }
        });
        
        return existingUser;
    }
}  