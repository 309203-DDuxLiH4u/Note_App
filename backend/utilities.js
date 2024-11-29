const jwt = require ('jsonwebtoken')

function authenicateToken(req,res,next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log("Received token:", token);

    if(!token) {
        console.log("No token provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.sendStatus(401);
        }
        console.log("Decoded token:", decoded);
        console.log("User from decoded token:", decoded.user);
        console.log("User ID from token:", decoded.user._id);
        req.user = decoded;
        next();
    });
}

module.exports = {
    authenicateToken,
}