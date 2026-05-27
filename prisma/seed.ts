import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  const username = process.env.SEED_USERNAME ?? 'admin';

  if (!email || !password) {
    throw new Error('SEED_EMAIL and SEED_PASSWORD must be set in .env before seeding');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, username, passwordHash },
    update: { passwordHash },
  });

  console.log(`Owner user ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
