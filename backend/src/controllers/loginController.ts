import bcrypt from "bcrypt"

const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

async function comparePassword(hash: string, password: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
