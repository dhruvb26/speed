export type Success<T> = {
  data: T
  error: null
}

export type Failure<E> = {
  data: null
  error: E
}

export type Result<T, E = string> = Success<T> | Failure<E>

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
