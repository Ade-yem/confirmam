export function mockDelay<T>(data: T): Promise<T> {
  const delay = Math.random() * (900 - 400) + 400
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}
