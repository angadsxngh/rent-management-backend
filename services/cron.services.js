import { PrismaClient } from "@prisma/client";
import cron from 'node-cron'

const prisma = new PrismaClient();

async function updateMonthlyBalances(){
    const today = new Date();

    const properties = await prisma.property.findMany({
        where:{
            isRented: true,
            assignedAt: {not: null}
        }
    })

    for (const property of properties){
        const {assignedAt, balance, rentAmount, id, updatedAt} = property;

        const monthsSinceAssignment = 
            (today.getFullYear() - assignedAt.getFullYear())*12 +
            (today.getMonth() - assignedAt.getMonth())
        
        const monthsSinceLastUpdate = 
            (today.getFullYear() - updatedAt.getFullYear()) * 12 +
            (today.getMonth() - updatedAt.getMonth())

        if(monthsSinceAssignment >= 1 && monthsSinceLastUpdate >= 1){
            await prisma.property.update({
                where: { id },
                data:{
                    balance: balance + rentAmount
                }
            });
            console.log(`Updated property ${id}: +$${rentAmount} rent added`)
        }
    }
    console.log("rent balance updated")
}

async function deleteRequests(){
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate()-3)

    await prisma.request.deleteMany({
        where:{
            createdAt:{
                lt: threeDaysAgo,
            }
        }
    });

    await prisma.paymentRequest.deleteMany({
        where:{
            createdAt:{
                lt: threeDaysAgo
            }
        }
    });
    console.log(`Deleted requests`);
}

updateMonthlyBalances()
    .catch(console.error)

export function startCron(){
    updateMonthlyBalances().catch(console.error);
    deleteRequests().catch(console.error);

  cron.schedule('0 0 * * *', () => updateMonthlyBalances());
  cron.schedule('* * * * *', () => deleteRequests())
}
