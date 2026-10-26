// Takes a zod schema and returns an Express  middleware that validates req.body
function validate(schema) {
    return (req, res, next) => { 
        const result = schema.safeParse(req.body ?? {}); 

        if(!result.success) { 
            const fields = {}; 
            for (const issue of result.error.issues) { 
                const key = issue.path[0]; 
                if (!fields[key]) fields[key] = issue.message; 
            }
            return res.status(400).json({
                error: { message: "Validation failed",  fields},
        });
    }

    req.body = result.data; //cleaned data like trimming the whitespace and lowercasing the email
    next();
};
}

module.exports = validate; 

