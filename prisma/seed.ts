import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@portfolio.com';

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('Admin already exists');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin12345', 10);

  await prisma.user.create({
    data: {
      email,
      username: 'admin',
      passwordHash,
    },
  });

  console.log('Admin user created');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
