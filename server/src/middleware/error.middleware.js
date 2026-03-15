export const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({ 
        sucess:false,
        message: err.message || 'Internal Server Error'
    })
    // implement next error handling if needed
    next(err);
}