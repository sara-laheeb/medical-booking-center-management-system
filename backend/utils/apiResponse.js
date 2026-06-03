// Send a standardized success JSON response
const sendSuccess = (res, statusCode, message, data = undefined) => {
    const body = { success: true, message };

    if (data !== undefined) {
        body.data = data;
    }

    return res.status(statusCode).json(body);
};

// Send a standardized error JSON response
const sendError = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data
    });
};

module.exports = {
    sendSuccess,
    sendError
};
