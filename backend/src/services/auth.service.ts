import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { generateToken } from "../utils/jwt";

const prisma = new PrismaClient();

export const registerUser = async (
firstName: string,
lastName: string,
email: string,
password: string,
role: UserRole
) => {
const existingUser = await prisma.user.findUnique({
where: {
email,
},
});

if (existingUser) {
throw new Error("Email already exists");
}

const passwordHash = await bcrypt.hash(
password,
10
);

const user = await prisma.user.create({
data: {
firstName,
lastName,
email,
passwordHash,
role,
},
});

const token = generateToken(
user.id,
user.role
);

return {
user,
token,
};
};

export const loginUser = async (
email: string,
password: string
) => {
const user = await prisma.user.findUnique({
where: {
email,
},
});

if (!user) {
throw new Error("Invalid email or password");
}

const isPasswordValid =
await bcrypt.compare(
password,
user.passwordHash
);

if (!isPasswordValid) {
throw new Error("Invalid email or password");
}

const token = generateToken(
user.id,
user.role
);

return {
user,
token,
};
};
