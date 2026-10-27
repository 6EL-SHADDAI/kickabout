const jwt = require("jsonwebtoken"); 

function requireAuth(req, res, next) { 
    const header = req.headers.authorization || ""; 
    const [scheme, token] = header.split(" "); 

    if (scheme !== "Bearer" || !token) {
        return res 
        .status(401)
        .json({ error: {message: "Authentication required"}}); 
    }
    


try { 
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub}; 
    next(); 
 } catch (err) {  
    return res 
    .status(401)
    .json({ error: {message: "Invalid or expired token"}}); 
 }

}
module.exports = requireAuth;