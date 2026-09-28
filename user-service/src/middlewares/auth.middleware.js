import {verifyAccessToken} from "../utils/auth.js";
import { UnauthorizedError } from "../utils/error.js";

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("Authorization token missing"));
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(accessToken);
        req.user = {
            id: payload.id
        };
        next();
    } catch (err) {
        return next(new UnauthorizedError("Invalid or expired access token"));
    }
}

export {requireAuth};