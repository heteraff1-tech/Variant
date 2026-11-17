const { HTTP_STATUS} = require('./httpStatus')

class ApiResponse {
    constructor(statusCode, message, data = null, meta = null) {
       this.success = statusCode < 400;
       this.statusCode = statusCode;
       this.message = message;
       this.data = data;
       this.meta = meta;
       this.timestamp = new Date().toISOString();
    }

    send(res) {
        const response = {
            success: this.success,
            message: this.message,
            ...(this.data && {data: this.data}),
            ...(this.meta && {meta: this.meta}),
            timestamp: this.timestamp
        }

        return res.status(this.statusCode).json(response)
    }

    //статические методы
    static ok(res, message = 'Успешно', data=null, meta=null) {
        return new ApiResponse(HTTP_STATUS.OK, message, data).send(res)
    }
    static created(res, message = 'Создано', data = null) {
        return new ApiResponse(HTTP_STATUS.CREATED, message, data).send(res);
    }
  
    static noContent(res) {
        return res.status(HTTP_STATUS.NO_CONTENT).send();
    }

    //С пагинацией
    static paginated(res, data, paginated) {
        const meta = {
            page: paginated.page,
            limit: paginated.limit,
            total: paginated.total,
            totalPages: Math.ceil(paginated.total / paginated.limit),
        }
        return new ApiResponse(HTTP_STATUS.OK, 'Успешно', data, meta).send(res)
    }
}
module.exports = ApiResponse