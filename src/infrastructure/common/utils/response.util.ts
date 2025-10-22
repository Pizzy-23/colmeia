export class ResponseUtil {
  static success<T>(data: T, message: string = 'Operação realizada com sucesso.', statusCode: number = 200) {
    return {
      statusCode,
      message,
      data,
    };
  }

  static error(message: string = 'Ocorreu um erro.', statusCode: number = 500) {
    return {
      statusCode,
      message,
      error: true,
    };
  }
}
