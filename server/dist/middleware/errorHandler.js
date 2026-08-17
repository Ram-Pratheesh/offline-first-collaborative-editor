export const errorHandler = (err, _req, res, _next) => {
    console.error('❌ Error:', err.message);
    if (err.name === 'ValidationError') {
        res.status(400).json({ message: 'Validation error', errors: err.message });
        return;
    }
    if (err.name === 'CastError') {
        res.status(400).json({ message: 'Invalid ID format' });
        return;
    }
    if (err.code === 11000) {
        res.status(409).json({ message: 'Duplicate entry' });
        return;
    }
    res.status(500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
};
//# sourceMappingURL=errorHandler.js.map