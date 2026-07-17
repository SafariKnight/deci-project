import "../src/config/env.ts";
import { postgres } from '../src/config/postgres.ts';
import { hashPassword } from '../src/services/passwordService.ts';

async function main() {
  const kareem = await postgres.user.upsert({
    where: { email: "foo@bar.com" },
    update: {
      username: "Kareem",
      email: "foo@bar.com",
      role: "OWNER",
      password: await hashPassword("ownerpassword"),
    },
    create: {
      username: "Kareem",
      email: "foo@bar.com",
      role: "OWNER",
      password: await hashPassword("ownerpassword"),
    },
  });
  const ahmed = await postgres.user.upsert({
    where: { email: "foo@baz.com" },
    update: {
      username: "Ahmed",
      email: "foo@baz.com",
      role: "ADMIN",
      password: await hashPassword("adminpassword"),
    },
    create: {
      username: "Ahmed",
      email: "foo@baz.com",
      role: "ADMIN",
      password: await hashPassword("adminpassword"),
    },
  });
  console.log({ kareem, ahmed });
}
main()
  .then(async () => {
    await postgres.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await postgres.$disconnect();
    process.exit(1);
  });
