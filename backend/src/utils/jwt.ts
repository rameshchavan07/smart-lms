import jwt from "jsonwebtoken";

const JWT_SECRET =
process.env.JWT_SECRET || "smart_lms_secret";

export interface JwtPayload {
userId: string;
role: string;
}

export const generateToken = (
userId: string,
role: string
): string => {
return jwt.sign(
{
userId,
role,
},
JWT_SECRET,
{
expiresIn: "7d",
}
);
};

export const verifyToken = (
token: string
): JwtPayload => {
return jwt.verify(
token,
JWT_SECRET
) as JwtPayload;
};
